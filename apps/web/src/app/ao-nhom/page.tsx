import type { Metadata } from "next";
import { segmentByKey } from "@pod/shared";
import { SegmentPage, segmentMetadata } from "@/components/segments/SegmentPage";

export const revalidate = 300;
const segment = segmentByKey("hoi-nhom");
export const metadata: Metadata = segmentMetadata(segment);

export default function Page() {
  return <SegmentPage segment={segment} />;
}
