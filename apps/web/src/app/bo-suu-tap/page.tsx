import type { Metadata } from "next";
import Link from "next/link";
import { DESIGN_COLLECTIONS, READY_DESIGNS } from "@pod/shared";
import { DesignPreview } from "@/components/designs/DesignPreview";
import { DesignFonts } from "@/components/designs/DesignFonts";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Mẫu áo có sẵn theo chủ đề – sửa chữ miễn phí",
  description: `${READY_DESIGNS.length} mẫu áo chữ tiếng Việt theo ${DESIGN_COLLECTIONS.length} chủ đề: gym, pickleball, cà phê, cặp đôi, gia đình, Tết… Chọn mẫu, sửa chữ, in từ 1 chiếc.`,
  alternates: { canonical: "/bo-suu-tap" },
};

export default function CollectionsPage() {
  const covers = DESIGN_COLLECTIONS.map((c) => ({ c, d: c.designs[0]! }));
  return (
    <div className="container-site py-8 md:py-14">
      <DesignFonts designs={covers.map((x) => x.d)} />
      <p className="eyebrow">Chưa có ý tưởng? Bắt đầu từ mẫu có sẵn</p>
      <h1 className="h-section mt-1.5">Mẫu có sẵn theo chủ đề</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-muted md:text-base">
        {READY_DESIGNS.length} mẫu chữ tiếng Việt do YALA thiết kế. Chọn mẫu → sửa chữ, đổi màu áo trong YALA Studio → in từ 1 chiếc.
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
        {covers.map(({ c, d }) => (
          <li key={c.slug}>
            <Link href={`/bo-suu-tap/${c.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ backgroundColor: c.tint }}>
                <DesignPreview design={d} className="absolute inset-[7%] h-[86%] w-[86%] transition duration-300 group-hover:scale-[1.04]" title={c.name} />
              </div>
              <h2 className="mt-3 text-base font-semibold md:text-lg">{c.name}</h2>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-muted md:text-sm">{c.blurb}</p>
              <p className="mt-1 text-[13px] font-medium">{c.designs.length} mẫu →</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
