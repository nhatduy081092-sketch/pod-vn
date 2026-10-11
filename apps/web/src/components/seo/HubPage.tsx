import Link from "next/link";
import {
  DESIGN_COLLECTIONS,
  DESIGN_HUBS,
  effectiveBasePrice,
  formatVND,
  GARMENT_PRODUCT,
  GROUP_MIN_QTY,
  segmentByKey,
  type DesignHub,
  type ReadyDesign,
} from "@pod/shared";
import { getProduct } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { GroupSteps } from "@/components/landing/GroupHero";
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
  return `${hubDesigns(h).length} ${h.keyword} ${YEAR()} – sửa chữ, in tên từng người`;
}

export function hubMetadata(h: DesignHub) {
  const title = hubTitle(h);
  return { title: { absolute: `${title} | YALA` }, description: h.intro, alternates: { canonical: `/${h.slug}` }, openGraph: { title, description: h.intro } };
}

/** Công thức 1: trang "Mẫu áo [nhóm] [năm]" – mẫu bấm là mở Studio, bảng giá dạng chữ, in tên từng người, hỏi đáp */
export async function HubPage({ hub: h }: { hub: DesignHub }) {
  const designs = hubDesigns(h);
  const seg = segmentByKey(h.segment);
  const products = await Promise.all(h.garments.map((g) => getProduct(GARMENT_PRODUCT[g].slug).catch(() => null)));
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DesignFonts designs={designs} />

      <section className="border-b border-line bg-cream">
        <div className="container-site py-8 md:py-12">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">
              Trang chủ
            </Link>{" "}
            / <span className="text-ink">{h.name}</span>
          </nav>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80 md:text-lg">{h.intro}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href="#mau" className="btn-primary px-6">
              Xem {designs.length} mẫu
            </a>
            <Link href={seg.href} className="btn-outline bg-white px-6">
              Giải pháp cho {lc(seg.name)}
            </Link>
          </div>
        </div>
      </section>

      {/* Lưới mẫu */}
      <section id="mau" className="scroll-mt-28 py-10 md:py-14">
        <div className="container-site">
          <h2 className="h-section">Bấm vào mẫu để sửa chữ, đổi màu áo</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-muted">Mẫu có ô tên/số sẽ in riêng cho từng người khi đặt theo nhóm. Giá hiển thị là giá áo in 1 mặt trước.</p>
          <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {designs.map((d) => {
              const p = products[h.garments.indexOf(d.garment)] ?? null;
              return (
                <li key={d.slug}>
                  <ReadyDesignCard d={d} back={back} price={p ? { basePrice: effectiveBasePrice(p), compareAtPrice: p.compareAtPrice } : undefined} />
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <GroupSteps />

      {/* Bảng giá dạng chữ */}
      {priced.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="container-site max-w-4xl">
            <h2 className="h-section">Bảng giá {lc(h.name)}</h2>
            <p className="mt-2 text-[15px] text-muted">Giá áo in 1 mặt trước theo thiết kế của bạn; in thêm mặt sau tính phụ phí hiện trong Studio. Đơn nhóm từ {GROUP_MIN_QTY} sản phẩm.</p>
            <div className="mt-6 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[480px] text-left text-[15px]">
                <thead className="bg-surface text-sm text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                    <th className="px-4 py-3 font-semibold">Giá lẻ</th>
                    {tierQtys.map((q) => (
                      <th key={q} className="px-4 py-3 font-semibold">
                        Từ {q} sp
                      </th>
                    ))}
                    {!tierQtys.length && <th className="px-4 py-3 font-semibold">Từ {GROUP_MIN_QTY} sp</th>}
                  </tr>
                </thead>
                <tbody>
                  {priced.map(({ g, p }) => (
                    <tr key={g} className="border-t border-line">
                      <td className="px-4 py-3">
                        <Link href={`/san-pham/${p!.slug}`} className="font-semibold hover:text-brand-dark">
                          {p!.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{formatVND(effectiveBasePrice(p!))}</td>
                      {tierQtys.map((q) => {
                        const t = [...p!.priceTiers].filter((x) => x.minQty <= q).sort((a, b) => b.minQty - a.minQty)[0];
                        return (
                          <td key={q} className="px-4 py-3">
                            {t ? formatVND(t.price) : "Báo giá"}
                          </td>
                        );
                      })}
                      {!tierQtys.length && (
                        <td className="px-4 py-3">
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
            <p className="mt-3 text-sm text-muted">
              Chọn size cho cả nhóm:{" "}
              <Link href="/bang-size-ao" className="font-semibold text-ink underline underline-offset-4">
                bảng size áo nhóm
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* Kinh nghiệm */}
      <section className="border-t border-line bg-surface/60 py-10 md:py-14">
        <div className="container-site">
          <h2 className="h-section">Kinh nghiệm làm {lc(h.name)}</h2>
          <div className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {h.tips.map((t) => (
              <div key={t.title}>
                <h3 className="text-lg font-bold">{t.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink/80">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Công cụ & tài nguyên */}
      <section className="py-10 md:py-12">
        <div className="container-site">
          <h2 className="text-xl font-bold">Công cụ miễn phí</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TOOL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block h-full rounded-xl border border-line bg-white p-4 transition hover:border-ink">
                  <p className="font-semibold">{l.title}</p>
                  <p className="mt-1 text-sm text-muted">{l.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Hỏi đáp */}
      <section className="border-t border-line py-10 md:py-14">
        <div className="container-site max-w-3xl">
          <h2 className="h-section">Câu hỏi thường gặp</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {h.faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold">
                  {f.q}
                  <span className="mt-0.5 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Mẫu khác */}
      <section className="bg-cream py-10 md:py-12">
        <div className="container-site">
          <h2 className="text-xl font-bold">Xem thêm mẫu</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/${o.slug}`} className="block h-full rounded-xl border border-line bg-white p-4 transition hover:border-ink">
                  <p className="font-semibold">{o.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{o.intro}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
