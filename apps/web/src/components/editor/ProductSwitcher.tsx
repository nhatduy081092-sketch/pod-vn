"use client";
import { useEffect, useState } from "react";
import { formatVND } from "@pod/shared";
import { shortPriceLabel } from "@/lib/config";
import type { Paged, ProductCardData } from "@/lib/types";
import { readRecent, type RecentProduct } from "./recent";

/**
 * Đổi sản phẩm ngay trong công cụ thiết kế: thiết kế hiện tại được mang sang sản phẩm mới
 * (co giãn theo vùng in cùng tên mặt, không có thì đặt vào mặt đầu tiên).
 */
export function ProductSwitcher({ currentId, onPick, onClose }: { currentId: string; onPick: (slug: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"recent" | "all">("all");
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    const r = readRecent().filter((x) => x.id !== currentId);
    setRecent(r);
    if (r.length) setTab("recent");
  }, [currentId]);

  useEffect(() => {
    if (tab !== "all") return;
    let alive = true;
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ "thiet-ke": "1", pageSize: "48" });
      if (q.trim().length >= 2) qs.set("q", q.trim());
      fetch(`/api/products?${qs}`)
        .then((r) => (r.ok ? (r.json() as Promise<Paged<ProductCardData>>) : null))
        .then((d) => alive && setItems(d?.items.filter((p) => p.id !== currentId) ?? []))
        .catch(() => alive && setItems([]));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [tab, q, currentId]);

  const card = (key: string, slug: string, name: string, image: string, price?: string) => (
    <li key={key}>
      <button type="button" onClick={() => onPick(slug)} className="group block w-full overflow-hidden rounded-lg border-2 border-ink/10 text-left hover:border-ink">
        <span className="block aspect-square bg-[#f6f6f7]">{image && <img src={image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />}</span>
        <span className="line-clamp-2 min-h-[2.4em] px-1.5 pt-1 text-[11px] font-bold leading-tight">{name}</span>
        {price && <span className="block px-1.5 pb-1 text-[11px] font-black">{price}</span>}
      </button>
    </li>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="switch-title" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 id="switch-title" className="text-lg font-black">
            Đổi sản phẩm
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-xl leading-none" aria-label="Đóng">
            ×
          </button>
        </div>
        <p className="text-xs text-ink/60">Thiết kế hiện tại sẽ được mang sang sản phẩm mới – nhớ kiểm tra lại vị trí.</p>
        <div className="mt-3 flex items-center gap-2">
          {recent.length > 0 && (
            <div className="flex gap-1 text-xs font-bold">
              {(["recent", "all"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full border-2 px-3 py-1 ${tab === t ? "border-ink bg-ink text-white" : "border-ink/15"}`}>
                  {t === "recent" ? "Gần đây" : "Tất cả"}
                </button>
              ))}
            </div>
          )}
          {tab === "all" && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm sản phẩm…" className="min-w-0 flex-1 rounded-md border-2 border-ink/15 px-3 py-1.5 text-sm" aria-label="Tìm sản phẩm" autoFocus />}
        </div>
        <ul className="mt-3 grid flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {tab === "recent"
            ? recent.map((p) => card(p.id, p.slug, p.name, p.image))
            : items === null
              ? Array.from({ length: 8 }, (_, i) => <li key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-ink/5" />)
              : items.map((p) => card(p.id, p.slug, p.name, p.images[0] ?? "", shortPriceLabel(p, formatVND)))}
        </ul>
        {tab === "all" && items?.length === 0 && <p className="py-6 text-center text-sm text-ink/60">Không tìm thấy sản phẩm phù hợp.</p>}
      </div>
    </div>
  );
}
