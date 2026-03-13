const express = require('express')
const cors = require('cors')
const { google } = require('googleapis')

const app = express()
const PORT = 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] }))

// ─── Google Sheets config ────────────────────────────────────────────────────
const SPREADSHEET_ID = '1Z6SqqjMyyd46c_qleh8rDMaPW5GIwrP53Sv-3EcLwiE'

const credentials = {
  "type": "service_account",
  "project_id": "united-concord-490106-b6",
  "private_key_id": "0b76c3f5ee3d74e426ff959f64176663a21666cb",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8jepihLaccx4v\nAs19oHyXHa0A7lZNJZqOpKQ/paqLclAWXIzS98EL7qrgBDcqXewkt9ZaYfHxXOjl\nyZuMP70FOFV7vJVgtESykh68pLpv2VP5FOMrNbqKY4IA2MB070oZE+u/Pxh1OkVw\nPPCb/nBDA2/r2Xa0LDxmDD5zKUXpJX4Leq3Y8OWvxpeOJFGlH5Oo2L1p0igOQ3ye\nirfOAafkhajUm9S+IdBT/voXO5ntHz0BWOLcEq1vcAkRYQzwsy3l7qfc9QvTVgYk\na7M7lG0/ss2MDONmSi8AcNwcI0aQBP58K9Yl3sS+6+6pK3imEfCicoa0zmRrlb9k\nBMJMubELAgMBAAECggEAFQXRqzhWz+y54c3zMV2SZprlbiQktSdLKzpKIdqLwE53\nhXa+MMt016q9nIp7yBp+uL1ShfNDsYCFaxFmaWW14n4ccdZd5VFUE4DdMnU/YDcf\n+LaOeYPdD472sLd6Bc+kOFWTRFh5lqBvm4r/3LSquZ4JfYdah84i0dHtqJNiexMF\nC08gJKqc4Q+knDTcbb1T0WQ66WlDPcocjOSs2sUB4Knz74MWCfdV91dJE5DBZ9sk\nW0XjMY6/ua3wPwfWN0aYBq/I4K1iKrYYtpen4Mfnd5r/b/UNFOuMwqdm5FbPZYLi\n8p5tdpF75e0MHUTbt10r21iNzzWiYzlngUVEW1OQQQKBgQDj3hc9KC6a7q46qyun\nZZa6Q65JDfIlmvVkUwcfTFzYIep3mNQAyq+1snxB853R3zohbrtevgSdumpfGrcP\nPg6mhsmfmilDIjPnXBUHxFP8DD0Uac9xebXzLxbGqwZdHhFDWbInxgPbRzybbc2f\n5Lkq5UgbiH7jbOhEmdqTMUvm4QKBgQDT1U4EnXaY9q4mBviArP38go71gpUd/GtW\nTnvuklNDPylF2lAPMXHBjGkqCvUo1ZMeXGhjB2OtPnnOpWpJ9wCf/coP2OlS5ro6\nFe2McdQ18Gv7YuW3XUOhKqZw0mpQMPPR7Lf4Zz/UyFZMzzb+VwUQ+cv1iMCKY57Y\nNEIpM1NRawKBgGr6aY6cvsSeKc4Bbo04dHseK0TA914QUgS3tjBLeYs+4QUlCuMU\nRUnYcd3EseNGGdR4WB8ytpgWXLopoKfXSqmDvkTf619JP3TvFjB/S66ZUFO1GV78\n9R8mjFrZEDPHWfN0uN9TZ5wa5alS86aNiyFIY4IJowjCqIkMckGIc0oBAoGAfYto\nnrGYDVX9pknxU4mzScky4uyOZeQo1VDUgHM2Z59yXZTiZ+685aHK3gD6hUX22EKa\nFz7U42Mom8FLeiSquSeXbsb2mYxnCG/ghqEbzQ/9X1KgpIjgwQ7e7/S0z2wDxQGP\nkufWW8yT4RfaFukJ9qKlL5Lp0dry1F48a+CgW5sCgYEAsgqOS7py91l13Ng071vj\n9IFh3n10WeRWsUT0lYd75LvpaO6ycAN679NptSIJ+XPRVLr5qs/Xk8GXPhWgEPIk\ndM0omm7fgmgqWhupstqQc7PtJJtGJ/chLaNwZ/cVMPXy11ybZSFMEOmeizSZhcyF\nhHAnpF/OjU52Kp6KnDnF7DM=\n-----END PRIVATE KEY-----\n",
  "client_email": "kartik@united-concord-490106-b6.iam.gserviceaccount.com",
  "client_id": "104910673039122858987",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/kartik%40united-concord-490106-b6.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

const COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#db2777',
  '#0891b2', '#d97706', '#6366f1', '#10b981', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#0d9488', '#64748b', '#f43f5e',
]

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

// ─── Main data builder ────────────────────────────────────────────────────────
async function buildDashboardData() {
  // Fetch all three sheets in parallel
  const [allClientsRows, daywiseRows, dailyRows] = await Promise.all([
    fetchSheet('All Clients Data'),
    fetchSheet('Daywise Calls'),
    fetchSheet('Calls vs connected%'),
  ])

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

  daywiseRows.slice(1).forEach(r => {
    const client = String(r[1] || '').trim()
    if (!r[0] || !client || client.toLowerCase().includes('grand')) return
    const date = parseSheetDate(r[0])
    if (!date) return
    const dk = formatDisplayDate(date)
    daywiseClientNames.add(client)
    if (!daywiseMap[dk]) daywiseMap[dk] = { date: dk, _ts: date.getTime() }
    daywiseMap[dk][client] = (daywiseMap[dk][client] || 0) + parseNum(r[2])
  })

  const daywiseData = Object.values(daywiseMap)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest)

  const clientColorMap = {}
  Array.from(daywiseClientNames).forEach((name, i) => {
    clientColorMap[name] = COLORS[i % COLORS.length]
  })

  // ── Client Performance Table ──────────────────────────────────────────────
  const clientTable = clients.map(({ color, ...c }) => c)

  return {
    kpi,
    dailyVolume,
    topClientsByVolume,
    scatterData,
    daywiseData,
    clientColorMap,
    clientTable,
  }
}

// ─── Cache (5 min TTL) ────────────────────────────────────────────────────────
let cache = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

app.get('/api/dashboard', async (req, res) => {
  try {
    const now = Date.now()
    if (!cache || req.query.refresh === '1' || (now - cacheTime) > CACHE_TTL) {
      console.log('Fetching fresh data from Google Sheets...')
      cache = await buildDashboardData()
      cacheTime = now
      console.log('Data fetched and cached.')
    }
    res.json({ success: true, data: cache })
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n✅  Backend API running → http://localhost:${PORT}`)
  console.log(`📊  Dashboard data   → http://localhost:${PORT}/api/dashboard\n`)
})
