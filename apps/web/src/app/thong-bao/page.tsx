import type { Metadata } from "next";
import { formatDateVN } from "@pod/shared";
import { ContentRenderer } from "@/components/ContentRenderer";
import { getNotices } from "@/lib/api";

export const metadata: Metadata = { title: "Thông báo", alternates: { canonical: "/thong-bao" } };
export const revalidate = 60;

export default async function NoticesPage() {
  const notices = await getNotices();
  return (
    <div className="container-site max-w-3xl py-6 md:py-12">
      <h1 className="text-2xl font-black md:text-4xl">Thông báo</h1>
      <p className="mt-1 text-sm text-ink/60">Lịch nghỉ sản xuất, thay đổi vận chuyển và chương trình đang áp dụng.</p>
      {notices.length ? (
        <ul className="mt-6 space-y-4">
          {notices.map((n) => (
            <li key={n.id} id={n.id} className={`rounded-xl border-2 p-4 md:p-5 ${n.level === "warning" ? "border-amber-400 bg-amber-50" : "border-ink/10 bg-white"}`}>
              <p className="text-xs text-ink/60">
                {formatDateVN(n.startsAt)}
                {n.endsAt ? ` – ${formatDateVN(n.endsAt)}` : ""}
              </p>
              <h2 className="mb-2 text-lg font-extrabold">{n.title}</h2>
              {n.content && <ContentRenderer content={n.content} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-ink/60">Hiện chưa có thông báo nào.</p>
      )}
    </div>
  );
}
