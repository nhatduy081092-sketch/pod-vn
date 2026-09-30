import { connection } from "next/server";
import { getHome, getProducts, getReadyDesigns } from "@/lib/api";
import type { HomeData } from "@/lib/types";
import { TopBanner } from "@/components/landing/TopBanner";
import { Hero } from "@/components/landing/Hero";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
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
import { ReadyTeaser } from "@/components/landing/ReadyTeaser";

export const revalidate = 60;

/** Landing "In toàn thân" – bám bố cục trang mẫu 1:1 */
export default async function HomePage() {
  let home: HomeData | null = null;
  let ready: Awaited<ReturnType<typeof getReadyDesigns>> = [];
  let designable: Awaited<ReturnType<typeof getProducts>>["items"] = [];
  try {
    home = await getHome();
    // phần phụ: lỗi thì ẩn section, không làm hỏng trang chủ
    [ready, designable] = await Promise.all([
      getReadyDesigns().catch(() => []),
      getProducts({ "thiet-ke": "1", pageSize: "60" })
        .then((r) => r.items)
        .catch(() => []),
    ]);
  } catch (e) {
    // Lúc build Docker chưa có API: chuyển trang sang render khi có request thay vì làm hỏng build.
    // Lúc chạy thật mà API lỗi: Next giữ bản trang cũ (ISR) / hiện trang lỗi.
    await connection();
    throw e;
  }
  const { settings, bestSellers, categories, testimonials, b2bProducts = [], catalog = [], showcaseCounts, showcaseColors } = home;
  return (
    <>
      <TopBanner data={settings.topBanner} />
      <Hero data={settings.hero} />
      <CategoryShowcase data={settings.showcase} counts={showcaseCounts} colors={showcaseColors} />
      <BestSellers title={settings.sectionTitles.bestSellers} items={bestSellers} />
      <ReadyTeaser items={ready} products={designable} />
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
