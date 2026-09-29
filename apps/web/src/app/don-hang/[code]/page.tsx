import type { Metadata } from "next";
import { OrderLookup } from "@/components/shop/OrderLookup";

export const metadata: Metadata = { title: "Đơn hàng", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="container-site py-6 md:py-10">
      <OrderLookup initialCode={decodeURIComponent(code).toUpperCase()} justPlaced />
    </div>
  );
}
