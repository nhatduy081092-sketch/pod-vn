"use client";
import { OrderItems } from "./OrderItems";
import { useEffect, useState } from "react";
import {
  formatDateTimeVN,
  formatVND,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type OrderStatus,
} from "@pod/shared";
import { apiFetch } from "@/lib/client-api";
import { assetUrl } from "@/lib/config";
import type { OrderView } from "@/lib/types";
import { LAST_ORDER_KEY } from "./CheckoutForm";
import { IconCheck } from "../ui/icons";

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "DESIGN_APPROVED", "PRINTING", "SHIPPING", "COMPLETED"];

/** Tra cứu đơn (mã + SĐT). Nếu vừa đặt xong -> tự hiển thị từ sessionStorage, không đưa SĐT lên URL. */
export function OrderLookup({ initialCode = "", justPlaced = false }: { initialCode?: string; justPlaced?: boolean }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(c: string, p: string) {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ code: c.trim(), phone: p.trim() });
      setOrder(await apiFetch<OrderView>(`/orders/lookup?${qs.toString()}`));
    } catch (e) {
      setError((e as Error).message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      if (!raw) return;
      const last = JSON.parse(raw) as { code: string; phone: string };
      if (!initialCode || last.code === initialCode) {
        setCode(last.code);
        setPhone(last.phone);
        void lookup(last.code, last.phone);
      }
    } catch {
      /* ignore */
    }
  }, [initialCode]);

  if (order) return <OrderDetails order={order} justPlaced={justPlaced} />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void lookup(code, phone);
      }}
      className="mx-auto mt-6 max-w-md rounded-lg border border-line bg-white p-5 shadow-stack"
    >
      <label className="block">
        <span className="label">Mã đơn hàng</span>
        <input className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: POD250928AB12" required />
      </label>
      <label className="mt-3 block">
        <span className="label">Số điện thoại đặt hàng</span>
        <input className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </label>
      {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <button className="btn-primary mt-4 w-full" disabled={loading}>
        {loading ? "Đang tra cứu..." : "Tra cứu"}
      </button>
    </form>
  );
}

function OrderDetails({ order, justPlaced }: { order: OrderView; justPlaced: boolean }) {
  const step = FLOW.indexOf(order.status);
  const qr =
    order.bank && order.paymentStatus === "UNPAID" && !order.isQuote && order.total > 0
      ? `https://img.vietqr.io/image/${encodeURIComponent(order.bank.bankId)}-${encodeURIComponent(order.bank.accountNo)}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(order.bank.accountName)}`
      : "";

  return (
    <div className="mx-auto mt-6 max-w-3xl space-y-5">
      {justPlaced && (
        <div className="rounded-lg border border-line bg-[#D9F99D] p-5 text-center shadow-stack">
          <IconCheck className="mx-auto h-10 w-10" />
          <h2 className="mt-1 text-xl font-black">Đặt hàng thành công!</h2>
          <p className="mt-1 text-sm">
            Mã đơn: <b className="text-lg">{order.code}</b> – shop sẽ liên hệ Zalo/điện thoại để gửi mockup trong giờ làm việc.
          </p>
        </div>
      )}

      {qr && (
        <section className="grid items-center gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-[220px_1fr]">
          <img src={qr} alt={`Mã VietQR thanh toán đơn ${order.code}`} className="mx-auto w-[220px]" />
          <div className="text-sm">
            <h3 className="text-base font-black">Chuyển khoản để xác nhận đơn</h3>
            <dl className="mt-2 space-y-1">
              <Row k="Ngân hàng" v={order.bank!.bankId} />
              <Row k="Số tài khoản" v={order.bank!.accountNo} />
              <Row k="Chủ tài khoản" v={order.bank!.accountName} />
              <Row k="Số tiền" v={formatVND(order.total)} />
              <Row k="Nội dung" v={order.code} />
            </dl>
            <p className="mt-2 text-xs text-ink/60">Quét mã bằng app ngân hàng – số tiền và nội dung được điền sẵn.</p>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black">Đơn {order.code}</h3>
          <span className="text-xs text-ink/60">{formatDateTimeVN(order.createdAt)}</span>
        </div>
        {order.status === "CANCELLED" ? (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm font-bold text-red-700">Đơn đã huỷ</p>
        ) : (
          <ol className="mt-4 grid grid-cols-6 gap-1">
            {FLOW.map((s, i) => (
              <li key={s} className="text-center">
                <span className={`mx-auto block h-2 rounded-full ${i <= step ? "bg-brand" : "bg-ink/10"}`} />
                <span className={`mt-1 block text-[10px] leading-tight sm:text-xs ${i === step ? "font-extrabold" : "text-ink/60"}`}>{ORDER_STATUS_LABEL[s]}</span>
              </li>
            ))}
          </ol>
        )}
        {order.trackingCode && (
          <p className="mt-3 text-sm">
            Mã vận đơn: <b>{order.trackingCode}</b>
          </p>
        )}
        <OrderItems items={order.items} />
        <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
          {order.isQuote ? (
            <Row k="Loại" v="Yêu cầu báo giá – nhân viên sẽ gửi báo giá qua Zalo/điện thoại" />
          ) : (
            <>
              <Row k="Tạm tính" v={formatVND(order.subtotal)} />
              <Row k="Vận chuyển" v={order.shippingFee ? formatVND(order.shippingFee) : "Miễn phí"} />
              <Row k="Tổng cộng" v={formatVND(order.total)} strong />
              <Row k="Thanh toán" v={`${PAYMENT_METHOD_LABEL[order.paymentMethod]} – ${PAYMENT_STATUS_LABEL[order.paymentStatus]}`} />
              <Row k="Giao tới" v={`${order.customerName}, ${order.addressLine}, ${order.ward}, ${order.province}`} />
            </>
          )}
        </dl>
      </section>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/60">{k}</dt>
      <dd className={`text-right ${strong ? "text-lg font-black" : "font-semibold"}`}>{v}</dd>
    </div>
  );
}
