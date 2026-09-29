import { adminFetch } from "@/lib/api";
import type { AdminTestimonial } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { TestimonialManager } from "@/components/TestimonialManager";

export const metadata = { title: "Đánh giá" };

export default async function TestimonialsPage() {
  const items = await adminFetch<AdminTestimonial[]>("/testimonials");
  return (
    <>
      <PageHeader title="Đánh giá khách hàng" />
      <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Chỉ đăng đánh giá thật (có đơn hàng, được khách đồng ý). Đánh giá giả vi phạm chính sách quảng cáo Meta/Google/TikTok và luật bảo vệ người tiêu dùng.
      </p>
      <TestimonialManager items={items} />
    </>
  );
}
