import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import KPICards from './components/KPICards'
import DailyVolumeChart from './components/DailyVolumeChart'
import MergedClientsChart from './components/MergedClientsChart'
import LeadQualScatter from './components/LeadQualScatter'
import DaywiseChart from './components/DaywiseChart'
import ClientTable from './components/ClientTable'
import GlobalFilters from './components/GlobalFilters'
import GuideKPICards from './components/GuideKPICards'
import GuideDailyChart from './components/GuideDailyChart'
import GuideClientTable from './components/GuideClientTable'
import GuideTopInstitutesChart from './components/GuideTopInstitutesChart'
import OnboardingKPICards from './components/OnboardingKPICards'
import OnboardingStatusChart from './components/OnboardingStatusChart'
import OnboardingClientTable from './components/OnboardingClientTable'
import OnboardingLastFiveLive from './components/OnboardingLastFiveLive'
import OnboardingMonthAvg from './components/OnboardingMonthAvg'
import OnboardingAgeingMatrix from './components/OnboardingAgeingMatrix'
import LoginPage from './LoginPage'
import { decryptResponse } from './crypto'

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
  const token = sessionStorage.getItem('mio_auth_token') || ''
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters]           = useState({ dateFrom: '', dateTo: '', clients: [] })
  const [guideFilters, setGuideFilters] = useState({ dateFrom: '', dateTo: '', clients: [] })
  const [activeTab, setActiveTab]       = useState('voice')
  const [onboardingSubTab, setOnboardingSubTab] = useState('voice')

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true); setError(null)
      const url = forceRefresh ? '/api/dashboard?refresh=1' : '/api/dashboard'
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.status === 401) {
        sessionStorage.removeItem('mio_auth_token')
        window.location.reload()
        return
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      const decrypted = await decryptResponse(json.data)
      setData(decrypted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchData() }, [])

  if (!token) return <LoginPage />

  // ── Derived filter options ────────────────────────────────────────────────
  const dateOptions        = useMemo(() => data?.dailyVolume?.map(d => d.date) ?? [],          [data])
  const clientOptions      = useMemo(() => data?.clientTable?.map(c => c.name) ?? [],          [data])
  const guideDateOptions   = useMemo(() => data?.guide?.dailyData?.map(d => d.date) ?? [],     [data])
  const guideInstOptions   = useMemo(() => data?.guide?.clientTable?.map(c => c.name) ?? [],   [data])

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

  // ── Guide filtered data ────────────────────────────────────────────────────
  const filteredGuide = useMemo(() => {
    const g = data?.guide
    if (!g) return null

    const fromTs        = guideFilters.dateFrom ? parseDashDate(guideFilters.dateFrom) : 0
    const toTs          = guideFilters.dateTo   ? parseDashDate(guideFilters.dateTo)   : Infinity
    const activeInsts   = new Set(guideFilters.clients)
    const hasDateFilter = !!(guideFilters.dateFrom || guideFilters.dateTo)
    const hasInstFilter = activeInsts.size > 0

    // ── 1. Chart: filter daily data by date range ──────────────────────────
    const dailyData = hasDateFilter
      ? g.dailyData.filter(d => { const ts = parseDashDate(d.date); return ts >= fromTs && ts <= toTs })
      : g.dailyData

    // ── 2. Table: filter by selected institutes ────────────────────────────
    const clientTable = hasInstFilter
      ? g.clientTable.filter(c => activeInsts.has(c.name))
      : g.clientTable

    // ── 3. Top 10 + Scatter from filtered clientTable ─────────────────────
    const topByConversations = [...clientTable]
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 10)
      .map(c => ({ name: c.name, conversations: c.conversations, usersInteracted: c.usersInteracted }))

    const colorMap = {}
    data.guide.scatterData.forEach(d => { colorMap[d.institute] = d.color })
    const scatterData = clientTable.map(c => ({
      institute:    c.name,
      convsPerUser: c.convsPerUser,
      avgMessages:  c.avgMessages,
      color:        colorMap[c.name] ?? '#94a3b8',
    }))

    // ── 5. KPIs ────────────────────────────────────────────────────────────
    let totalConversations, totalUsers, avgMessages, activeClients, avgConvsPerUser
    // dimmedKpis: keys that can't be recomputed for the active filter (shown with "all-time" tag)
    const dimmedKpis = new Set()

    if (hasInstFilter) {
      totalConversations = clientTable.reduce((s, c) => s + c.conversations, 0)
      totalUsers         = clientTable.reduce((s, c) => s + c.usersInteracted, 0)
      avgMessages        = clientTable.length > 0 ? Math.round(clientTable.reduce((s, c) => s + c.avgMessages,   0) / clientTable.length * 10)  / 10  : 0
      avgConvsPerUser    = clientTable.length > 0 ? Math.round(clientTable.reduce((s, c) => s + c.convsPerUser,  0) / clientTable.length * 100) / 100 : 0
      activeClients      = clientTable.filter(c => c.status.toLowerCase().includes('live')).length
    } else if (hasDateFilter) {
      totalConversations = dailyData.reduce((s, d) => s + d.conversations, 0)
      totalUsers         = dailyData.reduce((s, d) => s + d.usersInteracted, 0)
      avgConvsPerUser    = totalUsers > 0 ? Math.round(totalConversations / totalUsers * 100) / 100 : 0
      // These 2 cannot be derived from daily aggregate data — show all-time values with a tag
      avgMessages   = g.kpi.avgMessages
      activeClients = g.kpi.activeClients
      dimmedKpis.add('avgMessages'); dimmedKpis.add('activeClients')
    } else {
      ;({ totalConversations, totalUsers, avgMessages, activeClients, avgConvsPerUser } = g.kpi)
    }

    return {
      kpi: { totalConversations, totalUsers, avgMessages, activeClients, avgConvsPerUser },
      dailyData,
      clientTable,
      topByConversations,
      scatterData,
      hasInstFilter,
      hasDateFilter,
      dimmedKpis,
    }
  }, [data, guideFilters])

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

  // ── Loading — show spinner whenever data isn't ready yet ──────────────────
  if (loading || !d) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading data from Google Sheets…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        <Header lastRefresh={d.kpi.lastRefresh} onRefresh={() => fetchData(true)} />

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-gray-200 rounded-xl mb-4 sm:mb-6 w-fit">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'voice'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mio Voice
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mio Guide
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'onboarding'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mio Onboarding
          </button>
        </div>

        {/* ── Mio Voice ── */}
        {activeTab === 'voice' && (
          <>
            <GlobalFilters
              dates={dateOptions}
              clients={clientOptions}
              filters={filters}
              onChange={setFilters}
            />
            <KPICards data={d.kpi} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <DailyVolumeChart data={d.dailyVolume} />
              <MergedClientsChart data={d.topClientsByVolume} />
            </div>
            <div className="mb-4">
              <LeadQualScatter data={d.scatterData} />
            </div>
            <div className="mb-4">
              <DaywiseChart data={d.daywiseData} clientColorMap={d.clientColorMap} />
            </div>
            <div className="mb-6">
              <ClientTable data={d.clientTable} />
            </div>
          </>
        )}

        {/* ── Mio Guide ── */}
        {activeTab === 'guide' && filteredGuide && (
          <>
            <GlobalFilters
              dates={guideDateOptions}
              clients={guideInstOptions}
              filters={guideFilters}
              onChange={setGuideFilters}
              clientLabel="All Institutes"
            />
            <GuideKPICards data={filteredGuide.kpi} dimmedKpis={filteredGuide.dimmedKpis} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <GuideDailyChart
                data={filteredGuide.dailyData}
                instFilterActive={filteredGuide.hasInstFilter}
                selectedInsts={guideFilters.clients}
              />
              <GuideTopInstitutesChart data={filteredGuide.topByConversations} />
            </div>
            <div className="mb-6">
              <GuideClientTable data={filteredGuide.clientTable} />
            </div>
          </>
        )}

        {activeTab === 'guide' && !filteredGuide && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            No Guide data available yet.
          </div>
        )}

        {/* ── Mio Onboarding ── */}
        {activeTab === 'onboarding' && data?.tracker && (
          <>
            {/* Sub-tab switcher */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
              <button
                onClick={() => setOnboardingSubTab('voice')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  onboardingSubTab === 'voice'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Voice Tracker
              </button>
              <button
                onClick={() => setOnboardingSubTab('guide')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  onboardingSubTab === 'guide'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Guide Tracker
              </button>
            </div>

            {onboardingSubTab === 'voice' && (
              <>
                <OnboardingKPICards kpi={data.tracker.voice.kpi} type="voice" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <OnboardingStatusChart data={data.tracker.voice.byStatus} title="Voice — Status Breakdown" />
                  <OnboardingLastFiveLive data={data.tracker.voice.lastFiveLive} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <OnboardingMonthAvg data={data.tracker.voice.monthAvg} />
                  <OnboardingAgeingMatrix data={data.tracker.voice.ageingMatrix} />
                </div>
                <div className="mb-6">
                  <OnboardingClientTable clients={data.tracker.voice.clients} type="voice" />
                </div>
              </>
            )}

            {onboardingSubTab === 'guide' && (
              <>
                <OnboardingKPICards kpi={data.tracker.guide.kpi} type="guide" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <OnboardingStatusChart data={data.tracker.guide.byStatus} title="Guide — Status Breakdown" />
                  <OnboardingLastFiveLive data={data.tracker.guide.lastFiveLive} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <OnboardingMonthAvg data={data.tracker.guide.monthAvg} />
                  <OnboardingAgeingMatrix data={data.tracker.guide.ageingMatrix} />
                </div>
                <div className="mb-6">
                  <OnboardingClientTable clients={data.tracker.guide.clients} type="guide" />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'onboarding' && !data?.tracker && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            No Onboarding data available yet.
          </div>
        )}

      </div>
    </div>
  )
}
