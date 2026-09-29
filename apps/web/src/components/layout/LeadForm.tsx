"use client";
import { useEffect, useRef, useState } from "react";
import { LEAD_TOPICS, leadCreateSchema } from "@pod/shared";
import { track } from "@/lib/track";
import { IconClose } from "../ui/icons";

/** Popup "Để lại SĐT, chúng tôi gọi lại" → lưu Lead (CMS) + báo Telegram */
export function LeadForm({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", topic: "Báo giá" as (typeof LEAD_TOPICS)[number], message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const parsed = leadCreateSchema.safeParse({ ...f, pageUrl: location.pathname });
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Kiểm tra lại thông tin");
    setState("sending");
    try {
      const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Gửi chưa được, thử lại sau ít phút");
      track.lead(f.topic);
      setState("done");
    } catch (e2) {
      setErr((e2 as Error).message);
      setState("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="lead-title" className="w-full max-w-md rounded-t-2xl border-2 border-ink bg-white p-5 shadow-hard sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 id="lead-title" className="text-lg font-black">
            {state === "done" ? "Đã nhận thông tin!" : "Để lại SĐT, chúng tôi gọi lại"}
          </h2>
          <button type="button" onClick={onClose} className="-m-1 p-1" aria-label="Đóng">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        {state === "done" ? (
          <>
            <p className="mt-2 text-sm text-ink/70">Nhân viên sẽ gọi hoặc nhắn Zalo cho bạn trong giờ làm việc.</p>
            <button type="button" onClick={onClose} className="btn-primary mt-4 w-full">
              Đóng
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input ref={first} className="input" placeholder="Tên của bạn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Tên" autoComplete="name" />
              <input className="input" placeholder="Số điện thoại" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} aria-label="Số điện thoại" autoComplete="tel" />
            </div>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Bạn cần hỗ trợ">
              {LEAD_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={f.topic === t}
                  onClick={() => setF({ ...f, topic: t })}
                  className={`rounded-full border-2 px-2.5 py-1 text-xs font-semibold ${f.topic === t ? "border-ink bg-brand" : "border-ink/15"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea className="input min-h-[72px]" placeholder="Mô tả ngắn (số lượng, sản phẩm, thời gian cần…)" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} aria-label="Nội dung" />
            {/* bẫy bot – người thật không thấy */}
            <input tabIndex={-1} autoComplete="off" className="absolute left-[-9999px] h-0 w-0 opacity-0" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} aria-hidden name="website" />
            {err && <p className="text-sm text-red-700">{err}</p>}
            <button className="btn-primary w-full" disabled={state === "sending"}>
              {state === "sending" ? "Đang gửi…" : "Gửi – gọi lại cho tôi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
