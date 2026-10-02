import type { Metadata } from "next";
import Link from "next/link";
import { HELP_CATEGORIES } from "@pod/shared";
import { getHelp } from "@/lib/api";

export const metadata: Metadata = {
  title: "Trung tâm hỗ trợ",
  description: "Hướng dẫn đặt in áo, thiết kế, thanh toán, vận chuyển, đổi trả và làm seller dropship.",
  alternates: { canonical: "/ho-tro" },
};

type SP = Promise<{ q?: string; dm?: string }>;

export default async function HelpPage({ searchParams }: { searchParams: SP }) {
  const { q = "", dm = "" } = await searchParams;
  const data = await getHelp({ q: q.slice(0, 80), category: dm || undefined });
  const cats = data.categories.length ? data.categories : HELP_CATEGORIES.map((c) => ({ ...c }));
  const grouped = cats.map((c) => ({ ...c, items: data.items.filter((i) => i.category === c.key) })).filter((c) => c.items.length);

  return (
    <div className="container-site py-6 md:py-12">
      <div className="rounded-2xl border border-line bg-brand p-5 shadow-hard md:p-10">
        <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Chúng tôi có thể giúp gì?</h1>
        <form action="/ho-tro" className="mt-4 flex max-w-xl gap-2">
          <input name="q" defaultValue={q} className="input flex-1 bg-white" placeholder="VD: file in, đổi trả, VietQR…" aria-label="Tìm bài hướng dẫn" />
          {dm && <input type="hidden" name="dm" value={dm} />}
          <button className="btn border-ink bg-ink px-5 text-white">Tìm</button>
        </form>
      </div>

      <nav className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4" aria-label="Chủ đề">
        <Link href={q ? `/ho-tro?q=${encodeURIComponent(q)}` : "/ho-tro"} className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-sm font-semibold ${!dm ? "border-ink bg-ink text-white" : "border-ink/20"}`}>
          Tất cả
        </Link>
        {cats.map((c) => (
          <Link
            key={c.key}
            href={`/ho-tro?dm=${c.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm font-semibold ${dm === c.key ? "border-ink bg-ink text-white" : "border-ink/20"}`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </nav>

      {q && (
        <p className="mt-4 text-sm text-ink/70">
          {data.items.length} kết quả cho “{q}”
        </p>
      )}

      {grouped.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grouped.map((c) => (
            <section key={c.key} className="rounded-xl border-2 border-ink/10 bg-white p-4">
              <h2 className="font-extrabold">
                {c.icon} {c.name}
              </h2>
              <ul className="mt-2 space-y-1.5">
                {c.items.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/ho-tro/${a.slug}`} className="text-sm text-ink/80 underline-offset-2 hover:text-ink hover:underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-ink/60">Chưa tìm thấy bài phù hợp. Nhắn Zalo hoặc để lại số điện thoại ở nút liên hệ góc phải, chúng tôi gọi lại.</p>
      )}
    </div>
  );
}
