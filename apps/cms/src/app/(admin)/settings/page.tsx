import type { LandingSettings } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata = { title: "Nội dung landing" };

export default async function SettingsPage() {
  const data = await adminFetch<LandingSettings>("/settings/landing");
  return (
    <>
      <PageHeader title="Nội dung landing page" />
      <SettingsForm initial={data} />
    </>
  );
}
