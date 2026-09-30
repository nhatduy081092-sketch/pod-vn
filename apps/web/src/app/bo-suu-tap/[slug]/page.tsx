import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESIGN_COLLECTIONS, findDesignCollection } from "@pod/shared";
import { ReadyDesignCard } from "@/components/designs/ReadyDesignCard";
import { DesignFonts } from "@/components/designs/DesignFonts";
import { basicPrices } from "@/lib/basic-prices";

type Params = Promise<{ slug: string }>;
export const revalidate = 600;

export function generateStaticParams() {
  return DESIGN_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = findDesignCollection((await params).slug);
  if (!c) return {};
  return { title: `Áo in chữ ${c.name} – mẫu có sẵn`, description: `${c.blurb} ${c.designs.length} mẫu, sửa chữ miễn phí, in từ 1 chiếc.`, alternates: { canonical: `/bo-suu-tap/${c.slug}` } };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const c = findDesignCollection((await params).slug);
  if (!c) notFound();
  const prices = await basicPrices();
  return (
    <div className="container-site py-6 md:py-10">
      <DesignFonts designs={c.designs} />
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Trang chủ</Link> / <Link href="/bo-suu-tap" className="hover:text-ink">Mẫu có sẵn</Link> / <span className="text-ink">{c.name}</span>
      </nav>
      <h1 className="h-section mt-3">{c.name}</h1>
      <p className="mt-2 max-w-2xl text-[15px] text-muted md:text-base">{c.blurb} Bấm vào mẫu để sửa chữ, đổi màu áo và đặt in.</p>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {DESIGN_COLLECTIONS.map((x) => (
          <Link
            key={x.slug}
            href={`/bo-suu-tap/${x.slug}`}
            aria-current={x.slug === c.slug ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${x.slug === c.slug ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
          >
            {x.name}
          </Link>
        ))}
      </div>

      <ul className="mt-7 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
        {c.designs.map((d) => (
          <li key={d.slug}>
            <ReadyDesignCard d={d} price={prices[d.garment]} />
          </li>
        ))}
      </ul>

      <aside className="mt-12 rounded-2xl bg-surface p-5 md:flex md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="text-xl font-semibold md:text-2xl">Muốn chữ của riêng bạn?</h2>
          <p className="mt-1 text-[15px] text-muted">Mở YALA Studio, gõ câu bạn thích, chọn font – xem trước trên áo ngay.</p>
        </div>
        <Link href="/thiet-ke" className="btn-primary mt-4 md:mt-0">
          Tự thiết kế
        </Link>
      </aside>
    </div>
  );
}
