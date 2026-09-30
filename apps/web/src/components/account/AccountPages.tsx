"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addressSchema,
  formatDateTimeVN,
  formatDateVN,
  formatVND,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PROVINCES,
  SELLER_CHANNEL_LABEL,
  SELLER_CHANNELS,
  SELLER_STATUS_LABEL,
  type Address,
  type OrderStatus,
  type PaymentStatus,
} from "@pod/shared";
import { api } from "@/lib/account";
import { useCart } from "@/lib/cart";
import { assetUrl } from "@/lib/config";
import { buildReorder } from "@/lib/reorder";
import type { OrderView } from "@/lib/types";
import { OrderItems } from "../shop/OrderItems";
import { useAccount } from "./AccountShell";

type OrderRow = { code: string; status: OrderStatus; paymentStatus: PaymentStatus; total: number; isQuote: boolean; createdAt: string; items: { productName: string; productImg: string; quantity: number }[] };

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`rounded-xl border-2 border-ink/10 bg-white p-4 md:p-5 ${className}`}>{children}</section>;

/* ================== Tổng quan ================== */
export function AccountOverview() {
  const { me } = useAccount();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [claim, setClaim] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => api<{ items: OrderRow[] }>("/account/orders?pageSize=5").then((r) => setOrders(r.items)).catch(() => setOrders([]));
  useEffect(() => void load(), []);

  async function doClaim(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/account/orders/claim", { method: "POST", json: { code: claim } });
      setMsg({ ok: true, text: "✓ Đã thêm đơn vào tài khoản" });
      setClaim("");
      void load();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["/tai-khoan/don-hang", "Đơn hàng", "Theo dõi, đặt lại"],
          ["/tai-khoan/thiet-ke", "Thiết kế của tôi", "Mở lại, chỉnh sửa"],
          ["/tai-khoan/dia-chi", "Sổ địa chỉ", `${me.addresses.length}/5 địa chỉ`],
        ].map(([href, t, sub]) => (
          <Link key={href} href={href!} className="rounded-xl border border-line bg-brand p-4 shadow-hard transition hover:-translate-y-0.5">
            <p className="font-black">{t} →</p>
            <p className="text-sm text-ink/70">{sub}</p>
          </Link>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold">Đơn gần đây</h2>
          <Link href="/tai-khoan/don-hang" className="text-sm font-bold underline">
            Tất cả
          </Link>
        </div>
        <OrderList orders={orders} />
      </Card>
      <Card>
        <h2 className="font-extrabold">Thêm đơn đã đặt trước khi có tài khoản</h2>
        <p className="text-sm text-ink/60">Nhập mã đơn (đơn phải đặt bằng SĐT {me.phone}).</p>
        <form onSubmit={doClaim} className="mt-2 flex gap-2">
          <input className="input max-w-xs uppercase" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="VD: POD260929ABCD" aria-label="Mã đơn" />
          <button className="btn-outline px-4" disabled={claim.trim().length < 4}>
            Thêm
          </button>
        </form>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      </Card>
    </div>
  );
}

function OrderList({ orders }: { orders: OrderRow[] | null }) {
  if (!orders) return <p className="py-4 text-sm text-ink/60">Đang tải…</p>;
  if (!orders.length)
    return (
      <p className="py-4 text-sm text-ink/60">
        Chưa có đơn nào.{" "}
        <Link href="/san-pham" className="font-bold underline">
          Chọn sản phẩm
        </Link>
      </p>
    );
  return (
    <ul className="mt-2 divide-y divide-ink/10">
      {orders.map((o) => (
        <li key={o.code}>
          <Link href={`/tai-khoan/don-hang/${o.code}`} className="flex items-center gap-3 py-3 hover:bg-cream/50">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((it, i) => (
                <img key={i} src={assetUrl(it.productImg)} alt="" className="h-11 w-11 rounded border-2 border-white bg-white object-contain shadow-sm" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {o.code} {o.isQuote && <span className="ml-1 whitespace-nowrap rounded bg-navy px-1.5 py-0.5 text-[10px] text-white">BÁO GIÁ</span>}
              </p>
              <p className="truncate text-xs text-ink/60">
                {formatDateVN(o.createdAt)} · {o.items.map((i) => i.productName).join(", ")}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-black">{o.isQuote ? "Chờ báo giá" : formatVND(o.total)}</p>
              <p className="text-xs text-ink/60">{ORDER_STATUS_LABEL[o.status]}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ================== Đơn hàng ================== */
export function AccountOrders() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    api<{ items: OrderRow[]; total: number }>(`/account/orders?page=${page}`)
      .then((r) => {
        setOrders(r.items);
        setTotal(r.total);
      })
      .catch(() => setOrders([]));
  }, [page]);
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <Card>
      <h2 className="font-extrabold">Đơn hàng ({total})</h2>
      <OrderList orders={orders} />
      {pages > 1 && (
        <div className="mt-3 flex gap-2">
          <button className="btn-outline px-3 py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Trước
          </button>
          <span className="self-center text-sm">
            {page}/{pages}
          </span>
          <button className="btn-outline px-3 py-1.5" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Sau →
          </button>
        </div>
      )}
    </Card>
  );
}

export function AccountOrderDetail({ code }: { code: string }) {
  const router = useRouter();
  const cart = useCart();
  const [o, setO] = useState<OrderView | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    api<OrderView>(`/account/orders/${encodeURIComponent(code)}`)
      .then(setO)
      .catch((e) => setErr((e as Error).message));
  }, [code]);

  async function reorder() {
    if (!o) return;
    setBusy(true);
    setNote("");
    try {
      const r = await buildReorder(o.items);
      for (const l of r.lines) cart.add(l);
      if (r.skipped.length) setNote(`Không thêm được: ${r.skipped.join(", ")}`);
      if (r.lines.length) router.push("/gio-hang");
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (err) return <Card>{err}</Card>;
  if (!o) return <Card>Đang tải…</Card>;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href="/tai-khoan/don-hang" className="text-sm underline">
            ← Đơn hàng
          </Link>
          <h2 className="mt-1 text-xl font-black">
            {o.code} {o.isQuote && <span className="ml-1 rounded bg-navy px-1.5 py-0.5 align-middle text-[11px] text-white">BÁO GIÁ</span>}
          </h2>
          <p className="text-sm text-ink/60">
            {formatDateTimeVN(o.createdAt)} · {ORDER_STATUS_LABEL[o.status]}
            {!o.isQuote && ` · ${PAYMENT_STATUS_LABEL[o.paymentStatus]}`}
          </p>
          {o.trackingCode && <p className="text-sm">Mã vận đơn: <b>{o.trackingCode}</b></p>}
        </div>
        {!o.isQuote && (
          <button type="button" onClick={reorder} disabled={busy} className="btn-primary px-5">
            {busy ? "Đang thêm…" : "Đặt lại đơn này"}
          </button>
        )}
      </div>
      {note && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">{note}</p>}
      <OrderItems items={o.items} />
      {!o.isQuote && (
        <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">Tạm tính</dt>
            <dd>{formatVND(o.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60">Vận chuyển</dt>
            <dd>{o.shippingFee ? formatVND(o.shippingFee) : "Miễn phí"}</dd>
          </div>
          <div className="flex justify-between text-base font-black">
            <dt>Tổng</dt>
            <dd>{formatVND(o.total)}</dd>
          </div>
          <p className="pt-1 text-ink/70">
            Giao tới: {o.customerName}, {o.addressLine}, {o.ward}, {o.province}
          </p>
          <Link href={`/don-hang/${o.code}`} className="inline-block pt-1 font-bold underline">
            Trang theo dõi đơn / mã VietQR
          </Link>
        </dl>
      )}
    </Card>
  );
}

/* ================== Thiết kế đã lưu ================== */
type SavedRow = { id: string; name: string; previewUrl: string; updatedAt: string; product: { id: string; name: string; slug: string; images: string[]; isActive: boolean } };

export function AccountDesigns() {
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const load = () => api<SavedRow[]>("/account/designs").then(setRows).catch(() => setRows([]));
  useEffect(() => void load(), []);
  async function remove(id: string, name: string) {
    if (!confirm(`Xoá thiết kế "${name}"?`)) return;
    await api(`/account/designs/${id}`, { method: "DELETE" }).catch(() => undefined);
    void load();
  }
  return (
    <Card>
      <h2 className="font-extrabold">Thiết kế của tôi</h2>
      <p className="text-sm text-ink/60">Trong YALA Studio bấm &quot;Lưu&quot; để lưu vào đây, mở lại bất kỳ lúc nào để chỉnh hoặc đặt thêm.</p>
      {!rows ? (
        <p className="py-4 text-sm text-ink/60">Đang tải…</p>
      ) : !rows.length ? (
        <p className="py-4 text-sm text-ink/60">
          Chưa có thiết kế nào.{" "}
          <Link href="/san-pham" className="font-bold underline">
            Chọn sản phẩm để thiết kế
          </Link>
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((d) => (
            <li key={d.id} className="overflow-hidden rounded-lg border-2 border-ink/10">
              <img src={assetUrl(d.previewUrl || d.product.images[0])} alt={d.name} className="aspect-square w-full bg-white object-contain" />
              <div className="p-2">
                <p className="line-clamp-1 text-sm font-bold">{d.name}</p>
                <p className="line-clamp-1 text-xs text-ink/60">{d.product.name}</p>
                <p className="text-[11px] text-ink/50">{formatDateVN(d.updatedAt)}</p>
                <div className="mt-2 flex gap-1.5 text-xs">
                  {d.product.isActive ? (
                    <Link href={`/thiet-ke/${d.product.slug}?saved=${d.id}`} className="btn flex-1 border-ink bg-brand px-2 py-1.5 text-xs">
                      Mở & đặt
                    </Link>
                  ) : (
                    <span className="flex-1 text-ink/50">Sản phẩm ngừng bán</span>
                  )}
                  <button type="button" onClick={() => remove(d.id, d.name)} className="btn border-ink/20 bg-white px-2 py-1.5 text-xs text-red-600">
                    Xoá
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ================== Sổ địa chỉ ================== */
const blank = (name: string, phone: string): Address => ({ label: "", name, phone, province: "TP. Hồ Chí Minh", ward: "", addressLine: "", isDefault: false });

export function AccountAddresses() {
  const { me, reload } = useAccount();
  const [list, setList] = useState<Address[]>(me.addresses);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const patch = (i: number, p: Partial<Address>) => setList((l) => l.map((a, k) => (k === i ? { ...a, ...p } : p.isDefault ? { ...a, isDefault: false } : a)));

  async function save() {
    setMsg(null);
    for (const [i, a] of list.entries()) {
      const r = addressSchema.safeParse(a);
      if (!r.success) return setMsg({ ok: false, text: `Địa chỉ ${i + 1}: ${r.error.issues[0]?.message}` });
    }
    try {
      await api("/account/addresses", { method: "PUT", json: { addresses: list } });
      await reload();
      setMsg({ ok: true, text: "✓ Đã lưu sổ địa chỉ" });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  return (
    <Card>
      <h2 className="font-extrabold">Sổ địa chỉ</h2>
      <p className="text-sm text-ink/60">Địa chỉ mặc định tự điền khi thanh toán. Tối đa 5 địa chỉ.</p>
      <ul className="mt-3 space-y-3">
        {list.map((a, i) => (
          <li key={i} className="grid gap-2 rounded-lg border-2 border-ink/10 p-3 sm:grid-cols-2">
            <input className="input" value={a.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Tên gợi nhớ (Nhà, Công ty…)" aria-label="Tên gợi nhớ" />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="radio" name="def" checked={a.isDefault} onChange={() => patch(i, { isDefault: true })} className="accent-[#F08A00]" /> Mặc định
            </label>
            <input className="input" value={a.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="Người nhận" aria-label="Người nhận" />
            <input className="input" value={a.phone} onChange={(e) => patch(i, { phone: e.target.value })} placeholder="SĐT" aria-label="SĐT" />
            <select className="input" value={a.province} onChange={(e) => patch(i, { province: e.target.value as Address["province"] })} aria-label="Tỉnh/thành">
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input className="input" value={a.ward} onChange={(e) => patch(i, { ward: e.target.value })} placeholder="Phường/Xã" aria-label="Phường/Xã" />
            <input className="input sm:col-span-2" value={a.addressLine} onChange={(e) => patch(i, { addressLine: e.target.value })} placeholder="Số nhà, tên đường" aria-label="Địa chỉ" />
            <button type="button" className="justify-self-start text-sm text-red-600 underline" onClick={() => setList((l) => l.filter((_, k) => k !== i))}>
              Xoá địa chỉ
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {list.length < 5 && (
          <button type="button" className="btn-outline px-4 py-2" onClick={() => setList((l) => [...l, { ...blank(me.name, me.phone), isDefault: l.length === 0 }])}>
            + Thêm địa chỉ
          </button>
        )}
        <button type="button" className="btn-primary px-5 py-2" onClick={save}>
          Lưu
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </Card>
  );
}

/* ================== Thông tin & mật khẩu ================== */
export function AccountSecurity() {
  const { me, reload } = useAccount();
  const [p, setP] = useState({ name: me.name, email: me.email });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-extrabold">Thông tin</h2>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/account/profile", { method: "PUT", json: p });
              await reload();
              setM1("✓ Đã lưu");
            } catch (err) {
              setM1((err as Error).message);
            }
          }}
        >
          <label className="block">
            <span className="label">Họ tên</span>
            <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
          </label>
          <p className="text-sm text-ink/60 sm:col-span-2">Số điện thoại đăng nhập: {me.phone}</p>
          <div className="flex items-center gap-2">
            <button className="btn-primary px-5 py-2">Lưu</button>
            <span className="text-sm">{m1}</span>
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="font-extrabold">Đổi mật khẩu</h2>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/account/password", { method: "PUT", json: pw });
              setPw({ current: "", next: "" });
              setM2("✓ Đã đổi mật khẩu");
            } catch (err) {
              setM2((err as Error).message);
            }
          }}
        >
          <label className="block">
            <span className="label">Mật khẩu hiện tại</span>
            <input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Mật khẩu mới (≥ 8 ký tự)</span>
            <input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </label>
          <div className="flex items-center gap-2">
            <button className="btn-primary px-5 py-2" disabled={pw.next.length < 8 || !pw.current}>
              Đổi mật khẩu
            </button>
            <span className="text-sm">{m2}</span>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ================== Đăng ký seller ================== */
export function SellerApply() {
  const { me, reload } = useAccount();
  const [f, setF] = useState({ companyName: "", taxCode: "", storeUrl: "", brandName: "", channels: [] as string[] });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const s = me.seller;
  if (s && s.status !== "REJECTED")
    return (
      <Card>
        <h2 className="font-extrabold">Tài khoản seller: {SELLER_STATUS_LABEL[s.status as keyof typeof SELLER_STATUS_LABEL] ?? s.status}</h2>
        {s.status === "APPROVED" ? (
          <>
            <p className="mt-1 text-sm">
              Chiết khấu của bạn: <b>{s.discountPercent}%</b> trên giá bán lẻ.
            </p>
            <Link href="/seller" className="btn mt-3 border-violet-700 bg-violet-700 px-5 py-2 text-white">
              Vào khu seller →
            </Link>
          </>
        ) : s.status === "PENDING" ? (
          <p className="mt-1 text-sm text-ink/70">Chúng tôi đang xem hồ sơ và sẽ liên hệ qua Zalo/điện thoại {me.phone}.</p>
        ) : (
          <p className="mt-1 text-sm text-ink/70">Tài khoản seller đang tạm khoá – liên hệ hỗ trợ.</p>
        )}
      </Card>
    );
  return (
    <Card>
      <h2 className="font-extrabold">Đăng ký làm seller dropship</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
        <li>Tạo mẫu sản phẩm với thiết kế riêng, không cần ôm hàng</li>
        <li>Tạo đơn tay, nhập CSV hàng loạt hoặc kết nối Open API – giao thẳng cho khách của bạn</li>
        <li>Đóng gói theo thương hiệu của bạn, thu hộ COD, thanh toán gộp nhiều đơn</li>
      </ul>
      {s?.status === "REJECTED" && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm">Hồ sơ trước chưa được duyệt – bạn có thể cập nhật và gửi lại.</p>}
      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          try {
            await api("/account/seller/apply", { method: "POST", json: f });
            await reload();
          } catch (err) {
            setMsg({ ok: false, text: (err as Error).message });
          }
        }}
      >
        <label className="block">
          <span className="label">Tên thương hiệu / shop</span>
          <input className="input" value={f.brandName} onChange={(e) => setF({ ...f, brandName: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Link gian hàng (https://…)</span>
          <input className="input" value={f.storeUrl} onChange={(e) => setF({ ...f, storeUrl: e.target.value })} placeholder="https://shopee.vn/..." />
        </label>
        <label className="block">
          <span className="label">Công ty (nếu có)</span>
          <input className="input" value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Mã số thuế (nếu có)</span>
          <input className="input" inputMode="numeric" value={f.taxCode} onChange={(e) => setF({ ...f, taxCode: e.target.value })} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="label">Kênh bán</legend>
          <div className="flex flex-wrap gap-2">
            {SELLER_CHANNELS.map((c) => {
              const on = f.channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setF({ ...f, channels: on ? f.channels.filter((x) => x !== c) : [...f.channels, c] })}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${on ? "border-ink bg-brand" : "border-ink/20"}`}
                  aria-pressed={on}
                >
                  {SELLER_CHANNEL_LABEL[c]}
                </button>
              );
            })}
          </div>
        </fieldset>
        {msg && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{msg.text}</p>}
        <button className="btn-primary px-5 py-2.5 sm:col-span-2 sm:justify-self-start">Gửi đăng ký</button>
      </form>
    </Card>
  );
}
