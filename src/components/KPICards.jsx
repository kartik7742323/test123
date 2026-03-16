import { Phone, PhoneCall, Target, Users, Clock } from 'lucide-react'

function KPICard({ title, value, icon: Icon, valueColor = 'text-blue-600' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${valueColor}`}>{value}</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
        <Icon size={18} className="text-gray-400" />
      </div>
    </div>
  )
}

export default function KPICards({ data }) {
  const fmt = (n) => n.toLocaleString()
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <KPICard title="Total Calls Dialed" value={fmt(data.totalCallsDialed)} icon={Phone}     valueColor="text-blue-600" />
      <KPICard title="Total Connected"    value={fmt(data.totalConnected)}   icon={PhoneCall} valueColor="text-purple-600" />
      <KPICard title="Overall Conn. Rate" value={`${data.overallConnRate}%`} icon={Target}    valueColor="text-green-600" />
      <KPICard title="Leads Qualified"    value={fmt(data.leadsQualified)}   icon={Users}     valueColor="text-rose-500" />
      <KPICard title="Avg Call Duration"  value={data.avgCallDuration}       icon={Clock}     valueColor="text-amber-600" />
    </div>
  )
}
