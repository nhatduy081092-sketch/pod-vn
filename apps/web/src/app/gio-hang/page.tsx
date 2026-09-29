import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-site py-6 md:py-10">
      <h1 className="text-2xl font-black md:text-3xl">Giỏ hàng</h1>
      <CartView />
    </div>
  );
}
