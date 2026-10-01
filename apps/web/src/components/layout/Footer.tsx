import Link from "next/link";
import type { LandingSettings } from "@pod/shared";
import { Logo, YalaLogoFull } from "./Logo";

const CARRIERS = ["GHN", "GHTK", "Viettel Post", "J&T Express", "Ninja Van"];
const PAYMENTS = ["COD", "VietQR", "Chuyển khoản ngân hàng"];

type Props = {
  brand: LandingSettings["brand"];
  categories: { name: string; slug: string }[];
  pages: { slug: string; title: string; showInFooter: boolean }[];
};

export function Footer({ brand, categories, pages }: Props) {
  return (
    <footer className="bg-ink pb-24 pt-12 text-white/75 md:pb-12 md:pt-16">
      <div className="container-site grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          {brand.logoUrl ? (
            <Logo name={brand.name} logoUrl={brand.logoUrl} dark />
          ) : (
            <Link href="/" className="inline-block text-white" aria-label={`${brand.name} – Trang chủ`}>
              <YalaLogoFull className="h-12 w-auto md:h-14" />
            </Link>
          )}
          <p className="mt-3 text-sm leading-relaxed">{brand.tagline}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Sản phẩm</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/thiet-ke" className="font-bold text-brand hover:underline">
                ✦ Tự thiết kế – YALA Studio
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/danh-muc/${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Hỗ trợ</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/tra-cuu" className="hover:text-brand">
                Tra cứu đơn hàng
              </Link>
            </li>
            <li>
              <Link href="/ho-tro" className="hover:text-brand">
                Trung tâm hỗ trợ
              </Link>
            </li>
            <li>
              <Link href="/thong-bao" className="hover:text-brand">
                Thông báo
              </Link>
            </li>
            <li>
              <Link href="/tai-khoan" className="hover:text-brand">
                Tài khoản của tôi
              </Link>
            </li>
            <li>
              <Link href="/tai-khoan/seller" className="hover:text-brand">
                Làm seller dropship
              </Link>
            </li>
            <li>
              <Link href="/san-pham" className="hover:text-brand">
                Tất cả sản phẩm
              </Link>
            </li>
            {pages
              .filter((p) => p.showInFooter)
              .map((p) => (
                <li key={p.slug}>
                  <Link href={`/trang/${p.slug}`} className="hover:text-brand">
                    {p.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Liên hệ</h3>
          <ul className="space-y-2 text-sm">
            <li>
              Hotline/Zalo:{" "}
              <a href={`tel:${brand.hotline}`} className="font-bold text-brand">
                {brand.hotline}
              </a>
            </li>
            <li>
              Email:{" "}
              <a href={`mailto:${brand.email}`} className="hover:text-brand">
                {brand.email}
              </a>
            </li>
            <li>Địa chỉ: {brand.address}</li>
            {brand.website && (
              <li>
                <a href={brand.website} target="_blank" rel="noopener" className="hover:text-brand">
                  {brand.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
            )}
            {brand.companyName && <li>{brand.companyName}</li>}
            {brand.taxCode && <li>MST / GPKD: {brand.taxCode}</li>}
          </ul>
        </div>
      </div>
      <div className="container-site mt-8 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-white/60">Vận chuyển</p>
          <ul className="flex flex-wrap gap-2">
            {CARRIERS.map((c) => (
              <li key={c} className="rounded border border-white/20 px-2 py-1 text-xs font-semibold">
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-white/60">Thanh toán</p>
          <ul className="flex flex-wrap gap-2">
            {PAYMENTS.map((c) => (
              <li key={c} className="rounded border border-white/20 px-2 py-1 text-xs font-semibold">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="container-site mt-6 text-xs text-white/50">
        © {new Date().getFullYear()} {brand.name}. Bảo lưu mọi quyền.
      </p>
    </footer>
  );
}
