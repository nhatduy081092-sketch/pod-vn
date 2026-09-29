import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateVN, HELP_CATEGORIES } from "@pod/shared";
import { ContentRenderer } from "@/components/ContentRenderer";
import { getHelpArticle } from "@/lib/api";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = await getHelpArticle((await params).slug);
  if (!a) return { title: "Không tìm thấy" };
  return { title: a.title, alternates: { canonical: `/ho-tro/${a.slug}` } };
}

export default async function HelpArticlePage({ params }: { params: Params }) {
  const a = await getHelpArticle((await params).slug);
  if (!a) notFound();
  const cat = HELP_CATEGORIES.find((c) => c.key === a.category);
  return (
    <div className="container-site max-w-3xl py-6 md:py-12">
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/ho-tro" className="hover:underline">
          Hỗ trợ
        </Link>
        {cat && (
          <>
            {" / "}
            <Link href={`/ho-tro?dm=${cat.key}`} className="hover:underline">
              {cat.name}
            </Link>
          </>
        )}
      </nav>
      <h1 className="mb-1 mt-2 text-2xl font-black md:text-4xl">{a.title}</h1>
      <p className="mb-6 text-xs text-ink/50">Cập nhật {formatDateVN(a.updatedAt)}</p>
      <ContentRenderer content={a.content} />
      {a.related.length > 0 && (
        <section className="mt-10 border-t border-ink/10 pt-5">
          <h2 className="font-extrabold">Bài liên quan</h2>
          <ul className="mt-2 space-y-1.5">
            {a.related.map((r) => (
              <li key={r.slug}>
                <Link href={`/ho-tro/${r.slug}`} className="text-sm underline-offset-2 hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
