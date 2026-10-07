"use client";
import { useEffect } from "react";

/** Lỗi do trình duyệt còn giữ bản web cũ sau khi deploy (file JS/CSS cũ đã bị thay) */
const isStaleBuild = (e: Error) => /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to load chunk/i.test(`${e.name} ${e.message}`);
const KEY = "yala-reloaded-at";

export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    // tab mở từ trước khi cập nhật web -> tự tải lại 1 lần để lấy bản mới (chặn vòng lặp tải lại trong 30 giây)
    if (!isStaleBuild(error)) return;
    try {
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* chế độ riêng tư: vẫn tải lại */
    }
    window.location.reload();
  }, [error]);

  return (
    <div className="container-site py-20 text-center">
      <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Có lỗi xảy ra</h1>
      <p className="mt-1 text-ink/60">{isStaleBuild(error) ? "YALA vừa cập nhật phiên bản mới – đang tải lại trang…" : "Trang tạm thời chưa hiển thị được. Bấm tải lại để thử lần nữa."}</p>
      {/* tải lại toàn trang (không chỉ dựng lại phần lỗi) -> lấy được bản web mới nhất */}
      <button onClick={() => window.location.reload()} className="btn-primary mt-6">
        Tải lại trang
      </button>
      {error.digest && <p className="mt-4 text-xs text-ink/40">Mã lỗi: {error.digest}</p>}
    </div>
  );
}
