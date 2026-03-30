export default function OnboardingLastFiveLive({ data }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Last 5 Live Accounts</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
            <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Institute</th>
            <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Live Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 text-gray-400 text-xs w-6">{i + 1}</td>
              <td className="py-2.5 font-medium text-gray-800 max-w-[200px]">
                <span className="block truncate" title={d.name}>{d.name}</span>
              </td>
              <td className="py-2.5 text-right font-semibold text-emerald-600 text-xs whitespace-nowrap">{d.liveDate}</td>
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-gray-400 text-xs">No live accounts yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
