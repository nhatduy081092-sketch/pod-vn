import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";
import { getSettings } from "@/lib/api";
import { RecentlyViewed } from "@/components/personal/RecentlyViewed";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-6 md:py-10">
      <h1 className="text-2xl font-black md:text-3xl">Giỏ hàng</h1>
      <CartView threshold={s.b2bQuote.threshold} freeThreshold={s.shipping.freeThreshold} />
      <RecentlyViewed className="-mx-4 md:-mx-6" />
    </div>
  );
}
