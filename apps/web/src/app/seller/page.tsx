import { Suspense } from "react";
import { SellerDashboard } from "@/components/seller/SellerTemplates";

export default function Page() {
  return (
    <Suspense>
      <SellerDashboard />
    </Suspense>
  );
}
