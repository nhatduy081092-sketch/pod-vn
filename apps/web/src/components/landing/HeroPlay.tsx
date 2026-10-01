import Link from "next/link";
import { DESIGN_COLLECTIONS, findReadyDesign, type LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { pastel } from "@/lib/pastel";
import { DesignPreview } from "../designs/DesignPreview";
import { DesignFonts } from "../designs/DesignFonts";

type Props = { data: LandingSettings["heroPlay"]; categories: { name: string; slug: string }[] };

/** vị trí các mảnh cắt dán (theo % khung), góc nghiêng, kiểu trôi, độ trễ bật */
const DESIGN_SLOTS = [
  { cls: "left-[0%] top-[4%] w-[40%]", r: -7, f: "float-a", d: 120 },
  { cls: "right-[-2%] top-[0%] w-[36%]", r: 6, f: "float-b", d: 260 },
  { cls: "right-[4%] bottom-[2%] w-[38%]", r: -4, f: "float-a", d: 400 },
];
const STICKER_SLOTS = [
  { cls: "left-[34%] top-[-3%]", r: -6, f: "float-b", d: 520 },
  { cls: "left-[-3%] top-[52%]", r: 5, f: "float-a", d: 600 },
  { cls: "right-[34%] bottom-[-2%]", r: -3, f: "float-b", d: 680 },
  { cls: "right-[-4%] top-[44%]", r: 8, f: "float-a", d: 760 },
  { cls: "left-[8%] bottom-[8%]", r: -9, f: "float-b", d: 840 },
];

/**
 * Hero "cắt dán": chữ lớn bên trái, bên phải là ảnh thật + áo chữ mẫu có sẵn của YALA dán chéo như sticker,
 * kèm nhãn chủ đề bấm được. Một màn mở trang: các mảnh lần lượt "bật" vào rồi trôi nhẹ.
 */
export function HeroPlay({ data, categories }: Props) {
  const designs = data.designs.map(findReadyDesign).filter((d): d is NonNullable<typeof d> => !!d).slice(0, 3);
  const stickers = data.stickers.map((s) => DESIGN_COLLECTIONS.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c).slice(0, 5);
  const words = data.title.split(/(?<=\.)\s+/); // tách câu -> mỗi câu 1 dòng
  return (
    <section className="relative overflow-hidden bg-white" aria-label="Giới thiệu">
      <DesignFonts designs={designs} />
      {/* vệt vát chéo lấy từ chữ A trong logo */}
      <div className="pointer-events-none absolute -right-[10%] top-0 hidden h-full w-[62%] bg-peach md:block [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)]" aria-hidden />
      <div className="container-site relative grid items-center gap-10 pb-14 pt-8 md:grid-cols-[1.05fr_1fr] md:gap-8 md:pb-20 md:pt-14">
        <div>
          <h1 className="font-display text-[clamp(44px,6.6vw,86px)] font-extrabold leading-[0.92] tracking-[-0.035em] text-ink [font-stretch:86%]">
            {words.map((w, i) => (
              <span key={i} className="block [text-wrap:balance]">
                {w}
              </span>
            ))}
          </h1>
          {data.subtitle && <p className="mt-5 max-w-[34rem] text-[16px] leading-relaxed text-ink/75 md:text-lg">{data.subtitle}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            {data.ctaLabel && (
              <Link href={data.href || "/thiet-ke"} className="btn-primary px-7 py-3.5 text-base">
                {data.ctaLabel}
              </Link>
            )}
            {data.secondaryLabel && (
              <Link href={data.secondaryHref || "/bo-suu-tap"} className="btn-outline px-7 py-3.5 text-base">
                {data.secondaryLabel}
              </Link>
            )}
          </div>
          {categories.length > 0 && (
            <nav className="mt-8" aria-label="Danh mục nổi bật">
              <p className="text-sm font-semibold text-muted">Hoặc chọn ngay</p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {categories.slice(0, 6).map((c, i) => (
                  <li key={c.slug}>
                    <Link href={`/danh-muc/${c.slug}`} className={`chip-sticker hover-wiggle ${pastel(i)}`} style={{ ["--r" as string]: `${i % 2 ? 1.5 : -1.5}deg` }}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {/* Cắt dán */}
        <div className="relative mx-auto aspect-[1/0.95] w-full max-w-[560px]" aria-hidden={!data.image}>
          {data.image && (
            <div className="pop-in absolute left-[18%] top-[14%] w-[62%]" style={{ ["--r" as string]: "3deg", animationDelay: "0ms" }}>
              <div className="sticker overflow-hidden bg-white p-2 pb-8 shadow-sticker-lg">
                <img
                  src={assetUrl(data.image)}
                  alt="Khách mặc áo in theo yêu cầu của YALA"
                  className="aspect-[4/5] w-full rounded-lg object-cover"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          )}
          {designs.map((d, i) => {
            const s = DESIGN_SLOTS[i]!;
            const col = DESIGN_COLLECTIONS.find((c) => c.slug === d.collection);
            return (
              <Link
                key={d.slug}
                href={`/bo-suu-tap/${d.collection}`}
                className={`pop-in absolute ${s.cls}`}
                style={{ ["--r" as string]: `${s.r}deg`, animationDelay: `${s.d}ms` }}
                aria-label={`Mẫu "${d.title}" – ${col?.name ?? ""}`}
                tabIndex={-1}
              >
                <span className={`${s.f} block`} style={{ ["--r" as string]: "0deg", animationDelay: `${900 + s.d}ms` }}>
                  <span className={`sticker block aspect-square overflow-hidden ${pastel(i + 1)}`}>
                    <DesignPreview design={d} className="h-full w-full" title={d.title} />
                  </span>
                </span>
              </Link>
            );
          })}
          {stickers.map((c, i) => {
            const s = STICKER_SLOTS[i]!;
            return (
              <Link
                key={c.slug}
                href={`/bo-suu-tap/${c.slug}`}
                className={`pop-in absolute z-10 ${s.cls}`}
                style={{ ["--r" as string]: `${s.r}deg`, animationDelay: `${s.d}ms` }}
              >
                <span className={`${s.f} chip-sticker whitespace-nowrap ${pastel(i + 3)} text-[13px] md:text-sm`} style={{ ["--r" as string]: "0deg", animationDelay: `${1100 + s.d}ms` }}>
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
