"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildVariantMatrix, DEFAULT_SIZES, KIDS_SIZES, variantsSaveSchema, type VariantInput } from "@pod/shared";
import { saveVariantsAction } from "@/lib/actions";
import type { AdminVariant } from "@/lib/types";

const toInput = (v: AdminVariant): VariantInput => ({
  id: v.id,
  color: v.color,
  colorHex: v.colorHex,
  size: v.size,
  sku: v.sku,
  weightGram: v.weightGram,
  priceDelta: v.priceDelta,
  isActive: v.isActive,
});

const num = (s: string) => Math.round(Number(s.replace(/[^\d-]/g, "")) || 0);

/**
 * Biến thể = màu × size. Mỗi biến thể có SKU riêng (xưởng soạn hàng), cân nặng (tính ship) và phụ phí (VD 3XL +20k).
 * "Tạo ma trận" giữ nguyên SKU/cân nặng của biến thể cũ trùng màu+size.
 */
export function VariantEditor({ productId, productName, initial }: { productId: string; productName: string; initial: AdminVariant[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<VariantInput[]>(() => initial.map(toInput));
  const [colorsText, setColorsText] = useState(() => {
    const seen = new Map<string, string>();
    for (const v of initial) if (v.color && !seen.has(v.color)) seen.set(v.color, v.colorHex);
    return [...seen].map(([n, h]) => (h ? `${n} ${h}` : n)).join(", ");
  });
  const [sizesText, setSizesText] = useState(() => [...new Set(initial.map((v) => v.size).filter(Boolean))].join(", "));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function generate() {
    // "Trắng #FFFFFF, Đen #111111, Xanh navy #1C4D99"
    const colors = colorsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const m = x.match(/^(.*?)\s*(#[0-9a-fA-F]{6})?$/);
        return { name: (m?.[1] ?? x).trim(), hex: m?.[2] ?? "" };
      });
    const sizes = sizesText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setRows(buildVariantMatrix(productName, colors, sizes, rows));
    setMsg({ ok: true, text: "Đã tạo ma trận – kiểm tra rồi bấm Lưu biến thể" });
  }

  const patch = (i: number, p: Partial<VariantInput>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));

  function save() {
    const parsed = variantsSaveSchema.safeParse({ variants: rows });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" });
    start(async () => {
      const r = await saveVariantsAction(productId, parsed.data.variants);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: "✓ Đã lưu biến thể" });
      router.refresh();
    });
  }

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-bold">Biến thể (màu × size)</h2>
        <p className="text-xs text-neutral-500">SKU dùng cho xưởng soạn hàng và seller đặt qua API. Cân nặng (gram, đã đóng gói) dùng tính phí ship – để trống = dùng cân nặng sản phẩm.</p>
      </div>
      <div className="grid gap-2 rounded-lg bg-neutral-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block text-xs">
          <span className="label">Màu (cách nhau dấu phẩy, kèm mã màu)</span>
          <input className="input" value={colorsText} onChange={(e) => setColorsText(e.target.value)} placeholder="Trắng #FFFFFF, Đen #111111" />
        </label>
        <label className="block text-xs">
          <span className="label">Size</span>
          <input className="input" value={sizesText} onChange={(e) => setSizesText(e.target.value)} placeholder="S, M, L, XL" />
          <span className="mt-1 flex gap-2">
            <button type="button" className="text-brand-dark underline" onClick={() => setSizesText(DEFAULT_SIZES.join(", "))}>
              Người lớn
            </button>
            <button type="button" className="text-brand-dark underline" onClick={() => setSizesText(KIDS_SIZES.join(", "))}>
              Trẻ em
            </button>
            <button type="button" className="text-brand-dark underline" onClick={() => setSizesText("")}>
              Không size
            </button>
          </span>
        </label>
        <button type="button" className="btn-ghost h-fit self-end" onClick={generate}>
          Tạo ma trận
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table min-w-[720px] text-sm">
          <thead>
            <tr>
              <th>Màu</th>
              <th>Mã màu</th>
              <th>Size</th>
              <th>SKU</th>
              <th className="text-right">Cân nặng (g)</th>
              <th className="text-right">Phụ phí (₫)</th>
              <th>Bán</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v, i) => (
              <tr key={v.id ?? `${v.color}|${v.size}|${i}`} className={v.isActive ? "" : "opacity-50"}>
                <td>
                  <input className="input h-8 w-28 px-2 text-sm" value={v.color} onChange={(e) => patch(i, { color: e.target.value })} aria-label="Màu" />
                </td>
                <td>
                  <span className="flex items-center gap-1">
                    <input type="color" value={v.colorHex || "#ffffff"} onChange={(e) => patch(i, { colorHex: e.target.value.toUpperCase() })} className="h-8 w-9 cursor-pointer rounded border" aria-label="Mã màu" />
                    <input className="input h-8 w-24 px-2 font-mono text-xs" value={v.colorHex} onChange={(e) => patch(i, { colorHex: e.target.value })} placeholder="#RRGGBB" />
                  </span>
                </td>
                <td>
                  <input className="input h-8 w-20 px-2 text-sm" value={v.size} onChange={(e) => patch(i, { size: e.target.value })} aria-label="Size" />
                </td>
                <td>
                  <input className="input h-8 w-40 px-2 font-mono text-xs" value={v.sku} onChange={(e) => patch(i, { sku: e.target.value.toUpperCase() })} placeholder="tự tạo" aria-label="SKU" />
                </td>
                <td className="text-right">
                  <input
                    className="input h-8 w-20 px-2 text-right text-sm"
                    inputMode="numeric"
                    value={v.weightGram ?? ""}
                    onChange={(e) => patch(i, { weightGram: e.target.value ? Math.max(1, num(e.target.value)) : null })}
                    placeholder="mặc định"
                    aria-label="Cân nặng"
                  />
                </td>
                <td className="text-right">
                  <input className="input h-8 w-24 px-2 text-right text-sm" inputMode="numeric" value={v.priceDelta || ""} onChange={(e) => patch(i, { priceDelta: num(e.target.value) })} placeholder="0" aria-label="Phụ phí" />
                </td>
                <td>
                  <input type="checkbox" checked={v.isActive} onChange={(e) => patch(i, { isActive: e.target.checked })} className="h-4 w-4 accent-[#E4570B]" aria-label="Đang bán" />
                </td>
                <td>
                  <button type="button" className="text-xs text-red-600" onClick={() => setRows((r) => r.filter((_, k) => k !== i))}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost" onClick={() => setRows((r) => [...r, { color: "", colorHex: "", size: "", sku: "", weightGram: null, priceDelta: 0, isActive: true }])}>
          + Thêm dòng
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={pending}>
          {pending ? "Đang lưu..." : `Lưu biến thể (${rows.length})`}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </section>
  );
}
