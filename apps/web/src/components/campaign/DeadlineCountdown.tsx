"use client";
import { useEffect, useState } from "react";

/** Đếm ngược tới hạn chót đặt hàng (23:59 giờ VN). Server render nhãn tĩnh, client chạy số – không lệch hydrate. */
export function DeadlineCountdown({ deadline, dark = false }: { deadline: string; dark?: boolean }) {
  const end = new Date(`${deadline}T23:59:59+07:00`).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, end - now);
  const parts =
    left === null
      ? null
      : [
          [Math.floor(left / 86400_000), "ngày"],
          [Math.floor((left % 86400_000) / 3600_000), "giờ"],
          [Math.floor((left % 3600_000) / 60_000), "phút"],
          [Math.floor((left % 60_000) / 1000), "giây"],
        ];
  if (left === 0) return null;
  return (
    <div className="flex gap-1.5" role="timer" aria-live="off" aria-label="Thời gian còn lại để đặt kịp dịp">
      {(parts ?? [["–", "ngày"], ["–", "giờ"], ["–", "phút"], ["–", "giây"]]).map(([v, l]) => (
        <span key={l as string} className={`grid min-w-[52px] place-items-center rounded-xl border-2 border-ink px-2 py-1.5 shadow-sticker-sm ${dark ? "bg-white text-ink" : "bg-ink text-white"}`}>
          <span className="font-display text-[22px] font-extrabold leading-none tabular-nums [font-stretch:90%]">{typeof v === "number" ? String(v).padStart(2, "0") : v}</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">{l}</span>
        </span>
      ))}
    </div>
  );
}
