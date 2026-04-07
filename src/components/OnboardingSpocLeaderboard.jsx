export default function OnboardingSpocLeaderboard({ data, title }) {
  if (!data?.length) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-center h-full">
      <p className="text-gray-400 text-xs">No SPOC data</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title || 'SPOC Leaderboard'}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400">SPOC</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">Total</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">Live</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">Live %</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">In Progress</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">On Hold</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">Churned</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-400">Avg TAT</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-gray-800 text-xs">{row.spoc}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 text-xs font-semibold">{row.total}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-emerald-600 font-semibold text-xs">{row.live}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.liveRate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                    row.liveRate >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  }`}>{row.liveRate}%</span>
                </td>
                <td className="px-3 py-2.5 text-right text-blue-600 text-xs">{row.inProgress}</td>
                <td className="px-3 py-2.5 text-right text-red-400 text-xs">{row.onHold}</td>
                <td className="px-3 py-2.5 text-right text-gray-400 text-xs">{row.churned}</td>
                <td className="px-3 py-2.5 text-right text-violet-600 text-xs font-medium">
                  {row.avgTAT != null ? `${row.avgTAT}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
