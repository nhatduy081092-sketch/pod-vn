"use client";
import { useEffect, useRef, useState } from "react";
import { UPLOAD_MAX_BYTES } from "@pod/shared";
import { uploadDesign } from "@/lib/client-api";
import { assetUrl } from "@/lib/config";
import { track } from "@/lib/track";
import { IconUpload } from "../ui/icons";

const LOGO_ACCEPT = ["image/png", "image/jpeg", "image/webp"];

type Option = { key: string; title: string };
type Props = {
  solutions: Option[];
  industries: { name: string; slug: string }[];
  zalo: string;
  hotline: string;
  /** nhóm khách (trang CLB thể thao, hội nhóm, team building): ghi vào chủ đề liên hệ + đổi nhãn cho hợp */
  segment?: string;
  notePlaceholder?: string;
};

const QTY = ["Dưới 10", "10 – 30", "30 – 50", "50 – 200", "200 – 500", "500 – 1.000", "Trên 1.000"];
const BUDGET = ["Dưới 50.000đ", "50 – 100.000đ", "100 – 200.000đ", "200 – 300.000đ", "Trên 300.000đ", "Chưa xác định"];

/** Form yêu cầu báo giá doanh nghiệp – gửi vào hệ thống liên hệ (CMS + Telegram) */
export function B2BQuoteForm({ solutions, industries, zalo, hotline, segment, notePlaceholder }: Props) {
  const [f, setF] = useState({ name: "", phone: "", company: "", email: "", occasion: "", qty: "", budget: "", deadline: "", note: "", website: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState("");
  // file logo (không bắt buộc): tải lên kho ảnh như form báo giá sản phẩm, gửi kèm link trong nội dung yêu cầu
  const logoRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  async function onLogo(file?: File) {
    setErr("");
    if (!file) return;
    if (!LOGO_ACCEPT.includes(file.type)) return setErr("Logo nhận ảnh PNG, JPG hoặc WEBP. File AI/PDF: gửi qua Zalo sau khi gửi form");
    if (file.size > UPLOAD_MAX_BYTES) return setErr("Ảnh logo tối đa 50MB");
    setUploading(true);
    try {
      setLogo({ url: (await uploadDesign(file)).url, name: file.name });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  const up =(k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

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
    if (uploading) return setErr("Đang tải logo lên, đợi vài giây rồi gửi lại");
    const lines = [
      segment && `Nhóm khách: ${segment}`,
      // đặt sớm để không bị cắt khi nội dung dài (giới hạn 1000 ký tự)
      logo && `Logo: ${new URL(assetUrl(logo.url), window.location.origin).href}`,
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
        <p className="mt-2 text-[15px] text-muted">
          YALA sẽ liên hệ trong giờ làm việc để tư vấn và gửi mockup. Cần gấp? Nhắn Zalo kèm nội dung bên dưới{zalo && !logo ? " và file logo – có logo YALA làm mockup nhanh hơn" : ""}.
        </p>
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
    <form onSubmit={submit} className="rounded-3xl bg-surface p-5 md:p-8" noValidate data-quote-form>
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
          <span className="label">{segment ? "Tên đội / nhóm / công ty" : "Công ty / tổ chức"}</span>
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
          <span className="label">{segment ? "Ngân sách mỗi sản phẩm" : "Ngân sách mỗi phần quà"}</span>
          <select className={input} value={f.budget} onChange={up("budget")}>
            <option value="">Chọn</option>
            {BUDGET.map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>
      {industries.length > 0 && (
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
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
              >
                {i.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      )}
      <label className="mt-4 block">
        <span className="label">Mô tả thêm</span>
        <textarea className={input} rows={3} value={f.note} onChange={up("note")} placeholder={notePlaceholder ?? "VD: 300 hộp quà Tết cho nhân viên, có bình giữ nhiệt + lịch, in logo 1 màu…"} maxLength={500} />
      </label>
      <div className="mt-4">
        <span className="label">File logo (không bắt buộc)</span>
        <button
          type="button"
          onClick={() => logoRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-ink/30 bg-white p-3 text-left text-[15px] transition hover:border-ink"
        >
          {logo ? (
            <>
              <img src={assetUrl(logo.url)} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-line object-contain" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{logo.name}</span>
                <span className="text-sm text-muted">Đã tải lên · bấm để đổi file khác</span>
              </span>
            </>
          ) : (
            <>
              <IconUpload className="h-6 w-6 shrink-0 text-ink/60" />
              <span>
                {uploading ? "Đang tải lên…" : "Tải logo lên để nhận mockup nhanh hơn"}
                <span className="block text-sm text-muted">PNG, JPG, WEBP tối đa 50MB · file AI, PDF gửi qua Zalo sau</span>
              </span>
            </>
          )}
        </button>
        <input ref={logoRef} type="file" accept={LOGO_ACCEPT.join(",")} className="hidden" onChange={(e) => void onLogo(e.target.files?.[0])} />
      </div>
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={up("website")} aria-hidden />
      {err && <p className="mt-3 text-sm text-sale">{err}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary px-6 py-3" disabled={state === "sending"}>
          {state === "sending" ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
        </button>
        <p className="text-sm text-muted">Miễn phí tư vấn & mockup. Thông tin chỉ dùng để liên hệ báo giá.</p>
      </div>
    </form>
  );
}
