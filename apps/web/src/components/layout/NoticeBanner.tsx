"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Notice } from "@/lib/types";

const KEY = "pod_notice_hidden";

/** Dải thông báo đầu trang (nghỉ Tết, tạm dừng sản xuất…): đóng được, nhớ theo id */
export function NoticeBanner({ notices }: { notices: Notice[] }) {
  const [hidden, setHidden] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      setHidden(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
    } catch {
      setHidden([]);
    }
  }, []);
  if (!hidden) return null;
  const n = notices.find((x) => x.showBanner && !hidden.includes(x.id));
  if (!n) return null;
  const close = () => {
    const next = [...hidden, n.id].slice(-20);
    setHidden(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* chế độ riêng tư */
    }
  };
  return (
    <div className={`${n.level === "warning" ? "bg-amber-300" : "bg-navy text-white"} text-sm`} role="status">
      <div className="container-site flex items-center gap-3 py-2">
        <p className="min-w-0 flex-1 truncate">
          <b>{n.title}</b>{" "}
          <Link href={`/thong-bao#${n.id}`} className="underline underline-offset-2">
            Xem chi tiết
          </Link>
        </p>
        <button type="button" onClick={close} className="shrink-0 px-1 text-lg leading-none" aria-label="Đóng thông báo">
          ×
        </button>
      </div>
    </div>
  );
}
