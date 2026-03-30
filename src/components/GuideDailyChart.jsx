import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Download } from 'lucide-react'

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

export default function GuideDailyChart({ data, instFilterActive, selectedInsts = [] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Daily Engagement Trends</h3>
          <p className="text-xs text-gray-400 mt-0.5">Hover over a point to see both values</p>
        </div>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Download size={15} />
        </button>
      </div>
      {instFilterActive && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg mb-3 text-xs text-amber-700">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#d97706" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Chart shows overall daily totals. Per-institute daily breakdown requires date-level data per institute in the sheet.
          {selectedInsts.length > 0 && <span className="font-semibold ml-1">Institute filter applied to table &amp; KPIs.</span>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
