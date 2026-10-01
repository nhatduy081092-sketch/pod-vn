"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORTS = [
  { v: "", label: "Nổi bật" },
  { v: "ban-chay", label: "Bán chạy" },
  { v: "newest", label: "Mới nhất" },
  { v: "price-asc", label: "Giá thấp → cao" },
  { v: "price-desc", label: "Giá cao → thấp" },
];

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <span className="hidden text-ink/60 sm:inline">Sắp xếp</span>
      <select
        value={value}
        onChange={(e) => {
          const qs = new URLSearchParams(sp.toString());
          if (e.target.value) qs.set("sort", e.target.value);
          else qs.delete("sort");
          qs.delete("page");
          const str = qs.toString();
          router.push(str ? `${pathname}?${str}` : pathname);
        }}
        className="h-9 rounded-md border border-ink/20 bg-white px-2 text-sm font-semibold"
        aria-label="Sắp xếp sản phẩm"
      >
        {SORTS.map((s) => (
          <option key={s.v} value={s.v}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
