export default function OnboardingTatByAgentType({ data, title }) {
  if (!data?.length) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-center h-full">
      <p className="text-gray-400 text-xs">No agent type data</p>
    </div>
  )

  const maxTAT = Math.max(...data.map(d => d.avgTAT), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full min-h-[220px]">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title || 'TAT by Agent Type'}</h3>
      <div className="space-y-3">
        {data.map((row, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 font-medium truncate max-w-[160px]" title={row.agentType}>
                {row.agentType || '—'}
              </span>
              <span className="text-xs text-gray-400">{row.count} live</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-400 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.round(row.avgTAT / maxTAT * 100))}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-blue-600 w-10 text-right">{row.avgTAT}d</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
