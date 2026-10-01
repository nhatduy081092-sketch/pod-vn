"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateTimeVN, noticeUpsertSchema, type NoticeInput } from "@pod/shared";
import { deleteNoticeAction, saveNoticeAction } from "@/lib/actions";

export type AdminNotice = {
  id: string;
  title: string;
  content: string;
  level: "info" | "warning";
  showBanner: boolean;
  showOnProduct: boolean;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
};

const local = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const iso = (v: string) => (v ? new Date(v).toISOString() : null);

const EMPTY: NoticeInput = { title: "", content: "", level: "warning", showBanner: true, showOnProduct: true, startsAt: null, endsAt: null, isActive: true };

function status(n: AdminNotice) {
  const now = Date.now();
  if (!n.isActive) return { t: "Tắt", c: "bg-neutral-200 text-neutral-600" };
  if (new Date(n.startsAt).getTime() > now) return { t: "Sắp hiện", c: "bg-sky-100 text-sky-800" };
  if (n.endsAt && new Date(n.endsAt).getTime() <= now) return { t: "Đã hết hạn", c: "bg-neutral-200 text-neutral-600" };
  return { t: "Đang hiện", c: "bg-green-100 text-green-800" };
}

/** Thông báo: lịch nghỉ lễ, tạm ngưng sản xuất, thay đổi chính sách – hiện dải trên cùng web và/hoặc trên trang sản phẩm */
export function NoticeManager({ initial }: { initial: AdminNotice[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<NoticeInput>(EMPTY);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const open = (n?: AdminNotice) => {
    setErr("");
    setEditing(n?.id ?? "new");
    setF(n ? { title: n.title, content: n.content, level: n.level, showBanner: n.showBanner, showOnProduct: n.showOnProduct, startsAt: n.startsAt, endsAt: n.endsAt, isActive: n.isActive } : EMPTY);
  };

  function save() {
    const parsed = noticeUpsertSchema.safeParse(f);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Không hợp lệ");
    start(async () => {
      const r = await saveNoticeAction(editing === "new" ? null : editing, f);
      if (!r.ok) return setErr(r.error);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-2">
        <button className="btn-brand" onClick={() => open()}>
          + Thêm thông báo
        </button>
        {initial.length === 0 && <p className="card text-sm text-neutral-500">Chưa có thông báo nào. Dùng cho lịch nghỉ lễ, tạm ngưng sản xuất, thay đổi phí ship...</p>}
        {initial.map((n) => {
          const st = status(n);
          return (
            <div key={n.id} className="card flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {n.level === "warning" ? "⚠️ " : "ℹ️ "}
                  {n.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDateTimeVN(n.startsAt)} → {n.endsAt ? formatDateTimeVN(n.endsAt) : "không hết hạn"} · {n.showBanner ? "Dải trên cùng" : ""}
                  {n.showBanner && n.showOnProduct ? " + " : ""}
                  {n.showOnProduct ? "Trang sản phẩm" : ""}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.c}`}>{st.t}</span>
              <button className="btn-ghost px-2 py-1" onClick={() => open(n)}>
                Sửa
              </button>
              <button
                className="btn-danger px-2 py-1"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Xoá thông báo này?")) return;
                  start(async () => {
                    await deleteNoticeAction(n.id);
                    router.refresh();
                  });
                }}
              >
                Xoá
              </button>
            </div>
          );
        })}
      </div>
      {editing && (
        <div className="card h-fit space-y-3">
          <h2 className="font-bold">{editing === "new" ? "Thêm thông báo" : "Sửa thông báo"}</h2>
          <label className="block">
            <span className="label">Tiêu đề *</span>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="VD: Nghỉ lễ 2/9 – tạm ngưng sản xuất" />
          </label>
          <label className="block">
            <span className="label">Nội dung</span>
            <textarea className="input" rows={4} value={f.content ?? ""} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="Đơn đặt trong thời gian nghỉ sẽ sản xuất từ ngày..." />
          </label>
          <label className="block">
            <span className="label">Mức độ</span>
            <select className="input" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as "info" | "warning" })}>
              <option value="warning">Cảnh báo (vàng)</option>
              <option value="info">Thông tin (xanh)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="label">Bắt đầu hiện</span>
              <input className="input" type="datetime-local" value={local(f.startsAt as string | null)} onChange={(e) => setF({ ...f, startsAt: iso(e.target.value) })} />
            </label>
            <label className="block">
              <span className="label">Kết thúc</span>
              <input className="input" type="datetime-local" value={local(f.endsAt as string | null)} onChange={(e) => setF({ ...f, endsAt: iso(e.target.value) })} />
            </label>
          </div>
          {(
            [
              ["showBanner", "Hiện dải thông báo trên cùng website"],
              ["showOnProduct", "Hiện trên trang sản phẩm"],
              ["isActive", "Bật"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="h-4 w-4 accent-[#E4570B]" />
              {label}
            </label>
          ))}
          {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={save} disabled={pending}>
              Lưu
            </button>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
