export default function OnboardingMonthAvg({ data }) {
  const allVals = data.flatMap(d => Array(d.count).fill(d.avgDays))
  const overall  = allVals.length ? Math.round(allVals.reduce((s, v) => s + v, 0) / allVals.length) : null
  const totalCount = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Month-wise Avg Onboarding TAT</h3>
      <div className="overflow-y-auto max-h-[260px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Month</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Days</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 text-gray-700">{d.month}</td>
                <td className="py-2.5 text-right font-bold text-violet-600">{d.avgDays}</td>
                <td className="py-2.5 text-right text-gray-400 text-xs">{d.count}</td>
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400 text-xs">No completed onboardings yet</td>
              </tr>
            )}
          </tbody>
          {overall !== null && (
            <tfoot className="sticky bottom-0 bg-white">
              <tr className="border-t-2 border-gray-200">
                <td className="py-2.5 text-xs font-bold text-gray-700">Overall Average</td>
                <td className="py-2.5 text-right font-bold text-gray-800">{overall}</td>
                <td className="py-2.5 text-right text-gray-500 text-xs font-medium">{totalCount}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
