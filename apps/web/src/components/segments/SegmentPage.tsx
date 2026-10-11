import Link from "next/link";
import { BASIC_COLORS, DESIGN_HUBS, formatVND, GARMENT_PRODUCT, GROUP_MIN_QTY, SEGMENTS, type Segment } from "@pod/shared";
import { getProducts, getSettings } from "@/lib/api";
import { pastel } from "@/lib/pastel";
import { B2BQuoteForm } from "@/components/b2b/B2BQuoteForm";
import { TeamLineup } from "@/components/group/TeamLineup";
import { GroupSteps } from "@/components/landing/GroupHero";

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

      {/* Hero */}
      <section className="border-b border-line bg-cream">
        <div className="container-site grid items-center gap-8 py-8 md:grid-cols-[1.05fr_1fr] md:gap-10 md:py-14">
          <div>
            <p className="eyebrow">{s.eyebrow}</p>
            <h1 className="mt-3 font-display text-[clamp(28px,3.8vw,46px)] font-extrabold leading-[1.15] tracking-[-0.02em] [font-stretch:86%] [text-wrap:balance]">{s.title}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">{s.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={studioHref(first)} className="btn-primary px-6 py-3">
                Thiết kế áo nhóm ngay
              </Link>
              <a href="#bao-gia" className="btn-outline bg-white px-6 py-3">
                Nhận báo giá
              </a>
              {zalo && (
                <a href={zalo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-3 text-sm font-semibold underline underline-offset-4 hover:text-brand">
                  Chat Zalo
                </a>
              )}
            </div>
          </div>
          <div className={`rounded-2xl border border-line px-3 py-4 shadow-sticker md:p-6 ${s.lineup.color === "trang" || s.lineup.color === "kem" ? "bg-sky/60" : "bg-white"}`}>
            <TeamLineup team={s.lineup.team} color={s.lineup.color} people={s.lineup.people} />
          </div>
        </div>
        <div className="container-site pb-8 md:pb-12">
          <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {facts.map((f, i) => (
              <li key={f.v} className={`rounded-2xl border border-line px-4 py-3 shadow-sticker-sm ${pastel(i + 1)}`}>
                <p className="font-display text-[clamp(17px,2vw,24px)] font-extrabold leading-tight [font-stretch:90%]">{f.v}</p>
                <p className="mt-0.5 text-sm leading-snug text-ink/75">{f.l}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dịp / ý tưởng */}
      <section className="py-10 md:py-14">
        <div className="container-site">
          <p className="eyebrow">Dùng cho</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {s.useCases.map((u, i) => (
              <li key={u}>
                <a href={`#bao-gia`} className={`chip-sticker inline-block ${pastel(i)}`}>
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tính năng */}
      {s.features.length > 0 && (
        <section className="pb-12 md:pb-16">
          <div className="container-site">
            <h2 className="h-section [text-wrap:balance]">Làm áo nhóm không còn là việc của một người</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:mt-7 md:gap-5 lg:grid-cols-4">
              {s.features.map((f, i) => (
                <li key={f.title} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-sticker-sm md:block md:p-5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-sm font-extrabold ${pastel(i + 2)}`}>{i + 1}</span>
                  <div>
                    <h3 className="text-[16px] font-bold leading-snug md:mt-3 md:text-[17px]">{f.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted md:mt-1.5">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <GroupSteps />

      {/* Sản phẩm gợi ý */}
      <section className="py-12 md:py-16">
        <div className="container-site">
          <p className="eyebrow">Sản phẩm gợi ý</p>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section">Chọn áo, bấm để thiết kế</h2>
            {DESIGN_HUBS.filter((h) => h.segment === s.key).map((h) => (
              <Link key={h.slug} href={`/${h.slug}`} className="text-[15px] font-semibold underline underline-offset-4 hover:text-brand-dark">
                Xem {h.name.charAt(0).toLocaleLowerCase("vi") + h.name.slice(1)} có sẵn
              </Link>
            ))}
          </div>
          <ul className="mt-7 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {s.products.map((p, i) => {
              const g = GARMENT_PRODUCT[p.garment];
              const from = price.get(g.slug);
              return (
                <li key={`${p.garment}-${p.color}`}>
                  <Link href={studioHref(p)} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sticker-sm transition hover:-translate-y-0.5">
                    <div className={`relative aspect-square border-b border-line ${pastel(i + 3)}`}>
                      <img src={`/blanks/${p.garment}-${p.color}.webp`} alt={`${g.label} ${BASIC_COLORS[p.color].name}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-1 flex-col p-3 md:p-4">
                      <h3 className="text-[15px] font-bold leading-snug md:text-base">{g.label}</h3>
                      <p className="mt-0.5 flex-1 text-sm text-muted">{p.note}</p>
                      <p className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold">
                        {from ? <span>Từ {formatVND(from)}</span> : <span />}
                        <span className="text-brand">Thiết kế →</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {s.extras && (
            <p className="mt-6 rounded-2xl bg-surface px-5 py-4 text-[15px] leading-relaxed">
              {s.extras}{" "}
              <a href="#bao-gia" className="font-semibold text-brand underline underline-offset-4">
                Gửi yêu cầu
              </a>
            </p>
          )}
        </div>
      </section>

      {/* Hỏi đáp */}
      {s.faq.length > 0 && (
        <section className="border-t border-line py-12 md:py-16">
          <div className="container-site max-w-3xl">
            <h2 className="h-section">Câu hỏi thường gặp</h2>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {s.faq.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold">
                    {f.q}
                    <span className="mt-0.5 text-xl leading-none text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Báo giá */}
      <section id="bao-gia" className="scroll-mt-28 bg-cream py-12 md:py-16">
        <div className="container-site grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="eyebrow">Nhận báo giá</p>
            <h2 className="h-section mt-1.5">Gửi nhu cầu – YALA tư vấn & làm mockup miễn phí</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Muốn tự làm? Thiết kế trong YALA Studio và đặt ngay trên web. Cần tư vấn chất liệu, số lượng lớn hoặc nhiều món – để lại thông tin, YALA liên hệ trong giờ làm việc.
            </p>
            <ul className="mt-5 space-y-2 text-[15px]">
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
            </ul>
          </div>
          <B2BQuoteForm solutions={s.useCases.map((u) => ({ key: u, title: u }))} industries={[]} zalo={brand.zalo} hotline={brand.hotline} segment={s.eyebrow} notePlaceholder={s.notePlaceholder} />
        </div>
      </section>

      {/* Nhóm khách khác */}
      <section className="py-10 md:py-12">
        <div className="container-site">
          <p className="eyebrow">YALA cũng làm cho</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {others.map((o, i) => (
              <li key={o.key}>
                <Link href={o.href} className={`group block h-full rounded-2xl border border-line p-4 shadow-sticker-sm transition hover:-translate-y-0.5 ${pastel(i + 4)}`}>
                  <p className="text-lg font-extrabold">{o.name} →</p>
                  <p className="mt-1 text-[15px] leading-snug text-ink/75">{o.pitch}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
