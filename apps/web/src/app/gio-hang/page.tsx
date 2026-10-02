import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";
import { getSettings } from "@/lib/api";
import { RecentlyViewed } from "@/components/personal/RecentlyViewed";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-6 md:py-10">
      <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Giỏ hàng</h1>
      <CartView threshold={s.b2bQuote.threshold} freeThreshold={s.shipping.freeThreshold} />
      <RecentlyViewed className="-mx-4 md:-mx-6" />
    </div>
  );
}
