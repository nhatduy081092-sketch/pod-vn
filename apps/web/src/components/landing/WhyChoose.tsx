import type { LandingSettings } from "@pod/shared";
import { IconBrush, IconLayers, IconShield, IconTruck, IconUsers, IconWallet } from "../ui/icons";

const ICONS = [IconLayers, IconBrush, IconShield, IconTruck, IconWallet, IconUsers];

export function WhyChoose({ data }: { data: LandingSettings["whyChoose"] }) {
  return (
    <section className="container-site py-10 md:py-16">
      <h2 className="text-center text-[clamp(22px,5.6vw,36px)] font-black">{data.title}</h2>
      <p className="mx-auto mt-2 max-w-[640px] text-center text-sm leading-relaxed text-ink/75 md:text-base">{data.text}</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {data.items.map((it, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
            <li key={it.title} className="rounded-lg border-2 border-ink bg-white p-3 shadow-stack-sm md:p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-brand-gold md:h-11 md:w-11">
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
              </span>
              <h3 className="mt-2 text-[13px] font-extrabold md:text-base">{it.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink/70 md:text-sm">{it.desc}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
