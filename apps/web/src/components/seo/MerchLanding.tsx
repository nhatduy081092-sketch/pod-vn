import Link from "next/link";
import { fillMerch, MERCH_PAGES, type MerchPage } from "@pod/shared";
import { getProducts, getSettings } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { ProductGrid, priceLabelOf } from "@/components/shop/ProductCard";
import { AddToQuote } from "@/components/b2b/AddToQuote";
import { PhotoCollage } from "@/components/b2b/PhotoCollage";
import { rise } from "@/components/landing/HomeSections";
import { Arrow, Breadcrumb, Faq, h2Big, rowLink } from "./SeoBlocks";

/** Gọi trong generateMetadata (không ở cấp module) để {tet} tự chuyển năm */
export function merchMetadata(m: MerchPage) {
  const title = fillMerch(m.title);
  const description = fillMerch(m.description);
  return { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: `/${m.slug}` }, openGraph: { title, description } };
}

/** Trang "[sản phẩm] in logo": sản phẩm thật của danh mục + cách làm logo + mẹo chọn + quy trình CMS + hỏi đáp; mọi giá đi qua báo giá */
export async function MerchLanding({ page: m }: { page: MerchPage }) {
  const path = `/${m.slug}`;
  const [s, data] = await Promise.all([getSettings(), getProducts({ category: m.category, sub: m.sub, pageSize: "8" }).catch(() => null)]);
  const items = data?.items ?? [];
  const total = data?.total ?? items.length;
  const listHref = `/danh-muc/${m.category}${m.sub ? `?sub=${m.sub}` : ""}`;
  const quoteHref = `/doanh-nghiep?dip=${m.dip}#bao-gia`;
  // mẫu đầu tiên mở thẳng trong Studio – khách tự đặt logo, thấy mockup ngay
  const studioHref = items[0] ? `/thiet-ke/${items[0].slug}?back=${encodeURIComponent(path)}` : null;
  const fill = (t: string) => fillMerch(t, s.b2bQuote.responseTime);
  const h1 = fill(m.h1);
  const faq = m.faq.map((f) => ({ q: fill(f.q), a: fill(f.a) }));
  const terms = s.b2bHub.terms.filter((t) => ["Mockup", "Hoá đơn", "Giao hàng"].includes(t.label));
  const others = MERCH_PAGES.filter((x) => x.slug !== m.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: h1, item: `${SITE_URL}${path}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Đầu trang: tên sản phẩm cỡ lớn + 2 việc (báo giá / tự xem mockup), ảnh sản phẩm thật bên phải */}
      <section className="bg-surface" aria-labelledby="merch-title">
        <div className="container-site grid gap-10 pb-[clamp(56px,9vh,110px)] pt-10 md:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div>
            <Breadcrumb name={h1} />
            <h1 id="merch-title" className="font-display text-[clamp(40px,5vw,76px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
              {h1}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed md:text-xl">{fill(m.lead)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={quoteHref} className="btn-primary px-6">
                Nhận báo giá
              </Link>
              {studioHref && (
                <Link href={studioHref} prefetch={false} className="btn-outline bg-white px-6">
                  Đặt logo, xem mockup
                </Link>
              )}
            </div>
            {terms.length > 0 && (
              <dl className="mt-10 grid max-w-[36rem] grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {terms.map((t) => (
                  <div key={t.label}>
                    <dt className="text-[15px] text-ink/70">{t.label}</dt>
                    <dd className="mt-0.5 text-[17px] font-semibold leading-snug">{t.value}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-[15px] text-ink/70">Báo giá</dt>
                  <dd className="mt-0.5 text-[17px] font-semibold leading-snug">{s.b2bQuote.responseTime}</dd>
                </div>
              </dl>
            )}
          </div>
          {items.length >= 4 && <PhotoCollage images={items.slice(0, 4).map((p) => ({ src: p.images[0] ?? "", alt: p.name }))} className="mx-auto w-full max-w-[34rem]" />}
        </div>
      </section>

      {/* Sản phẩm thật trong danh mục – thêm nhiều mẫu vào 1 yêu cầu báo giá */}
      <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="mau">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h2 id="mau" className={h2Big}>
            {total} mẫu {m.noun} nhận in logo
          </h2>
          <p className="max-w-[34rem] text-base leading-relaxed md:text-lg lg:pb-1">
            Bấm “+ Thêm vào báo giá” ở các mẫu muốn so, rồi gửi một yêu cầu kèm số lượng và file logo.
          </p>
        </div>
        {items.length > 0 ? (
          <div className="mt-10 md:mt-14">
            <ProductGrid
              items={items}
              after={(x) => (
                <AddToQuote
                  variant="compact"
                  quantity={Math.max(x.minQty ?? 1, s.b2bQuote.threshold)}
                  product={{ id: x.id, slug: x.slug, name: x.name, image: x.images[0] ?? "", priceLabel: priceLabelOf(x) }}
                />
              )}
            />
          </div>
        ) : (
          <p className="mt-8 text-lg">
            Danh sách mẫu đang cập nhật –{" "}
            <Link href={quoteHref} className="font-semibold underline underline-offset-4">
              gửi yêu cầu
            </Link>{" "}
            để YALA gợi ý mẫu theo ngân sách.
          </p>
        )}
        {total > items.length && (
          <Link href={listHref} className="mt-10 inline-flex items-center gap-2 text-lg font-semibold underline underline-offset-4 hover:text-brand-dark">
            Xem tất cả {total} mẫu <Arrow />
          </Link>
        )}
      </section>

      {/* Cách làm logo theo chất liệu */}
      <section className="bg-sky/60 py-[clamp(72px,12vh,150px)]" aria-labelledby="cach-in">
        <div className="container-site grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div>
            <h2 id="cach-in" className={h2Big}>
              Logo lên sản phẩm bằng cách nào
            </h2>
            <p className="mt-5 max-w-[30rem] text-base leading-relaxed md:text-lg">Kỹ thuật phù hợp tuỳ chất liệu từng mẫu – YALA ghi rõ trong mockup và báo giá.</p>
          </div>
          <ul className="divide-y divide-ink/15 border-y border-ink/15">
            {m.methods.map((x) => (
              <li key={x.name} className="grid gap-1 py-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-8">
                <div>
                  <p className="text-xl font-bold">{x.name}</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-ink/70">{x.fit}</p>
                </div>
                <p className="text-base leading-relaxed">{x.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mẹo chọn */}
      <section className="container-site grid gap-8 py-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16" aria-labelledby="meo">
        <h2 id="meo" className={h2Big}>
          Chọn {m.noun.split(",")[0]} làm quà
        </h2>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {m.tips.map((t, i) => (
            <div key={t.title} {...rise(i)}>
              <h3 className="text-xl font-bold leading-snug">{fill(t.title)}</h3>
              <p className="mt-2 text-base leading-relaxed">{fill(t.body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quy trình (CMS b2bHub.process) */}
      {s.b2bHub.process.length > 0 && (
        <section className="bg-ink py-[clamp(72px,12vh,150px)] text-white" aria-labelledby="quy-trinh">
          <div className="container-site">
            <h2 id="quy-trinh" className={h2Big}>
              Từ yêu cầu đến lúc giao
            </h2>
            <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
              {s.b2bHub.process.map((p, i) => (
                <li key={p.title} className="border-t border-white/25 pt-4">
                  <p className="font-display text-[15px] font-semibold tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-1 text-xl font-bold">{p.title}</p>
                  <p className="mt-1.5 text-base leading-relaxed text-white/80">{p.desc}</p>
                </li>
              ))}
            </ol>
            <Link href={quoteHref} className="btn-primary mt-12 px-6">
              Gửi yêu cầu báo giá
            </Link>
          </div>
        </section>
      )}

      <Faq items={faq} />

      {/* Đi tiếp: merchandise khác + giải pháp doanh nghiệp */}
      <section className="container-site pb-[clamp(72px,12vh,150px)]" aria-label="Quà tặng in logo khác">
        <h2 className="h-section">Quà tặng in logo khác</h2>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          {[
            ...others.map((x) => ({ href: `/${x.slug}`, title: fill(x.h1), desc: fill(x.description).split(". ")[0] })),
            { href: "/doanh-nghiep/qua-cuoi-nam", title: "Quà Tết doanh nghiệp", desc: "Chọn quà theo ngân sách mỗi phần, mockup logo miễn phí." },
            { href: "/doanh-nghiep/san-pham", title: "Tất cả quà tặng doanh nghiệp", desc: "Lọc theo ngành hàng, dịp tặng và ngân sách." },
          ].map((l) => (
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
      </section>
    </>
  );
}
