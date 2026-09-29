import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { DesignLibrary, type AdminAsset, type AdminSavedDesign } from "@/components/DesignLibrary";

export const metadata = { title: "Thư viện thiết kế" };

export default async function DesignLibraryPage() {
  const [assets, saved] = await Promise.all([adminFetch<AdminAsset[]>("/design-assets"), adminFetch<AdminSavedDesign[]>("/saved-designs")]);
  return (
    <>
      <PageHeader title="Thư viện thiết kế" />
      <DesignLibrary assets={assets} saved={saved} />
    </>
  );
}
