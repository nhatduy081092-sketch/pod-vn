"use client";
import { useState, useTransition } from "react";
import { ORDER_STATUS_LABEL, ORDER_STATUSES, PAYMENT_STATUS_LABEL, PAYMENT_STATUSES } from "@pod/shared";
import { updateOrderAction } from "@/lib/actions";
import type { AdminOrder } from "@/lib/types";

export function OrderEditor({ order }: { order: AdminOrder }) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [trackingCode, setTracking] = useState(order.trackingCode);
  const [adminNote, setNote] = useState(order.adminNote);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  return (
    <aside className="card h-fit space-y-3 lg:sticky lg:top-4">
      <h2 className="font-bold">Xử lý đơn</h2>
      <label className="block">
        <span className="label">Trạng thái</span>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Thanh toán</span>
        <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Mã vận đơn</span>
        <input className="input" value={trackingCode} onChange={(e) => setTracking(e.target.value)} placeholder="GHN / GHTK..." />
      </label>
      <label className="block">
        <span className="label">Ghi chú nội bộ</span>
        <textarea className="input" rows={3} value={adminNote} onChange={(e) => setNote(e.target.value)} />
      </label>
      {msg && <p className="text-sm">{msg}</p>}
      <button
        className="btn-primary w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await updateOrderAction(order.id, { status, paymentStatus, trackingCode, adminNote });
            setMsg(r.ok ? "✓ Đã lưu" : `✗ ${r.error}`);
          })
        }
      >
        {pending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </aside>
  );
}
