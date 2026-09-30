import Link from "next/link";
import type { LandingSettings } from "@pod/shared";

/** CHỮ IN HOA -> câu thường (giữ viết hoa chữ đầu) – dữ liệu cũ nhập toàn in hoa */
const sentence = (s: string) => {
  const t = s.trim();
  if (!t || t !== t.toLocaleUpperCase("vi")) return t;
  const l = t.toLocaleLowerCase("vi");
  return l.charAt(0).toLocaleUpperCase("vi") + l.slice(1);
};

/** Thanh thông báo mảnh trên cùng: 3 ý ngắn, mobile chỉ hiện ý quan trọng nhất */
export function TopBanner({ data }: { data: LandingSettings["topBanner"] }) {
  if (!data.enabled) return null;
  const items = [
    sentence(data.line1),
    [sentence(data.line2), data.highlight, data.line3.toLocaleLowerCase("vi")].filter(Boolean).join(" "),
    sentence(data.line4),
  ].filter(Boolean);
  return (
    <Link href={data.href || "#"} className="block bg-ink text-white" aria-label={`${sentence(data.title)} – ${items.join(". ")}`}>
      <div className="container-site flex h-9 items-center justify-center gap-6 text-[12.5px] md:text-[13px]">
        {items.map((t, i) => (
          <span key={i} className={`whitespace-nowrap ${i === 1 ? "font-semibold" : "hidden text-white/75 md:inline"}`}>
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
