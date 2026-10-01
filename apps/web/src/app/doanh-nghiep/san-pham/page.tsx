import type { Metadata } from "next";
import Link from "next/link";
import { B2B_BUDGETS } from "@pod/shared";
import { getFacets, getProducts, getSettings } from "@/lib/api";
import { ProductGrid, priceLabelOf } from "@/components/shop/ProductCard";
import { AddToQuote } from "@/components/b2b/AddToQuote";
import { SortSelect } from "@/components/shop/SortSelect";

type SP = Promise<Record<string, string | undefined>>;
type Params = { nganh?: string; dip?: string; "ngan-sach"?: string; q?: string; sort?: string; page?: string };

const BASE = "/doanh-nghiep/san-pham";
function hrefWith(p: Params, patch: Partial<Params>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...p, ...patch, page: "page" in patch ? patch.page : undefined })) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${BASE}?${s}` : BASE;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const s = await getSettings();
  const ind = s.b2bHub.industries.find((i) => i.slug === sp.nganh);
  const dip = s.b2bHub.solutions.find((x) => x.key === sp.dip);
  const title = ind ? `${ind.name} in logo cho doanh nghiệp` : dip ? `Gợi ý ${dip.title.toLocaleLowerCase("vi")}` : "Sản phẩm quà tặng doanh nghiệp in logo";
  const filtered = !!(sp.q || sp["ngan-sach"] || sp.sort || sp.page || (ind && dip));
  return {
    title,
    description: ind?.blurb ? `${ind.blurb}. In / thêu / khắc logo theo yêu cầu, báo giá theo số lượng, mockup miễn phí.` : "Quà tặng doanh nghiệp, merchandise, đồng phục in logo – lọc theo ngành hàng, dịp và ngân sách mỗi phần quà.",
    alternates: { canonical: ind && !dip ? `${BASE}?nganh=${ind.slug}` : dip && !ind ? `${BASE}?dip=${dip.key}` : BASE },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Sản phẩm doanh nghiệp: lọc theo ngành hàng · dịp · ngân sách mỗi phần quà */
export default async function B2BProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const p: Params = { nganh: sp.nganh, dip: sp.dip, "ngan-sach": sp["ngan-sach"], q: sp.q?.slice(0, 80), sort: sp.sort, page: sp.page };
  const s = await getSettings();
  const hub = s.b2bHub;
  const query = { b2b: "1", category: p.nganh, dip: p.dip, "ngan-sach": p["ngan-sach"], q: p.q, sort: p.sort, page: p.page };
  const [data, facets] = await Promise.all([getProducts(query), getFacets({ ...query, category: undefined, page: undefined, sort: undefined })]);
  const count = new Map(facets.categories.map((c) => [c.slug, c.count]));
  const ind = hub.industries.find((i) => i.slug === p.nganh);
  const dip = hub.solutions.find((x) => x.key === p.dip);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const quoteHref = `/doanh-nghiep?${new URLSearchParams({ ...(p.dip ? { dip: p.dip } : {}), ...(p.nganh ? { nganh: p.nganh } : {}) }).toString()}#bao-gia`;
  const anyFilter = !!(p.nganh || p.dip || p["ngan-sach"] || p.q);

  return (
    <div className="container-site py-5 md:py-8">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/doanh-nghiep" className="hover:text-ink">Doanh nghiệp</Link> /{" "}
        <span className="text-ink">Sản phẩm</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-section">{ind ? ind.name : dip ? dip.title : "Sản phẩm cho doanh nghiệp"}</h1>
          <p className="mt-1.5 max-w-2xl text-[15px] text-muted">
            {dip ? dip.desc : ind ? ind.blurb : "In / thêu / khắc logo theo nhận diện thương hiệu. Giá lẻ để tham khảo – đơn số lượng lớn được báo giá riêng."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/doanh-nghiep/bao-gia" className="btn-outline">Danh sách báo giá</Link>
          <Link href={quoteHref} className="btn-primary">Nhận tư vấn theo ngân sách</Link>
        </div>
      </div>

      {/* Bộ lọc */}
      <form action={BASE} className="mt-6 space-y-3 rounded-2xl border border-line p-4 md:p-5">
        <FilterRow label="Ngành hàng">
          <Chip href={hrefWith(p, { nganh: undefined })} active={!p.nganh}>Tất cả</Chip>
          {hub.industries.map((i) => (
            <Chip key={i.slug} href={hrefWith(p, { nganh: p.nganh === i.slug ? undefined : i.slug })} active={p.nganh === i.slug}>
              {i.name}
              {count.get(i.slug) ? <span className="ml-1 opacity-60">{count.get(i.slug)}</span> : null}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Dịp">
          <Chip href={hrefWith(p, { dip: undefined })} active={!p.dip}>Tất cả</Chip>
          {hub.solutions.map((x) => (
            <Chip key={x.key} href={hrefWith(p, { dip: p.dip === x.key ? undefined : x.key })} active={p.dip === x.key}>
              {x.title}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Ngân sách / phần">
          <Chip href={hrefWith(p, { "ngan-sach": undefined })} active={!p["ngan-sach"]}>Tất cả</Chip>
          {B2B_BUDGETS.map((b) => (
            <Chip key={b.key} href={hrefWith(p, { "ngan-sach": p["ngan-sach"] === b.key ? undefined : b.key })} active={p["ngan-sach"] === b.key}>
              {b.label}
            </Chip>
          ))}
        </FilterRow>
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
          {p.nganh && <input type="hidden" name="nganh" value={p.nganh} />}
          {p.dip && <input type="hidden" name="dip" value={p.dip} />}
          {p["ngan-sach"] && <input type="hidden" name="ngan-sach" value={p["ngan-sach"]} />}
          <input name="q" defaultValue={p.q} placeholder="Tìm: bình giữ nhiệt, sổ tay, áo polo…" className="input h-9 min-w-[60%] flex-1 py-1.5 md:min-w-0 md:max-w-xs" aria-label="Tìm sản phẩm doanh nghiệp" />
          <button type="submit" className="btn-dark h-9 px-4 py-0">Tìm</button>
          <span className="text-sm text-muted">{data.total} sản phẩm</span>
          {anyFilter && <Link href={BASE} className="text-sm font-semibold underline underline-offset-4">Xoá lọc</Link>}
          <span className="ml-auto"><SortSelect value={p.sort ?? ""} /></span>
        </div>
      </form>

      {data.items.length ? (
        <div className="mt-6">
          <ProductGrid
            items={data.items}
            after={(x) => (
              <AddToQuote
                variant="compact"
                quantity={Math.max(x.minQty ?? 1, s.b2bQuote.threshold)}
                product={{ id: x.id, slug: x.slug, name: x.name, image: x.images[0] ?? "", priceLabel: priceLabelOf(x) }}
              />
            )}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface p-8 text-center">
          <p className="text-lg font-semibold">Chưa có sản phẩm khớp bộ lọc</p>
          <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">YALA vẫn nhận làm theo yêu cầu – gửi nhu cầu để được tư vấn mẫu phù hợp ngân sách.</p>
          <div className="mt-4 flex justify-center gap-2.5">
            <Link href={quoteHref} className="btn-primary">Nhận tư vấn</Link>
            {anyFilter && <Link href={BASE} className="btn-outline">Xem tất cả</Link>}
          </div>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex flex-wrap justify-center gap-1.5" aria-label="Phân trang">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pages || Math.abs(n - data.page) <= 1)
            .map((n, i, arr) => (
              <span key={n} className="flex gap-1.5">
                {i > 0 && n - arr[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
                <Link
                  href={hrefWith(p, { page: n > 1 ? String(n) : undefined })}
                  aria-current={n === data.page ? "page" : undefined}
                  className={`grid h-9 min-w-9 place-items-center rounded-full border px-3 text-sm font-semibold ${n === data.page ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                >
                  {n}
                </Link>
              </span>
            ))}
        </nav>
      )}

      <p className="mt-10 text-center text-sm text-muted">
        Giá hiển thị là giá lẻ tham khảo. Từ {s.b2bQuote.threshold} sản phẩm, quà nhiều món hoặc cần đóng hộp: bấm “+ Thêm vào báo giá” ở từng sản phẩm rồi{" "}
        <Link href="/doanh-nghiep/bao-gia" className="font-semibold text-ink underline underline-offset-4">gửi 1 yêu cầu</Link>.
      </p>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="md:flex md:items-start md:gap-4">
      <p className="mb-1.5 w-32 shrink-0 pt-1.5 text-xs font-semibold text-muted md:mb-0">{label}</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">{children}</div>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink"}`}
    >
      {children}
    </Link>
  );
}
