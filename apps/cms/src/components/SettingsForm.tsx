"use client";
import { useState, useTransition } from "react";
import { AUDIENCE_LABEL, AUDIENCES, landingSettingsSchema, type LandingSettings } from "@pod/shared";
import { saveLandingAction } from "@/lib/actions";
import { WEB_URL } from "@/lib/config";
import { ImageInput } from "./ImageInput";
import { ShippingSettings } from "./ShippingSettings";

type Section = keyof LandingSettings;
type FieldDef = { key: string; label: string; type?: "text" | "textarea" | "number" | "image" | "bool" | "color" | "lines" | "stats" };

/** Mảng <-> textarea (mỗi dòng 1 mục; stats dạng "giá trị | mô tả") */
const toText = (type: FieldDef["type"], v: unknown) =>
  type === "stats"
    ? ((v as { value: string; label: string }[]) ?? []).map((s) => `${s.value} | ${s.label}`).join("\n")
    : ((v as string[]) ?? []).join("\n");
const fromText = (type: FieldDef["type"], t: string) => {
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  return type === "stats"
    ? lines.map((l) => {
        const [value = "", ...rest] = l.split("|");
        return { value: value.trim(), label: rest.join("|").trim() };
      })
    : lines;
};

/** Khai báo field cho các nhóm dạng object phẳng */
const OBJECT_SECTIONS: { section: Section; title: string; hint?: string; fields: FieldDef[] }[] = [
  {
    section: "brand",
    title: "Thương hiệu & liên hệ",
    fields: [
      { key: "name", label: "Tên thương hiệu" },
      { key: "tagline", label: "Slogan" },
      { key: "hotline", label: "Hotline" },
      { key: "zalo", label: "Số Zalo" },
      { key: "messengerUrl", label: "Link Messenger (m.me/...)" },
      { key: "email", label: "Email" },
      { key: "address", label: "Địa chỉ" },
      { key: "companyName", label: "Tên hộ kinh doanh / công ty (hiện ở footer)" },
      { key: "taxCode", label: "Mã số thuế / số GPKD" },
      { key: "website", label: "Website công ty" },
      { key: "logoUrl", label: "Logo (vuông, PNG)", type: "image" },
    ],
  },
  {
    section: "b2b",
    title: "Khối giải pháp doanh nghiệp (B2B)",
    hint: "Sản phẩm trong khối lấy từ danh mục có slug bên dưới. Sản phẩm giá 0₫ = 'Liên hệ báo giá' (không đặt online).",
    fields: [
      { key: "enabled", label: "Hiển thị", type: "bool" },
      { key: "eyebrow", label: "Nhãn nhỏ" },
      { key: "title", label: "Tiêu đề" },
      { key: "subtitle", label: "Mô tả", type: "textarea" },
      { key: "categorySlug", label: "Slug danh mục sản phẩm B2B" },
      { key: "ctaLabel", label: "Nút CTA" },
      { key: "stats", label: "Số liệu (mỗi dòng: giá trị | mô tả)", type: "stats" },
      { key: "clients", label: "Khách hàng tiêu biểu (mỗi dòng 1 tên)", type: "lines" },
    ],
  },
  {
    section: "topBanner",
    title: "Banner trên cùng",
    fields: [
      { key: "enabled", label: "Hiển thị", type: "bool" },
      { key: "title", label: "Dòng tiêu đề" },
      { key: "line1", label: "Dòng 1" },
      { key: "line2", label: "Dòng 2 (trước số nhấn)" },
      { key: "highlight", label: "Số / chữ nhấn" },
      { key: "line3", label: "Sau số nhấn" },
      { key: "line4", label: "Dòng cuối" },
      { key: "href", label: "Link khi bấm" },
    ],
  },
  {
    section: "hero",
    title: "Hero",
    hint: "Ảnh hero nên là PNG nền trong suốt (người mẫu/sản phẩm), tỉ lệ ~ 4:3.",
    fields: [
      { key: "tag", label: "Nhãn tab vàng" },
      { key: "title", label: "Tiêu đề lớn" },
      { key: "badge", label: "Badge" },
      { key: "ctaHref", label: "Link badge" },
      { key: "imageUrl", label: "Ảnh hero", type: "image" },
    ],
  },
  {
    section: "sectionTitles",
    title: "Tiêu đề các mục",
    fields: [
      { key: "bestSellers", label: "Bán chạy" },
      { key: "hotSale", label: "Hot sale" },
      { key: "reviews", label: "Đánh giá" },
    ],
  },
  {
    section: "intro",
    title: "Giới thiệu chất liệu",
    fields: [
      { key: "text", label: "Đoạn giới thiệu", type: "textarea" },
      { key: "subtext", label: "Câu phụ" },
      { key: "ctaLabel", label: "Nút CTA" },
      { key: "ctaHref", label: "Link CTA" },
      { key: "imageUrl", label: "Ảnh người mẫu (PNG trong suốt)", type: "image" },
    ],
  },
  {
    section: "bank",
    title: "Tài khoản nhận chuyển khoản (VietQR)",
    hint: "Mã ngân hàng theo VietQR: VCB, TCB, MB, ACB, BIDV, VPB, TPB... Tên chủ TK viết HOA không dấu.",
    fields: [
      { key: "bankId", label: "Mã ngân hàng" },
      { key: "accountNo", label: "Số tài khoản" },
      { key: "accountName", label: "Chủ tài khoản" },
    ],
  },
  {
    section: "seo",
    title: "SEO trang chủ",
    fields: [
      { key: "title", label: "Meta title" },
      { key: "description", label: "Meta description", type: "textarea" },
    ],
  },
];

export function SettingsForm({ initial }: { initial: LandingSettings }) {
  const [s, setS] = useState<LandingSettings>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const setField = (section: Section, key: string, value: unknown) =>
    setS((prev) => ({ ...prev, [section]: { ...(prev[section] as Record<string, unknown>), [key]: value } }));

  function save() {
    const parsed = landingSettingsSchema.safeParse(s);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return setMsg({ ok: false, text: `${i?.path.join(".")}: ${i?.message}` });
    }
    start(async () => {
      const r = await saveLandingAction(parsed.data);
      setMsg(r.ok ? { ok: true, text: "✓ Đã lưu – website cập nhật sau tối đa 60 giây" } : { ok: false, text: r.error });
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {OBJECT_SECTIONS.map(({ section, title, hint, fields }) => {
        const obj = s[section] as Record<string, unknown>;
        return (
          <section key={section} className="card">
            <h2 className="font-bold">{title}</h2>
            {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {fields.map((fd) => (
                <div key={fd.key} className={fd.type && ["textarea", "image", "lines", "stats"].includes(fd.type) ? "md:col-span-2" : ""}>
                  {fd.type === "lines" || fd.type === "stats" ? (
                    <LinesField label={fd.label} initial={toText(fd.type, obj[fd.key])} onChange={(t) => setField(section, fd.key, fromText(fd.type, t))} />
                  ) : fd.type === "bool" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(obj[fd.key])} onChange={(e) => setField(section, fd.key, e.target.checked)} />
                      {fd.label}
                    </label>
                  ) : fd.type === "image" ? (
                    <ImageInput label={fd.label} value={String(obj[fd.key] ?? "")} onChange={(v) => setField(section, fd.key, v)} />
                  ) : (
                    <label className="block">
                      <span className="label">{fd.label}</span>
                      {fd.type === "textarea" ? (
                        <textarea className="input" rows={3} value={String(obj[fd.key] ?? "")} onChange={(e) => setField(section, fd.key, e.target.value)} />
                      ) : (
                        <input
                          className="input"
                          inputMode={fd.type === "number" ? "numeric" : undefined}
                          value={String(obj[fd.key] ?? "")}
                          onChange={(e) => setField(section, fd.key, fd.type === "number" ? Number(e.target.value.replace(/\D/g, "")) || 0 : e.target.value)}
                        />
                      )}
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <ShippingSettings value={s.shipping} onChange={(v) => setS((p) => ({ ...p, shipping: v }))} />

      {/* Các bước */}
      <section className="card">
        <h2 className="font-bold">Quy trình (các bước)</h2>
        <ul className="mt-3 space-y-2">
          {s.steps.map((st, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-14 text-sm font-semibold">Bước {i + 1}</span>
              <input className="input" value={st.title} onChange={(e) => setS({ ...s, steps: s.steps.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} />
              <input type="color" value={st.color} onChange={(e) => setS({ ...s, steps: s.steps.map((x, k) => (k === i ? { ...x, color: e.target.value } : x)) })} className="h-9 w-12 rounded border" />
              <button className="btn-danger px-2 py-1" onClick={() => setS({ ...s, steps: s.steps.filter((_, k) => k !== i) })}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        {s.steps.length < 8 && (
          <button className="btn-ghost mt-2" onClick={() => setS({ ...s, steps: [...s.steps, { title: "", color: "#A9D8F7" }] })}>
            + Thêm bước
          </button>
        )}
      </section>

      {/* Chất liệu */}
      <section className="card">
        <h2 className="font-bold">Mẫu chất liệu</h2>
        <ul className="mt-3 space-y-3">
          {s.fabrics.map((fb, i) => (
            <li key={i} className="grid items-end gap-2 md:grid-cols-[1fr_60px_2fr_auto]">
              <label className="block">
                <span className="label">Tên</span>
                <input className="input" value={fb.name} onChange={(e) => setS({ ...s, fabrics: s.fabrics.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
              </label>
              <input type="color" value={fb.color} onChange={(e) => setS({ ...s, fabrics: s.fabrics.map((x, k) => (k === i ? { ...x, color: e.target.value } : x)) })} className="h-9 w-full rounded border" />
              <ImageInput value={fb.imageUrl} onChange={(v) => setS({ ...s, fabrics: s.fabrics.map((x, k) => (k === i ? { ...x, imageUrl: v } : x)) })} />
              <button className="btn-danger px-2 py-1" onClick={() => setS({ ...s, fabrics: s.fabrics.filter((_, k) => k !== i) })}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        {s.fabrics.length < 6 && (
          <button className="btn-ghost mt-2" onClick={() => setS({ ...s, fabrics: [...s.fabrics, { name: "", color: "#cccccc", imageUrl: "" }] })}>
            + Thêm chất liệu
          </button>
        )}
      </section>

      {/* Ô đối tượng */}
      <section className="card">
        <h2 className="font-bold">Ô danh mục đối tượng (Nam / Nữ / Trẻ em)</h2>
        <ul className="mt-3 space-y-3">
          {s.audienceTiles.map((t, i) => (
            <li key={i} className="grid items-end gap-2 md:grid-cols-[1fr_140px_2fr]">
              <label className="block">
                <span className="label">Nhãn</span>
                <input className="input" value={t.label} onChange={(e) => setS({ ...s, audienceTiles: s.audienceTiles.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
              </label>
              <label className="block">
                <span className="label">Lọc theo</span>
                <select
                  className="input"
                  value={t.audience}
                  onChange={(e) => setS({ ...s, audienceTiles: s.audienceTiles.map((x, k) => (k === i ? { ...x, audience: e.target.value as typeof t.audience } : x)) })}
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {AUDIENCE_LABEL[a]}
                    </option>
                  ))}
                </select>
              </label>
              <ImageInput value={t.imageUrl} onChange={(v) => setS({ ...s, audienceTiles: s.audienceTiles.map((x, k) => (k === i ? { ...x, imageUrl: v } : x)) })} />
            </li>
          ))}
        </ul>
      </section>

      {/* Vì sao chọn */}
      <section className="card">
        <h2 className="font-bold">Vì sao chọn chúng tôi</h2>
        <div className="mt-3 grid gap-3">
          <label className="block">
            <span className="label">Tiêu đề</span>
            <input className="input" value={s.whyChoose.title} onChange={(e) => setS({ ...s, whyChoose: { ...s.whyChoose, title: e.target.value } })} />
          </label>
          <label className="block">
            <span className="label">Mô tả</span>
            <textarea className="input" rows={2} value={s.whyChoose.text} onChange={(e) => setS({ ...s, whyChoose: { ...s.whyChoose, text: e.target.value } })} />
          </label>
          {s.whyChoose.items.map((it, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <input
                className="input"
                value={it.title}
                onChange={(e) => setS({ ...s, whyChoose: { ...s.whyChoose, items: s.whyChoose.items.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) } })}
              />
              <input
                className="input"
                value={it.desc}
                onChange={(e) => setS({ ...s, whyChoose: { ...s.whyChoose, items: s.whyChoose.items.map((x, k) => (k === i ? { ...x, desc: e.target.value } : x)) } })}
              />
              <button className="btn-danger px-2 py-1" onClick={() => setS({ ...s, whyChoose: { ...s.whyChoose, items: s.whyChoose.items.filter((_, k) => k !== i) } })}>
                ✕
              </button>
            </div>
          ))}
          <button className="btn-ghost w-fit" onClick={() => setS({ ...s, whyChoose: { ...s.whyChoose, items: [...s.whyChoose.items, { title: "", desc: "" }] } })}>
            + Thêm lý do
          </button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-end gap-3 border-t bg-white/95 px-4 py-3 backdrop-blur md:left-60">
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
        <a href={WEB_URL} target="_blank" rel="noreferrer" className="btn-ghost">
          Xem web ↗
        </a>
        <button className="btn-primary" onClick={save} disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu nội dung"}
        </button>
      </div>
    </div>
  );
}

/** Textarea giữ nguyên chữ đang gõ (không bị chuẩn hoá lại mỗi lần gõ) */
function LinesField({ label, initial, onChange }: { label: string; initial: string; onChange: (t: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        className="input font-mono text-[13px]"
        rows={5}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
      />
    </label>
  );
}
