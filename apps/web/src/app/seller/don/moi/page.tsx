import { Suspense } from "react";
import { SellerOrderNew } from "@/components/seller/SellerOrders";

export default function Page() {
  return (
    <Suspense>
      <SellerOrderNew />
    </Suspense>
  );
}
