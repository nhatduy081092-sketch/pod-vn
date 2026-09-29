import { Suspense } from "react";
import { SellerPayments } from "@/components/seller/SellerOrders";

export default function Page() {
  return (
    <Suspense>
      <SellerPayments />
    </Suspense>
  );
}
