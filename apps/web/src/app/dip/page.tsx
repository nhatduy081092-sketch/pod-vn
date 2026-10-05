import type { Metadata } from "next";
import Link from "next/link";
import { campaignLive, vnShortDate } from "@pod/shared";
import { getSettings } from "@/lib/api";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Quà tặng theo dịp – 20/10, Halloween, 20/11, Noel, Tết",
  description: "Áo in chữ, quà in tên theo từng dịp lễ trong năm. Thiết kế online, in từ 1 chiếc, giao toàn quốc.",
  alternates: { canonical: "/dip" },
};

/** Lịch dịp lễ: các chiến dịch theo thứ tự thời gian, dịp đang chạy nổi bật */
export default async function CampaignsPage() {
  const s = await getSettings();
  const list = s.campaigns.filter((c) => c.enabled).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <section className="py-10 md:py-14">
      <div className="container-site">
        <h1 className="font-display text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1.02] tracking-[-0.025em] [font-stretch:88%]">Quà tặng theo dịp</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-muted">Chọn dịp sắp tới – mẫu chữ, sản phẩm và hạn chót đặt hàng để nhận kịp.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => {
            const live = campaignLive(c);
            return (
              <li key={c.slug}>
                <Link href={`/dip/${c.slug}`} className="sticker tilt hover-wiggle flex h-full flex-col p-6" style={{ backgroundColor: c.bg, color: c.dark ? "#fff" : "#1d1d1f", ["--r" as string]: `${i % 2 ? 1 : -1}deg` }}>
                  <span className="text-[13px] font-semibold opacity-75">
                    {vnShortDate(c.startsAt)} – {vnShortDate(c.endsAt)}
                    {live && " · đang diễn ra"}
                  </span>
                  <span className="mt-2 font-display text-3xl font-extrabold leading-tight">{c.name}</span>
                  <span className="mt-2 flex-1 text-[15px] leading-relaxed opacity-80">{c.title}</span>
                  {c.deadline && <span className="mt-4 text-sm font-bold">Hạn đặt: {vnShortDate(c.deadline)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
