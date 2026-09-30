"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatVND, linePrice, ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderDesign } from "@pod/shared";
import { api } from "@/lib/account";
import { assetUrl } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { takeSellerDesign } from "../editor/storage";
import { Box, useSeller } from "./SellerShell";

/* ================== Tổng quan ================== */
export function SellerDashboard() {
  const { ov } = useSeller();
  const stat = (label: string, value: string, sub?: string) => (
    <div className="rounded-xl border-2 border-ink/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
      {sub && <p className="text-xs text-ink/60">{sub}</p>}
    </div>
  );
  const steps = [
    { done: ov.templates > 0, href: "/seller/mau", t: "Tạo mẫu sản phẩm", d: "Chọn phôi, thiết kế, đặt mã mẫu (SKU của bạn)" },
    { done: ORDER_STATUSES.some((s) => ov.statusCounts[s] > 0), href: "/seller/don/moi", t: "Tạo đơn đầu tiên", d: "Nhập tay, CSV hoặc Open API" },
    { done: !!ov.profile.brandName, href: "/seller/cai-dat", t: "Thiết lập thương hiệu", d: "Tên & nhãn in trên phiếu gửi hàng" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Đơn 30 ngày", String(ov.last30d.count), formatVND(ov.last30d.total))}
        {stat("Chờ thanh toán", formatVND(ov.unpaid.total), `${ov.unpaid.count} đơn`)}
        {stat("Đang sản xuất", String(ov.statusCounts.CONFIRMED + ov.statusCounts.DESIGN_APPROVED + ov.statusCounts.PRINTING))}
        {stat("Mẫu sản phẩm", String(ov.templates))}
      </div>
      {ov.unpaid.count > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          <p className="flex-1 text-sm">
            <b>{ov.unpaid.count} đơn</b> chưa thanh toán ({formatVND(ov.unpaid.total)}). Đơn chỉ vào sản xuất sau khi xưởng nhận tiền.
          </p>
          <Link href="/seller/don?pay=unpaid" className="btn-primary px-4 py-2">
            Thanh toán gộp
          </Link>
        </div>
      )}
      <Box>
        <h2 className="font-extrabold">Bắt đầu</h2>
        <ol className="mt-2 grid gap-2 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.href}>
              <Link href={s.href} className={`block rounded-lg border-2 p-3 ${s.done ? "border-green-600/40 bg-green-50" : "border-ink/15 hover:border-ink"}`}>
                <p className="font-bold">
                  {s.done ? "✓" : `${i + 1}.`} {s.t}
                </p>
                <p className="text-sm text-ink/60">{s.d}</p>
              </Link>
            </li>
          ))}
        </ol>
      </Box>
      <Box>
        <h2 className="font-extrabold">Đơn theo trạng thái</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <Link key={s} href={`/seller/don?status=${s}`} className="rounded-lg border-2 border-ink/10 px-3 py-2 text-sm hover:border-ink">
              {ORDER_STATUS_LABEL[s]} <b className="ml-1">{ov.statusCounts[s]}</b>
            </Link>
          ))}
        </div>
      </Box>
    </div>
  );
}

/* ================== Danh sách mẫu ================== */
export type Template = {
  id: string;
  code: string;
  title: string;
  previewUrl: string;
  retailPrice: number | null;
  isActive: boolean;
  updatedAt: string;
  design: OrderDesign;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    saleEndsAt: string | null;
    priceTiers: { minQty: number; price: number }[] | null;
    isActive: boolean;
    variants: { id: string; color: string; colorHex: string; size: string; sku: string; priceDelta: number }[];
    printAreas: { key: string; name: string; extraPrice: number }[];
  };
};

/** Giá vốn 1 cái (SL 1) sau chiết khấu, theo biến thể rẻ nhất */
export function templateCost(t: Template, discountPercent: number, variantDelta = 0, qty = 1) {
  const used = t.design.files.map((f) => f.area);
  const areaExtras = t.product.printAreas.filter((a) => used.includes(a.key)).reduce((s, a) => s + a.extraPrice, 0);
  return linePrice({ product: t.product, totalQty: qty, variantDelta, areaExtras, discountPercent });
}

export function SellerTemplates() {
  const { ov } = useSeller();
  const [rows, setRows] = useState<Template[] | null>(null);
  const [q, setQ] = useState("");
  const [picking, setPicking] = useState(false);
  const load = () => api<Template[]>("/seller/templates").then(setRows).catch(() => setRows([]));
  useEffect(() => void load(), []);
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (rows ?? []).filter((t) => !k || t.code.toLowerCase().includes(k) || t.title.toLowerCase().includes(k));
  }, [rows, q]);

  async function toggle(t: Template) {
    await api(`/seller/templates/${t.id}`, { method: "PATCH", json: { isActive: !t.isActive } }).catch((e) => alert((e as Error).message));
    void load();
  }
  async function remove(t: Template) {
    if (!confirm(`Xoá mẫu ${t.code}? Đơn cũ vẫn giữ nguyên.`)) return;
    await api(`/seller/templates/${t.id}`, { method: "DELETE" }).catch((e) => alert((e as Error).message));
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-black md:text-2xl">Mẫu sản phẩm</h1>
        <input className="input h-10 w-48" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã / tên" aria-label="Tìm mẫu" />
        <button type="button" onClick={() => setPicking(true)} className="btn-primary h-10 px-4">
          + Tạo mẫu
        </button>
      </div>
      {picking && <ProductPicker onClose={() => setPicking(false)} />}
      {!rows ? (
        <p className="text-sm text-ink/60">Đang tải…</p>
      ) : !shown.length ? (
        <Box>
          <p className="text-sm text-ink/70">
            {rows.length ? "Không có mẫu khớp." : "Chưa có mẫu. Mẫu = phôi + thiết kế đã chốt + mã của bạn; dùng mã mẫu khi tạo đơn tay, CSV hoặc API."}
          </p>
        </Box>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => {
            const cost = templateCost(t, ov.profile.discountPercent);
            const minDelta = Math.min(0, ...t.product.variants.map((v) => v.priceDelta));
            return (
              <li key={t.id} className={`flex gap-3 rounded-xl border-2 bg-white p-3 ${t.isActive ? "border-ink/10" : "border-dashed border-ink/20 opacity-70"}`}>
                <img src={assetUrl(t.previewUrl || "")} alt={t.title} className="h-24 w-24 shrink-0 rounded bg-cream object-contain" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-mono text-xs font-bold text-violet-700">{t.code}</p>
                  <p className="line-clamp-2 font-bold">{t.title}</p>
                  <p className="text-xs text-ink/60">{t.product.name}</p>
                  <p className="mt-1 text-xs">
                    Giá vốn từ <b>{formatVND(cost + minDelta)}</b>
                    {t.retailPrice ? ` · Bán ${formatVND(t.retailPrice)} · Lãi ~${formatVND(t.retailPrice - cost)}` : ""}
                  </p>
                  {!t.product.isActive && <p className="text-xs text-red-600">Phôi đã ngừng bán</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <Link href={`/thiet-ke/${t.product.slug}?seller=1&template=${t.id}`} className="btn border-ink/20 bg-white px-2 py-1 text-xs">
                      Sửa thiết kế
                    </Link>
                    <button type="button" onClick={() => toggle(t)} className="btn border-ink/20 bg-white px-2 py-1 text-xs">
                      {t.isActive ? "Tắt" : "Bật"}
                    </button>
                    <button type="button" onClick={() => remove(t)} className="btn border-ink/20 bg-white px-2 py-1 text-xs text-red-600">
                      Xoá
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Chọn phôi có giá bán để tạo mẫu */
function ProductPicker({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/products?pageSize=60&gia=co${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`)
        .then((r) => r.json())
        .then((r: { items: ProductCardData[] }) => setItems(r.items.filter((p) => p.basePrice > 0)))
        .catch(() => setItems([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Chọn phôi" className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-2xl border border-line bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-ink/10 p-4">
          <h2 className="mr-auto font-black">Chọn phôi để thiết kế</h2>
          <input autoFocus className="input h-9 w-44" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm sản phẩm" aria-label="Tìm sản phẩm" />
          <button type="button" onClick={onClose} className="px-2 text-xl" aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {!items ? (
            <p className="text-sm text-ink/60">Đang tải…</p>
          ) : !items.length ? (
            <p className="text-sm text-ink/60">Không có sản phẩm có giá bán phù hợp (sản phẩm báo giá chưa hỗ trợ dropship).</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((p) => (
                <li key={p.id}>
                  <Link href={`/thiet-ke/${p.slug}?seller=1`} className="block rounded-lg border-2 border-ink/10 p-2 hover:border-ink">
                    <img src={assetUrl(p.images[0] ?? "")} alt="" className="aspect-square w-full rounded bg-cream object-contain" />
                    <p className="mt-1 line-clamp-2 text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-ink/60">Giá lẻ {formatVND(p.basePrice)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================== Lưu mẫu sau khi thiết kế ================== */
export function SellerTemplateForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { ov, reload } = useSeller();
  const editId = sp.get("id");
  const [stash, setStash] = useState<{ productId: string; design: OrderDesign } | null | undefined>(undefined);
  const [existing, setExisting] = useState<Template | null>(null);
  const [f, setF] = useState({ code: "", title: "", retailPrice: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = takeSellerDesign();
    setStash(s && s.productId === sp.get("product") ? s : null);
    if (editId)
      api<Template>(`/seller/templates/${editId}`)
        .then((t) => {
          setExisting(t);
          setF({ code: t.code, title: t.title, retailPrice: t.retailPrice ? String(t.retailPrice) : "" });
        })
        .catch((e) => setErr((e as Error).message));
  }, [editId, sp]);

  if (stash === undefined) return <Box>Đang tải…</Box>;
  if (!stash)
    return (
      <Box>
        <p className="text-sm">Không tìm thấy thiết kế vừa làm (có thể đã mở ở tab khác hoặc hết phiên).</p>
        <Link href="/seller/mau" className="btn-primary mt-3 inline-flex px-4 py-2">
          ← Về danh sách mẫu
        </Link>
      </Box>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const body = { productId: stash!.productId, code: f.code.trim(), title: f.title.trim(), design: stash!.design, retailPrice: f.retailPrice ? Number(f.retailPrice.replace(/\D/g, "")) : null, isActive: existing?.isActive ?? true };
      if (editId) await api(`/seller/templates/${editId}`, { method: "PUT", json: body });
      else await api("/seller/templates", { method: "POST", json: body });
      sessionStorage.removeItem("pod_seller_design");
      await reload();
      router.push("/seller/mau");
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box className="max-w-3xl">
      <h1 className="text-xl font-black">{editId ? "Cập nhật mẫu" : "Lưu mẫu sản phẩm"}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {stash.design.files.map((file) => (
          <figure key={file.area} className="w-28 text-center">
            <img src={assetUrl(file.previewUrl)} alt={file.name} className="aspect-square w-full rounded border border-ink/10 bg-cream object-contain" />
            <figcaption className="text-xs text-ink/60">{file.name}</figcaption>
          </figure>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Mã mẫu (dùng khi tạo đơn/CSV/API)</span>
          <input className="input font-mono" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\s+/g, "-") })} placeholder="VD: AO-MEO-01" required />
        </label>
        <label className="block">
          <span className="label">Giá bạn bán lẻ (tuỳ chọn – để tính lãi)</span>
          <input className="input" inputMode="numeric" value={f.retailPrice} onChange={(e) => setF({ ...f, retailPrice: e.target.value.replace(/\D/g, "") })} placeholder="VD: 249000" />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Tên mẫu</span>
          <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="VD: Áo thun mèo cam – in trước" required />
        </label>
        <p className="text-sm text-ink/60 sm:col-span-2">Chiết khấu seller {ov.profile.discountPercent}% được trừ tự động trên giá bán lẻ của xưởng khi tạo đơn.</p>
        {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{err}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button className="btn-primary px-5" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu mẫu"}
          </button>
          <Link href="/seller/mau" className="btn-outline px-4">
            Huỷ
          </Link>
        </div>
      </form>
    </Box>
  );
}
