import Link from "next/link";
import { DESIGN_COLLECTIONS } from "@pod/shared";
import { pastel } from "@/lib/pastel";

/** Dải chủ đề chạy ngược chiều, nền đen – mỗi nhãn bấm vào bộ sưu tập (rê chuột để dừng) */
export function TopicRibbon() {
  const items = DESIGN_COLLECTIONS.slice(0, 16);
  const row = (hidden: boolean) =>
    items.map((c, i) => (
      <li key={`${hidden ? "b" : "a"}-${c.slug}`} aria-hidden={hidden || undefined}>
        <Link
          href={`/bo-suu-tap/${c.slug}`}
          tabIndex={hidden ? -1 : undefined}
          className={`chip-sticker whitespace-nowrap border-white/0 ${pastel(i)} text-[15px] shadow-none transition hover:-rotate-2 hover:scale-105`}
        >
          {c.name}
        </Link>
      </li>
    ));
  return (
    <div className="overflow-hidden py-4">
      <nav className="marquee-pause relative -mx-[3%] w-[106%] -rotate-[1.2deg] overflow-hidden border-y-2 border-ink bg-ink py-3 md:py-4" aria-label="Chủ đề mẫu có sẵn">
        <ul className="animate-marquee-rev flex w-max gap-3">
          {row(false)}
          {row(true)}
        </ul>
      </nav>
    </div>
  );
}
