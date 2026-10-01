"use client";
import { useEffect, useState } from "react";
import { formatVND } from "@pod/shared";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/**
 * Gợi ý trong giỏ: "Thường mua cùng" theo đơn thật; nếu chưa đủ freeship -> ưu tiên món giá vừa đủ bù
 * (thanh tiến độ freeship làm động lực tăng giá trị đơn).
 */
export function CartUpsell({ productIds, subtotal, freeThreshold }: { productIds: string[]; subtotal: number; freeThreshold: number }) {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const gap = freeThreshold > 0 ? Math.max(0, freeThreshold - subtotal) : 0;
  // làm tròn khoảng giá để không gọi lại API mỗi lần đổi số lượng
  const maxPrice = gap > 0 ? Math.ceil(Math.max(gap * 1.6, gap + 60_000) / 50_000) * 50_000 : 0;
  const key = productIds.slice().sort().join(",");
  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ ids: key, take: "8", ...(maxPrice ? { maxPrice: String(maxPrice) } : {}) });
    fetch(`/api/recommendations?${qs.toString()}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ items: ProductCardData[] }>) : null))
      .then((d) => alive && d && setItems(d.items))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [key, maxPrice]);
  const list = items.filter((p) => !productIds.includes(p.id)).slice(0, 4);
  const pct = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100;

  return (
    <section className="mt-10" aria-label="Gợi ý mua kèm">
      {freeThreshold > 0 && (
        <div className="mb-5 rounded-2xl border-2 border-ink bg-sun p-4 shadow-sticker">
          <p className="font-display text-lg font-extrabold leading-tight">
            {gap > 0 ? <>Thêm {formatVND(gap)} nữa là được miễn phí giao hàng</> : <>Đơn của bạn đã được miễn phí giao hàng 🎉</>}
          </p>
          <div className="mt-2.5 h-3 overflow-hidden rounded-full border-2 border-ink bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {list.length > 0 && (
        <>
          <h2 className="font-display text-xl font-extrabold md:text-2xl">{gap > 0 ? "Gợi ý vừa đủ để freeship" : "Thường được mua cùng"}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
