"use client";
import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/config";

/** Danh sách ảnh nhỏ bấm để đổi ảnh chính (dùng chung cho trang đặt hàng + trang báo giá) */
export function Thumbs({ images, active, onPick, name }: { images: string[]; active: number; onPick: (i: number) => void; name: string }) {
  if (images.length < 2) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {images.map((src, i) => (
        <li key={src + i} className="shrink-0">
          <button
            type="button"
            onClick={() => onPick(i)}
            aria-label={`Xem ảnh ${i + 1} của ${name}`}
            aria-current={i === active}
            className={`block h-16 w-16 overflow-hidden rounded-md bg-surface transition md:h-[76px] md:w-[76px] ${i === active ? "outline outline-2 outline-offset-2 outline-ink" : "opacity-80 hover:opacity-100"}`}
          >
            <img src={assetUrl(src)} alt="" className="h-full w-full object-contain" loading="lazy" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Ảnh chính + phóng to toàn màn hình (bấm ảnh), dùng cho sản phẩm báo giá */
export function ProductGallery({ images, name, frameClass = "" }: { images: string[]; name: string; frameClass?: string }) {
  const list = images.length ? images : [""];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setI((x) => (x + 1) % list.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + list.length) % list.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, list.length]);

  const src = assetUrl(list[i]);
  return (
    <div>
      <button type="button" onClick={() => src && setZoom(true)} className={`block w-full cursor-zoom-in overflow-hidden rounded-xl ${frameClass}`} aria-label="Phóng to ảnh">
        {src ? (
          <img src={src} alt={name} className="aspect-square w-full bg-white object-contain" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-white text-sm text-ink/40">Ảnh đang cập nhật</div>
        )}
      </button>
      <Thumbs images={images} active={i} onPick={setI} name={name} />
      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3" role="dialog" aria-modal="true" aria-label={name} onClick={() => setZoom(false)}>
          <img src={src} alt={name} className="max-h-full max-w-full object-contain" />
          <button type="button" className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-bold" onClick={() => setZoom(false)}>
            Đóng ✕
          </button>
          {list.length > 1 && (
            <>
              {[
                [-1, "‹", "left-2", "Ảnh trước"],
                [1, "›", "right-2", "Ảnh sau"],
              ].map(([d, ch, pos, label]) => (
                <button
                  key={String(d)}
                  type="button"
                  aria-label={String(label)}
                  className={`absolute top-1/2 ${pos} flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-black`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setI((x) => (x + Number(d) + list.length) % list.length);
                  }}
                >
                  {ch}
                </button>
              ))}
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">
                {i + 1} / {list.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
