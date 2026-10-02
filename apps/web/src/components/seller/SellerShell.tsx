"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { OrderStatus } from "@pod/shared";
import { api } from "@/lib/account";

export type SellerOverview = {
  profile: {
    customerId: string;
    status: string;
    discountPercent: number;
    companyName: string;
    taxCode: string;
    storeUrl: string;
    brandName: string;
    labelImage: string;
    webhookUrl: string;
    webhookSecret: string;
  };
  statusCounts: Record<OrderStatus, number>;
  unpaid: { count: number; total: number };
  last30d: { count: number; total: number };
  templates: number;
};

const Ctx = createContext<{ ov: SellerOverview; reload: () => Promise<void> } | null>(null);
export function useSeller() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSeller phải nằm trong SellerShell");
  return v;
}

const NAV = [
  { href: "/seller", label: "Tổng quan" },
  { href: "/seller/mau", label: "Mẫu sản phẩm" },
  { href: "/seller/don", label: "Đơn dropship" },
  { href: "/seller/nhap-csv", label: "Nhập CSV" },
  { href: "/seller/thanh-toan", label: "Thanh toán" },
  { href: "/seller/api", label: "API & Webhook" },
  { href: "/seller/cai-dat", label: "Thương hiệu" },
];

/** Khu seller: chỉ tài khoản seller đã duyệt */
export function SellerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ov, setOv] = useState<SellerOverview | null>(null);
  const [denied, setDenied] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setOv(await api<SellerOverview>("/seller/overview"));
    } catch (e) {
      const st = (e as { status?: number }).status;
      if (st === 401) router.replace(`/dang-nhap?next=${encodeURIComponent(path)}`);
      else setDenied((e as Error).message);
    }
  }, [router, path]);
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (denied)
    return (
      <div className="container-site max-w-xl py-12 text-center">
        <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Khu seller</h1>
        <p className="mt-2 text-ink/70">{denied}</p>
        <Link href="/tai-khoan/seller" className="btn-primary mt-4 inline-flex px-5">
          Đăng ký / xem trạng thái seller
        </Link>
      </div>
    );
  if (!ov)
    return (
      <div className="container-site flex min-h-[40vh] items-center justify-center text-sm text-ink/60">
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" /> Đang tải khu seller…
      </div>
    );

  return (
    <Ctx.Provider value={{ ov, reload }}>
      <div className="border-b border-line bg-violet-700 text-white">
        <div className="container-site flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
          <p className="font-black">Seller · {ov.profile.brandName || ov.profile.companyName || "Cửa hàng của bạn"}</p>
          <p className="text-sm text-white/80">Chiết khấu {ov.profile.discountPercent}%</p>
          <Link href="/tai-khoan" className="ml-auto text-sm underline">
            Tài khoản
          </Link>
        </div>
        <nav className="container-site no-scrollbar flex gap-1 overflow-x-auto pb-2" aria-label="Seller">
          {NAV.map((n) => {
            const on = n.href === "/seller" ? path === n.href : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold ${on ? "bg-white text-violet-800" : "text-white/85 hover:bg-white/10"}`} aria-current={on ? "page" : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="container-site py-5 md:py-8">{children}</div>
    </Ctx.Provider>
  );
}

export const Box = ({ children, className = "" }: { children: ReactNode; className?: string }) => <section className={`rounded-xl border-2 border-ink/10 bg-white p-4 md:p-5 ${className}`}>{children}</section>;
