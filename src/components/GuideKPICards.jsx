import { MessageSquare, Users, BarChart2, Building2, Repeat2, ThumbsUp, ThumbsDown } from 'lucide-react'

function KPICard({ title, value, icon: Icon, valueColor = 'text-blue-600', subtitle, dimmed }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${valueColor}`}>{value}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>}
        {dimmed && <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">all-time</p>}
      </div>
      <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
        <Icon size={18} className="text-gray-400" />
      </div>
    </div>
  )
}

export default function GuideKPICards({ data, dimmedKpis = new Set() }) {
  const fmt = (n) => Number(n).toLocaleString()
  const fmtPct = (n) => n != null ? `${n}%` : '—'
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <KPICard title="Total Conversations"    value={fmt(data.totalConversations)} icon={MessageSquare} valueColor="text-blue-600"    dimmed={dimmedKpis.has('totalConversations')} />
      <KPICard title="Total Users Interacted" value={fmt(data.totalUsers)}         icon={Users}         valueColor="text-purple-600"  dimmed={dimmedKpis.has('totalUsers')} />
      <KPICard title="Avg Messages / Conv"    value={data.avgMessages}             icon={BarChart2}     valueColor="text-emerald-600" dimmed={dimmedKpis.has('avgMessages')} />
      <KPICard title="Active Institutes"      value={data.activeClients}           icon={Building2}     valueColor="text-amber-600"   dimmed={dimmedKpis.has('activeClients')} />
      <KPICard
        title="Avg Convs / User"
        value={data.avgConvsPerUser ?? '—'}
        icon={Repeat2}
        valueColor="text-rose-500"
        subtitle="return engagement"
        dimmed={dimmedKpis.has('avgConvsPerUser')}
      />
      <KPICard
        title="Helpful %"
        value={fmtPct(data.helpfulPct)}
        icon={ThumbsUp}
        valueColor="text-teal-600"
        subtitle={data.helpfulCount != null ? `${Number(data.helpfulCount).toLocaleString()} responses` : null}
        dimmed={dimmedKpis.has('helpfulPct')}
      />
      <KPICard
        title="Not Helpful %"
        value={fmtPct(data.notHelpfulPct)}
        icon={ThumbsDown}
        valueColor="text-orange-500"
        subtitle={data.notHelpfulCount != null ? `${Number(data.notHelpfulCount).toLocaleString()} responses` : null}
        dimmed={dimmedKpis.has('notHelpfulPct')}
      />
    </div>
  )
}
