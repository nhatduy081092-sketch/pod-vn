import Link from "next/link";
import { AUDIENCE_SLUG, type LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";

const FALLBACK: Record<string, { bg: string; mock: string }> = {
  MEN: { bg: "from-[#4a3f33] to-[#b08a55]", mock: "/mock/shirt-hawaii.svg" },
  WOMEN: { bg: "from-[#7a5f86] to-[#d9a0a8]", mock: "/mock/dress-tropical.svg" },
  KIDS: { bg: "from-[#4f8a45] to-[#b5d98e]", mock: "/mock/tee-kids-stars.svg" },
  UNISEX: { bg: "from-[#3f4a5a] to-[#7d8aa0]", mock: "/mock/hoodie-camo.svg" },
};

/** 3 ô "Nam / Nữ / Trẻ em" ảnh tối + chữ trắng */
export function AudienceTiles({ tiles }: { tiles: LandingSettings["audienceTiles"] }) {
  return (
    <ul className="container-site mt-5 grid grid-cols-3 gap-1.5 md:mt-8 md:gap-4">
      {tiles.map((t) => {
        const fb = FALLBACK[t.audience] ?? FALLBACK.UNISEX!;
        return (
          <li key={t.label}>
            <Link
              href={`/san-pham?doi-tuong=${AUDIENCE_SLUG[t.audience]}`}
              className={`group relative flex aspect-[1/1.04] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${fb.bg}`}
            >
              <img
                src={assetUrl(t.imageUrl || fb.mock)}
                alt=""
                className={`absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105 ${t.imageUrl ? "object-cover" : "translate-y-[8%] scale-[1.15] object-contain"}`}
              />
              <span className={`absolute inset-0 transition ${t.imageUrl ? "bg-black/35 group-hover:bg-black/25" : "bg-black/20 group-hover:bg-black/10"}`} />
              <span className="relative px-1 text-center text-[clamp(13px,3.6vw,30px)] font-extrabold leading-tight tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,.6)]">
                {t.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
