import type { Metadata } from "next";
import Link from "next/link";
import { READY_THEMES } from "@pod/shared";
import { getProducts, getReadyDesigns, getSettings } from "@/lib/api";
import { ReadyGallery } from "@/components/ready/ReadyGallery";
import { IconSparkle } from "@/components/ui/icons";

export const revalidate = 60;

type Search = Promise<{ "chu-de"?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `Mẫu áo in sẵn theo chủ đề – chọn là in | ${s.brand.name}`;
  const description =
    "Hàng trăm mẫu áo in chữ vui, cặp đôi, nghề nghiệp, thể thao, gia đình. Chọn mẫu, chọn áo thun / hoodie / sweater / túi, sửa chữ theo ý và đặt in từ 1 chiếc – giao toàn quốc, COD.";
  return { title: { absolute: title }, description, alternates: { canonical: "/mau-in-san" }, openGraph: { title, description } };
}

export default async function ReadyDesignsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [items, list] = await Promise.all([getReadyDesigns(), getProducts({ "thiet-ke": "1", pageSize: "60" }).catch(() => null)]);
  const products = list?.items ?? [];

  return (
    <>
      <section className="border-b-2 border-ink bg-cream">
        <div className="container-site py-8 md:py-12">
          <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-extrabold tracking-wide shadow-hard">
            <IconSparkle className="h-3.5 w-3.5 text-accent" aria-hidden /> MẪU IN SẴN
          </p>
          <h1 className="mt-4 max-w-[760px] text-[clamp(28px,5.6vw,50px)] font-black leading-[1.05] tracking-tight">
            Chưa có ý tưởng?
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">Chọn mẫu – in liền.</span>
              <span className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.32em] -rotate-1 bg-brand" aria-hidden />
            </span>
          </h1>
          <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold text-ink/75">
            <li>
              <b className="text-ink">1.</b> Chọn mẫu theo chủ đề
            </li>
            <li>
              <b className="text-ink">2.</b> Chọn áo thun, hoodie, sweater, túi…
            </li>
            <li>
              <b className="text-ink">3.</b> Sửa tên, chữ, màu (hoặc giữ nguyên) → đặt in từ 1 chiếc
            </li>
          </ol>
        </div>
      </section>

      <section className="py-8 md:py-12" aria-label="Danh sách mẫu">
        <div className="container-site">
          {items.length ? (
            <ReadyGallery items={items} products={products} themes={READY_THEMES} initialTheme={sp["chu-de"]} back="/mau-in-san" />
          ) : (
            <p className="rounded-xl border-2 border-dashed border-ink/20 p-8 text-center text-ink/60">Đang cập nhật mẫu.</p>
          )}

          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border-2 border-ink bg-white p-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="text-lg font-black">Muốn in ảnh hoặc ý tưởng riêng?</p>
              <p className="text-sm text-ink/65">Tải ảnh, thêm chữ, sticker ngay trên trình duyệt – xem trước trên sản phẩm thật.</p>
            </div>
            <Link href="/thiet-ke" className="btn-primary shrink-0 px-6 py-3">
              Tự thiết kế từ đầu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
