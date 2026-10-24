import type { Metadata } from "next";
import { findDesignHub } from "@pod/shared";
import { HubPage, hubMetadata } from "@/components/seo/HubPage";

export const revalidate = 600;
const hub = findDesignHub("mau-ao-gia-dinh")!;
export const metadata: Metadata = hubMetadata(hub);

export default function Page() {
  return <HubPage hub={hub} />;
}
