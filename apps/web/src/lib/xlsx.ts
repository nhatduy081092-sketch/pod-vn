"use client";
/**
 * Đọc sheet đầu tiên của file .xlsx ngay trên trình duyệt, không cần thư viện:
 * .xlsx = file ZIP chứa XML -> giải nén bằng DecompressionStream("deflate-raw") + DOMParser.
 * Trả về mảng dòng/ô dạng chuỗi.
 */
type Entry = { name: string; method: number; compSize: number; offset: number };

function u16(b: Uint8Array, o: number) {
  return b[o]! | (b[o + 1]! << 8);
}
function u32(b: Uint8Array, o: number) {
  return (b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24)) >>> 0;
}

function readEntries(b: Uint8Array): Entry[] {
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (u32(b, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("File không phải .xlsx hợp lệ");
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const dec = new TextDecoder();
  const out: Entry[] = [];
  for (let i = 0; i < count; i++) {
    if (u32(b, p) !== 0x02014b50) break;
    const method = u16(b, p + 10);
    const compSize = u32(b, p + 20);
    const nameLen = u16(b, p + 28);
    const extraLen = u16(b, p + 30);
    const commentLen = u16(b, p + 32);
    const offset = u32(b, p + 42);
    out.push({ name: dec.decode(b.subarray(p + 46, p + 46 + nameLen)), method, compSize, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function extract(b: Uint8Array, e: Entry): Promise<string> {
  const start = e.offset + 30 + u16(b, e.offset + 26) + u16(b, e.offset + 28);
  const data = b.subarray(start, start + e.compSize);
  if (e.method === 0) return new TextDecoder().decode(data);
  if (e.method !== 8) throw new Error("Kiểu nén không hỗ trợ");
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return await new Response(stream).text();
}

function colIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const byTag = (root: Document | Element, tag: string) => Array.from(root.getElementsByTagNameNS("*", tag));
const textOf = (el: Element) => byTag(el, "t").map((t) => t.textContent ?? "").join("");

export async function readXlsxFirstSheet(file: File): Promise<string[][]> {
  const b = new Uint8Array(await file.arrayBuffer());
  const entries = readEntries(b);
  const find = (n: string) => entries.find((e) => e.name.toLowerCase() === n.toLowerCase());
  const parser = new DOMParser();
  const xml = async (e: Entry) => parser.parseFromString(await extract(b, e), "application/xml");

  // shared strings
  const ssEntry = find("xl/sharedStrings.xml");
  const shared = ssEntry ? byTag(await xml(ssEntry), "si").map(textOf) : [];

  // sheet đầu tiên theo workbook.xml (fallback sheet1.xml)
  let sheetPath = "xl/worksheets/sheet1.xml";
  const wb = find("xl/workbook.xml");
  const rels = find("xl/_rels/workbook.xml.rels");
  if (wb && rels) {
    const first = byTag(await xml(wb), "sheet")[0];
    const rid = first?.getAttribute("r:id") ?? first?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const rel = byTag(await xml(rels), "Relationship").find((r) => r.getAttribute("Id") === rid);
    const target = rel?.getAttribute("Target");
    if (target) sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  }
  const sheetEntry = find(sheetPath) ?? entries.find((e) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(e.name));
  if (!sheetEntry) throw new Error("Không tìm thấy sheet trong file");

  const rows: string[][] = [];
  for (const row of byTag(await xml(sheetEntry), "row")) {
    const cells: string[] = [];
    for (const c of byTag(row, "c")) {
      const idx = colIndex(c.getAttribute("r") ?? "A");
      const t = c.getAttribute("t");
      const v = byTag(c, "v")[0]?.textContent ?? "";
      let val = v;
      if (t === "s") val = shared[Number(v)] ?? "";
      else if (t === "inlineStr") val = textOf(c);
      else if (t === "b") val = v === "1" ? "TRUE" : "FALSE";
      cells[idx] = val;
    }
    rows.push(Array.from(cells, (x) => x ?? ""));
  }
  return rows;
}
