import type { Metadata } from "next";
import { getSettings } from "@/lib/api";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-6 md:py-10">
      <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Thông tin đặt hàng</h1>
      <CheckoutForm shipping={s.shipping} />
    </div>
  );
}
