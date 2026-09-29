"use client";
import { formatVND, variantOptions } from "@pod/shared";
import type { Variant } from "@/lib/types";

type Props = {
  variants: Variant[];
  color: string;
  size: string;
  onChange: (v: { color: string; size: string }) => void;
  /** ẩn phần size (đồng phục nhóm chọn size theo danh sách) */
  hideSize?: boolean;
  sizeGuide?: boolean;
  step?: { color?: string; size?: string };
};

/** Chọn màu (ô màu theo mã hex) + size còn bán của màu đó; hiện phụ phí biến thể nếu có */
export function VariantPicker({ variants, color, size, onChange, hideSize, sizeGuide, step }: Props) {
  const opts = variantOptions(variants.map((v) => ({ ...v, isActive: true })));
  const colors = opts.colors.filter((c) => c.name);
  const sizes = opts.sizesFor(color).filter(Boolean);
  const deltaOf = (c: string, s: string) => variants.find((v) => v.color === c && v.size === s)?.priceDelta ?? 0;

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <section>
          <h2 className="label">
            {step?.color ?? "Màu"}: <span className="font-normal">{color || "—"}</span>
          </h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Màu">
            {colors.map((c) => {
              const on = c.name === color;
              return (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    const avail = opts.sizesFor(c.name);
                    onChange({ color: c.name, size: avail.includes(size) ? size : (avail[0] ?? "") });
                  }}
                  className={`flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-sm font-semibold ${on ? "border-ink bg-brand" : "border-ink/20 bg-white hover:border-ink/50"}`}
                >
                  <span className="h-6 w-6 rounded-full border border-ink/20" style={{ background: c.hex || "repeating-linear-gradient(45deg,#fff 0 4px,#e5e5e5 4px 8px)" }} aria-hidden />
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>
      )}
      {!hideSize && sizes.length > 0 && !(sizes.length === 1 && /free\s*size/i.test(sizes[0]!)) && (
        <section>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="label">{step?.size ?? "Size"}</h2>
            {sizeGuide && (
              <a href="#bang-size" className="text-xs font-bold text-ink/70 underline underline-offset-2 hover:text-ink">
                📏 Bảng size
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {sizes.map((s) => {
              const d = deltaOf(color, s);
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => onChange({ color, size: s })}
                  className={`min-w-[48px] rounded-md border-2 px-3 py-1.5 text-sm font-bold ${size === s ? "border-ink bg-brand" : "border-ink/20 bg-white"}`}
                >
                  {s}
                  {d !== 0 && <span className="ml-1 text-[11px] font-semibold text-ink/60">{d > 0 ? "+" : ""}{formatVND(d)}</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** Màu + size mặc định: biến thể đầu tiên */
export function defaultVariant(variants: Variant[]) {
  const v = variants[0];
  return { color: v?.color ?? "", size: v?.size ?? "" };
}
