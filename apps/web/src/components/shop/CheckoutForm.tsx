"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  formatVND,
  orderCreateSchema,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  PROVINCES,
  shippingOptions,
  type Address,
  type LandingSettings,
  type PaymentMethod,
  type ShippingOption,
} from "@pod/shared";
import { useCart } from "@/lib/cart";
import { assetUrl } from "@/lib/config";
import { apiFetch } from "@/lib/client-api";
import { readUtm, track } from "@/lib/track";

type Form = {
  customerName: string;
  phone: string;
  email: string;
  province: string;
  ward: string;
  addressLine: string;
  note: string;
  paymentMethod: PaymentMethod;
};

export const LAST_ORDER_KEY = "pod_last_order";

export function CheckoutForm({ shipping }: { shipping: LandingSettings["shipping"] }) {
  const cart = useCart();
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    customerName: "",
    phone: "",
    email: "",
    province: "",
    ward: "",
    addressLine: "",
    note: "",
    paymentMethod: "COD",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "items", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [shipOpts, setShipOpts] = useState<ShippingOption[] | null>(null);
  const [shipMethod, setShipMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Chưa chọn tỉnh: ước tính theo cấu hình (đồng giá); đã chọn tỉnh: hỏi server theo cân nặng + vùng
  const fallback = shipping.mode === "flat" ? shippingOptions(shipping, { province: "", weightGram: 0, subtotal: cart.subtotal }) : null;
  const opts = shipOpts ?? fallback;
  const chosen = opts?.find((o) => o.method === shipMethod) ?? opts?.[0] ?? null;
  const fee = chosen?.fee ?? 0;
  const total = cart.subtotal + fee;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const itemsKey = cart.items.map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`).join("|");
  useEffect(() => {
    if (!form.province || !cart.items.length) return setShipOpts(null);
    const ctrl = new AbortController();
    fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        province: form.province,
        subtotal: cart.subtotal,
        items: cart.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { options: ShippingOption[] } | null) => d && setShipOpts(d.options))
      .catch(() => undefined);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.province, itemsKey, cart.subtotal]);

  // Khách đã đăng nhập: điền sẵn thông tin + sổ địa chỉ
  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { name: string; phone: string; email: string; addresses: Address[] } | null) => {
        if (!me) return;
        setAddresses(me.addresses ?? []);
        const def = me.addresses?.find((a) => a.isDefault) ?? me.addresses?.[0];
        setForm((f) => ({
          ...f,
          customerName: f.customerName || def?.name || me.name,
          phone: f.phone || def?.phone || me.phone,
          email: f.email || me.email,
          province: f.province || def?.province || "",
          ward: f.ward || def?.ward || "",
          addressLine: f.addressLine || def?.addressLine || "",
        }));
      })
      .catch(() => undefined);
  }, []);

  if (!cart.ready) return <p className="py-10 text-center text-ink/60">Đang tải...</p>;
  if (!cart.items.length)
    return (
      <div className="py-16 text-center">
        <p className="text-ink/70">Giỏ hàng trống.</p>
        <Link href="/san-pham" className="btn-primary mt-4">
          Chọn sản phẩm
        </Link>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const payload = {
      ...form,
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        designUrl: i.design ? "" : i.designUrl,
        design: i.design,
        printMode: i.printMode,
        designNote: i.designNote,
        roster: i.roster?.length ? i.roster : undefined,
      })),
      shippingMethod: chosen?.method ?? "STANDARD",
      utm: readUtm(),
    };
    const parsed = orderCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof typeof errors;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      document.querySelector("[data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitting(true);
    track.beginCheckout(
      total,
      cart.items.map((i) => ({ id: i.productId, name: i.name, price: cart.unitPrice(i), quantity: i.quantity })),
    );
    try {
      const order = await apiFetch<{ code: string; total: number }>("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      track.purchase(order.code, order.total);
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ code: order.code, phone: parsed.data.phone }));
      } catch {
        /* ignore */
      }
      cart.clear();
      router.push(`/don-hang/${order.code}`);
    } catch (err) {
      setServerError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 grid gap-6 md:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <fieldset className="rounded-lg border-2 border-ink bg-white p-4">
          <legend className="px-1 font-extrabold">Người nhận</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Họ và tên *" error={errors.customerName}>
              <input className="input" autoComplete="name" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </Field>
            <Field label="Số điện thoại *" error={errors.phone}>
              <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email (nhận xác nhận đơn)" error={errors.email} className="sm:col-span-2">
              <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border-2 border-ink bg-white p-4">
          <legend className="px-1 font-extrabold">Địa chỉ giao hàng</legend>
          {addresses.length > 0 && (
            <label className="mb-3 block">
              <span className="label">Chọn từ sổ địa chỉ</span>
              <select
                className="input"
                defaultValue=""
                onChange={(e) => {
                  const a = addresses[Number(e.target.value)];
                  if (a) setForm((f) => ({ ...f, customerName: a.name, phone: a.phone, province: a.province, ward: a.ward, addressLine: a.addressLine }));
                }}
              >
                <option value="">-- Địa chỉ đã lưu --</option>
                {addresses.map((a, i) => (
                  <option key={i} value={i}>
                    {a.label ? `${a.label}: ` : ""}
                    {a.name} · {a.addressLine}, {a.ward}, {a.province}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tỉnh / Thành phố *" error={errors.province}>
              <select className="input" value={form.province} onChange={(e) => set("province", e.target.value)}>
                <option value="">-- Chọn tỉnh/thành --</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phường / Xã *" error={errors.ward}>
              <input className="input" placeholder="VD: Phường Bến Thành" value={form.ward} onChange={(e) => set("ward", e.target.value)} />
            </Field>
            <Field label="Số nhà, tên đường *" error={errors.addressLine} className="sm:col-span-2">
              <input className="input" autoComplete="street-address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </Field>
            <Field label="Ghi chú cho shop" className="sm:col-span-2">
              <textarea className="input" rows={2} placeholder="Thời gian nhận hàng, yêu cầu thêm..." value={form.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-ink/60">Địa chỉ theo đơn vị hành chính mới (Tỉnh/Thành → Phường/Xã).</p>
        </fieldset>

        <fieldset className="rounded-lg border-2 border-ink bg-white p-4">
          <legend className="px-1 font-extrabold">Giao hàng</legend>
          {!opts ? (
            <p className="text-sm text-ink/60">Chọn tỉnh/thành để xem phí và thời gian giao.</p>
          ) : (
            <div className="space-y-2">
              {opts.map((o) => (
                <label key={o.method} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 ${chosen?.method === o.method ? "border-ink bg-cream" : "border-ink/15"}`}>
                  <input type="radio" name="ship" className="accent-[#F08A00]" checked={chosen?.method === o.method} onChange={() => setShipMethod(o.method)} />
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{o.label}</span>
                    <span className="text-xs text-ink/60">
                      {o.days ? `Giao ${o.days} sau khi sản xuất xong` : "Giao toàn quốc"}
                      {shipping.productionDays ? ` · sản xuất ${shipping.productionDays}` : ""}
                    </span>
                  </span>
                  <span className="text-sm font-extrabold">{o.fee ? formatVND(o.fee) : "Miễn phí"}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="rounded-lg border-2 border-ink bg-white p-4">
          <legend className="px-1 font-extrabold">Thanh toán</legend>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m} className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 ${form.paymentMethod === m ? "border-ink bg-cream" : "border-ink/15"}`}>
                <input type="radio" name="pm" className="mt-1 accent-[#F08A00]" checked={form.paymentMethod === m} onChange={() => set("paymentMethod", m)} />
                <span>
                  <span className="block text-sm font-bold">{PAYMENT_METHOD_LABEL[m]}</span>
                  <span className="text-xs text-ink/60">
                    {m === "COD" ? "Kiểm tra hàng rồi thanh toán cho shipper." : "Quét mã VietQR sau khi đặt – nội dung CK là mã đơn, xác nhận nhanh hơn."}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-lg border-2 border-ink bg-cream p-4 md:sticky md:top-20">
        <h2 className="font-extrabold">Đơn hàng ({cart.count} sản phẩm)</h2>
        <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          {cart.items.map((i) => (
            <li key={i.key} className="flex gap-3">
              <img src={assetUrl(i.image)} alt="" className="h-14 w-14 shrink-0 rounded border border-ink/20 bg-white object-contain" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-1 font-semibold">{i.name}</p>
                <p className="text-xs text-ink/60">
                  {[i.color && i.color !== "Theo thiết kế" ? i.color : "", i.size].filter(Boolean).join(" / ")} × {i.quantity}
                  {i.design ? ` · ${i.design.files.length} mặt in` : ""}
                </p>
              </div>
              <p className="text-sm font-bold">{formatVND(cart.lineTotal(i))}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-ink/15 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Tạm tính</dt>
            <dd className="font-semibold">{formatVND(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Phí vận chuyển</dt>
            <dd className="font-semibold">{!opts ? "—" : fee ? formatVND(fee) : "Miễn phí"}</dd>
          </div>
          {chosen?.method === "STANDARD" && fee > 0 && shipping.freeThreshold > cart.subtotal && (
            <p className="text-xs text-green-700">Mua thêm {formatVND(shipping.freeThreshold - cart.subtotal)} để được miễn phí giao tiêu chuẩn.</p>
          )}
          {!opts && <p className="text-xs text-ink/60">Phí ship hiển thị khi chọn tỉnh/thành.</p>}
          <div className="flex justify-between border-t border-ink/15 pt-2 text-base">
            <dt className="font-extrabold">Tổng cộng</dt>
            <dd className="text-xl font-black">{formatVND(total)}</dd>
          </div>
        </dl>
        {serverError && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{serverError}</p>}
        <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full py-3 text-base">
          {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
        </button>
        <p className="mt-2 text-center text-xs text-ink/60">Shop sẽ gọi/Zalo xác nhận & gửi mockup trước khi in.</p>
      </aside>
    </form>
  );
}

function Field({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`} data-error={error ? "true" : undefined}>
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}
