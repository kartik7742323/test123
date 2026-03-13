import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import { Download } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="font-semibold text-gray-700 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-medium">
            {p.dataKey === 'connRate' ? `${p.value}%` : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  )
}

const fmtX = (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v

// Custom tick — always renders, never hidden
function CustomYTick({ x, y, payload }) {
  const name = String(payload?.value ?? '')
  // Split into two lines if too long
  const words  = name.split(' ')
  let line1 = '', line2 = ''
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= 22) line1 = (line1 + ' ' + w).trim()
    else line2 = (line2 + ' ' + w).trim()
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{name}</title>
      {line2 ? (
        <>
          <text x={-4} y={-6}  textAnchor="end" fill="#374151" fontSize={9.5} fontWeight={500}>{line1}</text>
          <text x={-4} y={6}   textAnchor="end" fill="#374151" fontSize={9.5}>{line2}</text>
        </>
      ) : (
        <text x={-4} y={4} textAnchor="end" fill="#374151" fontSize={9.5} fontWeight={500}>{line1}</text>
      )}
    </g>
  )
}

export default function MergedClientsChart({ data }) {
  // 46px per client gives enough room for 2 bars + label
  const chartHeight = Math.max(420, (data?.length ?? 10) * 46 + 60)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Top 10 Clients — Calls, Connected &amp; Connection Rate
        </h3>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Download size={15} />
        </button>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 55, left: 4, bottom: 4 }}
          barCategoryGap="28%"
          barGap={3}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={fmtX}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={170}
            interval={0}
            tick={<CustomYTick />}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Bar dataKey="calls"     name="Calls Dialed" fill="#3b82f6" barSize={11} radius={[0, 3, 3, 0]} />
          <Bar dataKey="connected" name="Connected"    fill="#16a34a" barSize={11} radius={[0, 3, 3, 0]}>
            <LabelList
              dataKey="connRate"
              position="right"
              formatter={(v) => `${v}%`}
              style={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
