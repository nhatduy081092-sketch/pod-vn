import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { beforeDeadline, campaignLive, DESIGN_COLLECTIONS, luminance, vnDayStart, vnShortDate, type Campaign } from "@pod/shared";
import { getProducts, getSettings } from "@/lib/api";
import { assetUrl } from "@/lib/config";
import { basicPrices } from "@/lib/basic-prices";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { DeadlineCountdown } from "@/components/campaign/DeadlineCountdown";
import { pastel } from "@/lib/pastel";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;
type Search = Promise<{ tab?: string }>;

async function findCampaign(slug: string): Promise<{ c: Campaign; all: Campaign[] } | null> {
  const s = await getSettings();
  const c = s.campaigns.find((x) => x.slug === slug && x.enabled);
  return c ? { c, all: s.campaigns.filter((x) => x.enabled) } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const r = await findCampaign(slug);
  if (!r) return { title: "Không tìm thấy" };
  const { c } = r;
  return {
    title: `${c.title} | ${c.eyebrow}`,
    description: c.subtitle,
    alternates: { canonical: `/dip/${c.slug}` },
    openGraph: { title: c.title, description: c.subtitle, images: c.heroImage ? [assetUrl(c.heroImage)] : undefined },
  };
}

/**
 * Trang chiến dịch theo dịp (học cách làm trang "activity" của Printdoors, tối ưu cho khách Việt):
 * banner chủ đề + đếm ngược hạn chót → ruy băng chữ chạy → mẫu chữ của dịp → tab sản phẩm → cách đặt kịp dịp
 * → khối doanh nghiệp → hỏi đáp → dịp khác. Sản phẩm trước, trang trí sau; không bật chat che màn hình.
 */
export default async function CampaignPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const r = await findCampaign(slug);
  if (!r) notFound();
  const { c, all } = r;
  const now = new Date();
  const live = campaignLive(c, now);
  const upcoming = now < vnDayStart(c.startsAt);
  const canOrder = beforeDeadline(c, now);
  const fg = c.dark ? "#ffffff" : "#1d1d1f";
  const accentFg = luminance(c.accent) > 0.45 ? "#1d1d1f" : "#ffffff";

  const tabIdx = Math.min(Math.max(0, Number(sp.tab) || 0), Math.max(0, c.tabs.length - 1));
  const tab = c.tabs[tabIdx];
  const collections = c.collections.map((s) => DESIGN_COLLECTIONS.find((x) => x.slug === s)).filter((x): x is NonNullable<typeof x> => !!x);
  const designs = collections.flatMap((col) => col.designs).slice(0, 8);
  const [list, prices] = await Promise.all([
    tab ? getProducts({ kw: tab.q || undefined, category: tab.category || undefined, pageSize: "12" }).catch(() => null) : Promise.resolve(null),
    basicPrices(),
  ]);
  const products = list?.items ?? [];
  const others = all.filter((x) => x.slug !== c.slug);

  const faqLd = c.faq.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;
  const ribbon = c.ribbon.length ? c.ribbon : [c.name];
  const unit = (
    <>
      {ribbon.map((w, i) => (
        <span key={i} className="flex shrink-0 items-center gap-6">
          {w}
          <span aria-hidden>✦</span>
        </span>
      ))}
    </>
  );

  return (
    <>
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <DesignFonts designs={designs} />

      {/* ---------- Banner chủ đề ---------- */}
      <section className="relative overflow-hidden" style={{ backgroundColor: c.bg, color: fg }}>
        <div className="container-site relative grid items-center gap-10 pb-14 pt-8 md:grid-cols-[1.05fr_1fr] md:pb-20 md:pt-14">
          <div>
            <span className="chip-sticker -rotate-2" style={{ backgroundColor: c.accent, color: accentFg }}>
              {c.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-[clamp(38px,5.6vw,76px)] font-extrabold leading-[0.95] tracking-[-0.03em] [font-stretch:86%] [text-wrap:balance]">{c.title}</h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed opacity-80 md:text-lg">{c.subtitle}</p>

            {live && canOrder && c.deadline ? (
              <div className="mt-6">
                <p className="text-sm font-bold">
                  Đặt trước <span style={{ color: c.dark ? c.accent : undefined }}>23:59 ngày {vnShortDate(c.deadline)}</span> để nhận kịp dịp
                </p>
                <div className="mt-2">
                  <DeadlineCountdown deadline={c.deadline} dark={c.dark} />
                </div>
              </div>
            ) : (
              <p className="mt-6 inline-block rounded-xl border-2 border-current px-3 py-2 text-sm font-bold">
                {upcoming ? `Chương trình bắt đầu từ ${vnShortDate(c.startsAt)}` : live ? "Đã qua hạn chót giao kịp dịp – vẫn đặt in bình thường" : "Chương trình đã kết thúc – hẹn bạn mùa sau"}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#san-pham" className="btn-primary px-7 py-3.5 text-base">
                Chọn quà {c.name}
              </a>
              <Link href="/thiet-ke" className={c.dark ? "btn border-white bg-transparent px-7 py-3.5 text-base text-white hover:bg-white hover:text-ink" : "btn-outline px-7 py-3.5 text-base"}>
                Tự thiết kế
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            {c.heroImage ? (
              <div className="sticker tilt overflow-hidden shadow-sticker-lg" style={{ ["--r" as string]: "2deg" }}>
                <img src={assetUrl(c.heroImage)} alt={c.title} className="aspect-[4/3] h-full w-full object-cover" fetchPriority="high" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {designs.slice(0, 4).map((d, i) => (
                  <div key={d.slug} className={`sticker tilt overflow-hidden ${pastel(i)}`} style={{ ["--r" as string]: `${i % 2 ? 2 : -2}deg` }}>
                    <ReadyDesignCard d={d} />
                  </div>
                ))}
              </div>
            )}
            {c.discountPercent > 0 && (
              <span className="pop-in absolute -left-3 -top-4 grid h-24 w-24 -rotate-12 place-items-center rounded-full border-2 border-ink text-center font-display font-extrabold leading-none shadow-sticker" style={{ backgroundColor: c.accent, color: accentFg }}>
                <span>
                  <span className="block text-[13px]">Giảm</span>
                  <span className="block text-[30px]">{c.discountPercent}%</span>
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Ruy băng chữ chạy chéo ---------- */}
      <div className="relative h-[92px] overflow-hidden md:h-[120px]" aria-hidden style={{ backgroundColor: c.bg }}>
        <div className="absolute inset-x-[-5%] top-[18%] -rotate-2 border-y-2 border-ink py-2 md:py-2.5" style={{ backgroundColor: c.accent, color: accentFg }}>
          <div className="animate-marquee flex w-max gap-6 font-display text-[clamp(18px,2.4vw,30px)] font-extrabold uppercase leading-none [font-stretch:85%]">
            {unit}
            {unit}
            {unit}
            {unit}
          </div>
        </div>
        <div className="absolute inset-x-[-5%] top-[52%] rotate-1 border-y-2 border-ink bg-ink py-2 text-white md:py-2.5">
          <div className="animate-marquee-rev flex w-max gap-6 font-display text-[clamp(18px,2.4vw,30px)] font-extrabold uppercase leading-none [font-stretch:85%]">
            {unit}
            {unit}
            {unit}
            {unit}
          </div>
        </div>
      </div>

      {/* ---------- Sản phẩm theo tab ---------- */}
      <section id="san-pham" className="scroll-mt-28 py-12 md:py-16">
        <div className="container-site">
          <h2 className="h-section text-center">Chọn quà {c.name}</h2>
          {c.tabs.length > 1 && (
            <div className="no-scrollbar mt-6 flex justify-start gap-2.5 overflow-x-auto pb-2 md:justify-center" role="tablist">
              {c.tabs.map((t, i) => (
                <Link
                  key={t.label}
                  href={`/dip/${c.slug}?tab=${i}#san-pham`}
                  scroll={false}
                  role="tab"
                  aria-selected={i === tabIdx}
                  className={`shrink-0 rounded-full border-2 px-5 py-2 text-sm font-bold transition ${i === tabIdx ? "border-ink shadow-sticker-sm" : "border-ink/15 bg-white hover:border-ink"}`}
                  style={i === tabIdx ? { backgroundColor: c.accent, color: accentFg } : undefined}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8">
            {products.length ? (
              <ProductGrid items={products} />
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-ink/20 p-8 text-center text-muted">Đang cập nhật sản phẩm cho mục này – xem mẫu chữ bên dưới hoặc tự thiết kế.</p>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Mẫu chữ của dịp ---------- */}
      {designs.length > 0 && (
        <section id="mau" className="scroll-mt-28 border-y-2 border-ink bg-surface py-12 md:py-16">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="h-section">Mẫu chữ có sẵn cho {c.name}</h2>
                <p className="mt-2 text-[15px] text-muted">Chọn mẫu, sửa tên – lời chúc theo ý bạn, in từ 1 chiếc.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {collections.map((col, i) => (
                  <Link key={col.slug} href={`/bo-suu-tap/${col.slug}`} className={`chip-sticker hover-wiggle ${pastel(i)}`}>
                    {col.name}
                  </Link>
                ))}
              </div>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
              {designs.map((d) => (
                <li key={d.slug}>
                  <ReadyDesignCard d={d} price={prices[d.garment]} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Cách đặt kịp dịp ---------- */}
      <section className="py-12 md:py-16">
        <div className="container-site">
          <h2 className="h-section">Đặt sao cho kịp {c.name}?</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Chọn & sửa mẫu", "Chọn sản phẩm hoặc mẫu chữ, sửa tên – lời chúc, xem trước ngay trên web."],
              ["Sản xuất 2–4 ngày", "Xưởng in đúng file đã duyệt, kiểm tra từng sản phẩm trước khi gửi."],
              [c.deadline ? `Đặt trước ${vnShortDate(c.deadline)}` : "Giao toàn quốc", "Giao 1–3 ngày, COD toàn quốc – nhận kịp trước dịp."],
            ].map(([t, d], i) => (
              <li key={t} className={`sticker tilt p-6 ${pastel(i)}`} style={{ ["--r" as string]: `${i === 1 ? 1 : -1}deg` }}>
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-white font-display text-lg font-extrabold">{i + 1}</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight">{t}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink/80">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Doanh nghiệp ---------- */}
      {c.b2bTitle && (
        <section className="border-y-2 border-ink bg-ink py-12 text-white md:py-16">
          <div className="container-site grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm font-semibold" style={{ color: c.accent === "#1d1d1f" ? undefined : c.accent }}>
                Cho doanh nghiệp
              </p>
              <h2 className="mt-1.5 font-display text-[clamp(28px,3.6vw,44px)] font-extrabold leading-[1.04] [font-stretch:88%]">{c.b2bTitle}</h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/75 md:text-base">{c.b2bText}</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/doanh-nghiep#bao-gia" className="btn-primary px-6 py-3">
                Nhận báo giá
              </Link>
              <Link href="/doanh-nghiep/san-pham" className="btn border-white bg-transparent px-6 py-3 text-white hover:bg-white hover:text-ink">
                Xem quà doanh nghiệp
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Hỏi đáp + dịp khác ---------- */}
      <section className="py-12 md:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          {c.faq.length > 0 && (
            <div>
              <h2 className="h-section">Hỏi nhanh</h2>
              <div className="mt-6 space-y-3">
                {c.faq.map((f) => (
                  <details key={f.q} className="group rounded-2xl border-2 border-ink/10 bg-white p-5 open:border-ink">
                    <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="h-section">Dịp khác</h2>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/dip/${o.slug}`} className="sticker hover-wiggle block p-4" style={{ backgroundColor: o.bg, color: o.dark ? "#fff" : "#1d1d1f" }}>
                      <span className="block font-display text-xl font-extrabold">{o.name}</span>
                      <span className="mt-1 block text-[13px] opacity-75">
                        {vnShortDate(o.startsAt)} – {vnShortDate(o.endsAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
