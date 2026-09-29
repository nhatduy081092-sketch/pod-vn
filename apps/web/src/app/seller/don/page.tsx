import { Suspense } from "react";
import { SellerOrders } from "@/components/seller/SellerOrders";

export default function Page() {
  return (
    <Suspense>
      <SellerOrders />
    </Suspense>
  );
}
