"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";

type Option = { key: string; title: string };
type Props = { solutions: Option[]; industries: { name: string; slug: string }[]; zalo: string; hotline: string };

const QTY = ["Dưới 50", "50 – 200", "200 – 500", "500 – 1.000", "Trên 1.000"];
const BUDGET = ["Dưới 50.000đ", "50 – 100.000đ", "100 – 200.000đ", "200 – 300.000đ", "Trên 300.000đ", "Chưa xác định"];

/** Form yêu cầu báo giá doanh nghiệp – gửi vào hệ thống liên hệ (CMS + Telegram) */
export function B2BQuoteForm({ solutions, industries, zalo, hotline }: Props) {
  const [f, setF] = useState({ name: "", phone: "", company: "", email: "", occasion: "", qty: "", budget: "", deadline: "", note: "", website: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState("");
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  // ?dip=qua-tet / ?nganh=binh-nuoc-ly-coc từ các nút "Nhận báo giá" trên trang
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const dip = solutions.find((s) => s.key === q.get("dip"));
    if (dip) setF((x) => ({ ...x, occasion: dip.title }));
    const ng = industries.find((i) => i.slug === q.get("nganh"));
    if (ng) setPicked([ng.name]);
  }, [solutions, industries]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim() || !/^(0|\+84)\d{9,10}$/.test(f.phone.replace(/[\s.]/g, ""))) return setErr("Nhập họ tên và số điện thoại hợp lệ");
    const lines = [
      f.company && `Công ty: ${f.company}`,
      f.email && `Email: ${f.email}`,
      f.occasion && `Dịp: ${f.occasion}`,
      picked.length && `Ngành hàng: ${picked.join(", ")}`,
      f.qty && `Số lượng: ${f.qty}`,
      f.budget && `Ngân sách/phần: ${f.budget}`,
      f.deadline && `Cần hàng: ${f.deadline.split("-").reverse().join("/")}`,
      f.note && `Ghi chú: ${f.note}`,
    ].filter(Boolean) as string[];
    const message = lines.join("\n").slice(0, 1000);
    setState("sending");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.name.trim(), phone: f.phone.replace(/[\s.]/g, ""), topic: "Đồng phục / doanh nghiệp", message, pageUrl: window.location.pathname, website: f.website }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || "Gửi chưa được, vui lòng thử lại hoặc gọi hotline");
      }
      track.lead("b2b_quote");
      setSummary([`Yêu cầu báo giá – ${f.name}${f.company ? ` (${f.company})` : ""}`, ...lines].join("\n"));
      setState("done");
    } catch (e2) {
      setErr((e2 as Error).message);
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div className="rounded-3xl bg-surface p-6 md:p-8" role="status">
        <p className="text-xl font-semibold">Đã nhận yêu cầu của bạn ✓</p>
        <p className="mt-2 text-[15px] text-muted">YALA sẽ liên hệ trong giờ làm việc để tư vấn và gửi mockup. Cần gấp? Nhắn Zalo kèm nội dung bên dưới.</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">{summary}</pre>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button type="button" className="btn-outline" onClick={() => void navigator.clipboard?.writeText(summary)}>
            Sao chép nội dung
          </button>
          {zalo && (
            <a href={`https://zalo.me/${zalo.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-primary" onClick={() => track.contact("zalo")}>
              Nhắn Zalo ngay
            </a>
          )}
          {hotline && (
            <a href={`tel:${hotline.replace(/\s/g, "")}`} className="btn-outline" onClick={() => track.contact("phone")}>
              Gọi {hotline}
            </a>
          )}
        </div>
      </div>
    );

  const input = "input";
  return (
    <form onSubmit={submit} className="rounded-3xl bg-surface p-5 md:p-8" noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="label">Họ tên *</span>
          <input className={input} value={f.name} onChange={up("name")} autoComplete="name" required />
        </label>
        <label className="block">
          <span className="label">Số điện thoại / Zalo *</span>
          <input className={input} value={f.phone} onChange={up("phone")} inputMode="tel" autoComplete="tel" required />
        </label>
        <label className="block">
          <span className="label">Công ty / tổ chức</span>
          <input className={input} value={f.company} onChange={up("company")} autoComplete="organization" />
        </label>
        <label className="block">
          <span className="label">Email nhận báo giá</span>
          <input className={input} type="email" value={f.email} onChange={up("email")} autoComplete="email" />
        </label>
        <label className="block">
          <span className="label">Dịp / mục đích</span>
          <select className={input} value={f.occasion} onChange={up("occasion")}>
            <option value="">Chọn dịp</option>
            {solutions.map((s) => (
              <option key={s.key} value={s.title}>
                {s.title}
              </option>
            ))}
            <option value="Khác">Khác</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Cần hàng trước ngày</span>
          <input className={input} type="date" value={f.deadline} onChange={up("deadline")} />
        </label>
        <label className="block">
          <span className="label">Số lượng dự kiến</span>
          <select className={input} value={f.qty} onChange={up("qty")}>
            <option value="">Chọn</option>
            {QTY.map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Ngân sách mỗi phần quà</span>
          <select className={input} value={f.budget} onChange={up("budget")}>
            <option value="">Chọn</option>
            {BUDGET.map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="label">Ngành hàng quan tâm</legend>
        <div className="flex flex-wrap gap-2">
          {industries.map((i) => {
            const on = picked.includes(i.name);
            return (
              <button
                key={i.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== i.name) : [...p, i.name]))}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
              >
                {i.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="label">Mô tả thêm</span>
        <textarea className={input} rows={3} value={f.note} onChange={up("note")} placeholder="VD: 300 hộp quà Tết cho nhân viên, có bình giữ nhiệt + lịch, in logo 1 màu…" maxLength={500} />
      </label>
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={up("website")} aria-hidden />
      {err && <p className="mt-3 text-sm text-sale">{err}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary px-6 py-3" disabled={state === "sending"}>
          {state === "sending" ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
        </button>
        <p className="text-[13px] text-muted">Miễn phí tư vấn & mockup. Thông tin chỉ dùng để liên hệ báo giá.</p>
      </div>
    </form>
  );
}
