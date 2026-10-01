import type { LandingSettings } from "@pod/shared";

/**
 * Dải slogan thương hiệu đầu trang: "Young. Ambitious. Limitless. Authentic."
 * Chữ cái đầu mỗi từ tô cam -> mắt đọc ra ngay Y·A·L·A. Mobile: 2 từ / dòng, không ngắt giữa cặp.
 */
export function BrandSlogan({ data }: { data: LandingSettings["slogan"] }) {
  if (!data.enabled || !data.words.length) return null;
  const words = data.words.map((w) => w.trim()).filter(Boolean);
  const pairs: string[][] = [];
  for (let i = 0; i < words.length; i += 2) pairs.push(words.slice(i, i + 2));
  const initials = words.map((w) => w[0]!.toLocaleUpperCase("vi")).join("");
  return (
    <section className="border-b border-line bg-white" aria-label={`Slogan ${initials}`}>
      <div className="container-site py-5 text-center md:py-7">
        <p className="text-[clamp(24px,3.6vw,42px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink" lang="en">
          {pairs.map((pair, pi) => (
            <span key={pi} className="inline-block whitespace-nowrap">
              {pair.map((w, wi) => (
                <span key={wi}>
                  <span className="text-brand">{w[0]}</span>
                  {w.slice(1)}.{wi < pair.length - 1 || pi < pairs.length - 1 ? " " : ""}
                </span>
              ))}
              {pi < pairs.length - 1 && " "}
            </span>
          ))}
        </p>
        {data.vi && <p className="mt-1.5 text-sm font-medium text-muted [text-wrap:balance] md:mt-2 md:text-lg">{data.vi}</p>}
      </div>
    </section>
  );
}
