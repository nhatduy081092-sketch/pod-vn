import Link from "next/link";
import type { AdminCategory } from "@/lib/types";

export type ProductFilterParams = { q?: string; categoryId?: string; gia?: string; anh?: string; page?: string };

export const GIA_OPTIONS = [
  ["", "Mọi loại giá"],
  ["co", "Đặt online (có giá bán)"],
  ["bao-gia", "Sản phẩm báo giá"],
  ["chua-co", "Chưa có giá nào (cần điền)"],
] as const;

export const ANH_OPTIONS = [
  ["", "Mọi ảnh"],
  ["nguon", "Ảnh gốc oemgroup.vn (cần thay)"],
  ["rieng", "Đã có ảnh tự upload"],
  ["trong", "Chưa có ảnh"],
] as const;

/** Bộ lọc dùng chung cho Sản phẩm + Bảng giá nhanh (form GET, không cần JS) */
export function ProductFilters({ sp, cats, action }: { sp: ProductFilterParams; cats: AdminCategory[]; action: string }) {
  return (
    <form action={action} className="card mb-3 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
      <input name="q" defaultValue={sp.q} placeholder="Tìm theo tên (không dấu cũng được)..." className="input lg:max-w-xs" />
      <select name="categoryId" defaultValue={sp.categoryId ?? ""} className="input lg:max-w-[220px]" aria-label="Danh mục">
        <option value="">Tất cả danh mục</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select name="gia" defaultValue={sp.gia ?? ""} className="input lg:max-w-[240px]" aria-label="Giá">
        {GIA_OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select name="anh" defaultValue={sp.anh ?? ""} className="input lg:max-w-[260px]" aria-label="Ảnh">
        {ANH_OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button className="btn-primary">Lọc</button>
    </form>
  );
}

/** Phân trang gọn: 1 … 4 5 [6] 7 8 … 26 */
export function Pager({ basePath, qs, page, pages }: { basePath: string; qs: URLSearchParams; page: number; pages: number }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="Phân trang">
      {nums.map((n, idx) => {
        const q = new URLSearchParams(qs);
        q.set("page", String(n));
        const gap = idx > 0 && n - nums[idx - 1]! > 1;
        return (
          <span key={n} className="flex items-center gap-2">
            {gap && <span className="text-neutral-400">…</span>}
            <Link href={`${basePath}?${q.toString()}`} className={`btn-ghost px-3 ${page === n ? "bg-brand-light" : ""}`}>
              {n}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
