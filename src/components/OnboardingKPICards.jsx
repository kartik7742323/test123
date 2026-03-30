export default function OnboardingKPICards({ kpi, type }) {
  const isVoice = type === 'voice'
  const cards = [
    {
      label: 'Total Clients',
      value: kpi.total,
      sub: isVoice ? 'Regular accounts only' : 'All accounts',
      color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200',
    },
    {
      label: 'Live',
      value: kpi.live,
      sub: `${kpi.liveRate}% live rate`,
      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
    },
    {
      label: 'This Month Live',
      value: kpi.thisMonthLive,
      sub: 'Went live this month',
      color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200',
    },
    {
      label: 'In Progress',
      value: kpi.inProgress,
      sub: kpi.avgAgeingIP ? `Avg ${kpi.avgAgeingIP}d ageing` : null,
      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
    },
    {
      label: 'On Hold',
      value: kpi.onHold,
      sub: null,
      color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    },
    {
      label: 'Avg Onboarding TAT',
      value: kpi.avgTAT ? `${kpi.avgTAT}d` : '—',
      sub: 'Onboarding → Live',
      color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',
    },
    {
      label: 'Churned',
      value: kpi.churned,
      sub: null,
      color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} ${c.border} border rounded-xl p-4`}>
          <p className="text-xs text-gray-500 font-medium mb-1 leading-tight">{c.label}</p>
          <p className={`text-2xl font-bold ${c.color} leading-none mb-1`}>{c.value}</p>
          {c.sub && <p className="text-xs text-gray-400 leading-tight">{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}
