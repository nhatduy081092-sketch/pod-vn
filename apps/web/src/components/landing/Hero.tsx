import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { IconSparkle } from "../ui/icons";

/** Hero dạng "cửa sổ trình duyệt" – khung trắng, tab vàng, panel cam, chữ outline */
export function Hero({ data }: { data: LandingSettings["hero"] }) {
  return (
    <section className="bg-cream pb-6 pt-4 md:pb-10 md:pt-8">
      <div className="container-site">
        <div className="relative mx-auto max-w-[980px] pt-[clamp(26px,5vw,44px)]">
          {/* Tab vàng góc phải */}
          <div className="absolute right-0 top-0 z-10 min-w-[50%] max-w-[64%] rounded-t-[14px] border-2 border-b-0 border-ink bg-brand-yellow px-3 pb-[clamp(10px,2vw,18px)] pt-1.5 text-right md:pt-2">
            <p className="truncate text-[clamp(11px,3vw,22px)] font-extrabold leading-tight text-ink">{data.tag}</p>
          </div>

          {/* Khung cửa sổ */}
          <div className="relative z-20 rounded-[14px] border-2 border-ink bg-white px-2 pb-2 pt-[clamp(24px,4.5vw,40px)] shadow-[4px_4px_0_#1d1d1f] md:px-3 md:pb-3">
            {/* Thanh điều khiển */}
            <div className="absolute left-4 top-[clamp(6px,1.4vw,12px)] flex items-center gap-[clamp(6px,1.5vw,12px)]" aria-hidden>
              <span className="flex gap-[3px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="block h-[clamp(9px,2vw,16px)] w-[3px] rounded bg-ink" />
                ))}
              </span>
              <CtrlIcon kind="slash" />
              <CtrlIcon kind="play" />
              <CtrlIcon kind="minus" />
            </div>

            {/* Panel cam */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] border-2 border-ink bg-[#FFB21A] md:aspect-[16/8.4]">
              <div className="halftone-dark absolute inset-0" aria-hidden />
              {/* chữ ghost lặp */}
              <div className="pointer-events-none absolute bottom-[-4%] left-[18%] select-none leading-[0.82]" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <p key={i} className="text-ghost whitespace-nowrap text-[clamp(30px,10vw,104px)] font-black">
                    {data.title}
                  </p>
                ))}
              </div>
              {/* confetti */}
              <span className="absolute bottom-[8%] left-[44%] h-2 w-24 -rotate-[20deg] rounded-full bg-[#FF6FA3] md:h-3 md:w-40" aria-hidden />
              <span className="absolute bottom-[26%] right-[8%] h-2 w-14 -rotate-[25deg] rounded-full bg-[#3DDBB3] md:h-3 md:w-24" aria-hidden />
              <span className="absolute bottom-[30%] left-[40%] h-3 w-3 rounded-full bg-[#7C8CFF] md:h-5 md:w-5" aria-hidden />

              {/* Tiêu đề lớn */}
              <h1 className="text-stroke-ink absolute left-[4%] top-[3%] z-20 whitespace-nowrap text-[clamp(28px,9.6vw,100px)] font-black leading-none tracking-tight text-white drop-shadow-[3px_3px_0_#1d1d1f]">
                {data.title}
              </h1>
              <IconSparkle className="absolute left-[46%] top-[8%] z-30 h-5 w-5 text-[#FFE44D] drop-shadow-[1px_1px_0_#1d1d1f] md:h-9 md:w-9" aria-hidden />

              {/* Ảnh / collage */}
              {data.imageUrl ? (
                <img src={assetUrl(data.imageUrl)} alt={data.title} className="absolute bottom-0 right-0 z-10 h-[86%] w-auto object-contain" />
              ) : (
                <div className="absolute bottom-[-4%] right-[-3%] z-10 h-[88%] w-[66%]" aria-hidden>
                  {[
                    { src: "/mock/hoodie-galaxy.svg", cls: "left-[-4%] bottom-[6%] w-[54%] rotate-[-6deg]" },
                    { src: "/mock/tee-geo-night.svg", cls: "left-[20%] bottom-[-2%] w-[50%] z-[2]" },
                    { src: "/mock/sweater-check.svg", cls: "left-[40%] bottom-[10%] w-[54%] z-[1] rotate-[4deg]" },
                    { src: "/mock/sweater-halftone.svg", cls: "right-[-4%] bottom-[-4%] w-[50%] z-[3] rotate-[6deg]" },
                  ].map((m) => (
                    <img
                      key={m.src}
                      src={assetUrl(m.src)}
                      alt=""
                      className={`absolute aspect-square h-auto object-contain drop-shadow-[3px_4px_0_rgba(29,29,31,.35)] ${m.cls}`}
                    />
                  ))}
                </div>
              )}

              {/* Badge vàng */}
              <Link
                href={data.ctaHref || "#hot-sale"}
                className="absolute left-[-1%] top-[50%] z-30 -rotate-[8deg] rounded-md border-2 border-ink bg-[#FFE44D] px-[clamp(8px,2vw,18px)] pb-1 pt-[clamp(8px,1.6vw,14px)] shadow-hard transition hover:rotate-[-6deg]"
              >
                <span className="absolute inset-x-0 top-0.5 text-center text-[5px] font-bold tracking-widest text-ink/40 md:text-[7px]">
                  YALA • YALA • YALA
                </span>
                <span className="block text-[clamp(10px,2.8vw,22px)] font-black leading-tight text-ink">
                  {data.badge}
                  <br />
                  <span className="tracking-tight">Bắt đầu &gt;&gt;&gt;</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtrlIcon({ kind }: { kind: "slash" | "play" | "minus" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[clamp(12px,2.6vw,22px)] w-[clamp(12px,2.6vw,22px)]" fill="#FFE44D" stroke="#1d1d1f" strokeWidth="2">
      <circle cx="10" cy="10" r="8" />
      {kind === "slash" && <path d="M5 5l10 10M8 3.5 16.5 12" />}
      {kind === "play" && <path d="M8 6.5v7l5.5-3.5L8 6.5Z" fill="#1d1d1f" />}
      {kind === "minus" && <path d="M3 8h14M3 12h14" />}
    </svg>
  );
}
