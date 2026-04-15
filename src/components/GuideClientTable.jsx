import { useState, useRef, useEffect } from 'react'
import { Search, Download, ChevronUp, ChevronDown, X } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = String(status).toLowerCase()
  const cls = s.includes('live') ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{status}</span>
}

function fmtColVal(col, v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString()
}

function describeFilter(col, f) {
  if (!f) return ''
  const fmt = v => fmtColVal(col, v)
  switch (f.type) {
    case 'gt':        return `> ${fmt(f.value)}`
    case 'gte':       return `≥ ${fmt(f.value)}`
    case 'lt':        return `< ${fmt(f.value)}`
    case 'lte':       return `≤ ${fmt(f.value)}`
    case 'between':   return `${fmt(f.min)} – ${fmt(f.max)}`
    case 'top10':     return 'Top 10'
    case 'above_avg': return 'Above avg'
    case 'below_avg': return 'Below avg'
    case 'values':    return `${f.selected.length} selected`
    default:          return ''
  }
}

function passesNumFilter(f, value, allVals) {
  if (!f) return true
  const n = parseFloat(value)
  const avg = allVals.reduce((s, v) => s + v, 0) / allVals.length
  switch (f.type) {
    case 'gt':        return n >  parseFloat(f.value)
    case 'gte':       return n >= parseFloat(f.value)
    case 'lt':        return n <  parseFloat(f.value)
    case 'lte':       return n <= parseFloat(f.value)
    case 'between':   return n >= parseFloat(f.min) && n <= parseFloat(f.max)
    case 'top10': {
      const sorted = [...allVals].sort((a, b) => b - a)
      return n >= (sorted[Math.min(9, sorted.length - 1)] ?? -Infinity)
    }
    case 'above_avg': return n > avg
    case 'below_avg': return n < avg
    default:          return true
  }
}

// ── Column definitions ────────────────────────────────────────────────────────
const COLS = [
  { label: 'Institute',           key: 'name',            type: 'str' },
  { label: 'Status',              key: 'status',          type: 'str' },
  { label: 'Live Date',           key: 'liveDate',        type: 'str' },
  { label: 'Conversations',       key: 'conversations',   type: 'num', unit: '' },
  { label: 'Avg Messages / Conv', key: 'avgMessages',     type: 'num', unit: '' },
  { label: 'Users Interacted',    key: 'usersInteracted', type: 'num', unit: '' },
]

const NUM_OPTIONS = [
  { type: 'gt',        label: 'Greater than',             inputs: 1 },
  { type: 'gte',       label: 'Greater than or equal to', inputs: 1 },
  { type: 'lt',        label: 'Less than',                inputs: 1 },
  { type: 'lte',       label: 'Less than or equal to',    inputs: 1 },
  { type: 'between',   label: 'Between',                  inputs: 2 },
  { type: 'top10',     label: 'Top 10',                   inputs: 0 },
  { type: 'above_avg', label: 'Above average',            inputs: 0 },
  { type: 'below_avg', label: 'Below average',            inputs: 0 },
]

// ── Numeric filter dropdown ───────────────────────────────────────────────────
function NumericFilter({ col, data, active, onApply, onClear, onClose, alignRight }) {
  const allVals = data.map(r => r[col.key]).filter(v => typeof v === 'number' && !isNaN(v))
  const avg  = allVals.length ? allVals.reduce((s, v) => s + v, 0) / allVals.length : 0
  const maxV = allVals.length ? Math.max(...allVals) : 0
  const minV = allVals.length ? Math.min(...allVals) : 0

  const [sel, setSel] = useState(active?.type ?? null)
  const [in1, setIn1] = useState(String(active?.value ?? active?.min ?? ''))
  const [in2, setIn2] = useState(String(active?.max ?? ''))

  const opt = NUM_OPTIONS.find(o => o.type === sel)
  const canApply = sel && (
    opt?.inputs === 0 ||
    (opt?.inputs === 1 && in1 !== '') ||
    (opt?.inputs === 2 && in1 !== '' && in2 !== '')
  )

  const handleApply = () => {
    if (!sel) { onClear(); onClose(); return }
    const f = opt?.inputs === 2
      ? { type: sel, min: in1, max: in2 }
      : { type: sel, value: in1 }
    onApply(f); onClose()
  }

  return (
    <div
      className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 w-64 ${alignRight ? 'right-0' : 'left-0'}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-3 pt-2.5 pb-2 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{col.label} Filter</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Range: {minV.toLocaleString()} – {maxV.toLocaleString()} · Avg: {Math.round(avg * 10) / 10}
        </p>
      </div>
      <div className="p-2 space-y-0.5">
        {NUM_OPTIONS.map(o => (
          <label key={o.type} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${sel === o.type ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <input
              type="radio" name={`nf-guide-${col.key}`} checked={sel === o.type}
              onChange={() => { setSel(o.type); setIn1(''); setIn2('') }}
              className="accent-blue-600 w-3 h-3 flex-shrink-0"
            />
            <span className={`text-xs flex-1 ${sel === o.type ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{o.label}</span>
            {sel === o.type && o.inputs >= 1 && (
              <div className="flex items-center gap-1">
                <input autoFocus type="number" value={in1} onChange={e => setIn1(e.target.value)}
                  placeholder="value"
                  className="w-20 px-2 py-0.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                />
                {o.inputs === 2 && (
                  <>
                    <span className="text-[10px] text-gray-400">and</span>
                    <input type="number" value={in2} onChange={e => setIn2(e.target.value)}
                      placeholder="value"
                      className="w-20 px-2 py-0.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                    />
                  </>
                )}
              </div>
            )}
          </label>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-gray-100">
        <button onClick={() => { onClear(); onClose() }}
          className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
          Clear
        </button>
        <button onClick={handleApply} disabled={!canApply}
          className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
          Apply
        </button>
      </div>
    </div>
  )
}

// ── Text filter dropdown ──────────────────────────────────────────────────────
function TextFilter({ col, data, active, onApply, onClear, onClose, alignRight }) {
  const allVals = [...new Set(data.map(r => r[col.key]))].sort((a, b) => String(a).localeCompare(String(b)))
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(() =>
    active?.type === 'values' ? new Set(active.selected) : new Set(allVals.map(String))
  )

  const visible     = allVals.filter(v => String(v).toLowerCase().includes(search.toLowerCase()))
  const allChecked  = visible.length > 0 && visible.every(v => selected.has(String(v)))
  const someChecked = visible.some(v => selected.has(String(v)))

  const toggle    = v => { const s = new Set(selected); s.has(String(v)) ? s.delete(String(v)) : s.add(String(v)); setSelected(s) }
  const toggleAll = () => {
    const s = new Set(selected)
    allChecked ? visible.forEach(v => s.delete(String(v))) : visible.forEach(v => s.add(String(v)))
    setSelected(s)
  }

  const handleApply = () => {
    const isAll = allVals.every(v => selected.has(String(v)))
    if (isAll) onClear(); else onApply({ type: 'values', selected: [...selected] })
    onClose()
  }

  return (
    <div
      className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 w-56 ${alignRight ? 'right-0' : 'left-0'}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{col.label} Filter</p>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input autoFocus type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200" />
        </div>
      </div>
      <div className="px-2 pb-1.5 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
          <input type="checkbox" checked={allChecked}
            ref={el => { if (el) el.indeterminate = !allChecked && someChecked }}
            onChange={toggleAll} className="w-3 h-3 accent-blue-600 cursor-pointer" />
          <span className="text-xs font-medium text-gray-600">Select All</span>
          <span className="ml-auto text-[10px] text-gray-400">{selected.size}/{allVals.length}</span>
        </label>
      </div>
      <div className="max-h-44 overflow-y-auto p-1.5">
        {visible.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No values</p>}
        {visible.map(v => (
          <label key={String(v)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
            <input type="checkbox" checked={selected.has(String(v))} onChange={() => toggle(v)}
              className="w-3 h-3 accent-blue-600 cursor-pointer flex-shrink-0" />
            <span className="text-xs text-gray-700 truncate">{String(v)}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-gray-100">
        <button onClick={() => { onClear(); onClose() }}
          className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">Clear</button>
        <button onClick={handleApply}
          className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">Apply</button>
      </div>
    </div>
  )
}

// ── Main Table ────────────────────────────────────────────────────────────────
export default function GuideClientTable({ data }) {
  const [search,     setSearch]     = useState('')
  const [sortCol,    setSortCol]    = useState('conversations')
  const [sortDir,    setSortDir]    = useState('desc')
  const [colFilters, setColFilters] = useState({})
  const [filterOpen, setFilterOpen] = useState(null)
  const tableRef = useRef(null)

  useEffect(() => {
    const h = e => { if (tableRef.current && !tableRef.current.contains(e.target)) setFilterOpen(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSort  = key => { setSortCol(s => { if (s === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else setSortDir('desc'); return key }); setFilterOpen(null) }
  const setFilter   = (key, f) => setColFilters(prev => ({ ...prev, [key]: f }))
  const clearFilter = key => setColFilters(prev => { const n = { ...prev }; delete n[key]; return n })
  const clearAll    = () => { setColFilters({}); setSearch('') }

  const activeFilterCount = Object.keys(colFilters).length
  const hasAnyFilter = search || activeFilterCount > 0

  // 1. Global search
  const afterSearch = data.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase()) ||
    String(r.liveDate || '').toLowerCase().includes(search.toLowerCase())
  )

  // 2. Column filters
  const afterColFilter = afterSearch.filter(r =>
    COLS.every(col => {
      const f = colFilters[col.key]
      if (!f) return true
      if (col.type === 'num') {
        const allVals = data.map(d => d[col.key]).filter(v => typeof v === 'number')
        return passesNumFilter(f, r[col.key], allVals)
      }
      if (f.type === 'values') return new Set(f.selected).has(String(r[col.key]))
      return true
    })
  )

  // 3. Sort
  const sorted = sortCol
    ? [...afterColFilter].sort((a, b) => {
        const col = COLS.find(c => c.key === sortCol)
        const cmp = col?.type === 'num' ? a[sortCol] - b[sortCol] : String(a[sortCol]).localeCompare(String(b[sortCol]))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : afterColFilter

  // Totals row
  const totalConvs  = sorted.reduce((s, r) => s + r.conversations, 0)
  const totalUsers  = sorted.reduce((s, r) => s + r.usersInteracted, 0)
  const avgMsgsAvg  = sorted.length > 0
    ? Math.round(sorted.reduce((s, r) => s + r.avgMessages, 0) / sorted.length * 10) / 10
    : 0

  const handleExport = () => {
    const headers = ['Institute', 'Status', 'Live Date', 'Conversations', 'Avg Messages/Conv', 'Users Interacted']
    const csv = [
      headers.join(','),
      ...sorted.map(r => [`"${r.name}"`, r.status, `"${r.liveDate || ''}"`, r.conversations, r.avgMessages, r.usersInteracted].join(',')),
      ['Total / Average', '—', '—', totalConvs, avgMsgsAvg, totalUsers].join(','),
    ].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'guide-institutes.csv',
    })
    a.click()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" ref={tableRef}>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-800">Institute Performance Detail</h3>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
          )}
          {hasAnyFilter && (
            <button onClick={clearAll} className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              <X size={11} /> Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search institutes…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 w-48" />
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(colFilters).map(([key, f]) => {
            const col = COLS.find(c => c.key === key)
            return (
              <span key={key} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">
                <span className="font-semibold">{col?.label}</span>
                <span className="text-blue-500">{describeFilter(col, f)}</span>
                <button onClick={() => clearFilter(key)} className="hover:text-blue-900 ml-0.5"><X size={9} /></button>
              </span>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-100">
              {COLS.map((col, i) => {
                const isSort   = sortCol === col.key
                const isFilter = !!colFilters[col.key]
                const isOpen   = filterOpen === col.key
                const alignRight = i >= COLS.length - 2
                return (
                  <th key={col.key} className="py-2.5 px-2 text-left whitespace-nowrap">
                    <div className="relative flex items-center gap-0.5 group">
                      <button onClick={() => handleSort(col.key)}
                        className={`flex items-center gap-0.5 font-medium transition-colors ${isSort ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        {col.label}
                        {isSort
                          ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                          : <ChevronDown size={11} className="text-gray-300 group-hover:text-gray-400" />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setFilterOpen(isOpen ? null : col.key) }}
                        className={`p-0.5 rounded transition-colors ml-0.5 ${isFilter ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <path d="M1 2.5h10M3 6h6M5 9.5h2"/>
                        </svg>
                      </button>
                      {isOpen && col.type === 'num' && (
                        <NumericFilter col={col} data={data} active={colFilters[col.key] ?? null}
                          onApply={f => setFilter(col.key, f)} onClear={() => clearFilter(col.key)}
                          onClose={() => setFilterOpen(null)} alignRight={alignRight} />
                      )}
                      {isOpen && col.type === 'str' && (
                        <TextFilter col={col} data={data} active={colFilters[col.key] ?? null}
                          onApply={f => setFilter(col.key, f)} onClear={() => clearFilter(col.key)}
                          onClose={() => setFilterOpen(null)} alignRight={alignRight} />
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
                <td className="py-3 px-2"><StatusBadge status={r.status} /></td>
                <td className="py-3 px-2 text-gray-700 whitespace-nowrap">{r.liveDate || '—'}</td>
                <td className="py-3 px-2 text-gray-700">{r.conversations.toLocaleString()}</td>
                <td className="py-3 px-2 text-gray-700">{r.avgMessages}</td>
                <td className="py-3 px-2 text-gray-700">{r.usersInteracted.toLocaleString()}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No results match the current filters.</td></tr>
            )}
            {sorted.length > 0 && (
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="py-3 px-2 text-gray-700">Total / Average</td>
                <td className="py-3 px-2 text-gray-400">—</td>
                <td className="py-3 px-2 text-gray-400">—</td>
                <td className="py-3 px-2 text-gray-700">{totalConvs.toLocaleString()}</td>
                <td className="py-3 px-2 text-gray-700">{avgMsgsAvg}</td>
                <td className="py-3 px-2 text-gray-700">{totalUsers.toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">Showing {sorted.length} of {data.length} institutes</p>
    </div>
  )
}
