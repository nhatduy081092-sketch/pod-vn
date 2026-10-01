import type { LandingSettings } from "@pod/shared";

/**
 * Dải slogan chạy ngang ngay dưới header: Young • Ambitious • Limitless • Authentic (chữ cái đầu trắng = Y·A·L·A)
 * + câu tiếng Việt. Rê chuột để dừng; giảm chuyển động -> đứng yên.
 */
export function SloganRibbon({ data }: { data: LandingSettings["slogan"] }) {
  if (!data.enabled || !data.words.length) return null;
  const words = data.words.map((w) => w.trim()).filter(Boolean);
  const initials = words.map((w) => w[0]!.toLocaleUpperCase("vi")).join("");
  const unit = (
    <>
      {words.map((w, i) => (
        <span key={i} className="flex shrink-0 items-center gap-5 md:gap-7">
          <span lang="en">
            <span className="text-white">{w[0]}</span>
            {w.slice(1)}
          </span>
          <Star />
        </span>
      ))}
      {data.vi && (
        <span className="flex shrink-0 items-center gap-5 md:gap-7">
          <span className="font-sans text-[0.62em] font-bold tracking-normal">{data.vi}</span>
          <Star />
        </span>
      )}
    </>
  );
  return (
    <section className="marquee-pause relative overflow-hidden border-y-2 border-ink bg-brand text-ink" aria-label={`Slogan ${initials}: ${words.join(", ")}. ${data.vi}`}>
      <div className="animate-marquee flex w-max items-center gap-5 py-2 font-display text-[clamp(20px,2.6vw,32px)] font-extrabold uppercase leading-none tracking-[-0.01em] md:gap-7 md:py-2.5 [font-stretch:85%]" aria-hidden>
        {unit}
        {unit}
        {unit}
        {unit}
      </div>
    </section>
  );
}

/** Ngôi sao 4 cánh (sticker) giữa các từ */
function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-[0.7em] w-[0.7em] shrink-0" aria-hidden>
      <path d="M12 0c.9 6.4 4.7 10.2 12 12-7.3 1.8-11.1 5.6-12 12-.9-6.4-4.7-10.2-12-12C7.3 10.2 11.1 6.4 12 0Z" fill="#1d1d1f" />
    </svg>
  );
}
