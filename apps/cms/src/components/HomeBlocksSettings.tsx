"use client";
import { useState } from "react";
import { DEFAULT_LANDING, type HeroSlide, type LandingSettings, type LookHotspot, type SeasonRule } from "@pod/shared";
import { ImageInput } from "./ImageInput";

type S = LandingSettings;
type Props = { value: S; onChange: (fn: (prev: S) => S) => void };

const move = <T,>(arr: T[], i: number, d: -1 | 1) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j]!, a[i]!];
  return a;
};

function Row({ children, onUp, onDown, onDel, title }: { children: React.ReactNode; onUp: () => void; onDown: () => void; onDel: () => void; title: string }) {
  return (
    <li className="rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <b className="text-sm">{title}</b>
        <span className="ml-auto flex gap-1">
          <button type="button" className="btn-ghost px-2 py-1" onClick={onUp} aria-label="Lên">↑</button>
          <button type="button" className="btn-ghost px-2 py-1" onClick={onDown} aria-label="Xuống">↓</button>
          <button type="button" className="btn-danger px-2 py-1" onClick={onDel}>✕</button>
        </span>
      </div>
      {children}
    </li>
  );
}
const Field = ({ label, value, onChange, placeholder, wide }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean }) => (
  <label className={`block ${wide ? "md:col-span-2" : ""}`}>
    <span className="label">{label}</span>
    <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </label>
);
/** Ô nhập danh sách: giữ nguyên chữ đang gõ (dấu phẩy, khoảng trắng), chỉ tách thành mảng khi báo lên */
function ListField({ label, initial, onChange, sep = ",", wide }: { label: string; initial: string; onChange: (items: string[]) => void; sep?: string; wide?: boolean }) {
  const [text, setText] = useState(initial);
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      <input
        className="input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(sep).map((x) => x.trim()).filter(Boolean));
        }}
      />
    </label>
  );
}
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 text-sm">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
  </label>
);

/** Khung thu gọn được – khai báo ngoài component cha để ô nhập không bị mount lại (mất focus) mỗi lần gõ */
function Card({ open, onToggle, title, hint, children }: { id: string; open: boolean; onToggle: () => void; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={onToggle} aria-expanded={open}>
        <h2 className="font-bold">{title}</h2>
        <span className="text-neutral-400">{open ? "−" : "+"}</span>
      </button>
      {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </section>
  );
}

/** Các khối trang chủ mới: slider, theo mùa, bộ sưu tập, trước/sau, shop the look, dòng basic */
export function HomeBlocksSettings({ value: s, onChange }: Props) {
  const set = <K extends keyof S>(k: K, v: Partial<S[K]>) => onChange((p) => ({ ...p, [k]: { ...(p[k] as object), ...v } }));
  const [open, setOpen] = useState<string>("slides");
  const cardProps = (id: string) => ({ id, open: open === id, onToggle: () => setOpen(open === id ? "" : id) });

  const slide = (i: number, v: Partial<HeroSlide>) => set("slides", { items: s.slides.items.map((x, k) => (k === i ? { ...x, ...v } : x)) });
  const rule = (i: number, v: Partial<SeasonRule>) => set("seasonal", { rules: s.seasonal.rules.map((x, k) => (k === i ? { ...x, ...v } : x)) });
  const spot = (i: number, v: Partial<LookHotspot>) => set("lookbook", { hotspots: s.lookbook.hotspots.map((x, k) => (k === i ? { ...x, ...v } : x)) });

  return (
    <div className="space-y-4">
      <Card {...cardProps("slides")} title="Banner slider đầu trang (chiến dịch)" hint="3–5 banner theo chiến dịch. Ảnh ngang ≥ 1400px, người mẫu lệch phải. Để trống ngày = luôn hiện. Tắt slider = dùng hero cũ.">
        <div className="flex flex-wrap items-center gap-4">
          <Toggle label="Hiển thị slider" checked={s.slides.enabled} onChange={(v) => set("slides", { enabled: v })} />
          <label className="flex items-center gap-2 text-sm">
            Tự chuyển sau
            <input type="number" min={3} max={20} className="input w-20" value={Math.round(s.slides.intervalMs / 1000)} onChange={(e) => set("slides", { intervalMs: Math.min(20, Math.max(3, Number(e.target.value) || 6)) * 1000 })} />
            giây
          </label>
        </div>
        <ol className="space-y-3">
          {s.slides.items.map((it, i) => (
            <Row key={i} title={`Slide ${i + 1}: ${it.title || "(chưa đặt tên)"}`} onUp={() => set("slides", { items: move(s.slides.items, i, -1) })} onDown={() => set("slides", { items: move(s.slides.items, i, 1) })} onDel={() => set("slides", { items: s.slides.items.filter((_, k) => k !== i) })}>
              <div className="grid gap-2 md:grid-cols-2">
                <Field label="Nhãn nhỏ" value={it.eyebrow} onChange={(v) => slide(i, { eyebrow: v })} />
                <Field label="Tiêu đề" value={it.title} onChange={(v) => slide(i, { title: v })} />
                <Field label="Mô tả" value={it.subtitle} onChange={(v) => slide(i, { subtitle: v })} wide />
                <Field label="Chữ nút" value={it.ctaLabel} onChange={(v) => slide(i, { ctaLabel: v })} />
                <Field label="Link nút" value={it.href} onChange={(v) => slide(i, { href: v })} placeholder="/bo-suu-tap/pickleball" />
                <label className="block">
                  <span className="label">Màu nền (chữ tự đổi đen/trắng)</span>
                  <input type="color" className="h-9 w-full rounded border" value={it.bg} onChange={(e) => slide(i, { bg: e.target.value })} />
                </label>
                <Field label="Tâm ảnh" value={it.focus} onChange={(v) => slide(i, { focus: v })} placeholder="70% 35%" />
                <Field label="Hiện từ ngày" value={it.startsAt} onChange={(v) => slide(i, { startsAt: v })} placeholder="2026-10-01" />
                <Field label="Đến ngày" value={it.endsAt} onChange={(v) => slide(i, { endsAt: v })} placeholder="2026-11-30" />
                <div className="md:col-span-2">
                  <ImageInput label="Ảnh" value={it.image} onChange={(v) => slide(i, { image: v })} />
                </div>
              </div>
            </Row>
          ))}
        </ol>
        {s.slides.items.length < 8 && (
          <button type="button" className="btn-ghost" onClick={() => set("slides", { items: [...s.slides.items, { ...DEFAULT_LANDING.slides.items[0]!, title: "", subtitle: "", eyebrow: "" }] })}>
            + Thêm slide
          </button>
        )}
      </Card>

      <Card {...cardProps("seasonal")} title="Sản phẩm theo mùa" hint="Tự chọn quy tắc theo tháng hiện tại (giờ Việt Nam). Sản phẩm chọn tay (slug) hiện trước, sau đó đến sản phẩm trong danh mục.">
        <Toggle label="Hiển thị" checked={s.seasonal.enabled} onChange={(v) => set("seasonal", { enabled: v })} />
        <ol className="space-y-3">
          {s.seasonal.rules.map((r, i) => (
            <Row key={i} title={`${r.title} · tháng ${r.months.join(", ")}`} onUp={() => set("seasonal", { rules: move(s.seasonal.rules, i, -1) })} onDown={() => set("seasonal", { rules: move(s.seasonal.rules, i, 1) })} onDel={() => set("seasonal", { rules: s.seasonal.rules.filter((_, k) => k !== i) })}>
              <div className="grid gap-2 md:grid-cols-2">
                <ListField key={`m${i}`} label="Các tháng (VD 10, 11, 12)" initial={r.months.join(", ")} onChange={(v) => rule(i, { months: v.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12) })} />
                <Field label="Nhãn nhỏ" value={r.eyebrow} onChange={(v) => rule(i, { eyebrow: v })} />
                <Field label="Tiêu đề" value={r.title} onChange={(v) => rule(i, { title: v })} />
                <Field label="Link “Xem tất cả”" value={r.href} onChange={(v) => rule(i, { href: v })} />
                <ListField key={`c${i}`} label="Slug danh mục (cách nhau dấu phẩy)" initial={r.categorySlugs.join(", ")} onChange={(v) => rule(i, { categorySlugs: v })} wide />
                <ListField key={`p${i}`} label="Slug sản phẩm ưu tiên (cách nhau dấu phẩy)" initial={r.productSlugs.join(", ")} onChange={(v) => rule(i, { productSlugs: v })} wide />
              </div>
            </Row>
          ))}
        </ol>
        <button type="button" className="btn-ghost" onClick={() => set("seasonal", { rules: [...s.seasonal.rules, { months: [new Date().getMonth() + 1], eyebrow: "", title: "Mới", href: "", categorySlugs: [], productSlugs: [] }] })}>
          + Thêm quy tắc
        </button>
      </Card>

      <Card {...cardProps("collections")} title="Lưới “Mẫu có sẵn” theo chủ đề">
        <Toggle label="Hiển thị" checked={s.collections.enabled} onChange={(v) => set("collections", { enabled: v })} />
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Nhãn nhỏ" value={s.collections.eyebrow} onChange={(v) => set("collections", { eyebrow: v })} />
          <Field label="Tiêu đề" value={s.collections.title} onChange={(v) => set("collections", { title: v })} />
        </div>
      </Card>

      <Card {...cardProps("ba")} title="Trước / sau (custom)" hint="Để trống ảnh “sau” = tự ghép ảnh gốc lên áo thun trắng. Có ảnh áo in thật từ xưởng thì tải lên ô “sau”.">
        <Toggle label="Hiển thị" checked={s.beforeAfter.enabled} onChange={(v) => set("beforeAfter", { enabled: v })} />
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Nhãn nhỏ" value={s.beforeAfter.eyebrow} onChange={(v) => set("beforeAfter", { eyebrow: v })} />
          <Field label="Tiêu đề" value={s.beforeAfter.title} onChange={(v) => set("beforeAfter", { title: v })} />
          <Field label="Mô tả" value={s.beforeAfter.subtitle} onChange={(v) => set("beforeAfter", { subtitle: v })} wide />
          <Field label="Nhãn ảnh trước" value={s.beforeAfter.beforeLabel} onChange={(v) => set("beforeAfter", { beforeLabel: v })} />
          <Field label="Nhãn ảnh sau" value={s.beforeAfter.afterLabel} onChange={(v) => set("beforeAfter", { afterLabel: v })} />
          <Field label="Chữ nút" value={s.beforeAfter.ctaLabel} onChange={(v) => set("beforeAfter", { ctaLabel: v })} />
          <Field label="Link nút" value={s.beforeAfter.href} onChange={(v) => set("beforeAfter", { href: v })} />
          <ListField label="Ý chính (cách nhau dấu |)" initial={s.beforeAfter.points.join(" | ")} sep="|" onChange={(v) => set("beforeAfter", { points: v.slice(0, 5) })} wide />
          <ImageInput label="Ảnh trước (ảnh gốc)" value={s.beforeAfter.before} onChange={(v) => set("beforeAfter", { before: v })} />
          <ImageInput label="Ảnh sau (áo in xong – tuỳ chọn)" value={s.beforeAfter.after} onChange={(v) => set("beforeAfter", { after: v })} />
        </div>
      </Card>

      <Card {...cardProps("look")} title="Shop the look" hint="Ảnh lifestyle hiển thị nguyên tỉ lệ. Vị trí chấm: X/Y từ 0 đến 1 (0,5 = giữa ảnh). Màu = tên màu phân loại (VD Đen) để mở sẵn màu đó.">
        <Toggle label="Hiển thị" checked={s.lookbook.enabled} onChange={(v) => set("lookbook", { enabled: v })} />
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Nhãn nhỏ" value={s.lookbook.eyebrow} onChange={(v) => set("lookbook", { eyebrow: v })} />
          <Field label="Tiêu đề" value={s.lookbook.title} onChange={(v) => set("lookbook", { title: v })} />
          <div className="md:col-span-2">
            <ImageInput label="Ảnh lifestyle" value={s.lookbook.image} onChange={(v) => set("lookbook", { image: v })} />
          </div>
        </div>
        <ol className="space-y-2">
          {s.lookbook.hotspots.map((h, i) => (
            <Row key={i} title={`Chấm ${i + 1}: ${h.label || h.productSlug}`} onUp={() => set("lookbook", { hotspots: move(s.lookbook.hotspots, i, -1) })} onDown={() => set("lookbook", { hotspots: move(s.lookbook.hotspots, i, 1) })} onDel={() => set("lookbook", { hotspots: s.lookbook.hotspots.filter((_, k) => k !== i) })}>
              <div className="grid gap-2 md:grid-cols-5">
                <Field label="Slug sản phẩm" value={h.productSlug} onChange={(v) => spot(i, { productSlug: v.trim() })} wide />
                <Field label="Màu" value={h.color} onChange={(v) => spot(i, { color: v })} />
                <label className="block">
                  <span className="label">X (0–1)</span>
                  <input type="number" step="0.01" min={0} max={1} className="input" value={h.x} onChange={(e) => spot(i, { x: Math.min(1, Math.max(0, Number(e.target.value) || 0)) })} />
                </label>
                <label className="block">
                  <span className="label">Y (0–1)</span>
                  <input type="number" step="0.01" min={0} max={1} className="input" value={h.y} onChange={(e) => spot(i, { y: Math.min(1, Math.max(0, Number(e.target.value) || 0)) })} />
                </label>
                <Field label="Nhãn hiện khi bấm" value={h.label} onChange={(v) => spot(i, { label: v })} wide />
              </div>
            </Row>
          ))}
        </ol>
        {s.lookbook.hotspots.length < 8 && (
          <button type="button" className="btn-ghost" onClick={() => set("lookbook", { hotspots: [...s.lookbook.hotspots, { x: 0.5, y: 0.5, productSlug: "", color: "", label: "" }] })}>
            + Thêm chấm
          </button>
        )}
      </Card>

      <Card {...cardProps("everyday")} title="Dòng basic (YALA Everyday)" hint="Sản phẩm lấy từ danh mục có slug bên dưới (tự tạo sẵn: yala-everyday).">
        <Toggle label="Hiển thị" checked={s.everyday.enabled} onChange={(v) => set("everyday", { enabled: v })} />
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Nhãn nhỏ" value={s.everyday.eyebrow} onChange={(v) => set("everyday", { eyebrow: v })} />
          <Field label="Tiêu đề" value={s.everyday.title} onChange={(v) => set("everyday", { title: v })} />
          <Field label="Mô tả" value={s.everyday.subtitle} onChange={(v) => set("everyday", { subtitle: v })} wide />
          <Field label="Slug danh mục" value={s.everyday.categorySlug} onChange={(v) => set("everyday", { categorySlug: v.trim() })} />
        </div>
      </Card>
    </div>
  );
}
