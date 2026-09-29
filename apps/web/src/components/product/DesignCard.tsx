"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatVND } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { AttachedDesign, PrintArea } from "@/lib/types";
import { clearAttached, readAttached } from "../editor/storage";
import { IconBrush, IconCheck } from "../ui/icons";

/** Thiết kế đang gắn với sản phẩm (đọc từ sessionStorage, cập nhật khi editor lưu) */
export function useAttachedDesign(productId: string) {
  const [d, setD] = useState<AttachedDesign | null>(null);
  useEffect(() => {
    const sync = () => setD(readAttached(productId));
    sync();
    const on = (e: Event) => (e as CustomEvent<{ productId: string }>).detail?.productId === productId && sync();
    window.addEventListener("pod:design", on);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("pod:design", on);
      window.removeEventListener("focus", sync);
    };
  }, [productId]);
  return d;
}

type Props = {
  slug: string;
  productId: string;
  areas: PrintArea[];
  design: AttachedDesign | null;
  step?: string;
  tone?: "brand" | "navy";
};

export function DesignCard({ slug, productId, areas, design, step = "Thiết kế", tone = "brand" }: Props) {
  const editHref = `/thiet-ke/${slug}`;
  const extras = design ? areas.filter((a) => design.files.some((f) => f.area === a.key)).reduce((s, a) => s + a.extraPrice, 0) : 0;
  const ring = tone === "navy" ? "border-navy" : "border-ink";
  return (
    <section id="thiet-ke" className="scroll-mt-28">
      <h2 className="label">{step}</h2>
      {design ? (
        <div className={`rounded-lg border-2 ${ring} bg-white p-3`}>
          <p className="flex items-center gap-1.5 text-sm font-bold text-green-700">
            <IconCheck className="h-4 w-4" /> Đã có thiết kế · {design.files.length} mặt in
          </p>
          <ul className="mt-2 flex gap-2 overflow-x-auto">
            {design.files.map((f) => (
              <li key={f.area} className="w-20 shrink-0 text-center">
                <img src={assetUrl(f.previewUrl)} alt={`Xem trước ${f.name}`} className="aspect-square w-full rounded border border-ink/15 object-contain" />
                <span className="mt-0.5 block truncate text-[11px] font-semibold">{f.name}</span>
              </li>
            ))}
          </ul>
          {extras > 0 && <p className="mt-2 text-xs text-ink/70">Phụ phí mặt in thêm: +{formatVND(extras)}/sản phẩm (đã cộng vào giá)</p>}
          <div className="mt-3 flex gap-2 text-sm">
            <Link href={editHref} className="btn flex-1 border-ink/30 bg-white px-3 py-2">
              Sửa thiết kế
            </Link>
            <button type="button" onClick={() => clearAttached(productId)} className="btn border-ink/30 bg-white px-3 py-2 text-red-600">
              Bỏ
            </button>
          </div>
        </div>
      ) : (
        <Link href={editHref} className={`group flex items-center gap-3 rounded-lg border-2 ${ring} ${tone === "navy" ? "bg-navy text-white" : "bg-brand text-ink"} px-4 py-3.5 shadow-hard transition hover:-translate-y-0.5`}>
          <IconBrush className="h-7 w-7 shrink-0" />
          <span>
            <span className="block text-base font-black">Bắt đầu thiết kế</span>
            <span className="block text-xs opacity-80">
              Tải ảnh, thêm chữ trên {areas.length > 1 ? `${areas.length} mặt in` : "vùng in"} · xem trước ngay trên sản phẩm
            </span>
          </span>
          <span className="ml-auto text-xl transition group-hover:translate-x-1">→</span>
        </Link>
      )}
    </section>
  );
}
