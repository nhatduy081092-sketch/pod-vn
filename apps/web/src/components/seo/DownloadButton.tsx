"use client";
import { track } from "@/lib/track";

/** Nút tải file tĩnh (public/) + đo lượt tải (KPI trang tài nguyên SEO) */
export function DownloadButton({ href, file, from, className, children }: { href: string; file: string; from: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} download={file} className={className} onClick={() => track.resourceDownload(file, from)}>
      {children}
    </a>
  );
}
