import Link from "next/link";
import {
  DESIGN_COLLECTIONS,
  DESIGN_HUBS,
  effectiveBasePrice,
  formatVND,
  GARMENT_PRODUCT,
  GROUP_MIN_QTY,
  segmentByKey,
  tetSeasonYear,
  type DesignHub,
  type ReadyDesign,
} from "@pod/shared";
import { getProduct, getSettings } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { heroActions, heroLead, HomeSteps, ObjectHero, rise } from "@/components/landing/HomeSections";
import { Arrow, Breadcrumb, Faq, h2Big, rowLink, splitTitle } from "./SeoBlocks";
import { TOOL_LINKS } from "./ToolLinks";

const YEAR = () => new Date().getFullYear();
/** viết thường chữ đầu, giữ nguyên chữ viết tắt (CLB…) */
const lc = (s: string) => s.charAt(0).toLocaleLowerCase("vi") + s.slice(1);

/** Mẫu trong trang: theo thứ tự bộ, bỏ trùng */
export function hubDesigns(h: DesignHub): ReadyDesign[] {
  const seen = new Set<string>();
  return h.collections.flatMap((slug) => DESIGN_COLLECTIONS.find((c) => c.slug === slug)?.designs ?? []).filter((d) => (seen.has(d.slug) ? false : (seen.add(d.slug), true)));
}

export function hubTitle(h: DesignHub) {
  const n = hubDesigns(h).length;
  if (h.titleTemplate) return h.titleTemplate.replace("{n}", String(n)).replace("{year}", String(YEAR())).replace("{tet}", String(tetSeasonYear()));
  return `${n} ${h.keyword} ${YEAR()} – sửa chữ, in tên từng người`;
}

/** Gọi trong generateMetadata của trang: `export const metadata` chỉ tính 1 lần khi nạp module -> {year}/{tet} trên tiêu đề đứng yên tới lần deploy sau */
export function hubMetadata(h: DesignHub) {
  const title = hubTitle(h);
  return { title: { absolute: `${title} | YALA` }, description: h.intro, alternates: { canonical: `/${h.slug}` }, openGraph: { title, description: h.intro } };
}

/** Công thức 1: trang "Mẫu áo [nhóm] [năm]" – mẫu bấm là mở Studio, bảng giá dạng chữ, in tên từng người, hỏi đáp */
export async function HubPage({ hub: h }: { hub: DesignHub }) {
  const designs = hubDesigns(h);
  const seg = segmentByKey(h.segment);
  const products = await Promise.all(h.garments.map((g) => getProduct(GARMENT_PRODUCT[g].slug).catch(() => null)));
  // ngành hàng merchandise lấy từ CMS (không phải đồng phục) – lỗi thì ẩn khối
  const merch = h.showMerch ? ((await getSettings().catch(() => null))?.b2bHub.industries ?? []).filter((i) => i.slug !== "dong-phuc-may-mac").slice(0, 4) : [];
  const priced = h.garments.map((g, i) => ({ g, p: products[i] })).filter((x) => x.p && x.p.basePrice > 0);
  const tierQtys = [...new Set(priced.flatMap((x) => x.p!.priceTiers.map((t) => t.minQty)))].sort((a, b) => a - b).slice(0, 4);
  const back = `/${h.slug}`;
  const others = DESIGN_HUBS.filter((x) => x.slug !== h.slug);
  const title = hubTitle(h);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: h.name, item: `${SITE_URL}/${h.slug}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: h.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  const [main, sub] = splitTitle(title);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DesignFonts designs={designs} />

      <ObjectHero id="hub-title" title={main} lineup={seg.lineup} before={<Breadcrumb name={h.name} />}>
        {sub && <p className="mt-5 text-xl font-semibold md:text-2xl">{sub}</p>}
        <p className={heroLead}>{h.intro}</p>
        <div className={heroActions}>
          <a href="#mau" className="btn-primary px-7 py-3.5 text-base">
            Xem {designs.length} mẫu
          </a>
          <Link href={seg.href} className="btn-outline px-7 py-3.5 text-base">
            Giải pháp cho {lc(seg.name)}
          </Link>
        </div>
      </ObjectHero>

      {/* Lưới mẫu */}
      <section id="mau" className="container-site scroll-mt-28 py-[clamp(72px,12vh,150px)]" aria-labelledby="mau-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h2 id="mau-title" className={h2Big}>
            Bấm vào mẫu để sửa chữ, đổi màu áo
          </h2>
          <p className="max-w-[34rem] text-base leading-relaxed md:text-lg lg:pb-1">Mẫu có ô tên/số sẽ in riêng cho từng người khi đặt theo nhóm. Giá hiển thị là giá áo in 1 mặt trước.</p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:mt-14 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
          {designs.map((d, i) => {
            const p = products[h.garments.indexOf(d.garment)] ?? null;
            return (
              <li key={d.slug} {...rise(i % 4)}>
                <ReadyDesignCard d={d} back={back} price={p ? { basePrice: effectiveBasePrice(p), compareAtPrice: p.compareAtPrice } : undefined} />
              </li>
            );
          })}
        </ul>
      </section>

      <HomeSteps />

      {/* Bảng giá dạng chữ (bảng thật: giữ đường kẻ hàng) */}
      {priced.length > 0 && (
        <section className="container-site grid gap-8 py-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16" aria-labelledby="bang-gia">
          <div>
            <h2 id="bang-gia" className={h2Big}>
              Bảng giá {lc(h.name)}
            </h2>
            <p className="mt-5 max-w-[30rem] text-base leading-relaxed md:text-lg">
              Giá áo in 1 mặt trước theo thiết kế của bạn; in thêm mặt sau tính phụ phí hiện trong Studio. Đơn nhóm từ {GROUP_MIN_QTY} sản phẩm.
            </p>
          </div>
          <div>
            <div className="overflow-x-auto rounded-lg bg-surface">
              <table className="w-full min-w-[480px] text-left text-base">
                <thead className="text-[15px] text-ink/70">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Sản phẩm</th>
                    <th className="px-5 py-4 font-semibold">Giá lẻ</th>
                    {tierQtys.map((q) => (
                      <th key={q} className="px-5 py-4 font-semibold">
                        Từ {q} sp
                      </th>
                    ))}
                    {!tierQtys.length && <th className="px-5 py-4 font-semibold">Từ {GROUP_MIN_QTY} sp</th>}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {priced.map(({ g, p }) => (
                    <tr key={g} className="border-t border-ink/10">
                      <td className="px-5 py-4">
                        <Link href={`/san-pham/${p!.slug}`} className="font-semibold underline-offset-4 hover:text-brand-dark hover:underline">
                          {p!.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4">{formatVND(effectiveBasePrice(p!))}</td>
                      {tierQtys.map((q) => {
                        const t = [...p!.priceTiers].filter((x) => x.minQty <= q).sort((a, b) => b.minQty - a.minQty)[0];
                        return (
                          <td key={q} className="px-5 py-4">
                            {t ? formatVND(t.price) : "Báo giá"}
                          </td>
                        );
                      })}
                      {!tierQtys.length && (
                        <td className="px-5 py-4">
                          <a href={`${seg.href}#bao-gia`} className="font-semibold text-brand-dark underline underline-offset-4">
                            Nhận báo giá
                          </a>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-base">
              Chọn size cho cả nhóm:{" "}
              <Link href="/bang-size-ao" className="font-semibold underline underline-offset-4 hover:text-brand-dark">
                bảng size áo nhóm
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* Cùng bộ nhận diện: đồng phục là cửa vào, merchandise là phần mở rộng đơn */}
      {merch.length > 0 && (
        <section className="bg-sky/60 py-[clamp(72px,12vh,150px)]" aria-labelledby="merch">
          <div className="container-site grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
            <div>
              <h2 id="merch" className={h2Big}>
                Cùng bộ nhận diện: merchandise in logo
              </h2>
              <p className="mt-5 max-w-[30rem] text-base leading-relaxed md:text-lg">Dùng chung logo, màu thương hiệu với đồng phục – xem mockup từng món, gom vào một báo giá.</p>
              <Link href="/doanh-nghiep/san-pham" className="mt-6 inline-block text-base font-semibold underline underline-offset-4 hover:text-brand-dark">
                Xem tất cả sản phẩm in logo
              </Link>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {merch.map((i, k) => (
                <li key={i.slug} {...rise(k)}>
                  <Link href={`/doanh-nghiep/san-pham?nganh=${i.slug}`} className="group flex h-full items-start justify-between gap-4 rounded-lg bg-white px-5 py-4 transition-colors hover:bg-ink hover:text-white">
                    <span>
                      <span className="block text-lg font-semibold">{i.name}</span>
                      <span className="mt-0.5 block text-[15px] opacity-80">{i.blurb}</span>
                    </span>
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Kinh nghiệm */}
      <section className="container-site grid gap-8 py-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16" aria-labelledby="kinh-nghiem">
        <h2 id="kinh-nghiem" className={h2Big}>
          Kinh nghiệm làm {lc(h.name)}
        </h2>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {h.tips.map((t, i) => (
            <div key={t.title} {...rise(i)}>
              <h3 className="text-xl font-bold leading-snug">{t.title}</h3>
              <p className="mt-2 text-base leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq items={h.faq} />

      {/* Công cụ + mẫu khác: 2 cột dòng nền nhạt */}
      <section className="container-site grid gap-14 pb-[clamp(72px,12vh,150px)] md:grid-cols-2 md:gap-12" aria-label="Công cụ và mẫu khác">
        <div>
          <h2 className="h-section">Công cụ miễn phí</h2>
          <ul className="mt-6 space-y-2">
            {TOOL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={rowLink}>
                  <span>
                    <span className="block text-lg font-semibold">{l.title}</span>
                    <span className="mt-0.5 block text-[15px] opacity-80">{l.desc}</span>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h-section">Xem thêm mẫu</h2>
          <ul className="mt-6 space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/${o.slug}`} className={rowLink}>
                  <span className="text-lg font-semibold">{o.name}</span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
