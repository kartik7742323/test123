import { useState } from 'react'
import { Search, Download, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react'

function ConnRateBadge({ rate }) {
  let cls = rate >= 40 ? 'bg-green-100 text-green-700'
    : rate >= 33 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

// Format decimal minutes → "Xm Ys"
function fmtDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const totalSec = Math.round(parseFloat(minutes) * 60)
  if (isNaN(totalSec)) return '—'
  return `${Math.floor(totalSec / 60)}m ${String(totalSec % 60).padStart(2, '0')}s`
}

const SORT_KEYS = {
  'Client Name':  { key: 'name',           type: 'str' },
  'Use Case':     { key: 'useCase',         type: 'str' },
  'Live Date':    { key: 'liveDate',        type: 'str' },
  'Total Calls':  { key: 'totalCalls',      type: 'num' },
  'Connected':    { key: 'connected',       type: 'num' },
  'Conn Rate':    { key: 'connRate',        type: 'num' },
  'Qualified':    { key: 'qualified',       type: 'num' },
  'Qual Rate':    { key: 'qualRate',        type: 'num' },
  'Avg Duration': { key: 'avgDurationMin',  type: 'num' },
}

export default function ClientTable({ data }) {
  const [search, setSearch]   = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const filtered = data.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.useCase.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const { key, type } = SORT_KEYS[sortCol]
        const av = a[key], bv = b[key]
        const cmp = type === 'num' ? av - bv : String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  // Avg duration = average of per-client avg durations (avgDurationMin is raw minutes)
  const avgDurMin = sorted.length > 0
    ? sorted.reduce((s, r) => s + (r.avgDurationMin || 0), 0) / sorted.length
    : 0

  // Totals / averages row
  const totalCallsSum  = sorted.reduce((s, r) => s + r.totalCalls, 0)
  const totalConnected = sorted.reduce((s, r) => s + r.connected,  0)
  const totalRow = {
    totalCalls:  totalCallsSum,
    connected:   totalConnected,
    connRate:    totalCallsSum > 0
      ? Math.round(totalConnected / totalCallsSum * 1000) / 10
      : 0,
    qualified:   sorted.reduce((s, r) => s + r.qualified, 0),
    avgDuration: fmtDuration(avgDurMin),
  }

  const handleExport = () => {
    const headers = ['Client Name', 'Use Case', 'Live Date', 'Total Calls', 'Connected', 'Conn Rate', 'Qualified', 'Qual Rate', 'Avg Duration']
    const csv = [
      headers.join(','),
      ...sorted.map((r) =>
        [r.name, r.useCase, r.liveDate, r.totalCalls, r.connected, `${r.connRate}%`, r.qualified, `${r.qualRate}%`, r.avgDuration].join(',')
      ),
      ['Total/Average', '—', '—', totalRow.totalCalls, totalRow.connected, `${totalRow.connRate}%`, totalRow.qualified, `${totalRow.qualRate}%`, '—'].join(','),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'client-performance.csv'
    a.click()
  }

  const COLS = ['Client Name', 'Use Case', 'Live Date', 'Total Calls', 'Connected', 'Conn Rate', 'Qualified', 'Qual Rate', 'Avg Duration']

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Client Performance Detail</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients, use cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-52"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {COLS.map((h) => {
                const active = sortCol === h
                return (
                  <th
                    key={h}
                    onClick={() => handleSort(h)}
                    className="text-left py-2.5 px-2 font-medium whitespace-nowrap cursor-pointer select-none group"
                  >
                    <span className={`inline-flex items-center gap-0.5 ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      {h}
                      <span className="ml-0.5">
                        {active
                          ? (sortDir === 'asc'
                              ? <ChevronUp size={11} className="text-blue-600" />
                              : <ChevronDownIcon size={11} className="text-blue-600" />)
                          : <ChevronDownIcon size={11} className="text-gray-300 group-hover:text-gray-400" />
                        }
                      </span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-2 font-medium text-gray-800">{r.name}</td>
                <td className="py-3 px-2 text-gray-500">{r.useCase}</td>
                <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{r.liveDate}</td>
                <td className="py-3 px-2 text-gray-700">{r.totalCalls.toLocaleString()}</td>
                <td className="py-3 px-2 text-gray-700">{r.connected.toLocaleString()}</td>
                <td className="py-3 px-2"><ConnRateBadge rate={r.connRate} /></td>
                <td className="py-3 px-2 text-gray-700">{r.qualified}</td>
                <td className="py-3 px-2 text-gray-600">{r.qualRate}%</td>
                <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{r.avgDuration}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-gray-400">No results found.</td></tr>
            )}
            {/* Totals row */}
            {sorted.length > 0 && (
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="py-3 px-2 text-gray-700">Total / Average</td>
                <td className="py-3 px-2 text-gray-400">—</td>
                <td className="py-3 px-2 text-gray-400">—</td>
                <td className="py-3 px-2 text-gray-700">{totalRow.totalCalls.toLocaleString()}</td>
                <td className="py-3 px-2 text-gray-700">{totalRow.connected.toLocaleString()}</td>
                <td className="py-3 px-2"><ConnRateBadge rate={totalRow.connRate} /></td>
                <td className="py-3 px-2 text-gray-700">{totalRow.qualified.toLocaleString()}</td>
                <td className="py-3 px-2 text-gray-400">—</td>
                <td className="py-3 px-2 text-amber-700 font-semibold whitespace-nowrap">{totalRow.avgDuration}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">Showing {sorted.length} of {data.length} clients</p>
    </div>
  )
}
