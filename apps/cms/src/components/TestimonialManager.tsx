"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatVND, testimonialUpsertSchema, type TestimonialUpsertInput } from "@pod/shared";
import { deleteTestimonialAction, saveTestimonialAction } from "@/lib/actions";
import type { AdminTestimonial } from "@/lib/types";
import { ImageInput } from "./ImageInput";

const EMPTY: TestimonialUpsertInput = { name: "", content: "", rating: 5, productName: "", productPrice: null, imageUrl: "", isActive: true };

export function TestimonialManager({ items }: { items: AdminTestimonial[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<TestimonialUpsertInput>(EMPTY);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const open = (t?: AdminTestimonial) => {
    setErr("");
    setEditing(t?.id ?? "new");
    setF(t ? { name: t.name, content: t.content, rating: t.rating, productName: t.productName, productPrice: t.productPrice, imageUrl: t.imageUrl, isActive: t.isActive } : EMPTY);
  };

  const save = () => {
    const parsed = testimonialUpsertSchema.safeParse(f);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Không hợp lệ");
    start(async () => {
      const r = await saveTestimonialAction(editing === "new" ? null : editing, parsed.data);
      if (!r.ok) return setErr(r.error);
      setEditing(null);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-2">
        <button className="btn-brand" onClick={() => open()}>
          + Thêm đánh giá
        </button>
        {items.map((t) => (
          <div key={t.id} className="card flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {t.name} <span className="text-brand-dark">{"★".repeat(t.rating)}</span> {!t.isActive && <span className="text-xs text-neutral-400">(ẩn)</span>}
              </p>
              <p className="mt-1 text-sm text-neutral-700">{t.content}</p>
              {t.productName && (
                <p className="mt-1 text-xs text-neutral-500">
                  {t.productName} {t.productPrice != null && `· ${formatVND(t.productPrice)}`}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button className="btn-ghost px-2 py-1" onClick={() => open(t)}>
                Sửa
              </button>
              <button
                className="btn-danger px-2 py-1"
                disabled={pending}
                onClick={() =>
                  confirm("Xoá đánh giá?") &&
                  start(async () => {
                    await deleteTestimonialAction(t.id);
                    router.refresh();
                  })
                }
              >
                Xoá
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="card h-fit space-y-3">
          <h2 className="font-bold">{editing === "new" ? "Thêm đánh giá" : "Sửa đánh giá"}</h2>
          <label className="block">
            <span className="label">Tên khách *</span>
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Nội dung *</span>
            <textarea className="input" rows={4} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Số sao</span>
            <select className="input" value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sao
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Sản phẩm đã mua</span>
            <input className="input" value={f.productName} onChange={(e) => setF({ ...f, productName: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Giá (₫)</span>
            <input
              className="input"
              inputMode="numeric"
              value={f.productPrice ?? ""}
              onChange={(e) => setF({ ...f, productPrice: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })}
            />
          </label>
          <ImageInput label="Ảnh feedback (tuỳ chọn)" value={f.imageUrl} onChange={(v) => setF({ ...f, imageUrl: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Hiển thị
          </label>
          {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={save} disabled={pending}>
              Lưu
            </button>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
