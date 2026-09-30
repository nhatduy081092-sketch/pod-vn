import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { PackImporter } from "@/components/PackImporter";

export const metadata = { title: "Nạp bộ hình nguồn mở" };

export default async function ImportPacksPage() {
  const assets = await adminFetch<{ license?: string }[]>("/design-assets?kind=CLIPART");
  const done = assets.map((a) => a.license ?? "").filter((l) => l.includes("github.com/"));
  return (
    <>
      <PageHeader title="Nạp bộ hình nguồn mở từ GitHub" />
      <PackImporter done={done} />
    </>
  );
}
