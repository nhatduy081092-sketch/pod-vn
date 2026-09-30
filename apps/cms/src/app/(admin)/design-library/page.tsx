import Link from "next/link";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { DesignLibrary, type AdminAsset, type AdminSavedDesign } from "@/components/DesignLibrary";

export const metadata = { title: "Thư viện thiết kế" };

export default async function DesignLibraryPage() {
  const [assets, saved] = await Promise.all([adminFetch<AdminAsset[]>("/design-assets"), adminFetch<AdminSavedDesign[]>("/saved-designs")]);
  return (
    <>
      <PageHeader title="Thư viện thiết kế">
        <Link href="/design-library/import" className="btn-ghost h-fit">
          + Nạp bộ hình nguồn mở (GitHub)
        </Link>
      </PageHeader>
      <DesignLibrary assets={assets} saved={saved} />
    </>
  );
}
