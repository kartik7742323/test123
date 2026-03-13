import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Download } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="font-semibold text-gray-700 mb-1 text-xs">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
          {p.name}:{' '}
          <span className="font-medium">
            {p.dataKey === 'connRate' ? `${p.value}%` : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  )
}

const fmtY = (v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v

export default function DailyVolumeChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Daily Call Volume &amp; Connection Rate</h3>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Download size={15} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#93c5fd" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="connectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#86efac" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#86efac" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis yAxisId="left"  tickFormatter={fmtY} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area yAxisId="left"  type="monotone" dataKey="totalCalls"     name="Total Calls"     fill="url(#callsGrad)"     stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Area yAxisId="left"  type="monotone" dataKey="connectedCalls" name="Connected Calls" fill="url(#connectedGrad)" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="connRate"       name="Connected %"    stroke="#7c3aed" strokeWidth={2} dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
