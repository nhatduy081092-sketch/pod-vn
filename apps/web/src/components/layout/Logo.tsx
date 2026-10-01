import Link from "next/link";
import { YALA_ICON, YALA_LOGO, YALA_WORDMARK } from "@pod/shared";

type Mark = { w: number; h: number; d: string };
function BrandSvg({ mark, className, title }: { mark: Mark; className?: string; title?: string }) {
  return (
    <svg viewBox={`0 0 ${mark.w} ${mark.h}`} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path fill="currentColor" fillRule="evenodd" d={mark.d} />
    </svg>
  );
}

/** Biểu tượng YALA (monogram YA) – ô vuông bo góc, dùng cho avatar/ô nhỏ */
export function YalaMark({ className = "h-8 w-8", tone = "dark" }: { className?: string; tone?: "dark" | "brand" | "light" }) {
  const bg = tone === "brand" ? "bg-brand text-white" : tone === "light" ? "bg-white text-ink" : "bg-ink text-white";
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-[22%] ${bg} ${className}`} aria-hidden>
      <BrandSvg mark={YALA_ICON} className="w-[72%]" />
    </span>
  );
}

/** Chữ YALA chính thức (không slogan) */
export function YalaWordmark({ className = "h-6 w-auto", title }: { className?: string; title?: string }) {
  return <BrandSvg mark={YALA_WORDMARK} className={className} title={title} />;
}

/** Logo đầy đủ: YALA + Young • Ambitious • Limitless • Authentic */
export function YalaLogoFull({ className = "h-14 w-auto", title = "YALA – Young, Ambitious, Limitless, Authentic" }: { className?: string; title?: string }) {
  return <BrandSvg mark={YALA_LOGO} className={className} title={title} />;
}

/** Logo đầu trang: ảnh logo từ CMS nếu có, không thì logo chữ chính thức */
export function Logo({ name, logoUrl, dark = false }: { name: string; logoUrl?: string; dark?: boolean }) {
  const text = dark ? "text-white" : "text-ink";
  return (
    <Link href="/" className={`flex shrink-0 items-center ${text}`} aria-label={`${name} – Trang chủ`}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-7 w-auto max-w-[140px] object-contain md:h-8" />
      ) : (
        <YalaWordmark className="h-[18px] w-auto md:h-[22px]" title={name} />
      )}
    </Link>
  );
}
