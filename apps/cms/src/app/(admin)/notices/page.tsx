import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { NoticeManager, type AdminNotice } from "@/components/NoticeManager";

export const metadata = { title: "Thông báo" };

export default async function NoticesPage() {
  const items = await adminFetch<AdminNotice[]>("/notices");
  return (
    <>
      <PageHeader title="Thông báo (nghỉ lễ, tạm ngưng sản xuất…)" />
      <NoticeManager initial={items} />
    </>
  );
}
