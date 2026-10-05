import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getSettings } from "@/lib/api";
import { EditorLoader } from "@/components/editor/EditorLoader";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ saved?: string; seller?: string; template?: string; back?: string; mau?: string; preset?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return { title: p ? `Thiết kế ${p.name}` : "Thiết kế", robots: { index: false, follow: false } };
}

export default async function DesignPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ slug }, sp, settings] = await Promise.all([params, searchParams, getSettings()]);
  const product = await getProduct(slug);
  if (!product || !product.printAreas.length) notFound();
  const seller = sp.seller === "1";
  // chỉ cho quay về đường dẫn nội bộ (chặn open-redirect)
  const back = sp.back && sp.back.startsWith("/") && !sp.back.startsWith("//") ? sp.back : seller ? "/seller/mau" : `/san-pham/${product.slug}#thiet-ke`;
  return <EditorLoader product={product} mode={seller ? "seller" : "customer"} savedId={sp.saved ?? null} templateId={sp.template ?? null} presetSlug={sp.preset ?? null} initialColor={sp.mau ?? null} returnTo={back} models={settings.media.models} />;
}
