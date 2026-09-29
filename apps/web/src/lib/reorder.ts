"use client";
import { TEAM_SIZE_LABEL } from "@pod/shared";
import type { CartItem } from "./cart";
import { assetUrl } from "./config";
import type { OrderView, ProductDetail } from "./types";

/**
 * Đặt lại đơn cũ: lấy giá & biến thể HIỆN TẠI của sản phẩm (không dùng giá cũ), giữ nguyên thiết kế + danh sách đồng phục.
 * Trả về các dòng thêm được và danh sách sản phẩm không còn bán.
 */
export async function buildReorder(items: OrderView["items"]): Promise<{ lines: Omit<CartItem, "key">[]; skipped: string[] }> {
  const lines: Omit<CartItem, "key">[] = [];
  const skipped: string[] = [];
  const cache = new Map<string, ProductDetail | null>();
  for (const it of items) {
    const slug = it.product?.slug;
    if (!slug || it.product?.isActive === false) {
      skipped.push(it.productName);
      continue;
    }
    if (!cache.has(slug)) {
      const r = await fetch(`/api/products/${encodeURIComponent(slug)}`);
      cache.set(slug, r.ok ? ((await r.json()) as ProductDetail) : null);
    }
    const p = cache.get(slug);
    if (!p || p.basePrice <= 0) {
      skipped.push(it.productName);
      continue;
    }
    const team = !!it.roster?.length;
    const v = !team ? (p.variants.find((x) => x.id === it.variantId) ?? p.variants.find((x) => x.color === it.color && x.size === it.size)) : undefined;
    if (!team && p.variants.length && !v) {
      skipped.push(`${it.productName} (${[it.color, it.size].filter(Boolean).join(" / ")} hết hàng)`);
      continue;
    }
    const usedAreas = it.design?.files.map((f) => f.area) ?? [];
    const areaExtras = p.printAreas.filter((a) => usedAreas.includes(a.key)).reduce((s, a) => s + a.extraPrice, 0);
    const colorVariants = p.variants.filter((x) => x.color === it.color);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: it.design?.files[0]?.previewUrl ?? p.images[0] ?? "",
      size: team ? TEAM_SIZE_LABEL : (v?.size ?? it.size),
      color: v?.color ?? it.color,
      quantity: team ? it.roster!.length : it.quantity,
      roster: team ? it.roster! : undefined,
      sizeDeltas: team ? Object.fromEntries(colorVariants.filter((x) => x.priceDelta).map((x) => [x.size, x.priceDelta])) : undefined,
      basePrice: p.basePrice,
      priceTiers: p.priceTiers,
      salePrice: p.salePrice ?? null,
      saleEndsAt: p.saleEndsAt ?? null,
      minQty: p.minQty,
      variantId: v?.id,
      sku: v?.sku,
      variantDelta: v?.priceDelta ?? 0,
      areaExtras,
      design: it.design ?? undefined,
      designUrl: it.design ? "" : it.designUrl,
      designPreview: it.design?.files[0] ? assetUrl(it.design.files[0].previewUrl) : "",
      printMode: it.printMode === "PATTERN" ? "PATTERN" : "FILL",
      designNote: it.designNote ?? "",
    });
  }
  return { lines, skipped };
}
