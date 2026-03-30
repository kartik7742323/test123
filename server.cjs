require('dotenv').config()
const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const { google } = require('googleapis')

const app = express()
const PORT = 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] }))
app.use(express.json())

// ─── Auth & Encryption config ────────────────────────────────────────────────
const AUTH_SECRET = 'MioAuth!Secret#2024@Meritto'
const ENC_KEY     = Buffer.from('MioAdoption$Analytics#Key2024!XZ') // 32 bytes → AES-256
const USERNAME    = 'product@meritto.com'
const PASSWORD    = '1!2MIC#@!S5G3F>>__!@'

function createToken() {
  const ts  = Date.now().toString(16)
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(ts).digest('hex')
  return `${ts}.${sig}`
}

function verifyToken(token) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [ts, sig] = parts
  try {
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(ts).digest('hex')
    const sigBuf   = Buffer.from(sig, 'hex')
    const expBuf   = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length) return false
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false
    const age = Date.now() - parseInt(ts, 16)
    return age >= 0 && age < 24 * 60 * 60 * 1000
  } catch { return false }
}

function encrypt(obj) {
  const iv     = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv)
  const enc    = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return { iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!verifyToken(token)) return res.status(401).json({ success: false, error: 'Unauthorized' })
  next()
}

// ─── Login endpoint ───────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username !== USERNAME || password !== PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  }
  res.json({ success: true, token: createToken() })
})

// ─── Google Sheets config ────────────────────────────────────────────────────
const SPREADSHEET_ID = '1Z6SqqjMyyd46c_qleh8rDMaPW5GIwrP53Sv-3EcLwiE'

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS)

const COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#db2777',
  '#0891b2', '#d97706', '#6366f1', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#0d9488', '#64748b', '#f43f5e',
]

// Match daywise short names (e.g. "ITM") to full client names (e.g. "ITM Business School")
function normalizeDaywiseName(name, clients) {
  if (!name) return name
  const n = name.toLowerCase().trim()
  const exact = clients.find(c => c.name.toLowerCase() === n)
  if (exact) return exact.name
  const sub = clients.find(c => {
    const fn = c.name.toLowerCase()
    return fn.includes(n) || n.includes(fn)
  })
  return sub ? sub.name : name
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

async function fetchSheet(sheetName) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  })
  return res.data.values || []
}

// Parse numbers like "8,898" or "47.61%" → float
function parseNum(v) {
  if (v === undefined || v === null || v === '') return 0
  return parseFloat(String(v).replace(/,/g, '').replace('%', '')) || 0
}

// Parse M/D/YYYY → Date object
function parseSheetDate(s) {
  if (!s) return null
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]))
  return null
}

// Date → "25 Feb'26"
function formatDisplayDate(d) {
  if (!d || isNaN(d.getTime())) return null
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]}'${String(d.getFullYear()).slice(2)}`
}

// Minutes (decimal) → "0m 23s"
function formatDuration(minutes) {
  if (minutes === undefined || minutes === null || minutes === '') return '-'
  const totalSec = Math.round(parseFloat(minutes) * 60)
  if (isNaN(totalSec)) return '-'
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

function truncate(str, n) {
  const s = String(str || '')
  return s.length > n ? s.slice(0, n) + '...' : s
}

// ─── Tracker data builder ─────────────────────────────────────────────────────
function trackerKpi(clients, liveStatuses, churnStatuses, holdStatuses) {
  const total      = clients.length
  const live       = clients.filter(c => liveStatuses.includes(c.status)).length
  const churned    = clients.filter(c => churnStatuses.includes(c.status)).length
  const onHold     = clients.filter(c => holdStatuses.includes(c.status)).length
  const inProgress = total - live - churned - onHold
  return { total, live, inProgress, onHold, churned }
}

function buildTrackerData(voiceRows, guideRows) {
  const voiceClients = voiceRows.slice(1)
    .filter(r => r[0] && String(r[0]).trim())
    .map(r => ({
      name:           String(r[0] || '').trim(),
      setupType:      String(r[1] || '').trim(),
      agentType:      String(r[2] || '').trim(),
      onboardingDate: String(r[3] || '').trim(),
      owner:          String(r[8] || '').trim(),
      ageing:         r[9] ? parseInt(r[9]) || null : null,
      status:         String(r[10] || '').trim(),
      liveDate:       String(r[17] || '').trim(),
    }))
    .filter(c => c.status)

  const voiceByStatus = Object.entries(
    voiceClients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {})
  ).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count)

  const voiceKpi = trackerKpi(voiceClients, ['H. Live'], ['L. Churn'], ['K. On-Hold'])

  const guideClients = guideRows.slice(1)
    .filter(r => r[0] && String(r[0]).trim())
    .map(r => ({
      name:           String(r[0] || '').trim(),
      onboardingDate: String(r[2] || '').trim(),
      ageing:         r[6] ? parseInt(r[6]) || null : null,
      status:         String(r[7] || '').trim(),
      liveDate:       String(r[8] || '').trim(),
      tat:            r[9] ? parseInt(r[9]) || null : null,
      owner:          String(r[13] || '').trim(),
    }))
    .filter(c => c.status)

  const guideByStatus = Object.entries(
    guideClients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {})
  ).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count)

  const guideKpi = trackerKpi(guideClients, ['G. Live'], ['K. Churn'], ['I. On-hold'])

  return {
    voice: { kpi: voiceKpi, byStatus: voiceByStatus, clients: voiceClients },
    guide: { kpi: guideKpi, byStatus: guideByStatus, clients: guideClients },
  }
}

// ─── Guide data builder ───────────────────────────────────────────────────────
async function buildGuideData(allClientsRows, daywiseRows) {
  // ── All Clients Data ───────────────────────────────────────────────────────
  // Cols: Institute | Status | Number of Conversations | Avg Messages per Conv | Users Interacted
  const clientRows = allClientsRows
    .slice(1)
    .filter(r => r[0] && String(r[0]).trim())

  const clients = clientRows.map((r, i) => {
    const conversations   = parseNum(r[2])
    const avgMessages     = parseNum(r[3])
    const usersInteracted = parseNum(r[4])
    const convsPerUser    = usersInteracted > 0 ? Math.round(conversations / usersInteracted * 100) / 100 : 0
    const msgsPerUser     = usersInteracted > 0 ? Math.round(avgMessages * conversations / usersInteracted * 10) / 10 : 0
    return {
      id: i + 1,
      name:            String(r[0] || '').trim(),
      status:          String(r[1] || '').trim(),
      conversations,
      avgMessages,
      usersInteracted,
      convsPerUser,
      msgsPerUser,
      color:           COLORS[i % COLORS.length],
    }
  })

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalConversations = clients.reduce((s, c) => s + c.conversations, 0)
  const totalUsers         = clients.reduce((s, c) => s + c.usersInteracted, 0)
  const avgMessages        = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.avgMessages, 0) / clients.length * 10) / 10 : 0
  const activeClients      = clients.filter(c => c.status.toLowerCase().includes('live')).length
  const avgConvsPerUser    = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.convsPerUser, 0) / clients.length * 100) / 100 : 0
  const avgMsgsPerUser     = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.msgsPerUser, 0) / clients.length * 10) / 10 : 0

  // ── Top 10 by conversations ───────────────────────────────────────────────
  const topByConversations = [...clients]
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 10)
    .map(c => ({ name: c.name, conversations: c.conversations, usersInteracted: c.usersInteracted }))

  // ── Scatter: Convs per User vs Avg Messages ───────────────────────────────
  const scatterData = clients.map(c => ({
    institute:    c.name,
    convsPerUser: c.convsPerUser,
    avgMessages:  c.avgMessages,
    color:        c.color,
  }))

  // ── Daywise Interactions ───────────────────────────────────────────────────
  // Actual layout: Col A = cumulative convs, Col B = cumulative users,
  //                Col C = daily convs, Col D = daily users, Col E = date
  const dailyData = daywiseRows
    .slice(1)
    .map(r => {
      if (!r[4]) return null
      const dateStr = String(r[4]).trim()
      const d = parseSheetDate(dateStr)
      if (!d) return null
      const displayDate = formatDisplayDate(d)
      return {
        date:            displayDate,
        conversations:   parseNum(r[2]),
        usersInteracted: parseNum(r[3]),
        _ts:             d.getTime(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest)

  return {
    kpi: { totalConversations, totalUsers, avgMessages, activeClients, avgConvsPerUser, avgMsgsPerUser },
    clientTable: clients.map(({ color, ...c }) => c),
    topByConversations,
    scatterData,
    dailyData,
  }
}

// ─── Main data builder ────────────────────────────────────────────────────────
async function buildDashboardData() {
  // Fetch Voice sheets + Guide sheets (guide failures are non-fatal)
  const [allClientsRows, daywiseRows, dailyRows] = await Promise.all([
    fetchSheet('All Clients Data'),
    fetchSheet('Daywise Calls'),
    fetchSheet('Calls vs connected%'),
  ])

  let guideAllRows = [], guideDaywiseRows = []
  try {
    ;[guideAllRows, guideDaywiseRows] = await Promise.all([
      fetchSheet('Guide - All Client Data'),
      fetchSheet('Guide - Daywise Interactions'),
    ])
  } catch (e) {
    console.warn('Guide sheets not found or error:', e.message)
  }

  // ── All Clients Data ───────────────────────────────────────────────────────
  // Cols: Client Name | Client ID | Live Date | Use Case | Total Calls Dialed |
  //       Calls Connected | Connected % | Avg Call Duration (min) |
  //       Number of Lead Qualified | Qualified %
  const clientRows = allClientsRows
    .slice(1)
    .filter(r => r[0] && String(r[0]).trim() && !String(r[0]).toLowerCase().includes('grand'))

  const clients = clientRows.map((r, i) => ({
    id:             i + 1,
    name:           String(r[0] || '').trim(),
    liveDate:       String(r[2] || '').trim(),
    useCase:        String(r[3] || 'Lead Qualification Agent').trim(),
    totalCalls:     parseNum(r[4]),
    connected:      parseNum(r[5]),
    connRate:       parseNum(r[6]),
    avgDurationMin: parseFloat(r[7]) || 0,
    avgDuration:    formatDuration(r[7]),
    qualified:      parseNum(r[8]),
    qualRate:       parseNum(r[9]),
    color:          COLORS[i % COLORS.length],
  }))

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalCallsDialed = clients.reduce((s, c) => s + c.totalCalls, 0)
  const totalConnected   = clients.reduce((s, c) => s + c.connected,  0)
  const leadsQualified   = clients.reduce((s, c) => s + c.qualified,  0)
  const overallConnRate  = totalCallsDialed > 0
    ? Math.round(totalConnected / totalCallsDialed * 1000) / 10 : 0
  const avgQualRate      = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.qualRate, 0) / clients.length * 10) / 10 : 0

  // Simple average of per-client avg call durations
  const avgCallDuration = clients.length > 0
    ? formatDuration(clients.reduce((s, c) => s + c.avgDurationMin, 0) / clients.length)
    : '-'

  const now = new Date()
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const h = now.getHours(), mm = now.getMinutes()
  const lastRefresh = `${h % 12 || 12}:${String(mm).padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'} on ${MON[now.getMonth()]} ${now.getDate()}`

  const kpi = { totalCallsDialed, totalConnected, overallConnRate, leadsQualified, avgQualRate, avgCallDuration, lastRefresh }

  // ── Daily Call Volume ("Calls vs connected%") ──────────────────────────────
  // Cols: Date | Total Calls | Connected Calls | Connected %
  const dailyVolume = dailyRows
    .slice(1)
    .map(r => {
      const date = parseSheetDate(r[0])
      if (!date) return null
      return {
        date:           formatDisplayDate(date),
        totalCalls:     parseNum(r[1]),
        connectedCalls: parseNum(r[2]),
        connRate:       parseNum(r[3]),
        _ts:            date.getTime(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest)

  // ── Top 10 Clients — merged chart (calls + connected + connRate, full names) ─
  const topClientsByVolume = [...clients]
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 10)
    .map(c => ({
      name:      c.name,
      calls:     c.totalCalls,
      connected: c.connected,
      connRate:  c.connRate,
    }))

  // ── Scatter: Lead Qual vs Connection Rate ─────────────────────────────────
  const scatterData = clients.map(c => ({
    client:   c.name,
    connRate: c.connRate,
    qualRate: c.qualRate,
    color:    c.color,
  }))

  // ── Daywise Stacked Data ("Daywise Calls") ─────────────────────────────────
  // Cols: Date | Client | Total Calls Dialed | Calls Connected | Connected % | Avg. Call Duration
  const daywiseClientNames = new Set()
  const daywiseMap = {}
  const daywiseByClientMap = {}

  daywiseRows.slice(1).forEach(r => {
    const rawClient = String(r[1] || '').trim()
    if (!r[0] || !rawClient || rawClient.toLowerCase().includes('grand')) return
    const date = parseSheetDate(r[0])
    if (!date) return
    const client = normalizeDaywiseName(rawClient, clients)
    const dk = formatDisplayDate(date)
    daywiseClientNames.add(client)
    if (!daywiseMap[dk]) daywiseMap[dk] = { date: dk, _ts: date.getTime() }
    daywiseMap[dk][client] = (daywiseMap[dk][client] || 0) + parseNum(r[2])
    if (!daywiseByClientMap[dk]) daywiseByClientMap[dk] = {}
    if (!daywiseByClientMap[dk][client]) daywiseByClientMap[dk][client] = { calls: 0, connected: 0, durationSum: 0 }
    daywiseByClientMap[dk][client].calls       += parseNum(r[2])
    daywiseByClientMap[dk][client].connected   += parseNum(r[3])
    daywiseByClientMap[dk][client].durationSum += (parseFloat(r[5]) || 0) * parseNum(r[2])
  })

  const daywiseData = Object.values(daywiseMap)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest)

  const clientColorMap = {}
  Array.from(daywiseClientNames).forEach((name, i) => {
    clientColorMap[name] = COLORS[i % COLORS.length]
  })

  const daywiseByClient = daywiseByClientMap

  // ── Client Performance Table ──────────────────────────────────────────────
  const clientTable = clients.map(({ color, ...c }) => c)

  const guide = await buildGuideData(guideAllRows, guideDaywiseRows)

  let tracker = null
  try {
    const [voiceTrackerRows, guideTrackerRows] = await Promise.all([
      fetchSheet('Voice Tracker'),
      fetchSheet('Guide Tracker'),
    ])
    tracker = buildTrackerData(voiceTrackerRows, guideTrackerRows)
  } catch (e) {
    console.warn('Tracker sheets not found:', e.message)
  }

  return {
    kpi,
    dailyVolume,
    topClientsByVolume,
    scatterData,
    daywiseData,
    daywiseByClient,
    clientColorMap,
    clientTable,
    guide,
    tracker,
  }
}

// ─── Cache (5 min TTL) ────────────────────────────────────────────────────────
let cache = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const now = Date.now()
    if (!cache || req.query.refresh === '1' || (now - cacheTime) > CACHE_TTL) {
      console.log('Fetching fresh data from Google Sheets...')
      cache = await buildDashboardData()
      cacheTime = now
      console.log('Data fetched and cached.')
    }
    res.json({ success: true, data: encrypt(cache) })
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n✅  Backend API running → http://localhost:${PORT}`)
  console.log(`📊  Dashboard data   → http://localhost:${PORT}/api/dashboard\n`)
})
