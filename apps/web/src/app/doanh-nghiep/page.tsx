import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getHome } from "@/lib/api";
import type { HomeData } from "@/lib/types";
import { assetUrl } from "@/lib/config";
import { MerchKit } from "@/components/b2b/MerchKit";
import { B2BQuoteForm } from "@/components/b2b/B2BQuoteForm";
import { MaskTitle } from "@/components/motion/MaskTitle";
import { SEGMENTS } from "@pod/shared";

// khu doanh nghiệp: khoảng thở rộng + tiêu đề lớn cho khách ra quyết định (leader / phòng hành chính)
const SECTION = "scroll-mt-32 py-[clamp(64px,11vh,128px)]";
const H2 = "h-section mt-2 max-w-4xl text-[clamp(28px,3.4vw,46px)] tracking-[-0.025em] [text-wrap:balance]";

// từ khoá "đồng phục công ty số lượng ít" – nội dung khớp điều kiện mặc định trong CMS (b2bHub.terms)
const FAQ = [
  { q: "Đặt đồng phục công ty số lượng ít được không?", a: "Được. Đơn nhóm từ 10 áo, in theo thiết kế của công ty. Ít hơn 10 áo vẫn đặt được, tính như mua lẻ. Quà tặng khác theo số lượng tối thiểu ghi trên từng sản phẩm." },
  { q: "Đặt 10 áo đồng phục thì bao lâu nhận được?", a: "Đơn áo in đặt online sản xuất trong 2–4 ngày, cộng thời gian giao hàng. Quà tặng số lượng lớn hoặc cần đóng hộp: báo thời gian theo từng dự án." },
  { q: "In tên từng nhân viên có tính thêm phí không?", a: "Không. Khi đặt theo nhóm, mỗi áo in đúng tên một nhân viên. Có thể gửi link gom đơn để nhân viên tự ghi tên và size." },
  { q: "Có xem mẫu trước khi đặt không?", a: "Có, miễn phí. Tự đặt logo lên áo bằng YALA Studio và xem mockup ngay, hoặc gửi logo để YALA làm mockup giúp trước khi báo giá." },
  { q: "Có xuất hoá đơn VAT cho công ty không?", a: "Có. Ghi thông tin xuất hoá đơn khi đặt hàng, YALA xuất hoá đơn điện tử cho doanh nghiệp." },
  { q: "Công ty có nhiều chi nhánh thì giao thế nào?", a: "Giao toàn quốc, một điểm hoặc chia nhiều chi nhánh theo danh sách công ty gửi." },
];

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Đồng phục công ty, quà tặng & merchandise in logo – xem mockup ngay",
  description:
    "Hệ thống merchandise in logo cho doanh nghiệp: đồng phục công ty, áo đồng phục văn phòng, quà tặng, welcome kit, túi, bình, sổ. Tự đặt logo và xem mockup ngay, số lượng ít từ 10 sản phẩm, đơn lớn nhận báo giá theo ngân sách.",
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

  const jsonLd = [
    {
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
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      {/* Đầu trang: tiêu đề chạy hết bề ngang ở cỡ trưng bày (2 dòng trên máy tính) là điểm nhấn duy nhất;
          dưới là lời dẫn + nút + điều kiện bên trái, 4 ảnh sản phẩm thật phẳng bên phải (không khung, không nghiêng/bóng) */}
      <section className="bg-ink text-white">
        <div className="container-site py-12 md:py-20">
          <h1 className="max-w-[1180px] font-display text-[clamp(32px,4.8vw,70px)] font-bold leading-[1.04] tracking-[-0.035em] [text-wrap:balance]">{hub.title}</h1>
          <div className="mt-8 grid gap-10 md:mt-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-14">
            <div>
              <p className="max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{hub.subtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#bao-gia" className="btn-primary px-7 py-3.5 text-base">
                  Nhận báo giá miễn phí
                </a>
                {zalo && (
                  <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn border-white/30 bg-transparent px-7 py-3.5 text-base text-white hover:border-white hover:bg-white hover:text-ink">
                    Chat Zalo tư vấn
                  </a>
                )}
              </div>
              {/* điều kiện đặt hàng nói rõ ngay đầu trang – khách so sánh với đơn vị khác không cần hỏi; giá trị trước, tên điều kiện sau */}
              <ul className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-7">
                {(hub.terms.length ? hub.terms.slice(0, 4).map((t) => ({ value: t.value, label: t.label })) : settings.b2b.stats).map((s) => (
                  <li key={s.label}>
                    <p className="font-display text-[22px] font-bold leading-tight tracking-[-0.015em] md:text-2xl">{s.value}</p>
                    <p className="mt-1 text-base leading-snug text-white/70">{s.label}</p>
                  </li>
                ))}
              </ul>
            </div>
            {photos.length >= 4 ? (
              <ul className="grid grid-cols-2 gap-3 md:gap-4" aria-label="Sản phẩm in logo tiêu biểu">
                {photos.slice(0, 4).map((p) => (
                  <li key={p.src} className="aspect-square overflow-hidden rounded-lg bg-white">
                    <img src={assetUrl(p.src)} alt={p.alt} decoding="async" className="h-full w-full object-contain p-[8%]" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="overflow-hidden rounded-lg bg-peach">
                <MerchKit className="h-auto w-full" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mục lục nhanh */}
      <nav className="sticky top-12 z-30 bg-surface md:top-16 lg:top-[108px]" aria-label="Trong trang này">
        <div className="container-site no-scrollbar flex h-11 items-center gap-6 overflow-x-auto text-sm font-medium">
          {(
            [
              hub.terms.length ? ["#dieu-kien", "Điều kiện đặt hàng"] : null,
              ["#nganh-hang", "Ngành hàng"],
              ["#giai-phap", "Giải pháp theo dịp"],
              hub.cases.length ? ["#du-an", "Dự án đã làm"] : null,
              ["#quy-trinh", "Quy trình"],
              ["#vi-sao", "Vì sao chọn YALA"],
              ["#hoi-dap", "Hỏi đáp"],
              ["#bao-gia", "Nhận báo giá"],
            ].filter(Boolean) as [string, string][]
          ).map(([h, l]) => (
            <a key={h} href={h} className={`shrink-0 whitespace-nowrap ${h === "#bao-gia" ? "font-semibold text-brand-dark" : "text-ink/80 hover:text-ink"}`}>
              {l}
            </a>
          ))}
        </div>
      </nav>

      {/* Điều kiện đặt hàng + so sánh cách đặt */}
      {hub.terms.length > 0 && (
        <section id="dieu-kien" className={SECTION}>
          <div className="container-site">
            <MaskTitle className={H2}>Đồng phục công ty số lượng ít, từ 10 áo</MaskTitle>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/75">Điều kiện rõ ràng trước khi bạn nhắn tin – không cần đặt hàng trăm áo mới có đồng phục cho team.</p>
            {/* điều kiện = danh sách chữ lớn có vạch kẻ, không thẻ pastel / bóng */}
            <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-10">
              {hub.terms.map((t, i) => (
                <li key={t.label} data-reveal="rise" style={{ ["--d" as string]: `${(i % 3) * 80}ms` }}>
                  <span className="draw-rule bg-ink" aria-hidden />
                  <p className="mt-4 font-display text-[clamp(22px,2.6vw,34px)] font-bold leading-[1.12] tracking-[-0.02em]">{t.value}</p>
                  <p className="mt-1.5 text-base font-semibold text-ink/75">{t.label}</p>
                  {t.note && <p className="mt-2 max-w-[22rem] text-base leading-snug text-ink/75">{t.note}</p>}
                </li>
              ))}
            </ul>

            {hub.compare.length > 0 && (
              <div data-reveal="rise" className="mt-14 overflow-hidden rounded-xl">
                <div className="grid grid-cols-[1fr_1fr] bg-ink text-sm font-semibold text-white md:grid-cols-[0.8fr_1fr_1fr] md:text-base">
                  <span className="hidden px-5 py-3 md:block" />
                  <span className="px-4 py-3 text-white/70 md:px-5">Đặt merch kiểu thông thường</span>
                  <span className="bg-brand px-4 py-3 md:px-5">Đặt với YALA</span>
                </div>
                <ul>
                  {hub.compare.map((c, ci) => (
                    <li key={c.label} className={`grid grid-cols-[1fr_1fr] text-base md:grid-cols-[0.8fr_1fr_1fr] ${ci % 2 ? "bg-surface" : "bg-white"}`}>
                      <span className="col-span-2 px-4 pb-1 pt-3 font-semibold text-ink md:col-span-1 md:px-5 md:py-4">{c.label}</span>
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
            <div className="mt-8 flex flex-wrap gap-3">
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
      <section id="nganh-hang" className={SECTION}>
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <MaskTitle className={H2}>In logo lên gần như mọi thứ doanh nghiệp cần</MaskTitle>
            <Link href="/doanh-nghiep/san-pham" className="text-base font-semibold underline underline-offset-4 hover:text-brand">
              Xem tất cả sản phẩm, lọc theo ngân sách →
            </Link>
          </div>
          {/* ảnh sản phẩm thật trên nền nhạt, không viền thẻ – cùng ngôn ngữ khối danh mục trang chủ */}
          <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
            {hub.industries.map((i, idx) => {
              const cat = bySlug.get(i.slug);
              const href = cat ? `/doanh-nghiep/san-pham?nganh=${i.slug}` : `/doanh-nghiep?nganh=${i.slug}#bao-gia`;
              return (
                <li key={i.slug} id={`nganh-${i.slug}`} className="scroll-mt-32" data-reveal="rise" style={{ ["--d" as string]: `${(idx % 3) * 70}ms` }}>
                  <Link href={href} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface">
                      {cat?.image ? (
                        <img src={assetUrl(cat.image)} alt={i.name} loading="lazy" className="h-full w-full object-contain p-[7%] mix-blend-multiply transition duration-700 group-hover:scale-[1.04]" />
                      ) : (
                        // chưa có sản phẩm: ô chữ thay ảnh, giữ lưới đều
                        <div className="flex h-full flex-col justify-end p-5 md:p-7" aria-hidden>
                          <span className="font-display text-[clamp(17px,2vw,26px)] font-bold leading-[1.15] tracking-[-0.015em] text-ink/70 [text-wrap:balance]">{i.blurb}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-display text-[17px] font-bold leading-snug transition-colors group-hover:text-brand-dark md:text-xl">{i.name}</h3>
                    <p className="mt-1 text-base leading-snug text-ink/70">{cat?.image ? i.blurb : "Đang cập nhật sản phẩm – nhận tư vấn & báo giá theo yêu cầu"}</p>
                    <p className="mt-2.5 text-base font-semibold text-ink">
                      {cat ? `Xem ${cat.count} sản phẩm` : "Nhận tư vấn"} <span className="inline-block transition group-hover:translate-x-1">→</span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Giải pháp theo dịp */}
      <section id="giai-phap" className={`${SECTION} bg-surface`}>
        <div className="container-site">
          <MaskTitle className={H2}>Bạn đang chuẩn bị cho dịp nào?</MaskTitle>
          {/* dạng dòng có vạch kẻ, không thẻ trắng / đánh số */}
          <ul className="mt-12 grid gap-x-12 md:grid-cols-2 lg:grid-cols-3">
            {hub.solutions.map((s, idx) => (
              <li key={s.key} id={`giai-phap-${s.key}`} className="scroll-mt-32 flex flex-col pb-10" data-reveal="rise" style={{ ["--d" as string]: `${(idx % 3) * 70}ms` }}>
                <h3 className="font-display text-xl font-bold leading-snug tracking-[-0.01em] md:text-[22px]">{s.title}</h3>
                <p className="mt-2 flex-1 text-base leading-relaxed text-ink/75">{s.desc}</p>
                {s.items && <p className="mt-3 text-base font-medium text-ink">{s.items}</p>}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-base font-semibold">
                  {/* quà Tết có trang tĩnh riêng cho SEO */}
                  <Link href={s.key === "qua-tet" ? "/doanh-nghiep/qua-cuoi-nam" : `/doanh-nghiep/san-pham?dip=${s.key}`} className="text-ink hover:text-brand">
                    Xem sản phẩm gợi ý →
                  </Link>
                  <a href={`/doanh-nghiep?dip=${s.key}#bao-gia`} className="text-ink/60 hover:text-brand">
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
        <section id="du-an" className={SECTION}>
          <div className="container-site">
            <MaskTitle className={H2}>Thành phẩm thật, giao thật</MaskTitle>
            <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {hub.cases.map((c, idx) => (
                <li key={c.title} data-reveal="rise" style={{ ["--d" as string]: `${(idx % 3) * 70}ms` }}>
                  {c.image && (
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface">
                      <img src={assetUrl(c.image)} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="pt-4">
                    {c.client && <p className="text-sm font-semibold text-brand">{c.client}</p>}
                    <h3 className="mt-0.5 text-base font-semibold leading-snug md:text-lg">{c.title}</h3>
                    {c.detail && <p className="mt-1.5 text-base leading-relaxed text-muted">{c.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Quy trình */}
      <section id="quy-trinh" className={SECTION}>
        <div className="container-site">
          <MaskTitle className={H2}>Từ yêu cầu đến tay người nhận</MaskTitle>
          {/* vạch cam kẻ lần lượt theo thứ tự bước (line draw) – đọc ra trình tự, không cần vòng tròn số */}
          <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {hub.process.map((p, i) => (
              <li key={p.title} data-reveal="rise" style={{ ["--d" as string]: `${i * 110}ms` }}>
                <span className="draw-rule bg-brand" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-bold leading-snug md:text-xl">{p.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-ink/75">{p.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Lợi ích */}
      <section id="vi-sao" className={`${SECTION} bg-surface`}>
        <div className="container-site">
          <MaskTitle className={H2}>Một đầu mối, ít việc hơn cho bạn</MaskTitle>
          <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {hub.benefits.map((b, i) => (
              <li key={b.title} data-reveal="rise" style={{ ["--d" as string]: `${(i % 3) * 70}ms` }}>
                <h3 className="font-display text-lg font-bold leading-snug md:text-xl">{b.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-ink/75">{b.desc}</p>
              </li>
            ))}
          </ul>
          {clients.length > 0 && (
            <div className="mt-10">
              <p className="text-sm font-medium text-muted">Đã đồng hành cùng</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {clients.map((c) => (
                  <li key={c} className="rounded-full bg-white px-4 py-1.5 text-base font-semibold">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Hỏi đáp – từ khoá "đồng phục số lượng ít" */}
      <section id="hoi-dap" className={SECTION}>
        {/* cùng lề trái với cả trang: tiêu đề bên trái, câu hỏi bên phải (không thu khối vào giữa) */}
        <div className="container-site grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <MaskTitle className={H2}>Câu hỏi về đặt đồng phục số lượng ít</MaskTitle>
            <p className="mt-5 text-base">
              Muốn tự làm mẫu trước?{" "}
              <Link href="/thiet-ke-ao-dong-phuc-online" className="font-semibold underline underline-offset-4 hover:text-brand-dark">
                Thiết kế áo đồng phục online →
              </Link>
            </p>
          </div>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-lg bg-surface px-5 py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold md:text-[17px]">
                  {f.q}
                  <span className="mt-0.5 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-base leading-relaxed text-ink/80">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Báo giá */}
      <section id="bao-gia" className="scroll-mt-32 bg-white pb-14 md:pb-20">
        <div className="container-site grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div className="pt-2">
            <MaskTitle className={H2}>Gửi nhu cầu, nhận báo giá & mockup</MaskTitle>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Đơn nhỏ có thể đặt ngay trên website. Đơn số lượng lớn, quà tặng nhiều món hoặc cần đóng hộp – để lại thông tin, YALA tư vấn theo ngân sách và gửi mockup miễn phí.
            </p>
            <ul className="mt-5 space-y-2 text-base">
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

      {/* Nhóm khách tập thể khác */}
      <section className="bg-surface py-14 md:py-20">
        <div className="container-site">
          <h2 className="font-display text-[clamp(22px,2.2vw,28px)] font-bold tracking-[-0.02em]">Không phải doanh nghiệp?</h2>
          <ul className="mt-6 grid gap-x-10 sm:grid-cols-3">
            {SEGMENTS.filter((g) => g.key !== "doanh-nghiep").map((g) => (
              <li key={g.key}>
                <Link href={g.href} className="group block h-full py-4">
                  <p className="font-display text-lg font-bold transition-colors group-hover:text-brand-dark">
                    {g.name} <span className="inline-block transition group-hover:translate-x-1">→</span>
                  </p>
                  <p className="mt-1 text-base leading-snug text-ink/75">{g.pitch}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
