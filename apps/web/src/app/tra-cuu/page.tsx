import type { Metadata } from "next";
import { OrderLookup } from "@/components/shop/OrderLookup";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description: "Tra cứu trạng thái đơn in áo bằng mã đơn và số điện thoại.",
};

export default function LookupPage() {
  return (
    <div className="container-site py-6 md:py-10">
      <h1 className="text-center text-2xl font-black md:text-3xl">Tra cứu đơn hàng</h1>
      <p className="mt-1 text-center text-sm text-ink/60">Nhập mã đơn (trong tin nhắn xác nhận) và số điện thoại đặt hàng.</p>
      <OrderLookup />
    </div>
  );
}
