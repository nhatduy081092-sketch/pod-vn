import Link from "next/link";
import { formatDateTimeVN, formatVND, PAYMENT_STATUS_LABEL } from "@pod/shared";
import type { AdminOrder } from "@/lib/types";
import { StatusBadge, Tag } from "./ui";

type Row = Pick<AdminOrder, "id" | "code" | "customerName" | "phone" | "total" | "status" | "paymentMethod" | "createdAt"> &
  Partial<Pick<AdminOrder, "isQuote" | "company" | "paymentStatus" | "seller">>;

/** Đơn hàng dạng thẻ cho điện thoại: mã + trạng thái, khách, tiền + giờ – không phải kéo ngang */
export function OrderCards({ items, empty = "Chưa có đơn hàng" }: { items: Row[]; empty?: string }) {
  if (!items.length) return <p className="px-4 py-8 text-center text-sm text-neutral-500">{empty}</p>;
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="block px-4 py-3 active:bg-neutral-50">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-semibold text-brand-dark">{o.code}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-medium text-ink">{o.customerName}</span>
              <span className="text-neutral-500">{o.phone}</span>
              {o.isQuote && <Tag>Báo giá</Tag>}
              {o.seller && <Tag>Dropship · {o.seller.name}</Tag>}
            </div>
            {o.company && <p className="text-xs text-neutral-500">{o.company}</p>}
            <div className="mt-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold tabular-nums">{o.isQuote ? "Chờ báo giá" : formatVND(o.total)}</span>
              <span className="text-right text-xs tabular-nums text-neutral-500">
                {o.paymentStatus && !o.isQuote ? `${o.paymentMethod === "COD" ? "COD" : "CK"} · ${PAYMENT_STATUS_LABEL[o.paymentStatus]} · ` : ""}
                <span className="whitespace-nowrap">{formatDateTimeVN(o.createdAt)}</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
