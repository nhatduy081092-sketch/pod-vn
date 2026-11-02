import type { OrderStatus } from "@pod/shared";
import { ORDER_STATUS_LABEL } from "@pod/shared";

// Một sắc cho cả quy trình: cam = cần xử lý, xám = đang làm, xanh = xong, nhạt = đã huỷ
const STATUS_STYLE: Record<OrderStatus, { chip: string; dot: string }> = {
  PENDING: { chip: "bg-brand-light text-brand-deep", dot: "bg-brand" },
  CONFIRMED: { chip: "bg-neutral-100 text-neutral-800", dot: "bg-neutral-800" },
  DESIGN_APPROVED: { chip: "bg-neutral-100 text-neutral-800", dot: "bg-neutral-800" },
  PRINTING: { chip: "bg-neutral-100 text-neutral-800", dot: "bg-neutral-800" },
  SHIPPING: { chip: "bg-neutral-100 text-neutral-800", dot: "bg-neutral-800" },
  COMPLETED: { chip: "bg-green-50 text-green-800", dot: "bg-green-600" },
  CANCELLED: { chip: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-400" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

/** Nhãn phụ trên dòng (Báo giá, Dropship, Đơn thử…) – không bao giờ bị bóp méo trong cột hẹp */
export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex flex-none whitespace-nowrap rounded border border-neutral-200 bg-white px-1.5 py-px text-[11px] font-medium text-neutral-600">{children}</span>;
}

export function PageHeader({ title, description, children }: { title: string; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-neutral-600">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
