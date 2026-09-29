import { Suspense } from "react";
import { SellerTemplates } from "@/components/seller/SellerTemplates";

export default function Page() {
  return (
    <Suspense>
      <SellerTemplates />
    </Suspense>
  );
}
