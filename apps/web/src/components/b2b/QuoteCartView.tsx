"use client";
import Link from "next/link";
import { useState } from "react";
import { B2B_BUDGETS, quoteCartSchema } from "@pod/shared";
import { useQuoteList } from "@/lib/quote-list";
import { apiFetch } from "@/lib/client-api";
import { assetUrl } from "@/lib/config";
import { readUtm, track } from "@/lib/track";

type Props = { solutions: { key: string; title: string }[]; salesZalo: string; salesName: string; hotline: string; responseTime: string };

/** Danh sách yêu cầu báo giá nhiều sản phẩm + thông tin doanh nghiệp -> gửi 1 lần */
export function QuoteCartView({ solutions, salesZalo, salesName, hotline, responseTime }: Props) {
  const { items, ready, update, remove, clear } = useQuoteList();
  const [f, setF] = useState({ customerName: "", phone: "", company: "", email: "", occasion: "", budget: "", deadline: "", note: "", website: "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ code: string; summary: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const zaloHref = salesZalo ? `https://zalo.me/${salesZalo.replace(/\D/g, "")}` : "";
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const payload = {
      ...f,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note })),
      pageUrl: window.location.pathname,
      utm: readUtm(),
    };
    const parsed = quoteCartSchema.safeParse(payload);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Vui lòng kiểm tra thông tin");
    setSending(true);
    try {
      const r = await apiFetch<{ code: string }>("/quotes/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const summary = [
        `Yêu cầu báo giá ${r.code} – ${f.customerName}${f.company ? ` (${f.company})` : ""} – ${f.phone}`,
        f.occasion && `Dịp: ${f.occasion}`,
        f.budget && `Ngân sách/phần: ${f.budget}`,
        f.deadline && `Cần hàng trước: ${f.deadline.split("-").reverse().join("/")}`,
        ...items.map((i) => `- ${i.name} × ${i.quantity}${i.note ? ` (${i.note})` : ""}`),
        f.note && `Ghi chú: ${f.note}`,
      ]
        .filter(Boolean)
        .join("\n");
      track.lead("b2b_quote_cart");
      setDone({ code: r.code, summary });
      clear();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (done)
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-surface p-6 md:p-8" role="status">
        <p className="text-sm font-semibold text-brand-dark">Đã gửi yêu cầu</p>
        <h2 className="mt-1 text-2xl font-bold">Mã yêu cầu {done.code}</h2>
        <p className="mt-2 text-[15px] text-muted">
          {salesName ? `${salesName} – ` : ""}YALA sẽ liên hệ để tư vấn và gửi báo giá kèm mockup. {responseTime}.
        </p>
        <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">{done.summary}</pre>
        <p className="mt-4 text-sm text-muted">Cần nhanh hơn? Sao chép nội dung và gửi qua Zalo cho sales:</p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {zaloHref && (
            <a
              href={zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              onClick={() => {
                void navigator.clipboard?.writeText(done.summary).then(() => setCopied(true));
                track.contact("zalo");
              }}
            >
              Sao chép & mở Zalo sales
            </a>
          )}
          <button type="button" className="btn-outline" onClick={() => void navigator.clipboard?.writeText(done.summary).then(() => setCopied(true))}>
            {copied ? "✓ Đã sao chép" : "Sao chép nội dung"}
          </button>
          {hotline && (
            <a href={`tel:${hotline.replace(/\s/g, "")}`} className="btn-outline" onClick={() => track.contact("phone")}>
              Gọi {hotline}
            </a>
          )}
        </div>
        <Link href="/doanh-nghiep/san-pham" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">
          Tiếp tục xem sản phẩm doanh nghiệp
        </Link>
      </div>
    );

  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  if (!items.length)
    return (
      <div className="rounded-3xl bg-surface p-8 text-center">
        <p className="text-lg font-semibold">Danh sách báo giá đang trống</p>
        <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">Bấm “+ Thêm vào báo giá” ở các sản phẩm bạn quan tâm, rồi quay lại đây gửi 1 yêu cầu cho tất cả.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link href="/doanh-nghiep/san-pham" className="btn-primary">Chọn sản phẩm</Link>
          <Link href="/doanh-nghiep#bao-gia" className="btn-outline">Gửi nhu cầu không cần chọn sản phẩm</Link>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start" noValidate>
      <section aria-label="Sản phẩm cần báo giá">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            {items.length} sản phẩm · {totalQty.toLocaleString("vi-VN")} cái
          </h2>
          <Link href="/doanh-nghiep/san-pham" className="text-sm font-semibold underline underline-offset-4">+ Thêm sản phẩm</Link>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-3 p-3 md:gap-4 md:p-4">
              <Link href={`/san-pham/${i.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface md:h-24 md:w-24">
                {i.image && <img src={assetUrl(i.image)} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/san-pham/${i.slug}`} className="line-clamp-2 text-[14px] font-semibold leading-snug hover:text-brand-dark md:text-[15px]">{i.name}</Link>
                  <button type="button" onClick={() => remove(i.productId)} className="shrink-0 text-[13px] text-muted hover:text-sale" aria-label={`Bỏ ${i.name}`}>Bỏ</button>
                </div>
                {i.priceLabel && <p className="mt-0.5 text-[13px] text-muted">{i.priceLabel}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[13px]">
                    SL
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className="input h-9 w-24 py-1"
                      value={i.quantity}
                      onChange={(e) => update(i.productId, { quantity: Number(e.target.value) })}
                      aria-label={`Số lượng ${i.name}`}
                    />
                  </label>
                  <input
                    className="input h-9 min-w-[150px] flex-1 py-1 text-[13px]"
                    placeholder="Màu, size, vị trí in logo…"
                    maxLength={300}
                    value={i.note}
                    onChange={(e) => update(i.productId, { note: e.target.value })}
                    aria-label={`Ghi chú ${i.name}`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-surface p-5 md:p-6 lg:sticky lg:top-32" aria-label="Thông tin liên hệ">
        <h2 className="text-lg font-semibold">Thông tin nhận báo giá</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label className="block">
            <span className="label">Họ tên *</span>
            <input className="input" value={f.customerName} onChange={up("customerName")} autoComplete="name" required />
          </label>
          <label className="block">
            <span className="label">Số điện thoại / Zalo *</span>
            <input className="input" value={f.phone} onChange={up("phone")} inputMode="tel" autoComplete="tel" required />
          </label>
          <label className="block">
            <span className="label">Công ty / tổ chức</span>
            <input className="input" value={f.company} onChange={up("company")} autoComplete="organization" />
          </label>
          <label className="block">
            <span className="label">Email nhận báo giá</span>
            <input className="input" type="email" value={f.email} onChange={up("email")} autoComplete="email" />
          </label>
          <label className="block">
            <span className="label">Dịp / mục đích</span>
            <select className="input" value={f.occasion} onChange={up("occasion")}>
              <option value="">Chọn dịp</option>
              {solutions.map((s) => (
                <option key={s.key} value={s.title}>{s.title}</option>
              ))}
              <option value="Khác">Khác</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Ngân sách mỗi phần</span>
            <select className="input" value={f.budget} onChange={up("budget")}>
              <option value="">Chọn</option>
              {B2B_BUDGETS.map((b) => (
                <option key={b.key} value={b.label}>{b.label}</option>
              ))}
              <option value="Chưa xác định">Chưa xác định</option>
            </select>
          </label>
          <label className="block sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <span className="label">Cần hàng trước ngày</span>
            <input className="input" type="date" value={f.deadline} onChange={up("deadline")} />
          </label>
          <label className="block sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <span className="label">Ghi chú chung</span>
            <textarea className="input" rows={3} maxLength={1000} value={f.note} onChange={up("note")} placeholder="Logo mấy màu, đóng hộp quà, giao nhiều địa điểm, cần xuất VAT…" />
          </label>
        </div>
        <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={up("website")} aria-hidden />
        {err && <p className="mt-3 text-sm text-sale">{err}</p>}
        <button type="submit" className="btn-primary mt-4 w-full py-3" disabled={sending}>
          {sending ? "Đang gửi…" : `Gửi yêu cầu báo giá (${items.length} sản phẩm)`}
        </button>
        <p className="mt-2 text-center text-[13px] text-muted">Miễn phí tư vấn & mockup · {responseTime}</p>
      </section>
    </form>
  );
}
