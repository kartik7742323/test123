import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white p-2 border border-gray-300 rounded shadow-md text-xs">
      <p className="font-semibold text-gray-700">{data.name}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {Math.round(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function CustomYTick({ x, y, payload }) {
  const text = String(payload.value || '')
  const lines = []
  let line = ''
  text.split(' ').forEach(word => {
    if ((line + ' ' + word).length <= 22) {
      line += (line ? ' ' : '') + word
    } else {
      if (line) lines.push(line)
      line = word
    }
  })
  if (line) lines.push(line)

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((l, i) => (
        <text key={i} x={0} y={i * 14} textAnchor="end" fontSize={12} fill="#666">
          {l}
        </text>
      ))}
    </g>
  )
}

export default function GuideMessagesChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <h3 className="font-semibold text-gray-700 mb-4">Messages: Helpful vs Not Helpful</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  // Compute counts from percentages and total messages
  const chartData = data
    .map(d => ({
      name: d.name,
      'Total Messages': d.totalMessages || 0,
      'Helpful': Math.round((d.totalMessages * (d.helpfulPct || 0)) / 100),
      'Not Helpful': Math.round((d.totalMessages * (d.notHelpfulPct || 0)) / 100),
    }))
    .filter(d => d['Total Messages'] > 0)
    .sort((a, b) => b['Total Messages'] - a['Total Messages'])
    .slice(0, 15)

  const height = Math.max(380, chartData.length * 46 + 60)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-700 mb-4">Messages: Helpful vs Not Helpful</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 170, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#999" />
          <YAxis dataKey="name" type="category" width={170} tick={<CustomYTick />} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Total Messages" fill="#3b82f6" />
          <Bar dataKey="Helpful" fill="#10b981" />
          <Bar dataKey="Not Helpful" fill="#ef4444" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
