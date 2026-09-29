"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PAGES, pageSlugSchema, pageUpsertSchema, slugify, type ContentPage } from "@pod/shared";
import { deletePageAction, savePageAction } from "@/lib/actions";
import { WEB_URL } from "@/lib/config";

const HELP = "## Tiêu đề mục   ·   - gạch đầu dòng   ·   **chữ đậm**   ·   dòng trống để tách đoạn";

export function PagesManager({ pages }: { pages: ContentPage[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const isDefault = (slug: string) => DEFAULT_PAGES.some((p) => p.slug === slug);

  const open = (p?: ContentPage) => {
    setMsg(null);
    setIsNew(!p);
    setEditing(p ? { ...p } : { slug: "", title: "", content: "", showInFooter: true, sortOrder: pages.length });
  };

  const save = () => {
    if (!editing) return;
    const slug = isNew ? slugify(editing.slug || editing.title) : editing.slug;
    const s = pageSlugSchema.safeParse(slug);
    if (!s.success) return setMsg({ ok: false, text: s.error.issues[0]?.message ?? "Slug không hợp lệ" });
    const parsed = pageUpsertSchema.safeParse(editing);
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Không hợp lệ" });
    start(async () => {
      const r = await savePageAction(slug, parsed.data);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: "✓ Đã lưu – website đã cập nhật" });
      setIsNew(false);
      setEditing({ ...editing, slug });
      router.refresh();
    });
  };

  const remove = (p: ContentPage) => {
    const text = isDefault(p.slug) ? `Khôi phục "${p.title}" về nội dung mẫu?` : `Xoá trang "${p.title}"?`;
    if (!confirm(text)) return;
    start(async () => {
      await deletePageAction(p.slug);
      setEditing(null);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="card h-fit space-y-1 p-2 md:p-2">
        {pages.map((p) => (
          <button
            key={p.slug}
            onClick={() => open(p)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 ${editing?.slug === p.slug && !isNew ? "bg-brand-light font-semibold" : ""}`}
          >
            {p.title}
            <span className="block text-xs text-neutral-400">
              /trang/{p.slug} {!p.showInFooter && "· ẩn khỏi footer"}
            </span>
          </button>
        ))}
        <button className="btn-brand mt-2 w-full" onClick={() => open()}>
          + Thêm trang
        </button>
      </div>

      {editing ? (
        <div className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_100px]">
            <label className="block">
              <span className="label">Tiêu đề *</span>
              <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Slug (URL)</span>
              <input
                className="input"
                value={editing.slug}
                disabled={!isNew}
                placeholder="tự tạo từ tiêu đề"
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Thứ tự</span>
              <input className="input" type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })} />
            </label>
          </div>
          <label className="block">
            <span className="label">Nội dung</span>
            <textarea
              className="input min-h-[420px] font-mono text-[13px] leading-relaxed"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
            <span className="mt-1 block text-xs text-neutral-500">{HELP}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.showInFooter} onChange={(e) => setEditing({ ...editing, showInFooter: e.target.checked })} />
            Hiện link ở footer
          </label>
          {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={save} disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu trang"}
            </button>
            {!isNew && (
              <a href={`${WEB_URL}/trang/${editing.slug}`} target="_blank" rel="noreferrer" className="btn-ghost">
                Xem trên web ↗
              </a>
            )}
            {!isNew && (
              <button className="btn-danger ml-auto" onClick={() => remove(editing)} disabled={pending}>
                {isDefault(editing.slug) ? "Khôi phục mẫu" : "Xoá trang"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card flex items-center justify-center text-sm text-neutral-500">Chọn một trang bên trái để chỉnh sửa</div>
      )}
    </div>
  );
}
