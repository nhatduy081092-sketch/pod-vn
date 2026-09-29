"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { IconClose, IconFilter } from "../ui/icons";

/** Nút "Lọc" + bảng trượt từ dưới lên (chỉ mobile/tablet) */
export function FilterSheet({ children, count }: { children: ReactNode; count: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sp = useSearchParams();
  useEffect(() => setOpen(false), [pathname, sp]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-md border border-ink/20 bg-white px-3 text-sm font-semibold lg:hidden"
      >
        <IconFilter className="h-4 w-4" /> Lọc
        {count > 0 && <span className="rounded-full bg-oem px-1.5 text-[11px] font-bold text-white">{count}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-extrabold">Bộ lọc</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="p-1">
                <IconClose className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
