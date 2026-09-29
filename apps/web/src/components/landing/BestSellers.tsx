import Link from "next/link";
import { formatVND } from "@pod/shared";
import { assetUrl, shortPriceLabel } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { SectionTitle } from "./SectionTitle";

/** Dải "Bán chạy" cuộn ngang, card kiểu xấp giấy so le cao thấp */
export function BestSellers({ title, items }: { title: string; items: ProductCardData[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-cream pb-8 md:pb-12">
      <SectionTitle>{title}</SectionTitle>
      <div className="no-scrollbar mt-5 overflow-x-auto md:mt-8">
        <ul className="mx-auto flex w-max snap-x snap-mandatory gap-[clamp(12px,3vw,24px)] px-4 pb-4 pt-1 md:px-6">
          {items.map((p, i) => (
            <li key={p.id} className={`snap-start ${i % 2 ? "mt-3 md:mt-5" : ""}`}>
              <Link
                href={`/san-pham/${p.slug}`}
                className="group block w-[clamp(96px,21vw,190px)] overflow-hidden rounded-md border-[1.5px] border-ink bg-white shadow-stack transition hover:-translate-y-1"
              >
                <div className="aspect-[4/5] overflow-hidden bg-white">
                  <img src={assetUrl(p.images[0])} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <div className="hidden border-t border-ink/10 px-2 py-1.5 md:block">
                  <p className="line-clamp-1 text-xs font-semibold">{p.name}</p>
                  <p className="text-sm font-black text-brand-dark">{shortPriceLabel(p, formatVND)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
