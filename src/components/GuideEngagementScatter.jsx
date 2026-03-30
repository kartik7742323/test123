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
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 min-w-[190px]">
      <p className="text-xs font-semibold text-gray-800 mb-2">{d.institute}</p>
      <div className="flex justify-between gap-4 mb-1">
        <span className="text-xs text-gray-500">Convs / User</span>
        <span className="text-xs font-bold text-blue-600">{d.convsPerUser}x</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-xs text-gray-500">Avg Messages / Conv</span>
        <span className="text-xs font-bold text-emerald-600">{d.avgMessages}</span>
      </div>
    </div>
  )
}

export default function GuideEngagementScatter({ data }) {
  const maxX = Math.ceil(Math.max(...data.map(d => d.convsPerUser), 2) * 1.1)
  const maxY = Math.ceil(Math.max(...data.map(d => d.avgMessages), 5) * 1.1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Engagement Quality Map</h3>
          <p className="text-xs text-gray-400 mt-0.5">Conversations per User vs Avg Messages — each dot is an institute</p>
        </div>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Download size={15} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 35 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            dataKey="convsPerUser"
            name="Convs per User"
            domain={[0, maxX]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          >
            <Label value="Conversations per User (return visits)" position="insideBottom" offset={-22} style={{ fontSize: 11, fill: '#94a3b8' }} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="avgMessages"
            name="Avg Messages / Conv"
            domain={[0, maxY]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          >
            <Label value="Avg Messages / Conv" angle={-90} position="insideLeft" offset={-5} style={{ fontSize: 11, fill: '#94a3b8' }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
