import type { LandingSettings } from "@pod/shared";
import { pastel } from "@/lib/pastel";
import { IconBrush, IconLayers, IconShield, IconTruck, IconUsers, IconWallet } from "../ui/icons";

const ICONS = [IconLayers, IconBrush, IconShield, IconTruck, IconWallet, IconUsers];

/** Cam kết: 1 dải gọn (icon sticker + tiêu đề + 1 dòng), thay cho 6 thẻ to */
export function WhyChoose({ data }: { data: LandingSettings["whyChoose"] }) {
  return (
    <section className="container-site py-12 md:py-16" aria-label={data.title} data-reveal>
      <h2 className="h-section">{data.title}</h2>
      <ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-3 lg:grid-cols-6">
        {data.items.map((it, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <li key={it.title}>
              <span className={`sticker inline-grid h-12 w-12 place-items-center rounded-xl shadow-sticker-sm ${pastel(i)}`}>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-display text-[16px] font-bold leading-tight">{it.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/65 md:text-sm">{it.desc}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
