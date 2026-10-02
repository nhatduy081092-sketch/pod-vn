import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getHome } from "@/lib/api";
import type { HomeData } from "@/lib/types";
import { assetUrl } from "@/lib/config";
import { MerchKit } from "@/components/b2b/MerchKit";
import { PhotoCollage } from "@/components/b2b/PhotoCollage";
import { pastel } from "@/lib/pastel";
import { B2BQuoteForm } from "@/components/b2b/B2BQuoteForm";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Quà tặng doanh nghiệp, merchandise & đồng phục in logo",
  description:
    "YALA làm quà tặng doanh nghiệp, merchandise, quà Tết, welcome kit, đồng phục in logo theo yêu cầu: tư vấn theo ngân sách, mockup miễn phí, sản xuất và giao toàn quốc.",
  alternates: { canonical: "/doanh-nghiep" },
};

/** Trung tâm giải pháp doanh nghiệp: ngành hàng · giải pháp theo dịp · quy trình · lợi ích · form báo giá */
export default async function BusinessPage() {
  let home: HomeData | null = null;
  try {
    home = await getHome();
  } catch (e) {
    await connection();
    throw e;
  }
  const { settings, catalog = [] } = home;
  const hub = settings.b2bHub;
  const brand = settings.brand;
  const bySlug = new Map(catalog.map((c) => [c.slug, c]));
  const zalo = brand.zalo ? `https://zalo.me/${brand.zalo.replace(/\D/g, "")}` : "";
  const clients = settings.b2b.clients;
  // ảnh thật sản phẩm từng ngành (đã nhập từ nguồn) cho khối minh hoạ đầu trang
  const photos = hub.industries.flatMap((i) => {
    const c = bySlug.get(i.slug);
    return c?.image && !/\.svg(\?|$)/i.test(c.image) ? [{ src: c.image, alt: i.name }] : [];
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Quà tặng doanh nghiệp in logo",
    provider: { "@type": "Organization", name: brand.name },
    areaServed: "VN",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Ngành hàng",
      itemListElement: hub.industries.map((i) => ({ "@type": "OfferCatalog", name: i.name })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="container-site grid items-center gap-8 py-10 md:grid-cols-[1.05fr_1fr] md:py-16">
          <div>
            <p className="text-[13px] font-semibold text-brand md:text-sm">{hub.eyebrow}</p>
            <h1 className="mt-2 font-display text-[clamp(34px,5vw,64px)] font-extrabold leading-[1.0] tracking-[-0.025em] [font-stretch:86%] [text-wrap:balance]">{hub.title}</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75 md:text-lg">{hub.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a href="#bao-gia" className="btn-primary px-6 py-3">
                Nhận báo giá miễn phí
              </a>
              {zalo && (
                <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-white/40 bg-transparent px-6 py-3 text-white hover:border-white">
                  Chat Zalo tư vấn
                </a>
              )}
            </div>
            {/* điều kiện đặt hàng nói rõ ngay đầu trang – khách so sánh với đơn vị khác không cần hỏi */}
            <ul className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 border-t border-white/15 pt-6 sm:grid-cols-4">
              {(hub.terms.length ? hub.terms.slice(0, 4).map((t) => ({ value: t.value, label: t.label })) : settings.b2b.stats).map((s) => (
                <li key={s.label}>
                  <p className="text-lg font-bold leading-tight text-white md:text-xl">{s.value}</p>
                  <p className="mt-1 text-xs leading-snug text-white/60">{s.label}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-3xl bg-peach">
            {photos.length >= 4 ? <PhotoCollage images={photos} /> : <MerchKit className="h-auto w-full" />}
          </div>
        </div>
      </section>

      {/* Mục lục nhanh */}
      <nav className="sticky top-12 z-30 border-b border-line bg-white/95 backdrop-blur md:top-16 lg:top-[108px]" aria-label="Trong trang này">
        <div className="container-site no-scrollbar flex h-11 items-center gap-6 overflow-x-auto text-sm font-medium">
          {(
            [
              hub.terms.length ? ["#dieu-kien", "Điều kiện đặt hàng"] : null,
              ["#nganh-hang", "Ngành hàng"],
              ["#giai-phap", "Giải pháp theo dịp"],
              hub.cases.length ? ["#du-an", "Dự án đã làm"] : null,
              ["#quy-trinh", "Quy trình"],
              ["#vi-sao", "Vì sao chọn YALA"],
              ["#bao-gia", "Nhận báo giá"],
            ].filter(Boolean) as [string, string][]
          ).map(([h, l]) => (
            <a key={h} href={h} className={`shrink-0 whitespace-nowrap ${h === "#bao-gia" ? "font-semibold text-brand" : "text-ink/75 hover:text-ink"}`}>
              {l}
            </a>
          ))}
        </div>
      </nav>

      {/* Điều kiện đặt hàng + so sánh cách đặt */}
      {hub.terms.length > 0 && (
        <section id="dieu-kien" className="scroll-mt-32 py-12 md:py-16">
          <div className="container-site">
            <p className="eyebrow">Điều kiện đặt hàng</p>
            <h2 className="h-section mt-1.5">Rõ ràng trước khi bạn nhắn tin</h2>
            <ul className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {hub.terms.map((t, i) => (
                <li key={t.label} className={`rounded-2xl border-2 border-ink p-4 shadow-sticker-sm md:p-5 ${pastel(i)}`}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/60 md:text-[13px]">{t.label}</p>
                  <p className="mt-1 font-display text-[clamp(20px,2.4vw,30px)] font-extrabold leading-[1.05] tracking-[-0.015em] [font-stretch:90%]">{t.value}</p>
                  {t.note && <p className="mt-2 text-[13px] leading-snug text-ink/75 md:text-sm">{t.note}</p>}
                </li>
              ))}
            </ul>

            {hub.compare.length > 0 && (
              <div className="mt-10 overflow-hidden rounded-2xl border-2 border-ink">
                <div className="grid grid-cols-[1fr_1fr] bg-ink text-[13px] font-semibold text-white md:grid-cols-[0.8fr_1fr_1fr] md:text-sm">
                  <span className="hidden px-5 py-3 md:block" />
                  <span className="px-4 py-3 text-white/70 md:px-5">Đặt merch kiểu thông thường</span>
                  <span className="bg-brand px-4 py-3 md:px-5">Đặt với YALA</span>
                </div>
                <ul>
                  {hub.compare.map((c) => (
                    <li key={c.label} className="grid grid-cols-[1fr_1fr] border-t border-ink/10 text-[14px] md:grid-cols-[0.8fr_1fr_1fr] md:text-[15px]">
                      <span className="col-span-2 bg-surface px-4 pb-1 pt-3 text-[12px] font-semibold uppercase tracking-wide text-muted md:col-span-1 md:bg-transparent md:px-5 md:py-4 md:text-[13px]">{c.label}</span>
                      <span className="px-4 py-3 text-muted md:px-5 md:py-4">{c.usual}</span>
                      <span className="flex gap-2 bg-brand-light px-4 py-3 font-semibold text-ink md:px-5 md:py-4">
                        <svg viewBox="0 0 24 24" className="mt-[3px] h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                        {c.yala}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/doanh-nghiep/san-pham" className="btn-primary px-6 py-3">
                Xem sản phẩm & giá
              </Link>
              <a href="#bao-gia" className="btn-outline px-6 py-3">
                Gửi yêu cầu báo giá
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Ngành hàng */}
      <section id="nganh-hang" className="scroll-mt-32 py-12 md:py-16">
        <div className="container-site">
          <p className="eyebrow">{hub.industries.length} nhóm ngành hàng</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section mt-1.5">In logo lên gần như mọi thứ doanh nghiệp cần</h2>
            <Link href="/doanh-nghiep/san-pham" className="text-sm font-semibold underline underline-offset-4 hover:text-brand">
              Xem tất cả sản phẩm, lọc theo ngân sách →
            </Link>
          </div>
          <ul className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {hub.industries.map((i, idx) => {
              const cat = bySlug.get(i.slug);
              const href = cat ? `/doanh-nghiep/san-pham?nganh=${i.slug}` : `/doanh-nghiep?nganh=${i.slug}#bao-gia`;
              return (
                <li key={i.slug} id={`nganh-${i.slug}`} className="scroll-mt-32">
                  <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line transition hover:border-ink">
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                      {cat?.image ? (
                        <img src={assetUrl(cat.image)} alt={i.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        // chưa có sản phẩm: ô chữ thay ảnh, giữ lưới đều
                        <div className={`flex h-full flex-col justify-end p-4 md:p-6 ${pastel(idx)}`} aria-hidden>
                          <span className="text-[clamp(16px,2vw,26px)] font-semibold leading-[1.15] tracking-[-0.015em] text-ink/80 [text-wrap:balance]">{i.blurb}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      <h3 className="text-[15px] font-semibold leading-snug md:text-lg">{i.name}</h3>
                      <p className="mt-1 flex-1 text-[13px] leading-snug text-muted md:text-sm">{cat?.image ? i.blurb : "Đang cập nhật sản phẩm – nhận tư vấn & báo giá theo yêu cầu"}</p>
                      <p className="mt-3 text-[13px] font-semibold text-ink md:text-sm">
                        {cat ? `Xem ${cat.count} sản phẩm` : "Nhận tư vấn"} <span className="inline-block transition group-hover:translate-x-1">→</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Giải pháp theo dịp */}
      <section id="giai-phap" className="scroll-mt-32 bg-surface py-12 md:py-16">
        <div className="container-site">
          <p className="eyebrow">Giải pháp theo dịp</p>
          <h2 className="h-section mt-1.5">Bạn đang chuẩn bị cho dịp nào?</h2>
          <ul className="mt-7 grid gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {hub.solutions.map((s, idx) => (
              <li key={s.key} id={`giai-phap-${s.key}`} className="scroll-mt-32 flex flex-col rounded-2xl bg-white p-5 md:p-6">
                <p className="text-sm font-semibold text-brand">{String(idx + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-lg font-semibold md:text-xl">{s.title}</h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted md:text-[15px]">{s.desc}</p>
                {s.items && <p className="mt-3 text-[13px] font-medium text-ink/80">{s.items}</p>}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
                  <Link href={`/doanh-nghiep/san-pham?dip=${s.key}`} className="text-ink hover:text-brand">
                    Xem sản phẩm gợi ý →
                  </Link>
                  <a href={`/doanh-nghiep?dip=${s.key}#bao-gia`} className="text-muted hover:text-brand">
                    Nhận báo giá
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dự án đã làm – chỉ hiện khi có dự án thật nhập trong CMS */}
      {hub.cases.length > 0 && (
        <section id="du-an" className="scroll-mt-32 py-12 md:py-16">
          <div className="container-site">
            <p className="eyebrow">Dự án đã làm</p>
            <h2 className="h-section mt-1.5">Thành phẩm thật, giao thật</h2>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {hub.cases.map((c) => (
                <li key={c.title} className="overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-sticker-sm">
                  {c.image && (
                    <div className="aspect-[4/3] overflow-hidden border-b-2 border-ink bg-surface">
                      <img src={assetUrl(c.image)} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 md:p-5">
                    {c.client && <p className="text-[13px] font-semibold text-brand">{c.client}</p>}
                    <h3 className="mt-0.5 text-base font-semibold leading-snug md:text-lg">{c.title}</h3>
                    {c.detail && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{c.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Quy trình */}
      <section id="quy-trinh" className="scroll-mt-32 py-12 md:py-16">
        <div className="container-site">
          <p className="eyebrow">Quy trình làm việc</p>
          <h2 className="h-section mt-1.5">Từ yêu cầu đến tay người nhận</h2>
          <ol className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {hub.process.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
                <div>
                  <h3 className="text-base font-semibold md:text-lg">{p.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">{p.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Lợi ích */}
      <section id="vi-sao" className="scroll-mt-32 border-t border-line py-12 md:py-16">
        <div className="container-site">
          <p className="eyebrow">Vì sao chọn YALA</p>
          <h2 className="h-section mt-1.5">Một đầu mối, ít việc hơn cho bạn</h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {hub.benefits.map((b) => (
              <li key={b.title} className="rounded-2xl border border-line p-5">
                <h3 className="text-base font-semibold md:text-lg">{b.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{b.desc}</p>
              </li>
            ))}
          </ul>
          {clients.length > 0 && (
            <div className="mt-10">
              <p className="text-sm font-medium text-muted">Đã đồng hành cùng</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {clients.map((c) => (
                  <li key={c} className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Báo giá */}
      <section id="bao-gia" className="scroll-mt-32 bg-white pb-14 md:pb-20">
        <div className="container-site grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div className="pt-2">
            <p className="eyebrow">Nhận báo giá</p>
            <h2 className="h-section mt-1.5">Gửi nhu cầu, nhận báo giá & mockup</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Đơn nhỏ có thể đặt ngay trên website. Đơn số lượng lớn, quà tặng nhiều món hoặc cần đóng hộp – để lại thông tin, YALA tư vấn theo ngân sách và gửi mockup miễn phí.
            </p>
            <ul className="mt-5 space-y-2 text-[14px]">
              {brand.hotline && (
                <li>
                  Hotline:{" "}
                  <a href={`tel:${brand.hotline.replace(/\s/g, "")}`} className="font-semibold hover:text-brand">
                    {brand.hotline}
                  </a>
                </li>
              )}
              {zalo && (
                <li>
                  Zalo:{" "}
                  <a href={zalo} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand">
                    {brand.zalo}
                  </a>
                </li>
              )}
              {brand.email && (
                <li>
                  Email:{" "}
                  <a href={`mailto:${brand.email}`} className="font-semibold hover:text-brand">
                    {brand.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <B2BQuoteForm
            solutions={hub.solutions.map((s) => ({ key: s.key, title: s.title }))}
            industries={hub.industries.map((i) => ({ name: i.name, slug: i.slug }))}
            zalo={brand.zalo}
            hotline={brand.hotline}
          />
        </div>
      </section>
    </>
  );
}
