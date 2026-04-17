import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
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
  if (granularity === 'week')    return `W${isoWeek(d)} ${MON[d.getMonth()]}'${yr}`
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
    if (!buckets[key]) { buckets[key] = { date: key, conversations: 0, usersInteracted: 0 }; order.push(key) }
    buckets[key].conversations   += row.conversations   || 0
    buckets[key].usersInteracted += row.usersInteracted || 0
  })
  return order.map(k => buckets[k])
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const convs = payload.find(p => p.dataKey === 'conversations')
  const users = payload.find(p => p.dataKey === 'usersInteracted')
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 min-w-[180px]">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{label}</p>
      {convs && (
        <div className="flex items-center justify-between gap-6 mb-1">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#2563eb' }} />
            Conversations
          </span>
          <span className="text-xs font-bold text-blue-600">{Number(convs.value).toLocaleString()}</span>
        </div>
      )}
      {users && (
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#f97316' }} />
            Users Interacted
          </span>
          <span className="text-xs font-bold text-orange-500">{Number(users.value).toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

const fmtY = (v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v

const GRANULARITIES = [
  { key: 'day',   label: 'Day' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
]

export default function GuideDailyChart({ data, instFilterActive, selectedInsts = [] }) {
  const [granularity, setGranularity] = useState('week')

  const chartData = useMemo(() => aggregate(data || [], granularity), [data, granularity])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Daily Engagement Trends</h3>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
            <Download size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Hover over a point to see both values</p>
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
        </div>
      </div>
      {instFilterActive && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg mb-3 text-xs text-amber-700">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#d97706" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Chart shows overall daily totals. Per-institute daily breakdown requires date-level data per institute in the sheet.
          {selectedInsts.length > 0 && <span className="font-semibold ml-1">Institute filter applied to table &amp; KPIs.</span>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="conversations"
            name="No of Conversations"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="usersInteracted"
            name="Users Interacted"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
