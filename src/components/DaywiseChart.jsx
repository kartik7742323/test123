import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Download, ChevronDown } from 'lucide-react'

function fmtY(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return v
}

export default function DaywiseChart({ data, clientColorMap }) {
  const clients = Object.keys(clientColorMap || {})
  const [selectedClient, setSelectedClient] = useState('All Clients')
  const [dropdownOpen, setDropdownOpen]     = useState(false)

  const options = ['All Clients', ...clients]
  const visibleClients = selectedClient === 'All Clients' ? clients : [selectedClient]

  // Max Y value for domain
  const maxVal = Math.max(...(data || []).map(d =>
    visibleClients.reduce((s, c) => s + (d[c] || 0), 0)
  ), 0)
  const yMax = Math.ceil(maxVal / 3000) * 3000 || 12000

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Daywise Calls Dialed</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>{selectedClient}</span>
              <ChevronDown size={12} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSelectedClient(opt); setDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors
                      ${opt === selectedClient ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
            <Download size={15} />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            domain={[0, yMax]}
          />
          <Tooltip
            formatter={(value, name) => [value.toLocaleString(), name]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 12 }}
            iconSize={10}
            iconType="square"
          />
          {visibleClients.map((client) => (
            <Bar
              key={client}
              dataKey={client}
              stackId="a"
              fill={clientColorMap[client]}
              barSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
