"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { removeVietnameseTones } from "@pod/shared";

export type GalleryItem = { id?: string; url: string; name: string; label?: string; natW: number; natH: number };

/** Lưu ảnh vừa tải vào Kho ảnh của tôi (chưa đăng nhập -> bỏ qua) */
export async function saveToGallery(item: GalleryItem): Promise<boolean> {
  try {
    const res = await fetch("/api/account/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: item.url, name: item.name.slice(0, 80), natW: item.natW, natH: item.natH }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const norm = (s: string) => removeVietnameseTones(s).toLowerCase();

/**
 * Kho ảnh của tôi: ảnh đã tải lên (theo tài khoản, dùng lại ở mọi sản phẩm).
 * Chưa đăng nhập: chỉ hiện ảnh tải trong phiên này.
 */
export function MyGallery({ session, refreshKey, onPick, loginHref }: { session: GalleryItem[]; refreshKey: number; onPick: (g: GalleryItem) => void; loginHref: string }) {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [logged, setLogged] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<GalleryItem | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/account/assets")
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 401) return setLogged(false);
        setLogged(true);
        setItems(r.ok ? ((await r.json()) as GalleryItem[]) : []);
      })
      .catch(() => alive && setLogged(false));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const all = useMemo(() => {
    const list = logged ? (items ?? []) : [];
    const seen = new Set(list.map((x) => x.url));
    return [...session.filter((x) => !seen.has(x.url)), ...list];
  }, [items, logged, session]);
  const labels = useMemo(() => [...new Set(all.map((x) => x.label).filter((x): x is string => !!x))].sort(), [all]);
  const shown = all.filter((x) => (!label || x.label === label) && (!q || norm(`${x.name} ${x.label ?? ""}`).includes(norm(q))));

  async function update(item: GalleryItem, patch: { name?: string; label?: string }) {
    if (!item.id) return;
    setErr("");
    const res = await fetch(`/api/account/assets/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => null);
    if (!res?.ok) return setErr("Không lưu được, thử lại");
    setItems((l) => (l ?? []).map((x) => (x.id === item.id ? { ...x, ...patch } : x)));
    setSel(null);
  }
  async function remove(item: GalleryItem) {
    if (!item.id) return;
    const res = await fetch(`/api/account/assets/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setErr("Không xoá được, thử lại");
    setItems((l) => (l ?? []).filter((x) => x.id !== item.id));
    setSel(null);
  }

  if (!all.length && logged === false)
    return (
      <p className="rounded-lg bg-cream px-3 py-2 text-[11px] text-ink/70">
        <Link href={loginHref} className="font-bold underline">
          Đăng nhập
        </Link>{" "}
        để ảnh tải lên được lưu vào <b>Kho ảnh của tôi</b> và dùng lại ở mọi sản phẩm.
      </p>
    );
  if (!all.length) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink/70">
          {logged ? "Kho ảnh của tôi" : "Ảnh đã tải (phiên này)"} <span className="font-normal">({all.length})</span>
        </p>
        {logged && (
          <button
            type="button"
            className="text-[11px] font-bold underline"
            onClick={() => {
              setEditing((v) => !v);
              setSel(null);
            }}
          >
            {editing ? "Xong" : "Sắp xếp"}
          </button>
        )}
      </div>
      {all.length > 8 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, nhãn…" className="w-full rounded-md border border-ink/15 px-2 py-1 text-xs" aria-label="Tìm ảnh" />}
      {labels.length > 0 && (
        <div className="no-scrollbar flex gap-1 overflow-x-auto text-[10px] font-bold">
          {["", ...labels].map((l) => (
            <button key={l || "all"} type="button" onClick={() => setLabel(l)} className={`shrink-0 rounded-full border px-2 py-0.5 ${label === l ? "border-ink bg-brand" : "border-ink/15"}`}>
              {l || "Tất cả"}
            </button>
          ))}
        </div>
      )}
      <ul className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto">
        {shown.map((u) => (
          <li key={u.url}>
            <button
              type="button"
              onClick={() => (editing ? setSel(u) : onPick(u))}
              className={`block aspect-square w-full overflow-hidden rounded border bg-[#f4f4f5] ${sel?.url === u.url ? "border-ink ring-2 ring-brand" : "border-ink/15"}`}
              title={`${u.name}${u.label ? ` · ${u.label}` : ""}`}
            >
              <img src={u.url} alt={u.name} loading="lazy" className="h-full w-full object-contain" />
            </button>
          </li>
        ))}
      </ul>
      {editing && sel && (
        <EditRow key={sel.url} item={sel} labels={labels} onSave={(p) => void update(sel, p)} onDelete={() => void remove(sel)} />
      )}
      {editing && !sel && <p className="text-[11px] text-ink/55">Bấm vào ảnh để đổi tên, gắn nhãn hoặc xoá.</p>}
      {err && <p className="text-[11px] text-red-700">{err}</p>}
    </div>
  );
}

function EditRow({ item, labels, onSave, onDelete }: { item: GalleryItem; labels: string[]; onSave: (p: { name: string; label: string }) => void; onDelete: () => void }) {
  const [name, setName] = useState(item.name);
  const [label, setLabel] = useState(item.label ?? "");
  return (
    <div className="space-y-1.5 rounded-lg border border-ink/15 p-2 text-xs">
      <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-ink/15 px-2 py-1" aria-label="Tên ảnh" />
      <input value={label} maxLength={40} list="yala-labels" onChange={(e) => setLabel(e.target.value)} placeholder="Nhãn (VD: logo, lớp 12A)" className="w-full rounded border border-ink/15 px-2 py-1" aria-label="Nhãn" />
      <datalist id="yala-labels">
        {labels.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" className="btn-sm !text-red-600" onClick={onDelete}>
          Xoá khỏi kho
        </button>
        <button type="button" className="btn-sm !border-ink !bg-brand font-bold" onClick={() => onSave({ name, label })}>
          Lưu
        </button>
      </div>
    </div>
  );
}
