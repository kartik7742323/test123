import { google } from 'googleapis'
import crypto from 'crypto'

const AUTH_SECRET = 'MioAuth!Secret#2024@Meritto'
const ENC_KEY     = Buffer.from('MioAdoption$Analytics#Key2024!XZ') // 32 bytes → AES-256

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

const SPREADSHEET_ID = '1Z6SqqjMyyd46c_qleh8rDMaPW5GIwrP53Sv-3EcLwiE'
const COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#db2777',
  '#0891b2', '#d97706', '#6366f1', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#0d9488', '#64748b', '#f43f5e',
]

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

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS)
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

function parseNum(v) {
  if (v === undefined || v === null || v === '') return 0
  return parseFloat(String(v).replace(/,/g, '').replace('%', '')) || 0
}

function parseSheetDate(s) {
  if (!s) return null
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]))
  return null
}

function formatDisplayDate(d) {
  if (!d || isNaN(d.getTime())) return null
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]}'${String(d.getFullYear()).slice(2)}`
}

function formatDuration(minutes) {
  if (minutes === undefined || minutes === null || minutes === '') return '-'
  const totalSec = Math.round(parseFloat(minutes) * 60)
  if (isNaN(totalSec)) return '-'
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

async function buildDashboardData() {
  const [allClientsRows, daywiseRows, dailyRows] = await Promise.all([
    fetchSheet('All Clients Data'),
    fetchSheet('Daywise Calls'),
    fetchSheet('Calls vs connected%'),
  ])

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

  const totalCallsDialed = clients.reduce((s, c) => s + c.totalCalls, 0)
  const totalConnected   = clients.reduce((s, c) => s + c.connected,  0)
  const leadsQualified   = clients.reduce((s, c) => s + c.qualified,  0)
  const overallConnRate  = totalCallsDialed > 0
    ? Math.round(totalConnected / totalCallsDialed * 1000) / 10 : 0
  const avgQualRate      = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.qualRate, 0) / clients.length * 10) / 10 : 0
  const avgCallDuration  = clients.length > 0
    ? formatDuration(clients.reduce((s, c) => s + c.avgDurationMin, 0) / clients.length)
    : '-'

  const now = new Date()
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const h = now.getHours(), mm = now.getMinutes()
  const lastRefresh = `${h % 12 || 12}:${String(mm).padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'} on ${MON[now.getMonth()]} ${now.getDate()}`

  const kpi = { totalCallsDialed, totalConnected, overallConnRate, leadsQualified, avgQualRate, avgCallDuration, lastRefresh }

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

  const topClientsByVolume = [...clients]
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 10)
    .map(c => ({ name: c.name, calls: c.totalCalls, connected: c.connected, connRate: c.connRate }))

  const scatterData = clients.map(c => ({
    client: c.name, connRate: c.connRate, qualRate: c.qualRate, color: c.color,
  }))

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

  const clientTable = clients.map(({ color, ...c }) => c)

  return { kpi, dailyVolume, topClientsByVolume, scatterData, daywiseData, daywiseByClient: daywiseByClientMap, clientColorMap, clientTable }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')

  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!verifyToken(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    const data = await buildDashboardData()
    res.json({ success: true, data: encrypt(data) })
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
}
