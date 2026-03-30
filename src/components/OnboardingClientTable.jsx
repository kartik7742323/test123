import { useState } from 'react'

const VOICE_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'live',       label: 'Live' },
  { key: 'testing',    label: 'Client Testing' },
  { key: 'alteration', label: 'Agent Alteration' },
  { key: 'agent',      label: 'Agent Creation' },
  { key: 'rgs',        label: 'RGS Pending' },
  { key: 'koc',        label: 'KOC Pending' },
  { key: 'hold',       label: 'On Hold' },
  { key: 'churn',      label: 'Churn' },
]

const GUIDE_TABS = [
  { key: 'all',   label: 'All' },
  { key: 'live',  label: 'Live' },
  { key: 'code',  label: 'Code Placement' },
  { key: 'setup', label: 'Setup Pending' },
  { key: 'koc',   label: 'KOC Pending' },
  { key: 'hold',  label: 'On Hold' },
  { key: 'churn', label: 'Churn' },
]

const STATUS_BADGE = {
  'H. Live':                     'bg-emerald-100 text-emerald-700',
  'G. Live':                     'bg-emerald-100 text-emerald-700',
  'G. Client Testing':           'bg-cyan-100 text-cyan-700',
  'F. Agent Alteration':         'bg-indigo-100 text-indigo-700',
  'F. Code Placement Pending':   'bg-indigo-100 text-indigo-700',
  'D. Agent Creation':           'bg-blue-100 text-blue-700',
  'E. Demo/Live call Scheduled': 'bg-purple-100 text-purple-700',
  'I. POC Delivered':            'bg-teal-100 text-teal-700',
  'C. RGS Pending':              'bg-amber-100 text-amber-700',
  'C. Setup Pending':            'bg-amber-100 text-amber-700',
  'B. KOC Scheduled':            'bg-orange-100 text-orange-700',
  'A. KOC Pending':              'bg-orange-100 text-orange-700',
  'K. On-Hold':                  'bg-red-100 text-red-600',
  'I. On-hold':                  'bg-red-100 text-red-600',
  'L. Churn':                    'bg-gray-100 text-gray-500',
  'K. Churn':                    'bg-gray-100 text-gray-500',
}

function AgeingChip({ days }) {
  if (!days && days !== 0) return <span className="text-gray-400">—</span>
  const cls = days >= 30 ? 'bg-red-100 text-red-700'
            : days >= 15 ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{days}d</span>
}

function matchesTab(c, key, type) {
  const s = c.status || ''
  if (key === 'all')        return true
  if (key === 'live')       return s === 'H. Live' || s === 'G. Live'
  if (key === 'hold')       return s.includes('On-Hold') || s.includes('On-hold')
  if (key === 'churn')      return s.includes('Churn')
  if (key === 'koc')        return s.includes('KOC')
  if (type === 'voice') {
    if (key === 'testing')    return s.includes('Client Testing')
    if (key === 'alteration') return s.includes('Agent Alteration')
    if (key === 'agent')      return s.includes('Agent Creation')
    if (key === 'rgs')        return s.includes('RGS Pending')
  }
  if (type === 'guide') {
    if (key === 'code')       return s.includes('Code Placement')
    if (key === 'setup')      return s.includes('Setup Pending')
  }
  return true
}

const PAGE_SIZE = 15

export default function OnboardingClientTable({ clients, type }) {
  const [tab, setTab]       = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const tabs = type === 'voice' ? VOICE_TABS : GUIDE_TABS
  const isVoice = type === 'voice'

  const filtered = clients.filter(c => {
    const matchT = matchesTab(c, tab, type)
    const matchS = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
                   (c.merrittoPoc||'').toLowerCase().includes(search.toLowerCase())
    return matchT && matchS
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function changeTab(key) { setTab(key); setPage(1) }
  function changeSearch(v) { setSearch(v); setPage(1) }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Status tabs */}
      <div className="px-4 pt-4 pb-0 flex flex-wrap gap-1.5 border-b border-gray-100">
        {tabs.map(t => {
          const count = t.key === 'all' ? clients.length : clients.filter(c => matchesTab(c, t.key, type)).length
          return (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`mb-3 px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <input
          type="text"
          placeholder="Search institute or SPOC..."
          value={search}
          onChange={e => changeSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <span className="text-xs text-gray-400">{filtered.length} clients</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 w-8">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Institute</th>
              {isVoice && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Agent Type</th>}
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Onboarding Date</th>
              {isVoice && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">RGS Date</th>}
              {!isVoice && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Live Date</th>}
              {!isVoice && <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">TAT (days)</th>}
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">Ageing</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Meritto SPOC</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[200px]">
                  <span className="block truncate" title={c.name}>{c.name}</span>
                </td>
                {isVoice && (
                  <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[140px]">
                    <span className="block truncate" title={c.agentType}>{c.agentType || '—'}</span>
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {c.status.replace(/^[A-Z]\.\s*/, '') || '—'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{c.onboardingDate || '—'}</td>
                {isVoice && <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{c.rgsDate || '—'}</td>}
                {!isVoice && <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{c.liveDate || '—'}</td>}
                {!isVoice && <td className="px-4 py-2.5 text-right text-gray-600 text-xs font-medium">{c.tat || '—'}</td>}
                <td className="px-4 py-2.5 text-right"><AgeingChip days={c.ageing} /></td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{c.merrittoPoc || '—'}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={isVoice ? 8 : 8} className="px-4 py-10 text-center text-gray-400 text-sm">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-400">Page {page} of {totalPages} · {filtered.length} total</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
