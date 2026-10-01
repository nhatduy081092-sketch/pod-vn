"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hiện dần các phần tử có data-reveal khi cuộn tới (1 IntersectionObserver cho cả trang).
 * data-reveal="pop" = bật nảy kiểu sticker; style "--d" = độ trễ.
 */
export function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("reveal-on");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    // nội dung tải sau (client component) cũng được theo dõi
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [path]);
  return null;
}
