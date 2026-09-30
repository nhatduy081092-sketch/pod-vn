"use client";
import { canChiYear, solarToLunar } from "@pod/shared";

export type CalendarStyle = {
  year: number;
  month: number; // 1–12
  font: string;
  color: string; // chữ chính
  accent: string; // chủ nhật, ngày lễ, mùng 1
  lunar: boolean;
  grid: boolean; // kẻ ô
  paper: string | null; // nền (null = trong suốt)
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
/** Ngày lễ dương lịch & âm lịch (tô màu nhấn) */
const SOLAR_HOLIDAYS = new Set(["1/1", "30/4", "1/5", "2/9"]);
const LUNAR_HOLIDAYS = new Set(["1/1", "2/1", "3/1", "10/3"]);

/**
 * Vẽ lịch 1 tháng (tuần bắt đầu Thứ 2, kèm âm lịch) thành PNG đúng kích thước in.
 * wPx/hPx: kích thước ảnh; nền trong suốt để đặt lên ảnh của khách.
 */
export async function renderMonth(s: CalendarStyle, wPx: number, hPx: number): Promise<Blob> {
  if ("fonts" in document) await Promise.all([document.fonts.load(`700 40px "${s.font}"`), document.fonts.load(`400 40px "${s.font}"`)]).catch(() => undefined);
  const c = document.createElement("canvas");
  c.width = Math.round(wPx);
  c.height = Math.round(hPx);
  const ctx = c.getContext("2d")!;
  const W = c.width;
  const H = c.height;
  if (s.paper) {
    ctx.fillStyle = s.paper;
    ctx.fillRect(0, 0, W, H);
  }
  const font = (weight: number, px: number) => `${weight} ${Math.round(px)}px "${s.font}", "Be Vietnam Pro", sans-serif`;
  const pad = W * 0.03;
  const titleH = H * 0.16;
  const headH = H * 0.08;
  const gridTop = titleH + headH;
  const cellW = (W - pad * 2) / 7;
  const first = new Date(s.year, s.month - 1, 1);
  const days = new Date(s.year, s.month, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // T2 = 0
  const rows = Math.ceil((offset + days) / 7);
  const cellH = (H - gridTop - pad * 0.5) / rows;

  // tiêu đề
  ctx.textBaseline = "middle";
  ctx.fillStyle = s.color;
  ctx.textAlign = "left";
  ctx.font = font(800, titleH * 0.62);
  ctx.fillText(`THÁNG ${s.month}`, pad, titleH * 0.5);
  ctx.textAlign = "right";
  ctx.font = font(700, titleH * 0.42);
  ctx.fillText(String(s.year), W - pad, titleH * (s.lunar ? 0.36 : 0.5));
  if (s.lunar) {
    const mid = solarToLunar(15, s.month, s.year);
    ctx.font = font(400, titleH * 0.2);
    ctx.globalAlpha = 0.75;
    ctx.fillText(`Năm ${canChiYear(mid.year)}`, W - pad, titleH * 0.74);
    ctx.globalAlpha = 1;
  }

  // thứ
  ctx.textAlign = "center";
  ctx.font = font(700, headH * 0.5);
  WEEKDAYS.forEach((d, i) => {
    ctx.fillStyle = i === 6 ? s.accent : s.color;
    ctx.fillText(d, pad + cellW * (i + 0.5), titleH + headH * 0.5);
  });

  // lưới
  if (s.grid) {
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = Math.max(1, W * 0.0012);
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(pad, gridTop + r * cellH);
      ctx.lineTo(W - pad, gridTop + r * cellH);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ngày
  for (let d = 1; d <= days; d++) {
    const idx = offset + d - 1;
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const cx = pad + cellW * (col + 0.5);
    const cy = gridTop + cellH * row;
    const lunar = s.lunar ? solarToLunar(d, s.month, s.year) : null;
    const holiday = SOLAR_HOLIDAYS.has(`${d}/${s.month}`) || (!!lunar && !lunar.leap && LUNAR_HOLIDAYS.has(`${lunar.day}/${lunar.month}`));
    ctx.fillStyle = col === 6 || holiday ? s.accent : s.color;
    ctx.font = font(700, Math.min(cellH, cellW) * (s.lunar ? 0.42 : 0.5));
    ctx.fillText(String(d), cx, cy + cellH * (s.lunar ? 0.4 : 0.5));
    if (lunar) {
      const first = lunar.day === 1;
      ctx.font = font(first ? 700 : 400, Math.min(cellH, cellW) * 0.2);
      ctx.fillStyle = first || holiday ? s.accent : s.color;
      ctx.globalAlpha = first || holiday ? 1 : 0.6;
      ctx.fillText(first ? `${lunar.day}/${lunar.month}${lunar.leap ? "N" : ""}` : String(lunar.day), cx, cy + cellH * 0.76);
      ctx.globalAlpha = 1;
    }
  }
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Không tạo được ảnh lịch"))), "image/png"));
  c.width = c.height = 0;
  return blob;
}
