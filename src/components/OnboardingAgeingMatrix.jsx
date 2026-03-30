function cellStyle(count, bucketTotal) {
  if (count === 0) return ''
  const pct = bucketTotal > 0 ? count / bucketTotal : 0
  if (pct >= 0.5) return 'bg-red-100 text-red-700 font-bold'
  if (pct >= 0.25) return 'bg-amber-100 text-amber-700 font-semibold'
  return 'bg-blue-50 text-blue-700'
}

export default function OnboardingAgeingMatrix({ data }) {
  if (!data?.rows?.length) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full flex items-center justify-center">
      <p className="text-gray-400 text-xs">No in-progress clients</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">In-Progress Ageing Matrix <span className="text-gray-400 font-normal">(working days)</span></h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              {data.buckets.map(b => (
                <th key={b} className="text-center px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-xs text-gray-600">
                  {row.status.replace(/^[A-Z]\.\s*/, '')}
                </td>
                {row.counts.map((c, j) => (
                  <td key={j} className="px-3 py-2.5 text-center">
                    {c > 0
                      ? <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${cellStyle(c, data.totals[j])}`}>{c}</span>
                      : <span className="text-gray-200 text-xs">—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-3 py-2.5 text-xs font-bold text-gray-700">Total</td>
              {data.totals.map((t, i) => (
                <td key={i} className="px-3 py-2.5 text-center text-xs font-bold text-gray-800">{t || '—'}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
