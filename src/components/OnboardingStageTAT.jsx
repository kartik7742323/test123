function TATBar({ avg, max }) {
  if (!avg) return null
  const pct = Math.min(100, Math.round(avg / max * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="bg-violet-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-violet-600 w-10 text-right">{avg}d</span>
    </div>
  )
}

export default function OnboardingStageTAT({ data, title }) {
  if (!data?.length) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-center h-full">
      <p className="text-gray-400 text-xs">No TAT data available</p>
    </div>
  )

  const maxAvg = Math.max(...data.filter(d => d.avg).map(d => d.avg), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full min-h-[220px]">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title || 'Stage-wise Pipeline TAT'}</h3>
      <div className="space-y-3">
        {data.map((row, i) => (
          <div key={i} className={`${i === data.length - 1 ? 'pt-3 border-t border-gray-100' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${i === data.length - 1 ? 'font-bold text-gray-700' : 'text-gray-500'}`}>
                {row.stage}
              </span>
              {row.count > 0 && (
                <span className="text-xs text-gray-400">{row.count} clients</span>
              )}
            </div>
            {row.avg != null ? (
              <TATBar avg={row.avg} max={maxAvg} />
            ) : (
              <span className="text-xs text-gray-300">No data</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
