"use client";
import { useEffect, useState } from "react";
import { readRecent, RECENT_EVENT, type RecentItem } from "@/lib/personal";
import { ProductCard } from "../shop/ProductCard";

/** Dải "Bạn vừa xem" – chỉ hiện khi khách đã xem ≥ 2 sản phẩm (trừ sản phẩm đang xem) */
export function RecentlyViewed({ exclude, title = "Bạn vừa xem", className = "" }: { exclude?: string; title?: string; className?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    const load = () => setItems(readRecent().filter((x) => x.id !== exclude));
    load();
    window.addEventListener(RECENT_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(RECENT_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [exclude]);
  if (items.length < 2) return null;
  return (
    <section className={`py-10 md:py-14 ${className}`} aria-label={title}>
      <div className="container-site">
        <h2 className="h-section">{title}</h2>
        <ul className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:px-0">
          {items.slice(0, 6).map((p) => (
            <li key={p.id} className="w-[40%] shrink-0 snap-start sm:w-[28%] md:w-auto">
              <ProductCard p={{ ...p, compareAtPrice: p.compareAtPrice ?? null, isBestSeller: !!p.isBestSeller }} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
