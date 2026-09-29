/** Tiêu đề dạng "nhãn vàng có tay cầm" – giống "Best Sellers" / "Hot Sale Products" */
export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-20 justify-center">
      <div className="relative">
        <Handle className="-left-[18px]" />
        <Handle className="-right-[18px]" />
        <h2 className="relative rounded-md border-2 border-ink bg-brand-gold px-6 pb-2.5 pt-1 text-center text-[clamp(18px,5vw,28px)] font-black leading-tight tracking-tight text-ink shadow-[0_2px_0_#1d1d1f]">
          {children}
          <span className="absolute inset-x-0 bottom-0.5 block text-center text-[6px] font-bold tracking-[0.45em] text-ink/40" aria-hidden>
            •••• IN TOÀN THÂN ••••
          </span>
        </h2>
      </div>
    </div>
  );
}

function Handle({ className }: { className: string }) {
  return (
    <span className={`absolute top-1/2 flex -translate-y-1/2 flex-col gap-1 ${className}`} aria-hidden>
      <span className="block h-2 w-5 rounded-full border-2 border-ink bg-brand-dark" />
      <span className="block h-2 w-5 rounded-full border-2 border-ink bg-brand-dark" />
    </span>
  );
}
