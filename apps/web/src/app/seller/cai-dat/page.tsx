import { Suspense } from "react";
import { SellerSettings } from "@/components/seller/SellerDev";

export default function Page() {
  return (
    <Suspense>
      <SellerSettings />
    </Suspense>
  );
}
