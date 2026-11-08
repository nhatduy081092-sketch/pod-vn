import Link from "next/link";
import { fillMerch, MERCH_PAGES, type MerchPage } from "@pod/shared";
import { getProducts, getSettings } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { ProductGrid, priceLabelOf } from "@/components/shop/ProductCard";
import { AddToQuote } from "@/components/b2b/AddToQuote";
import { PhotoCollage } from "@/components/b2b/PhotoCollage";
import { rise } from "@/components/landing/HomeSections";
import { MaskTitle } from "@/components/motion/MaskTitle";
import { CountUp } from "@/components/motion/CountUp";
import { assetUrl } from "@/lib/config";
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
  // 6 trang gần nhất: cùng dịp tặng trước, rồi đến các trang còn lại (toàn bộ vẫn có trong sitemap và trang danh mục)
  const rest = MERCH_PAGES.filter((x) => x.slug !== m.slug);
  const others = [...rest.filter((x) => x.dip === m.dip), ...rest.filter((x) => x.dip !== m.dip)].slice(0, 6);
  // ảnh cạnh "mẹo chọn": mẫu thứ 5 trở đi (4 mẫu đầu đã ở đầu trang); ít mẫu quá thì bỏ ảnh
  const pick = items.slice(4).find((p) => p.images[0]);

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
              <dl className="mt-10 grid max-w-[36rem] grid-cols-2 gap-x-6 gap-y-5 border-t border-ink/15 pt-6 sm:grid-cols-4">
                {[...terms, { label: "Báo giá", value: s.b2bQuote.responseTime }].map((t, i) => (
                  <div key={t.label} {...rise(i + 2)}>
                    <dt className="text-[15px] text-ink/70">{t.label}</dt>
                    <dd className="mt-0.5 text-[17px] font-semibold leading-snug">{t.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {items.length >= 4 && (
            <div {...rise(1)}>
              <PhotoCollage images={items.slice(0, 4).map((p) => ({ src: p.images[0] ?? "", alt: p.name }))} className="mx-auto w-full max-w-[34rem]" />
            </div>
          )}
        </div>
      </section>

      {/* Sản phẩm thật trong danh mục – thêm nhiều mẫu vào 1 yêu cầu báo giá */}
      <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="mau">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <MaskTitle id="mau" className={h2Big}>
            <CountUp value={String(total)} className="text-brand" /> mẫu {m.noun} nhận in logo
          </MaskTitle>
          <p className="max-w-[34rem] text-base leading-relaxed md:text-lg lg:pb-1" {...rise(2)}>
            Bấm “+ Thêm vào báo giá” ở các mẫu muốn so, rồi gửi một yêu cầu kèm số lượng và file logo.
          </p>
        </div>
        {items.length > 0 ? (
          <div className="mt-10 md:mt-14" {...rise(1)}>
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
          <div className="lg:sticky lg:top-28 lg:self-start">
            <MaskTitle id="cach-in" className={h2Big}>
              Logo lên sản phẩm bằng cách nào
            </MaskTitle>
            <p className="mt-5 max-w-[30rem] text-base leading-relaxed md:text-lg" {...rise(2)}>
              Kỹ thuật phù hợp tuỳ chất liệu từng mẫu – YALA ghi rõ trong mockup và báo giá.
            </p>
            <Link href="/ky-thuat-in-logo" className="mt-5 inline-flex items-center gap-2 text-base font-semibold underline underline-offset-4 hover:text-brand-dark" {...rise(3)}>
              So sánh các kỹ thuật in logo <Arrow />
            </Link>
          </div>
          {/* mỗi kỹ thuật một hàng, vạch cam vẽ dần theo thứ tự thay đường kẻ xám */}
          <ul className="border-b border-ink/15">
            {m.methods.map((x, i) => (
              <li key={x.name} className="relative grid gap-1 pb-6 pt-5 sm:grid-cols-[3rem_minmax(0,11rem)_minmax(0,1fr)] sm:gap-6" {...rise(i)}>
                <span className="absolute inset-x-0 top-0 h-px bg-ink/15" aria-hidden />
                <span className="draw-rule absolute left-0 top-0 w-16 bg-brand" aria-hidden />
                <span aria-hidden className="hidden font-display text-[15px] font-semibold tabular-nums text-brand sm:block sm:pt-1.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
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
        {/* cột trái: tiêu đề + 1 ảnh sản phẩm thật chưa xuất hiện ở đầu trang (đỡ khoảng trống dưới tiêu đề) */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <MaskTitle id="meo" className={h2Big}>
            Chọn {m.noun.split(",")[0]} làm quà
          </MaskTitle>
          {pick && (
            <Link href={`/san-pham/${pick.slug}`} className="group mt-8 hidden max-w-[22rem] lg:block" {...rise(1)}>
              <span className="sticker block aspect-square overflow-hidden bg-white">
                <img src={assetUrl(pick.images[0]!)} alt={pick.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="mt-3 block text-[15px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{pick.name}</span>
            </Link>
          )}
        </div>
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {m.tips.map((t, i) => (
            <div key={t.title} {...rise(i)}>
              <span className="draw-rule mb-5 w-12 bg-brand" aria-hidden />
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
            <MaskTitle id="quy-trinh" className={h2Big}>
              Từ yêu cầu đến lúc giao
            </MaskTitle>
            <ol className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
              {s.b2bHub.process.map((p, i) => (
                <li key={p.title} className="relative pt-5" {...rise(i)}>
                  <span className="absolute inset-x-0 top-0 h-px bg-white/20" aria-hidden />
                  <span className="draw-rule absolute inset-x-0 top-0 bg-brand" aria-hidden />
                  <p className="font-display text-[clamp(28px,2.4vw,36px)] font-bold leading-none tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-3 text-xl font-bold">{p.title}</p>
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
          ].map((l, i) => (
            <li key={l.href} {...rise(i % 2)}>
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
