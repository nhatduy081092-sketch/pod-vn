import type { Metadata } from "next";
import Link from "next/link";
import { getFacets, getProducts } from "@/lib/api";
import { ProductListing, type ListingParams } from "@/components/shop/ProductListing";

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  return sp.q
    ? { title: `Tìm “${sp.q}”`, robots: { index: false, follow: true } }
    : {
        title: "Tất cả sản phẩm cá nhân hoá",
        description: "Áo, balo, bình giữ nhiệt, sổ tay, vali, quà tặng… in / thêu / khắc logo và tên riêng theo yêu cầu.",
        alternates: { canonical: "/san-pham" },
      };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const params: ListingParams = { q: sp.q?.slice(0, 80), gia: sp.gia, sort: sp.sort, page: sp.page, "doi-tuong": sp["doi-tuong"], "bo-suu-tap": sp["bo-suu-tap"] };
  const [data, facets] = await Promise.all([
    getProducts(params),
    getFacets({ q: params.q, gia: params.gia, "doi-tuong": params["doi-tuong"], "bo-suu-tap": params["bo-suu-tap"] }),
  ]);
  return (
    <div className="container-site py-5 md:py-8">
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>{" "}
        / <span className="text-ink">{params.q ? "Tìm kiếm" : "Tất cả sản phẩm"}</span>
      </nav>
      <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%] mb-4 mt-1">{params.q ? <>Kết quả cho “{params.q}”</> : "Tất cả sản phẩm"}</h1>
      <ProductListing basePath="/san-pham" data={data} params={params} facets={facets} mode="all" />
    </div>
  );
}
