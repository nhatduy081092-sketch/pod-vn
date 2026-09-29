"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { WEB_URL } from "@/lib/config";

const NAV = [
  { href: "/", label: "Tổng quan" },
  { href: "/orders", label: "Đơn hàng" },
  { href: "/leads", label: "Khách để lại SĐT" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/categories", label: "Danh mục" },
  { href: "/design-library", label: "Thư viện thiết kế" },
  { href: "/customers", label: "Khách hàng" },
  { href: "/sellers", label: "Seller" },
  { href: "/batches", label: "Thanh toán gộp" },
  { href: "/notices", label: "Thông báo" },
  { href: "/help", label: "Help Center" },
  { href: "/settings", label: "Nội dung & vận chuyển" },
  { href: "/pages", label: "Trang nội dung" },
  { href: "/testimonials", label: "Đánh giá" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 z-20 border-b border-neutral-200 bg-white md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:block md:px-5 md:py-5">
        <p className="font-black">
          OEM <span className="text-brand-dark">Group</span> <span className="text-xs font-semibold text-neutral-400">CMS</span>
        </p>
        <form action={logoutAction} className="md:hidden">
          <button className="text-sm text-neutral-500">Đăng xuất</button>
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-brand-light font-bold text-ink" : "text-neutral-600 hover:bg-neutral-100"}`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden space-y-2 px-5 pt-6 md:block">
        <a href={WEB_URL} target="_blank" rel="noreferrer" className="block text-sm text-neutral-500 hover:text-ink">
          ↗ Xem website
        </a>
        <form action={logoutAction}>
          <button className="text-sm text-neutral-500 hover:text-ink">Đăng xuất</button>
        </form>
      </div>
    </aside>
  );
}
