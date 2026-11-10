import type { Metadata } from "next";
import Link from "next/link";
import { giftGroupsWithItems } from "@/lib/gift-set-data";
import { GiftSetStudio } from "@/components/b2b/GiftSetStudio";

export const metadata: Metadata = {
  title: "Xem logo trên cả bộ quà",
  description: "Tải logo một lần, xem ngay trên áo, bình giữ nhiệt, ly, sổ tay, bút, túi… rồi gửi cả bộ để nhận báo giá kèm mockup.",
  // trang công cụ mới: chưa cho Google lập chỉ mục cho tới khi chủ shop duyệt nội dung SEO
  robots: { index: false, follow: true },
};

export default async function GiftSetPage() {
  const groups = await giftGroupsWithItems();
  return (
    <div className="container-site py-5 md:py-8">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/doanh-nghiep" className="hover:text-ink">Doanh nghiệp</Link> /{" "}
        <span className="text-ink">Xem logo trên cả bộ quà</span>
      </nav>
      <h1 className="mt-3 max-w-4xl text-[32px] font-bold leading-[1.1] tracking-tight md:text-[48px]">Một logo, xem ngay trên cả bộ quà</h1>
      <p className="mt-3 max-w-2xl text-[16px] text-muted md:text-[17px]">
        Tải logo một lần – YALA đặt lên áo, bình, ly, sổ, bút, túi để bạn so cả bộ, tải ảnh trình duyệt nội bộ và gửi một yêu cầu báo giá cho tất cả.
      </p>
      <div className="mt-6 md:mt-8">
        <GiftSetStudio groups={groups} />
      </div>
    </div>
  );
}
