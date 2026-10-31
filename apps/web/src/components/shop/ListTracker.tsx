"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { track } from "@/lib/track";

type TrackItem = { id: string; slug: string; name: string; price: number; category?: string };

/**
 * Bọc 1 lưới sản phẩm: gửi view_item_list khi hiện (1 lần / bộ lọc), select_item khi bấm vào 1 sản phẩm,
 * search khi danh sách là kết quả tìm kiếm. Không đổi giao diện (display: contents).
 */
export function ListTracker({ listId, listName, items, searchTerm, total, children }: { listId: string; listName: string; items: TrackItem[]; searchTerm?: string; total?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = `${listId}|${searchTerm ?? ""}|${items.map((i) => i.id).join(",")}`;

  useEffect(() => {
    if (searchTerm) track.search(searchTerm, total);
    track.viewItemList(listId, listName, items.map((i) => ({ ...i, quantity: 1 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/san-pham/"]');
      if (!a) return;
      const slug = decodeURIComponent(new URL(a.href).pathname.split("/")[2] ?? "");
      const index = items.findIndex((i) => i.slug === slug);
      if (index >= 0) track.selectItem(listId, listName, { ...items[index]!, quantity: 1 }, index);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [items, listId, listName]);

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
