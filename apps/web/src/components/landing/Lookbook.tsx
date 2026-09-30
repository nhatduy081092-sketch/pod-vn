"use client";
import Link from "next/link";
import { useState } from "react";
import { BASIC_COLORS, effectiveBasePrice, formatVND, type LandingSettings } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import type { ProductCardData } from "@/lib/types";
import { track } from "@/lib/track";

/** Shop the look: ảnh lifestyle (giữ nguyên tỉ lệ để chấm đúng vị trí) + chấm bấm mở thẻ sản phẩm */
export function Lookbook({ data, products }: { data: LandingSettings["lookbook"]; products: ProductCardData[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const spots = data.hotspots.map((h) => ({ ...h, p: bySlug.get(h.productSlug) })).filter((h) => h.p);
  if (!data.image || !spots.length) return null;
  // ảnh đúng màu của chấm (ảnh có hậu tố -<màu>. như phôi YALA Everyday), không có thì ảnh đầu
  const colorKey = (name: string) => Object.entries(BASIC_COLORS).find(([, c]) => c.name.toLowerCase() === name.toLowerCase())?.[0];
  const imgOf = (h: (typeof spots)[number]) => {
    const k = h.color ? colorKey(h.color) : undefined;
    return (k && h.p!.images.find((u) => u.includes(`-${k}.`))) || h.p!.images[0];
  };
  const href = (h: (typeof spots)[number]) => `/san-pham/${h.p!.slug}${h.color ? `?mau=${encodeURIComponent(h.color)}` : ""}`;
  const unique = [...new Map(spots.map((h) => [`${h.productSlug}|${h.color}`, h])).values()];

  return (
    <section className="py-12 md:py-20" aria-label={data.title}>
      <div className="container-site grid items-start gap-6 md:grid-cols-[1.45fr_1fr] md:gap-10">
        <div className="relative overflow-hidden rounded-2xl" style={{ backgroundColor: data.bg }}>
          <img src={assetUrl(data.image)} alt={data.title} loading="lazy" decoding="async" className="block h-auto w-full" />
          {spots.map((h, i) => (
            <div key={i} className="absolute" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-label={`Xem ${h.label || h.p!.name}`}
                className="relative grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-soft transition hover:scale-110"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-white/60 motion-reduce:hidden" aria-hidden />
                <span className="relative h-2.5 w-2.5 rounded-full bg-ink" aria-hidden />
              </button>
              {open === i && (
                <Link
                  href={href(h)}
                  onClick={() => track.selectPromotion({ id: h.p!.slug, name: data.title, slot: `look_${i + 1}`, color: h.color })}
                  className={`absolute top-5 z-10 flex w-56 items-center gap-2.5 rounded-xl bg-white p-2 text-ink shadow-soft ${h.x > 0.6 ? "right-0" : "left-0"}`}
                >
                  <img src={assetUrl(imgOf(h))} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-surface object-cover" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[13px] font-medium leading-snug">{h.label || h.p!.name}</span>
                    <span className="mt-0.5 block text-sm font-semibold">{formatVND(effectiveBasePrice(h.p!))} →</span>
                  </span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div>
          <p className="eyebrow">{data.eyebrow}</p>
          <h2 className="h-section mt-1.5">{data.title}</h2>
          <p className="mt-2 text-[15px] text-muted">Bấm vào từng chấm trên ảnh hoặc chọn món bên dưới.</p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {unique.map((h, i) => (
              <li key={i}>
                <Link href={href(h)} className="group flex items-center gap-3 py-3">
                  <img src={assetUrl(imgOf(h))} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-surface object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[15px] font-medium group-hover:underline">{h.p!.name}</span>
                    {h.color && <span className="text-[13px] text-muted">Màu {h.color}</span>}
                  </span>
                  <span className="text-[15px] font-semibold">{formatVND(effectiveBasePrice(h.p!))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
