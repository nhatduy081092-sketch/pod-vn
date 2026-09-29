"use client";
import { ProductGallery } from "./ProductGallery";
import { useAttachedDesign } from "./DesignCard";

/** Ảnh sản phẩm báo giá: ưu tiên ảnh xem trước thiết kế của khách (nếu có) */
export function QuoteGallery({ productId, images, name }: { productId: string; images: string[]; name: string }) {
  const design = useAttachedDesign(productId);
  const list = [...(design?.files.map((f) => f.previewUrl) ?? []), ...images];
  return <ProductGallery key={design?.updatedAt ?? 0} images={list} name={name} frameClass="border-2 border-navy" />;
}
