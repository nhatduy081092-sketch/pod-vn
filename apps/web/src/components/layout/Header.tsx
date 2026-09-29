"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { IconCart, IconClose, IconMenu, IconPackage, IconSearch, IconUser } from "../ui/icons";
import { SearchBox } from "../shop/SearchBox";
import { Logo } from "./Logo";

type Props = { brandName: string; logoUrl?: string; categories: { name: string; slug: string }[]; hotline: string };

export function Header({ brandName, logoUrl, categories, hotline }: Props) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, ready } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/95 backdrop-blur">
      <div className="container-site flex h-12 items-center gap-2 md:h-16 md:gap-4">
        <button type="button" onClick={() => setOpen(true)} className="-ml-1 p-1 text-ink/80 lg:hidden" aria-label="Mở menu">
          <IconMenu className="h-6 w-6" />
        </button>
        <Logo name={brandName} logoUrl={logoUrl} />

        {/* Ô tìm kiếm: từ tablet trở lên nằm ngay trên header */}
        <div className="mx-auto hidden w-full max-w-xl md:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0 md:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="p-1 text-ink/80 md:hidden"
            aria-label="Tìm kiếm"
            aria-expanded={searchOpen}
          >
            <IconSearch className="h-6 w-6" />
          </button>
          <Link href="/tra-cuu" className="flex items-center gap-1 p-1 text-ink/80 hover:text-ink" aria-label="Tra cứu đơn hàng">
            <IconPackage className="h-6 w-6" />
            <span className="hidden whitespace-nowrap text-sm font-semibold xl:inline">Tra cứu đơn</span>
          </Link>
          <Link href="/tai-khoan" className="flex items-center gap-1 p-1 text-ink/80 hover:text-ink" aria-label="Tài khoản">
            <IconUser className="h-6 w-6" />
            <span className="hidden whitespace-nowrap text-sm font-semibold xl:inline">Tài khoản</span>
          </Link>
          <Link
            href="/gio-hang"
            className="relative flex h-9 w-11 shrink-0 items-center justify-center rounded-md bg-brand text-white md:h-10 lg:w-auto lg:gap-2 lg:px-4"
            aria-label={`Giỏ hàng (${count} sản phẩm)`}
          >
            <IconCart className="h-6 w-6" />
            <span className="hidden whitespace-nowrap text-sm font-extrabold lg:inline">Giỏ hàng</span>
            {ready && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full border-2 border-white bg-ink px-1 text-center text-[11px] font-bold leading-4 text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Tìm kiếm trên mobile: trượt xuống dưới header */}
      {searchOpen && (
        <div className="container-site border-t border-ink/10 py-2 md:hidden">
          <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      {/* Thanh danh mục (desktop) */}
      <nav className="hidden border-t border-ink/10 lg:block" aria-label="Danh mục">
        <div className="container-site no-scrollbar flex h-10 items-center gap-6 overflow-x-auto text-[13px] font-semibold">
          <Link href="/#danh-muc" className="shrink-0 font-extrabold text-navy hover:text-oem">
            ☰ Tất cả danh mục
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/danh-muc/${c.slug}`}
              className={`shrink-0 whitespace-nowrap hover:text-oem ${pathname === `/danh-muc/${c.slug}` ? "text-oem" : "text-ink/80"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Drawer mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[82%] max-w-[320px] flex-col bg-white shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-12 items-center justify-between border-b px-4">
            <Logo name={brandName} logoUrl={logoUrl} />
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng menu" className="p-1">
              <IconClose className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3 text-[15px] font-semibold" aria-label="Menu">
            <Link href="/" className="block rounded-md px-3 py-2.5 hover:bg-cream">
              Trang chủ
            </Link>
            <Link href="/san-pham" className="block rounded-md px-3 py-2.5 hover:bg-cream">
              Tất cả sản phẩm
            </Link>
            <Link href="/#doanh-nghiep" className="block rounded-md px-3 py-2.5 font-bold text-navy hover:bg-cream">
              Giải pháp doanh nghiệp
            </Link>
            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-ink/50">Danh mục</p>
            {categories.map((c) => (
              <Link key={c.slug} href={`/danh-muc/${c.slug}`} className="block rounded-md px-3 py-2.5 hover:bg-cream">
                {c.name}
              </Link>
            ))}
            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-ink/50">Hỗ trợ</p>
            <Link href="/tra-cuu" className="block rounded-md px-3 py-2.5 hover:bg-cream">
              Tra cứu đơn hàng
            </Link>
            <a href={`tel:${hotline}`} className="block rounded-md px-3 py-2.5 hover:bg-cream">
              Hotline: {hotline}
            </a>
          </nav>
        </aside>
      </div>
    </header>
  );
}
