import { Suspense } from "react";
import { SellerTemplateForm } from "@/components/seller/SellerTemplates";

export default function Page() {
  return (
    <Suspense>
      <SellerTemplateForm />
    </Suspense>
  );
}
