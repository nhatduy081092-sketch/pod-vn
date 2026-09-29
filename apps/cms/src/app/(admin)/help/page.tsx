import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { HelpManager, type AdminHelp } from "@/components/HelpManager";
import { WEB_URL } from "@/lib/config";

export const metadata = { title: "Help Center" };

export default async function HelpPage() {
  const items = await adminFetch<AdminHelp[]>("/help");
  return (
    <>
      <PageHeader title={`Help Center (${items.length} bài)`}>
        <a href={`${WEB_URL}/ho-tro`} target="_blank" rel="noreferrer" className="btn-ghost">
          Xem trên web ↗
        </a>
      </PageHeader>
      <HelpManager initial={items} />
    </>
  );
}
