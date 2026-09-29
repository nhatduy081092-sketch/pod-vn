import type { ContentPage } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { PagesManager } from "@/components/PagesManager";

export const metadata = { title: "Trang nội dung" };

export default async function PagesPage() {
  const pages = await adminFetch<ContentPage[]>("/pages");
  return (
    <>
      <PageHeader title="Trang nội dung" />
      <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Các trang chính sách hiện là <b>nội dung mẫu</b>. Hãy chỉnh theo thực tế trước khi chạy quảng cáo (Meta/Google/TikTok yêu cầu có chính sách đổi trả,
        bảo mật, thông tin liên hệ rõ ràng).
      </p>
      <PagesManager pages={pages} />
    </>
  );
}
