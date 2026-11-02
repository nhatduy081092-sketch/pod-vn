import Link from "next/link";
import { formatVND } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import type { SourceReport } from "@/lib/types";

export const metadata = { title: "Nguồn khách" };

const PERIODS = [7, 30, 90, 365];

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ days?: string; touch?: string }> }) {
  const sp = await searchParams;
  const r = await adminFetch<SourceReport>(`/reports/sources?days=${sp.days ?? "30"}&touch=${sp.touch === "first" ? "first" : "last"}`);
  const href = (days: number, touch: string) => `/sources?days=${days}${touch === "first" ? "&touch=first" : ""}`;
  const sum = r.rows.reduce((s, x) => ({ orders: s.orders + x.orders, revenue: s.revenue + x.revenue, paidOrders: s.paidOrders + x.paidOrders, paidRevenue: s.paidRevenue + x.paidRevenue, quotes: s.quotes + x.quotes, cancelled: s.cancelled + x.cancelled }), {
    orders: 0,
    revenue: 0,
    paidOrders: 0,
    paidRevenue: 0,
    quotes: 0,
    cancelled: 0,
  });
  return (
    <>
      <PageHeader
        title="Nguồn khách"
        description={
          <>
            Đơn đến từ đâu, tính từ dữ liệu lưu cùng đơn (không phụ thuộc Google Analytics hay trình chặn quảng cáo). Không gồm đơn seller và đơn thử. Doanh thu = đơn chưa huỷ; &quot;đã thu&quot; = đơn đã chuyển sang Đã thanh toán.
          </>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Khoảng thời gian">
          {PERIODS.map((d) => (
            <Link key={d} href={href(d, r.touch)} aria-current={r.days === d ? "true" : undefined} className={`btn-ghost px-3 ${r.days === d ? "btn-on" : ""}`}>
              {d === 365 ? "1 năm" : `${d} ngày`}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cách tính nguồn">
          <Link href={href(r.days, "last")} aria-current={r.touch === "last" ? "true" : undefined} className={`btn-ghost px-3 ${r.touch === "last" ? "btn-on" : ""}`}>
            Lần chạm gần nhất
          </Link>
          <Link href={href(r.days, "first")} aria-current={r.touch === "first" ? "true" : undefined} className={`btn-ghost px-3 ${r.touch === "first" ? "btn-on" : ""}`}>
            Lần chạm đầu
          </Link>
        </div>
      </div>

      {/* Điện thoại: mỗi nguồn một thẻ, số tiền thẳng hàng bên phải */}
      <div className="card p-0 md:hidden">
        {r.rows.length ? (
          <ul className="divide-y divide-neutral-100">
            {r.rows.map((x) => (
              <li key={x.group} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{x.label}</span>
                  <span className="font-semibold tabular-nums">{formatVND(x.revenue)}</span>
                </div>
                <div className="mt-0.5 flex justify-between gap-3 text-xs tabular-nums text-neutral-500">
                  <span>
                    {x.orders} đơn · {x.quotes} báo giá · {x.cancelled} huỷ
                  </span>
                  <span>
                    đã thu {formatVND(x.paidRevenue)} ({x.paidOrders})
                  </span>
                </div>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-3 bg-neutral-50 px-4 py-3 font-semibold">
              <span>Tổng · {sum.orders} đơn</span>
              <span className="tabular-nums">{formatVND(sum.revenue)}</span>
            </li>
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">Chưa có đơn trong khoảng này.</p>
        )}
      </div>

      <div className="card hidden overflow-x-auto p-0 md:block md:p-0">
        <table className="table min-w-[720px]">
          <thead>
            <tr>
              <th className="pl-5">Nguồn</th>
              <th className="text-right">Đơn</th>
              <th className="text-right">Doanh thu</th>
              <th className="text-right">Đã thu</th>
              <th className="text-right">Báo giá</th>
              <th className="pr-5 text-right">Huỷ</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((x) => (
              <tr key={x.group}>
                <td className="pl-5 font-medium">{x.label}</td>
                <td className="text-right">{x.orders}</td>
                <td className="text-right">{formatVND(x.revenue)}</td>
                <td className="text-right">
                  {formatVND(x.paidRevenue)} <span className="text-neutral-400">({x.paidOrders})</span>
                </td>
                <td className="text-right">{x.quotes}</td>
                <td className="pr-5 text-right text-neutral-500">{x.cancelled}</td>
              </tr>
            ))}
            {!r.rows.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500">
                  Chưa có đơn trong khoảng này.
                </td>
              </tr>
            )}
          </tbody>
          {r.rows.length > 0 && (
            <tfoot className="font-semibold">
              <tr className="border-t border-neutral-200">
                <td className="py-3 pl-5">Tổng</td>
                <td className="px-3 py-3 text-right tabular-nums">{sum.orders}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatVND(sum.revenue)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatVND(sum.paidRevenue)} <span className="font-normal text-neutral-400">({sum.paidOrders})</span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{sum.quotes}</td>
                <td className="py-3 pl-3 pr-5 text-right tabular-nums">{sum.cancelled}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="mt-3 space-y-1 text-sm text-neutral-600">
        <p>
          <b className="font-semibold text-ink">Đơn thử đã loại ra:</b> {r.tests.orders} đơn ({formatVND(r.tests.revenue)}), {r.tests.quotes} báo giá. Đơn thử = đặt ở chế độ yala.vn/?yala_test=1 hoặc dùng email/SĐT trong biến TEST_ORDER_CONTACTS của máy chủ.
        </p>
        {r.legacy > 0 && <p>{r.legacy} đơn đặt trước khi có cột nguồn: nhóm được tính tạm từ UTM còn lưu, đơn không có UTM vào &quot;Trực tiếp / không rõ&quot;.</p>}
      </div>
    </>
  );
}
