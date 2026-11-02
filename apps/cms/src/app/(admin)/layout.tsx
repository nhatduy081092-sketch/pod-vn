import { requireToken } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireToken();
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-10 pt-5 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
