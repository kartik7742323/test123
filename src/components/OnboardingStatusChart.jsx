import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CATEGORY_COLOR = {
  live:       '#16a34a',
  inprogress: '#2563eb',
  onhold:     '#d97706',
  churned:    '#dc2626',
}

const STATUS_LABEL = {
  'H. Live':                        { label: 'Live',                     category: 'live' },
  'G. Live':                        { label: 'Live',                     category: 'live' },
  'L. Churn':                       { label: 'Churn',                    category: 'churned' },
  'K. Churn':                       { label: 'Churn',                    category: 'churned' },
  'K. On-Hold':                     { label: 'On Hold',                  category: 'onhold' },
  'I. On-hold':                     { label: 'On Hold',                  category: 'onhold' },
  'A. KOC Pending':                 { label: 'KOC Pending',              category: 'inprogress' },
  'B. KOC Scheduled':               { label: 'KOC Scheduled',            category: 'inprogress' },
  'C. RGS Pending':                 { label: 'RGS Pending',              category: 'inprogress' },
  'C. Setup Pending':               { label: 'Setup Pending',            category: 'inprogress' },
  'D. Agent Creation':              { label: 'Agent Creation',           category: 'inprogress' },
  'E. Demo/Live call Scheduled':    { label: 'Demo Scheduled',           category: 'inprogress' },
  'F. Agent Alteration':            { label: 'Agent Alteration',         category: 'inprogress' },
  'F. Code Placement Pending':      { label: 'Code Placement Pending',   category: 'inprogress' },
  'G. Client Testing':              { label: 'Client Testing',           category: 'inprogress' },
  'I. POC Delivered':               { label: 'POC Delivered',            category: 'inprogress' },
}

function getColor(status) {
  const meta = STATUS_LABEL[status]
  if (!meta) return '#94a3b8'
  return CATEGORY_COLOR[meta.category] ?? '#94a3b8'
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{d.status}</p>
      <p className="text-gray-500">{d.count} client{d.count !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function OnboardingStatusChart({ data, title }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="status"
            width={160}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={s => STATUS_LABEL[s]?.label ?? s}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
