import { useState, useRef, useEffect } from 'react'
import { Filter, X, ChevronDown, Search } from 'lucide-react'

export default function GlobalFilters({ dates, clients, filters, onChange }) {
  const [clientOpen, setClientOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setClientOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredClients = clients.filter(c =>
    c.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const toggleClient = (name) => {
    const current = filters.clients
    const next = current.includes(name)
      ? current.filter(c => c !== name)
      : [...current, name]
    onChange({ ...filters, clients: next })
  }

  const selectAll  = () => onChange({ ...filters, clients: [] })
  const clearAll   = () => onChange({ dateFrom: '', dateTo: '', clients: [] })
  const hasFilters = filters.dateFrom || filters.dateTo || filters.clients.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 mb-4 flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Filter size={14} />
        <span className="text-xs font-medium">Filters</span>
      </div>

      {/* Date From */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500">From</label>
        <select
          value={filters.dateFrom}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-700"
        >
          <option value="">All dates</option>
          {dates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Date To */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500">To</label>
        <select
          value={filters.dateTo}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-700"
        >
          <option value="">All dates</option>
          {dates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Client multi-select */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setClientOpen(!clientOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 min-w-[160px] justify-between"
        >
          <span>
            {filters.clients.length === 0
              ? 'All Clients'
              : filters.clients.length === 1
                ? filters.clients[0]
                : `${filters.clients.length} clients selected`}
          </span>
          <ChevronDown size={12} />
        </button>

        {clientOpen && (
          <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-30">
            {/* Search */}
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
            {/* All option */}
            <div className="p-1 border-b border-gray-50">
              <button
                onClick={selectAll}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors font-medium
                  ${filters.clients.length === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Clients
              </button>
            </div>
            {/* Client list */}
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

      {/* Active filter chips */}
      {filters.clients.slice(0, 3).map(c => (
        <span key={c} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
          {c.length > 20 ? c.slice(0, 20) + '…' : c}
          <button onClick={() => toggleClient(c)} className="hover:text-blue-900">
            <X size={10} />
          </button>
        </span>
      ))}
      {filters.clients.length > 3 && (
        <span className="text-xs text-gray-500">+{filters.clients.length - 3} more</span>
      )}

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          <X size={12} />
          Clear filters
        </button>
      )}
    </div>
  )
}
