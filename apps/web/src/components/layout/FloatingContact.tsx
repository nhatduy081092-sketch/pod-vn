"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";
import { IconPhone } from "../ui/icons";
import { LeadForm } from "./LeadForm";

/**
 * Nút liên hệ nổi: Zalo (kênh chốt đơn chính ở VN), gọi điện, Messenger.
 * Khu doanh nghiệp trên điện thoại chỉ giữ Zalo (4 nút chồng nhau che chữ và ô chọn của form);
 * cả cụm ẩn khi form báo giá ([data-quote-form]) đang hiện trên màn hình – form đã có Zalo/hotline riêng.
 */
export function FloatingContact({ zalo, hotline, messengerUrl }: { zalo: string; hotline: string; messengerUrl: string }) {
  const zaloNumber = zalo.replace(/\D/g, "");
  const [lead, setLead] = useState(false);
  const [formInView, setFormInView] = useState(false);
  const pathname = usePathname();
  const b2b = pathname.startsWith("/doanh-nghiep");
  const extra = b2b ? "max-md:hidden" : "";

  useEffect(() => {
    setFormInView(false);
    if (typeof IntersectionObserver === "undefined") return;
    // theo dõi cả khối chứa form: form đổi sang màn "Đã nhận yêu cầu" vẫn là cùng một khối
    const targets = new Set([...document.querySelectorAll("[data-quote-form]")].map((f) => f.closest("section") ?? f));
    if (!targets.size) return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setFormInView(seen.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [pathname]);

  const hidden = formInView && !lead;
  return (
    <div
      className={`fixed bottom-4 right-3 z-40 flex flex-col items-end gap-2.5 transition-opacity duration-200 md:bottom-6 md:right-6 ${hidden ? "pointer-events-none opacity-0" : ""}`}
      aria-hidden={hidden || undefined}
    >
      {lead && <LeadForm onClose={() => setLead(false)} />}
      <button
        type="button"
        onClick={() => setLead(true)}
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-[10px] font-black leading-tight shadow-lg ${extra}`}
        aria-label="Để lại số điện thoại để được gọi lại"
        title="Gọi lại cho tôi"
      >
        Gọi
        <br />
        lại
      </button>
      {messengerUrl && (
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track.contact("messenger")}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#A033FF] text-white shadow-lg ${extra}`}
          aria-label="Nhắn tin Messenger"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
            <path d="M12 2C6.4 2 2 6.1 2 11.6c0 2.9 1.2 5.4 3.2 7.1V22l3-1.7c1.2.3 2.4.5 3.8.5 5.6 0 10-4.1 10-9.6S17.6 2 12 2Zm1 12.9-2.6-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.4 5.8Z" />
          </svg>
        </a>
      )}
      <a
        href={`tel:${hotline}`}
        onClick={() => track.contact("phone")}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-lg md:hidden ${b2b ? "hidden" : ""}`}
        aria-label={`Gọi ${hotline}`}
      >
        <IconPhone className="h-6 w-6" />
      </a>
      <a
        href={`https://zalo.me/${zaloNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track.contact("zalo")}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zalo text-[13px] font-black text-white shadow-lg"
        aria-label="Chat Zalo"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-zalo/40 motion-reduce:hidden" aria-hidden />
        <span className="relative">Zalo</span>
      </a>
    </div>
  );
}
