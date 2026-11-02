"use client";
import { useEffect, useState } from "react";
import { isOptedOut, setOptOut } from "@/lib/track";

/** Nút tắt/bật đo lường – cờ lưu trên trình duyệt (yala_optout), track.ts đọc lại trước mỗi lần gửi */
export function OptOutToggle() {
  const [off, setOff] = useState<boolean | null>(null);
  useEffect(() => setOff(isOptedOut()), []);
  if (off === null) return <p className="text-sm text-ink/60">Đang kiểm tra lựa chọn…</p>;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="font-semibold" role="status">
        {off ? "Đo lường đang TẮT trên trình duyệt này." : "Đo lường đang bật."}
      </p>
      <button
        type="button"
        className={off ? "btn-outline" : "btn-primary"}
        onClick={() => {
          setOptOut(!off);
          // tải lại để gỡ mã đo lường đã nạp trong trang (bật lại thì nạp lại)
          window.location.reload();
        }}
      >
        {off ? "Bật lại đo lường" : "Tắt đo lường"}
      </button>
    </div>
  );
}
