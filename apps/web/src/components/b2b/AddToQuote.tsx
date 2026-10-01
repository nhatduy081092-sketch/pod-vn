"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuoteList } from "@/lib/quote-list";
import { track } from "@/lib/track";

type P = { id: string; slug: string; name: string; image: string; priceLabel: string };

/** Nút "Thêm vào báo giá" – gom nhiều sản phẩm rồi gửi 1 yêu cầu */
export function AddToQuote({ product, quantity = 1, variant = "outline", className = "" }: { product: P; quantity?: number; variant?: "outline" | "primary" | "compact"; className?: string }) {
  const { add, has, ready } = useQuoteList();
  const [added, setAdded] = useState(false);
  const inList = ready && has(product.id);
  const style =
    variant === "primary"
      ? "btn-primary w-full"
      : variant === "compact"
        ? "flex w-full items-center justify-center gap-1 rounded-full border border-line py-2 text-[13px] font-semibold transition hover:border-ink"
        : "btn-outline w-full";
  if (inList && !added)
    return (
      <Link href="/doanh-nghiep/bao-gia" className={`${style} ${className}`}>
        ✓ Đã trong danh sách báo giá
      </Link>
    );
  return (
    <div className={className}>
      <button
        type="button"
        className={style}
        onClick={() => {
          add({ productId: product.id, slug: product.slug, name: product.name, image: product.image, priceLabel: product.priceLabel, quantity });
          setAdded(true);
          track.lead("add_to_quote");
        }}
      >
        {added ? "✓ Đã thêm vào báo giá" : "+ Thêm vào báo giá"}
      </button>
      {added && (
        <Link href="/doanh-nghiep/bao-gia" className="mt-1.5 block text-center text-[13px] font-semibold text-brand-dark underline underline-offset-4">
          Xem danh sách & gửi yêu cầu →
        </Link>
      )}
    </div>
  );
}

/** Biểu tượng danh sách báo giá trên header (chỉ hiện khi có sản phẩm) */
export function QuoteListBadge() {
  const { count, ready } = useQuoteList();
  if (!ready || !count) return null;
  return (
    <Link href="/doanh-nghiep/bao-gia" className="flex items-center gap-1 p-1 text-ink/85 hover:text-ink" aria-label={`Danh sách báo giá (${count} sản phẩm)`}>
      <span className="relative">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 4h6l1 2h3v14H5V6h3l1-2Z" />
          <path d="M9 11h6M9 15h4" />
        </svg>
        <span className="absolute -right-2 -top-1.5 min-w-[18px] rounded-full bg-ink px-1 text-center text-[11px] font-semibold leading-[18px] text-white">{count}</span>
      </span>
      <span className="hidden whitespace-nowrap pl-2.5 text-sm font-semibold xl:inline">Báo giá</span>
    </Link>
  );
}
