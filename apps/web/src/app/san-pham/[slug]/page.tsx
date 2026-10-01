import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { effectiveBasePrice, formatVND, resolveSizeChart, saleActive } from "@pod/shared";
import { getNotices, getPage, getProduct, getSettings } from "@/lib/api";
import { absoluteAssetUrl, SITE_URL } from "@/lib/config";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { QuoteProduct } from "@/components/product/QuoteProduct";
import { RecordView } from "@/components/personal/RecordView";
import { RecentlyViewed } from "@/components/personal/RecentlyViewed";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ProductTabs, type ProductTab } from "@/components/product/ProductTabs";
import { SizeChartTable } from "@/components/product/SizeChartTable";
import { ContentRenderer } from "@/components/ContentRenderer";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const desc = p.description.slice(0, 160);
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: `/san-pham/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: p.images[0] ? [absoluteAssetUrl(p.images[0])] : [] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings, shippingPage, printPage, notices] = await Promise.all([
    getProduct(slug),
    getSettings(),
    getPage("van-chuyen-thanh-toan").catch(() => null),
    getPage("huong-dan-file-in").catch(() => null),
    getNotices(),
  ]);
  const productNotices = notices.filter((n) => n.showOnProduct);
  if (!product) notFound();

  const isQuote = product.basePrice <= 0;
  // sản phẩm thuộc ngành hàng doanh nghiệp -> có nút "Thêm vào báo giá" + gợi ý báo giá khi đặt số lượng lớn
  const isB2B = settings.b2bHub.industries.some((i) => i.slug === product.category.slug);
  const sizeChart = resolveSizeChart(product.sizeChart, product.category.sizeChart);
  const realSizes = product.sizes.filter((s) => !/^free\s*size$/i.test(s));
  const zaloHref = `https://zalo.me/${settings.brand.zalo.replace(/\D/g, "")}`;
  const hasSizeGuide = Boolean(sizeChart) || realSizes.length > 1;

  const tabs: ProductTab[] = [
    {
      id: "mo-ta",
      label: "Mô tả",
      content: (
        <div>
          {product.description ? (
            <p className="whitespace-pre-line leading-relaxed text-ink/85">{product.description}</p>
          ) : (
            <p className="text-ink/60">Mô tả đang được cập nhật.</p>
          )}
          <dl className="mt-5 grid gap-x-6 gap-y-2 rounded-lg bg-cream p-4 text-sm sm:grid-cols-2">
            {(
              [
                ["Danh mục", product.category.name],
                ["Chất liệu", product.material],
                [isQuote ? "Gia công logo" : "Công nghệ in", product.printMethod],
                ["Size", realSizes.join(", ")],
                ["Đặt tối thiểu", product.minQty > 1 ? `${product.minQty} cái` : ""],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 font-bold">{k}:</dt>
                  <dd className="text-ink/80">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      ),
    },
  ];
  if (hasSizeGuide) {
    tabs.push({
      id: "bang-size",
      label: "Bảng size",
      content: sizeChart ? (
        <SizeChartTable chart={sizeChart} />
      ) : (
        <div className="rounded-lg border-2 border-dashed border-ink/20 p-4 text-sm">
          <p className="font-bold">Bảng số đo chi tiết đang được cập nhật.</p>
          <p className="mt-1 text-ink/70">
            Size hiện có: <b>{realSizes.join(", ")}</b>. Gửi chiều cao, cân nặng qua Zalo để được tư vấn size phù hợp.
          </p>
          <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="btn mt-3 border-ink bg-zalo px-4 text-white">
            Tư vấn size qua Zalo
          </a>
        </div>
      ),
    });
  }
  tabs.push({
    id: "van-chuyen",
    label: "Vận chuyển",
    content: (
      <div>
        {isQuote ? (
          <p className="mb-4 rounded-lg bg-navy-light p-4 text-sm">
            Thời gian sản xuất và phí giao hàng cho đơn cá nhân hoá / doanh nghiệp được báo cụ thể trong báo giá.
          </p>
        ) : (
          <ul className="mb-4 grid gap-2 rounded-lg bg-cream p-4 text-sm sm:grid-cols-3">
            <li>
              <b className="block">Sản xuất</b>
              {settings.shipping.productionDays} sau khi duyệt mockup
            </li>
            <li>
              <b className="block">Phí ship</b>
              Đồng giá {formatVND(settings.shipping.flatFee)}
            </li>
            <li>
              <b className="block">Miễn phí ship</b>
              Đơn từ {formatVND(settings.shipping.freeThreshold)}
            </li>
          </ul>
        )}
        {shippingPage && <ContentRenderer content={shippingPage.content} />}
      </div>
    ),
  });
  if (printPage) {
    tabs.push({
      id: "huong-dan-in",
      label: isQuote ? "Hướng dẫn file logo" : "Hướng dẫn file in",
      content: <ContentRenderer content={printPage.content} />,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => absoluteAssetUrl(i)),
    description: product.description,
    brand: { "@type": "Brand", name: settings.brand.name },
    ...(product.basePrice > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "VND",
            price: effectiveBasePrice(product),
            ...(saleActive(product) && product.saleEndsAt ? { priceValidUntil: product.saleEndsAt.slice(0, 10) } : {}),
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/san-pham/${product.slug}`,
          },
        }
      : product.priceFrom
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "VND",
              lowPrice: product.priceFrom,
              availability: "https://schema.org/InStock",
              url: `${SITE_URL}/san-pham/${product.slug}`,
            },
          }
        : {}),
  };

  return (
    <div className="container-site py-4 md:py-10">
      <nav className="mb-3 text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>{" "}
        /{" "}
        <Link href={`/danh-muc/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
      </nav>
      {productNotices.map((n) => (
        <div
          key={n.id}
          className={`mb-4 rounded-lg border-2 px-4 py-3 text-sm ${n.level === "warning" ? "border-amber-400 bg-amber-50 text-amber-900" : "border-sky-300 bg-sky-50 text-sky-900"}`}
          role="note"
        >
          <p className="font-extrabold">{n.level === "warning" ? "⚠️ " : "ℹ️ "}{n.title}</p>
          {n.content && <p className="mt-0.5 whitespace-pre-line">{n.content}</p>}
        </div>
      ))}
      {isQuote ? (
        <QuoteProduct product={product} brand={settings.brand} hasSizeGuide={hasSizeGuide} threshold={settings.b2bQuote.threshold} />
      ) : (
        <ProductConfigurator
          product={product}
          zalo={settings.brand.zalo}
          hasSizeGuide={hasSizeGuide}
          quote={isB2B ? { threshold: settings.b2bQuote.threshold, enforce: settings.b2bQuote.enforce } : undefined}
        />
      )}

      <ProductTabs tabs={tabs} />

      {product.related.length > 0 && (
        <section className="mt-12">
          <h2 className="h-section mb-5">{product.relatedFromOrders ? "Thường được mua cùng" : "Có thể bạn cũng thích"}</h2>
          <ProductGrid items={product.related} />
        </section>
      )}
      <RecordView
        b2b={isB2B}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          images: product.images.slice(0, 2),
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
          priceFrom: product.priceFrom ?? null,
          salePrice: product.salePrice ?? null,
          saleEndsAt: product.saleEndsAt ?? null,
          minQty: product.minQty,
          audience: product.audience,
          isBestSeller: product.isBestSeller,
          category: { name: product.category.name, slug: product.category.slug },
        }}
      />
      <RecentlyViewed exclude={product.id} className="-mx-4 md:-mx-6" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
