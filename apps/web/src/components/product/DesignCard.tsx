"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatVND } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { AttachedDesign, PrintArea } from "@/lib/types";
import { clearAttached, readAttached } from "../editor/storage";
import { IconCheck } from "../ui/icons";

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
  /** màu đang chọn -> mở công cụ thiết kế với đúng màu áo */
  color?: string;
};

export function DesignCard({ slug, productId, areas, design, step = "Thiết kế", tone = "brand", color }: Props) {
  const editHref = `/thiet-ke/${slug}${color ? `?mau=${encodeURIComponent(color)}` : ""}`;
  const extras = design ? areas.filter((a) => design.files.some((f) => f.area === a.key)).reduce((s, a) => s + a.extraPrice, 0) : 0;
  return (
    <section id="thiet-ke" className="scroll-mt-28">
      <h2 className="label">{step}</h2>
      {design ? (
        <div className="rounded-lg bg-surface p-4">
          <p className="flex items-center gap-1.5 text-base font-bold text-green-700">
            <IconCheck className="h-4 w-4" /> Đã có thiết kế · {design.files.length} mặt in
          </p>
          <ul className="mt-2 flex gap-2 overflow-x-auto">
            {design.files.map((f) => (
              <li key={f.area} className="w-20 shrink-0 text-center">
                <img src={assetUrl(f.previewUrl)} alt={`Xem trước ${f.name}`} className="aspect-square w-full rounded-md bg-white object-contain" />
                <span className="mt-1 block truncate text-[13px] font-semibold">{f.name}</span>
              </li>
            ))}
          </ul>
          {extras > 0 && <p className="mt-2 text-[15px] text-ink/80">Phụ phí mặt in thêm: +{formatVND(extras)}/sản phẩm (đã cộng vào giá)</p>}
          <div className="mt-3 flex gap-2">
            <Link href={editHref} className="btn-outline flex-1 px-3 py-2">
              Sửa thiết kế
            </Link>
            <button type="button" onClick={() => clearAttached(productId)} className="btn-outline px-3 py-2 text-red-600">
              Bỏ
            </button>
          </div>
        </div>
      ) : (
        <Link
          href={editHref}
          className={`group flex items-center gap-4 rounded-lg px-5 py-4 transition-colors ${tone === "navy" ? "bg-navy text-white hover:bg-navy-dark" : "bg-brand text-ink hover:bg-ink hover:text-white"}`}
        >
          <span>
            <span className="block text-lg font-bold">Tự thiết kế với YALA Studio</span>
            <span className="mt-0.5 block text-[15px] opacity-90">
              Tải ảnh, thêm chữ trên {areas.length > 1 ? `${areas.length} mặt in` : "vùng in"} · xem trước ngay trên sản phẩm
            </span>
          </span>
          <span aria-hidden className="ml-auto text-2xl transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      )}
    </section>
  );
}
