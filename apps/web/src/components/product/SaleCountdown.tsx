"use client";
import { useEffect, useState } from "react";

/** Đếm ngược khuyến mãi có hạn (chỉ hiển thị, giá luôn do server tính) */
export function SaleCountdown({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const left = Math.max(0, end - now);
  if (!left) return <p className="mt-1 text-sm font-semibold text-ink/60">Khuyến mãi đã kết thúc – giá sẽ cập nhật khi tải lại trang.</p>;
  const d = Math.floor(left / 86400_000);
  const h = Math.floor((left % 86400_000) / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <p className="mt-1 inline-flex items-center gap-2 rounded-md bg-[#fff1f2] px-2 py-1 text-sm font-bold text-[#be123c]" role="timer" aria-live="off">
      ⏰ Kết thúc sau {d > 0 ? `${d} ngày ` : ""}
      {pad(h)}:{pad(m)}:{pad(s)}
    </p>
  );
}
