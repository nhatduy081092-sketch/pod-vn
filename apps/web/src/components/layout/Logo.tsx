import Link from "next/link";

/** Logo chữ – thay bằng file logo thật khi có */
export function Logo({ name, logoUrl, dark = false }: { name: string; logoUrl?: string; dark?: boolean }) {
  if (logoUrl) {
    return (
      <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${name} – Trang chủ`}>
        <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-contain md:h-9 md:w-9" />
        <span className={`whitespace-nowrap text-[17px] font-black tracking-tight lg:text-xl ${dark ? "text-white" : "text-navy"}`}>{name}</span>
      </Link>
    );
  }
  return (
    <Link href="/" className="flex items-center gap-1.5" aria-label={`${name} – Trang chủ`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 md:h-8 md:w-8" aria-hidden>
        <path d="M6 10h20l-2 18H8L6 10Z" fill="#FFA415" stroke="#1d1d1f" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11 12V9a5 5 0 0 1 10 0v3" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="13" cy="19" r="1.6" fill="#1d1d1f" />
        <circle cx="19" cy="19" r="1.6" fill="#1d1d1f" />
        <path d="M13 23q3 2.5 6 0" fill="none" stroke="#1d1d1f" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-ink/80 md:text-xl">{name}</span>
    </Link>
  );
}
