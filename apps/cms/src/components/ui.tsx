import type { OrderStatus } from "@pod/shared";
import { ORDER_STATUS_LABEL } from "@pod/shared";

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  DESIGN_APPROVED: "bg-indigo-100 text-indigo-800",
  PRINTING: "bg-violet-100 text-violet-800",
  SHIPPING: "bg-cyan-100 text-cyan-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-neutral-200 text-neutral-600",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
