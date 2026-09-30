"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildVariantMatrix, PRODUCT_TYPE_PRESETS, productUpsertSchema, type ProductTypePreset } from "@pod/shared";
import { savePrintAreasAction, saveProductAction, saveVariantsAction } from "@/lib/actions";
import { assetUrl } from "@/lib/config";
import type { AdminCategory } from "@/lib/types";

const GROUPS = [...new Set(PRODUCT_TYPE_PRESETS.map((p) => p.group))];

/**
 * Tạo nhanh sản phẩm in được (ngoài áo) từ mẫu loại: mặt in, size, viền tràn, mockup có sẵn.
 * Sản phẩm tạo ra ở trạng thái ẨN – kiểm tra thông số với xưởng, nhập giá rồi mới bật bán.
 */
export function ProductTypeCreator({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [type, setType] = useState<ProductTypePreset | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  function pick(p: ProductTypePreset) {
    setType(p);
    setName(p.name);
    setMsg("");
  }

  function create() {
    if (!type) return;
    setMsg("");
    const parsed = productUpsertSchema.safeParse({
      name,
      categoryId,
      description: type.description,
      material: type.material,
      printMethod: type.printMethod,
      basePrice: Math.max(0, Math.round(Number(price.replace(/\D/g, "")) || 0)),
      weightGram: type.weightGram,
      productionDays: type.productionDays,
      images: [type.image],
      colors: type.colors.map((c) => c.name),
      sizes: type.sizes,
      isActive: false,
      isHotSale: false,
    });
    if (!parsed.success) return setMsg(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ");
    start(async () => {
      const r = await saveProductAction(null, parsed.data);
      if (!r.ok || !r.id) return setMsg(r.ok ? "Không tạo được sản phẩm" : r.error);
      const v = await saveVariantsAction(r.id, buildVariantMatrix(name, type.colors, type.sizes));
      if (!v.ok) return setMsg(`Đã tạo sản phẩm nhưng lỗi phân loại: ${v.error}`);
      const a = await savePrintAreasAction(r.id, type.areas);
      if (!a.ok) return setMsg(`Đã tạo sản phẩm nhưng lỗi mặt in: ${a.error}`);
      router.push(`/products/${r.id}`);
    });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        ⚠️ Kích thước vùng in, DPI, viền tràn trong các mẫu là <b>số liệu tham khảo</b> phổ biến – không phải thông số xưởng của bạn. Sản phẩm được tạo ở trạng thái <b>ẩn</b>: đối chiếu với xưởng, sửa ở mục “Mặt in”, nhập giá, thay ảnh thật rồi mới bật hiển thị.
      </p>
      {GROUPS.map((g) => (
        <section key={g} className="card">
          <h2 className="mb-2 font-bold">{g}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {PRODUCT_TYPE_PRESETS.filter((p) => p.group === g).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => pick(p)}
                className={`overflow-hidden rounded-lg border-2 text-left ${type?.key === p.key ? "border-brand-dark ring-2 ring-brand" : "border-neutral-200 hover:border-neutral-400"}`}
              >
                <img src={assetUrl(p.image)} alt="" className="aspect-square w-full bg-neutral-50 object-contain" />
                <span className="block px-2 py-1 text-sm font-semibold">{p.label}</span>
                <span className="block px-2 pb-1.5 text-[11px] text-neutral-500">
                  {p.areas.length > 1 ? `${p.areas.length} mặt in · ` : ""}
                  {p.sizes.join(", ")}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {type && (
        <section className="card space-y-3">
          <h2 className="font-bold">Tạo “{type.label}”</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm md:col-span-3">
              <span className="label">Tên sản phẩm</span>
              <input className="input" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="label">Danh mục</span>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="label">Giá bán (₫) – để trống = sản phẩm báo giá</span>
              <input className="input" inputMode="numeric" value={price} placeholder="VD 149000" onChange={(e) => setPrice(e.target.value)} />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Mặt in</th>
                  <th>Kích thước chung</th>
                  <th>DPI</th>
                  <th>Viền tràn / an toàn</th>
                  <th>Theo size</th>
                </tr>
              </thead>
              <tbody>
                {type.areas.slice(0, 3).map((a) => (
                  <tr key={a.key}>
                    <td>
                      {a.name}
                      {a.warp === "cylinder" ? " (cuộn quanh)" : ""}
                    </td>
                    <td>
                      {a.widthMm}×{a.heightMm} mm
                    </td>
                    <td>{a.dpi}</td>
                    <td>
                      {a.bleedMm} / {a.safeMm} mm
                    </td>
                    <td className="text-xs">{Object.entries(a.sizeSpecs).map(([s, v]) => `${s}: ${v.widthMm}×${v.heightMm}`).join(" · ") || "–"}</td>
                  </tr>
                ))}
                {type.areas.length > 3 && (
                  <tr>
                    <td colSpan={5} className="text-xs text-neutral-500">
                      … và {type.areas.length - 3} mặt in khác cùng thông số
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-brand" onClick={create} disabled={pending || !categoryId}>
              {pending ? "Đang tạo…" : "Tạo sản phẩm (ẩn)"}
            </button>
            {!categories.length && <span className="text-sm text-red-700">Chưa có danh mục – tạo danh mục trước.</span>}
            {msg && <span className="text-sm text-red-700">{msg}</span>}
          </div>
        </section>
      )}
    </div>
  );
}
