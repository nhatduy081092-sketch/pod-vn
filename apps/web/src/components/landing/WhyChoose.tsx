import type { LandingSettings } from "@pod/shared";
import { IconBrush, IconLayers, IconShield, IconTruck, IconUsers, IconWallet } from "../ui/icons";

const ICONS = [IconLayers, IconBrush, IconShield, IconTruck, IconWallet, IconUsers];

export function WhyChoose({ data }: { data: LandingSettings["whyChoose"] }) {
  return (
    <section className="container-site py-10 md:py-16">
      <h2 className="h-section text-center">{data.title}</h2>
      <p className="mx-auto mt-3 max-w-[640px] text-center text-[15px] leading-relaxed text-muted md:text-base">{data.text}</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {data.items.map((it, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <li key={it.title} className="rounded-2xl bg-surface p-4 md:p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand md:h-11 md:w-11">
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
              </span>
              <h3 className="mt-3 text-[14px] font-semibold md:text-base">{it.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted md:text-sm">{it.desc}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
