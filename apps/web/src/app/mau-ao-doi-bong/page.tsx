import type { Metadata } from "next";
import { findDesignHub } from "@pod/shared";
import { HubPage, hubMetadata } from "@/components/seo/HubPage";

export const revalidate = 600;
const hub = findDesignHub("mau-ao-doi-bong")!;
export function generateMetadata(): Metadata {
  return hubMetadata(hub);
}

export default function Page() {
  return <HubPage hub={hub} />;
}
