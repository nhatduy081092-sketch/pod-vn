import type { LandingSettings } from "@pod/shared";

/**
 * Dải slogan chạy ngang ngay dưới header: Young • Ambitious • Limitless • Authentic (chữ cái đầu trắng = Y·A·L·A)
 * + câu tiếng Việt. Rê chuột để dừng; giảm chuyển động -> đứng yên.
 */
export function SloganRibbon({ data }: { data: LandingSettings["slogan"] }) {
  if (!data.enabled || !data.words.length) return null;
  const words = data.words.map((w) => w.trim()).filter(Boolean);
  const initials = words.map((w) => w[0]!.toLocaleUpperCase("vi")).join("");
  // Định vị 10/2026 (khách tập thể): dải tĩnh, chữ nhỏ – bỏ chữ to chạy ngang kiểu vui nhộn
  return (
    <section className="border-b border-line bg-ink text-white/80" aria-label={`Slogan ${initials}: ${words.join(", ")}. ${data.vi}`}>
      <p className="container-site flex items-center justify-center gap-x-4 gap-y-1 py-2 text-center text-[13px] font-medium max-sm:flex-col md:text-sm">
        <span lang="en" className="tracking-wide">
          {words.map((w, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5 text-white/40">/</span>}
              <span className="font-semibold text-brand">{w[0]}</span>
              {w.slice(1)}
            </span>
          ))}
        </span>
        {data.vi && <span className="text-white/60 max-sm:hidden">{data.vi}</span>}
      </p>
    </section>
  );
}
