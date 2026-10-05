import Link from "next/link";
import { beforeDeadline, luminance, vnShortDate, type Campaign } from "@pod/shared";

/** Thanh mảnh trên cùng khi đang có chiến dịch theo dịp: hạn chót + ưu đãi, dẫn vào /dip/<slug> */
export function CampaignBar({ c }: { c: Campaign }) {
  const fg = luminance(c.accent) > 0.45 ? "#1d1d1f" : "#ffffff";
  const open = beforeDeadline(c);
  const msg = [
    `Quà ${c.name}`,
    open && c.deadline ? `đặt trước ${vnShortDate(c.deadline)} để nhận kịp` : "",
    c.discountPercent > 0 ? `ưu đãi ${c.discountPercent}%` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link href={`/dip/${c.slug}`} className="block" style={{ backgroundColor: c.accent, color: fg }}>
      <div className="container-site flex h-9 items-center justify-center gap-2 text-[12.5px] font-semibold md:text-[13px]">
        <span className="truncate">{msg}</span>
        <span className="shrink-0 underline underline-offset-2">Xem ngay →</span>
      </div>
    </Link>
  );
}
