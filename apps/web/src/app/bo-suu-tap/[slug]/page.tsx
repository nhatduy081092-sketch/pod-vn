import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BASIC_COLORS, DESIGN_COLLECTIONS, DESIGN_GROUPS, findDesignCollection, GARMENT_COLORS, GARMENT_PRODUCT, type ColorKey, type GarmentKey } from "@pod/shared";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignPreview } from "@/components/designs/DesignPreview";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { basicPrices } from "@/lib/basic-prices";
import { pastel } from "@/lib/pastel";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ mau?: string; ao?: string }>;
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = findDesignCollection((await params).slug);
  if (!c) return {};
  return { title: `Áo in chữ ${c.name} – mẫu có sẵn`, description: `${c.blurb} ${c.designs.length} mẫu, sửa chữ miễn phí, in từ 1 chiếc.`, alternates: { canonical: `/bo-suu-tap/${c.slug}` } };
}

const COLOR_KEYS = Object.keys(BASIC_COLORS) as ColorKey[];
const GARMENTS = Object.keys(GARMENT_PRODUCT) as GarmentKey[];

/** Link giữ lựa chọn dáng + màu (bỏ màu nếu dáng mới không bán màu đó) */
function viewHref(slug: string, g?: GarmentKey, c?: ColorKey) {
  const q = new URLSearchParams();
  if (g) q.set("ao", g);
  if (c && (!g || GARMENT_COLORS[g].includes(c))) q.set("mau", c);
  const s = q.toString();
  return `/bo-suu-tap/${slug}${s ? `?${s}` : ""}`;
}

export default async function CollectionPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const c = findDesignCollection(slug);
  if (!c) notFound();
  const garment = GARMENTS.includes(sp.ao as GarmentKey) ? (sp.ao as GarmentKey) : undefined;
  const allowed = garment ? GARMENT_COLORS[garment] : COLOR_KEYS;
  const color = allowed.includes(sp.mau as ColorKey) ? (sp.mau as ColorKey) : undefined;
  const prices = await basicPrices();
  const group = DESIGN_GROUPS.find((g) => g.slugs.includes(c.slug));
  const related = (group?.slugs ?? []).filter((s) => s !== c.slug).map((s) => DESIGN_COLLECTIONS.find((x) => x.slug === s)!).filter(Boolean).slice(0, 4);
  const idx = DESIGN_COLLECTIONS.findIndex((x) => x.slug === c.slug);
  return (
    <>
      <DesignFonts designs={[...c.designs, ...related.map((r) => r.designs[0]!)]} />
      <section className={`border-b-2 border-ink ${pastel(idx)}`}>
        <div className="container-site py-8 md:py-12">
          <nav className="text-sm text-ink/70" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/bo-suu-tap" className="hover:text-ink">Mẫu có sẵn</Link> / <span className="text-ink">{c.name}</span>
          </nav>
          <h1 className="mt-3 font-display text-[clamp(38px,5.4vw,68px)] font-extrabold leading-[0.95] tracking-[-0.03em] [font-stretch:86%]">{c.name}</h1>
          <p className="mt-3 max-w-2xl text-[16px] text-ink/80 md:text-lg">{c.blurb} Bấm vào mẫu để sửa chữ, đổi màu áo và đặt in.</p>
          {/* Xem mẫu trên dáng + màu áo khác (ảnh phôi thật) – điện thoại: mỗi hàng cuộn ngang */}
          <div className="mt-6 space-y-3">
            <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="radiogroup" aria-label="Xem mẫu trên sản phẩm">
              <span className="shrink-0 text-sm font-bold">In lên:</span>
              <Link href={viewHref(c.slug, undefined, color)} scroll={false} role="radio" aria-checked={!garment} className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[13px] font-bold ${!garment ? "border-ink bg-ink text-white" : "border-ink bg-white"}`}>
                Gợi ý
              </Link>
              {GARMENTS.map((g) => (
                <Link key={g} href={viewHref(c.slug, g, color)} scroll={false} role="radio" aria-checked={garment === g} className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-[13px] font-bold ${garment === g ? "border-ink bg-ink text-white" : "border-ink bg-white"}`}>
                  {GARMENT_PRODUCT[g].label}
                </Link>
              ))}
            </div>
            <div className="no-scrollbar -mx-4 flex items-center gap-2.5 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:px-0" role="radiogroup" aria-label="Xem mẫu trên màu áo">
              <span className="shrink-0 text-sm font-bold">Màu:</span>
              <Link href={viewHref(c.slug, garment)} scroll={false} role="radio" aria-checked={!color} className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[13px] font-bold ${!color ? "border-ink bg-ink text-white" : "border-ink bg-white"}`}>
                Gợi ý
              </Link>
              {allowed.map((k) => (
                <Link
                  key={k}
                  href={viewHref(c.slug, garment, k)}
                  scroll={false}
                  role="radio"
                  aria-checked={color === k}
                  aria-label={BASIC_COLORS[k].name}
                  title={BASIC_COLORS[k].name}
                  className={`h-9 w-9 shrink-0 rounded-full border-2 border-ink transition hover:scale-110 ${color === k ? "ring-2 ring-ink ring-offset-2" : ""}`}
                  style={{ backgroundColor: BASIC_COLORS[k].hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container-site py-8 md:py-12">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
          {DESIGN_COLLECTIONS.map((x) => (
            <Link
              key={x.slug}
              href={viewHref(x.slug, garment, color)}
              aria-current={x.slug === c.slug ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold transition ${x.slug === c.slug ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink"}`}
            >
              {x.name}
            </Link>
          ))}
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {c.designs.map((d) => (
            <li key={d.slug}>
              <ReadyDesignCard d={d} price={prices[garment ?? d.garment]} color={color} garment={garment} />
            </li>
          ))}
        </ul>

        {related.length > 0 && (
          <section className="mt-16" aria-label="Chủ đề cùng nhóm">
            <h2 className="h-section">Cùng nhóm {group?.name.toLocaleLowerCase("vi")}</h2>
            <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((r, i) => (
                <li key={r.slug}>
                  <Link href={`/bo-suu-tap/${r.slug}`} className="hover-wiggle group block">
                    <span className={`sticker block aspect-square overflow-hidden ${pastel(idx + i + 1)}`}>
                      <DesignPreview design={r.designs[0]!} className="h-full w-full p-[5%] transition group-hover:scale-[1.04]" />
                    </span>
                    <span className="mt-2.5 block font-display text-base font-bold">{r.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <aside className="sticker mt-14 bg-sun p-6 md:flex md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="font-display text-[clamp(24px,3vw,36px)] font-extrabold leading-tight [font-stretch:88%]">Muốn câu chữ của riêng bạn?</h2>
            <p className="mt-1 text-[15px] text-ink/80">Mở YALA Studio, gõ câu bạn thích, chọn font – xem trước trên áo ngay.</p>
          </div>
          <Link href="/thiet-ke" className="btn-primary mt-5 px-7 py-3.5 text-base md:mt-0">
            Tự thiết kế
          </Link>
        </aside>
      </div>
    </>
  );
}
