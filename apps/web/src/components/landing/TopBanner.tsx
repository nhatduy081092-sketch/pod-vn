import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";

/** Dải banner khuyến mãi trên cùng (tương ứng "U.S. FACTORY DELIVERY ZONE") */
export function TopBanner({ data }: { data: LandingSettings["topBanner"] }) {
  if (!data.enabled) return null;
  return (
    <Link
      href={data.href || "#"}
      className="grid-paper relative block overflow-hidden bg-gradient-to-b from-[#FFF8CF] to-[#FDE9A0]"
      aria-label={data.title}
    >
      <div className="container-site relative flex min-h-[88px] items-center py-2 md:min-h-[120px]">
        <div className="relative z-10 w-[80%] space-y-[2px] italic leading-[1.05] text-[#FF8A00] md:w-[70%]">
          <p className="text-stroke-white text-[clamp(20px,6.2vw,46px)] font-black tracking-tight drop-shadow-[0_2px_0_rgba(255,138,0,.35)]">
            {data.title}
          </p>
          <p className="text-stroke-white mt-0.5 pl-[8%] text-[clamp(10px,2.6vw,20px)] font-extrabold">{data.line1}</p>
          <p className="text-stroke-white pl-[30%] text-[clamp(10px,2.6vw,20px)] font-extrabold">
            {data.line2}{" "}
            <span className="align-[-0.08em] text-[clamp(16px,4.4vw,34px)] font-black leading-[0.8] text-[#FF6A00]">{data.highlight}</span> {data.line3}
          </p>
          <p className="text-stroke-white mt-0.5 text-[clamp(9px,2.5vw,19px)] font-black">{data.line4}</p>
        </div>
        {/* cụm sản phẩm trang trí bên phải */}
        <div className="pointer-events-none absolute bottom-0 right-2 flex h-full items-end md:right-6" aria-hidden>
          <span className="absolute bottom-1 right-0 h-8 w-24 rounded-[50%] bg-[#FFD76A] md:w-40" />
          <img src={assetUrl("/mock/hoodie-neon-dots.svg")} alt="" className="relative z-[1] -mr-6 h-[80%] w-auto rotate-[-8deg] md:h-[90%]" />
          <img src={assetUrl("/mock/tee-tropical.svg")} alt="" className="relative z-[2] h-[70%] w-auto rotate-[6deg] md:h-[80%]" />
        </div>
      </div>
    </Link>
  );
}
