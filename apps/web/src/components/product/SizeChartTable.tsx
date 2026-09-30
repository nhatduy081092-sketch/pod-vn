import type { SizeChart } from "@pod/shared";

/** Bảng size: cột đầu cố định khi cuộn ngang trên mobile */
export function SizeChartTable({ chart }: { chart: SizeChart }) {
  return (
    <div>
      {chart.headers.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-max border-collapse text-center text-sm">
            <thead className="bg-brand">
              <tr>
                {chart.headers.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`whitespace-nowrap border-b border-line px-3 py-2 font-extrabold ${i === 0 ? "sticky left-0 bg-brand text-left" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-cream">
                  {r.map((c, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" className="sticky left-0 whitespace-nowrap border-t border-ink/10 bg-inherit px-3 py-2 text-left font-extrabold">
                        {c}
                      </th>
                    ) : (
                      <td key={j} className="whitespace-nowrap border-t border-ink/10 px-3 py-2">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {chart.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-ink/70">
          {chart.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
