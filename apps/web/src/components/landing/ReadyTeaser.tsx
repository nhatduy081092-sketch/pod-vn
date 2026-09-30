import Link from "next/link";
import { READY_THEMES } from "@pod/shared";
import type { ProductCardData } from "@/lib/types";
import { ReadyGallery, type ReadyItem } from "@/components/ready/ReadyGallery";
import { IconArrow } from "@/components/ui/icons";

/** Trang chủ: mẫu in sẵn theo chủ đề – cho khách chưa có ý tưởng */
export function ReadyTeaser({ items, products }: { items: ReadyItem[]; products: ProductCardData[] }) {
  if (!items.length || !products.length) return null;
  return (
    <section className="py-8 md:py-12" aria-labelledby="mau-in-san-title">
      <div className="container-site">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="mau-in-san-title" className="text-[clamp(22px,4vw,34px)] font-black tracking-tight">
              Mẫu in sẵn – chọn là in
            </h2>
            <p className="mt-1 text-sm text-ink/65">Chữ vui, cặp đôi, nghề nghiệp, thể thao… In lên áo thun, hoodie, sweater, túi – sửa chữ theo ý.</p>
          </div>
          <Link href="/mau-in-san" className="inline-flex items-center gap-1 text-sm font-extrabold text-navy hover:text-accent">
            Xem tất cả mẫu <IconArrow className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <nav className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" aria-label="Chủ đề mẫu in">
          {READY_THEMES.filter((t) => items.some((i) => i.category === t)).map((t) => (
            <Link
              key={t}
              href={`/mau-in-san?chu-de=${encodeURIComponent(t)}`}
              className="shrink-0 whitespace-nowrap rounded-full border-2 border-ink/15 bg-white px-3.5 py-1.5 text-[13px] font-bold transition hover:border-ink"
            >
              {t}
            </Link>
          ))}
        </nav>
        <ReadyGallery items={items} products={products} themes={READY_THEMES} limit={8} compact back="/" />
      </div>
    </section>
  );
}
