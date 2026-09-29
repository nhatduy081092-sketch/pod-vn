import { Suspense } from "react";
import { SellerCsvImport } from "@/components/seller/SellerOrders";

export default function Page() {
  return (
    <Suspense>
      <SellerCsvImport />
    </Suspense>
  );
}
