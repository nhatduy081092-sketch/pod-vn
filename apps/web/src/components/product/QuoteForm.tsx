"use client";
import { useRef, useState } from "react";
import { quoteCreateSchema, UPLOAD_MAX_BYTES } from "@pod/shared";
import { apiFetch, uploadDesign } from "@/lib/client-api";
import { assetUrl } from "@/lib/config";
import { readUtm, track } from "@/lib/track";
import { LAST_ORDER_KEY } from "../shop/CheckoutForm";
import { IconCheck, IconUpload } from "../ui/icons";
import type { PrintArea, Variant } from "@/lib/types";
import { DesignCard, useAttachedDesign } from "./DesignCard";
import { VariantPicker, defaultVariant } from "./VariantPicker";
import { clearAttached } from "../editor/storage";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

/** Form cá nhân hoá + yêu cầu báo giá: logo/thiết kế, số lượng, nội dung in, liên hệ */
type Props = { productId: string; productName: string; slug: string; sizes: string[]; areas: PrintArea[]; variants: Variant[] };

export function QuoteForm({ productId, productName, slug, sizes, areas, variants }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const design = useAttachedDesign(productId);
  const [sel, setSel] = useState(() => defaultVariant(variants));
  const variant = variants.find((v) => v.color === sel.color && v.size === sel.size);
  const hasChoice = variants.some((v) => v.color) || variants.filter((v) => v.size && !/free\s*size/i.test(v.size)).length > 1;
  const [f, setF] = useState({ customerName: "", phone: "", email: "", company: "", quantity: "50", size: "", note: "" });
  const [designUrl, setDesignUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const realSizes = sizes.filter((s) => s.toLowerCase() !== "free size");

  async function onFile(file?: File) {
    setError("");
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setError("Chỉ nhận ảnh PNG, JPG hoặc WEBP");
    if (file.size > UPLOAD_MAX_BYTES) return setError("Ảnh tối đa 50MB");
    setUploading(true);
    try {
      setDesignUrl((await uploadDesign(file)).url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      ...f,
      productId,
      quantity: Number(f.quantity) || 0,
      designUrl: design ? "" : designUrl,
      design: design ? { json: design.json, files: design.files } : undefined,
      variantId: hasChoice ? variant?.id : undefined,
      size: hasChoice ? (variant?.size ?? f.size) : f.size,
      utm: readUtm(),
    };
    const parsed = quoteCreateSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Vui lòng kiểm tra thông tin");
    setSending(true);
    try {
      const r = await apiFetch<{ code: string }>("/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ code: r.code, phone: parsed.data.phone }));
      } catch {
        /* ignore */
      }
      track.contact("zalo");
      if (design) clearAttached(productId);
      setDone(r.code);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (done)
    return (
      <div className="rounded-xl border border-line bg-navy-light p-5 text-center">
        <IconCheck className="mx-auto h-10 w-10 text-navy" />
        <p className="mt-2 text-lg font-black">Đã gửi yêu cầu báo giá!</p>
        <p className="mt-1 text-sm">
          Mã yêu cầu: <b>{done}</b>. Chúng tôi sẽ gửi báo giá & mockup qua Zalo/điện thoại trong giờ làm việc.
        </p>
        <a href="/tra-cuu" className="mt-3 inline-block text-sm font-bold text-navy underline">
          Tra cứu yêu cầu
        </a>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-xl border border-line bg-white p-4">
      <p className="font-extrabold text-navy">Cá nhân hoá & nhận báo giá</p>

      <DesignCard slug={slug} productId={productId} areas={areas} design={design} step="Logo / thiết kế (không bắt buộc)" tone="navy" />
      {!design && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-navy/40 bg-navy-light/50 p-3 text-left text-sm"
          >
            {designUrl ? (
              <>
                <img src={assetUrl(designUrl)} alt="" className="h-12 w-12 rounded border object-contain" />
                <span className="font-semibold text-green-700">Đã tải file logo – bấm để đổi</span>
              </>
            ) : (
              <>
                <IconUpload className="h-6 w-6 shrink-0 text-navy" />
                <span>{uploading ? "Đang tải lên..." : "Hoặc chỉ gửi file logo (PNG, JPG, WEBP ≤ 50MB)"}</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept={ACCEPT.join(",")} className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
      )}
      {hasChoice && <VariantPicker variants={variants} color={sel.color} size={sel.size} onChange={setSel} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Số lượng *</span>
          <input className="input" inputMode="numeric" value={f.quantity} onChange={(e) => set("quantity", e.target.value.replace(/\D/g, ""))} />
        </label>
        {realSizes.length > 0 && !hasChoice ? (
          <label className="block">
            <span className="label">Size (nếu 1 size)</span>
            <select className="input" value={f.size} onChange={(e) => set("size", e.target.value)}>
              <option value="">Nhiều size / chưa rõ</option>
              {realSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="label">Công ty / tổ chức</span>
            <input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} />
          </label>
        )}
      </div>
      <label className="block">
        <span className="label">Nội dung cá nhân hoá</span>
        <textarea
          className="input"
          rows={3}
          value={f.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder={`VD: in logo 1 màu mặt trước, khắc tên từng người, màu ${productName.toLowerCase().includes("áo") ? "áo xanh navy" : "theo nhận diện"}, cần hàng trước ngày...`}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Họ tên *</span>
          <input className="input" autoComplete="name" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Số điện thoại / Zalo *</span>
          <input className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        {realSizes.length > 0 && !hasChoice && (
          <label className="block">
            <span className="label">Công ty / tổ chức</span>
            <input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} />
          </label>
        )}
      </div>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={sending || uploading} className="btn w-full border-navy bg-accent py-3 text-base text-white">
        {sending ? "Đang gửi..." : "Gửi yêu cầu báo giá miễn phí"}
      </button>
      <p className="text-center text-xs text-ink/60">Nhận làm từ số lượng nhỏ · Mockup miễn phí trước khi sản xuất</p>
    </form>
  );
}
