import { connection } from "next/server";
import { getHome } from "@/lib/api";
import type { HomeData } from "@/lib/types";
import { SloganRibbon } from "@/components/landing/SloganRibbon";
import { GroupHero, GroupSteps } from "@/components/landing/GroupHero";
import { RecentlyViewed } from "@/components/personal/RecentlyViewed";
import { BestSellers } from "@/components/landing/BestSellers";
import { CollectionGrid } from "@/components/landing/CollectionGrid";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { B2BSection } from "@/components/landing/B2BSection";

export const revalidate = 60;

/**
 * Trang chủ YALA – định vị 10/2026: khách TẬP THỂ (doanh nghiệp, CLB thể thao, hội nhóm/lớp, team building).
 * Hero áo nhóm + 4 lối vào → cách đặt áo nhóm (link nhóm) → doanh nghiệp → từ ảnh thành áo → đánh giá → cam kết
 * → cuối trang: khu mua lẻ (mẫu có sẵn, bán chạy, vừa xem) – vẫn mua được nhưng không còn là lối vào chính.
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
  const zalo = settings.brand.zalo ? `https://zalo.me/${settings.brand.zalo.replace(/\D/g, "")}` : "";
  return (
    <div className="home-flow flex flex-col">
      <div className="flow-top">
        <SloganRibbon data={settings.slogan} />
        <GroupHero zalo={zalo} />
      </div>
      <GroupSteps />
      <B2BSection
        data={settings.b2b}
        brand={settings.brand}
        products={b2bProducts}
        industries={settings.b2bHub.industries.flatMap((i) => {
          const c = catalog.find((x) => x.slug === i.slug);
          return c ? [{ name: i.name, slug: i.slug, image: c.image, count: c.count }] : [];
        })}
      />
      {settings.beforeAfter.enabled && <BeforeAfter data={settings.beforeAfter} steps={settings.steps} blank={settings.media.blanks["tshirt-trang"]} />}
      <Testimonials title={settings.sectionTitles.reviews} items={testimonials} />
      <WhyChoose data={settings.whyChoose} />
      {/* Khu mua lẻ */}
      <div className="border-t-2 border-ink bg-surface/60">
        <div className="container-site pt-10 md:pt-14">
          <p className="eyebrow">Mua lẻ</p>
          <h2 className="h-section mt-1.5">Chỉ cần 1 chiếc cho riêng bạn?</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-muted">Vẫn đặt được từ 1 sản phẩm: chọn mẫu có sẵn hoặc tự thiết kế.</p>
        </div>
        {settings.collections.enabled && <CollectionGrid title={settings.collections.title} />}
        <BestSellers title={settings.sectionTitles.bestSellers} items={bestSellers} />
        <RecentlyViewed />
      </div>
    </div>
  );
}
