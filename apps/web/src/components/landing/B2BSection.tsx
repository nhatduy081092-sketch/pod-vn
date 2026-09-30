import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { IconArrow } from "../ui/icons";

type Props = { data: LandingSettings["b2b"]; brand: LandingSettings["brand"]; products: ProductCardData[] };

/**
 * Khối "Giải pháp doanh nghiệp" mang nhận diện YALA (xanh navy + cam accent),
 * tạo khác biệt với bản mẫu: số liệu năng lực, sản phẩm B2B báo giá theo số lượng, khách hàng tiêu biểu.
 */
export function B2BSection({ data, brand, products }: Props) {
  if (!data.enabled) return null;
  const zalo = `https://zalo.me/${brand.zalo.replace(/\D/g, "")}`;
  return (
    <section id="doanh-nghiep" className="relative scroll-mt-16 overflow-hidden bg-ink py-12 text-white md:py-16">
      {/* lưới + vệt cam trang trí */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        aria-hidden
      />

      <div className="container-site relative">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{data.eyebrow}</span>
            <h2 className="mt-3 text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.02em]">{data.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">{data.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-white bg-accent text-white hover:bg-brand-dark">
                {data.ctaLabel} <IconArrow className="h-4 w-4" />
              </a>
              <a href={`mailto:${brand.email}?subject=${encodeURIComponent("Yêu cầu báo giá – " + brand.name)}`} className="btn border-white/60 bg-transparent text-white hover:bg-white/10">
                {brand.email}
              </a>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {data.stats.map((s) => (
              <li key={s.label} className="relative rounded-xl border border-white/15 bg-navy-dark/70 p-4">
                <p className="text-[clamp(26px,6vw,40px)] font-black leading-none text-accent">{s.value}</p>
                <p className="mt-1.5 text-xs leading-snug text-white/75 md:text-sm">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>

        {products.length > 0 && (
          <ul className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
            {products.map((p) => (
              <li key={p.id} className="w-[72%] shrink-0 snap-start md:w-auto">
                <Link href={`/san-pham/${p.slug}`} className="group block overflow-hidden rounded-xl bg-white text-ink transition hover:-translate-y-0.5">
                  <div className="relative aspect-square overflow-hidden bg-navy-light">
                    <img src={assetUrl(p.images[0])} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-0 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink left-2">IN / THÊU LOGO</span>
                  </div>
                  <div className="border-t border-line p-3">
                    <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-snug md:text-[15px]">{p.name}</h3>
                    <p className="mt-1 flex items-center justify-between text-xs font-extrabold text-navy md:text-sm">
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
