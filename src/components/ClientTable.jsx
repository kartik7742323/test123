import { useState, useRef, useEffect } from 'react'
import { Search, Download, ChevronUp, ChevronDown, X } from 'lucide-react'

function ConnRateBadge({ rate }) {
  const cls = rate >= 40 ? 'bg-green-100 text-green-700'
    : rate >= 33 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {rate.toFixed(1)}%
    </span>
  )
}

function fmtDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const totalSec = Math.round(parseFloat(minutes) * 60)
  if (isNaN(totalSec)) return '—'
  return `${Math.floor(totalSec / 60)}m ${String(totalSec % 60).padStart(2, '0')}s`
}

const COLS = [
  { label: 'Client Name',  key: 'name',          type: 'str' },
  { label: 'Use Case',     key: 'useCase',        type: 'str' },
  { label: 'Live Date',    key: 'liveDate',       type: 'str' },
  { label: 'Total Calls',  key: 'totalCalls',     type: 'num' },
  { label: 'Connected',    key: 'connected',      type: 'num' },
  { label: 'Conn Rate',    key: 'connRate',       type: 'num' },
  { label: 'Qualified',    key: 'qualified',      type: 'num' },
  { label: 'Qual Rate',    key: 'qualRate',       type: 'num' },
  { label: 'Avg Duration', key: 'avgDurationMin', type: 'num' },
]

function formatFilterLabel(col, val) {
  if (col.key === 'connRate' || col.key === 'qualRate') return `${val}%`
  if (col.key === 'avgDurationMin') {
    const totalSec = Math.round(parseFloat(val) * 60)
    if (isNaN(totalSec)) return String(val)
    return `${Math.floor(totalSec / 60)}m ${String(totalSec % 60).padStart(2, '0')}s`
  }
  return String(val)
}

// ── Per-column filter dropdown ────────────────────────────────────────────────
function FilterDropdown({ col, data, activeFilter, onApply, onClear, onClose, alignRight }) {
  const allValues = [...new Set(data.map(r => r[col.key]))]
    .sort(col.type === 'num' ? (a, b) => a - b : (a, b) => String(a).localeCompare(String(b)))

  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(() =>
    activeFilter ? new Set(activeFilter) : new Set(allValues.map(v => String(v)))
  )

  const visible   = allValues.filter(v =>
    formatFilterLabel(col, v).toLowerCase().includes(search.toLowerCase())
  )
  const allChecked  = visible.length > 0 && visible.every(v => selected.has(String(v)))
  const someChecked = visible.some(v => selected.has(String(v)))

  const toggle = (v) => {
    const s = new Set(selected)
    const k = String(v)
    s.has(k) ? s.delete(k) : s.add(k)
    setSelected(s)
  }

  const toggleAll = () => {
    const s = new Set(selected)
    if (allChecked) visible.forEach(v => s.delete(String(v)))
    else            visible.forEach(v => s.add(String(v)))
    setSelected(s)
  }

  const handleApply = () => {
    const isAll = allValues.every(v => selected.has(String(v)))
    if (isAll) onClear(); else onApply([...selected])
    onClose()
  }

  return (
    <div
      className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 w-56 ${alignRight ? 'right-0' : 'left-0'}`}
      onClick={e => e.stopPropagation()}
    >
      {/* Column label */}
      <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{col.label}</p>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search values..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Select all */}
      <div className="px-2 pb-1 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
          <input
            type="checkbox"
            checked={allChecked}
            ref={el => { if (el) el.indeterminate = !allChecked && someChecked }}
            onChange={toggleAll}
            className="w-3 h-3 accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-medium text-gray-600">Select All</span>
          <span className="ml-auto text-[10px] text-gray-400">{selected.size}/{allValues.length}</span>
        </label>
      </div>

      {/* Value list */}
      <div className="max-h-44 overflow-y-auto p-1.5">
        {visible.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">No values found</p>
        )}
        {visible.map(v => (
          <label key={String(v)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
            <input
              type="checkbox"
              checked={selected.has(String(v))}
              onChange={() => toggle(v)}
              className="w-3 h-3 accent-blue-600 cursor-pointer flex-shrink-0"
            />
            <span className="text-xs text-gray-700 truncate">{formatFilterLabel(col, v)}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-2 border-t border-gray-100">
        <button
          onClick={() => { onClear(); onClose() }}
          className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function ClientTable({ data }) {
  const [search,     setSearch]     = useState('')
  const [sortCol,    setSortCol]    = useState(null)
  const [sortDir,    setSortDir]    = useState('desc')
  const [colFilters, setColFilters] = useState({})  // { key: string[] }
  const [filterOpen, setFilterOpen] = useState(null)
  const tableRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (tableRef.current && !tableRef.current.contains(e.target)) setFilterOpen(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('desc') }
    setFilterOpen(null)
  }

  const setFilter   = (key, vals) => setColFilters(f => ({ ...f, [key]: vals }))
  const clearFilter = (key)       => setColFilters(f => { const n = { ...f }; delete n[key]; return n })
  const clearAll    = ()          => { setColFilters({}); setSearch('') }

  const hasAnyFilter = search || Object.keys(colFilters).length > 0

  // 1. Global search
  const afterSearch = data.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.useCase.toLowerCase().includes(search.toLowerCase())
  )

  // 2. Column filters
  const afterColFilter = afterSearch.filter(r =>
    Object.entries(colFilters).every(([key, vals]) => new Set(vals).has(String(r[key])))
  )

  // 3. Sort
  const sorted = sortCol
    ? [...afterColFilter].sort((a, b) => {
        const col = COLS.find(c => c.key === sortCol)
        const cmp = col?.type === 'num'
          ? a[sortCol] - b[sortCol]
          : String(a[sortCol]).localeCompare(String(b[sortCol]))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : afterColFilter

  // Totals row
  const avgDurMin      = sorted.length > 0 ? sorted.reduce((s, r) => s + (r.avgDurationMin || 0), 0) / sorted.length : 0
  const totalCallsSum  = sorted.reduce((s, r) => s + r.totalCalls, 0)
  const totalConnected = sorted.reduce((s, r) => s + r.connected, 0)
  const totalRow = {
    totalCalls:  totalCallsSum,
    connected:   totalConnected,
    connRate:    totalCallsSum > 0 ? Math.round(totalConnected / totalCallsSum * 1000) / 10 : 0,
    qualified:   sorted.reduce((s, r) => s + r.qualified, 0),
    avgDuration: fmtDuration(avgDurMin),
  }

  const handleExport = () => {
    const headers = ['Client Name', 'Use Case', 'Live Date', 'Total Calls', 'Connected', 'Conn Rate', 'Qualified', 'Qual Rate', 'Avg Duration']
    const csv = [
      headers.join(','),
      ...sorted.map(r =>
        [r.name, r.useCase, r.liveDate, r.totalCalls, r.connected, `${r.connRate}%`, r.qualified, `${r.qualRate}%`, r.avgDuration].join(',')
      ),
      ['Total/Average', '—', '—', totalRow.totalCalls, totalRow.connected, `${totalRow.connRate}%`, totalRow.qualified, '—', '—'].join(','),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'client-performance.csv'; a.click()
  }

  const activeFilterCount = Object.keys(colFilters).length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" ref={tableRef}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Client Performance Detail</h3>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
          {hasAnyFilter && (
            <button onClick={clearAll} className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 transition-colors ml-1">
              <X size={11} /> Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients, use cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-52"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={13} /><span>Export</span>
          </button>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(colFilters).map(([key, vals]) => {
            const col = COLS.find(c => c.key === key)
            return (
              <span key={key} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">
                <span className="font-semibold">{col?.label}:</span>
                <span>{vals.length} selected</span>
                <button onClick={() => clearFilter(key)} className="hover:text-blue-900 ml-0.5"><X size={9} /></button>
              </span>
            )
          })}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-100">
              {COLS.map((col, i) => {
                const isSort   = sortCol === col.key
                const isFilter = !!colFilters[col.key]
                const isOpen   = filterOpen === col.key
                const alignRight = i >= COLS.length - 3  // right-align dropdown for last 3 cols
                return (
                  <th key={col.key} className="py-2.5 px-2 text-left whitespace-nowrap">
                    <div className="relative flex items-center gap-0.5 group">
                      {/* Sort trigger */}
                      <button
                        onClick={() => handleSort(col.key)}
                        className={`flex items-center gap-0.5 font-medium transition-colors ${isSort ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {col.label}
                        {isSort
                          ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                          : <ChevronDown size={11} className="text-gray-300 group-hover:text-gray-400" />
                        }
                      </button>

                      {/* Filter trigger */}
                      <button
                        onClick={e => { e.stopPropagation(); setFilterOpen(isOpen ? null : col.key) }}
                        title="Filter"
                        className={`p-0.5 rounded transition-colors ${
                          isFilter
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {/* Funnel icon */}
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 2.5h10M3 6h6M5 9.5h2"/>
                        </svg>
                      </button>

                      {/* Dropdown */}
                      {isOpen && (
                        <FilterDropdown
                          col={col}
                          data={data}
                          activeFilter={colFilters[col.key] ?? null}
                          onApply={vals => setFilter(col.key, vals)}
                          onClear={() => clearFilter(col.key)}
                          onClose={() => setFilterOpen(null)}
                          alignRight={alignRight}
                        />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
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
