import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { IconArrow } from "../ui/icons";

type Industry = { name: string; slug: string; image: string; count: number };
type Props = { data: LandingSettings["b2b"]; brand: LandingSettings["brand"]; products: ProductCardData[]; industries?: Industry[] };

/**
 * Khối "Giải pháp doanh nghiệp" trên nền đen: tiêu đề lớn + nút báo giá, số liệu năng lực chữ to,
 * ngành hàng in logo (ảnh sản phẩm thật), khách hàng tiêu biểu (khi CMS có).
 */
export function B2BSection({ data, brand, products, industries = [] }: Props) {
  const tiles = industries.filter((i) => i.image).slice(0, 8);
  if (!data.enabled) return null;
  const zalo = `https://zalo.me/${brand.zalo.replace(/\D/g, "")}`;
  return (
    <section id="doanh-nghiep" className="home-b2b relative scroll-mt-16 overflow-hidden bg-ink py-[clamp(80px,14vh,170px)] text-white">
      <div className="container-site relative">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <h2 className="font-display text-[clamp(30px,3.6vw,52px)] font-bold leading-[1.06] tracking-[-0.03em] [text-wrap:balance]">{data.title}</h2>
          <div>
            <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{data.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/doanh-nghiep#bao-gia" className="btn-primary px-7 py-3.5 text-base">
                {data.ctaLabel}
              </Link>
              <Link href="/doanh-nghiep" className="btn border-white/60 bg-transparent px-7 py-3.5 text-base text-white hover:border-white hover:bg-white hover:text-ink">
                Xem giải pháp doanh nghiệp
              </Link>
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="px-2 py-3 text-base font-semibold underline underline-offset-4 transition-colors hover:text-brand">
                Chat Zalo
              </a>
            </div>
          </div>
        </div>

        {/* số liệu năng lực (chủ shop xác nhận 31/10/2026 là của YALA) – chữ lớn, không thẻ */}
        <ul className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 md:mt-28 lg:grid-cols-4">
          {data.stats.map((s, i) => (
            <li key={s.label} data-reveal="rise" style={{ ["--d" as string]: `${i * 70}ms` }}>
              <p className="whitespace-nowrap font-display text-[clamp(40px,5vw,76px)] font-bold leading-none tracking-[-0.04em] [font-variant-numeric:tabular-nums]">{s.value}</p>
              <p className="mt-3 max-w-[15rem] text-base leading-snug text-white/80">{s.label}</p>
            </li>
          ))}
        </ul>

        {tiles.length >= 4 ? (
          <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:mt-20 md:gap-x-6">
            {tiles.map((t, i) => (
              <li key={t.slug} data-reveal="rise" style={{ ["--d" as string]: `${(i % 4) * 70}ms` }}>
                <Link href={`/doanh-nghiep/san-pham?nganh=${t.slug}`} className="group block">
                  <span className="block aspect-square overflow-hidden rounded-lg bg-white">
                    <img src={assetUrl(t.image)} alt={t.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[8%] transition duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-3 block font-display text-[17px] font-bold leading-tight transition-colors group-hover:text-brand">{t.name}</span>
                  <span className="mt-0.5 block text-[15px] text-white/70">{t.count} mẫu in được logo</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : products.length > 0 && (
          <ul className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
            {products.map((p) => (
              <li key={p.id} className="w-[72%] shrink-0 snap-start md:w-auto">
                <Link href={`/san-pham/${p.slug}`} className="group block overflow-hidden rounded-xl bg-white text-ink transition hover:-translate-y-0.5">
                  <div className="relative aspect-square overflow-hidden bg-navy-light">
                    <img src={assetUrl(p.images[0])} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-0 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[13px] font-semibold text-ink left-2">In / thêu logo</span>
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-bold leading-snug md:text-[15px]">{p.name}</h3>
                    <p className="mt-1 flex items-center justify-between text-xs font-extrabold text-navy md:text-[15px]">
                      Báo giá theo số lượng <IconArrow className="h-4 w-4 text-accent transition group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {data.clients.length > 0 && (
          <div className="mt-10">
            <p className="text-center text-sm font-medium text-white/60">Đã đồng hành cùng</p>
            <div className="relative mt-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
              <ul className="animate-marquee flex w-max gap-3">
                {[...data.clients, ...data.clients].map((c, i) => (
                  <li key={i} className="whitespace-nowrap rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white/85" aria-hidden={i >= data.clients.length}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
