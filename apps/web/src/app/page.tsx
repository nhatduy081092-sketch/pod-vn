import { getHome } from "@/lib/api";
import { TopBanner } from "@/components/landing/TopBanner";
import { Hero } from "@/components/landing/Hero";
import { BestSellers } from "@/components/landing/BestSellers";
import { Steps } from "@/components/landing/Steps";
import { FabricIntro } from "@/components/landing/FabricIntro";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { AudienceTiles } from "@/components/landing/AudienceTiles";
import { CategorySection } from "@/components/landing/CategorySection";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { B2BSection } from "@/components/landing/B2BSection";
import { CatalogSection } from "@/components/landing/CatalogSection";

export const revalidate = 60;

/** Landing "In toàn thân" – bám bố cục trang mẫu 1:1 */
export default async function HomePage() {
  const { settings, bestSellers, categories, testimonials, b2bProducts = [], catalog = [] } = await getHome();
  return (
    <>
      <TopBanner data={settings.topBanner} />
      <Hero data={settings.hero} />
      <BestSellers title={settings.sectionTitles.bestSellers} items={bestSellers} />
      <Steps steps={settings.steps} />
      <FabricIntro intro={settings.intro} fabrics={settings.fabrics} />
      <B2BSection data={settings.b2b} brand={settings.brand} products={b2bProducts} />
      <div className="h-8 md:h-12" />

      <section className="pb-4">
        <SectionTitle id="hot-sale">{settings.sectionTitles.hotSale}</SectionTitle>
        <AudienceTiles tiles={settings.audienceTiles} />
        {categories.map((c) => (
          <CategorySection key={c.id} name={c.name} slug={c.slug} products={c.products} />
        ))}
      </section>

      <div className="h-10" />
      <CatalogSection items={catalog} />
      <Testimonials title={settings.sectionTitles.reviews} items={testimonials} />
      <WhyChoose data={settings.whyChoose} />
    </>
  );
}
