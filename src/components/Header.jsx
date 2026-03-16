import { RefreshCw, Printer, Moon, ChevronDown } from 'lucide-react'

export default function Header({ lastRefresh, onRefresh }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mio Adoption Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of client performance and daily trends</p>
        <p className="text-xs text-gray-400 mt-0.5">Last refresh: {lastRefresh}</p>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
          <ChevronDown size={12} />
        </button>
        <button className="p-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <Printer size={16} />
        </button>
        <button className="p-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <Moon size={16} />
        </button>
      </div>
    </div>
  )
}
