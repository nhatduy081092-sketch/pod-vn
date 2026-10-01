import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { IconArrow } from "../ui/icons";
import { pastel, tiltOf } from "@/lib/pastel";

/** CHỮ IN HOA (dữ liệu cũ) -> câu thường */
const sentence = (t: string) => (t === t.toLocaleUpperCase("vi") ? t.charAt(0) + t.slice(1).toLocaleLowerCase("vi") : t);

type Industry = { name: string; slug: string; image: string; count: number };
type Props = { data: LandingSettings["b2b"]; brand: LandingSettings["brand"]; products: ProductCardData[]; industries?: Industry[] };

/**
 * Khối "Giải pháp doanh nghiệp" mang nhận diện YALA (xanh navy + cam accent),
 * tạo khác biệt với bản mẫu: số liệu năng lực, sản phẩm B2B báo giá theo số lượng, khách hàng tiêu biểu.
 */
export function B2BSection({ data, brand, products, industries = [] }: Props) {
  const tiles = industries.filter((i) => i.image).slice(0, 8);
  if (!data.enabled) return null;
  const zalo = `https://zalo.me/${brand.zalo.replace(/\D/g, "")}`;
  return (
    <section id="doanh-nghiep" className="home-b2b relative scroll-mt-16 overflow-hidden bg-ink border-y-2 border-ink py-14 text-white md:py-20">

      <div className="container-site relative">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <span className="chip-sticker -rotate-2 bg-brand text-white">{sentence(data.eyebrow.replace(/^YALA\s*·\s*/i, ""))}</span>
            <h2 className="mt-4 font-display text-[clamp(32px,4.2vw,56px)] font-extrabold leading-[1.0] tracking-[-0.02em] [font-stretch:86%]">{data.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">{data.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/doanh-nghiep#bao-gia" className="btn-primary px-6 py-3">
                {data.ctaLabel}
              </Link>
              <Link href="/doanh-nghiep" className="btn border-white bg-transparent px-6 py-3 text-white hover:bg-white hover:text-ink">
                Xem giải pháp doanh nghiệp
              </Link>
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-white/50 bg-transparent px-6 py-3 text-white hover:border-white">
                Chat Zalo
              </a>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-4">
            {data.stats.map((s, i) => (
              <li key={s.label} className={`sticker tilt p-4 text-ink md:p-5 ${pastel(i)}`} style={{ ["--r" as string]: `${tiltOf(i) / 1.5}deg` }}>
                <p className="font-display text-[clamp(26px,5vw,42px)] font-extrabold leading-none [font-stretch:85%]">{s.value}</p>
                <p className="mt-1.5 text-xs font-medium leading-snug text-ink/75 md:text-sm">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>

        {tiles.length >= 4 ? (
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
            {tiles.map((t, i) => (
              <li key={t.slug} data-reveal="pop" style={{ ["--d" as string]: `${(i % 4) * 70}ms` }}>
                <Link href={`/doanh-nghiep/san-pham?nganh=${t.slug}`} className="hover-wiggle tilt group block" style={{ ["--r" as string]: `${tiltOf(i) / 1.5}deg` }}>
                  <span className="sticker block aspect-square overflow-hidden border-white bg-white shadow-[4px_4px_0_#E4570B]">
                    <img src={assetUrl(t.image)} alt={t.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[8%] transition duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-3 block text-center font-display text-[15px] font-bold leading-tight text-white md:text-base">{t.name}</span>
                  <span className="block text-center text-xs text-white/60">{t.count} mẫu in được logo</span>
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
