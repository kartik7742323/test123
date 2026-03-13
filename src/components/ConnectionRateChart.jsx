import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Download } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="font-semibold text-gray-700 text-xs mb-1">{label}</p>
      <p className="text-xs text-green-600 font-medium">
        Conn. Rate: {payload[0]?.value?.toFixed(1)}%
      </p>
    </div>
  )
}

export default function ConnectionRateChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Connection Rate by Client</h3>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Download size={15} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 55 }}
          barSize={18}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#94a3b8', angle: -45, textAnchor: 'end' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            domain={[0, 80]}
            ticks={[0, 20, 40, 60, 80]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill="#16a34a" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
