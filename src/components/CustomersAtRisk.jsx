export default function CustomersAtRisk({ data }) {
  if (!data) return null

  const groups = [
    { key: '7',  label: '7–14 days',  min: 7,  max: 14, color: 'amber',  head: 'bg-amber-100 text-amber-700 border-amber-200',  chip: 'bg-amber-50 border-amber-200 text-amber-900',  dot: 'bg-amber-400' },
    { key: '15', label: '15–29 days', min: 15, max: 29, color: 'orange', head: 'bg-orange-100 text-orange-700 border-orange-200', chip: 'bg-orange-50 border-orange-200 text-orange-900', dot: 'bg-orange-500' },
    { key: '30', label: '30+ days',   min: 30, max: Infinity, color: 'red', head: 'bg-red-100 text-red-700 border-red-200',     chip: 'bg-red-50 border-red-200 text-red-900',         dot: 'bg-red-500' },
  ]

  const bucketed = groups.map(g => ({
    ...g,
    clients: data.filter(c => {
      const d = c.daysSince
      if (d === null) return g.key === '30'
      return d >= g.min && d <= g.max
    }),
  }))

  const total = data.length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Customers at Risk</h3>
          <p className="text-xs text-gray-400 mt-0.5">Inactive clients by last call date</p>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
          total === 0 ? 'bg-emerald-100 text-emerald-600' :
          total <= 5  ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
        }`}>
          {total === 0 ? 'All active' : `${total} inactive`}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex items-center gap-2 py-2.5 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <span className="text-emerald-500 text-xs">✓</span>
          <p className="text-xs text-emerald-600 font-medium">All clients active in the last 7 days</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {bucketed.map(g => (
            <div key={g.key}>
              {/* Group header */}
              <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-t-lg border-b-0 border ${g.head} mb-0`}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                  <span className="text-xs font-semibold">{g.label}</span>
                </div>
                <span className="text-xs font-bold">{g.clients.length}</span>
              </div>

              {/* Client list */}
              <div className={`border border-t-0 rounded-b-lg overflow-hidden ${g.head.split(' ').find(c => c.startsWith('border-'))}`}>
                {g.clients.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-gray-400 italic">None</div>
                ) : (
                  <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
                    {g.clients.map((c, i) => (
                      <div key={i} className="px-2.5 py-2 hover:bg-black/5 transition-colors">
                        <p className="text-xs font-medium text-gray-800 truncate leading-tight" title={c.name}>{c.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last Call: {c.lastSeen ? c.lastSeen : <span className="italic">Never</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
