import type { Metadata } from "next";
import { findMerchPage } from "@pod/shared";
import { MerchLanding, merchMetadata } from "@/components/seo/MerchLanding";

export const revalidate = 600;
const page = findMerchPage("huy-chuong-in-logo")!;
export function generateMetadata(): Metadata {
  return merchMetadata(page);
}

export default function Page() {
  return <MerchLanding page={page} />;
}
