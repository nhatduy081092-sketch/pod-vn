import "server-only";
import { mergeLanding, type ContentPage, type LandingSettings } from "@pod/shared";
import { API_URL } from "./config";
import type { Category, HomeData, Paged, ProductCardData, ProductDetail } from "./types";

const REVALIDATE = 60; // ISR: cập nhật nội dung CMS sau tối đa 60s

/**
 * Lúc build Docker không có API (http://api:4000 chưa chạy): báo lỗi NGAY thay vì chờ mạng
 * (DNS/kết nối treo làm trang build quá 60s -> hỏng cả bản build). Trang dùng dữ liệu dự phòng,
 * deploy.sh gọi /revalidate sau khi chạy -> trang được dựng lại với dữ liệu thật.
 */
const BUILDING = process.env.NEXT_PHASE === "phase-production-build";

async function get<T>(path: string, opts: { revalidate?: number; allow404?: boolean } = {}): Promise<T | null> {
  if (BUILDING) throw new Error(`API chưa sẵn sàng lúc build (${path})`);
  const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate: opts.revalidate ?? REVALIDATE }, signal: AbortSignal.timeout(10_000) });
  if (res.status === 404 && opts.allow404) return null;
  if (!res.ok) throw new Error(`API ${path} lỗi ${res.status}`);
  return (await res.json()) as T;
}

export async function getHome(): Promise<HomeData> {
  return (await get<HomeData>("/home"))!;
}

export async function getSettings(): Promise<LandingSettings> {
  try {
    return mergeLanding(await get<LandingSettings>("/settings"));
  } catch {
    return mergeLanding(null); // API chết vẫn render được header/footer
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return (await get<Category[]>("/categories")) ?? [];
  } catch {
    return [];
  }
}

export const getCategory = (slug: string) => get<Category>(`/categories/${encodeURIComponent(slug)}`, { allow404: true });
export const getProduct = (slug: string) => get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { allow404: true });

export async function getProducts(params: Record<string, string | undefined>): Promise<Paged<ProductCardData>> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  return (await get<Paged<ProductCardData>>(`/products?${qs.toString()}`))!;
}

export type PageLink = Pick<ContentPage, "slug" | "title" | "showInFooter" | "sortOrder">;

export async function getPages(): Promise<PageLink[]> {
  try {
    return (await get<PageLink[]>("/pages")) ?? [];
  } catch {
    return [];
  }
}

export const getPage = (slug: string) => get<ContentPage>(`/pages/${encodeURIComponent(slug)}`, { allow404: true });

export type Facets = {
  subcategories: { slug: string; name: string; count: number }[];
  categories: { slug: string; name: string; count: number }[];
};

export async function getFacets(params: Record<string, string | undefined>): Promise<Facets> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  try {
    return (await get<Facets>(`/facets?${qs.toString()}`)) ?? { subcategories: [], categories: [] };
  } catch {
    return { subcategories: [], categories: [] };
  }
}

export async function getNotices(): Promise<import("./types").Notice[]> {
  try {
    return (await get<import("./types").Notice[]>("/notices")) ?? [];
  } catch {
    return [];
  }
}

export type HelpList = {
  categories: { key: string; name: string; icon: string }[];
  items: { slug: string; category: string; title: string; updatedAt: string }[];
};

export async function getHelp(params: { q?: string; category?: string } = {}): Promise<HelpList> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  try {
    return (await get<HelpList>(`/help?${qs.toString()}`, { revalidate: params.q ? 0 : 60 })) ?? { categories: [], items: [] };
  } catch {
    return { categories: [], items: [] };
  }
}

export const getHelpArticle = (slug: string) =>
  get<{ slug: string; category: string; title: string; content: string; updatedAt: string; related: { slug: string; title: string }[] }>(`/help/${encodeURIComponent(slug)}`, {
    allow404: true,
  });
