import Link from "next/link";
import { formatDateTimeVN, formatVND, ORDER_STATUS_LABEL, ORDER_STATUSES } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { PageHeader, StatusBadge } from "@/components/ui";
import { OrderCards } from "@/components/OrderCards";

export default async function Dashboard() {
  const s = await adminFetch<Stats>("/stats");
  // Việc cần làm: hàng chờ có số > 0 mới tô cam; số 0 vẫn in ra để khung không nhảy
  const queues = [
    { href: "/orders?status=PENDING", label: "Đơn chờ xác nhận", count: s.statusCounts.PENDING },
    { href: "/leads?status=NEW", label: "Khách mới để lại SĐT", count: s.newLeads },
    { href: "/sellers?status=PENDING", label: "Seller chờ duyệt", count: s.pendingSellers },
    { href: "/batches?status=UNPAID", label: "Thanh toán gộp chờ đối soát", count: s.unpaidBatches },
  ];
  const kpis = [
    { label: "24 giờ qua", ...s.last24h },
    { label: "7 ngày", ...s.last7d },
    { label: "30 ngày", ...s.last30d },
  ];
  const waiting = queues.reduce((n, q) => n + q.count, 0);
  return (
    <>
      <PageHeader title="Tổng quan" description={waiting ? `${waiting} việc đang chờ xử lý. Doanh thu không tính đơn huỷ.` : "Không có việc nào đang chờ. Doanh thu không tính đơn huỷ."} />

      <section aria-labelledby="viec-can-lam" className="mb-4">
        <h2 id="viec-can-lam" className="sr-only">
          Việc cần làm
        </h2>
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 [gap:1px] lg:grid-cols-4">
          {queues.map((q) => (
            <Link key={q.href} href={q.href} className="group flex flex-col justify-between gap-2 bg-white p-4 transition-colors hover:bg-neutral-50">
              <span className="text-[13px] text-neutral-600 group-hover:text-ink">{q.label}</span>
              <span className={`text-2xl font-semibold tabular-nums ${q.count ? "text-brand-dark" : "text-neutral-400"}`}>
                {q.count}
                {q.count > 0 && <span className="ml-2 align-middle text-sm font-medium text-brand-dark">Xem →</span>}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="doanh-thu" className="card mb-4 p-0 md:p-0">
        <h2 id="doanh-thu" className="px-4 pt-4 text-sm font-semibold md:px-5">
          Doanh thu
        </h2>
        <dl className="divide-y divide-neutral-100 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {kpis.map((k) => (
            <div key={k.label} className="flex items-baseline justify-between gap-3 px-4 py-3 sm:block sm:px-5 sm:py-4">
              <dt className="text-[13px] text-neutral-600">{k.label}</dt>
              <dd className="text-right sm:text-left">
                <span className="block text-lg font-semibold tabular-nums sm:mt-1 sm:text-2xl">{formatVND(k.revenue)}</span>
                <span className="text-xs tabular-nums text-neutral-500">{k.orders} đơn</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="don-moi" className="card p-0 md:p-0">
          <div className="flex items-center justify-between px-4 pb-2 pt-4 md:px-5">
            <h2 id="don-moi" className="text-sm font-semibold">
              Đơn mới nhất
            </h2>
            <Link href="/orders" className="text-sm font-medium text-brand-dark hover:text-brand-deep">
              Xem tất cả →
            </Link>
          </div>
          <div className="md:hidden">
            <OrderCards items={s.recent} />
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th className="pl-5">Mã đơn</th>
                  <th>Khách</th>
                  <th className="text-right">Tổng</th>
                  <th>Trạng thái</th>
                  <th className="pr-5 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {s.recent.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50">
                    <td className="pl-5">
                      <Link href={`/orders/${o.id}`} className="font-semibold text-brand-dark hover:text-brand-deep">
                        {o.code}
                      </Link>
                    </td>
                    <td>
                      <span className="block">{o.customerName}</span>
                      <span className="text-xs text-neutral-500">{o.phone}</span>
                    </td>
                    <td className="text-right font-semibold">{formatVND(o.total)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="whitespace-nowrap pr-5 text-right text-xs text-neutral-500">{formatDateTimeVN(o.createdAt)}</td>
                  </tr>
                ))}
                {!s.recent.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      Chưa có đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="theo-trang-thai" className="card p-0 md:p-0">
          <h2 id="theo-trang-thai" className="px-4 pb-2 pt-4 text-sm font-semibold md:px-5">
            Đơn theo trạng thái
          </h2>
          <ul className="px-2 pb-2">
            {ORDER_STATUSES.map((st) => (
              <li key={st}>
                <Link href={`/orders?status=${st}`} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-neutral-50">
                  <span>{ORDER_STATUS_LABEL[st]}</span>
                  <span className={`tabular-nums ${s.statusCounts[st] ? "font-semibold text-ink" : "text-neutral-400"}`}>{s.statusCounts[st]}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="border-t border-neutral-100 px-5 py-3 text-sm text-neutral-600">
            <Link href="/products" className="hover:text-ink">
              <span className="font-semibold tabular-nums text-ink">{s.productCount}</span> sản phẩm đang bán →
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
