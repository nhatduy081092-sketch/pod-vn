"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVND, type ProductPriceBulkInput } from "@pod/shared";
import { savePricesAction } from "@/lib/actions";
import { assetUrl } from "@/lib/config";
import type { AdminProduct } from "@/lib/types";

type Row = ProductPriceBulkInput["items"][number];
type Field = "basePrice" | "compareAtPrice" | "priceFrom" | "minQty";

const toRow = (p: AdminProduct): Row => ({
  id: p.id,
  basePrice: p.basePrice,
  compareAtPrice: p.compareAtPrice,
  priceFrom: p.priceFrom,
  minQty: p.minQty,
});
const same = (a: Row, b: Row) =>
  a.basePrice === b.basePrice && (a.compareAtPrice ?? null) === (b.compareAtPrice ?? null) && (a.priceFrom ?? null) === (b.priceFrom ?? null) && a.minQty === b.minQty;

/** Nhập "45.000", "45000", "45k" -> 45000; rỗng -> null */
function parseMoney(v: string): number | null {
  const t = v.trim().toLowerCase();
  if (!t) return null;
  const k = /k$/.test(t);
  const n = Number(t.replace(/k$/, "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n)) return null;
  return k ? n * 1000 : n;
}

/** Bảng sửa nhanh giá: sửa nhiều dòng rồi lưu 1 lần (tối đa 200 dòng/lần) */
export function PriceTable({ items }: { items: AdminProduct[] }) {
  const router = useRouter();
  const original = useMemo(() => new Map(items.map((p) => [p.id, toRow(p)])), [items]);
  const [rows, setRows] = useState<Record<string, Row>>(() => Object.fromEntries(items.map((p) => [p.id, toRow(p)])));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const rowOf = (p: AdminProduct) => rows[p.id] ?? original.get(p.id)!;
  const dirty = items.filter((p) => !same(rowOf(p), original.get(p.id)!));

  function set(id: string, field: Field, raw: string) {
    setMsg(null);
    setRows((prev) => {
      const r = { ...(prev[id] ?? original.get(id)!) };
      const v = parseMoney(raw);
      if (field === "basePrice") r.basePrice = v ?? 0;
      else if (field === "minQty") r.minQty = Math.max(1, v ?? 1);
      else r[field] = v && v > 0 ? v : null;
      return { ...prev, [id]: r };
    });
  }

  function save() {
    if (!dirty.length) return;
    start(async () => {
      const r = await savePricesAction({ items: dirty.map(rowOf) });
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: `✓ Đã lưu ${dirty.length} sản phẩm` });
      router.refresh();
    });
  }

  function reset() {
    setRows(Object.fromEntries(items.map((p) => [p.id, toRow(p)])));
    setMsg(null);
  }

  const input = (id: string, field: Field, value: number | null, opts: { disabled?: boolean; placeholder?: string } = {}) => (
    <input
      className="input h-9 w-full px-2 text-right text-sm disabled:bg-neutral-100 disabled:text-neutral-400 md:w-28"
      inputMode="numeric"
      aria-label={field}
      disabled={opts.disabled}
      placeholder={opts.placeholder}
      value={value === null || (field === "basePrice" && value === 0) ? "" : new Intl.NumberFormat("vi-VN").format(value)}
      onChange={(e) => set(id, field, e.target.value)}
    />
  );

  const status = (r: Row) =>
    r.basePrice > 0 ? (
      <span className="font-bold text-green-700">Đặt online · {formatVND(r.basePrice)}</span>
    ) : r.priceFrom ? (
      <span className="font-bold text-sky-700">Báo giá · Từ {formatVND(r.priceFrom)}</span>
    ) : (
      <span className="text-neutral-500">Liên hệ báo giá</span>
    );

  return (
    <>
      {/* Mobile: mỗi sản phẩm 1 thẻ */}
      <ul className="space-y-2 md:hidden">
        {items.map((p) => {
          const r = rowOf(p);
          const changed = !same(r, original.get(p.id)!);
          const quote = r.basePrice <= 0;
          return (
            <li key={p.id} className={`card space-y-2 p-3 ${changed ? "bg-amber-50" : ""}`}>
              <div className="flex items-center gap-2">
                <img src={assetUrl(p.images[0])} alt="" className="h-10 w-10 shrink-0 rounded border object-contain" />
                <div className="min-w-0">
                  <Link href={`/products/${p.id}`} className="line-clamp-2 text-sm font-semibold">
                    {p.name}
                  </Link>
                  <p className="text-xs">{status(r)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                <label>
                  Giá bán (₫){input(p.id, "basePrice", r.basePrice, { placeholder: "0 = báo giá" })}
                </label>
                <label>
                  Giá &quot;Từ&quot; (₫){input(p.id, "priceFrom", r.priceFrom, { disabled: !quote, placeholder: quote ? "VD: 45k" : "" })}
                </label>
                <label>
                  Giá gạch (₫){input(p.id, "compareAtPrice", r.compareAtPrice, { disabled: quote })}
                </label>
                <label>
                  SL tối thiểu{input(p.id, "minQty", r.minQty)}
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card hidden overflow-x-auto p-0 md:block md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="text-right">Giá bán (₫)</th>
              <th className="text-right">Giá gạch (₫)</th>
              <th className="text-right">Giá &quot;Từ&quot; (₫)</th>
              <th className="text-right">SL tối thiểu</th>
              <th>Website hiển thị</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const r = rowOf(p);
              const changed = !same(r, original.get(p.id)!);
              const quote = r.basePrice <= 0;
              return (
                <tr key={p.id} className={changed ? "bg-amber-50" : "hover:bg-neutral-50"}>
                  <td className="min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <img src={assetUrl(p.images[0])} alt="" className="h-10 w-10 shrink-0 rounded border object-contain" />
                      <div className="min-w-0">
                        <Link href={`/products/${p.id}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-dark">
                          {p.name}
                        </Link>
                        <p className="text-xs text-neutral-400">{p.category?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">{input(p.id, "basePrice", r.basePrice, { placeholder: "0 = báo giá" })}</td>
                  <td className="text-right">{input(p.id, "compareAtPrice", r.compareAtPrice, { disabled: quote })}</td>
                  <td className="text-right">{input(p.id, "priceFrom", r.priceFrom, { disabled: !quote, placeholder: quote ? "VD: 45k" : "" })}</td>
                  <td className="text-right">{input(p.id, "minQty", r.minQty)}</td>
                  <td className="whitespace-nowrap text-xs">{status(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Thanh lưu dính đáy màn hình khi có thay đổi */}
      <div
        className={`sticky bottom-0 z-10 mt-3 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 shadow-lg transition ${dirty.length || msg ? "" : "pointer-events-none opacity-0"}`}
      >
        <span className="text-sm font-semibold">{dirty.length ? `${dirty.length} sản phẩm đã sửa` : ""}</span>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-ghost" onClick={reset} disabled={pending || !dirty.length}>
            Hoàn tác
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={pending || !dirty.length}>
            {pending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </>
  );
}
