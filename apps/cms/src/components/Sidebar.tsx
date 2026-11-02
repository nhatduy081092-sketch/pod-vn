"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { YALA_WORDMARK } from "@pod/shared";
import { logoutAction } from "@/lib/actions";
import { WEB_URL } from "@/lib/config";

// Menu theo nhóm công việc: bán hàng hằng ngày lên đầu, cài đặt website xuống cuối
const GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Bán hàng",
    items: [
      { href: "/", label: "Tổng quan" },
      { href: "/orders", label: "Đơn hàng" },
      { href: "/leads", label: "Khách để lại SĐT" },
      { href: "/customers", label: "Khách hàng" },
      { href: "/sources", label: "Nguồn khách" },
    ],
  },
  {
    title: "Sản phẩm",
    items: [
      { href: "/products", label: "Sản phẩm" },
      { href: "/categories", label: "Danh mục" },
      { href: "/ai-photos", label: "Ảnh thật AI" },
      { href: "/design-library", label: "Thư viện thiết kế" },
    ],
  },
  {
    title: "Seller",
    items: [
      { href: "/sellers", label: "Seller" },
      { href: "/batches", label: "Thanh toán gộp" },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/settings", label: "Nội dung & vận chuyển" },
      { href: "/pages", label: "Trang nội dung" },
      { href: "/testimonials", label: "Đánh giá" },
      { href: "/notices", label: "Thông báo" },
      { href: "/help", label: "Help Center" },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.items);

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 text-ink" aria-label="YALA CMS – Tổng quan">
      <svg viewBox={`0 0 ${YALA_WORDMARK.w} ${YALA_WORDMARK.h}`} className="h-4 w-auto" aria-hidden>
        <path fill="currentColor" fillRule="evenodd" d={YALA_WORDMARK.d} />
      </svg>
      <span className="text-xs font-semibold text-neutral-500">CMS</span>
    </Link>
  );
}

function Nav({ path }: { path: string }) {
  return (
    <nav aria-label="Menu quản trị" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-xs font-medium text-neutral-500">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((n) => {
              const active = isActive(path, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors md:py-1.5 ${
                      active ? "bg-neutral-200/70 font-semibold text-ink" : "text-neutral-700 hover:bg-neutral-200/40 hover:text-ink"
                    }`}
                  >
                    {n.label}
                    {active && <span className="dot-active" aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <div className="space-y-0.5 border-t border-neutral-200 pt-3">
      <a href={WEB_URL} target="_blank" rel="noreferrer" className="block rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200/40 hover:text-ink">
        Xem website ↗
      </a>
      <form action={logoutAction}>
        <button className="w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-600 hover:bg-neutral-200/40 hover:text-ink">Đăng xuất</button>
      </form>
    </div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = ALL.find((n) => isActive(path, n.href));

  // đóng menu điện thoại khi chuyển trang hoặc bấm Esc
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Máy tính: cột menu cố định, cùng nền với trang, ngăn bằng 1 đường mảnh */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-neutral-200">
        <div className="px-6 pb-5 pt-6">
          <Wordmark />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <Nav path={path} />
        </div>
        <div className="px-3 pb-4">
          <Footer />
        </div>
      </aside>

      {/* Điện thoại: thanh trên gọn + nút Menu mở danh sách theo nhóm */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-100/95 px-4 md:hidden">
        <Wordmark />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-600">{current?.label}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="cms-menu"
          className="btn-ghost min-h-10 px-3"
        >
          Menu
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu quản trị" id="cms-menu">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-neutral-100 shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
              <Wordmark />
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost min-h-10 px-3">
                Đóng
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <Nav path={path} />
            </div>
            <div className="px-3 pb-4">
              <Footer />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
