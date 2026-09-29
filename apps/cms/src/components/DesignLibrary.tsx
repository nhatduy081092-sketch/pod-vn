"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDesignAssetAction, patchDesignAssetAction, saveDesignAssetAction, templateFromDesignAction, uploadImageAction } from "@/lib/actions";
import { assetUrl } from "@/lib/config";

export type AdminAsset = { id: string; kind: "CLIPART" | "TEMPLATE"; name: string; category: string; tags: string; imageUrl: string; natW: number; natH: number; isActive: boolean; sortOrder: number; createdAt: string };
export type AdminSavedDesign = {
  id: string;
  name: string;
  previewUrl: string;
  updatedAt: string;
  json: { areas?: Record<string, { layers?: unknown[] }> };
  customer: { name: string; phone: string };
  product: { id: string; name: string; printAreas: { key: string; name: string; widthMm: number; heightMm: number }[] };
};

function imageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}`));
    img.src = url;
  });
}

/** Thư viện cho công cụ thiết kế: hình minh hoạ (PNG nền trong) + mẫu thiết kế dựng từ thiết kế đã lưu */
export function DesignLibrary({ assets, saved }: { assets: AdminAsset[]; saved: AdminSavedDesign[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"CLIPART" | "TEMPLATE">("CLIPART");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [pending, start] = useTransition();
  const [pick, setPick] = useState<{ id: string; area: string; name: string; category: string } | null>(null);

  const list = assets.filter((a) => a.kind === tab);
  const cats = useMemo(() => [...new Set(list.map((a) => a.category).filter(Boolean))].sort(), [list]);
  const shown = list.filter((a) => !filter || a.category === filter);

  async function upload(files: FileList | null) {
    const arr = Array.from(files ?? []).slice(0, 40);
    if (!arr.length) return;
    setMsg("");
    let ok = 0;
    const errs: string[] = [];
    for (const [i, f] of arr.entries()) {
      setBusy(`Đang tải ${i + 1}/${arr.length}: ${f.name}`);
      try {
        if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) throw new Error(`${f.name}: chỉ nhận PNG/JPG/WEBP`);
        const { w, h } = await imageSize(f);
        const fd = new FormData();
        fd.append("file", f);
        const up = await uploadImageAction(fd);
        if (!up.ok) throw new Error(`${f.name}: ${up.error}`);
        const r = await saveDesignAssetAction(null, {
          kind: "CLIPART",
          name: f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 80) || "Hình",
          category: cat.trim().slice(0, 40),
          tags: "",
          imageUrl: up.url,
          natW: w,
          natH: h,
          data: null,
          isActive: true,
          sortOrder: 0,
        });
        if (!r.ok) throw new Error(`${f.name}: ${r.error}`);
        ok++;
      } catch (e) {
        errs.push((e as Error).message);
      }
    }
    setBusy("");
    setMsg(`Đã thêm ${ok}/${arr.length} hình.${errs.length ? " Lỗi: " + errs.join("; ") : ""}`);
    router.refresh();
  }

  const patch = (id: string, data: Parameters<typeof patchDesignAssetAction>[1]) =>
    start(async () => {
      const r = await patchDesignAssetAction(id, data);
      if (!r.ok) setMsg(r.error);
      router.refresh();
    });

  const pickDesign = saved.find((d) => d.id === pick?.id);
  const areasWithLayers = pickDesign ? pickDesign.product.printAreas.filter((a) => (pickDesign.json.areas?.[a.key]?.layers?.length ?? 0) > 0) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["CLIPART", `Hình minh hoạ (${assets.filter((a) => a.kind === "CLIPART").length})`],
            ["TEMPLATE", `Mẫu thiết kế (${assets.filter((a) => a.kind === "TEMPLATE").length})`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => (setTab(k), setFilter(""))} className={tab === k ? "btn-primary" : "btn-ghost"}>
            {label}
          </button>
        ))}
        {cats.length > 0 && (
          <select className="input h-9 w-48 px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc nhóm">
            <option value="">Mọi nhóm</option>
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {tab === "CLIPART" ? (
        <div className="card space-y-2">
          <p className="text-sm text-neutral-600">
            Tải hình <b>bạn sở hữu hoặc có giấy phép thương mại</b> (PNG nền trong suốt, cạnh dài ≥ 2000px để in nét). Khách bấm hình trong mục <b>Mẫu → Hình minh hoạ</b> của công cụ thiết kế.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input className="input h-9 w-56 px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Nhóm (VD: Hoa lá, Thể thao)" aria-label="Nhóm cho hình sắp tải" list="asset-cats" />
            <datalist id="asset-cats">
              {cats.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <label className="btn-primary cursor-pointer">
              {busy || "Tải hình (chọn nhiều)"}
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" disabled={!!busy} onChange={(e) => void upload(e.target.files)} />
            </label>
          </div>
        </div>
      ) : (
        <div className="card space-y-3">
          <p className="text-sm text-neutral-600">
            Tạo mẫu từ <b>thiết kế đã lưu</b>: dùng tài khoản khách của bạn trên website, thiết kế trong công cụ rồi bấm <b>Lưu</b>, sau đó chọn ở đây. Mẫu tự co giãn theo mặt in của sản phẩm khác.
          </p>
          {saved.length === 0 ? (
            <p className="text-sm text-neutral-500">Chưa có thiết kế nào được lưu.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <label className="block text-xs">
                <span className="label">Thiết kế đã lưu</span>
                <select
                  className="input h-9 w-72 px-2 text-sm"
                  value={pick?.id ?? ""}
                  onChange={(e) => {
                    const d = saved.find((x) => x.id === e.target.value);
                    const first = d?.product.printAreas.find((a) => (d.json.areas?.[a.key]?.layers?.length ?? 0) > 0);
                    setPick(d ? { id: d.id, area: first?.key ?? "", name: d.name, category: "" } : null);
                  }}
                >
                  <option value="">— Chọn —</option>
                  {saved.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.product.name} · {d.customer.phone}
                    </option>
                  ))}
                </select>
              </label>
              {pick && pickDesign && (
                <>
                  {pickDesign.previewUrl && <img src={assetUrl(pickDesign.previewUrl)} alt="" className="h-16 w-16 rounded border object-contain" />}
                  <label className="block text-xs">
                    <span className="label">Mặt in</span>
                    <select className="input h-9 w-36 px-2 text-sm" value={pick.area} onChange={(e) => setPick({ ...pick, area: e.target.value })}>
                      {areasWithLayers.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs">
                    <span className="label">Tên mẫu</span>
                    <input className="input h-9 w-48 px-2 text-sm" value={pick.name} onChange={(e) => setPick({ ...pick, name: e.target.value })} />
                  </label>
                  <label className="block text-xs">
                    <span className="label">Nhóm</span>
                    <input className="input h-9 w-40 px-2 text-sm" value={pick.category} onChange={(e) => setPick({ ...pick, category: e.target.value })} placeholder="VD: Đồng phục" list="asset-cats2" />
                    <datalist id="asset-cats2">
                      {cats.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                  <button
                    type="button"
                    className="btn-primary h-9"
                    disabled={pending || !pick.area || !pick.name.trim()}
                    onClick={() =>
                      start(async () => {
                        const r = await templateFromDesignAction({ savedDesignId: pick.id, area: pick.area, name: pick.name.trim(), category: pick.category.trim() });
                        setMsg(r.ok ? "✓ Đã tạo mẫu" : r.error);
                        if (r.ok) setPick(null);
                        router.refresh();
                      })
                    }
                  >
                    Tạo mẫu
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {msg && <p className="rounded bg-neutral-100 px-3 py-2 text-sm">{msg}</p>}

      {shown.length === 0 ? (
        <p className="text-sm text-neutral-500">Chưa có mục nào.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((a) => (
            <li key={a.id} className={`card space-y-1.5 p-2 ${a.isActive ? "" : "opacity-50"}`}>
              <img src={assetUrl(a.imageUrl)} alt={a.name} className="aspect-square w-full rounded bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain" />
              <input className="input h-8 px-2 text-xs font-semibold" defaultValue={a.name} onBlur={(e) => e.target.value.trim() && e.target.value !== a.name && patch(a.id, { name: e.target.value.trim() })} aria-label="Tên" />
              <input className="input h-8 px-2 text-xs" defaultValue={a.category} placeholder="Nhóm" onBlur={(e) => e.target.value !== a.category && patch(a.id, { category: e.target.value.trim() })} aria-label="Nhóm" />
              {a.kind === "CLIPART" && (
                <p className="text-[11px] text-neutral-500">
                  {a.natW}×{a.natH}px {Math.max(a.natW, a.natH) < 1500 && <span className="text-amber-600">· nhỏ, in to dễ vỡ</span>}
                </p>
              )}
              <div className="flex gap-1">
                <button type="button" className="btn-ghost flex-1 px-2 py-1 text-xs" disabled={pending} onClick={() => patch(a.id, { isActive: !a.isActive })}>
                  {a.isActive ? "Ẩn" : "Hiện"}
                </button>
                <button
                  type="button"
                  className="btn-danger px-2 py-1 text-xs"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Xoá "${a.name}"? Thiết kế khách đã dùng hình này vẫn giữ nguyên.`)) return;
                    start(async () => {
                      await deleteDesignAssetAction(a.id);
                      router.refresh();
                    });
                  }}
                >
                  Xoá
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
