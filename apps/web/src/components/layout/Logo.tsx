import Link from "next/link";

/** Biểu tượng YALA: áo thun trắng + tia sáng trên ô cam viền đen (đồng bộ phong cách "hard shadow" của site) */
export function YalaMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <rect x="3" y="3" width="31" height="31" rx="8" fill="#1d1d1f" />
      <rect x="1.5" y="1.5" width="30" height="30" rx="8" fill="#FFA415" stroke="#1d1d1f" strokeWidth="2" />
      <path
        d="M11.5 9.5 8 12.2l2.2 3.6 2-1.1V24h11.6v-9.3l2 1.1 2.2-3.6-3.5-2.7h-3.6a3 3 0 0 1-5.8 0h-3.6Z"
        fill="#fff"
        stroke="#1d1d1f"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m18 15.3.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9.9-2Z" fill="#F88125" />
    </svg>
  );
}

/** Logo YALA – dùng ảnh logo từ CMS nếu có, không thì logo chữ mặc định */
export function Logo({ name, logoUrl, dark = false }: { name: string; logoUrl?: string; dark?: boolean }) {
  const text = dark ? "text-white" : "text-ink";
  if (logoUrl) {
    return (
      <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${name} – Trang chủ`}>
        <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-contain md:h-9 md:w-9" />
        <span className={`whitespace-nowrap text-[17px] font-black tracking-tight lg:text-xl ${text}`}>{name}</span>
      </Link>
    );
  }
  return (
    <Link href="/" className="flex shrink-0 items-center gap-1.5" aria-label={`${name} – Trang chủ`}>
      <YalaMark className="h-8 w-8 md:h-9 md:w-9" />
      <span className={`whitespace-nowrap text-[19px] font-black leading-none tracking-[-0.03em] md:text-[22px] ${text}`}>
        {name}
        <span className="text-accent">.</span>
      </span>
    </Link>
  );
}
