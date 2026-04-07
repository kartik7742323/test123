// Cohort matrix: rows = intake month, columns = live month
export default function OnboardingAtRisk({ data }) {
  if (!data?.rows?.length) return null

  const { liveMonths = [], rows } = data

  // max live count across all cells — used for intensity scaling
  const maxCount = Math.max(1, ...rows.flatMap(r => liveMonths.map(m => r.liveCounts[m] || 0)))

  // green fill intensity based on count
  function cellStyle(count) {
    if (!count) return {}
    const alpha = 0.15 + (count / maxCount) * 0.65
    return { backgroundColor: `rgba(16, 185, 129, ${alpha})` }
  }

  // whether a live month is the same calendar month as the intake month
  function isSameMonth(intakeMonth, liveMonth) {
    return intakeMonth === liveMonth
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Onboarding Cohort — Intake to Live</h3>
          <p className="text-xs text-gray-400 mt-0.5">Each row = clients who started onboarding that month. Columns show when they went live.</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">
          {rows.length} cohorts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-r border-gray-100 whitespace-nowrap rounded-tl-lg">
                Intake Month
              </th>
              <th className="bg-gray-50 text-center px-3 py-2 font-semibold text-gray-500 border-b border-gray-100 whitespace-nowrap">
                Total
              </th>
              {liveMonths.map(m => (
                <th key={m} className="bg-emerald-50 text-center px-3 py-2 font-semibold text-emerald-700 border-b border-gray-100 whitespace-nowrap">
                  {m} Live
                </th>
              ))}
              <th className="bg-blue-50 text-center px-3 py-2 font-semibold text-blue-600 border-b border-gray-100 whitespace-nowrap">
                In Progress
              </th>
              <th className="bg-amber-50 text-center px-3 py-2 font-semibold text-amber-600 border-b border-gray-100 whitespace-nowrap">
                On Hold
              </th>
              <th className="bg-gray-50 text-center px-3 py-2 font-semibold text-gray-400 border-b border-gray-100 whitespace-nowrap rounded-tr-lg">
                Churned
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const totalLive = liveMonths.reduce((s, m) => s + (row.liveCounts[m] || 0), 0)
              const liveRate = row.total > 0 ? Math.round(totalLive / row.total * 100) : 0
              const isLast = i === rows.length - 1

              return (
                <tr key={row.month} className="group hover:bg-slate-50/60 transition-colors">
                  {/* Intake month */}
                  <td className={`sticky left-0 z-10 bg-white group-hover:bg-slate-50/60 px-3 py-2.5 font-semibold text-gray-700 border-r border-gray-100 whitespace-nowrap ${isLast ? '' : 'border-b border-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      {row.month}
                      <span className="text-gray-300 font-normal">·</span>
                      <span className={`text-xs font-medium ${liveRate >= 70 ? 'text-emerald-500' : liveRate >= 40 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {liveRate}% live
                      </span>
                    </div>
                  </td>

                  {/* Total onboarded */}
                  <td className={`text-center px-3 py-2.5 font-semibold text-gray-600 ${isLast ? '' : 'border-b border-gray-50'}`}>
                    {row.total}
                  </td>

                  {/* Live month columns */}
                  {liveMonths.map(m => {
                    const count = row.liveCounts[m] || 0
                    const same = isSameMonth(row.month, m)
                    return (
                      <td
                        key={m}
                        className={`text-center px-3 py-2.5 font-semibold ${isLast ? '' : 'border-b border-gray-50'} ${same ? 'ring-1 ring-inset ring-emerald-300' : ''}`}
                        style={count ? cellStyle(count) : {}}
                      >
                        {count > 0 ? (
                          <span className={`${same ? 'text-emerald-800' : 'text-emerald-700'}`}>{count}</span>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    )
                  })}

                  {/* Still in progress */}
                  <td className={`text-center px-3 py-2.5 ${isLast ? '' : 'border-b border-gray-50'}`}>
                    {row.stillIP > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{row.stillIP}</span>
                    ) : (
                      <span className="text-gray-200">—</span>
                    )}
                  </td>

                  {/* On hold */}
                  <td className={`text-center px-3 py-2.5 ${isLast ? '' : 'border-b border-gray-50'}`}>
                    {row.onHold > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{row.onHold}</span>
                    ) : (
                      <span className="text-gray-200">—</span>
                    )}
                  </td>

                  {/* Churned */}
                  <td className={`text-center px-3 py-2.5 ${isLast ? '' : 'border-b border-gray-50'}`}>
                    {row.churned > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">{row.churned}</span>
                    ) : (
                      <span className="text-gray-200">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Totals footer */}
          <tfoot>
            <tr className="bg-gray-50">
              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-bold text-gray-600 border-t border-gray-200 border-r border-gray-100 text-xs uppercase tracking-wide">
                Total
              </td>
              <td className="text-center px-3 py-2.5 font-bold text-gray-700 border-t border-gray-200 text-sm">
                {rows.reduce((s, r) => s + r.total, 0)}
              </td>
              {liveMonths.map(m => {
                const total = rows.reduce((s, r) => s + (r.liveCounts[m] || 0), 0)
                return (
                  <td key={m} className="text-center px-3 py-2.5 font-bold text-emerald-700 border-t border-gray-200 text-sm">
                    {total || <span className="text-gray-300 font-normal">—</span>}
                  </td>
                )
              })}
              <td className="text-center px-3 py-2.5 font-bold text-blue-600 border-t border-gray-200 text-sm">
                {rows.reduce((s, r) => s + r.stillIP, 0) || <span className="text-gray-300 font-normal">—</span>}
              </td>
              <td className="text-center px-3 py-2.5 font-bold text-amber-600 border-t border-gray-200 text-sm">
                {rows.reduce((s, r) => s + r.onHold, 0) || <span className="text-gray-300 font-normal">—</span>}
              </td>
              <td className="text-center px-3 py-2.5 font-bold text-gray-400 border-t border-gray-200 text-sm">
                {rows.reduce((s, r) => s + r.churned, 0) || <span className="text-gray-300 font-normal">—</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm ring-1 ring-inset ring-emerald-300" style={{backgroundColor:'rgba(16,185,129,0.4)'}} />
          <span className="text-xs text-gray-400">Same-month live (diagonal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{backgroundColor:'rgba(16,185,129,0.8)'}} />
          <span className="text-xs text-gray-400">Higher count = deeper green</span>
        </div>
      </div>
    </div>
  )
}
