import { Suspense } from "react";
import { SellerApi } from "@/components/seller/SellerDev";

export default function Page() {
  return (
    <Suspense>
      <SellerApi />
    </Suspense>
  );
}
