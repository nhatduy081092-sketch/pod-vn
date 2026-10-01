"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HELP_CATEGORIES, helpArticleUpsertSchema, type HelpArticleInput } from "@pod/shared";
import { deleteHelpAction, saveHelpAction } from "@/lib/actions";
import { WEB_URL } from "@/lib/config";

export type AdminHelp = { id: string; slug: string; category: string; title: string; content: string; sortOrder: number; isPublished: boolean; updatedAt: string };

const EMPTY: HelpArticleInput = { slug: "", category: "bat-dau", title: "", content: "", sortOrder: 0, isPublished: true };
const catName = (k: string) => HELP_CATEGORIES.find((c) => c.key === k)?.name ?? k;

/** Help Center: bài hướng dẫn theo nhóm, khách tìm được không dấu trên web /ho-tro */
export function HelpManager({ initial }: { initial: AdminHelp[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<HelpArticleInput>(EMPTY);
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const list = useMemo(() => initial.filter((a) => !filter || a.category === filter), [initial, filter]);

  const open = (a?: AdminHelp) => {
    setErr("");
    setEditing(a?.id ?? "new");
    setF(a ? { slug: a.slug, category: a.category as HelpArticleInput["category"], title: a.title, content: a.content, sortOrder: a.sortOrder, isPublished: a.isPublished } : EMPTY);
  };

  function save() {
    const parsed = helpArticleUpsertSchema.safeParse(f);
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "Không hợp lệ");
    start(async () => {
      const r = await saveHelpAction(editing === "new" ? null : editing, parsed.data);
      if (!r.ok) return setErr(r.error);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,520px)]">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button className="btn-brand" onClick={() => open()}>
            + Viết bài
          </button>
          <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc nhóm">
            <option value="">Tất cả nhóm ({initial.length})</option>
            {HELP_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.name} ({initial.filter((a) => a.category === c.key).length})
              </option>
            ))}
          </select>
        </div>
        <div className="card overflow-x-auto p-0 md:p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Nhóm</th>
                <th>#</th>
                <th>Hiện</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button className="text-left font-semibold hover:text-brand-dark" onClick={() => open(a)}>
                      {a.title}
                    </button>
                    <a href={`${WEB_URL}/ho-tro/${a.slug}`} target="_blank" rel="noreferrer" className="block text-xs text-neutral-400">
                      /ho-tro/{a.slug} ↗
                    </a>
                  </td>
                  <td className="text-xs">{catName(a.category)}</td>
                  <td>{a.sortOrder}</td>
                  <td>{a.isPublished ? "✓" : <span className="text-neutral-400">Nháp</span>}</td>
                  <td className="text-right">
                    <button
                      className="btn-danger px-2 py-1"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm(`Xoá bài "${a.title}"?`)) return;
                        start(async () => {
                          await deleteHelpAction(a.id);
                          router.refresh();
                        });
                      }}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <div className="card h-fit space-y-3">
          <h2 className="font-bold">{editing === "new" ? "Viết bài hướng dẫn" : "Sửa bài"}</h2>
          <label className="block">
            <span className="label">Tiêu đề *</span>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </label>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <label className="block">
              <span className="label">Nhóm</span>
              <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as HelpArticleInput["category"] })}>
                {HELP_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Thứ tự</span>
              <input className="input" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) || 0 })} />
            </label>
          </div>
          <label className="block">
            <span className="label">Slug (để trống tự tạo)</span>
            <input className="input" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Nội dung *</span>
            <textarea className="input font-mono text-sm" rows={14} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
            <span className="mt-1 block text-xs text-neutral-500">
              Định dạng: <code>## Tiêu đề</code>, dòng bắt đầu <code>- </code> là gạch đầu dòng, <code>**chữ đậm**</code>, link <code>[chữ](https://...)</code>.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.isPublished} onChange={(e) => setF({ ...f, isPublished: e.target.checked })} className="h-4 w-4 accent-[#E4570B]" />
            Hiển thị trên website
          </label>
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
