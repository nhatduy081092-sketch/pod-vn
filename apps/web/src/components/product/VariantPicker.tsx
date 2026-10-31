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
                  className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[15px] font-semibold transition-colors ${on ? "bg-ink text-white" : "bg-surface text-ink hover:bg-ink/10"}`}
                >
                  <span className="h-7 w-7 rounded-full ring-1 ring-inset ring-ink/20" style={{ background: c.hex || "repeating-linear-gradient(45deg,#fff 0 4px,#e5e5e5 4px 8px)" }} aria-hidden />
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
              <a href="#bang-size" className="text-[15px] font-semibold text-ink underline underline-offset-4 hover:text-brand-dark">
                Bảng size
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
                  className={`min-h-[44px] min-w-[52px] rounded-md px-3 py-2 text-base font-bold transition-colors ${size === s ? "bg-ink text-white" : "bg-surface text-ink hover:bg-ink/10"}`}
                >
                  {s}
                  {d !== 0 && <span className="ml-1 text-[13px] font-semibold opacity-75">{d > 0 ? "+" : ""}{formatVND(d)}</span>}
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
