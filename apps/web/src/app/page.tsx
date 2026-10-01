import { connection } from "next/server";
import { activeSlides } from "@pod/shared";
import { getHome } from "@/lib/api";
import type { HomeData } from "@/lib/types";
import { TopBanner } from "@/components/landing/TopBanner";
import { Hero } from "@/components/landing/Hero";
import { HeroSlider } from "@/components/landing/HeroSlider";
import { BrandSlogan } from "@/components/landing/BrandSlogan";
import { Lanes } from "@/components/landing/Lanes";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { BestSellers } from "@/components/landing/BestSellers";
import { Steps } from "@/components/landing/Steps";
import { CollectionGrid } from "@/components/landing/CollectionGrid";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Lookbook } from "@/components/landing/Lookbook";
import { Everyday } from "@/components/landing/Everyday";
import { CategorySection } from "@/components/landing/CategorySection";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { B2BSection } from "@/components/landing/B2BSection";
import { CatalogSection } from "@/components/landing/CatalogSection";

export const revalidate = 60;

/**
 * Trang chủ YALA: chiến dịch → dòng sản phẩm → hàng theo mùa → mẫu có sẵn → bán chạy → custom (trước/sau)
 * → shop the look → basic → quy trình → doanh nghiệp → hot sale theo danh mục → đánh giá.
 */
export default async function HomePage() {
  let home: HomeData | null = null;
  try {
    home = await getHome();
  } catch (e) {
    // Lúc build Docker chưa có API: chuyển trang sang render khi có request thay vì làm hỏng build.
    await connection();
    throw e;
  }
  const { settings, bestSellers, categories, testimonials, b2bProducts = [], catalog = [], showcaseCounts, showcaseColors, seasonal, lookbookProducts = [], everyday = [] } = home;
  const slides = settings.slides.enabled ? activeSlides(settings.slides.items) : [];
  return (
    <>
      <TopBanner data={settings.topBanner} />
      <BrandSlogan data={settings.slogan} />
      <Lanes data={settings.positioning} />
      {slides.length ? <HeroSlider slides={slides} intervalMs={settings.slides.intervalMs} /> : <Hero data={settings.hero} />}
      <CategoryShowcase data={settings.showcase} counts={showcaseCounts} colors={showcaseColors} />

      {seasonal && seasonal.items.length > 0 && (
        <section className="py-10 md:py-16" aria-label={seasonal.title}>
          <SectionTitle eyebrow={seasonal.eyebrow} href={seasonal.href || undefined}>
            {seasonal.title}
          </SectionTitle>
          <div className="container-site mt-6 md:mt-8">
            <ProductGrid items={seasonal.items} even />
          </div>
        </section>
      )}

      {settings.collections.enabled && <CollectionGrid eyebrow={settings.collections.eyebrow} title={settings.collections.title} />}
      <BestSellers title={settings.sectionTitles.bestSellers} items={bestSellers} />
      {settings.beforeAfter.enabled && <BeforeAfter data={settings.beforeAfter} />}
      {settings.lookbook.enabled && <Lookbook data={settings.lookbook} products={lookbookProducts} />}
      <Everyday data={settings.everyday} items={everyday} />
      <Steps steps={settings.steps} />
      <B2BSection data={settings.b2b} brand={settings.brand} products={b2bProducts} />

      <section id="hot-sale" className="scroll-mt-20 pb-6">
        {categories.slice(0, 3).map((c) => (
          <CategorySection key={c.id} name={c.name} slug={c.slug} products={c.products} eyebrow={settings.sectionTitles.hotSale} />
        ))}
      </section>

      <div className="h-10" />
      <CatalogSection items={catalog} />
      <Testimonials title={settings.sectionTitles.reviews} items={testimonials} />
      <WhyChoose data={settings.whyChoose} />
    </>
  );
}
