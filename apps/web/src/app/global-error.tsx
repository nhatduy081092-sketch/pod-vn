"use client";
import { useEffect } from "react";

/** Lỗi ở khung trang (layout) – tự tải lại 1 lần nếu do trình duyệt giữ bản web cũ sau khi cập nhật */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    if (!/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to load chunk/i.test(`${error.name} ${error.message}`)) return;
    try {
      const last = Number(sessionStorage.getItem("yala-reloaded-at") || 0);
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem("yala-reloaded-at", String(Date.now()));
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, [error]);
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "80px 16px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Có lỗi xảy ra</h1>
        <p style={{ color: "#6b6660" }}>Bấm tải lại để thử lần nữa.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "10px 22px", borderRadius: 999, border: "2px solid #1d1d1f", background: "#E4570B", color: "#fff", fontWeight: 700 }}>
          Tải lại trang
        </button>
      </body>
    </html>
  );
}
