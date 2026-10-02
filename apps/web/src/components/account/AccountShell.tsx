"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { api, notifyAuthChanged, useMe, type Me } from "@/lib/account";

const MeCtx = createContext<{ me: Me; reload: () => Promise<void> } | null>(null);
export function useAccount() {
  const v = useContext(MeCtx);
  if (!v) throw new Error("useAccount phải nằm trong AccountShell");
  return v;
}

const NAV = [
  { href: "/tai-khoan", label: "Tổng quan" },
  { href: "/tai-khoan/don-hang", label: "Đơn hàng" },
  { href: "/tai-khoan/thiet-ke", label: "Thiết kế của tôi" },
  { href: "/tai-khoan/dia-chi", label: "Sổ địa chỉ" },
  { href: "/tai-khoan/bao-mat", label: "Thông tin & mật khẩu" },
  { href: "/tai-khoan/seller", label: "Làm seller" },
];

/** Khung khu tài khoản: bắt đăng nhập, menu trái (desktop) / cuộn ngang (mobile) */
export function AccountShell({ children }: { children: ReactNode }) {
  const { me, loading, reload } = useMe();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!loading && !me) router.replace(`/dang-nhap?next=${encodeURIComponent(path)}`);
  }, [loading, me, path, router]);

  if (loading || !me)
    return (
      <div className="container-site flex min-h-[40vh] items-center justify-center py-10 text-sm text-ink/60">
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" /> Đang tải tài khoản…
      </div>
    );

  async function logout() {
    await api("/account/logout", { method: "POST" }).catch(() => undefined);
    notifyAuthChanged();
    router.replace("/");
    router.refresh();
  }

  return (
    <MeCtx.Provider value={{ me, reload }}>
      <div className="container-site py-5 md:py-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-ink/60">Xin chào,</p>
            <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">{me.name}</h1>
          </div>
          <div className="flex gap-2">
            {me.seller?.status === "APPROVED" && (
              <Link href="/seller" className="btn border-violet-700 bg-violet-700 px-4 py-2 text-white">
                Khu seller →
              </Link>
            )}
            <button type="button" onClick={logout} className="btn-outline px-4 py-2">
              Đăng xuất
            </button>
          </div>
        </div>
        <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
          <nav className="no-scrollbar -mx-4 mb-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:mb-0 md:flex-col md:px-0" aria-label="Tài khoản">
            {NAV.map((n) => {
              const on = n.href === "/tai-khoan" ? path === n.href : path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${on ? "bg-ink text-white" : "text-ink/70 hover:bg-cream"}`}
                  aria-current={on ? "page" : undefined}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </MeCtx.Provider>
  );
}
