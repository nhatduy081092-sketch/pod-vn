/**
 * Bảng size nhập dạng text trong CMS (dán thẳng từ Excel/Google Sheets được):
 *   Size | Dài áo (cm) | Rộng ngực (cm)
 *   S    | 66          | 48
 *   Ghi chú: sai số 1–2cm
 * Dòng có Tab hoặc | là hàng của bảng – dòng đầu tiên là tiêu đề.
 * Dòng còn lại là ghi chú hiển thị dưới bảng.
 */
export type SizeChart = { headers: string[]; rows: string[][]; notes: string[] };

export const SIZE_CHART_MAX = 5000;

export function parseSizeChart(text: string | null | undefined): SizeChart | null {
  // Chỉ bỏ khoảng trắng 2 đầu, giữ Tab (ô trống cuối dòng khi dán từ Excel)
  const lines = (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^ +| +$/g, ""))
    .filter((l) => l.trim());
  const table: string[][] = [];
  const notes: string[] = [];
  for (const line of lines) {
    if (!/[\t|]/.test(line)) {
      notes.push(line.trim());
      continue;
    }
    const cells = line.split(/\t|\|/).map((c) => c.trim());
    if (line.startsWith("|")) cells.shift(); // kiểu markdown "| S | 66 |"
    if (line.endsWith("|") && cells.length > 1 && cells.at(-1) === "") cells.pop();
    table.push(cells);
  }
  if (!table.length && !notes.length) return null;
  const [headers = [], ...rows] = table;
  const width = Math.max(headers.length, ...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(Math.max(0, width - r.length)).fill("")];
  return { headers: headers.length ? pad(headers) : [], rows: rows.map(pad), notes };
}

/** Bảng size dùng cho sản phẩm: riêng của sản phẩm, nếu trống thì lấy của danh mục */
export function resolveSizeChart(productChart?: string | null, categoryChart?: string | null): SizeChart | null {
  return parseSizeChart(productChart) ?? parseSizeChart(categoryChart);
}
