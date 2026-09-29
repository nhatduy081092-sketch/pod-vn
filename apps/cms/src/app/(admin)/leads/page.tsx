import Link from "next/link";
import { LEAD_STATUS_LABEL, LEAD_STATUSES } from "@pod/shared";
import { adminFetch } from "@/lib/api";
import type { Paged } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { LeadRow, type AdminLead } from "@/components/AdminTables";

export const metadata = { title: "Khách để lại SĐT" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  const data = await adminFetch<Paged<AdminLead>>(`/leads?${qs.toString()}`);
  return (
    <>
      <PageHeader title={`Khách để lại SĐT (${data.total})`} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href="/leads" className={`btn-ghost ${!sp.status ? "bg-brand-light" : ""}`}>
          Tất cả
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link key={s} href={`/leads?status=${s}`} className={`btn-ghost ${sp.status === s ? "bg-brand-light" : ""}`}>
            {LEAD_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto p-0 md:p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Khách</th>
              <th>Chủ đề</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
            {!data.items.length && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-neutral-500">
                  Chưa có khách nào để lại thông tin
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
