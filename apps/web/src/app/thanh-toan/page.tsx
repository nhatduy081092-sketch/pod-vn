import type { Metadata } from "next";
import { getSettings } from "@/lib/api";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-6 md:py-10">
      <h1 className="text-2xl font-black md:text-3xl">Thông tin đặt hàng</h1>
      <CheckoutForm shipping={s.shipping} />
    </div>
  );
}
