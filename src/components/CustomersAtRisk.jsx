export default function CustomersAtRisk({ data }) {
  if (!data) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Customers at Risk</h3>
          <p className="text-xs text-gray-400 mt-0.5">No calls dialed in the last 7 days</p>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
          data.length === 0
            ? 'bg-emerald-100 text-emerald-600'
            : data.length <= 5
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-600'
        }`}>
          {data.length === 0 ? 'All active' : `${data.length} client${data.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center gap-2 py-3 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <span className="text-emerald-500 text-sm">✓</span>
          <p className="text-xs text-emerald-600 font-medium">All clients had calls in the last 7 days</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Total Calls</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Conn%</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px]">
                    <span className="block truncate" title={c.name}>{c.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">
                    {c.totalCalls?.toLocaleString() ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-medium ${
                      c.connRate >= 50 ? 'text-emerald-600' :
                      c.connRate >= 30 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {c.connRate != null ? `${c.connRate}%` : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {c.lastSeen ? (
                      <span className="text-amber-600 font-medium">{c.lastSeen}</span>
                    ) : (
                      <span className="text-gray-400 italic">Never</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
