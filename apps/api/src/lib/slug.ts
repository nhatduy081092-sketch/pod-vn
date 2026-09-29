import { slugify } from "@pod/shared";

/** Tạo slug duy nhất: ao-thun, ao-thun-2, ao-thun-3... */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<{ id: string } | null>,
  excludeId?: string,
): Promise<string> {
  const base = slugify(input) || "item";
  for (let i = 1; i < 200; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const found = await exists(candidate);
    if (!found || found.id === excludeId) return candidate;
  }
  return `${base}-${Date.now()}`;
}
