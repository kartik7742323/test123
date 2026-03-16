import { useState, useRef, useEffect } from 'react'
import { Filter, X, ChevronDown, Search, Calendar } from 'lucide-react'

const PRESETS = [
  { label: 'All',     days: null },
  { label: 'Last 7D', days: 7   },
  { label: 'Last 14D',days: 14  },
  { label: 'Last 30D',days: 30  },
]

export default function GlobalFilters({ dates, clients, filters, onChange }) {
  const [clientOpen,   setClientOpen]   = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showCustom,   setShowCustom]   = useState(false)
  const dropdownRef = useRef(null)
  const customRef   = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setClientOpen(false)
      if (customRef.current   && !customRef.current.contains(e.target))   setShowCustom(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Detect which preset is currently active
  const activePreset = (() => {
    if (!filters.dateFrom && !filters.dateTo) return 'All'
    const sorted = [...dates]
    for (const p of PRESETS) {
      if (!p.days) continue
      const from = sorted[Math.max(0, sorted.length - p.days)]
      const to   = sorted[sorted.length - 1]
      if (filters.dateFrom === from && filters.dateTo === to) return p.label
    }
    return 'Custom'
  })()

  const applyPreset = (p) => {
    setShowCustom(false)
    if (!p.days) {
      onChange({ ...filters, dateFrom: '', dateTo: '' })
    } else {
      const sorted = [...dates]
      const from   = sorted[Math.max(0, sorted.length - p.days)]
      const to     = sorted[sorted.length - 1]
      onChange({ ...filters, dateFrom: from, dateTo: to })
    }
  }

  const filteredClients = clients.filter(c => c.toLowerCase().includes(clientSearch.toLowerCase()))
  const toggleClient    = (name) => {
    const next = filters.clients.includes(name)
      ? filters.clients.filter(c => c !== name)
      : [...filters.clients, name]
    onChange({ ...filters, clients: next })
  }
  const clearAll   = () => onChange({ dateFrom: '', dateTo: '', clients: [] })
  const hasFilters = filters.dateFrom || filters.dateTo || filters.clients.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 mb-4 flex items-center gap-2 sm:gap-3 flex-wrap">

      {/* Label */}
      <div className="flex items-center gap-1.5 text-gray-500">
        <Filter size={14} />
        <span className="text-xs font-medium">Filters</span>
      </div>

      {/* Date preset pills */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activePreset === p.label
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
        {/* Custom range button */}
        <div className="relative" ref={customRef}>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activePreset === 'Custom'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar size={11} />
            {activePreset === 'Custom'
              ? `${filters.dateFrom} → ${filters.dateTo}`
              : 'Custom'}
          </button>

          {showCustom && (
            <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-3 flex flex-col gap-2 min-w-[220px]">
              <p className="text-xs font-medium text-gray-600 mb-1">Custom date range</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-8">From</label>
                <select
                  value={filters.dateFrom}
                  onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-gray-700"
                >
                  <option value="">Start</option>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-8">To</label>
                <select
                  value={filters.dateTo}
                  onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-gray-700"
                >
                  <option value="">End</option>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button
                onClick={() => setShowCustom(false)}
                className="mt-1 w-full py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client multi-select */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setClientOpen(!clientOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 min-w-[140px] justify-between"
        >
          <span>
            {filters.clients.length === 0
              ? 'All Clients'
              : filters.clients.length === 1
                ? filters.clients[0].split(' ')[0] + '…'
                : `${filters.clients.length} clients`}
          </span>
          <ChevronDown size={12} />
        </button>

        {clientOpen && (
          <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-30">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-1 border-b border-gray-50">
              <button
                onClick={() => onChange({ ...filters, clients: [] })}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors font-medium
                  ${filters.clients.length === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Clients
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filteredClients.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleClient(c)}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                    ${filters.clients.includes(c) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {filters.clients.includes(c) && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-700 truncate">{c}</span>
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">No clients found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active client chips */}
      {filters.clients.slice(0, 2).map(c => (
        <span key={c} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
          {c.length > 18 ? c.slice(0, 18) + '…' : c}
          <button onClick={() => toggleClient(c)} className="hover:text-blue-900"><X size={10} /></button>
        </span>
      ))}
      {filters.clients.length > 2 && (
        <span className="text-xs text-gray-500">+{filters.clients.length - 2} more</span>
      )}

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  )
}
