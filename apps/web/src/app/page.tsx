import { connection } from "next/server";
import { activeSlides } from "@pod/shared";
import { getHome } from "@/lib/api";
import type { HomeData } from "@/lib/types";
import { Hero } from "@/components/landing/Hero";
import { HeroSlider } from "@/components/landing/HeroSlider";
import { Lanes } from "@/components/landing/Lanes";
import { SloganRibbon } from "@/components/landing/SloganRibbon";
import { HeroPlay } from "@/components/landing/HeroPlay";
import { TopicRibbon } from "@/components/landing/TopicRibbon";
import { RecentlyViewed } from "@/components/personal/RecentlyViewed";
import { BestSellers } from "@/components/landing/BestSellers";
import { CollectionGrid } from "@/components/landing/CollectionGrid";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { B2BSection } from "@/components/landing/B2BSection";

export const revalidate = 60;

/**
 * Trang chủ YALA (gọn ~9 khối): dải slogan → hero cắt dán → dải chủ đề → 2 lối vào → mẫu có sẵn → bán chạy
 * → bạn vừa xem → từ ảnh thành áo (kèm các bước) → doanh nghiệp → đánh giá → cam kết.
 * Khách từng vào khu Doanh nghiệp: khối doanh nghiệp tự lên ngay sau hero (CSS theo html[data-lane], không nháy).
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
  const { settings, bestSellers, testimonials, b2bProducts = [], catalog = [] } = home;
  const slides = settings.slides.enabled ? activeSlides(settings.slides.items) : [];
  const b2bSlugs = new Set(settings.b2bHub.industries.map((i) => i.slug));
  const retailCats = catalog.filter((c) => !b2bSlugs.has(c.slug)).map((c) => ({ name: c.name, slug: c.slug }));
  return (
    <div className="home-flow flex flex-col">
      <div className="flow-top">
        <SloganRibbon data={settings.slogan} />
        {settings.heroPlay.enabled ? (
          <HeroPlay data={settings.heroPlay} categories={retailCats} />
        ) : slides.length ? (
          <HeroSlider slides={slides} intervalMs={settings.slides.intervalMs} />
        ) : (
          <Hero data={settings.hero} />
        )}
        <TopicRibbon />
      </div>
      <Lanes data={settings.positioning} />
      {settings.collections.enabled && <CollectionGrid title={settings.collections.title} />}
      <BestSellers title={settings.sectionTitles.bestSellers} items={bestSellers} />
      <RecentlyViewed />
      {settings.beforeAfter.enabled && <BeforeAfter data={settings.beforeAfter} steps={settings.steps} />}
      <B2BSection
        data={settings.b2b}
        brand={settings.brand}
        products={b2bProducts}
        industries={settings.b2bHub.industries.flatMap((i) => {
          const c = catalog.find((x) => x.slug === i.slug);
          return c ? [{ name: i.name, slug: i.slug, image: c.image, count: c.count }] : [];
        })}
      />
      <Testimonials title={settings.sectionTitles.reviews} items={testimonials} />
      <WhyChoose data={settings.whyChoose} />
    </div>
  );
}
