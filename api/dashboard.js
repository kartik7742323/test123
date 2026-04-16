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

function formatDuration(seconds) {
  if (seconds === undefined || seconds === null || seconds === '') return '-'
  const totalSec = Math.round(parseFloat(seconds))
  if (isNaN(totalSec)) return '-'
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

async function buildGuideData(allClientsRows, daywiseRows) {
  const headerRow = (allClientsRows[0] || []).map(h => String(h || '').trim().toLowerCase())
  const liveDateIdx = headerRow.findIndex(h => h.includes('live') && h.includes('date'))

  const clientRows = allClientsRows.slice(1).filter(r => r[0] && String(r[0]).trim())

  const clients = clientRows.map((r, i) => {
    const conversations   = parseNum(r[2])
    const avgMessages     = parseNum(r[3])
    const usersInteracted = parseNum(r[4])
    const convsPerUser    = usersInteracted > 0 ? Math.round(conversations / usersInteracted * 100) / 100 : 0
    return {
      id: i + 1,
      name:            String(r[0] || '').trim(),
      status:          String(r[1] || '').trim(),
      liveDate:        liveDateIdx >= 0 ? String(r[liveDateIdx] || '').trim() : '',
      conversations,
      avgMessages,
      usersInteracted,
      convsPerUser,
      color:           COLORS[i % COLORS.length],
    }
  })

  const totalConversations = clients.reduce((s, c) => s + c.conversations, 0)
  const totalUsers         = clients.reduce((s, c) => s + c.usersInteracted, 0)
  const avgMessages        = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.avgMessages, 0) / clients.length * 10) / 10 : 0
  const activeClients      = clients.filter(c => c.status.toLowerCase().includes('live')).length
  const avgConvsPerUser    = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.convsPerUser, 0) / clients.length * 100) / 100 : 0

  const topByConversations = [...clients]
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 10)
    .map(c => ({ name: c.name, conversations: c.conversations, usersInteracted: c.usersInteracted }))

  const scatterData = clients.map(c => ({
    institute:    c.name,
    convsPerUser: c.convsPerUser,
    avgMessages:  c.avgMessages,
    color:        c.color,
  }))

  const dailyData = daywiseRows
    .slice(1)
    .map(r => {
      if (!r[4]) return null
      const d = parseSheetDate(String(r[4]).trim())
      if (!d) return null
      return {
        date:            formatDisplayDate(d),
        conversations:   parseNum(r[2]),
        usersInteracted: parseNum(r[3]),
        _ts:             d.getTime(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest)

  return {
    kpi: { totalConversations, totalUsers, avgMessages, activeClients, avgConvsPerUser },
    clientTable: clients.map(({ color, ...c }) => c),
    topByConversations,
    scatterData,
    dailyData,
  }
}

function buildTrackerData(voiceRows, guideRows) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthLabel   = d => d && !isNaN(d.getTime()) ? `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` : null
  const monthSortKey = d => d ? d.getFullYear() * 100 + d.getMonth() : 0

  const AGEING_BUCKETS = [
    { label: '0–4',  min: 0,  max: 4 },
    { label: '5–9',  min: 5,  max: 9 },
    { label: '10–14',min: 10, max: 14 },
    { label: '15–19',min: 15, max: 19 },
    { label: '20+',  min: 20, max: 9999 },
  ]

  // ── Voice Tracker ─────────────────────────────────────────────────────────
  const VOICE_PRIORITY = {
    'H. Live':1,'I. POC Delivered':2,'G. Client Testing':3,'F. Agent Alteration':4,
    'E. Demo/Live call Scheduled':5,'D. Agent Creation':6,'C. RGS Pending':7,
    'B. KOC Scheduled':8,'A. KOC Pending':9,'K. On-Hold':10,'L. Churn':11,
  }
  const VOICE_IP = [
    'A. KOC Pending','B. KOC Scheduled','C. RGS Pending','D. Agent Creation',
    'E. Demo/Live call Scheduled','F. Agent Alteration','G. Client Testing','I. POC Delivered',
  ]

  // Deduplicate: Regular only, pick best row per institute by status priority + date tiebreakers
  const voiceMap = new Map()
  voiceRows.slice(1)
    .filter(r => r[0] && String(r[1]||'').trim().toLowerCase() === 'regular')
    .forEach(r => {
      const name   = String(r[0]).trim()
      const status = String(r[10]||'').trim()
      if (!status) return
      const rank     = VOICE_PRIORITY[status] || 999
      const onboardD = parseSheetDate(r[3]) || new Date('2100-01-01')
      const rgsD     = parseSheetDate(r[5]) || new Date('2100-01-01')
      const liveD    = parseSheetDate(r[17]) || new Date('2100-01-01')

      if (!voiceMap.has(name)) {
        voiceMap.set(name, { rank, onboardD, rgsD, liveD, r, status })
      } else {
        const ex = voiceMap.get(name)
        let replace = false
        if (rank < ex.rank) {
          replace = true
        } else if (rank === ex.rank) {
          if (status === 'H. Live') {
            if (liveD < ex.liveD || (liveD.getTime() === ex.liveD.getTime() && rgsD < ex.rgsD)) replace = true
          } else {
            if (onboardD < ex.onboardD || (onboardD.getTime() === ex.onboardD.getTime() && rgsD < ex.rgsD)) replace = true
          }
        }
        if (replace) voiceMap.set(name, { rank, onboardD, rgsD, liveD, r, status })
      }
    })

  const voiceClients = Array.from(voiceMap.values())
    .sort((a, b) => a.onboardD - b.onboardD)
    .map(v => {
      const r = v.r
      return {
        name:              String(r[0]||'').trim(),
        setupType:         String(r[1]||'').trim(),
        agentType:         String(r[2]||'').trim(),
        onboardingDate:    String(r[3]||'').trim(),
        kocDate:           String(r[4]||'').trim(),
        rgsDate:           String(r[5]||'').trim(),
        owner:             String(r[8]||'').trim(),
        ageing:            parseInt(r[9])||0,
        status:            String(r[10]||'').trim(),
        liveDate:          String(r[17]||'').trim(),
        kocDays:           parseFloat(r[18])||0,
        rgsDays:           parseFloat(r[19])||0,
        agentCreationDays: parseFloat(r[20])||0,
        demoDays:          parseFloat(r[21])||0,
        toLiveDays:        parseFloat(r[22])||0,
        onboardToLiveDays: parseFloat(r[24])||0,
        merrittoPoc:       String(r[28]||'').trim(),
      }
    })

  const now = new Date()
  const curMonth = now.getMonth(), curYear = now.getFullYear()

  const voiceLive = voiceClients.filter(c => c.status === 'H. Live')
  const voiceIP   = voiceClients.filter(c => VOICE_IP.includes(c.status))

  const voiceThisMonthLive = voiceLive.filter(c => {
    const d = parseSheetDate(c.liveDate)
    return d && d.getMonth() === curMonth && d.getFullYear() === curYear
  }).length

  const voiceTATs = voiceLive.filter(c => c.onboardToLiveDays > 0).map(c => c.onboardToLiveDays)
  const voiceAvgTAT     = voiceTATs.length ? Math.round(voiceTATs.reduce((s,v) => s+v,0) / voiceTATs.length) : 0
  const voiceAvgAgeingIP = voiceIP.length ? Math.round(voiceIP.reduce((s,c) => s+c.ageing,0) / voiceIP.length) : 0

  const voiceKpi = {
    total: voiceClients.length,
    live: voiceLive.length,
    liveRate: voiceClients.length ? Math.round(voiceLive.length / voiceClients.length * 100) : 0,
    inProgress: voiceIP.length,
    onHold: voiceClients.filter(c => c.status === 'K. On-Hold').length,
    churned: voiceClients.filter(c => c.status === 'L. Churn').length,
    avgTAT: voiceAvgTAT,
    thisMonthLive: voiceThisMonthLive,
    avgAgeingIP: voiceAvgAgeingIP,
  }

  const voiceByStatus = Object.entries(
    voiceClients.reduce((acc, c) => { acc[c.status] = (acc[c.status]||0)+1; return acc }, {})
  ).map(([status, count]) => ({ status, count }))
    .sort((a, b) => (VOICE_PRIORITY[a.status]||999) - (VOICE_PRIORITY[b.status]||999))

  const voiceLastFiveLive = [...voiceLive]
    .filter(c => c.liveDate)
    .sort((a, b) => {
      const da = parseSheetDate(a.liveDate), db = parseSheetDate(b.liveDate)
      return (db ? db.getTime() : 0) - (da ? da.getTime() : 0)
    })
    .slice(0, 5)
    .map(c => ({ name: c.name, liveDate: c.liveDate }))

  const voiceMonthGroups = {}
  voiceLive.forEach(c => {
    if (!c.onboardingDate || c.onboardToLiveDays <= 0) return
    const d = parseSheetDate(c.onboardingDate); if (!d) return
    const key = monthLabel(d); if (!key) return
    if (!voiceMonthGroups[key]) voiceMonthGroups[key] = { values: [], sk: monthSortKey(d) }
    voiceMonthGroups[key].values.push(c.onboardToLiveDays)
  })
  const voiceMonthAvg = Object.entries(voiceMonthGroups)
    .sort((a, b) => b[1].sk - a[1].sk)
    .map(([month, g]) => ({
      month,
      avgDays: Math.round(g.values.reduce((s,v) => s+v,0) / g.values.length),
      count: g.values.length,
    }))

  const voiceMatrixStatuses = VOICE_IP.filter(s => voiceClients.some(c => c.status === s))
  const voiceAgeingMatrix = {
    buckets: AGEING_BUCKETS.map(b => b.label),
    rows: voiceMatrixStatuses.map(s => ({
      status: s,
      counts: AGEING_BUCKETS.map(b => voiceClients.filter(c => c.status === s && c.ageing >= b.min && c.ageing <= b.max).length),
    })),
    totals: AGEING_BUCKETS.map(b => voiceIP.filter(c => c.ageing >= b.min && c.ageing <= b.max).length),
  }

  // ── SPOC Leaderboard (Voice) ───────────────────────────────────────────────
  const voiceSpocMap = {}
  voiceClients.forEach(c => {
    const spoc = c.merrittoPoc || 'Unassigned'
    if (!voiceSpocMap[spoc]) voiceSpocMap[spoc] = { spoc, total:0, live:0, inProgress:0, onHold:0, churned:0, tats:[] }
    voiceSpocMap[spoc].total++
    if (c.status === 'H. Live') { voiceSpocMap[spoc].live++; if (c.onboardToLiveDays > 0) voiceSpocMap[spoc].tats.push(c.onboardToLiveDays) }
    else if (c.status === 'K. On-Hold') voiceSpocMap[spoc].onHold++
    else if (c.status === 'L. Churn') voiceSpocMap[spoc].churned++
    else if (VOICE_IP.includes(c.status)) voiceSpocMap[spoc].inProgress++
  })
  const voiceSpocLeaderboard = Object.values(voiceSpocMap)
    .map(s => ({ spoc:s.spoc, total:s.total, live:s.live, liveRate:s.total?Math.round(s.live/s.total*100):0, inProgress:s.inProgress, onHold:s.onHold, churned:s.churned, avgTAT:s.tats.length?Math.round(s.tats.reduce((a,b)=>a+b,0)/s.tats.length):null }))
    .sort((a,b) => b.total - a.total)

  // ── At-Risk: in-progress with ageing ≥ 20 days (Voice) ────────────────────
  const voiceAtRisk = voiceIP.filter(c => c.ageing >= 20).sort((a,b) => b.ageing - a.ageing)

  // ── Cohort Matrix (Voice): intake month → live month counts ───────────────
  const vcMap = {}
  voiceClients.forEach(c => {
    const d=parseSheetDate(c.onboardingDate); if (!d) return
    const k=monthLabel(d); if (!k) return
    if (!vcMap[k]) vcMap[k]={month:k,sk:monthSortKey(d),total:0,liveCounts:{},stillIP:0,onHold:0,churned:0}
    vcMap[k].total++
    if (c.status==='H. Live') { const ld=parseSheetDate(c.liveDate); if (ld) { const lk=monthLabel(ld); if (lk) vcMap[k].liveCounts[lk]=(vcMap[k].liveCounts[lk]||0)+1 } }
    else if (c.status==='K. On-Hold') vcMap[k].onHold++
    else if (c.status==='L. Churn') vcMap[k].churned++
    else if (VOICE_IP.includes(c.status)) vcMap[k].stillIP++
  })
  const vcRows=Object.values(vcMap).sort((a,b) => a.sk-b.sk).map(({sk,...r}) => r)
  const _vlmSet=new Set(); vcRows.forEach(r => Object.keys(r.liveCounts).forEach(m => _vlmSet.add(m)))
  const vcLiveMonths=[..._vlmSet].sort((a,b) => { const sk=m=>{const[mo,yr]=m.split(" '");return(2000+parseInt(yr))*100+MONTHS.indexOf(mo)};return sk(a)-sk(b) })
  const voiceCohortMatrix={liveMonths:vcLiveMonths,rows:vcRows}

  // ── Stage-wise TAT (Voice, H. Live only, positive values) ─────────────────
  function stageAvg(arr, key) {
    const vals = arr.filter(c => c[key] > 0).map(c => c[key])
    return vals.length ? { avg: Math.round(vals.reduce((a,b)=>a+b,0)/vals.length), count: vals.length } : { avg: null, count: 0 }
  }
  const voiceStageTAT = [
    { stage: 'Onboarding → KOC',        ...stageAvg(voiceLive, 'kocDays') },
    { stage: 'KOC → RGS Received',      ...stageAvg(voiceLive, 'rgsDays') },
    { stage: 'RGS → Agent Creation',    ...stageAvg(voiceLive, 'agentCreationDays') },
    { stage: 'Agent Creation → Demo',   ...stageAvg(voiceLive, 'demoDays') },
    { stage: 'Demo → Live',             ...stageAvg(voiceLive, 'toLiveDays') },
    { stage: 'Total (Onboarding → Live)',...stageAvg(voiceLive, 'onboardToLiveDays') },
  ]

  // ── TAT by Agent Type (Voice) ─────────────────────────────────────────────
  const agentTypeMap = {}
  voiceLive.forEach(c => {
    if (!c.agentType || c.onboardToLiveDays <= 0) return
    const t = c.agentType.trim()
    if (!agentTypeMap[t]) agentTypeMap[t] = { count:0, tats:[] }
    agentTypeMap[t].count++; agentTypeMap[t].tats.push(c.onboardToLiveDays)
  })
  const voiceTatByAgentType = Object.entries(agentTypeMap)
    .map(([agentType, g]) => ({ agentType, count:g.count, avgTAT:Math.round(g.tats.reduce((a,b)=>a+b,0)/g.tats.length) }))
    .sort((a,b) => b.count - a.count)

  // ── Monthly Inflow vs Outflow (Voice) ─────────────────────────────────────
  const voiceMonthlyMap = {}
  voiceClients.forEach(c => {
    const d = parseSheetDate(c.onboardingDate); if (!d) return
    const key = monthLabel(d); if (!key) return
    if (!voiceMonthlyMap[key]) voiceMonthlyMap[key] = { month:key, sk:monthSortKey(d), received:0, live:0 }
    voiceMonthlyMap[key].received++
  })
  voiceLive.forEach(c => {
    const d = parseSheetDate(c.liveDate); if (!d) return
    const key = monthLabel(d); if (!key) return
    if (!voiceMonthlyMap[key]) voiceMonthlyMap[key] = { month:key, sk:monthSortKey(d), received:0, live:0 }
    voiceMonthlyMap[key].live++
  })
  const voiceMonthlyTrend = Object.values(voiceMonthlyMap).sort((a,b) => a.sk-b.sk).map(({sk,...r}) => r)

  // ── Guide Tracker ─────────────────────────────────────────────────────────
  const GUIDE_PRIORITY = {
    'G. Live':1,'F. Code Placement Pending':2,'C. Setup Pending':3,
    'A. KOC Pending':4,'I. On-hold':5,'K. Churn':6,
  }
  const GUIDE_IP = ['A. KOC Pending','C. Setup Pending','F. Code Placement Pending']

  const guideMap = new Map()
  guideRows.slice(1)
    .filter(r => r[0] && String(r[0]).trim())
    .forEach(r => {
      const name   = String(r[0]).trim()
      const status = String(r[7]||'').trim()
      if (!status) return
      const rank     = GUIDE_PRIORITY[status] || 999
      const onboardD = parseSheetDate(r[2]) || new Date('2100-01-01')
      const liveD    = parseSheetDate(r[8]) || new Date('2100-01-01')
      if (!guideMap.has(name)) {
        guideMap.set(name, { rank, onboardD, liveD, r, status })
      } else {
        const ex = guideMap.get(name)
        if (rank < ex.rank || (rank === ex.rank && onboardD < ex.onboardD))
          guideMap.set(name, { rank, onboardD, liveD, r, status })
      }
    })

  const guideClients = Array.from(guideMap.values())
    .sort((a, b) => a.onboardD - b.onboardD)
    .map(v => {
      const r = v.r
      return {
        name:           String(r[0]||'').trim(),
        onboardingDate: String(r[2]||'').trim(),
        kocDate:        String(r[3]||'').trim(),
        ageing:         parseInt(r[6])||0,
        status:         String(r[7]||'').trim(),
        liveDate:       String(r[8]||'').trim(),
        tat:            parseFloat(r[9])||0,
        merrittoPoc:    String(r[13]||'').trim(),
      }
    })

  const guideLive = guideClients.filter(c => c.status === 'G. Live')
  const guideIP   = guideClients.filter(c => GUIDE_IP.includes(c.status))

  const guideThisMonthLive = guideLive.filter(c => {
    const d = parseSheetDate(c.liveDate)
    return d && d.getMonth() === curMonth && d.getFullYear() === curYear
  }).length

  const guideTATs = guideLive.filter(c => c.tat > 0).map(c => c.tat)
  const guideAvgTAT      = guideTATs.length ? Math.round(guideTATs.reduce((s,v) => s+v,0) / guideTATs.length) : 0
  const guideAvgAgeingIP = guideIP.length ? Math.round(guideIP.reduce((s,c) => s+c.ageing,0) / guideIP.length) : 0

  const guideKpi = {
    total: guideClients.length,
    live: guideLive.length,
    liveRate: guideClients.length ? Math.round(guideLive.length / guideClients.length * 100) : 0,
    inProgress: guideIP.length,
    onHold: guideClients.filter(c => c.status === 'I. On-hold').length,
    churned: guideClients.filter(c => c.status === 'K. Churn').length,
    avgTAT: guideAvgTAT,
    thisMonthLive: guideThisMonthLive,
    avgAgeingIP: guideAvgAgeingIP,
  }

  const guideByStatus = Object.entries(
    guideClients.reduce((acc, c) => { acc[c.status] = (acc[c.status]||0)+1; return acc }, {})
  ).map(([status, count]) => ({ status, count }))
    .sort((a, b) => (GUIDE_PRIORITY[a.status]||999) - (GUIDE_PRIORITY[b.status]||999))

  const guideLastFiveLive = [...guideLive]
    .filter(c => c.liveDate)
    .sort((a, b) => {
      const da = parseSheetDate(a.liveDate), db = parseSheetDate(b.liveDate)
      return (db ? db.getTime() : 0) - (da ? da.getTime() : 0)
    })
    .slice(0, 5)
    .map(c => ({ name: c.name, liveDate: c.liveDate }))

  const guideMonthGroups = {}
  guideLive.forEach(c => {
    if (!c.onboardingDate || c.tat <= 0) return
    const d = parseSheetDate(c.onboardingDate); if (!d) return
    const key = monthLabel(d); if (!key) return
    if (!guideMonthGroups[key]) guideMonthGroups[key] = { values: [], sk: monthSortKey(d) }
    guideMonthGroups[key].values.push(c.tat)
  })
  const guideMonthAvg = Object.entries(guideMonthGroups)
    .sort((a, b) => b[1].sk - a[1].sk)
    .map(([month, g]) => ({
      month,
      avgDays: Math.round(g.values.reduce((s,v) => s+v,0) / g.values.length),
      count: g.values.length,
    }))

  const guideMatrixStatuses = GUIDE_IP.filter(s => guideClients.some(c => c.status === s))
  const guideAgeingMatrix = {
    buckets: AGEING_BUCKETS.map(b => b.label),
    rows: guideMatrixStatuses.map(s => ({
      status: s,
      counts: AGEING_BUCKETS.map(b => guideClients.filter(c => c.status === s && c.ageing >= b.min && c.ageing <= b.max).length),
    })),
    totals: AGEING_BUCKETS.map(b => guideIP.filter(c => c.ageing >= b.min && c.ageing <= b.max).length),
  }

  // ── SPOC Leaderboard (Guide) ───────────────────────────────────────────────
  const guideSpocMap = {}
  guideClients.forEach(c => {
    const spoc = c.merrittoPoc || 'Unassigned'
    if (!guideSpocMap[spoc]) guideSpocMap[spoc] = { spoc, total:0, live:0, inProgress:0, onHold:0, churned:0, tats:[] }
    guideSpocMap[spoc].total++
    if (c.status === 'G. Live') { guideSpocMap[spoc].live++; if (c.tat > 0) guideSpocMap[spoc].tats.push(c.tat) }
    else if (c.status === 'I. On-hold') guideSpocMap[spoc].onHold++
    else if (c.status === 'K. Churn') guideSpocMap[spoc].churned++
    else if (GUIDE_IP.includes(c.status)) guideSpocMap[spoc].inProgress++
  })
  const guideSpocLeaderboard = Object.values(guideSpocMap)
    .map(s => ({ spoc:s.spoc, total:s.total, live:s.live, liveRate:s.total?Math.round(s.live/s.total*100):0, inProgress:s.inProgress, onHold:s.onHold, churned:s.churned, avgTAT:s.tats.length?Math.round(s.tats.reduce((a,b)=>a+b,0)/s.tats.length):null }))
    .sort((a,b) => b.total - a.total)

  // ── At-Risk: in-progress with ageing ≥ 20 days (Guide) ────────────────────
  const guideAtRisk = guideIP.filter(c => c.ageing >= 20).sort((a,b) => b.ageing - a.ageing)

  // ── Cohort Matrix (Guide): intake month → live month counts ───────────────
  const gcMap = {}
  guideClients.forEach(c => {
    const d=parseSheetDate(c.onboardingDate); if (!d) return
    const k=monthLabel(d); if (!k) return
    if (!gcMap[k]) gcMap[k]={month:k,sk:monthSortKey(d),total:0,liveCounts:{},stillIP:0,onHold:0,churned:0}
    gcMap[k].total++
    if (c.status==='G. Live') { const ld=parseSheetDate(c.liveDate); if (ld) { const lk=monthLabel(ld); if (lk) gcMap[k].liveCounts[lk]=(gcMap[k].liveCounts[lk]||0)+1 } }
    else if (c.status==='I. On-hold') gcMap[k].onHold++
    else if (c.status==='K. Churn') gcMap[k].churned++
    else if (GUIDE_IP.includes(c.status)) gcMap[k].stillIP++
  })
  const gcRows=Object.values(gcMap).sort((a,b) => a.sk-b.sk).map(({sk,...r}) => r)
  const _glmSet=new Set(); gcRows.forEach(r => Object.keys(r.liveCounts).forEach(m => _glmSet.add(m)))
  const gcLiveMonths=[..._glmSet].sort((a,b) => { const sk=m=>{const[mo,yr]=m.split(" '");return(2000+parseInt(yr))*100+MONTHS.indexOf(mo)};return sk(a)-sk(b) })
  const guideCohortMatrix={liveMonths:gcLiveMonths,rows:gcRows}

  // ── Monthly Inflow vs Outflow (Guide) ─────────────────────────────────────
  const guideMonthlyMap = {}
  guideClients.forEach(c => {
    const d = parseSheetDate(c.onboardingDate); if (!d) return
    const key = monthLabel(d); if (!key) return
    if (!guideMonthlyMap[key]) guideMonthlyMap[key] = { month:key, sk:monthSortKey(d), received:0, live:0 }
    guideMonthlyMap[key].received++
  })
  guideLive.forEach(c => {
    const d = parseSheetDate(c.liveDate); if (!d) return
    const key = monthLabel(d); if (!key) return
    if (!guideMonthlyMap[key]) guideMonthlyMap[key] = { month:key, sk:monthSortKey(d), received:0, live:0 }
    guideMonthlyMap[key].live++
  })
  const guideMonthlyTrend = Object.values(guideMonthlyMap).sort((a,b) => a.sk-b.sk).map(({sk,...r}) => r)

  return {
    voice: { kpi: voiceKpi, byStatus: voiceByStatus, clients: voiceClients, lastFiveLive: voiceLastFiveLive, monthAvg: voiceMonthAvg, ageingMatrix: voiceAgeingMatrix, spocLeaderboard: voiceSpocLeaderboard, atRisk: voiceAtRisk, cohortMatrix: voiceCohortMatrix, stageTAT: voiceStageTAT, tatByAgentType: voiceTatByAgentType, monthlyTrend: voiceMonthlyTrend },
    guide: { kpi: guideKpi, byStatus: guideByStatus, clients: guideClients, lastFiveLive: guideLastFiveLive, monthAvg: guideMonthAvg, ageingMatrix: guideAgeingMatrix, spocLeaderboard: guideSpocLeaderboard, atRisk: guideAtRisk, cohortMatrix: guideCohortMatrix, monthlyTrend: guideMonthlyTrend },
  }
}

async function buildDashboardData() {
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
    console.warn('Guide sheets not found:', e.message)
  }

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
    avgDurationMin: (parseFloat(r[7]) || 0) * 100,
    avgDuration:    formatDuration((parseFloat(r[7]) || 0) * 100),
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
    daywiseByClientMap[dk][client].durationSum += (parseFloat(r[5]) || 0) * 100 * parseNum(r[2])
  })

  const daywiseData = Object.values(daywiseMap)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest)

  const clientColorMap = {}
  Array.from(daywiseClientNames).forEach((name, i) => {
    clientColorMap[name] = COLORS[i % COLORS.length]
  })

  const clientTable = clients.map(({ color, ...c }) => c)

  // ── Customers at Risk: clients with no calls in last 7+ days ──────────────
  const riskNow = new Date()
  const lastCallByClient = {}
  daywiseRows.slice(1).forEach(r => {
    const rawClient = String(r[1] || '').trim()
    if (!r[0] || !rawClient || rawClient.toLowerCase().includes('grand')) return
    const date = parseSheetDate(r[0])
    if (!date) return
    const client = normalizeDaywiseName(rawClient, clients)
    if (!lastCallByClient[client] || date > lastCallByClient[client]) {
      lastCallByClient[client] = date
    }
  })
  const customersAtRisk = clients
    .map(c => {
      const lastDate = lastCallByClient[c.name]
      const daysSince = lastDate ? Math.floor((riskNow - lastDate) / (1000 * 60 * 60 * 24)) : null
      const lastSeen = lastDate ? formatDisplayDate(lastDate) : null
      return { name: c.name, daysSince, lastSeen }
    })
    .filter(c => c.daysSince === null || c.daysSince >= 7)

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

  return { kpi, dailyVolume, topClientsByVolume, scatterData, daywiseData, daywiseByClient: daywiseByClientMap, clientColorMap, clientTable, customersAtRisk, guide, tracker }
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
