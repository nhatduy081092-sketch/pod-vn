"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { effectiveBasePrice, formatVND } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { Paged, ProductCardData } from "@/lib/types";

/** Gợi ý mua kèm dòng basic (YALA Everyday) – bỏ các món đã có trong giỏ */
export function CartUpsell({ exclude }: { exclude: string[] }) {
  const [items, setItems] = useState<ProductCardData[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/products?category=yala-everyday&pageSize=8")
      .then((r) => (r.ok ? (r.json() as Promise<Paged<ProductCardData>>) : null))
      .then((d) => alive && d && setItems(d.items))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  const list = items.filter((p) => !exclude.includes(p.slug)).slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="mt-8" aria-label="Mua kèm">
      <h2 className="text-lg font-semibold">Mua kèm dòng basic</h2>
      <p className="text-sm text-muted">Áo trơn YALA Everyday – thêm logo hoặc chữ nhỏ, gộp chung đơn để tiết kiệm phí ship.</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/san-pham/${p.slug}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-xl bg-surface">
                <img src={assetUrl(p.images[0])} alt={p.name} loading="lazy" className="h-full w-full object-contain p-[6%] transition group-hover:scale-[1.03]" />
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{p.name}</p>
              <p className="text-sm font-semibold">{formatVND(effectiveBasePrice(p))}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
