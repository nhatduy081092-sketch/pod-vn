import Link from "next/link";
import { BASIC_COLORS, DESIGN_HUBS, formatVND, GARMENT_PRODUCT, GROUP_MIN_QTY, SEGMENTS, type Segment } from "@pod/shared";
import { getProducts, getSettings } from "@/lib/api";
import { B2BQuoteForm } from "@/components/b2b/B2BQuoteForm";
import { heroActions, heroLead, HomeSteps, ObjectHero, rise } from "@/components/landing/HomeSections";
import { Arrow, Breadcrumb, Faq, h2Big, rowLink, splitTitle } from "@/components/seo/SeoBlocks";

export function segmentMetadata(s: Segment) {
  return {
    title: s.seoTitle,
    description: s.seoDescription,
    alternates: { canonical: s.href },
    openGraph: { title: s.seoTitle, description: s.seoDescription },
  };
}

const studioHref = (p: Segment["products"][number]) => `/thiet-ke/${GARMENT_PRODUCT[p.garment].slug}?mau=${encodeURIComponent(BASIC_COLORS[p.color].name)}`;

/** Trang theo nhóm khách tập thể (CLB thể thao, hội nhóm & lớp, team building) */
export async function SegmentPage({ segment: s }: { segment: Segment }) {
  const [settings, list] = await Promise.all([getSettings(), getProducts({ category: "yala-everyday", pageSize: "24" }).catch(() => null)]);
  const brand = settings.brand;
  const zalo = brand.zalo ? `https://zalo.me/${brand.zalo.replace(/\D/g, "")}` : "";
  const price = new Map((list?.items ?? []).map((p) => [p.slug, p.basePrice]));
  const first = s.products[0]!;
  const others = SEGMENTS.filter((x) => x.key !== s.key);
  const hubs = DESIGN_HUBS.filter((h) => h.segment === s.key);
  const [main, sub] = splitTitle(s.title);
  const facts = [
    { v: `Từ ${GROUP_MIN_QTY} sản phẩm`, l: "là đơn nhóm – ít hơn vẫn đặt được" },
    { v: "Tên & số riêng", l: "từng áo, không tính thêm phí" },
    { v: "1 link", l: "cả nhóm tự ghi tên, size" },
    { v: "Xem mockup ngay", l: "trên web, trước khi đặt" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      {s.faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <ObjectHero id="seg-title" title={main} lineup={s.lineup} before={<Breadcrumb name={s.name} />}>
        {sub && <p className="mt-5 text-xl font-semibold md:text-2xl">{sub}</p>}
        <p className={heroLead}>{s.subtitle}</p>
        <div className={heroActions}>
          <Link href={studioHref(first)} className="btn-primary px-7 py-3.5 text-base">
            Thiết kế áo nhóm ngay
          </Link>
          <a href="#bao-gia" className="btn-outline px-7 py-3.5 text-base">
            Nhận báo giá
          </a>
          {zalo && (
            <a href={zalo} target="_blank" rel="noopener noreferrer" className="px-2 py-3 text-base font-semibold underline underline-offset-4 transition-colors hover:text-brand-dark">
              Chat Zalo
            </a>
          )}
        </div>
      </ObjectHero>

      {/* 4 cam kết: chữ lớn, không thẻ */}
      <section className="container-site pt-[clamp(56px,9vh,110px)]" aria-label="Cam kết đơn nhóm">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-x-10">
          {facts.map((f, i) => (
            <li key={f.v} {...rise(i)}>
              <p className="font-display text-[clamp(24px,2.6vw,38px)] font-bold leading-[1.08] tracking-[-0.025em]">{f.v}</p>
              <p className="mt-2 text-base leading-snug">{f.l}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tính năng: tiêu đề rộng + dịp dùng, bên dưới 4 cột chữ */}
      {s.features.length > 0 && (
        <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="tinh-nang">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <h2 id="tinh-nang" className={h2Big}>
              Làm áo nhóm không còn là việc của một người
            </h2>
            {s.useCases.length > 0 && (
              <div className="lg:pb-1">
                <p className="text-[15px] font-semibold">Hợp cho</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {s.useCases.map((u) => (
                    <li key={u}>
                      <a href="#bao-gia" className="inline-block rounded-lg bg-surface px-3.5 py-2 text-[15px] font-medium transition-colors hover:bg-ink hover:text-white">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
            {s.features.map((f, i) => (
              <div key={f.title} {...rise(i)}>
                <h3 className="text-xl font-bold leading-snug">{f.title}</h3>
                <p className="mt-2 text-base leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <HomeSteps />

      {/* Sản phẩm gợi ý */}
      <section className="container-site py-[clamp(72px,12vh,150px)]" aria-labelledby="san-pham-goi-y">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h2 id="san-pham-goi-y" className={h2Big}>
            Chọn áo, bấm để thiết kế
          </h2>
          {hubs.length > 0 && (
            <ul className="space-y-1 lg:pb-1">
              {hubs.map((h) => (
                <li key={h.slug}>
                  <Link href={`/${h.slug}`} className="text-base font-semibold underline underline-offset-4 hover:text-brand-dark md:text-lg">
                    Xem {h.name.charAt(0).toLocaleLowerCase("vi") + h.name.slice(1)} có sẵn
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-14 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
          {s.products.map((p, i) => {
            const g = GARMENT_PRODUCT[p.garment];
            const from = price.get(g.slug);
            return (
              <li key={`${p.garment}-${p.color}`} {...rise(i % 4)}>
                <Link href={studioHref(p)} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
                    <img src={`/blanks/${p.garment}-${p.color}.webp`} alt={`${g.label} ${BASIC_COLORS[p.color].name}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold leading-snug md:text-[17px]">{g.label}</h3>
                  <p className="mt-0.5 text-[15px] leading-snug text-ink/80">{p.note}</p>
                  <p className="mt-2 flex items-center justify-between gap-2 text-base font-bold tabular-nums">
                    {from ? <span className="whitespace-nowrap">Từ {formatVND(from)}</span> : <span />}
                    <span className="hidden text-[15px] font-semibold text-brand-dark underline-offset-4 group-hover:underline md:inline">Thiết kế</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
        {s.extras && (
          <p className="mt-12 max-w-[44rem] text-lg leading-relaxed">
            {s.extras}{" "}
            <a href="#bao-gia" className="font-semibold underline underline-offset-4 hover:text-brand-dark">
              Gửi yêu cầu
            </a>
          </p>
        )}
      </section>

      <Faq items={s.faq} />

      {/* Báo giá */}
      <section id="bao-gia" className="scroll-mt-28 bg-surface py-[clamp(72px,12vh,150px)]" aria-labelledby="bao-gia-title">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
          <div>
            <h2 id="bao-gia-title" className={h2Big}>
              Nhận báo giá, mockup miễn phí
            </h2>
            <p className="mt-5 max-w-[32rem] text-base leading-relaxed md:text-lg">
              Muốn tự làm? Thiết kế trong YALA Studio và đặt ngay trên web. Cần tư vấn chất liệu, số lượng lớn hoặc nhiều món – để lại thông tin, YALA liên hệ trong giờ làm việc.
            </p>
            <ul className="mt-8 space-y-2 text-lg">
              {brand.hotline && (
                <li>
                  Hotline:{" "}
                  <a href={`tel:${brand.hotline.replace(/\s/g, "")}`} className="font-semibold tabular-nums hover:text-brand-dark">
                    {brand.hotline}
                  </a>
                </li>
              )}
              {zalo && (
                <li>
                  Zalo:{" "}
                  <a href={zalo} target="_blank" rel="noopener noreferrer" className="font-semibold tabular-nums hover:text-brand-dark">
                    {brand.zalo}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <B2BQuoteForm solutions={s.useCases.map((u) => ({ key: u, title: u }))} industries={[]} zalo={brand.zalo} hotline={brand.hotline} segment={s.eyebrow} notePlaceholder={s.notePlaceholder} />
        </div>
      </section>

      {/* Nhóm khách khác */}
      <section className="container-site grid gap-8 py-[clamp(72px,12vh,150px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16" aria-labelledby="nhom-khac">
        <h2 id="nhom-khac" className={h2Big}>
          YALA cũng làm cho
        </h2>
        <ul className="space-y-2">
          {others.map((o) => (
            <li key={o.key}>
              <Link href={o.href} className={rowLink}>
                <span>
                  <span className="block text-xl font-bold">{o.name}</span>
                  <span className="mt-0.5 block text-[15px] opacity-80">{o.pitch}</span>
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
