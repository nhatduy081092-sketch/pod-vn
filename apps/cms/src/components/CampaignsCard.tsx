"use client";
import { useState } from "react";
import { campaignLive, type Campaign, type LandingSettings } from "@pod/shared";
import { ImageInput } from "./ImageInput";
import { campaignSaleAction } from "@/lib/actions";
import { WEB_URL } from "@/lib/config";

type S = LandingSettings;

const Txt = ({ label, value, onChange, wide, type = "text" }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; type?: string }) => (
  <label className={`block ${wide ? "md:col-span-2" : ""}`}>
    <span className="label">{label}</span>
    <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

/** Ô danh sách: giữ nguyên chữ đang gõ, tách theo dấu phẩy khi báo lên */
function List({ label, initial, onChange, wide }: { label: string; initial: string[]; onChange: (v: string[]) => void; wide?: boolean }) {
  const [text, setText] = useState(initial.join(", "));
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      <input
        className="input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(",").map((x) => x.trim()).filter(Boolean));
        }}
      />
    </label>
  );
}

/** Nhiều dòng, mỗi dòng các cột cách nhau "|" */
function Pipes<T>({ label, hint, rows, cols, toRow, fromRow, onChange }: { label: string; hint: string; rows: T[]; cols: number; toRow: (r: T) => string[]; fromRow: (c: string[]) => T | null; onChange: (v: T[]) => void }) {
  const [text, setText] = useState(rows.map((r) => toRow(r).join(" | ")).join("\n"));
  return (
    <label className="block md:col-span-2">
      <span className="label">{label}</span>
      <textarea
        className="input font-mono text-[13px]"
        rows={Math.min(8, Math.max(2, rows.length + 1))}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split("\n")
              .map((l) => l.split("|").map((x) => x.trim()))
              .filter((c) => c[0])
              .map((c) => fromRow([...c, ...Array(cols).fill("")].slice(0, cols)))
              .filter((x): x is T => x !== null),
          );
        }}
      />
      <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>
    </label>
  );
}

/** Chiến dịch theo dịp (trang /dip/...): nội dung, thời gian, hạn chót, ưu đãi, tab sản phẩm */
export function CampaignsCard({ value, onChange }: { value: S; onChange: (fn: (p: S) => S) => void }) {
  const list = value.campaigns;
  const [openSlug, setOpenSlug] = useState(list[0]?.slug ?? "");
  const [msg, setMsg] = useState<Record<string, string>>({});
  const up = (slug: string, patch: Partial<Campaign>) => onChange((p) => ({ ...p, campaigns: p.campaigns.map((c) => (c.slug === slug ? { ...c, ...patch } : c)) }));

  async function sale(slug: string, mode: "apply" | "clear") {
    setMsg((m) => ({ ...m, [slug]: "Đang xử lý…" }));
    const r = await campaignSaleAction(slug, mode);
    setMsg((m) => ({ ...m, [slug]: r.ok ? (mode === "apply" ? `Đã đặt giá ưu đãi cho ${r.count} sản phẩm (hết hạn khi chiến dịch kết thúc).` : `Đã gỡ giá ưu đãi của ${r.count} sản phẩm.`) : r.error }));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Mỗi dịp có trang riêng <code>/dip/&lt;mã&gt;</code>. Trong thời gian chạy, web tự hiện thanh thông báo + nút &quot;Quà …&quot; trên menu (dịp kết thúc sớm nhất được ưu tiên). Muốn ẩn một dịp: bỏ chọn &quot;Bật&quot; (không xoá).
      </p>
      {list.map((c) => {
        const open = openSlug === c.slug;
        const live = campaignLive(c);
        return (
          <div key={c.slug} className="rounded-lg border">
            <button type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => setOpenSlug(open ? "" : c.slug)}>
              <span className="h-5 w-5 shrink-0 rounded-full border" style={{ backgroundColor: c.accent }} />
              <b>{c.name}</b>
              <span className="text-xs text-neutral-500">
                {c.startsAt} → {c.endsAt}
              </span>
              {!c.enabled ? <span className="rounded bg-neutral-100 px-1.5 text-xs">Tắt</span> : live ? <span className="rounded bg-green-100 px-1.5 text-xs text-green-800">Đang chạy</span> : null}
              <span className="ml-auto text-neutral-400">{open ? "−" : "+"}</span>
            </button>
            {open && (
              <div className="grid gap-2 border-t p-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" checked={c.enabled} onChange={(e) => up(c.slug, { enabled: e.target.checked })} /> Bật
                  <a href={`${WEB_URL}/dip/${c.slug}`} target="_blank" rel="noreferrer" className="ml-auto text-blue-600 hover:underline">
                    Xem trang /dip/{c.slug} ↗
                  </a>
                </label>
                <Txt label="Tên ngắn (menu, thanh thông báo)" value={c.name} onChange={(v) => up(c.slug, { name: v })} />
                <Txt label="Nhãn nhỏ" value={c.eyebrow} onChange={(v) => up(c.slug, { eyebrow: v })} />
                <Txt label="Tiêu đề (H1)" value={c.title} onChange={(v) => up(c.slug, { title: v })} wide />
                <Txt label="Mô tả" value={c.subtitle} onChange={(v) => up(c.slug, { subtitle: v })} wide />
                <Txt label="Bắt đầu" type="date" value={c.startsAt} onChange={(v) => up(c.slug, { startsAt: v })} />
                <Txt label="Kết thúc" type="date" value={c.endsAt} onChange={(v) => up(c.slug, { endsAt: v })} />
                <Txt label="Hạn chót đặt để nhận kịp (đếm ngược)" type="date" value={c.deadline} onChange={(v) => up(c.slug, { deadline: v })} />
                <label className="block">
                  <span className="label">% ưu đãi (0 = không)</span>
                  <input className="input" type="number" min={0} max={70} value={c.discountPercent} onChange={(e) => up(c.slug, { discountPercent: Math.max(0, Math.min(70, Math.round(Number(e.target.value) || 0))) })} />
                </label>
                <label className="block">
                  <span className="label">Màu nền</span>
                  <input className="input h-10" type="color" value={c.bg} onChange={(e) => up(c.slug, { bg: e.target.value })} />
                </label>
                <label className="block">
                  <span className="label">Màu nhấn</span>
                  <input className="input h-10" type="color" value={c.accent} onChange={(e) => up(c.slug, { accent: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.dark} onChange={(e) => up(c.slug, { dark: e.target.checked })} /> Nền tối (chữ trắng)
                </label>
                <div className="md:col-span-2">
                  <ImageInput label="Ảnh banner (ảnh chụp thật; trống = ghép mẫu chữ)" value={c.heroImage} onChange={(v) => up(c.slug, { heroImage: v })} />
                </div>
                <List label="Chữ chạy trên ruy băng (cách nhau dấu phẩy)" initial={c.ribbon} onChange={(v) => up(c.slug, { ribbon: v.slice(0, 8) })} wide />
                <List label="Bộ mẫu chữ (mã bộ sưu tập, VD 20-10, cap-doi)" initial={c.collections} onChange={(v) => up(c.slug, { collections: v.slice(0, 6) })} wide />
                <Pipes
                  label="Tab sản phẩm"
                  hint="Mỗi dòng: Tên tab | mã danh mục (trống = mọi danh mục) | từ khoá cách nhau dấu phẩy (VD: coc, binh giu nhiet)"
                  rows={c.tabs}
                  cols={3}
                  toRow={(t) => [t.label, t.category, t.q]}
                  fromRow={([label, category, q]) => ({ label: label!, category: category!, q: q! })}
                  onChange={(v) => up(c.slug, { tabs: v.slice(0, 6) })}
                />
                <Txt label="Khối doanh nghiệp – tiêu đề (trống = ẩn)" value={c.b2bTitle} onChange={(v) => up(c.slug, { b2bTitle: v })} wide />
                <Txt label="Khối doanh nghiệp – mô tả" value={c.b2bText} onChange={(v) => up(c.slug, { b2bText: v })} wide />
                <Pipes
                  label="Hỏi đáp"
                  hint="Mỗi dòng: Câu hỏi | trả lời"
                  rows={c.faq}
                  cols={2}
                  toRow={(f) => [f.q, f.a]}
                  fromRow={([q, a]) => ({ q: q!, a: a! })}
                  onChange={(v) => up(c.slug, { faq: v.slice(0, 8) })}
                />
                <div className="rounded-lg bg-amber-50 p-3 text-sm md:col-span-2">
                  <p>
                    <b>Giá ưu đãi thật:</b> lưu cài đặt trước, rồi bấm &quot;Áp giá ưu đãi&quot; – mọi sản phẩm khớp các tab được đặt giá khuyến mãi = giá bán − {c.discountPercent}% (làm tròn nghìn), tự hết hạn cuối ngày kết thúc. Giỏ hàng & thanh toán tính đúng giá này.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" className="btn-primary !py-1.5 text-sm" disabled={!(c.discountPercent > 0)} onClick={() => void sale(c.slug, "apply")}>
                      Áp giá ưu đãi {c.discountPercent > 0 ? `−${c.discountPercent}%` : ""}
                    </button>
                    <button type="button" className="btn-ghost !py-1.5 text-sm" onClick={() => void sale(c.slug, "clear")}>
                      Gỡ giá ưu đãi
                    </button>
                    {msg[c.slug] && <span className="text-neutral-700">{msg[c.slug]}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
