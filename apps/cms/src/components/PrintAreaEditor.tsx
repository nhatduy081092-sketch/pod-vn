"use client";
import { useRef, useState, useTransition, type PointerEvent as RPE } from "react";
import { useRouter } from "next/navigation";
import { formatVND, PRINT_AREA_PRESETS, printAreasSaveSchema, printPixelSize, type PrintAreaInput } from "@pod/shared";
import { savePrintAreasAction } from "@/lib/actions";
import { assetUrl } from "@/lib/config";
import type { AdminPrintArea } from "@/lib/types";
import { ImageInput } from "./ImageInput";

const toInput = (a: AdminPrintArea): PrintAreaInput => ({
  id: a.id,
  key: a.key,
  name: a.name,
  widthMm: a.widthMm,
  heightMm: a.heightMm,
  dpi: a.dpi,
  bleedMm: a.bleedMm ?? 0,
  safeMm: a.safeMm ?? 0,
  sizeSpecs: a.sizeSpecs ?? {},
  tips: a.tips ?? "",
  warp: a.warp === "cylinder" ? "cylinder" : "",
  mockupImage: a.mockupImage,
  maskImage: a.maskImage,
  overlayImage: a.overlayImage,
  zoneX: a.zoneX,
  zoneY: a.zoneY,
  zoneW: a.zoneW,
  zoneH: a.zoneH,
  extraPrice: a.extraPrice,
});

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Kéo khung vùng in trên ảnh sản phẩm (tỉ lệ 0–1 so với ảnh) */
function ZonePicker({ image, mask, zone, onChange }: { image: string; mask: string; zone: { x: number; y: number; w: number; h: number }; onChange: (z: { x: number; y: number; w: number; h: number }) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; z: typeof zone } | null>(null);
  // khung = đúng tỉ lệ ảnh (editor cũng tính vùng in theo ảnh, không theo khung vuông)
  const [ratio, setRatio] = useState(1);

  function start(e: RPE<HTMLElement>, mode: "move" | "resize") {
    e.stopPropagation();
    e.preventDefault();
    const box = ref.current!.getBoundingClientRect();
    drag.current = { mode, sx: (e.clientX - box.left) / box.width, sy: (e.clientY - box.top) / box.height, z: zone };
    ref.current!.setPointerCapture(e.pointerId);
  }
  function move(e: RPE<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const box = ref.current!.getBoundingClientRect();
    const dx = (e.clientX - box.left) / box.width - d.sx;
    const dy = (e.clientY - box.top) / box.height - d.sy;
    if (d.mode === "move") onChange({ ...d.z, x: r3(clamp(d.z.x + dx, 0, 1 - d.z.w)), y: r3(clamp(d.z.y + dy, 0, 1 - d.z.h)) });
    else onChange({ ...d.z, w: r3(clamp(d.z.w + dx, 0.02, 1 - d.z.x)), h: r3(clamp(d.z.h + dy, 0.02, 1 - d.z.y)) });
  }

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[320px] touch-none select-none overflow-hidden rounded-lg border bg-neutral-100"
      style={{ aspectRatio: String(ratio) }}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {image ? (
        <img
          src={assetUrl(image)}
          alt=""
          onLoad={(e) => {
            const im = e.currentTarget;
            if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
          }}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">Chưa có ảnh</span>
      )}
      {mask && <img src={assetUrl(mask)} alt="" className="pointer-events-none absolute inset-0 h-full w-full opacity-20" />}
      <div
        className="absolute cursor-move border-2 border-dashed border-[#2563eb] bg-[#2563eb]/15"
        style={{ left: `${zone.x * 100}%`, top: `${zone.y * 100}%`, width: `${zone.w * 100}%`, height: `${zone.h * 100}%` }}
        onPointerDown={(e) => start(e, "move")}
      >
        <span className="absolute left-1 top-1 rounded bg-[#2563eb] px-1 text-[10px] font-bold text-white">Vùng in</span>
        <span className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-sm border-2 border-[#2563eb] bg-white" onPointerDown={(e) => start(e, "resize")} aria-label="Đổi cỡ vùng in" />
      </div>
    </div>
  );
}

/**
 * Mặt in = nơi khách thiết kế. Kích thước thật (mm) + DPI quyết định file in xuất ra.
 * Khung trên ảnh chỉ để hiển thị trong editor; file in luôn đúng tỉ lệ mm.
 */
export function PrintAreaEditor({ productId, productImage, initial, sizes = [] }: { productId: string; productImage: string; initial: AdminPrintArea[]; sizes?: string[] }) {
  const router = useRouter();
  const [areas, setAreas] = useState<PrintAreaInput[]>(() => initial.map(toInput));
  const [open, setOpen] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const patch = (i: number, p: Partial<PrintAreaInput>) => setAreas((a) => a.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const intIn = (v: string) => Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0));

  function addPreset(key: string) {
    const p = PRINT_AREA_PRESETS.find((x) => x.key === key);
    if (!p) return;
    let k = p.key;
    for (let i = 2; areas.some((a) => a.key === k); i++) k = `${p.key}-${i}`;
    setAreas((a) => [...a, { ...p, key: k, mockupImage: "", maskImage: "", overlayImage: "", bleedMm: 0, safeMm: 0, sizeSpecs: {}, tips: "", warp: "" }]);
    setOpen(areas.length);
  }

  function save() {
    const parsed = printAreasSaveSchema.safeParse({ areas });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ" });
    start(async () => {
      const r = await savePrintAreasAction(productId, parsed.data.areas);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: "✓ Đã lưu mặt in" });
      router.refresh();
    });
  }

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-bold">Mặt in (dùng cho công cụ thiết kế)</h2>
        <p className="text-xs text-neutral-500">
          Nhập <b>kích thước thật</b> vùng in (mm) và DPI file in theo máy in của xưởng. Kéo khung xanh trên ảnh để chỉ vị trí in khi khách xem trước. Sản phẩm in toàn thân dùng thêm ảnh mask (vùng trắng = in được).
        </p>
      </div>
      <ul className="space-y-2">
        {areas.map((a, i) => {
          const px = printPixelSize(a);
          return (
            <li key={a.id ?? a.key + i} className="rounded-lg border">
              <button type="button" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span className="font-semibold">
                  {i + 1}. {a.name} <span className="font-mono text-xs text-neutral-400">({a.key})</span>
                </span>
                <span className="text-xs text-neutral-500">
                  {a.widthMm / 10}×{a.heightMm / 10} cm · {a.dpi} DPI{a.extraPrice ? ` · +${formatVND(a.extraPrice)}` : ""} {open === i ? "▲" : "▼"}
                </span>
              </button>
              {open === i && (
                <div className="grid gap-4 border-t p-3 md:grid-cols-[320px_1fr]">
                  <div>
                    <ZonePicker image={a.mockupImage || productImage} mask={a.maskImage} zone={{ x: a.zoneX, y: a.zoneY, w: a.zoneW, h: a.zoneH }} onChange={(z) => patch(i, { zoneX: z.x, zoneY: z.y, zoneW: z.w, zoneH: z.h })} />
                    <p className="mt-1 text-[11px] text-neutral-500">Kéo khung để di chuyển, kéo ô góc dưới phải để đổi cỡ.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block text-xs">
                        <span className="label">Tên mặt in</span>
                        <input className="input" value={a.name} onChange={(e) => patch(i, { name: e.target.value })} />
                      </label>
                      <label className="block text-xs">
                        <span className="label">Mã (không dấu)</span>
                        <input className="input font-mono" value={a.key} onChange={(e) => patch(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                      </label>
                      <label className="block text-xs">
                        <span className="label">Rộng (mm)</span>
                        <input className="input" inputMode="numeric" value={a.widthMm} onChange={(e) => patch(i, { widthMm: intIn(e.target.value) })} />
                      </label>
                      <label className="block text-xs">
                        <span className="label">Cao (mm)</span>
                        <input className="input" inputMode="numeric" value={a.heightMm} onChange={(e) => patch(i, { heightMm: intIn(e.target.value) })} />
                      </label>
                      <label className="block text-xs">
                        <span className="label">DPI file in</span>
                        <select className="input" value={a.dpi} onChange={(e) => patch(i, { dpi: Number(e.target.value) })}>
                          {[72, 100, 150, 200, 300].map((d) => (
                            <option key={d} value={d}>
                              {d} DPI
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs">
                        <span className="label">Kiểu xem trước</span>
                        <select className="input" value={a.warp} onChange={(e) => patch(i, { warp: e.target.value === "cylinder" ? "cylinder" : "" })}>
                          <option value="">Phẳng (áo, tranh, cờ, gối…)</option>
                          <option value="cylinder">Cuộn quanh thân (cốc, bình)</option>
                        </select>
                        {a.warp === "cylinder" && <span className="text-[11px] text-neutral-500">Rộng = chu vi dải in, khung xanh = mặt nhìn thấy trên ảnh.</span>}
                      </label>
                      <label className="block text-xs">
                        <span className="label">Phụ phí khi in mặt này (₫)</span>
                        <input className="input" inputMode="numeric" value={a.extraPrice || ""} placeholder="0" onChange={(e) => patch(i, { extraPrice: intIn(e.target.value) })} />
                      </label>
                    </div>
                    <p className="rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-600">
                      File in xuất ra: <b>{px.w}×{px.h} px</b> ở {px.dpi} DPI{px.dpi < a.dpi ? " (máy khách hạ DPI để vừa giới hạn điện thoại; file cho xưởng vẫn dựng đủ DPI)" : ""}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block text-xs">
                        <span className="label">Viền tràn mỗi cạnh (mm)</span>
                        <input className="input" inputMode="numeric" value={a.bleedMm || ""} placeholder="0" onChange={(e) => patch(i, { bleedMm: intIn(e.target.value) })} />
                        <span className="text-[11px] text-neutral-500">Đã nằm trong kích thước trên, bị xén sau khi in (tranh, poster, cờ: thường 3–5 mm).</span>
                      </label>
                      <label className="block text-xs">
                        <span className="label">Vùng an toàn (mm, từ đường xén vào)</span>
                        <input className="input" inputMode="numeric" value={a.safeMm || ""} placeholder="0" onChange={(e) => patch(i, { safeMm: intIn(e.target.value) })} />
                        <span className="text-[11px] text-neutral-500">Chữ/logo nằm ngoài vùng này sẽ bị cảnh báo (đường may, mép bọc khung…).</span>
                      </label>
                    </div>
                    <SizeSpecsInput sizes={sizes} base={{ w: a.widthMm, h: a.heightMm }} dpi={a.dpi} value={a.sizeSpecs} onChange={(v) => patch(i, { sizeSpecs: v })} />
                    <label className="block text-xs">
                      <span className="label">Gợi ý thiết kế cho khách (tuỳ chọn)</span>
                      <textarea className="input" rows={2} maxLength={600} value={a.tips} placeholder="VD: Dùng ảnh phủ kín tới mép ngoài; chữ cách mép ít nhất 3 cm vì phần mép bọc vào khung." onChange={(e) => patch(i, { tips: e.target.value })} />
                    </label>
                    <ImageInput label="Ảnh sản phẩm của mặt này (trống = ảnh đại diện)" value={a.mockupImage} onChange={(v) => patch(i, { mockupImage: v })} />
                    <ImageInput label="Mask in toàn thân (tuỳ chọn, PNG trắng/trong suốt)" value={a.maskImage} onChange={(v) => patch(i, { maskImage: v })} />
                    <ImageInput label="Lớp viền/bóng đè lên (tuỳ chọn)" value={a.overlayImage} onChange={(v) => patch(i, { overlayImage: v })} />
                    <div className="flex gap-2 text-xs">
                      <button type="button" className="text-neutral-600 underline" disabled={i === 0} onClick={() => setAreas((x) => { const y = [...x]; [y[i - 1], y[i]] = [y[i]!, y[i - 1]!]; return y; })}>
                        ↑ Lên
                      </button>
                      <button type="button" className="ml-auto text-red-600 underline" onClick={() => setAreas((x) => x.filter((_, k) => k !== i))}>
                        Xoá mặt in
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-auto" value="" onChange={(e) => addPreset(e.target.value)} aria-label="Thêm mặt in">
          <option value="">+ Thêm mặt in…</option>
          {PRINT_AREA_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name} ({p.widthMm / 10}×{p.heightMm / 10} cm)
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={save} disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu mặt in"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </section>
  );
}

/** Kích thước vùng in riêng theo từng size (VD cờ, tranh nhiều khổ). Để trống = dùng kích thước chung */
function SizeSpecsInput({
  sizes,
  base,
  dpi,
  value,
  onChange,
}: {
  sizes: string[];
  base: { w: number; h: number };
  dpi: number;
  value: Record<string, { widthMm: number; heightMm: number }>;
  onChange: (v: Record<string, { widthMm: number; heightMm: number }>) => void;
}) {
  const on = Object.keys(value).length > 0;
  const list = [...new Set([...sizes, ...Object.keys(value)])];
  if (!list.length) return <p className="text-[11px] text-neutral-500">Thêm phân loại size ở trên để khai kích thước vùng in riêng từng size.</p>;
  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0));
  const set = (size: string, k: "widthMm" | "heightMm", v: number) => {
    const cur = value[size] ?? { widthMm: base.w, heightMm: base.h };
    onChange({ ...value, [size]: { ...cur, [k]: v } });
  };
  return (
    <div className="rounded-lg border border-dashed p-2 text-xs">
      <label className="flex items-center gap-2 font-semibold">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked ? Object.fromEntries(list.map((s) => [s, { widthMm: base.w, heightMm: base.h }])) : {})}
        />
        Vùng in khác nhau theo size (cờ, tranh, poster nhiều khổ…)
      </label>
      {on && (
        <>
          <p className="mt-1 text-[11px] text-neutral-500">
            Khách thiết kế trên kích thước chung ({base.w}×{base.h} mm); file in từng size được co giãn đều, giữ viền tràn. Nên để kích thước chung = size lớn nhất.
          </p>
          <table className="mt-2 w-full">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="font-medium">Size</th>
                <th className="font-medium">Rộng (mm)</th>
                <th className="font-medium">Cao (mm)</th>
                <th className="font-medium">File in</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((size) => {
                const v = value[size];
                const ratioOff = v && Math.abs(v.widthMm / Math.max(1, v.heightMm) - base.w / Math.max(1, base.h)) > 0.03;
                const px = v ? printPixelSize({ widthMm: v.widthMm, heightMm: v.heightMm, dpi }, 64_000_000) : null;
                return (
                  <tr key={size} className="border-t">
                    <td className="py-1 pr-2 font-semibold">{size}</td>
                    <td className="py-1 pr-2">
                      {v ? <input className="input py-1" inputMode="numeric" value={v.widthMm} onChange={(e) => set(size, "widthMm", num(e.target.value))} /> : <span className="text-neutral-400">chung</span>}
                    </td>
                    <td className="py-1 pr-2">
                      {v ? <input className="input py-1" inputMode="numeric" value={v.heightMm} onChange={(e) => set(size, "heightMm", num(e.target.value))} /> : <span className="text-neutral-400">chung</span>}
                    </td>
                    <td className={`py-1 pr-2 ${ratioOff ? "text-amber-700" : "text-neutral-500"}`}>
                      {px ? `${px.w}×${px.h}px${ratioOff ? " · khác tỉ lệ" : ""}` : "–"}
                    </td>
                    <td className="py-1 text-right">
                      {v ? (
                        <button
                          type="button"
                          className="text-red-600 underline"
                          onClick={() => {
                            const { [size]: _drop, ...rest } = value;
                            onChange(rest);
                          }}
                        >
                          bỏ
                        </button>
                      ) : (
                        <button type="button" className="underline" onClick={() => set(size, "widthMm", base.w)}>
                          khai
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.some((sz) => value[sz] && Math.abs(value[sz]!.widthMm / Math.max(1, value[sz]!.heightMm) - base.w / Math.max(1, base.h)) > 0.03) && (
            <p className="mt-1 text-[11px] text-amber-700">Size khác tỉ lệ với kích thước chung: thiết kế được co vừa và căn giữa, ảnh nền phủ kín được giữ phủ kín.</p>
          )}
        </>
      )}
    </div>
  );
}
