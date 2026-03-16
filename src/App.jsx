import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import KPICards from './components/KPICards'
import DailyVolumeChart from './components/DailyVolumeChart'
import MergedClientsChart from './components/MergedClientsChart'
import LeadQualScatter from './components/LeadQualScatter'
import DaywiseChart from './components/DaywiseChart'
import ClientTable from './components/ClientTable'
import GlobalFilters from './components/GlobalFilters'

// Parse "25 Feb'26" → timestamp for comparison
function parseDashDate(s) {
  if (!s) return 0
  const MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 }
  const m = String(s).match(/^(\d+) (\w+)'(\d+)$/)
  if (!m) return 0
  return new Date(2000 + parseInt(m[3]), MONTHS[m[2]], parseInt(m[1])).getTime()
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '-'
  const totalSec = Math.round(parseFloat(minutes) * 60)
  if (isNaN(totalSec)) return '-'
  const m = Math.floor(totalSec / 60), s = totalSec % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

export default function App() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', clients: [] })

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true); setError(null)
      const res  = await fetch(forceRefresh ? '/api/dashboard?refresh=1' : '/api/dashboard')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Derived filter options ────────────────────────────────────────────────
  const dateOptions   = useMemo(() => data?.dailyVolume?.map(d => d.date) ?? [], [data])
  const clientOptions = useMemo(() => data?.clientTable?.map(c => c.name) ?? [],  [data])

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!data) return null

    const fromTs = filters.dateFrom ? parseDashDate(filters.dateFrom) : 0
    const toTs   = filters.dateTo   ? parseDashDate(filters.dateTo)   : Infinity
    const activeClients   = new Set(filters.clients)
    const hasDateFilter   = !!(filters.dateFrom || filters.dateTo)
    const hasClientFilter = activeClients.size > 0
    const dbc             = data.daywiseByClient || {}

    // ── Step 1: Date-filter clientTable using daywiseByClient ──────────────
    let baseClientTable = data.clientTable
    if (hasDateFilter) {
      const dateStats = {}
      Object.entries(dbc).forEach(([date, clients]) => {
        const ts = parseDashDate(date)
        if (ts >= fromTs && ts <= toTs) {
          Object.entries(clients).forEach(([name, s]) => {
            if (!dateStats[name]) dateStats[name] = { calls: 0, connected: 0, durationSum: 0 }
            dateStats[name].calls        += s.calls
            dateStats[name].connected    += s.connected
            dateStats[name].durationSum  += (s.durationSum || 0)
          })
        }
      })
      baseClientTable = data.clientTable
        .filter(c => dateStats[c.name])
        .map(c => {
          const ds = dateStats[c.name]
          const connRate       = ds.calls > 0 ? Math.round(ds.connected / ds.calls * 1000) / 10 : 0
          const avgDurationMin = ds.calls > 0 ? ds.durationSum / ds.calls : c.avgDurationMin
          const avgDuration    = formatDuration(avgDurationMin)
          return { ...c, totalCalls: ds.calls, connected: ds.connected, connRate, avgDurationMin, avgDuration }
        })
    }

    // ── Step 2: Apply client filter on top ─────────────────────────────────
    const clientTable = hasClientFilter
      ? baseClientTable.filter(c => activeClients.has(c.name))
      : baseClientTable

    // ── Step 3: Daily Volume (date + client filtered) ───────────────────────
    let dailyVolume
    if (hasClientFilter) {
      const dayMap = {}
      Object.entries(dbc).forEach(([date, clients]) => {
        const ts = parseDashDate(date)
        if (hasDateFilter && (ts < fromTs || ts > toTs)) return
        let totalCalls = 0, connected = 0
        activeClients.forEach(c => {
          if (clients[c]) { totalCalls += clients[c].calls; connected += clients[c].connected }
        })
        if (totalCalls > 0)
          dayMap[date] = { date, totalCalls, connectedCalls: connected, connRate: Math.round(connected / totalCalls * 1000) / 10, _ts: ts }
      })
      dailyVolume = Object.values(dayMap).sort((a, b) => a._ts - b._ts).map(({ _ts, ...rest }) => rest)
    } else if (hasDateFilter) {
      dailyVolume = data.dailyVolume.filter(d => { const ts = parseDashDate(d.date); return ts >= fromTs && ts <= toTs })
    } else {
      dailyVolume = data.dailyVolume
    }

    // ── Step 4: Daywise chart (date filter only — chart has its own client filter) ──
    const daywiseData = hasDateFilter
      ? data.daywiseData.filter(d => { const ts = parseDashDate(d.date); return ts >= fromTs && ts <= toTs })
      : data.daywiseData

    // ── Step 5: Top 10 + Scatter from filtered clientTable ──────────────────
    const topClientsByVolume = clientTable
      .slice().sort((a, b) => b.totalCalls - a.totalCalls).slice(0, 10)
      .map(c => ({ name: c.name, calls: c.totalCalls, connected: c.connected, connRate: c.connRate }))

    const colorMap = {}
    data.scatterData.forEach(d => { colorMap[d.client] = d.color })
    const scatterData = clientTable.map(c => ({
      client: c.name, connRate: c.connRate, qualRate: c.qualRate,
      color: colorMap[c.name] ?? data.clientColorMap[c.name] ?? '#94a3b8',
    }))

    // ── Step 6: KPIs from filtered clientTable ──────────────────────────────
    const fc = clientTable
    const totalCallsDialed = fc.reduce((s, c) => s + c.totalCalls, 0)
    const totalConnected   = fc.reduce((s, c) => s + c.connected,  0)
    const leadsQualified   = fc.reduce((s, c) => s + c.qualified,  0)
    const overallConnRate  = totalCallsDialed > 0 ? Math.round(totalConnected / totalCallsDialed * 1000) / 10 : 0
    const avgQualRate      = fc.length > 0 ? Math.round(fc.reduce((s, c) => s + c.qualRate, 0) / fc.length * 10) / 10 : 0
    const avgCallDuration  = fc.length > 0
      ? formatDuration(fc.reduce((s, c) => s + (c.avgDurationMin ?? 0), 0) / fc.length)
      : data.kpi.avgCallDuration

    const kpi = { ...data.kpi, totalCallsDialed, totalConnected, overallConnRate, leadsQualified, avgQualRate, avgCallDuration }

    return { kpi, dailyVolume, topClientsByVolume, scatterData, daywiseData, clientTable, clientColorMap: data.clientColorMap }
  }, [data, filters])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading data from Google Sheets…</p>
      </div>
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-8 max-w-lg text-center">
        <p className="text-red-500 font-semibold mb-2">Failed to load data</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button onClick={() => fetchData(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Retry</button>
      </div>
    </div>
  )

  const d = filtered

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        <Header lastRefresh={d.kpi.lastRefresh} onRefresh={() => fetchData(true)} />

        {/* Global Filters */}
        <GlobalFilters
          dates={dateOptions}
          clients={clientOptions}
          filters={filters}
          onChange={setFilters}
        />

        {/* KPI Cards */}
        <KPICards data={d.kpi} />

        {/* Row 2: Daily Volume + Merged Clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <DailyVolumeChart data={d.dailyVolume} />
          <MergedClientsChart data={d.topClientsByVolume} />
        </div>

        {/* Row 3: Scatter (full width) */}
        <div className="mb-4">
          <LeadQualScatter data={d.scatterData} />
        </div>

        {/* Row 4: Daywise */}
        <div className="mb-4">
          <DaywiseChart data={d.daywiseData} clientColorMap={d.clientColorMap} />
        </div>

        {/* Row 5: Table */}
        <div className="mb-6">
          <ClientTable data={d.clientTable} />
        </div>

      </div>
    </div>
  )
}
