"use client";
import { useEffect, useState } from "react";

/** Thanh trượt: onChange khi kéo (không ghi lịch sử), onEnd khi thả tay (ghi 1 bước hoàn tác) */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onEnd,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onEnd?: () => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}: {fmt ? fmt(value) : value}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onEnd}
        onKeyUp={onEnd}
        className="w-full accent-[#F08A00]"
      />
    </label>
  );
}

export const SWATCHES = ["#1d1d1f", "#ffffff", "#e11d48", "#f97316", "#facc15", "#16a34a", "#0ea5e9", "#1c4d99", "#7c3aed", "#ec4899", "#a16207", "#6b7280"];

const CUSTOM_KEY = "yala-custom-colors";
const MAX_CUSTOM = 30;

function readCustom(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x)).slice(0, MAX_CUSTOM) : [];
  } catch {
    return [];
  }
}
function writeCustom(list: string[]) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }
}

type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> };

/**
 * Chọn màu: màu có sẵn · màu tự lưu (tối đa 30, lưu trên máy) · bảng màu · mã HEX · hút màu trên màn hình (Chrome/Edge).
 */
export function ColorPicker({ value, onChange, label, none }: { value: string | null; onChange: (hex: string | null) => void; label?: string; none?: string }) {
  const [custom, setCustom] = useState<string[]>([]);
  const [hex, setHex] = useState(value ?? "");
  const [editing, setEditing] = useState(false);
  const [dropper, setDropper] = useState(false);

  useEffect(() => {
    setCustom(readCustom());
    setDropper(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);
  useEffect(() => setHex(value ?? ""), [value]);

  const pick = (c: string | null) => onChange(c ? c.toLowerCase() : null);
  const save = () => {
    if (!value) return;
    const next = [value.toLowerCase(), ...custom.filter((c) => c !== value.toLowerCase())].slice(0, MAX_CUSTOM);
    setCustom(next);
    writeCustom(next);
  };
  const remove = (c: string) => {
    const next = custom.filter((x) => x !== c);
    setCustom(next);
    writeCustom(next);
  };
  async function eyedrop() {
    try {
      const E = (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper;
      const r = await new E().open();
      pick(r.sRGBHex.length === 7 ? r.sRGBHex : null);
    } catch {
      /* khách bấm Esc */
    }
  }
  const dot = (c: string, active: boolean, onClick: () => void, extra?: React.ReactNode) => (
    <button
      key={c}
      type="button"
      onClick={onClick}
      className={`relative h-7 w-7 rounded-full border-2 ${active ? "border-ink ring-2 ring-brand" : "border-ink/20"}`}
      style={{ background: c }}
      aria-label={`Màu ${c}`}
      title={c}
    >
      {extra}
    </button>
  );

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-bold text-ink/70">{label}</p>}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label ?? "Màu"}>
        {none && (
          <button type="button" onClick={() => pick(null)} className={`h-7 rounded-full border-2 px-2.5 text-[11px] font-bold ${!value ? "border-ink bg-brand" : "border-ink/20"}`}>
            {none}
          </button>
        )}
        {SWATCHES.map((c) => dot(c, value?.toLowerCase() === c, () => pick(c)))}
      </div>
      {custom.length > 0 && (
        <div>
          <p className="flex items-center justify-between text-[11px] font-semibold text-ink/60">
            Màu của tôi ({custom.length}/{MAX_CUSTOM})
            <button type="button" className="underline" onClick={() => setEditing((v) => !v)}>
              {editing ? "Xong" : "Sửa"}
            </button>
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {custom.map((c) =>
              dot(
                c,
                value?.toLowerCase() === c,
                () => (editing ? remove(c) : pick(c)),
                editing ? <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[9px] text-white">×</span> : null,
              ),
            )}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <input type="color" value={value ?? "#ffffff"} onChange={(e) => pick(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-ink/20" aria-label="Bảng màu" />
        <input
          value={hex}
          onChange={(e) => {
            const v = e.target.value.trim();
            setHex(v);
            const full = v.startsWith("#") ? v : `#${v}`;
            if (/^#[0-9a-f]{6}$/i.test(full)) pick(full);
          }}
          placeholder="#RRGGBB"
          maxLength={7}
          className="h-8 w-[84px] rounded border border-ink/20 px-2 font-mono text-xs uppercase"
          aria-label="Mã màu HEX"
        />
        {dropper && (
          <button type="button" onClick={() => void eyedrop()} className="btn-sm h-8 text-[11px] font-bold" title="Hút màu ở bất kỳ đâu trên màn hình">
            💧 Hút màu
          </button>
        )}
        <button type="button" onClick={save} disabled={!value} className="btn-sm h-8 text-[11px] font-bold" title="Lưu vào Màu của tôi">
          + Lưu
        </button>
      </div>
    </div>
  );
}
