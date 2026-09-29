"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { categoryUpsertSchema, type CategoryUpsertInput } from "@pod/shared";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions";
import type { AdminCategory } from "@/lib/types";
import { ImageInput } from "./ImageInput";
import { SizeChartInput } from "./SizeChartInput";

const EMPTY: CategoryUpsertInput = { name: "", slug: "", description: "", imageUrl: "", sortOrder: 0, isActive: true, showOnHome: true, sizeChart: "" };

export function CategoryManager({ initial }: { initial: AdminCategory[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | "new" | null
  const [form, setForm] = useState<CategoryUpsertInput>(EMPTY);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const open = (c?: AdminCategory) => {
    setErr("");
    setEditing(c?.id ?? "new");
    setForm(c ? { name: c.name, slug: c.slug, description: c.description, imageUrl: c.imageUrl, sortOrder: c.sortOrder, isActive: c.isActive, showOnHome: c.showOnHome, sizeChart: c.sizeChart ?? "" } : { ...EMPTY, sortOrder: initial.length });
  };

  const save = () => {
    const parsed = categoryUpsertSchema.safeParse(form);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Không hợp lệ");
    start(async () => {
      const r = await saveCategoryAction(editing === "new" ? null : editing, parsed.data);
      if (!r.ok) return setErr(r.error);
      setEditing(null);
      router.refresh();
    });
  };

  const del = (c: AdminCategory) => {
    if (!confirm(`Xoá danh mục "${c.name}"?`)) return;
    start(async () => {
      const r = await deleteCategoryAction(c.id);
      if (!r.ok) alert(r.error);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="card overflow-x-auto p-0 md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên</th>
              <th>Slug</th>
              <th>SP</th>
              <th>Trang chủ</th>
              <th>Bảng size</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.id}>
                <td>{c.sortOrder}</td>
                <td className="font-semibold">
                  {c.name} {!c.isActive && <span className="text-xs text-neutral-400">(ẩn)</span>}
                </td>
                <td className="text-xs text-neutral-500">{c.slug}</td>
                <td>{c._count?.products ?? 0}</td>
                <td>{c.showOnHome ? "✓" : "—"}</td>
                <td>{c.sizeChart?.trim() ? "✓" : <span className="text-neutral-400">—</span>}</td>
                <td className="whitespace-nowrap text-right">
                  <button className="btn-ghost px-2 py-1" onClick={() => open(c)}>
                    Sửa
                  </button>{" "}
                  <button className="btn-danger px-2 py-1" onClick={() => del(c)} disabled={pending}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3">
          <button className="btn-brand" onClick={() => open()}>
            + Thêm danh mục
          </button>
        </div>
      </div>

      {editing && (
        <div className="card h-fit space-y-3">
          <h2 className="font-bold">{editing === "new" ? "Thêm danh mục" : "Sửa danh mục"}</h2>
          <label className="block">
            <span className="label">Tên *</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Slug</span>
            <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="tự tạo nếu để trống" />
          </label>
          <label className="block">
            <span className="label">Mô tả (SEO)</span>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <ImageInput label="Ảnh đại diện" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} />
          <label className="block">
            <span className="label">Thứ tự</span>
            <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} />
          </label>
          <SizeChartInput
            value={form.sizeChart}
            onChange={(v) => setForm({ ...form, sizeChart: v })}
            hint="Áp dụng cho mọi sản phẩm trong danh mục (sản phẩm có bảng size riêng sẽ dùng bảng riêng)."
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Hiển thị
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showOnHome} onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })} /> Hiện section trên trang chủ
          </label>
          {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={save} disabled={pending}>
              Lưu
            </button>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
