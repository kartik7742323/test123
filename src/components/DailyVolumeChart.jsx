import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Download } from 'lucide-react'

// ── Date parsing ──────────────────────────────────────────────────────────────
const MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 }
function parseDate(s) {
  const m = String(s || '').match(/^(\d+)\s+([A-Za-z]+)'(\d+)$/)
  if (!m) return null
  return new Date(2000 + parseInt(m[3]), MONTHS[m[2]], parseInt(m[1]))
}

function isoWeek(d) {
  const tmp = new Date(d)
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7))
  const yearStart = new Date(tmp.getFullYear(), 0, 1)
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7)
}

function groupKey(d, granularity) {
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const yr  = String(d.getFullYear()).slice(2)
  if (granularity === 'week') {
    const w = isoWeek(d)
    return `W${w} ${MON[d.getMonth()]}'${yr}`
  }
  if (granularity === 'month')   return `${MON[d.getMonth()]}'${yr}`
  if (granularity === 'quarter') return `Q${Math.floor(d.getMonth() / 3) + 1}'${yr}`
  return null
}

function aggregate(data, granularity) {
  if (granularity === 'day') return data
  const buckets = {}
  const order   = []
  data.forEach(row => {
    const d = parseDate(row.date)
    if (!d) return
    const key = groupKey(d, granularity)
    if (!buckets[key]) { buckets[key] = { date: key, totalCalls: 0, connectedCalls: 0 }; order.push(key) }
    buckets[key].totalCalls     += row.totalCalls     || 0
    buckets[key].connectedCalls += row.connectedCalls || 0
  })
  return order.map(k => ({
    ...buckets[k],
    connRate: buckets[k].totalCalls > 0
      ? Math.round(buckets[k].connectedCalls / buckets[k].totalCalls * 1000) / 10
      : 0,
  }))
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
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

const GRANULARITIES = [
  { key: 'day',   label: 'Day' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
]

export default function DailyVolumeChart({ data }) {
  const [granularity, setGranularity] = useState('week')

  const chartData = useMemo(() => aggregate(data || [], granularity), [data, granularity])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Daily Call Volume &amp; Connection Rate</h3>
        <div className="flex items-center gap-2">
          {/* Granularity toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {GRANULARITIES.map(g => (
              <button
                key={g.key}
                onClick={() => setGranularity(g.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  granularity === g.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
            <Download size={15} />
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
