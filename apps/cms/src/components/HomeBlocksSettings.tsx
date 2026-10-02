"use client";
import { useState } from "react";
import { DEFAULT_LANDING, type HeroSlide, type Lane, type LandingSettings, type LookHotspot, type SeasonRule } from "@pod/shared";
import { ImageInput } from "./ImageInput";
import { B2BPricingCard } from "./B2BPricingCard";
import { QuoteRoutingCard } from "./QuoteRoutingCard";

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

/** Danh sách nhiều cột dạng textarea: mỗi dòng 1 mục, các cột cách nhau bằng "|" (giữ nguyên chữ đang gõ) */
function PipeLines<T>({ label, hint, rows, cols, toRow, fromRow, onChange, max = 20 }: {
  label: string;
  hint: string;
  rows: T[];
  cols: number;
  toRow: (r: T) => string[];
  fromRow: (c: string[]) => T | null;
  onChange: (rows: T[]) => void;
  max?: number;
}) {
  const [text, setText] = useState(rows.map((r) => toRow(r).join(" | ")).join("\n"));
  return (
    <label className="block md:col-span-2">
      <span className="label">{label}</span>
      <textarea
        className="input font-mono text-[13px]"
        rows={Math.min(12, Math.max(3, rows.length + 1))}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const out = e.target.value
            .split("\n")
            .map((l) => l.split("|").map((x) => x.trim()))
            .filter((c) => c[0])
            .map((c) => fromRow([...c, ...Array(cols).fill("")].slice(0, cols)))
            .filter((x): x is T => x !== null)
            .slice(0, max);
          onChange(out);
        }}
      />
      <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>
    </label>
  );
}

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function LaneEditor({ lane, onChange, name }: { lane: Lane; onChange: (v: Partial<Lane>) => void; name: string }) {
  return (
    <fieldset className="rounded-lg border p-3">
      <legend className="px-1 text-sm font-bold">{name}</legend>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Nhãn" value={lane.label} onChange={(v) => onChange({ label: v })} />
        <Field label="Tiêu đề" value={lane.title} onChange={(v) => onChange({ title: v })} />
        <ListField label="Các ý chính (cách nhau dấu ;)" sep=";" initial={lane.points.join("; ")} onChange={(v) => onChange({ points: v.slice(0, 5) })} wide />
        <Field label="Chữ nút chính" value={lane.ctaLabel} onChange={(v) => onChange({ ctaLabel: v })} />
        <Field label="Link nút chính" value={lane.href} onChange={(v) => onChange({ href: v })} />
        <Field label="Chữ link phụ" value={lane.secondaryLabel} onChange={(v) => onChange({ secondaryLabel: v })} />
        <Field label="Link phụ" value={lane.secondaryHref} onChange={(v) => onChange({ secondaryHref: v })} />
        <div className="md:col-span-2">
          <ImageInput label="Ảnh (để trống ở lối Doanh nghiệp = hình minh hoạ bộ quà)" value={lane.image} onChange={(v) => onChange({ image: v })} />
        </div>
      </div>
    </fieldset>
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
      <Card {...cardProps("positioning")} title="Định vị + 2 lối vào (Cá nhân | Doanh nghiệp)" hint="Phần ĐẦU trang chủ (ngay dưới slogan): câu định vị (tiêu đề chính h1), 2 thẻ lối vào và hàng dịch vụ.">
        <Toggle label="Hiển thị" checked={s.positioning.enabled} onChange={(v) => set("positioning", { enabled: v })} />
        <Field label="Câu định vị" value={s.positioning.statement} onChange={(v) => set("positioning", { statement: v })} wide />
        <div className="grid gap-3 lg:grid-cols-2">
          <LaneEditor name="Lối Cá nhân" lane={s.positioning.personal} onChange={(v) => set("positioning", { personal: { ...s.positioning.personal, ...v } })} />
          <LaneEditor name="Lối Doanh nghiệp" lane={s.positioning.business} onChange={(v) => set("positioning", { business: { ...s.positioning.business, ...v } })} />
        </div>
        <PipeLines
          label="Dịch vụ (tối đa 6)"
          hint="Mỗi dòng: Tên dịch vụ | Mô tả ngắn | Link"
          rows={s.positioning.services}
          cols={3}
          max={6}
          toRow={(r) => [r.title, r.desc, r.href]}
          fromRow={([title, desc, href]) => ({ title: title!, desc: desc!, href: href! })}
          onChange={(v) => set("positioning", { services: v })}
        />
      </Card>

      <Card {...cardProps("b2bQuote")} title="Báo giá doanh nghiệp (đơn lớn)" hint="Ngưỡng chuyển từ mua online sang báo giá, Zalo sales và kênh nhận yêu cầu (Telegram, Google Sheets + Email).">
        <QuoteRoutingCard value={s.b2bQuote} onChange={(v) => set("b2bQuote", v)} brandZalo={s.brand.zalo} />
      </Card>

      <Card {...cardProps("b2bPricing")} title="Giá B2B (sản phẩm nhập từ nguồn)" hint="Công thức giá bán cho sản phẩm đồng bộ từ nhà cung cấp: theo giá nguồn, cộng %, hoặc chỉ báo giá. Có xem trước trước khi áp dụng.">
        <B2BPricingCard value={s.b2bPricing} onChange={(v) => set("b2bPricing", v)} />
      </Card>

      <Card {...cardProps("b2bHub")} title="Trang Doanh nghiệp (/doanh-nghiep)" hint="Ngành hàng, giải pháp theo dịp, quy trình, lợi ích. Số liệu & khách hàng sửa ở khối “Giải pháp doanh nghiệp” phía trên.">
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Nhãn nhỏ" value={s.b2bHub.eyebrow} onChange={(v) => set("b2bHub", { eyebrow: v })} />
          <Field label="Tiêu đề (H1)" value={s.b2bHub.title} onChange={(v) => set("b2bHub", { title: v })} />
          <Field label="Mô tả" value={s.b2bHub.subtitle} onChange={(v) => set("b2bHub", { subtitle: v })} wide />
          <PipeLines
            label="Ngành hàng (hiện trên menu Doanh nghiệp)"
            hint="Mỗi dòng: Tên ngành | slug danh mục | mô tả ngắn. Slug trùng danh mục có sản phẩm → thẻ dẫn vào danh mục; chưa có → dẫn tới form báo giá. Danh mục có slug ở đây sẽ ẩn khỏi menu Cá nhân."
            rows={s.b2bHub.industries}
            cols={3}
            max={16}
            toRow={(r) => [r.name, r.slug, r.blurb]}
            fromRow={([name, slug, blurb]) => ({ name: name!, slug: slugify(slug || name!), blurb: blurb! })}
            onChange={(v) => set("b2bHub", { industries: v })}
          />
          <PipeLines
            label="Giải pháp theo dịp"
            hint="Mỗi dòng: Tên giải pháp | mô tả | gợi ý món (VD: Lịch Tết · Bình giữ nhiệt) | mã (dùng cho link ?dip=) | từ khoá lọc sản phẩm, cách nhau dấu phẩy (VD: binh giu nhiet, so tay, lich)"
            rows={s.b2bHub.solutions}
            cols={5}
            max={12}
            toRow={(r) => [r.title, r.desc, r.items, r.key, r.keywords]}
            fromRow={([title, desc, items, key, keywords]) => ({ title: title!, desc: desc!, items: items!, key: slugify(key || title!), keywords: keywords! })}
            onChange={(v) => set("b2bHub", { solutions: v })}
          />
          <PipeLines
            label="Quy trình"
            hint="Mỗi dòng: Bước | mô tả"
            rows={s.b2bHub.process}
            cols={2}
            max={8}
            toRow={(r) => [r.title, r.desc]}
            fromRow={([title, desc]) => ({ title: title!, desc: desc! })}
            onChange={(v) => set("b2bHub", { process: v })}
          />
          <PipeLines
            label="Vì sao chọn YALA"
            hint="Mỗi dòng: Lợi ích | mô tả"
            rows={s.b2bHub.benefits}
            cols={2}
            max={9}
            toRow={(r) => [r.title, r.desc]}
            fromRow={([title, desc]) => ({ title: title!, desc: desc! })}
            onChange={(v) => set("b2bHub", { benefits: v })}
          />
        </div>
      </Card>

      <Card {...cardProps("media")} title="Hình ảnh (chỉ hiện ảnh thật)" hint="Ẩn sản phẩm chỉ có ảnh vẽ 2D khỏi trang chủ, danh mục, tìm kiếm, gợi ý. Ảnh phôi trơn thật do lệnh AI tạo (deploy/ai-photos.sh).">
        <Toggle label="Chỉ hiện sản phẩm có ảnh thật" checked={s.media.hide2d} onChange={(v) => set("media", { hide2d: v })} />
        <p className="text-sm text-neutral-600">
          Phôi trơn đã có ảnh thật: <b>{Object.keys(s.media.blanks).length}</b>/30
          {Object.keys(s.media.blanks).length < 30 && " – tải ảnh lên tại menu Ảnh thật AI → Phôi trơn"}
        </p>
      </Card>

      <Card {...cardProps("heroPlay")} title="Hero cắt dán (dự phòng)" hint="Chỉ hiện khi TẮT khối “Định vị + 2 lối vào” (khối đó đang làm phần đầu trang chủ). Tắt cả hai = dùng banner slider bên dưới.">
        <Toggle label="Hiển thị hero cắt dán" checked={s.heroPlay.enabled} onChange={(v) => set("heroPlay", { enabled: v })} />
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Tiêu đề (mỗi câu kết thúc bằng dấu chấm = 1 dòng)" value={s.heroPlay.title} onChange={(v) => set("heroPlay", { title: v })} wide />
          <Field label="Mô tả" value={s.heroPlay.subtitle} onChange={(v) => set("heroPlay", { subtitle: v })} wide />
          <Field label="Chữ nút chính" value={s.heroPlay.ctaLabel} onChange={(v) => set("heroPlay", { ctaLabel: v })} />
          <Field label="Link nút chính" value={s.heroPlay.href} onChange={(v) => set("heroPlay", { href: v })} />
          <Field label="Chữ nút phụ" value={s.heroPlay.secondaryLabel} onChange={(v) => set("heroPlay", { secondaryLabel: v })} />
          <Field label="Link nút phụ" value={s.heroPlay.secondaryHref} onChange={(v) => set("heroPlay", { secondaryHref: v })} />
          <ListField
            label="3 mẫu áo chữ (mã mẫu, cách nhau dấu phẩy – xem ở /bo-suu-tap, VD chuyen-phong-gym-1)"
            initial={s.heroPlay.designs.join(", ")}
            onChange={(v) => set("heroPlay", { designs: v.slice(0, 4) })}
            wide
          />
          <ListField
            label="Nhãn chủ đề trôi (mã bộ sưu tập, VD ca-phe-tra-sua, tet-li-xi)"
            initial={s.heroPlay.stickers.join(", ")}
            onChange={(v) => set("heroPlay", { stickers: v.slice(0, 8) })}
            wide
          />
          <div className="md:col-span-2">
            <ImageInput label="Ảnh thật ở giữa (người mẫu mặc áo, dọc 4:5)" value={s.heroPlay.image} onChange={(v) => set("heroPlay", { image: v })} />
          </div>
        </div>
      </Card>

      <Card {...cardProps("slogan")} title="Slogan thương hiệu (đầu trang)" hint="Mỗi từ 1 dòng tiếng Anh – chữ cái đầu tự tô màu cam (Young, Ambitious, Limitless, Authentic → YALA).">
        <Toggle label="Hiển thị" checked={s.slogan.enabled} onChange={(v) => set("slogan", { enabled: v })} />
        <div className="grid gap-2 md:grid-cols-2">
          <ListField label="Các từ (cách nhau dấu phẩy)" initial={s.slogan.words.join(", ")} onChange={(v) => set("slogan", { words: v.slice(0, 6) })} wide />
          <Field label="Câu tiếng Việt" value={s.slogan.vi} onChange={(v) => set("slogan", { vi: v })} wide />
        </div>
      </Card>

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
