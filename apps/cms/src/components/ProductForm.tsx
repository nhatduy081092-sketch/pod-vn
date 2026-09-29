"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AUDIENCE_LABEL,
  AUDIENCES,
  DEFAULT_SIZES,
  KIDS_SIZES,
  MOCK_SHAPES,
  productUpsertSchema,
  type ProductUpsertInput,
} from "@pod/shared";
import { deleteProductAction, saveProductAction } from "@/lib/actions";
import type { AdminCategory, AdminProduct } from "@/lib/types";
import { ImageListInput } from "./ImageInput";
import { SizeChartInput } from "./SizeChartInput";

/** ISO -> giá trị cho input datetime-local (giờ máy người dùng) và ngược lại */
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const toList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function ProductForm({ categories, product }: { categories: AdminCategory[]; product?: AdminProduct }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState<ProductUpsertInput>(() => ({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    audience: product?.audience ?? "UNISEX",
    material: product?.material ?? "",
    printMethod: product?.printMethod ?? "In chuyển nhiệt toàn thân",
    basePrice: product?.basePrice ?? 0,
    compareAtPrice: product?.compareAtPrice ?? null,
    priceFrom: product?.priceFrom ?? null,
    sizeChart: product?.sizeChart ?? "",
    productionDays: product?.productionDays ?? "",
    weightGram: product?.weightGram ?? 300,
    salePrice: product?.salePrice ?? null,
    saleEndsAt: product?.saleEndsAt ?? null,
    newUntil: product?.newUntil ?? null,
    images: product?.images ?? [],
    mockShape: product?.mockShape ?? "",
    subcategory: product?.subcategory ?? "",
    colors: product?.colors ?? ["Theo thiết kế"],
    sizes: product?.sizes ?? DEFAULT_SIZES,
    minQty: product?.minQty ?? 1,
    priceTiers: product?.priceTiers ?? [],
    isBestSeller: product?.isBestSeller ?? false,
    isHotSale: product?.isHotSale ?? true,
    isActive: product?.isActive ?? true,
    sortOrder: product?.sortOrder ?? 0,
  }));
  const [sizesText, setSizesText] = useState(f.sizes.join(", "));
  const [colorsText, setColorsText] = useState(f.colors.join(", "));
  const set = <K extends keyof ProductUpsertInput>(k: K, v: ProductUpsertInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0));

  function save() {
    const parsed = productUpsertSchema.safeParse({ ...f, sizes: toList(sizesText), colors: toList(colorsText) });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" });
    start(async () => {
      const r = await saveProductAction(product?.id ?? null, parsed.data);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: "✓ Đã lưu" });
      if (!product && r.id) router.replace(`/products/${r.id}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!product || !confirm("Xoá sản phẩm này? Đơn cũ vẫn giữ thông tin sản phẩm.")) return;
    start(async () => {
      const r = await deleteProductAction(product.id);
      if (r.ok) router.replace("/products");
      else setMsg({ ok: false, text: r.error });
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <section className="card space-y-3">
          <label className="block">
            <span className="label">Tên sản phẩm *</span>
            <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Slug (URL) – để trống sẽ tự tạo</span>
            <input className="input" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder="ao-thun-in-toan-than" />
          </label>
          <label className="block">
            <span className="label">Mô tả</span>
            <textarea className="input" rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </label>
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">Hình ảnh</h2>
          <ImageListInput value={f.images} onChange={(v) => set("images", v)} />
          <label className="block">
            <span className="label">Dáng xem trước thiết kế (customizer)</span>
            <select className="input" value={f.mockShape} onChange={(e) => set("mockShape", e.target.value)}>
              <option value="">Không dùng (chỉ hiện ảnh sản phẩm)</option>
              {Object.entries(MOCK_SHAPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">Giá</h2>
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
            <b>Giá bán &gt; 0</b>: khách đặt hàng online (giỏ hàng, COD/VietQR). <b>Giá bán = 0</b>: sản phẩm báo giá – hiện form nhận báo giá; điền
            <b> Giá tham khảo &quot;Từ&quot;</b> để card hiện &quot;Từ …₫&quot; thay vì &quot;Liên hệ báo giá&quot;.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="label">Giá bán (₫) *</span>
              <input className="input" inputMode="numeric" value={f.basePrice} onChange={(e) => set("basePrice", num(e.target.value))} />
            </label>
            <label className="block">
              <span className="label">Giá gạch (₫)</span>
              <input
                className="input"
                inputMode="numeric"
                value={f.compareAtPrice ?? ""}
                onChange={(e) => set("compareAtPrice", e.target.value ? num(e.target.value) : null)}
              />
            </label>
            <label className="block">
              <span className="label">Giá tham khảo &quot;Từ&quot; (₫)</span>
              <input
                className="input disabled:bg-neutral-100"
                inputMode="numeric"
                disabled={f.basePrice > 0}
                placeholder={f.basePrice > 0 ? "Chỉ dùng khi giá bán = 0" : "VD: 45000"}
                value={f.priceFrom ?? ""}
                onChange={(e) => set("priceFrom", e.target.value ? num(e.target.value) : null)}
              />
            </label>
            <label className="block">
              <span className="label">SL tối thiểu</span>
              <input className="input" inputMode="numeric" value={f.minQty} onChange={(e) => set("minQty", Math.max(1, num(e.target.value)))} />
            </label>
          </div>
          <div>
            <span className="label">Giá sỉ theo số lượng</span>
            <ul className="space-y-2">
              {f.priceTiers.map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  Từ
                  <input
                    className="input w-24"
                    inputMode="numeric"
                    value={t.minQty}
                    onChange={(e) => set("priceTiers", f.priceTiers.map((x, k) => (k === i ? { ...x, minQty: num(e.target.value) } : x)))}
                  />
                  cái →
                  <input
                    className="input w-36"
                    inputMode="numeric"
                    value={t.price}
                    onChange={(e) => set("priceTiers", f.priceTiers.map((x, k) => (k === i ? { ...x, price: num(e.target.value) } : x)))}
                  />
                  ₫/cái
                  <button type="button" className="btn-danger px-2 py-1" onClick={() => set("priceTiers", f.priceTiers.filter((_, k) => k !== i))}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-ghost mt-2"
              onClick={() => {
                const last = f.priceTiers.at(-1);
                set("priceTiers", [...f.priceTiers, { minQty: last ? last.minQty * 5 : 10, price: Math.round(((last?.price ?? f.basePrice) * 0.9) / 1000) * 1000 }]);
              }}
            >
              + Thêm bậc giá
            </button>
          </div>
          <div className="grid gap-3 rounded-lg bg-rose-50 p-3 sm:grid-cols-3">
            <label className="block">
              <span className="label">Giá khuyến mãi (₫)</span>
              <input
                className="input"
                inputMode="numeric"
                disabled={f.basePrice <= 0}
                placeholder={f.basePrice <= 0 ? "Cần giá bán" : "VD: 129000"}
                value={f.salePrice ?? ""}
                onChange={(e) => set("salePrice", e.target.value ? num(e.target.value) : null)}
              />
            </label>
            <label className="block">
              <span className="label">KM kết thúc lúc</span>
              <input className="input" type="datetime-local" value={toLocalInput(f.saleEndsAt)} onChange={(e) => set("saleEndsAt", fromLocalInput(e.target.value))} />
            </label>
            <label className="block">
              <span className="label">Nhãn &quot;Hàng mới&quot; đến ngày</span>
              <input className="input" type="date" value={f.newUntil ? toLocalInput(f.newUntil).slice(0, 10) : ""} onChange={(e) => set("newUntil", e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : null)} />
            </label>
            <p className="text-xs text-rose-900 sm:col-span-3">KM có hạn hiện đếm ngược + nhãn SALE; hết hạn tự quay về giá bán. Để trống ngày kết thúc = KM không thời hạn.</p>
          </div>
        </section>

        <section className="card grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Chất liệu</span>
            <input className="input" value={f.material} onChange={(e) => set("material", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Công nghệ in</span>
            <input className="input" value={f.printMethod} onChange={(e) => set("printMethod", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Thời gian sản xuất (VD: 2–4 ngày)</span>
            <input className="input" value={f.productionDays} onChange={(e) => set("productionDays", e.target.value)} placeholder="trống = dùng mặc định" />
          </label>
          <label className="block">
            <span className="label">Cân nặng 1 sản phẩm đã đóng gói (gram)</span>
            <input className="input" inputMode="numeric" value={f.weightGram} onChange={(e) => set("weightGram", Math.max(1, num(e.target.value)))} />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Size (phân tách bằng dấu phẩy)</span>
            <input className="input" value={sizesText} onChange={(e) => setSizesText(e.target.value)} />
            <span className="mt-1 flex gap-2 text-xs">
              <button type="button" className="text-brand-dark underline" onClick={() => setSizesText(DEFAULT_SIZES.join(", "))}>
                Người lớn
              </button>
              <button type="button" className="text-brand-dark underline" onClick={() => setSizesText(KIDS_SIZES.join(", "))}>
                Trẻ em
              </button>
              <button type="button" className="text-brand-dark underline" onClick={() => setSizesText("Free size")}>
                Free size
              </button>
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Màu nền / biến thể (phân tách bằng dấu phẩy)</span>
            <input className="input" value={colorsText} onChange={(e) => setColorsText(e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <SizeChartInput
              value={f.sizeChart}
              onChange={(v) => set("sizeChart", v)}
              hint="Để trống = dùng bảng size của danh mục. Chỉ điền khi sản phẩm này có form/số đo riêng."
            />
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="card space-y-3">
          <label className="block">
            <span className="label">Danh mục *</span>
            <select className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Nhóm con (để lọc, VD: Balo laptop)</span>
            <input className="input" value={f.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Đối tượng</span>
            <select className="input" value={f.audience} onChange={(e) => set("audience", e.target.value as ProductUpsertInput["audience"])}>
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {AUDIENCE_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Thứ tự hiển thị</span>
            <input className="input" type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
          </label>
          {(
            [
              ["isActive", "Đang bán (hiển thị)"],
              ["isHotSale", "Hiện ở mục Hot Sale trang chủ"],
              ["isBestSeller", "Bán chạy (dải Best Sellers)"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[#F08A00]" />
              {label}
            </label>
          ))}
        </section>
        {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
        <button className="btn-primary w-full" onClick={save} disabled={pending}>
          {pending ? "Đang lưu..." : product ? "Lưu thay đổi" : "Tạo sản phẩm"}
        </button>
        {product && (
          <button className="btn-danger w-full" onClick={remove} disabled={pending}>
            Xoá sản phẩm
          </button>
        )}
      </aside>
    </div>
  );
}
