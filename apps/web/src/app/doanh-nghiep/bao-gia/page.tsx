import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/api";
import { QuoteCartView } from "@/components/b2b/QuoteCartView";

export const metadata: Metadata = {
  title: "Danh sách yêu cầu báo giá",
  description: "Gom nhiều sản phẩm và gửi 1 yêu cầu báo giá cho doanh nghiệp.",
  robots: { index: false, follow: true },
};

export default async function QuoteListPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-5 md:py-8">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/doanh-nghiep" className="hover:text-ink">Doanh nghiệp</Link> /{" "}
        <span className="text-ink">Yêu cầu báo giá</span>
      </nav>
      <h1 className="h-section mt-2">Yêu cầu báo giá</h1>
      <p className="mt-1.5 max-w-2xl text-[15px] text-muted">Điền số lượng từng sản phẩm, gửi 1 lần – YALA báo giá theo số lượng kèm mockup logo miễn phí.</p>
      <div className="mt-6">
        <QuoteCartView
          solutions={s.b2bHub.solutions.map((x) => ({ key: x.key, title: x.title }))}
          salesZalo={s.b2bQuote.salesZalo || s.brand.zalo}
          salesName={s.b2bQuote.salesName}
          hotline={s.brand.hotline}
          responseTime={s.b2bQuote.responseTime}
        />
      </div>
    </div>
  );
}
