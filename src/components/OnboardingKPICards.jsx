export default function OnboardingKPICards({ kpi }) {
  const cards = [
    { label: 'Total Clients',  value: kpi.total,      color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
    { label: 'Live',           value: kpi.live,        color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'In Progress',    value: kpi.inProgress,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
    { label: 'On Hold',        value: kpi.onHold,      color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
    { label: 'Churned',        value: kpi.churned,     color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} ${c.border} border rounded-xl p-4`}>
          <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}
