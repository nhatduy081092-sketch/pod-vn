import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api";
import { ContentRenderer } from "@/components/ContentRenderer";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return { title: page.title, alternates: { canonical: `/trang/${page.slug}` } };
}

export default async function ContentPageView({ params }: { params: Params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <div className="container-site max-w-3xl py-6 md:py-12">
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>{" "}
        / <span className="text-ink">{page.title}</span>
      </nav>
      <h1 className="mb-6 mt-2 text-2xl font-black md:text-4xl">{page.title}</h1>
      <ContentRenderer content={page.content} />
    </div>
  );
}
