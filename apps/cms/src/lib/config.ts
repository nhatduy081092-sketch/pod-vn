export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
export const WEB_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path) || path.startsWith("blob:")) return path;
  return path.startsWith("/") ? path : `/${path}`; // rewrites -> API
}
