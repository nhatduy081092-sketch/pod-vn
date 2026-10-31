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
    <div className="container-site pb-20 pt-6 md:pb-28 md:pt-10">
      <nav className="text-[15px] text-ink/70" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>{" "}
        / <span className="text-ink">{params.q ? "Tìm kiếm" : "Tất cả sản phẩm"}</span>
      </nav>
      <h1 className="mb-10 mt-4 font-display text-[clamp(40px,5.2vw,80px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance] md:mb-14 md:mt-6">
        {params.q ? <>Kết quả cho “{params.q}”</> : "Tất cả sản phẩm"}
      </h1>
      <ProductListing basePath="/san-pham" data={data} params={params} facets={facets} mode="all" />
    </div>
  );
}
