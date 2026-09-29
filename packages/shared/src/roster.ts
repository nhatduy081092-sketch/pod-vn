import { z } from "zod";
import { removeVietnameseTones } from "./vn";

/**
 * Danh sách đồng phục nhóm: mỗi dòng = 1 áo (tên in, số áo, size, ghi chú).
 * Nguồn: file Excel (.xlsx), CSV, hoặc copy-dán thẳng từ Excel/Google Sheets.
 */
export const TEAM_SIZE_LABEL = "Theo danh sách";
export const ROSTER_MAX_ROWS = 1000;

export const rosterRowSchema = z.object({
  name: z.string().trim().max(30, "Tên in tối đa 30 ký tự").default(""),
  number: z
    .string()
    .trim()
    .regex(/^\d{0,3}$/, "Số áo tối đa 3 chữ số")
    .default(""),
  size: z.string().trim().min(1, "Thiếu size").max(20),
  note: z.string().trim().max(60).default(""),
});
export type RosterRow = z.infer<typeof rosterRowSchema>;

export type RosterIssue = { line: number; message: string };
export type RosterParseResult = { rows: RosterRow[]; issues: RosterIssue[] };

/** Chuẩn hoá size: "xxl" -> "2XL", "xl " -> "XL", "4-5t" -> "4-5T"; khớp với danh sách size của sản phẩm */
export function normalizeSize(raw: string, allowed: string[]): string | null {
  const clean = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) return null;
  const alias: Record<string, string> = { XXL: "2XL", XXXL: "3XL", XXXXL: "4XL", "2X": "2XL", "3X": "3XL", FREESIZE: "FREE SIZE", FREE: "FREE SIZE" };
  const candidate = alias[clean] ?? clean;
  const found = allowed.find((s) => s.toUpperCase().replace(/\s+/g, "") === candidate.replace(/\s+/g, ""));
  return found ?? null;
}

const HEADER_KEYS: Record<keyof RosterRow, string[]> = {
  name: ["ten", "ten in", "ho ten", "name", "ten tren ao"],
  number: ["so", "so ao", "number", "no", "so in"],
  size: ["size", "co", "kich co", "kich thuoc", "sz"],
  note: ["ghi chu", "note", "notes", "chu thich"],
};

function keyOf(header: string): keyof RosterRow | null {
  const h = removeVietnameseTones(header).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  for (const [k, list] of Object.entries(HEADER_KEYS) as [keyof RosterRow, string[]][]) {
    if (list.includes(h)) return k;
  }
  return null;
}

/** Tách CSV/TSV (có hỗ trợ dấu ngoặc kép) – tự nhận dấu phân cách tab / , / ; */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const firstLine = src.split("\n", 1)[0] ?? "";
  const delim = ["\t", ";", ","].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/**
 * Bảng ô (từ xlsx hoặc CSV) -> danh sách hợp lệ + lỗi theo dòng.
 * Có dòng tiêu đề thì map theo tên cột; không có thì mặc định: Tên | Số | Size | Ghi chú.
 */
export function rowsToRoster(table: string[][], allowedSizes: string[]): RosterParseResult {
  const rows: RosterRow[] = [];
  const issues: RosterIssue[] = [];
  const nonEmpty = table.map((r, i) => ({ r: r.map((c) => String(c ?? "").trim()), line: i + 1 })).filter((x) => x.r.some(Boolean));
  if (!nonEmpty.length) return { rows, issues: [{ line: 0, message: "File trống" }] };

  let cols: Partial<Record<keyof RosterRow, number>> = { name: 0, number: 1, size: 2, note: 3 };
  const headerMap: Partial<Record<keyof RosterRow, number>> = {};
  nonEmpty[0]!.r.forEach((h, idx) => {
    const k = keyOf(h);
    if (k && headerMap[k] === undefined) headerMap[k] = idx;
  });
  const hasHeader = headerMap.size !== undefined;
  if (hasHeader) cols = headerMap;
  const body = hasHeader ? nonEmpty.slice(1) : nonEmpty;
  const sizes = allowedSizes.length ? allowedSizes : ["FREE SIZE"];

  for (const { r, line } of body) {
    if (rows.length >= ROSTER_MAX_ROWS) {
      issues.push({ line, message: `Tối đa ${ROSTER_MAX_ROWS} dòng` });
      break;
    }
    const get = (k: keyof RosterRow) => (cols[k] === undefined ? "" : r[cols[k]!] ?? "");
    const rawSize = get("size");
    const size = allowedSizes.length ? normalizeSize(rawSize, sizes) : rawSize || "Free size";
    if (!size) {
      issues.push({ line, message: rawSize ? `Size "${rawSize}" không có (chọn: ${sizes.join(", ")})` : "Thiếu size" });
      continue;
    }
    const parsed = rosterRowSchema.safeParse({ name: get("name"), number: get("number").replace(/\.0+$/, ""), size, note: get("note") });
    if (!parsed.success) {
      issues.push({ line, message: parsed.error.issues[0]?.message ?? "Dòng không hợp lệ" });
      continue;
    }
    rows.push(parsed.data);
  }
  if (!rows.length && !issues.length) issues.push({ line: 0, message: "Không tìm thấy dòng dữ liệu nào" });
  return { rows, issues };
}

/** Đếm số lượng theo size, giữ thứ tự size của sản phẩm */
export function sizeSummary(rows: RosterRow[], order: string[] = []): { size: string; qty: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.size, (m.get(r.size) ?? 0) + 1);
  const idx = (s: string) => {
    const i = order.indexOf(s);
    return i === -1 ? 999 : i;
  };
  return [...m.entries()].map(([size, qty]) => ({ size, qty })).sort((a, b) => idx(a.size) - idx(b.size));
}

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) */
export function rosterToCsv(rows: RosterRow[]): string {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return "﻿" + ["STT,Tên in,Số áo,Size,Ghi chú", ...rows.map((r, i) => [String(i + 1), r.name, r.number, r.size, r.note].map(esc).join(","))].join("\r\n");
}

export function rosterTemplateCsv(sizes: string[]): string {
  const s = (i: number) => sizes[i % Math.max(1, sizes.length)] ?? "M";
  const sample = [
    ["NGUYỄN AN", "10", s(1), ""],
    ["TRẦN BÌNH", "7", s(2), ""],
    ["LÊ CHI", "", s(0), "Không in số"],
    ["PHẠM DŨNG", "99", s(3), "Đội trưởng"],
  ];
  return "﻿" + ["Tên in,Số áo,Size,Ghi chú", ...sample.map((r) => r.join(","))].join("\r\n");
}
