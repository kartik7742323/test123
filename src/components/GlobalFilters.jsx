import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, ChevronLeft, ChevronRight, Search, CalendarDays } from 'lucide-react'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function parseDataDate(s) {
  if (!s) return null
  const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
  const m = String(s).match(/^(\d+) (\w+)'(\d+)$/)
  if (!m) return null
  return new Date(2000 + parseInt(m[3]), MONTHS[m[2]], parseInt(m[1]))
}

function formatDataDate(d) {
  if (!d) return ''
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${M[d.getMonth()]}'${String(d.getFullYear()).slice(2)}`
}

function dateKey(d) { return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : '' }
function sameDay(a, b) { return a && b && dateKey(a) === dateKey(b) }

function DateRangePicker({ dates, dateFrom, dateTo, onApply, onClear }) {
  const [open,      setOpen]      = useState(false)
  const [tempFrom,  setTempFrom]  = useState(null)
  const [tempTo,    setTempTo]    = useState(null)
  const [hover,     setHover]     = useState(null)
  const [phase,     setPhase]     = useState(0) // 0=idle, 1=waiting for end
  const [viewDate,  setViewDate]  = useState(() => {
    const last = dates.length > 0 ? parseDataDate(dates[dates.length - 1]) : new Date()
    return last || new Date()
  })
  const ref = useRef(null)

  // Sync temp state when external filters change
  useEffect(() => {
    setTempFrom(dateFrom ? parseDataDate(dateFrom) : null)
    setTempTo(dateTo   ? parseDataDate(dateTo)   : null)
    setPhase(0)
  }, [dateFrom, dateTo, open])

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setPhase(0) } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Build calendar cells
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++)       cells.push(null)
  for (let d = 1; d <= daysInMonth; d++)   cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0)           cells.push(null)

  const availableKeys = new Set(dates.map(d => { const o = parseDataDate(d); return o ? dateKey(o) : null }).filter(Boolean))

  const effectiveTo = phase === 1 ? (hover || tempFrom) : tempTo

  const isStart   = (d) => d && tempFrom   && sameDay(d, tempFrom)
  const isEnd     = (d) => d && effectiveTo && sameDay(d, effectiveTo) && !sameDay(tempFrom, effectiveTo)
  const isInRange = (d) => {
    if (!d || !tempFrom || !effectiveTo) return false
    const ts = d.getTime()
    const [lo, hi] = tempFrom <= effectiveTo ? [tempFrom.getTime(), effectiveTo.getTime()] : [effectiveTo.getTime(), tempFrom.getTime()]
    return ts > lo && ts < hi
  }

  const handleDay = (d) => {
    if (!d) return
    if (phase === 0 || phase === undefined) {
      setTempFrom(d); setTempTo(null); setPhase(1)
    } else {
      const [from, to] = d >= tempFrom ? [tempFrom, d] : [d, tempFrom]
      setTempFrom(from); setTempTo(to); setPhase(0)
    }
  }

  const handleApply = () => {
    onApply(tempFrom ? formatDataDate(tempFrom) : '', tempTo ? formatDataDate(tempTo) : '')
    setOpen(false); setPhase(0)
  }

  const label = dateFrom && dateTo ? `${dateFrom}  →  ${dateTo}`
    : dateFrom ? `From ${dateFrom}`
    : dateTo   ? `Until ${dateTo}`
    : 'Date range'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
          dateFrom || dateTo
            ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <CalendarDays size={12} />
        <span>{label}</span>
        {dateFrom || dateTo
          ? <button onMouseDown={e => { e.stopPropagation(); onClear(); setOpen(false) }} className="ml-0.5 hover:text-blue-900"><X size={10} /></button>
          : <ChevronDown size={11} className="text-gray-400" />
        }
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 p-4 w-[280px]">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={14} className="text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-800">{MONTH_NAMES[month]} {year}</span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] text-gray-400 font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const hasData = availableKeys.has(dateKey(d))
              const start   = isStart(d)
              const end     = isEnd(d)
              const inRange = isInRange(d)
              return (
                <button
                  key={i}
                  disabled={false}
                  onClick={() => handleDay(d)}
                  onMouseEnter={() => phase === 1 && setHover(d)}
                  onMouseLeave={() => phase === 1 && setHover(null)}
                  className={[
                    'h-8 w-full text-xs font-medium transition-colors relative',
                    start || end
                      ? 'bg-blue-600 text-white rounded-full'
                      : inRange
                        ? 'bg-blue-100 text-blue-800 rounded-none'
                        : hasData
                          ? 'text-gray-800 hover:bg-blue-50 hover:rounded-full'
                          : 'text-gray-300 cursor-default',
                    (start && effectiveTo && !sameDay(tempFrom, effectiveTo)) ? 'rounded-l-full rounded-r-none' : '',
                    (end) ? 'rounded-r-full rounded-l-none' : '',
                  ].join(' ')}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Hint */}
          <p className="text-[10px] text-gray-400 text-center mt-3">
            {phase === 1 ? '🟦 Now click an end date' : 'Click a start date'}
          </p>

          {/* Apply button */}
          <button
            onClick={handleApply}
            className="mt-2 w-full py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Update filter
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main GlobalFilters ───────────────────────────────────────────────────────
export default function GlobalFilters({ dates, clients, filters, onChange }) {
  const [clientOpen,   setClientOpen]   = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setClientOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filteredClients = clients.filter(c => c.toLowerCase().includes(clientSearch.toLowerCase()))
  const toggleClient    = (name) => {
    const next = filters.clients.includes(name)
      ? filters.clients.filter(c => c !== name)
      : [...filters.clients, name]
    onChange({ ...filters, clients: next })
  }

  const hasFilters = filters.dateFrom || filters.dateTo || filters.clients.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 mb-4 flex items-center gap-2 sm:gap-3 flex-wrap">

      <div className="flex items-center gap-1.5 text-gray-500">
        <span className="text-xs font-medium text-gray-400">Filters</span>
      </div>

      {/* Calendar date picker */}
      <DateRangePicker
        dates={dates}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onApply={(from, to) => onChange({ ...filters, dateFrom: from, dateTo: to })}
        onClear={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}
      />

      {/* Divider */}
      <div className="w-px h-4 bg-gray-200" />

      {/* Client multi-select */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setClientOpen(!clientOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 min-w-[130px] justify-between"
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
                  type="text" placeholder="Search clients..."
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
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${filters.clients.length === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >All Clients</button>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filteredClients.map((c) => (
                <button key={c} onClick={() => toggleClient(c)}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${filters.clients.includes(c) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {filters.clients.includes(c) && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-700 truncate">{c}</span>
                </button>
              ))}
              {filteredClients.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No clients found</p>}
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
      {filters.clients.length > 2 && <span className="text-xs text-gray-500">+{filters.clients.length - 2} more</span>}

      {/* Clear all */}
      {hasFilters && (
        <button onClick={() => onChange({ dateFrom: '', dateTo: '', clients: [] })}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={12} /> Clear all
        </button>
      )}
    </div>
  )
}
