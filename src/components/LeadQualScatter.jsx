import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Label,
} from 'recharts'
import { Download } from 'lucide-react'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="custom-tooltip">
      <p className="font-semibold text-gray-700 text-xs mb-1">{d.client}</p>
      <p className="text-xs text-gray-600">Conn. Rate: <span className="font-medium">{d.connRate}%</span></p>
      <p className="text-xs text-gray-600">Qual. Rate: <span className="font-medium">{d.qualRate}%</span></p>
    </div>
  )
}

export default function LeadQualScatter({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Lead Qualification vs Connection Rate</h3>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Download size={15} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 20, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            dataKey="connRate"
            name="Connection Rate"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            domain={[0, 80]}
            ticks={[0, 20, 40, 60, 80]}
          >
            <Label value="Connection Rate (%)" position="insideBottom" offset={-18} style={{ fontSize: 11, fill: '#94a3b8' }} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="qualRate"
            name="Qualification Rate"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            domain={[0, 12]}
            ticks={[0, 3, 6, 9, 12]}
          >
            <Label value="Qualification Rate (%)" angle={-90} position="insideLeft" offset={-5} style={{ fontSize: 11, fill: '#94a3b8' }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill="#3b82f6">
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
