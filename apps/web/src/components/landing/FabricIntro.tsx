import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";

const FABRIC_TEXTURE = ["fabric", "fabric-2", "fabric-3"];

/** Giới thiệu AOP + 3 mẫu chất liệu trên dải cam + nút CTA */
export function FabricIntro({ intro, fabrics }: { intro: LandingSettings["intro"]; fabrics: LandingSettings["fabrics"] }) {
  return (
    <section className="bg-white pb-10 md:pb-16">
      <div className="container-site max-w-[980px]">
        <p className="max-w-[640px] text-[clamp(11px,2.7vw,16px)] font-semibold leading-relaxed text-ink/90">{intro.text}</p>
        <p className="relative z-10 mt-3 max-w-[210px] text-[clamp(11px,2.7vw,16px)] font-semibold leading-relaxed text-ink/90 md:max-w-none">{intro.subtext}</p>

        <div className="relative -mt-[6%] aspect-[16/6.4] md:-mt-[4%] md:aspect-[16/6]">
          {/* dải cam bo tròn phải */}
          <div className="halftone absolute bottom-[4%] left-0 right-0 h-[46%] rounded-l-[10px] rounded-r-full border-2 border-ink/0 bg-brand-band" aria-hidden />

          {/* Ảnh người mẫu / sản phẩm bên phải */}
          <div className="pointer-events-none absolute bottom-[6%] right-[2%] h-[150%] w-[48%]" aria-hidden>
            {intro.imageUrl ? (
              <img src={assetUrl(intro.imageUrl)} alt="" className="absolute bottom-0 right-0 h-full w-full object-contain object-bottom" />
            ) : (
              <>
                <img src={assetUrl("/mock/tee-ocean-gradient.svg")} alt="" className="absolute bottom-[10%] left-0 w-[66%] rotate-[-8deg] drop-shadow-[3px_4px_0_rgba(29,29,31,.3)]" />
                <img src={assetUrl("/mock/tee-pink-waves.svg")} alt="" className="absolute bottom-0 right-0 w-[76%] rotate-[5deg] drop-shadow-[3px_4px_0_rgba(29,29,31,.3)]" />
              </>
            )}
          </div>

          {/* 3 mẫu vải */}
          <ul className="absolute bottom-[4%] left-[5%] flex h-[62%] gap-[3%]" style={{ width: "50%" }}>
            {fabrics.map((f, i) => (
              <li key={f.name} className="relative h-full flex-1">
                <div
                  className={`h-full w-full overflow-hidden rounded-[12px] border-2 border-ink ${f.imageUrl ? "" : FABRIC_TEXTURE[i % 3]}`}
                  style={{ backgroundColor: f.color }}
                >
                  {f.imageUrl && <img src={assetUrl(f.imageUrl)} alt={f.name} className="h-full w-full object-cover" />}
                </div>
                <span className="absolute -bottom-[2px] -left-[2px] rounded-[4px] bg-ink px-1.5 py-0.5 text-[clamp(8px,2vw,13px)] font-extrabold text-brand-badge">
                  {f.name}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href={intro.ctaHref || "#hot-sale"}
            className="absolute bottom-[-4%] right-0 z-10 inline-flex w-[40%] items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-brand-gold py-[clamp(4px,1.2vw,10px)] text-[clamp(12px,3.2vw,22px)] font-black text-ink shadow-hard transition hover:bg-brand"
          >
            {intro.ctaLabel}
            <svg viewBox="0 0 20 20" className="h-[1em] w-[1em]" aria-hidden>
              <circle cx="10" cy="10" r="9" fill="#1d1d1f" />
              <path d="M8 6l4 4-4 4" stroke="#FFC21A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
