import { prisma, type Prisma } from "@pod/db";
import { parseTiers, sortPriceOf, type PriceTier } from "@pod/shared";
import { readXlsx, writeXlsx, type XlsxSheet } from "./xlsx";

/**
 * Bảng giá Excel: tải về (sheet "Bảng giá" + "Phân loại" + "Hướng dẫn") → sửa trong Excel → tải lên.
 * Khớp dòng theo "Mã SP" / "Mã phân loại" (không đổi), cột nhận theo TÊN tiêu đề nên có thể ẩn/xếp lại cột.
 */
export const SHEET_PRODUCTS = "Bảng giá";
export const SHEET_VARIANTS = "Phân loại";

const P = {
  id: "Mã SP",
  name: "Tên sản phẩm",
  category: "Danh mục",
  source: "Nguồn",
  sourcePrice: "Giá nguồn",
  basePrice: "Giá bán",
  compareAt: "Giá gạch",
  priceFrom: "Giá \"Từ\"",
  salePrice: "Giá KM",
  saleEnds: "KM đến ngày",
  minQty: "SL tối thiểu",
  tiers: "Giá theo SL",
  active: "Đang bán",
  slug: "Đường dẫn",
} as const;
const V = { id: "Mã phân loại", productId: "Mã SP", product: "Sản phẩm", color: "Màu", size: "Size", sku: "SKU", delta: "Phụ phí", active: "Đang bán" } as const;

const fmtDate = (d: Date | null) => (d ? new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10) : "");
const tiersText = (t: PriceTier[]) => t.map((x) => `${x.minQty}=${x.price}`).join("; ");

export async function exportPriceSheet(filter: { categoryId?: string; source?: string; q?: string }): Promise<Buffer> {
  const where: Prisma.ProductWhereInput = {
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.source === "oem" ? { externalId: { startsWith: "oem:" } } : filter.source === "yala" ? { externalId: null } : {}),
    ...(filter.q ? { name: { contains: filter.q, mode: "insensitive" as const } } : {}),
  };
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      externalId: true,
      sourcePrice: true,
      basePrice: true,
      compareAtPrice: true,
      priceFrom: true,
      salePrice: true,
      saleEndsAt: true,
      minQty: true,
      priceTiers: true,
      isActive: true,
      category: { select: { name: true } },
      variants: { orderBy: [{ sortOrder: "asc" }], select: { id: true, color: true, size: true, sku: true, priceDelta: true, isActive: true } },
    },
  });

  const productSheet: XlsxSheet = {
    name: SHEET_PRODUCTS,
    columns: [
      { header: P.id, width: 28, kind: "info" },
      { header: P.name, width: 46, kind: "info" },
      { header: P.category, width: 22, kind: "info" },
      { header: P.source, width: 8, kind: "info" },
      { header: P.sourcePrice, width: 12, kind: "infoMoney" },
      { header: P.basePrice, width: 12, kind: "money" },
      { header: P.compareAt, width: 12, kind: "money" },
      { header: P.priceFrom, width: 12, kind: "money" },
      { header: P.salePrice, width: 12, kind: "money" },
      { header: P.saleEnds, width: 13, kind: "text" },
      { header: P.minQty, width: 11, kind: "int" },
      { header: P.tiers, width: 30, kind: "text" },
      { header: P.active, width: 9, kind: "text" },
      { header: P.slug, width: 40, kind: "info" },
    ],
    rows: products.map((p) => [
      p.id,
      p.name,
      p.category.name,
      p.externalId?.startsWith("oem:") ? "OEM" : "YALA",
      p.sourcePrice ?? null,
      p.basePrice,
      p.compareAtPrice ?? null,
      p.priceFrom ?? null,
      p.salePrice ?? null,
      fmtDate(p.saleEndsAt),
      p.minQty,
      tiersText(parseTiers(p.priceTiers)),
      p.isActive ? "Có" : "Không",
      `/san-pham/${p.slug}`,
    ]),
  };
  const variantRows = products.flatMap((p) =>
    p.variants.filter((v) => v.color || v.size).map((v) => [v.id, p.id, p.name, v.color, v.size, v.sku, v.priceDelta, v.isActive ? "Có" : "Không"]),
  );
  const variantSheet: XlsxSheet = {
    name: SHEET_VARIANTS,
    columns: [
      { header: V.id, width: 28, kind: "info" },
      { header: V.productId, width: 28, kind: "info" },
      { header: V.product, width: 40, kind: "info" },
      { header: V.color, width: 14, kind: "info" },
      { header: V.size, width: 8, kind: "info" },
      { header: V.sku, width: 22, kind: "info" },
      { header: V.delta, width: 11, kind: "money" },
      { header: V.active, width: 9, kind: "text" },
    ],
    rows: variantRows,
  };
  const guide: XlsxSheet = {
    name: "Hướng dẫn",
    columns: [{ header: "Cách cập nhật giá bằng file này", width: 120, kind: "text" }],
    rows: [
      ["1. Chỉ sửa các cột nền TRẮNG. Cột nền xám (Mã SP, Tên, Danh mục, Giá nguồn…) chỉ để xem – sửa cũng không có tác dụng."],
      ["2. Không xoá / sửa cột \"Mã SP\" và \"Mã phân loại\" – hệ thống dựa vào đó để biết dòng nào là sản phẩm nào. Được xoá bớt dòng không cần đổi."],
      ["3. Giá bán: số tiền (VD 159000 hoặc 159.000 hoặc 159k). Giá bán = 0 → sản phẩm chuyển sang \"liên hệ báo giá\". Để TRỐNG → giữ nguyên giá cũ."],
      ["4. Giá gạch / Giá \"Từ\" / Giá KM: để trống = không dùng. Giá gạch phải lớn hơn giá bán; Giá KM phải nhỏ hơn giá bán. Giá \"Từ\" chỉ hiện khi Giá bán = 0."],
      ["5. KM đến ngày: dạng 2026-12-31 hoặc 31/12/2026 (trống = khuyến mãi không hết hạn)."],
      ["6. Giá theo SL (giá sỉ): dạng  100=108000; 300=104000  nghĩa là từ 100 cái giá 108.000đ, từ 300 cái giá 104.000đ. Để trống = không có giá sỉ."],
      ["7. SL tối thiểu: số nguyên ≥ 1. Đang bán: Có / Không."],
      ["8. Sheet \"Phân loại\": Phụ phí = tiền cộng thêm cho màu/size đó (VD size 3XL + 20000)."],
      ["9. Lưu file (giữ định dạng .xlsx) → CMS → Sản phẩm → Bảng giá Excel → Tải lên → xem trước thay đổi → Áp dụng."],
      ["10. Sản phẩm nguồn OEM đổi giá qua file sẽ được đánh dấu \"giá sửa tay\" – công thức Giá B2B không ghi đè nữa."],
    ],
  };
  return writeXlsx([productSheet, variantSheet, guide]);
}

/* ---------- Đọc & so sánh ---------- */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** "159.000" | "159,000đ" | "159k" | "1,5tr" | 159000 -> 159000; "" -> null */
export function parseMoney(raw: string): number | null | "invalid" {
  const s = raw.trim().toLowerCase().replace(/\s/g, "");
  if (!s) return null;
  const m = s.match(/^(-?[\d.,]+)(k|nghin|ngan|tr|trieu|m)?(d|đ|vnd)?$/);
  if (!m) return "invalid";
  let num = m[1]!;
  const unit = m[2];
  if (unit) {
    num = num.replace(",", "."); // 1,5tr
    const v = Number(num);
    if (!Number.isFinite(v)) return "invalid";
    return Math.round(v * (unit === "k" || unit === "nghin" || unit === "ngan" ? 1000 : 1_000_000));
  }
  // số thuần từ Excel ("159000" hoặc "159000.5"); có dấu phân cách nghìn -> bỏ
  if (/^-?\d+(\.\d+)?$/.test(num) && !/^-?\d{1,3}\.\d{3}$/.test(num)) return Math.round(Number(num));
  const digits = num.replace(/[.,]/g, "");
  return /^-?\d+$/.test(digits) ? Number(digits) : "invalid";
}

function parseBool(raw: string): boolean | null | "invalid" {
  const s = norm(raw);
  if (!s) return null;
  if (["co", "yes", "y", "x", "1", "true", "dangban", "ban"].includes(s)) return true;
  if (["khong", "no", "n", "0", "false", "ngung", "an"].includes(s)) return false;
  return "invalid";
}

function parseDate(raw: string): Date | null | "invalid" {
  const s = raw.trim();
  if (!s) return null;
  let y: number, mo: number, d: number;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const vn = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (iso) [y, mo, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (vn) [y, mo, d] = [Number(vn[3]), Number(vn[2]), Number(vn[1])];
  else if (/^\d{5}(\.\d+)?$/.test(s)) {
    // số ngày kiểu Excel (1900-date system)
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86400_000);
    [y, mo, d] = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  } else return "invalid";
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return "invalid";
  // hết ngày đó theo giờ Việt Nam
  return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59) - 7 * 3600_000);
}

function parseTierText(raw: string): PriceTier[] | "invalid" {
  const s = raw.trim();
  if (!s) return [];
  const out: PriceTier[] = [];
  for (const part of s.split(/[;\n|]+/).map((x) => x.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*(?:\+|cai|cái|sp)?\s*[=:→>-]+\s*(.+)$/i);
    if (!m) return "invalid";
    const price = parseMoney(m[2]!);
    if (price === null || price === "invalid" || price <= 0) return "invalid";
    out.push({ minQty: Number(m[1]), price });
  }
  out.sort((a, b) => a.minQty - b.minQty);
  if (out.some((t, i) => t.minQty < 2 || (i > 0 && t.minQty === out[i - 1]!.minQty))) return "invalid";
  return out;
}

export type PriceChange = {
  kind: "product" | "variant";
  id: string;
  name: string;
  fields: { field: string; before: string; after: string }[];
  data: Record<string, unknown>;
};
export type PriceImportReport = {
  dryRun: boolean;
  rows: number;
  changed: number;
  unchanged: number;
  errors: { sheet: string; row: number; message: string }[];
  changes: Omit<PriceChange, "data">[];
};

const money = (n: number | null | undefined) => (n ? n.toLocaleString("vi-VN") : n === 0 ? "0" : "—");

export async function importPriceSheet(buf: Buffer, dryRun: boolean): Promise<PriceImportReport> {
  const book = readXlsx(buf);
  const findSheet = (name: string) => [...book.entries()].find(([k]) => norm(k) === norm(name))?.[1];
  const ps = findSheet(SHEET_PRODUCTS) ?? (book.size === 1 ? [...book.values()][0] : undefined);
  const vs = findSheet(SHEET_VARIANTS);
  if (!ps) throw new Error(`Không thấy sheet "${SHEET_PRODUCTS}" – hãy dùng file tải về từ CMS`);

  const errors: PriceImportReport["errors"] = [];
  const changes: PriceChange[] = [];
  let rows = 0;
  let unchanged = 0;

  /* ----- Sản phẩm ----- */
  const header = (ps[0] ?? []).map(norm);
  const col = (h: string) => header.indexOf(norm(h));
  const ci = Object.fromEntries(Object.entries(P).map(([k, h]) => [k, col(h)])) as Record<keyof typeof P, number>;
  if (ci.id < 0) throw new Error(`Sheet "${SHEET_PRODUCTS}" thiếu cột "${P.id}"`);
  const body = ps.slice(1).map((r, i) => ({ r, line: i + 2 })).filter(({ r }) => (r[ci.id] ?? "").trim());
  const ids = [...new Set(body.map(({ r }) => r[ci.id]!.trim()))];
  const current = new Map(
    (
      await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, externalId: true, basePrice: true, compareAtPrice: true, priceFrom: true, salePrice: true, saleEndsAt: true, minQty: true, priceTiers: true, isActive: true },
      })
    ).map((p) => [p.id, p]),
  );
  const seen = new Set<string>();
  for (const { r, line } of body) {
    rows++;
    const id = r[ci.id]!.trim();
    const cur = current.get(id);
    const err = (message: string) => errors.push({ sheet: SHEET_PRODUCTS, row: line, message });
    if (!cur) {
      err(`Không tìm thấy sản phẩm có mã "${id}"`);
      continue;
    }
    if (seen.has(id)) {
      err(`Mã "${id}" bị lặp – chỉ dùng dòng đầu tiên`);
      continue;
    }
    seen.add(id);
    const cell = (k: keyof typeof P) => (ci[k] >= 0 ? (r[ci[k]] ?? "") : undefined);
    const rowErrors: string[] = [];
    const m = (k: keyof typeof P) => {
      const raw = cell(k);
      if (raw === undefined) return undefined; // cột không có -> giữ nguyên
      const v = parseMoney(raw);
      if (v === "invalid" || (typeof v === "number" && v < 0)) {
        rowErrors.push(`${P[k]} "${raw}" không phải số tiền`);
        return undefined;
      }
      return v;
    };
    const baseIn = m("basePrice");
    const basePrice = baseIn === undefined || baseIn === null ? cur.basePrice : baseIn; // trống = giữ nguyên
    const compareIn = m("compareAt");
    const fromIn = m("priceFrom");
    const saleIn = m("salePrice");
    let compareAtPrice = compareIn === undefined ? cur.compareAtPrice : compareIn || null;
    const priceFrom = fromIn === undefined ? cur.priceFrom : fromIn || null;
    let salePrice = saleIn === undefined ? cur.salePrice : saleIn || null;
    if (compareAtPrice && (basePrice <= 0 || compareAtPrice <= basePrice)) {
      if (compareIn !== undefined) rowErrors.push(`Giá gạch ${money(compareAtPrice)} phải lớn hơn giá bán ${money(basePrice)}`);
      compareAtPrice = null;
    }
    if (salePrice && (basePrice <= 0 || salePrice >= basePrice)) {
      if (saleIn !== undefined) rowErrors.push(`Giá KM ${money(salePrice)} phải nhỏ hơn giá bán ${money(basePrice)}`);
      salePrice = null;
    }
    let saleEndsAt = cur.saleEndsAt;
    const endRaw = cell("saleEnds");
    if (endRaw !== undefined) {
      const d = parseDate(endRaw);
      if (d === "invalid") rowErrors.push(`KM đến ngày "${endRaw}" không đúng dạng 2026-12-31`);
      else saleEndsAt = d;
    }
    if (!salePrice) saleEndsAt = null;
    let minQty = cur.minQty;
    const minRaw = cell("minQty");
    if (minRaw !== undefined && minRaw.trim()) {
      const n = Number(minRaw.replace(/[.,\s]/g, ""));
      if (!Number.isInteger(n) || n < 1 || n > 100000) rowErrors.push(`SL tối thiểu "${minRaw}" phải là số nguyên ≥ 1`);
      else minQty = n;
    }
    let tiers = parseTiers(cur.priceTiers);
    const tierRaw = cell("tiers");
    if (tierRaw !== undefined) {
      const t = parseTierText(tierRaw);
      if (t === "invalid") rowErrors.push(`Giá theo SL "${tierRaw}" sai dạng – VD: 100=108000; 300=104000`);
      else if (basePrice > 0 && t.some((x) => x.price >= basePrice)) rowErrors.push(`Giá theo SL phải thấp hơn giá bán ${money(basePrice)}`);
      else tiers = basePrice > 0 ? t : [];
    }
    let isActive = cur.isActive;
    const actRaw = cell("active");
    if (actRaw !== undefined) {
      const b = parseBool(actRaw);
      if (b === "invalid") rowErrors.push(`Đang bán "${actRaw}" – ghi Có hoặc Không`);
      else if (b !== null) isActive = b;
    }
    if (rowErrors.length) {
      for (const e of rowErrors) err(`${cur.name}: ${e}`);
      continue;
    }

    const fields: PriceChange["fields"] = [];
    const diff = (label: string, a: unknown, b: unknown, show: (v: never) => string) => {
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) fields.push({ field: label, before: show(a as never), after: show(b as never) });
    };
    diff("Giá bán", cur.basePrice, basePrice, money);
    diff("Giá gạch", cur.compareAtPrice, compareAtPrice, money);
    diff("Giá \"Từ\"", cur.priceFrom, priceFrom, money);
    diff("Giá KM", cur.salePrice, salePrice, money);
    diff("KM đến", cur.saleEndsAt?.toISOString() ?? null, saleEndsAt?.toISOString() ?? null, (v: string | null) => (v ? fmtDate(new Date(v)) : "—"));
    diff("SL tối thiểu", cur.minQty, minQty, String);
    diff("Giá theo SL", parseTiers(cur.priceTiers), tiers, (v: PriceTier[]) => tiersText(v) || "—");
    diff("Đang bán", cur.isActive, isActive, (v: boolean) => (v ? "Có" : "Không"));
    if (!fields.length) {
      unchanged++;
      continue;
    }
    const priceTouched = fields.some((f) => f.field !== "Đang bán");
    changes.push({
      kind: "product",
      id,
      name: cur.name,
      fields,
      data: {
        basePrice,
        compareAtPrice,
        priceFrom,
        salePrice,
        saleEndsAt,
        minQty,
        priceTiers: tiers,
        isActive,
        sortPrice: sortPriceOf(basePrice, priceFrom),
        ...(priceTouched && cur.externalId?.startsWith("oem:") ? { priceManual: true } : {}),
      },
    });
  }

  /* ----- Phân loại ----- */
  if (vs && vs.length > 1) {
    const vh = (vs[0] ?? []).map(norm);
    const vc = (h: string) => vh.indexOf(norm(h));
    const [vId, vDelta, vActive] = [vc(V.id), vc(V.delta), vc(V.active)];
    if (vId >= 0 && (vDelta >= 0 || vActive >= 0)) {
      const vbody = vs.slice(1).map((r, i) => ({ r, line: i + 2 })).filter(({ r }) => (r[vId] ?? "").trim());
      const cur = new Map(
        (
          await prisma.productVariant.findMany({
            where: { id: { in: vbody.map(({ r }) => r[vId]!.trim()) } },
            select: { id: true, color: true, size: true, priceDelta: true, isActive: true, product: { select: { name: true } } },
          })
        ).map((v) => [v.id, v]),
      );
      for (const { r, line } of vbody) {
        rows++;
        const id = r[vId]!.trim();
        const v = cur.get(id);
        const err = (message: string) => errors.push({ sheet: SHEET_VARIANTS, row: line, message });
        if (!v) {
          err(`Không tìm thấy phân loại có mã "${id}"`);
          continue;
        }
        const label = `${v.product.name} – ${[v.color, v.size].filter(Boolean).join(" / ")}`;
        let priceDelta = v.priceDelta;
        if (vDelta >= 0) {
          const raw = r[vDelta] ?? "";
          const neg = raw.trim().startsWith("-");
          const p = parseMoney(raw.replace(/^\s*[-+]/, ""));
          if (p === "invalid") {
            err(`${label}: Phụ phí "${raw}" không phải số tiền`);
            continue;
          }
          priceDelta = p === null ? 0 : neg ? -p : p;
        }
        let isActive = v.isActive;
        if (vActive >= 0) {
          const b = parseBool(r[vActive] ?? "");
          if (b === "invalid") {
            err(`${label}: Đang bán "${r[vActive]}" – ghi Có hoặc Không`);
            continue;
          }
          if (b !== null) isActive = b;
        }
        const fields: PriceChange["fields"] = [];
        if (priceDelta !== v.priceDelta) fields.push({ field: "Phụ phí", before: money(v.priceDelta), after: money(priceDelta) });
        if (isActive !== v.isActive) fields.push({ field: "Đang bán", before: v.isActive ? "Có" : "Không", after: isActive ? "Có" : "Không" });
        if (!fields.length) {
          unchanged++;
          continue;
        }
        changes.push({ kind: "variant", id, name: label, fields, data: { priceDelta, isActive } });
      }
    }
  }

  if (!dryRun && changes.length) {
    // 1 transaction: lỗi giữa chừng -> không đổi gì
    await prisma.$transaction(
      async (tx) => {
        for (const c of changes) {
          if (c.kind === "product") await tx.product.update({ where: { id: c.id }, data: c.data as Prisma.ProductUpdateInput });
          else await tx.productVariant.update({ where: { id: c.id }, data: c.data as Prisma.ProductVariantUpdateInput });
        }
      },
      { timeout: 120_000, maxWait: 10_000 },
    );
  }

  return {
    dryRun,
    rows,
    changed: changes.length,
    unchanged,
    errors: errors.slice(0, 200),
    changes: changes.slice(0, 300).map(({ data: _d, ...c }) => c),
  };
}
