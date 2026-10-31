import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategory, getFacets, getProducts } from "@/lib/api";
import { ProductListing, type ListingParams } from "@/components/shop/ProductListing";

type Params = Promise<{ slug: string }>;
type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SP }): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} – in, thêu, khắc logo theo yêu cầu`,
    description: cat.description || `${cat.name} cá nhân hoá theo thiết kế riêng: in, thêu, khắc logo – làm từ số lượng nhỏ, giao toàn quốc.`,
    alternates: { canonical: `/danh-muc/${cat.slug}${sp.sub ? `?sub=${sp.sub}` : ""}` },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const query: ListingParams = { q: sp.q?.slice(0, 80), sub: sp.sub, gia: sp.gia, sort: sp.sort, page: sp.page, "doi-tuong": sp["doi-tuong"], "bo-suu-tap": sp["bo-suu-tap"], mau: sp.mau?.slice(0, 40) };
  const [data, facets] = await Promise.all([
    getProducts({ ...query, category: slug }),
    getFacets({ category: slug, q: query.q, gia: query.gia, sub: query.sub, "doi-tuong": query["doi-tuong"], "bo-suu-tap": query["bo-suu-tap"], mau: query.mau }),
  ]);
  const activeSub = facets.subcategories.find((s) => s.slug === query.sub);
  return (
    <div className="container-site pb-20 pt-6 md:pb-28 md:pt-10">
      <nav className="text-[15px] text-ink/70" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>{" "}
        /{" "}
        {activeSub ? (
          <>
            <Link href={`/danh-muc/${slug}`} className="hover:text-ink">
              {cat.name}
            </Link>{" "}
            / <span className="text-ink">{activeSub.name}</span>
          </>
        ) : (
          <span className="text-ink">{cat.name}</span>
        )}
      </nav>
      {/* đầu trang danh mục: tên cỡ lớn bên trái, mô tả cột phải (redesign 31/10/2026) */}
      <div className="mt-4 grid gap-5 md:mt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
        <h1 className="font-display text-[clamp(40px,5.2vw,80px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
          {activeSub?.name ?? cat.name}
          {query.q && <span className="text-muted"> · “{query.q}”</span>}
          {query.mau && <span className="text-muted"> · màu {query.mau}</span>}
        </h1>
        {cat.description && !activeSub && <p className="max-w-[36rem] text-lg leading-relaxed text-ink lg:pb-2">{cat.description}</p>}
      </div>
      <div className="mt-10 md:mt-14">
        <ProductListing basePath={`/danh-muc/${slug}`} data={data} params={query} facets={facets} mode="category" />
      </div>
    </div>
  );
}
