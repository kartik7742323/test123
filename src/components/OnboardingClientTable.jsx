import { useState } from 'react'

const CATEGORY = {
  'H. Live':                     { label: 'Live',                   color: 'bg-emerald-100 text-emerald-700' },
  'G. Live':                     { label: 'Live',                   color: 'bg-emerald-100 text-emerald-700' },
  'L. Churn':                    { label: 'Churned',                color: 'bg-red-100 text-red-600' },
  'K. Churn':                    { label: 'Churned',                color: 'bg-red-100 text-red-600' },
  'K. On-Hold':                  { label: 'On Hold',                color: 'bg-amber-100 text-amber-700' },
  'I. On-hold':                  { label: 'On Hold',                color: 'bg-amber-100 text-amber-700' },
  'A. KOC Pending':              { label: 'KOC Pending',            color: 'bg-blue-100 text-blue-700' },
  'B. KOC Scheduled':            { label: 'KOC Scheduled',          color: 'bg-blue-100 text-blue-700' },
  'C. RGS Pending':              { label: 'RGS Pending',            color: 'bg-blue-100 text-blue-700' },
  'C. Setup Pending':            { label: 'Setup Pending',          color: 'bg-blue-100 text-blue-700' },
  'D. Agent Creation':           { label: 'Agent Creation',         color: 'bg-indigo-100 text-indigo-700' },
  'E. Demo/Live call Scheduled': { label: 'Demo Scheduled',         color: 'bg-purple-100 text-purple-700' },
  'F. Agent Alteration':         { label: 'Agent Alteration',       color: 'bg-violet-100 text-violet-700' },
  'F. Code Placement Pending':   { label: 'Code Placement Pending', color: 'bg-violet-100 text-violet-700' },
  'G. Client Testing':           { label: 'Client Testing',         color: 'bg-cyan-100 text-cyan-700' },
  'I. POC Delivered':            { label: 'POC Delivered',          color: 'bg-teal-100 text-teal-700' },
}

function StatusBadge({ status }) {
  const meta = CATEGORY[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  )
}

const STATUS_FILTERS = ['All', 'Live', 'In Progress', 'On Hold', 'Churned']

function getCategoryKey(status) {
  if (['H. Live', 'G. Live'].includes(status)) return 'Live'
  if (['L. Churn', 'K. Churn'].includes(status)) return 'Churned'
  if (['K. On-Hold', 'I. On-hold'].includes(status)) return 'On Hold'
  return 'In Progress'
}

export default function OnboardingClientTable({ clients, type }) {
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('All')
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 15

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || getCategoryKey(c.status) === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const isVoice = type === 'voice'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 items-center justify-between">
        <input
          type="text"
          placeholder="Search institute..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setStatus(f); setPage(1) }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                statusFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} clients</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-8">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Institute</th>
              {isVoice && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Setup Type</th>}
              {isVoice && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Agent Type</th>}
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Owner</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Onboarding Date</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Live Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Ageing (days)</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[220px]">
                  <span className="block truncate" title={c.name}>{c.name}</span>
                </td>
                {isVoice && <td className="px-4 py-2.5 text-gray-500 text-xs">{c.setupType || '-'}</td>}
                {isVoice && <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[140px]">
                  <span className="block truncate" title={c.agentType}>{c.agentType || '-'}</span>
                </td>}
                <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{c.owner || '-'}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{c.onboardingDate || '-'}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{c.liveDate || '-'}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 text-xs font-medium">{c.ageing ?? '-'}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={isVoice ? 9 : 7} className="px-4 py-8 text-center text-gray-400 text-sm">
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
          <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
