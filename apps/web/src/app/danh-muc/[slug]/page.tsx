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
  const query: ListingParams = { q: sp.q?.slice(0, 80), sub: sp.sub, gia: sp.gia, sort: sp.sort, page: sp.page, "doi-tuong": sp["doi-tuong"], "bo-suu-tap": sp["bo-suu-tap"] };
  const [data, facets] = await Promise.all([
    getProducts({ ...query, category: slug }),
    getFacets({ category: slug, q: query.q, gia: query.gia, sub: query.sub, "doi-tuong": query["doi-tuong"], "bo-suu-tap": query["bo-suu-tap"] }),
  ]);
  const activeSub = facets.subcategories.find((s) => s.slug === query.sub);
  return (
    <div className="container-site py-5 md:py-8">
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
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
      <h1 className="mt-1 text-2xl font-black md:text-3xl">
        {activeSub?.name ?? cat.name}
        {query.q && <span className="text-ink/50"> · “{query.q}”</span>}
      </h1>
      {cat.description && !activeSub && <p className="mt-1 max-w-3xl text-sm text-ink/70 md:text-base">{cat.description}</p>}
      <div className="mt-4">
        <ProductListing basePath={`/danh-muc/${slug}`} data={data} params={query} facets={facets} mode="category" />
      </div>
    </div>
  );
}
