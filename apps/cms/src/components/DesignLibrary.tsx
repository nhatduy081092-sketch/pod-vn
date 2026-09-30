"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ASSET_SHAPE_LABEL,
  ASSET_SHAPES,
  assetShape,
  DESIGN_ASSET_SOURCE_LABEL,
  DESIGN_ASSET_SOURCES,
  DESIGN_ASSET_STATUS_LABEL,
  EVERGREEN_SERIES,
  removeVietnameseTones,
  SEASON_LEAD_DAYS,
  upcomingSeasons,
  type DesignAssetPatch,
  type DesignAssetSource,
  type DesignAssetStatus,
} from "@pod/shared";
import { bulkDesignAssetAction, deleteDesignAssetAction, patchDesignAssetAction, saveDesignAssetAction, templateFromDesignAction, uploadImageAction } from "@/lib/actions";
import { assetUrl } from "@/lib/config";

export type AdminAsset = {
  id: string;
  kind: "CLIPART" | "TEMPLATE";
  name: string;
  category: string;
  tags: string;
  imageUrl: string;
  natW: number;
  natH: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  source?: DesignAssetSource;
  license?: string;
  status?: DesignAssetStatus;
};
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

const PAGE = 60;
const norm = (s: string) => removeVietnameseTones(s).toLowerCase();
const statusOf = (a: AdminAsset): DesignAssetStatus => a.status ?? "APPROVED";
const LICENSE_HINT: Record<DesignAssetSource, string> = {
  SELF: "Người thiết kế (tuỳ chọn)",
  PURCHASED: "Bắt buộc: số giấy phép / đơn mua, VD Envato #123456",
  AI: "Công cụ + prompt, VD Midjourney v7: hoa mai vector…",
  PARTNER: "Tên đối tác + hợp đồng / thoả thuận",
  OPEN: "Tên giấy phép + link, VD MIT – github.com/…",
};
const STATUS_CLS: Record<DesignAssetStatus, string> = { DRAFT: "bg-amber-100 text-amber-800", APPROVED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-700" };

/**
 * Thư viện cho công cụ thiết kế: hình minh hoạ (PNG nền trong) + mẫu thiết kế dựng từ thiết kế đã lưu.
 * Mỗi hình có NGUỒN + GIẤY PHÉP (bằng chứng quyền in bán) và TRẠNG THÁI DUYỆT (hình AI vào hàng chờ duyệt).
 */
export function DesignLibrary({ assets, saved }: { assets: AdminAsset[]; saved: AdminSavedDesign[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"CLIPART" | "TEMPLATE">("CLIPART");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [pending, start] = useTransition();
  const [pick, setPick] = useState<{ id: string; area: string; name: string; category: string } | null>(null);
  // tải lên
  const [up, setUp] = useState<{ category: string; source: DesignAssetSource; license: string; tags: string; approve: boolean }>({ category: "", source: "SELF", license: "", tags: "", approve: true });
  // lọc
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("");
  const [fSource, setFSource] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fShape, setFShape] = useState("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState("");
  const [showPlan, setShowPlan] = useState(true);

  const list = assets.filter((a) => a.kind === tab);
  const cats = useMemo(() => [...new Set(list.map((a) => a.category).filter(Boolean))].sort(), [list]);
  const catCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assets) if (a.kind === "CLIPART" && statusOf(a) === "APPROVED" && a.isActive) m.set(norm(a.category), (m.get(norm(a.category)) ?? 0) + 1);
    return m;
  }, [assets]);
  const drafts = list.filter((a) => statusOf(a) === "DRAFT").length;
  const k = norm(q.trim());
  const shown = list.filter(
    (a) =>
      (!fCat || a.category === fCat) &&
      (!fSource || (a.source ?? "SELF") === fSource) &&
      (!fStatus || (fStatus === "HIDDEN" ? !a.isActive : statusOf(a) === fStatus)) &&
      (!fShape || (a.natW > 0 && assetShape(a.natW, a.natH) === fShape)) &&
      (!k || norm(`${a.name} ${a.tags} ${a.category} ${a.license ?? ""}`).includes(k)),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages);
  const pageItems = shown.slice((cur - 1) * PAGE, cur * PAGE);
  const seasons = useMemo(() => upcomingSeasons(), []);
  const seriesSuggest = useMemo(() => [...new Set([...cats, ...seasons.map((s) => s.name), ...EVERGREEN_SERIES])], [cats, seasons]);

  async function upload(files: FileList | null) {
    const arr = Array.from(files ?? []).slice(0, 100);
    if (!arr.length) return;
    if ((up.source === "PURCHASED" || up.source === "OPEN") && !up.license.trim()) return setMsg("Hình mua bản quyền / nguồn mở: nhập giấy phép và nơi lấy trước khi tải.");
    setMsg("");
    let ok = 0;
    let small = 0;
    const errs: string[] = [];
    for (const [i, f] of arr.entries()) {
      setBusy(`Đang tải ${i + 1}/${arr.length}: ${f.name}`);
      try {
        if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) throw new Error(`${f.name}: chỉ nhận PNG/JPG/WEBP`);
        const { w, h } = await imageSize(f);
        if (Math.max(w, h) < 1500) small++;
        const fd = new FormData();
        fd.append("file", f);
        const r1 = await uploadImageAction(fd);
        if (!r1.ok) throw new Error(`${f.name}: ${r1.error}`);
        const r = await saveDesignAssetAction(null, {
          kind: "CLIPART",
          name: f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 80) || "Hình",
          category: up.category.trim().slice(0, 40),
          tags: up.tags.trim().slice(0, 200),
          imageUrl: r1.url,
          natW: w,
          natH: h,
          data: null,
          isActive: true,
          sortOrder: 0,
          source: up.source,
          license: up.license.trim().slice(0, 300),
          status: up.approve ? "APPROVED" : "DRAFT",
        });
        if (!r.ok) throw new Error(`${f.name}: ${r.error}`);
        ok++;
      } catch (e) {
        errs.push((e as Error).message);
      }
    }
    setBusy("");
    setMsg(
      `Đã thêm ${ok}/${arr.length} hình${up.approve ? "" : " vào hàng CHỜ DUYỆT"}.${small ? ` ${small} hình nhỏ hơn 1500px – in khổ lớn dễ vỡ.` : ""}${errs.length ? " Lỗi: " + errs.slice(0, 5).join("; ") : ""}`,
    );
    router.refresh();
  }

  const patch = (id: string, data: DesignAssetPatch) =>
    start(async () => {
      const r = await patchDesignAssetAction(id, data);
      if (!r.ok) setMsg(r.error);
      router.refresh();
    });

  const bulk = (op: { patch?: DesignAssetPatch; remove?: boolean }, label: string) => {
    const ids = [...sel];
    if (!ids.length) return;
    if (op.remove && !confirm(`Xoá ${ids.length} mục? Thiết kế khách đã dùng hình vẫn giữ nguyên.`)) return;
    start(async () => {
      const r = await bulkDesignAssetAction(ids, op);
      setMsg(r.ok ? `✓ ${label} ${ids.length} mục` : r.error);
      if (r.ok) setSel(new Set());
      router.refresh();
    });
  };
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
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
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setFCat("");
              setSel(new Set());
              setPage(1);
            }}
            className={tab === key ? "btn-primary" : "btn-ghost"}
          >
            {label}
          </button>
        ))}
        {drafts > 0 && (
          <button type="button" className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800" onClick={() => (setFStatus("DRAFT"), setPage(1))}>
            {drafts} hình chờ duyệt →
          </button>
        )}
      </div>

      {/* Kế hoạch nội dung theo mùa */}
      {tab === "CLIPART" && (
        <section className="card">
          <button type="button" className="flex w-full items-center justify-between text-left font-bold" onClick={() => setShowPlan((v) => !v)} aria-expanded={showPlan}>
            Kế hoạch nội dung theo mùa <span className="text-xs font-normal text-neutral-500">{showPlan ? "Thu gọn ▲" : "Mở ▼"}</span>
          </button>
          {showPlan && (
            <>
              <p className="mt-1 text-xs text-neutral-500">
                Nên có sẵn ≥ 20 hình mỗi dịp, chuẩn bị trước {SEASON_LEAD_DAYS} ngày (thiết kế + chạy quảng cáo). Đếm theo tên nhóm trùng tên dịp, chỉ tính hình đã duyệt, đang hiện.
              </p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {seasons.slice(0, 9).map((s) => {
                  const n = catCount.get(norm(s.name)) ?? 0;
                  const urgent = s.daysLeft <= SEASON_LEAD_DAYS + 15 && n < 20;
                  return (
                    <li key={s.name} className={`rounded-lg border p-2 text-sm ${urgent ? "border-red-300 bg-red-50" : "border-neutral-200"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <b>{s.name}</b>
                        <span className={`text-xs ${urgent ? "font-bold text-red-700" : "text-neutral-500"}`}>còn {s.daysLeft} ngày</span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {s.date.toLocaleDateString("vi-VN")} · {s.hint}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span>
                          Có <b>{n}</b>/20 hình
                        </span>
                        <button type="button" className="underline" onClick={() => setUp((u) => ({ ...u, category: s.name }))}>
                          Tải vào nhóm này
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-neutral-600">
                Quanh năm:{" "}
                {EVERGREEN_SERIES.map((e) => (
                  <button key={e} type="button" className="mr-1 mt-1 rounded-full border px-2 py-0.5 hover:border-neutral-500" onClick={() => setUp((u) => ({ ...u, category: e }))}>
                    {e} ({catCount.get(norm(e)) ?? 0})
                  </button>
                ))}
              </p>
            </>
          )}
        </section>
      )}

      {tab === "CLIPART" ? (
        <section className="card space-y-3">
          <p className="text-sm text-neutral-600">
            Tải hình <b>bạn sở hữu hoặc có giấy phép in bán</b> (PNG nền trong suốt, cạnh dài ≥ 2000px). Khách thấy ở <b>Mẫu → Hình minh hoạ</b> của công cụ thiết kế khi hình đã duyệt và đang hiện.
          </p>
          <div className="grid gap-2 md:grid-cols-4">
            <label className="block text-xs">
              <span className="label">Nhóm / bộ sưu tập</span>
              <input className="input" value={up.category} maxLength={40} onChange={(e) => setUp({ ...up, category: e.target.value })} placeholder="VD: Tết Nguyên đán" list="asset-series" />
              <datalist id="asset-series">
                {seriesSuggest.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="block text-xs">
              <span className="label">Nguồn</span>
              <select className="input" value={up.source} onChange={(e) => { const src = e.target.value as DesignAssetSource; setUp({ ...up, source: src, approve: src !== "AI" }); }}>
                {DESIGN_ASSET_SOURCES.map((x) => (
                  <option key={x} value={x}>
                    {DESIGN_ASSET_SOURCE_LABEL[x]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs md:col-span-2">
              <span className="label">Giấy phép / bằng chứng quyền sử dụng</span>
              <input className="input" value={up.license} maxLength={300} onChange={(e) => setUp({ ...up, license: e.target.value })} placeholder={LICENSE_HINT[up.source]} />
            </label>
            <label className="block text-xs md:col-span-2">
              <span className="label">Từ khoá (khách tìm được), cách nhau dấu phẩy</span>
              <input className="input" value={up.tags} maxLength={200} onChange={(e) => setUp({ ...up, tags: e.target.value })} placeholder="VD: hoa mai, lì xì, con ngựa" />
            </label>
            <label className="flex items-center gap-2 self-end text-sm">
              <input type="checkbox" checked={up.approve} onChange={(e) => setUp({ ...up, approve: e.target.checked })} />
              Duyệt luôn (bỏ chọn = vào hàng chờ duyệt)
            </label>
            <label className="btn-primary cursor-pointer self-end text-center">
              {busy || "Tải hình (chọn nhiều, tối đa 100)"}
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" disabled={!!busy} onChange={(e) => void upload(e.target.files)} />
            </label>
          </div>
          {up.source === "AI" && <p className="text-xs text-amber-700">Hình AI: kiểm tra kỹ tay, chữ, logo lạ, hình giống nhân vật/thương hiệu có sẵn trước khi duyệt.</p>}
        </section>
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
                    <input className="input h-9 w-40 px-2 text-sm" value={pick.category} onChange={(e) => setPick({ ...pick, category: e.target.value })} placeholder="VD: Đồng phục lớp" list="asset-series" />
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

      {/* Lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <input className="input h-9 w-56 px-2 text-sm" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="Tìm tên, từ khoá, giấy phép…" aria-label="Tìm" />
        <select className="input h-9 w-44 px-2 text-sm" value={fCat} onChange={(e) => (setFCat(e.target.value), setPage(1))} aria-label="Nhóm">
          <option value="">Mọi nhóm</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="input h-9 w-40 px-2 text-sm" value={fSource} onChange={(e) => (setFSource(e.target.value), setPage(1))} aria-label="Nguồn">
          <option value="">Mọi nguồn</option>
          {DESIGN_ASSET_SOURCES.map((x) => (
            <option key={x} value={x}>
              {DESIGN_ASSET_SOURCE_LABEL[x]}
            </option>
          ))}
        </select>
        <select className="input h-9 w-36 px-2 text-sm" value={fStatus} onChange={(e) => (setFStatus(e.target.value), setPage(1))} aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          {(["DRAFT", "APPROVED", "REJECTED"] as const).map((x) => (
            <option key={x} value={x}>
              {DESIGN_ASSET_STATUS_LABEL[x]}
            </option>
          ))}
          <option value="HIDDEN">Đang ẩn</option>
        </select>
        {tab === "CLIPART" && (
          <select className="input h-9 w-32 px-2 text-sm" value={fShape} onChange={(e) => (setFShape(e.target.value), setPage(1))} aria-label="Dáng ảnh">
            <option value="">Mọi dáng</option>
            {ASSET_SHAPES.map((x) => (
              <option key={x} value={x}>
                {ASSET_SHAPE_LABEL[x]}
              </option>
            ))}
          </select>
        )}
        <span className="text-sm text-neutral-500">{shown.length} mục</span>
      </div>

      {/* Thao tác hàng loạt */}
      {sel.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-300 bg-white p-2 text-sm shadow">
          <b>Đã chọn {sel.size}</b>
          <button type="button" className="btn-primary px-2 py-1 text-xs" disabled={pending} onClick={() => bulk({ patch: { status: "APPROVED", isActive: true } }, "Đã duyệt")}>
            Duyệt
          </button>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pending} onClick={() => bulk({ patch: { status: "REJECTED" } }, "Đã từ chối")}>
            Từ chối
          </button>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pending} onClick={() => bulk({ patch: { isActive: true } }, "Đã hiện")}>
            Hiện
          </button>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pending} onClick={() => bulk({ patch: { isActive: false } }, "Đã ẩn")}>
            Ẩn
          </button>
          <input className="input h-8 w-40 px-2 text-xs" value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} placeholder="Chuyển sang nhóm…" list="asset-series" />
          <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pending || !bulkCat.trim()} onClick={() => bulk({ patch: { category: bulkCat.trim() } }, "Đã chuyển nhóm")}>
            Đổi nhóm
          </button>
          <button type="button" className="btn-danger px-2 py-1 text-xs" disabled={pending} onClick={() => bulk({ remove: true }, "Đã xoá")}>
            Xoá
          </button>
          <button type="button" className="ml-auto text-xs underline" onClick={() => setSel(new Set())}>
            Bỏ chọn
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-neutral-500">Chưa có mục nào.</p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <input type="checkbox" checked={pageItems.every((a) => sel.has(a.id))} onChange={(e) => setSel((s) => { const n = new Set(s); for (const a of pageItems) { if (e.target.checked) n.add(a.id); else n.delete(a.id); } return n; })} />
            Chọn cả trang này
          </label>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {pageItems.map((a) => {
              const st = statusOf(a);
              return (
                <li key={a.id} className={`card relative space-y-1.5 p-2 ${a.isActive ? "" : "opacity-50"} ${sel.has(a.id) ? "ring-2 ring-brand" : ""}`}>
                  <input type="checkbox" className="absolute left-3 top-3 h-4 w-4" checked={sel.has(a.id)} onChange={() => toggle(a.id)} aria-label={`Chọn ${a.name}`} />
                  <img src={assetUrl(a.imageUrl)} alt={a.name} loading="lazy" className="aspect-square w-full rounded bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain" />
                  <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
                    <span className={`rounded px-1.5 py-0.5 ${STATUS_CLS[st]}`}>{DESIGN_ASSET_STATUS_LABEL[st]}</span>
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5" title={a.license || "Chưa ghi giấy phép"}>
                      {DESIGN_ASSET_SOURCE_LABEL[a.source ?? "SELF"]}
                      {a.source === "PURCHASED" && !a.license ? " ⚠" : ""}
                    </span>
                    {a.kind === "CLIPART" && a.natW > 0 && <span className="rounded bg-neutral-100 px-1.5 py-0.5">{ASSET_SHAPE_LABEL[assetShape(a.natW, a.natH)]}</span>}
                  </div>
                  <input className="input h-8 px-2 text-xs font-semibold" defaultValue={a.name} onBlur={(e) => e.target.value.trim() && e.target.value !== a.name && patch(a.id, { name: e.target.value.trim() })} aria-label="Tên" />
                  <input className="input h-8 px-2 text-xs" defaultValue={a.category} placeholder="Nhóm" list="asset-series" onBlur={(e) => e.target.value !== a.category && patch(a.id, { category: e.target.value.trim() })} aria-label="Nhóm" />
                  <input className="input h-8 px-2 text-xs" defaultValue={a.tags} placeholder="Từ khoá" onBlur={(e) => e.target.value !== a.tags && patch(a.id, { tags: e.target.value.trim() })} aria-label="Từ khoá" />
                  <input className="input h-8 px-2 text-xs" defaultValue={a.license ?? ""} placeholder="Giấy phép / nguồn" onBlur={(e) => e.target.value !== (a.license ?? "") && patch(a.id, { license: e.target.value.trim() })} aria-label="Giấy phép" />
                  {a.kind === "CLIPART" && (
                    <p className="text-[11px] text-neutral-500">
                      {a.natW}×{a.natH}px {Math.max(a.natW, a.natH) < 1500 && <span className="text-amber-600">· nhỏ, in to dễ vỡ</span>}
                    </p>
                  )}
                  <div className="flex gap-1">
                    {st !== "APPROVED" ? (
                      <button type="button" className="btn-primary flex-1 px-2 py-1 text-xs" disabled={pending} onClick={() => patch(a.id, { status: "APPROVED", isActive: true })}>
                        Duyệt
                      </button>
                    ) : (
                      <button type="button" className="btn-ghost flex-1 px-2 py-1 text-xs" disabled={pending} onClick={() => patch(a.id, { isActive: !a.isActive })}>
                        {a.isActive ? "Ẩn" : "Hiện"}
                      </button>
                    )}
                    {st === "DRAFT" && (
                      <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pending} onClick={() => patch(a.id, { status: "REJECTED" })}>
                        Từ chối
                      </button>
                    )}
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
              );
            })}
          </ul>
          {pages > 1 && (
            <nav className="flex flex-wrap items-center gap-1" aria-label="Phân trang">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)} className={`h-8 min-w-8 rounded border px-2 text-sm ${n === cur ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
                  {n}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
