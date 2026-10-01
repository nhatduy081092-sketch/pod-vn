"use client";
import { useState, useTransition } from "react";
import { b2bPriceFor, type B2BPricing } from "@pod/shared";
import { b2bPricingAction, type PricingReport } from "@/lib/actions";

const vnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
const MODES: { v: B2BPricing["mode"]; label: string; hint: string }[] = [
  { v: "source", label: "Theo giá nguồn", hint: "Giá bán = giá niêm yết của nguồn hàng (như hiện tại)" },
  { v: "markup", label: "Giá nguồn + %", hint: "Giá bán = giá nguồn × (1 + %), làm tròn lên – khách mua online được" },
  { v: "quote", label: "Chỉ báo giá", hint: "Ẩn nút mua; hiện “Từ …đ” ước tính (tuỳ chọn) và nhận yêu cầu báo giá" },
];

/** Cấu hình giá cho sản phẩm nhập từ nguồn + xem trước / áp dụng hàng loạt */
export function B2BPricingCard({ value, onChange }: { value: B2BPricing; onChange: (v: Partial<B2BPricing>) => void }) {
  const [tiersText, setTiersText] = useState(value.tiers.map((t) => `${t.minQty} | ${t.discountPct}`).join("\n"));
  const [includeManual, setIncludeManual] = useState(false);
  const [report, setReport] = useState<PricingReport | null>(null);
  const [err, setErr] = useState("");
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const ex = b2bPriceFor(100_000, value);

  const call = (dryRun: boolean) =>
    start(async () => {
      setErr("");
      const r = await b2bPricingAction({ dryRun, includeManual, cfg: value });
      if (!r.ok) return setErr(r.error);
      setReport(r.report);
      setArmed(false);
    });

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        {MODES.map((m) => (
          <label key={m.v} className={`cursor-pointer rounded-lg border p-3 text-sm ${value.mode === m.v ? "border-neutral-900 bg-neutral-50" : ""}`}>
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="b2b-mode" checked={value.mode === m.v} onChange={() => onChange({ mode: m.v })} /> {m.label}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">{m.hint}</span>
          </label>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <label className="block">
          <span className="label">Cộng thêm (%)</span>
          <input type="number" min={0} max={500} step={1} className="input" value={value.markupPct} disabled={value.mode === "source"} onChange={(e) => onChange({ markupPct: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        <label className="block">
          <span className="label">Làm tròn tới (đ)</span>
          <select className="input" value={value.roundTo} onChange={(e) => onChange({ roundTo: Number(e.target.value) })}>
            {[1, 1000, 5000, 10000].map((n) => (
              <option key={n} value={n}>{n === 1 ? "Không làm tròn" : vnd(n)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Số lượng tối thiểu (MOQ)</span>
          <input type="number" min={1} className="input" value={value.moq} onChange={(e) => onChange({ moq: Math.max(1, Math.round(Number(e.target.value) || 1)) })} />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={value.showFrom} disabled={value.mode !== "quote"} onChange={(e) => onChange({ showFrom: e.target.checked })} /> Hiện giá “Từ …đ” khi chỉ báo giá
        </label>
      </div>
      <label className="block">
        <span className="label">Giảm theo số lượng (mỗi dòng: SL từ | % giảm) – không áp cho chế độ “Chỉ báo giá”</span>
        <textarea
          className="input font-mono text-[13px]"
          rows={3}
          placeholder={"100 | 5\n300 | 8\n1000 | 12"}
          value={tiersText}
          onChange={(e) => {
            setTiersText(e.target.value);
            const tiers = e.target.value
              .split("\n")
              .map((l) => l.split("|").map((x) => Number(x.trim().replace(/[^\d.]/g, ""))))
              .filter(([q, d]) => q! >= 2 && d! > 0 && d! < 90)
              .map(([q, d]) => ({ minQty: Math.round(q!), discountPct: d! }))
              .slice(0, 8);
            onChange({ tiers });
          }}
        />
      </label>

      <p className="rounded-lg bg-neutral-50 p-3 text-sm">
        Ví dụ giá nguồn {vnd(100_000)} →{" "}
        <b>{ex.basePrice > 0 ? `bán ${vnd(ex.basePrice)}` : ex.priceFrom ? `hiện “Từ ${vnd(ex.priceFrom)}”, nhận báo giá` : "nhận báo giá (không hiện giá)"}</b>
        {ex.minQty > 1 && <> · tối thiểu {ex.minQty} sp</>}
        {ex.priceTiers.map((t) => (
          <span key={t.minQty}> · từ {t.minQty} sp: {vnd(t.price)}</span>
        ))}
      </p>

      <div className="rounded-lg border border-dashed p-3">
        <p className="text-sm font-semibold">Áp dụng cho sản phẩm nhập từ nguồn</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Sản phẩm mới khi đồng bộ tự tính theo công thức đã lưu. Sản phẩm đã có chỉ đổi giá khi bấm Áp dụng (áp dụng cũng lưu công thức này). Nên “Đồng bộ” trước để cập nhật giá nguồn
          mới nhất. Sản phẩm đã sửa giá tay trong CMS được giữ nguyên, trừ khi tick ô bên dưới.
        </p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeManual} onChange={(e) => setIncludeManual(e.target.checked)} /> Áp dụng cả sản phẩm đã sửa giá tay
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => call(true)}>
            {pending ? "Đang tính…" : "Xem trước thay đổi"}
          </button>
          <button
            type="button"
            className={armed ? "btn-danger" : "btn-primary"}
            disabled={pending}
            onClick={() => (armed ? call(false) : setArmed(true))}
          >
            {armed ? "Xác nhận áp dụng" : "Áp dụng giá"}
          </button>
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        {report && (
          <div className="mt-3 text-sm">
            <p className={report.dryRun ? "" : "font-semibold text-green-700"}>
              {report.dryRun ? "Xem trước: " : "✓ Đã áp dụng: "}
              {report.changed}/{report.matched} sản phẩm đổi giá · giữ nguyên {report.skippedManual} sản phẩm sửa tay · {report.noSource} sản phẩm nguồn chưa có giá
            </p>
            {report.samples.length > 0 && (
              <table className="mt-2 w-full text-xs">
                <thead className="text-left text-neutral-500">
                  <tr><th className="py-1">Sản phẩm</th><th>Giá nguồn</th><th>Đang bán</th><th>Mới</th></tr>
                </thead>
                <tbody>
                  {report.samples.map((x, i) => (
                    <tr key={i} className="border-t">
                      <td className="max-w-[260px] truncate py-1 pr-2">{x.name}</td>
                      <td>{vnd(x.source)}</td>
                      <td>{x.before ? vnd(x.before) : "—"}</td>
                      <td className="font-semibold">{x.after ? vnd(x.after) : x.from ? `Từ ${vnd(x.from)}` : "Báo giá"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
