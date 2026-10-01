"use client";
import { useEffect } from "react";
import { pushRecent, sendView, setLane, type RecentItem } from "@/lib/personal";

/** Trang sản phẩm: lưu "vừa xem" + đếm lượt xem (bán chạy) + ghi nhận lối khách nếu là sản phẩm doanh nghiệp */
export function RecordView({ product, b2b }: { product: RecentItem; b2b: boolean }) {
  useEffect(() => {
    pushRecent(product);
    sendView(product.id);
    if (b2b) setLane("b2b");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  return null;
}
