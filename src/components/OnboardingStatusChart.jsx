import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STATUS_META = {
  'H. Live':                     { label: 'Live',                   color: '#16a34a' },
  'G. Live':                     { label: 'Live',                   color: '#16a34a' },
  'I. POC Delivered':            { label: 'POC Delivered',          color: '#0891b2' },
  'G. Client Testing':           { label: 'Client Testing',         color: '#0284c7' },
  'F. Agent Alteration':         { label: 'Agent Alteration',       color: '#6366f1' },
  'F. Code Placement Pending':   { label: 'Code Placement',         color: '#6366f1' },
  'E. Demo/Live call Scheduled': { label: 'Demo Scheduled',         color: '#8b5cf6' },
  'D. Agent Creation':           { label: 'Agent Creation',         color: '#2563eb' },
  'C. RGS Pending':              { label: 'RGS Pending',            color: '#d97706' },
  'C. Setup Pending':            { label: 'Setup Pending',          color: '#d97706' },
  'B. KOC Scheduled':            { label: 'KOC Scheduled',          color: '#b45309' },
  'A. KOC Pending':              { label: 'KOC Pending',            color: '#92400e' },
  'K. On-Hold':                  { label: 'On Hold',                color: '#ef4444' },
  'I. On-hold':                  { label: 'On Hold',                color: '#ef4444' },
  'L. Churn':                    { label: 'Churned',                color: '#9ca3af' },
  'K. Churn':                    { label: 'Churned',                color: '#9ca3af' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{STATUS_META[d.status]?.label ?? d.status.replace(/^[A-Z]\.\s*/, '')}</p>
      <p className="text-gray-500">{d.count} client{d.count !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function OnboardingStatusChart({ data, title }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title ?? 'Status Breakdown'}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="status"
            width={150}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={s => STATUS_META[s]?.label ?? s.replace(/^[A-Z]\.\s*/, '')}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} label={{ position: 'right', fontSize: 11, fill: '#64748b' }}>
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_META[entry.status]?.color ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
