"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  formatDateTimeVN,
  formatVND,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  PAYMENT_STATUS_LABEL,
  PROVINCES,
  SELLER_CSV_COLUMNS,
  sellerCsvTemplate,
  sellerOrderCreateSchema,
  SHIPPING_METHOD_LABEL,
  SHIPPING_METHODS,
  type OrderStatus,
  type PaymentStatus,
} from "@pod/shared";
import { api } from "@/lib/account";
import { assetUrl } from "@/lib/config";
import { vietQrUrl } from "@/lib/vietqr";
import { Box, useSeller } from "./SellerShell";
import { templateCost, type Template } from "./SellerTemplates";

type SOrder = {
  code: string;
  externalId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  phone: string;
  province: string;
  ward: string;
  addressLine: string;
  subtotal: number;
  shippingFee: number;
  shippingMethod: string;
  total: number;
  codAmount: number;
  trackingCode: string;
  whiteLabel: boolean;
  createdAt: string;
  batch: { code: string; status: string } | null;
  items: { productName: string; productImg: string; sku: string; color: string; size: string; quantity: number; unitPrice: number; lineTotal: number; designNote: string }[];
};
type Bank = { bankId: string; accountNo: string; accountName: string };
type NewBatch = { code: string; total: number; bank: Bank };

const payable = (o: SOrder) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED" && !(o.batch && (o.batch.status === "UNPAID" || o.batch.status === "PAID"));

/* ================== Danh sách đơn ================== */
export function SellerOrders() {
  const sp = useSearchParams();
  const router = useRouter();
  const { reload } = useSeller();
  const status = sp.get("status") ?? "";
  const pay = sp.get("pay") ?? "";
  const q = sp.get("q") ?? "";
  const page = Number(sp.get("page") ?? 1) || 1;
  const [data, setData] = useState<{ items: SOrder[]; total: number; pageSize: number } | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [batch, setBatch] = useState<NewBatch | null>(null);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState(q);

  const load = () => {
    const qs = new URLSearchParams({ page: String(page) });
    if (status) qs.set("status", status);
    if (pay) qs.set("pay", pay);
    if (q) qs.set("q", q);
    api<{ items: SOrder[]; total: number; pageSize: number }>(`/seller/orders?${qs}`)
      .then(setData)
      .catch((e) => setErr((e as Error).message));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [status, pay, q, page]);

  const setParam = (k: string, v: string) => {
    const qs = new URLSearchParams(sp.toString());
    if (v) qs.set(k, v);
    else qs.delete(k);
    qs.delete("page");
    setSel(new Set());
    router.replace(`/seller/don?${qs}`);
  };

  const selectable = data?.items.filter(payable) ?? [];
  const selTotal = (data?.items ?? []).filter((o) => sel.has(o.code)).reduce((s, o) => s + o.total, 0);

  async function createBatch() {
    setErr("");
    try {
      const b = await api<NewBatch>("/seller/batches", { method: "POST", json: { codes: [...sel] } });
      setBatch(b);
      setSel(new Set());
      load();
      void reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function cancel(code: string) {
    if (!confirm(`Huỷ đơn ${code}?`)) return;
    await api(`/seller/orders/${code}/cancel`, { method: "POST" }).catch((e) => alert((e as Error).message));
    load();
    void reload();
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-black md:text-2xl">Đơn dropship {data ? `(${data.total})` : ""}</h1>
        <Link href="/seller/nhap-csv" className="btn-outline h-10 px-4">
          Nhập CSV
        </Link>
        <Link href="/seller/don/moi" className="btn-primary h-10 px-4">
          + Tạo đơn
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", search.trim());
          }}
        >
          <input className="input h-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã đơn, mã của bạn, tên, SĐT" aria-label="Tìm đơn" />
        </form>
        <select className="input h-9 w-auto" value={status} onChange={(e) => setParam("status", e.target.value)} aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className="input h-9 w-auto" value={pay} onChange={(e) => setParam("pay", e.target.value)} aria-label="Thanh toán">
          <option value="">Mọi thanh toán</option>
          <option value="unpaid">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
        </select>
      </div>

      {batch && <BatchQr batch={batch} onClose={() => setBatch(null)} />}

      {sel.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-brand p-3 shadow-hard">
          <p className="flex-1 text-sm">
            Đã chọn <b>{sel.size} đơn</b> · <b>{formatVND(selTotal)}</b>
          </p>
          <button type="button" className="btn border-ink bg-ink px-4 py-2 text-white" onClick={createBatch}>
            Thanh toán gộp bằng VietQR
          </button>
        </div>
      )}
      {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      {!data ? (
        <p className="text-sm text-ink/60">Đang tải…</p>
      ) : !data.items.length ? (
        <Box>
          <p className="text-sm text-ink/60">Không có đơn nào.</p>
        </Box>
      ) : (
        <div className="overflow-hidden rounded-xl border-2 border-ink/10 bg-white">
          {selectable.length > 0 && (
            <label className="flex items-center gap-2 border-b border-ink/10 px-3 py-2 text-sm">
              <input type="checkbox" checked={selectable.every((o) => sel.has(o.code))} onChange={(e) => setSel(e.target.checked ? new Set(selectable.map((o) => o.code)) : new Set())} />
              Chọn tất cả đơn chưa thanh toán trên trang
            </label>
          )}
          <ul className="divide-y divide-ink/10">
            {data.items.map((o) => (
              <li key={o.code} className="px-3 py-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    disabled={!payable(o)}
                    checked={sel.has(o.code)}
                    onChange={(e) => {
                      const n = new Set(sel);
                      if (e.target.checked) n.add(o.code);
                      else n.delete(o.code);
                      setSel(n);
                    }}
                    aria-label={`Chọn ${o.code}`}
                  />
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === o.code ? null : o.code)} aria-expanded={open === o.code}>
                    <p className="font-bold">
                      {o.code} {o.externalId && <span className="font-mono text-xs font-normal text-ink/60">#{o.externalId}</span>}
                    </p>
                    <p className="truncate text-xs text-ink/60">
                      {formatDateTimeVN(o.createdAt)} · {o.customerName} · {o.province}
                    </p>
                    <p className="text-xs">
                      <span className="rounded bg-cream px-1.5 py-0.5">{ORDER_STATUS_LABEL[o.status]}</span>{" "}
                      <span className={`rounded px-1.5 py-0.5 ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</span>
                      {o.batch?.status === "UNPAID" && <span className="ml-1 text-ink/60">trong {o.batch.code}</span>}
                      {o.trackingCode && <span className="ml-1">· VĐ {o.trackingCode}</span>}
                    </p>
                  </button>
                  <p className="text-right text-sm font-black">{formatVND(o.total)}</p>
                </div>
                {open === o.code && (
                  <div className="ml-7 mt-2 space-y-2 rounded-lg bg-cream/50 p-3 text-sm">
                    <ul className="space-y-1">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <img src={assetUrl(it.productImg)} alt="" className="h-9 w-9 rounded border border-ink/10 bg-white object-contain" />
                          <span className="flex-1">
                            {it.designNote} · {it.productName} · {[it.color, it.size].filter(Boolean).join(" / ")} × {it.quantity}
                          </span>
                          <span>{formatVND(it.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <p>
                      Giao: {o.customerName} · {o.phone} · {o.addressLine}, {o.ward}, {o.province}
                    </p>
                    <p>
                      Hàng {formatVND(o.subtotal)} · Ship {formatVND(o.shippingFee)} ({SHIPPING_METHOD_LABEL[o.shippingMethod as keyof typeof SHIPPING_METHOD_LABEL] ?? o.shippingMethod})
                      {o.codAmount > 0 && ` · Thu hộ khách ${formatVND(o.codAmount)}`}
                      {o.whiteLabel && " · Đóng gói thương hiệu của bạn"}
                    </p>
                    {o.status === "PENDING" && o.paymentStatus === "UNPAID" && (
                      <button type="button" className="text-sm text-red-600 underline" onClick={() => cancel(o.code)}>
                        Huỷ đơn
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button className="btn-outline px-3 py-1.5" disabled={page <= 1} onClick={() => router.replace(`/seller/don?${new URLSearchParams({ ...Object.fromEntries(sp), page: String(page - 1) })}`)}>
            ← Trước
          </button>
          <span className="text-sm">
            {page}/{pages}
          </span>
          <button className="btn-outline px-3 py-1.5" disabled={page >= pages} onClick={() => router.replace(`/seller/don?${new URLSearchParams({ ...Object.fromEntries(sp), page: String(page + 1) })}`)}>
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}

export function BatchQr({ batch, onClose }: { batch: NewBatch; onClose?: () => void }) {
  const qr = vietQrUrl(batch.bank, batch.total, batch.code);
  return (
    <div className="rounded-xl border-2 border-ink bg-white p-4 shadow-hard md:flex md:gap-5">
      {qr && <img src={qr} alt={`VietQR thanh toán ${batch.code}`} className="mx-auto w-[220px] shrink-0" />}
      <div className="mt-3 text-sm md:mt-0">
        <p className="text-lg font-black">Thanh toán {batch.code}</p>
        <p>
          Số tiền: <b>{formatVND(batch.total)}</b>
        </p>
        <p>
          Nội dung chuyển khoản: <b className="font-mono">{batch.code}</b>
        </p>
        {batch.bank.accountNo && (
          <p>
            {batch.bank.bankId} · {batch.bank.accountNo} · {batch.bank.accountName}
          </p>
        )}
        <p className="mt-2 text-ink/60">Quét mã bằng app ngân hàng. Xưởng xác nhận tiền về thì toàn bộ đơn trong lần này chuyển &quot;Đã thanh toán&quot; và vào sản xuất.</p>
        {onClose && (
          <button type="button" className="btn-outline mt-3 px-4 py-1.5" onClick={onClose}>
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}

/* ================== Tạo đơn tay ================== */
type Line = { template: string; color: string; size: string; quantity: number };

export function SellerOrderNew() {
  const router = useRouter();
  const { ov, reload } = useSeller();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [lines, setLines] = useState<Line[]>([{ template: "", color: "", size: "", quantity: 1 }]);
  const [r, setR] = useState({ name: "", phone: "", province: "TP. Hồ Chí Minh" as (typeof PROVINCES)[number], ward: "", addressLine: "" });
  const [opt, setOpt] = useState({ externalId: "", shippingMethod: "STANDARD" as (typeof SHIPPING_METHODS)[number], codAmount: "", whiteLabel: true, note: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Template[]>("/seller/templates")
      .then((t) => setTemplates(t.filter((x) => x.isActive && x.product.isActive)))
      .catch(() => setTemplates([]));
  }, []);
  const byCode = useMemo(() => new Map((templates ?? []).map((t) => [t.code, t])), [templates]);

  const totalQty = lines.reduce((s, l) => s + (l.template ? l.quantity : 0), 0);
  const estimate = lines.reduce((s, l) => {
    const t = byCode.get(l.template);
    if (!t) return s;
    const v = t.product.variants.find((x) => x.color === l.color && x.size === l.size);
    return s + templateCost(t, ov.profile.discountPercent, v?.priceDelta ?? 0, totalQty) * l.quantity;
  }, 0);

  const patch = (i: number, p: Partial<Line>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...p } : l)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const body = {
      externalId: opt.externalId.trim() || undefined,
      recipient: r,
      items: lines.filter((l) => l.template),
      shippingMethod: opt.shippingMethod,
      codAmount: Number(opt.codAmount || 0),
      whiteLabel: opt.whiteLabel,
      note: opt.note,
    };
    const parsed = sellerOrderCreateSchema.safeParse(body);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Kiểm tra lại thông tin");
    setBusy(true);
    try {
      await api("/seller/orders", { method: "POST", json: parsed.data });
      await reload();
      router.push("/seller/don?pay=unpaid");
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (templates && !templates.length)
    return (
      <Box>
        <p className="text-sm">Cần ít nhất 1 mẫu đang bật để tạo đơn.</p>
        <Link href="/seller/mau" className="btn-primary mt-3 inline-flex px-4 py-2">
          Tạo mẫu
        </Link>
      </Box>
    );

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Box>
          <h2 className="font-extrabold">Sản phẩm</h2>
          <ul className="mt-2 space-y-2">
            {lines.map((l, i) => {
              const t = byCode.get(l.template);
              const colors = t ? [...new Set(t.product.variants.map((v) => v.color))] : [];
              const sizes = t ? [...new Set(t.product.variants.filter((v) => !l.color || v.color === l.color).map((v) => v.size))] : [];
              return (
                <li key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-ink/10 p-2 sm:grid-cols-[2fr_1fr_1fr_80px_auto]">
                  <select
                    className="input col-span-2 sm:col-span-1"
                    value={l.template}
                    onChange={(e) => {
                      const nt = byCode.get(e.target.value);
                      const v0 = nt?.product.variants[0];
                      patch(i, { template: e.target.value, color: v0?.color ?? "", size: v0?.size ?? "" });
                    }}
                    aria-label="Mẫu"
                  >
                    <option value="">— Chọn mẫu —</option>
                    {(templates ?? []).map((x) => (
                      <option key={x.id} value={x.code}>
                        {x.code} · {x.title}
                      </option>
                    ))}
                  </select>
                  <select className="input" value={l.color} onChange={(e) => patch(i, { color: e.target.value, size: t?.product.variants.find((v) => v.color === e.target.value)?.size ?? "" })} disabled={!colors.length} aria-label="Màu">
                    {colors.length ? colors.map((c) => <option key={c}>{c}</option>) : <option value="">—</option>}
                  </select>
                  <select className="input" value={l.size} onChange={(e) => patch(i, { size: e.target.value })} disabled={!sizes.length} aria-label="Size">
                    {sizes.length ? sizes.map((s) => <option key={s}>{s}</option>) : <option value="">—</option>}
                  </select>
                  <input className="input" type="number" min={1} max={1000} value={l.quantity} onChange={(e) => patch(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label="Số lượng" />
                  <button type="button" className="text-sm text-red-600" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, k) => k !== i) : ls))} aria-label="Xoá dòng">
                    Xoá
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="mt-2 text-sm font-bold underline" onClick={() => setLines((ls) => [...ls, { template: "", color: "", size: "", quantity: 1 }])}>
            + Thêm dòng
          </button>
        </Box>
        <Box>
          <h2 className="font-extrabold">Người nhận (khách của bạn)</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Tên người nhận" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} aria-label="Tên người nhận" />
            <input className="input" placeholder="SĐT" inputMode="tel" value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} aria-label="SĐT" />
            <select className="input" value={r.province} onChange={(e) => setR({ ...r, province: e.target.value as typeof r.province })} aria-label="Tỉnh/thành">
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input className="input" placeholder="Phường/Xã" value={r.ward} onChange={(e) => setR({ ...r, ward: e.target.value })} aria-label="Phường/Xã" />
            <input className="input sm:col-span-2" placeholder="Số nhà, tên đường" value={r.addressLine} onChange={(e) => setR({ ...r, addressLine: e.target.value })} aria-label="Địa chỉ" />
          </div>
        </Box>
      </div>
      <div className="space-y-4">
        <Box>
          <h2 className="font-extrabold">Tuỳ chọn</h2>
          <div className="mt-2 space-y-2 text-sm">
            <label className="block">
              <span className="label">Mã đơn của bạn (chống tạo trùng)</span>
              <input className="input" value={opt.externalId} onChange={(e) => setOpt({ ...opt, externalId: e.target.value })} placeholder="VD: mã đơn Shopee" />
            </label>
            <label className="block">
              <span className="label">Giao hàng</span>
              <select className="input" value={opt.shippingMethod} onChange={(e) => setOpt({ ...opt, shippingMethod: e.target.value as typeof opt.shippingMethod })}>
                {SHIPPING_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {SHIPPING_METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Thu hộ khách cuối (COD, đ)</span>
              <input className="input" inputMode="numeric" value={opt.codAmount} onChange={(e) => setOpt({ ...opt, codAmount: e.target.value.replace(/\D/g, "") })} placeholder="0 = không thu" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={opt.whiteLabel} onChange={(e) => setOpt({ ...opt, whiteLabel: e.target.checked })} /> Đóng gói thương hiệu của tôi (không in tên xưởng)
            </label>
            <label className="block">
              <span className="label">Ghi chú cho xưởng</span>
              <textarea className="input min-h-[60px]" value={opt.note} onChange={(e) => setOpt({ ...opt, note: e.target.value })} />
            </label>
          </div>
        </Box>
        <Box>
          <p className="flex justify-between text-sm">
            <span>Tiền hàng (ước tính)</span>
            <b>{formatVND(estimate)}</b>
          </p>
          <p className="text-xs text-ink/60">Đã trừ chiết khấu {ov.profile.discountPercent}%. Phí ship tính theo tỉnh & cân nặng khi tạo đơn.</p>
          {err && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary mt-3 w-full" disabled={busy || !templates}>
            {busy ? "Đang tạo…" : "Tạo đơn"}
          </button>
        </Box>
      </div>
    </form>
  );
}

/* ================== Nhập CSV ================== */
type ImportResult = {
  created: { line: number; code: string; externalId: string | null; total: number }[];
  duplicates: { line: number; code: string; externalId: string | null }[];
  errors: { line: number; message: string }[];
  total: number;
  dryRun?: boolean;
};

export function SellerCsvImport() {
  const { reload } = useSeller();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [res, setRes] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function download() {
    const blob = new Blob([sellerCsvTemplate()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mau-don-dropship.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function run(dryRun: boolean) {
    setErr("");
    setBusy(true);
    try {
      const r = await api<ImportResult>("/seller/orders/import", { method: "POST", json: { csv, dryRun } });
      setRes(r);
      if (!dryRun) void reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black md:text-2xl">Nhập đơn hàng loạt (CSV)</h1>
      <Box>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>
            <button type="button" onClick={download} className="font-bold underline">
              Tải file mẫu CSV
            </button>{" "}
            (mở bằng Excel/Google Sheets, lưu lại dạng CSV UTF-8).
          </li>
          <li>Mỗi dòng 1 sản phẩm; các dòng cùng MA_DON gộp thành 1 đơn. Gửi lại file cũ không tạo đơn trùng.</li>
          <li>Bấm Kiểm tra trước, không lỗi thì Tạo đơn.</li>
        </ol>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-semibold">Các cột</summary>
          <ul className="mt-1 grid gap-x-4 sm:grid-cols-2">
            {SELLER_CSV_COLUMNS.map(([k, d]) => (
              <li key={k}>
                <code className="font-bold">{k}</code> – {d}
              </li>
            ))}
          </ul>
        </details>
      </Box>
      <Box>
        <label className="btn-outline inline-flex cursor-pointer px-4 py-2">
          Chọn file CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 2_000_000) return setErr("File tối đa 2MB");
              setFileName(f.name);
              setCsv(await f.text());
              setRes(null);
            }}
          />
        </label>
        {fileName && <span className="ml-2 text-sm">{fileName}</span>}
        <textarea className="input mt-3 min-h-[140px] font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="…hoặc dán nội dung CSV vào đây" aria-label="Nội dung CSV" />
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-outline px-4" disabled={!csv.trim() || busy} onClick={() => run(true)}>
            Kiểm tra
          </button>
          <button type="button" className="btn-primary px-5" disabled={!csv.trim() || busy || !res?.dryRun || res.errors.length > 0} onClick={() => run(false)}>
            Tạo đơn
          </button>
        </div>
        {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
      </Box>
      {res && (
        <Box>
          <p className="font-bold">
            {res.dryRun ? `Kiểm tra ${res.total} đơn: ${res.errors.length ? `${res.errors.length} lỗi` : "không có lỗi ✓"}` : `Đã tạo ${res.created.length}/${res.total} đơn`}
            {res.duplicates.length > 0 && ` · ${res.duplicates.length} đơn đã có (bỏ qua)`}
          </p>
          {res.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              {res.errors.map((e, i) => (
                <li key={i}>
                  Dòng {e.line}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {!res.dryRun && res.created.length > 0 && (
            <Link href="/seller/don?pay=unpaid" className="btn-primary mt-3 inline-flex px-4 py-2">
              Xem & thanh toán gộp →
            </Link>
          )}
        </Box>
      )}
    </div>
  );
}

/* ================== Thanh toán ================== */
type BatchRow = { id: string; code: string; total: number; status: "UNPAID" | "PAID" | "CANCELLED"; createdAt: string; paidAt: string | null; _count: { orders: number } };

export function SellerPayments() {
  const [data, setData] = useState<{ items: BatchRow[]; bank: Bank } | null>(null);
  const [show, setShow] = useState<string | null>(null);
  const load = () => api<{ items: BatchRow[]; bank: Bank }>("/seller/batches").then(setData).catch(() => setData({ items: [], bank: { bankId: "", accountNo: "", accountName: "" } }));
  useEffect(() => void load(), []);
  async function cancel(code: string) {
    if (!confirm(`Huỷ lần thanh toán ${code}? Các đơn sẽ trở lại "chưa thanh toán".`)) return;
    await api(`/seller/batches/${code}/cancel`, { method: "POST" }).catch((e) => alert((e as Error).message));
    void load();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-black md:text-2xl">Thanh toán gộp</h1>
        <Link href="/seller/don?pay=unpaid" className="btn-primary px-4 py-2">
          + Chọn đơn để thanh toán
        </Link>
      </div>
      {!data ? (
        <p className="text-sm text-ink/60">Đang tải…</p>
      ) : !data.items.length ? (
        <Box>
          <p className="text-sm text-ink/60">Chưa có lần thanh toán nào.</p>
        </Box>
      ) : (
        <ul className="space-y-3">
          {data.items.map((b) => (
            <li key={b.id}>
              <Box>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-bold">{b.code}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === "PAID" ? "bg-green-100 text-green-800" : b.status === "UNPAID" ? "bg-amber-100 text-amber-800" : "bg-neutral-200 text-neutral-600"}`}>
                    {b.status === "PAID" ? "Đã nhận tiền" : b.status === "UNPAID" ? "Chờ chuyển khoản" : "Đã huỷ"}
                  </span>
                  <p className="text-sm text-ink/60">
                    {b._count.orders} đơn · {formatDateTimeVN(b.createdAt)}
                  </p>
                  <p className="ml-auto text-lg font-black">{formatVND(b.total)}</p>
                </div>
                {b.status === "UNPAID" && (
                  <div className="mt-2 flex gap-3 text-sm">
                    <button type="button" className="font-bold underline" onClick={() => setShow(show === b.code ? null : b.code)}>
                      {show === b.code ? "Ẩn mã QR" : "Hiện mã VietQR"}
                    </button>
                    <button type="button" className="text-red-600 underline" onClick={() => cancel(b.code)}>
                      Huỷ
                    </button>
                  </div>
                )}
                {show === b.code && (
                  <div className="mt-3">
                    <BatchQr batch={{ code: b.code, total: b.total, bank: data.bank }} />
                  </div>
                )}
              </Box>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
