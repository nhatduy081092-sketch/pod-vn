import Link from "next/link";
import type { Lane, LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { pastel } from "@/lib/pastel";
import { MerchKit } from "../b2b/MerchKit";
import { PhotoCollage } from "../b2b/PhotoCollage";

/**
 * YALA là ai + 2 lối vào Cá nhân | Doanh nghiệp (thẻ sticker) + các dịch vụ dạng nhãn.
 * Khách từng vào khu Doanh nghiệp -> thẻ Doanh nghiệp tự lên trước (CSS theo html[data-lane]).
 */
export function Lanes({ data, b2bPhotos = [] }: { data: LandingSettings["positioning"]; /** ảnh thật sản phẩm doanh nghiệp (khi chưa đặt ảnh riêng cho lối Doanh nghiệp) */ b2bPhotos?: { src: string; alt: string }[] }) {
  if (!data.enabled) return null;
  return (
    <section className="py-12 md:py-20" aria-label="YALA làm gì" data-reveal>
      <div className="container-site">
        {data.statement && <h2 className="h-section max-w-4xl [text-wrap:balance]">{data.statement}</h2>}
        <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-2 md:gap-8">
          <LaneCard lane={data.personal} tone="light" className="lane-personal" tilt={-1} />
          <LaneCard lane={data.business} tone="dark" className="lane-business" tilt={1} photos={b2bPhotos} />
        </div>
        {data.services.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {data.services.map((s, i) => (
              <li key={s.title}>
                <Link href={s.href || "#"} className={`chip-sticker hover-wiggle ${pastel(i + 2)}`} title={s.desc}>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LaneCard({ lane, tone, className, tilt, photos = [] }: { lane: Lane; tone: "light" | "dark"; className: string; tilt: number; photos?: { src: string; alt: string }[] }) {
  const dark = tone === "dark";
  return (
    <article
      className={`sticker tilt relative flex flex-col overflow-hidden shadow-sticker-lg transition-transform duration-300 hover:rotate-0 ${dark ? "bg-ink text-white" : "bg-sky text-ink"} ${className}`}
      style={{ ["--r" as string]: `${tilt}deg` }}
    >
      <div className={`relative aspect-[16/10] overflow-hidden border-b-2 border-ink ${dark ? "bg-peach" : "bg-white"}`}>
        {lane.image ? (
          <img src={assetUrl(lane.image)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "60% 30%" }} />
        ) : photos.length >= 4 ? (
          <PhotoCollage images={photos} row className="absolute inset-0 h-full w-full content-center" />
        ) : (
          <MerchKit className="absolute inset-0 h-full w-full" />
        )}
        <span className={`chip-sticker absolute left-4 top-4 -rotate-3 ${dark ? "bg-brand text-white" : "bg-sun"}`}>{lane.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h3 className="font-display text-[clamp(26px,3vw,38px)] font-extrabold leading-[1.02] tracking-[-0.02em] [font-stretch:88%]">{lane.title}</h3>
        {lane.points.length > 0 && (
          <ul className={`mt-4 space-y-2 text-[15px] ${dark ? "text-white/85" : "text-ink/85"}`}>
            {lane.points.map((p) => (
              <li key={p} className="flex gap-2.5">
                <svg viewBox="0 0 24 24" className={`mt-[3px] h-4 w-4 shrink-0 ${dark ? "text-brand" : "text-ink"}`} aria-hidden>
                  <path d="M12 0c.9 6.4 4.7 10.2 12 12-7.3 1.8-11.1 5.6-12 12-.9-6.4-4.7-10.2-12-12C7.3 10.2 11.1 6.4 12 0Z" fill="currentColor" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          {lane.ctaLabel && (
            <Link href={lane.href || "#"} className="btn-primary px-6 py-3">
              {lane.ctaLabel}
            </Link>
          )}
          {lane.secondaryLabel && (
            <Link href={lane.secondaryHref || "#"} className={dark ? "btn border-white bg-transparent px-6 py-3 text-white hover:bg-white hover:text-ink" : "btn-outline px-6 py-3"}>
              {lane.secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
