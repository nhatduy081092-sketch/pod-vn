import Link from "next/link";
import { Suspense } from "react";
import type { Facets } from "@/lib/api";
import type { Paged, ProductCardData } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { SortSelect } from "./SortSelect";
import { FilterSheet } from "./FilterSheet";

export type ListingParams = { q?: string; sub?: string; gia?: string; sort?: string; page?: string; category?: string; "doi-tuong"?: string; "bo-suu-tap"?: string; mau?: string };

const COLLECTIONS = [
  { v: "moi", label: "Hàng mới", dot: "bg-[#16a34a]" },
  { v: "sale", label: "Khuyến mãi", dot: "bg-[#e11d48]" },
  { v: "ban-chay", label: "Bán chạy", dot: "bg-brand-dark" },
];

type Props = {
  basePath: string;
  data: Paged<ProductCardData>;
  params: ListingParams;
  facets: Facets;
  /** trang danh mục: lọc theo nhóm con; trang tìm kiếm/tất cả: lọc theo danh mục */
  mode: "category" | "all";
};

const PRICE_FILTERS = [
  { v: "", label: "Tất cả" },
  { v: "co", label: "Có giá – mua ngay" },
  { v: "bao-gia", label: "Báo giá theo yêu cầu" },
];

export function hrefWith(basePath: string, params: ListingParams, patch: Partial<ListingParams>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/** Danh sách sản phẩm + bộ lọc: sidebar trên desktop, chip cuộn ngang + bảng lọc trên mobile */
export function ProductListing({ basePath, data, params, facets, mode }: Props) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const groups =
    mode === "category"
      ? facets.subcategories.map((s) => ({ key: s.slug, name: s.name, count: s.count, href: hrefWith(basePath, params, { sub: s.slug, page: undefined }), active: params.sub === s.slug }))
      : facets.categories.map((c) => ({
          key: c.slug,
          name: c.name,
          count: c.count,
          href: hrefWith(`/danh-muc/${c.slug}`, { q: params.q, gia: params.gia, sort: params.sort, "bo-suu-tap": params["bo-suu-tap"] }, {}),
          active: false,
        }));
  const allHref = hrefWith(basePath, params, { sub: undefined, page: undefined });
  const activeFilters = (params.sub ? 1 : 0) + (params.gia ? 1 : 0) + (params["bo-suu-tap"] ? 1 : 0) + (params.mau ? 1 : 0);

  const col = params["bo-suu-tap"];
  const panel = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink/50">Bộ sưu tập</p>
        <ul className="space-y-0.5">
          {COLLECTIONS.map((c) => (
            <li key={c.v}>
              <Link
                href={hrefWith(basePath, params, { "bo-suu-tap": col === c.v ? undefined : c.v, page: undefined })}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${col === c.v ? "bg-navy font-semibold text-white" : "hover:bg-navy-light"}`}
                aria-current={col === c.v ? "true" : undefined}
              >
                <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {groups.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink/50">{mode === "category" ? "Nhóm sản phẩm" : "Danh mục"}</p>
          <ul className="space-y-0.5">
            {mode === "category" && (
              <li>
                <Link href={allHref} className={`flex justify-between rounded-md px-2 py-1.5 text-sm ${!params.sub ? "bg-navy text-white" : "hover:bg-navy-light"}`}>
                  <span>Tất cả</span>
                </Link>
              </li>
            )}
            {groups.map((g) => (
              <li key={g.key}>
                <Link
                  href={g.href}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${g.active ? "bg-navy font-semibold text-white" : "hover:bg-navy-light"}`}
                >
                  <span className="min-w-0 truncate">{g.name}</span>
                  <span className={`shrink-0 text-xs ${g.active ? "text-white/80" : "text-ink/40"}`}>{g.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink/50">Giá</p>
        <ul className="space-y-0.5">
          {PRICE_FILTERS.map((f) => (
            <li key={f.v}>
              <Link
                href={hrefWith(basePath, params, { gia: f.v || undefined, page: undefined })}
                className={`block rounded-md px-2 py-1.5 text-sm ${(params.gia ?? "") === f.v ? "bg-navy font-semibold text-white" : "hover:bg-navy-light"}`}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-32">{panel}</div>
      </aside>

      <div className="min-w-0">
        {/* Bộ sưu tập – chip nhanh trên mobile/tablet */}
        <div className="no-scrollbar -mx-4 mb-1 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {COLLECTIONS.map((c) => (
            <Chip key={c.v} href={hrefWith(basePath, params, { "bo-suu-tap": col === c.v ? undefined : c.v, page: undefined })} active={col === c.v}>
              <span className={`mr-1 inline-block h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
              {c.label}
            </Chip>
          ))}
        </div>
        {/* Chip nhóm – cuộn ngang trên mobile/tablet */}
        {groups.length > 0 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
            {mode === "category" && (
              <Chip href={allHref} active={!params.sub}>
                Tất cả
              </Chip>
            )}
            {groups.map((g) => (
              <Chip key={g.key} href={g.href} active={g.active}>
                {g.name} <span className="opacity-60">{g.count}</span>
              </Chip>
            ))}
          </div>
        )}

        {/* Thanh công cụ */}
        <div className="mt-2 flex items-center justify-between gap-2 lg:mt-0">
          <p className="whitespace-nowrap text-sm text-ink/60">
            <b className="text-ink">{data.total.toLocaleString("vi-VN")}</b> sản phẩm
          </p>
          <div className="flex items-center gap-2">
            <Suspense>
              <FilterSheet count={activeFilters}>{panel}</FilterSheet>
              <SortSelect value={params.sort ?? ""} />
            </Suspense>
          </div>
        </div>

        {params.mau && (
          <p className="mt-3">
            <Link
              href={hrefWith(basePath, params, { mau: undefined, page: undefined })}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-bold hover:bg-navy-light"
              aria-label={`Bỏ lọc màu ${params.mau}`}
            >
              Màu: {params.mau} <span aria-hidden>✕</span>
            </Link>
          </p>
        )}

        <div className="mt-4">
          {data.items.length ? (
            <ProductGrid items={data.items} dense color={params.mau} />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-ink/20 px-4 py-16 text-center text-ink/60">
              <p>Chưa có sản phẩm phù hợp.</p>
              <Link href={basePath} className="mt-2 inline-block font-bold text-navy underline">
                Xoá bộ lọc
              </Link>
            </div>
          )}
        </div>

        {pages > 1 && (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
            {data.page > 1 && (
              <PageLink href={hrefWith(basePath, params, { page: data.page - 1 > 1 ? String(data.page - 1) : undefined })} label="‹ Trước" />
            )}
            {Array.from({ length: pages })
              .map((_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - data.page) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {idx > 0 && n - arr[idx - 1]! > 1 && <span className="text-ink/40">…</span>}
                  <PageLink href={hrefWith(basePath, params, { page: n > 1 ? String(n) : undefined })} label={String(n)} active={n === data.page} />
                </span>
              ))}
            {data.page < pages && <PageLink href={hrefWith(basePath, params, { page: String(data.page + 1) })} label="Sau ›" />}
          </nav>
        )}
      </div>
    </div>
  );
}

function PageLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 min-w-9 items-center justify-center rounded-md border-2 px-2.5 text-sm font-bold ${active ? "border-navy bg-navy text-white" : "border-ink/15 bg-white hover:border-navy"}`}
    >
      {label}
    </Link>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${active ? "border-navy bg-navy text-white" : "border-ink/15 bg-white text-ink/80"}`}
    >
      {children}
    </Link>
  );
}
