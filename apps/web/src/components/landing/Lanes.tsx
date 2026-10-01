import Link from "next/link";
import type { Lane, LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { MerchKit } from "../b2b/MerchKit";

/** Đầu trang: YALA là ai + 2 lối vào Cá nhân | Doanh nghiệp + 4 dịch vụ chính */
export function Lanes({ data }: { data: LandingSettings["positioning"] }) {
  if (!data.enabled) return null;
  return (
    <section className="pb-8 pt-2 md:pb-12" aria-label="YALA làm gì">
      <div className="container-site">
        {data.statement && <p className="mx-auto max-w-3xl text-center text-[15px] text-muted [text-wrap:balance] md:text-lg">{data.statement}</p>}
        <div className="mt-5 grid gap-4 md:mt-7 md:grid-cols-2 md:gap-6">
          <LaneCard lane={data.personal} tone="light" />
          <LaneCard lane={data.business} tone="dark" />
        </div>
        {data.services.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4 md:gap-4">
            {data.services.map((s) => (
              <li key={s.title}>
                <Link href={s.href || "#"} className="group block h-full rounded-2xl border border-line p-4 transition hover:border-ink md:p-5">
                  <p className="text-[15px] font-semibold md:text-base">
                    {s.title} <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-muted md:text-sm">{s.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LaneCard({ lane, tone }: { lane: Lane; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <article className={`relative flex flex-col overflow-hidden rounded-3xl ${dark ? "bg-ink text-white" : "bg-surface text-ink"}`}>
      <div className="relative aspect-[16/9] overflow-hidden">
        {lane.image ? (
          <img src={assetUrl(lane.image)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "60% 30%" }} />
        ) : (
          <MerchKit className="absolute inset-0 h-full w-full" />
        )}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${dark ? "bg-white text-ink" : "bg-ink text-white"}`}>{lane.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-7">
        <h2 className="text-[clamp(22px,2.6vw,32px)] font-bold leading-tight tracking-[-0.02em]">{lane.title}</h2>
        {lane.points.length > 0 && (
          <ul className={`mt-3 space-y-1.5 text-[15px] ${dark ? "text-white/80" : "text-ink/80"}`}>
            {lane.points.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-2.5 pt-5">
          {lane.ctaLabel && (
            <Link href={lane.href || "#"} className="btn-primary px-5 py-2.5">
              {lane.ctaLabel} <span aria-hidden>→</span>
            </Link>
          )}
          {lane.secondaryLabel && (
            <Link href={lane.secondaryHref || "#"} className={`btn px-5 py-2.5 ${dark ? "border-white/30 text-white hover:border-white" : "border-line bg-white text-ink hover:border-ink"}`}>
              {lane.secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
