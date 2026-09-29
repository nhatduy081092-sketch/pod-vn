"use client";
import { parseSizeChart, SIZE_CHART_MAX } from "@pod/shared";

const EXAMPLE = `Size | Dài áo (cm) | Rộng ngực (cm) | Cân nặng (kg)
S |
M |
L |
XL |
Ghi chú: số đo đo phẳng, sai số 1–2cm`;

/**
 * Nhập bảng size dạng text: dán thẳng từ Excel/Google Sheets (cột cách nhau bằng Tab) hoặc gõ "S | 66 | 48".
 * Dòng đầu = tiêu đề; dòng chỉ có 1 cột = ghi chú dưới bảng.
 */
export function SizeChartInput({ value, onChange, hint }: { value: string; onChange: (v: string) => void; hint?: string }) {
  const chart = parseSizeChart(value);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label mb-0">Bảng size</span>
        {!value.trim() && (
          <button type="button" className="text-xs text-brand-dark underline" onClick={() => onChange(EXAMPLE)}>
            Chèn khung mẫu (tự điền số đo)
          </button>
        )}
      </div>
      <textarea
        className="input font-mono text-xs"
        rows={6}
        maxLength={SIZE_CHART_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Dán từ Excel, hoặc gõ:\nSize | Dài áo | Rộng ngực\nS | 66 | 48"}
      />
      <p className="text-xs text-neutral-500">{hint ?? "Dán từ Excel/Google Sheets được. Dòng đầu là tiêu đề cột."}</p>
      {chart && chart.headers.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <p className="border-b bg-neutral-50 px-2 py-1 text-[11px] font-semibold text-neutral-500">Xem trước trên website</p>
          <table className="w-full min-w-max text-center text-xs">
            <thead className="bg-brand-light">
              <tr>
                {chart.headers.map((h, i) => (
                  <th key={i} className="px-2 py-1 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {r.map((c, j) => (
                    <td key={j} className={`px-2 py-1 ${c ? "" : "bg-amber-50"}`}>
                      {c || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {chart.notes.length > 0 && <p className="border-t px-2 py-1 text-[11px] text-neutral-500">{chart.notes.join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}
