"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTimeVN, formatVND, LEAD_STATUS_LABEL, LEAD_STATUSES, SELLER_CHANNEL_LABEL, SELLER_STATUS_LABEL, SELLER_STATUSES } from "@pod/shared";
import { cancelBatchAction, markBatchPaidAction, resetCustomerPasswordAction, setCustomerActiveAction, updateLeadAction, updateSellerAction } from "@/lib/actions";

const zalo = (phone: string) => `https://zalo.me/${phone.replace(/^0/, "84")}`;

/* ================== Lead ================== */
export type AdminLead = { id: string; name: string; phone: string; topic: string; message: string; pageUrl: string; status: string; adminNote: string; createdAt: string };

export function LeadRow({ lead }: { lead: AdminLead }) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [note, setNote] = useState(lead.adminNote);
  const [pending, start] = useTransition();
  const dirty = status !== lead.status || note !== lead.adminNote;
  return (
    <tr className={lead.status === "NEW" ? "bg-amber-50/60" : ""}>
      <td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTimeVN(lead.createdAt)}</td>
      <td>
        <p className="font-semibold">{lead.name}</p>
        <a href={`tel:${lead.phone}`} className="text-xs text-brand-dark">
          {lead.phone}
        </a>{" "}
        ·{" "}
        <a href={zalo(lead.phone)} target="_blank" rel="noreferrer" className="text-xs text-sky-600">
          Zalo
        </a>
      </td>
      <td className="text-xs font-semibold">{lead.topic}</td>
      <td className="max-w-[280px] text-xs">
        {lead.message || <span className="text-neutral-400">—</span>}
        {lead.pageUrl && <span className="block truncate text-neutral-400">{lead.pageUrl}</span>}
      </td>
      <td>
        <select className="input h-8 w-32 px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Trạng thái">
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input className="input h-8 w-44 px-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú" aria-label="Ghi chú" />
      </td>
      <td>
        <button
          className="btn-primary px-3 py-1 text-xs"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              await updateLeadAction(lead.id, { status, adminNote: note });
              router.refresh();
            })
          }
        >
          Lưu
        </button>
      </td>
    </tr>
  );
}

/* ================== Khách hàng ================== */
export type AdminCustomer = {
  id: string;
  phone: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  seller: { status: string } | null;
  _count: { orders: number; designs: number };
};

export function CustomerRow({ c }: { c: AdminCustomer }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [temp, setTemp] = useState("");
  return (
    <tr className={c.isActive ? "" : "opacity-50"}>
      <td>
        <p className="font-semibold">{c.name}</p>
        <p className="text-xs text-neutral-500">{c.email}</p>
      </td>
      <td>
        <a href={`tel:${c.phone}`} className="text-brand-dark">
          {c.phone}
        </a>
      </td>
      <td>{c._count.orders}</td>
      <td>{c._count.designs}</td>
      <td className="text-xs">{c.seller ? SELLER_STATUS_LABEL[c.seller.status as keyof typeof SELLER_STATUS_LABEL] ?? c.seller.status : "—"}</td>
      <td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTimeVN(c.createdAt)}</td>
      <td className="whitespace-nowrap text-right">
        {temp ? (
          <span className="rounded bg-green-50 px-2 py-1 font-mono text-xs text-green-800" title="Gửi cho khách qua Zalo, khách đổi lại sau khi đăng nhập">
            MK tạm: {temp}
          </span>
        ) : (
          <button
            className="btn-ghost px-2 py-1 text-xs"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Cấp mật khẩu tạm cho ${c.name}? Mật khẩu cũ sẽ không dùng được nữa.`)) return;
              start(async () => {
                const r = await resetCustomerPasswordAction(c.id);
                if (r.ok) setTemp(r.tempPassword);
                else alert(r.error);
              });
            }}
          >
            Cấp MK tạm
          </button>
        )}{" "}
        <button
          className={`${c.isActive ? "btn-danger" : "btn-ghost"} px-2 py-1 text-xs`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setCustomerActiveAction(c.id, !c.isActive);
              router.refresh();
            })
          }
        >
          {c.isActive ? "Khoá" : "Mở khoá"}
        </button>
      </td>
    </tr>
  );
}

/* ================== Seller ================== */
export type AdminSeller = {
  customerId: string;
  status: string;
  companyName: string;
  taxCode: string;
  storeUrl: string;
  channels: string;
  discountPercent: number;
  brandName: string;
  adminNote: string;
  createdAt: string;
  customer: { id: string; name: string; phone: string; email: string; _count: { sellerOrders: number; templates: number } };
};

export function SellerCard({ s }: { s: AdminSeller }) {
  const router = useRouter();
  const [status, setStatus] = useState(s.status);
  const [discount, setDiscount] = useState(s.discountPercent);
  const [note, setNote] = useState(s.adminNote);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const channels = s.channels.split(",").filter(Boolean).map((c) => SELLER_CHANNEL_LABEL[c as keyof typeof SELLER_CHANNEL_LABEL] ?? c);
  return (
    <div className={`card space-y-2 ${s.status === "PENDING" ? "ring-2 ring-amber-300" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">
            {s.brandName || s.companyName || s.customer.name}{" "}
            <span className="text-xs font-normal text-neutral-500">
              · {s.customer.name} ·{" "}
              <a href={zalo(s.customer.phone)} target="_blank" rel="noreferrer" className="text-sky-600">
                {s.customer.phone}
              </a>
            </span>
          </p>
          <p className="text-xs text-neutral-500">
            {s.companyName && `${s.companyName} · `}
            {s.taxCode && `MST ${s.taxCode} · `}
            Kênh: {channels.join(", ") || "—"} · Đăng ký {formatDateTimeVN(s.createdAt)}
          </p>
          {s.storeUrl && (
            <a href={s.storeUrl} target="_blank" rel="noreferrer noopener" className="text-xs text-brand-dark underline">
              {s.storeUrl}
            </a>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {s.customer._count.sellerOrders} đơn ·{" "}
          <Link href={`/orders?type=seller&sellerId=${s.customerId}`} className="underline">
            xem đơn
          </Link>{" "}
          · {s.customer._count.templates} mẫu
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block text-xs">
          <span className="label">Trạng thái</span>
          <select className="input h-9 w-40 px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {SELLER_STATUSES.map((x) => (
              <option key={x} value={x}>
                {SELLER_STATUS_LABEL[x]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="label">Chiết khấu (%)</span>
          <input className="input h-9 w-24 px-2 text-sm" inputMode="numeric" value={discount} onChange={(e) => setDiscount(Math.min(60, Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0)))} />
        </label>
        <label className="block min-w-[200px] flex-1 text-xs">
          <span className="label">Ghi chú nội bộ</span>
          <input className="input h-9 px-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button
          className="btn-primary h-9"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await updateSellerAction(s.customerId, { status, discountPercent: discount, adminNote: note });
              setMsg(r.ok ? "✓ Đã lưu" : r.error);
              router.refresh();
            })
          }
        >
          {s.status === "PENDING" && status === "APPROVED" ? "Duyệt" : "Lưu"}
        </button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
    </div>
  );
}

/* ================== Thanh toán gộp ================== */
export type AdminBatch = {
  id: string;
  code: string;
  total: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  seller: { name: string; phone: string };
  orders: { id: string; code: string; total: number; status: string; paymentStatus: string }[];
};

export function BatchCard({ b }: { b: AdminBatch }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const tone = b.status === "PAID" ? "bg-green-100 text-green-800" : b.status === "UNPAID" ? "bg-amber-100 text-amber-800" : "bg-neutral-200 text-neutral-600";
  return (
    <div className="card space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono font-bold">{b.code}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{b.status === "PAID" ? "Đã nhận tiền" : b.status === "UNPAID" ? "Chờ chuyển khoản" : "Đã huỷ"}</span>
        <p className="text-sm">
          {b.seller.name} · {b.seller.phone}
        </p>
        <p className="ml-auto text-lg font-black">{formatVND(b.total)}</p>
      </div>
      <p className="text-xs text-neutral-500">
        Tạo {formatDateTimeVN(b.createdAt)}
        {b.paidAt ? ` · Nhận tiền ${formatDateTimeVN(b.paidAt)}` : ""} · Nội dung CK cần có mã <b>{b.code}</b>
      </p>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {b.orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="rounded border px-1.5 py-0.5 hover:border-neutral-400">
            {o.code} · {formatVND(o.total)}
          </Link>
        ))}
      </div>
      {b.status === "UNPAID" && (
        <div className="flex gap-2">
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Xác nhận đã nhận ${formatVND(b.total)} cho ${b.code}? Tất cả ${b.orders.length} đơn sẽ chuyển "Đã thanh toán".`)) return;
              start(async () => {
                const r = await markBatchPaidAction(b.id);
                if (!r.ok) setErr(r.error);
                router.refresh();
              });
            }}
          >
            Đã nhận tiền
          </button>
          <button
            className="btn-ghost"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await cancelBatchAction(b.id);
                if (!r.ok) setErr(r.error);
                router.refresh();
              })
            }
          >
            Huỷ lần thanh toán
          </button>
          {err && <span className="text-sm text-red-700">{err}</span>}
        </div>
      )}
    </div>
  );
}
