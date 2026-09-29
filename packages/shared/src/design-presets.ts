import type { DesignLayer, DesignTemplateData, TextLayer } from "./design";

/**
 * Mẫu chữ dựng sẵn (không dùng hình/tên thương hiệu có bản quyền).
 * Toạ độ theo vùng gốc 300×300 mm; w/h của chữ được editor đo lại khi áp.
 * Khách sửa nội dung sau khi thêm.
 */
type T = Omit<TextLayer, "id" | "w" | "h" | "rotation" | "opacity" | "align" | "lineHeight" | "type"> & Partial<Pick<TextLayer, "align" | "lineHeight" | "rotation">>;
const t = (p: T): DesignLayer => ({ type: "text", id: "", w: 10, h: 10, rotation: 0, opacity: 1, align: "center", lineHeight: 1.15, ...p });

export type TextPreset = { id: string; name: string; category: string; data: DesignTemplateData };

const P = (id: string, name: string, category: string, layers: DesignLayer[]): TextPreset => ({ id, name, category, data: { srcW: 300, srcH: 300, bg: null, layers } });

export const TEXT_PRESETS: TextPreset[] = [
  P("team-name-number", "Tên + số áo", "Đồng phục", [
    t({ text: "TÊN", field: "name", font: "Oswald", fontSize: 42, color: "#1d1d1f", bold: true, x: 150, y: 70, letterSpacing: 0.08 }),
    t({ text: "10", field: "number", font: "Anton", fontSize: 150, color: "#1d1d1f", x: 150, y: 185 }),
  ]),
  P("team-number", "Số áo lớn", "Đồng phục", [t({ text: "10", field: "number", font: "Anton", fontSize: 170, color: "#1d1d1f", x: 150, y: 150, stroke: { color: "#ffffff", width: 2 } })]),
  P("club", "Đội bóng", "Đồng phục", [
    t({ text: "FC ĐOÀN KẾT", font: "Anton", fontSize: 44, color: "#1c4d99", x: 150, y: 90, curve: 22, letterSpacing: 0.04 }),
    t({ text: "10", field: "number", font: "Anton", fontSize: 120, color: "#1c4d99", x: 150, y: 200, stroke: { color: "#facc15", width: 2.5 } }),
  ]),
  P("class", "Kỷ niệm lớp", "Kỷ niệm", [
    t({ text: "LỚP 12A1", font: "Anton", fontSize: 60, color: "#1d1d1f", x: 150, y: 105, curve: 18, letterSpacing: 0.05 }),
    t({ text: "Thanh xuân rực rỡ", font: "Dancing Script", fontSize: 34, color: "#e11d48", bold: true, x: 150, y: 175 }),
    t({ text: "NIÊN KHOÁ 2023 – 2026", font: "Montserrat", fontSize: 16, color: "#1d1d1f", bold: true, x: 150, y: 222, letterSpacing: 0.2 }),
  ]),
  P("teambuilding", "Team building", "Công ty & sự kiện", [
    t({ text: "TEAM BUILDING", font: "Montserrat", fontSize: 34, color: "#1c4d99", bold: true, x: 150, y: 100, curve: 20, letterSpacing: 0.06 }),
    t({ text: "2026", font: "Anton", fontSize: 90, color: "#f97316", x: 150, y: 175 }),
    t({ text: "TÊN CÔNG TY CỦA BẠN", font: "Montserrat", fontSize: 15, color: "#1d1d1f", bold: true, x: 150, y: 240, letterSpacing: 0.18 }),
  ]),
  P("brand", "Logo chữ thương hiệu", "Công ty & sự kiện", [
    t({ text: "THƯƠNG HIỆU", font: "Montserrat", fontSize: 40, color: "#1d1d1f", bold: true, x: 150, y: 135, letterSpacing: 0.12 }),
    t({ text: "Khẩu hiệu ngắn gọn của bạn", font: "Playfair Display", fontSize: 18, color: "#6b7280", italic: true, x: 150, y: 180 }),
  ]),
  P("run", "Giải chạy", "Công ty & sự kiện", [
    t({ text: "GIẢI CHẠY", font: "Oswald", fontSize: 36, color: "#1d1d1f", bold: true, x: 150, y: 90, letterSpacing: 0.15 }),
    t({ text: "5KM", font: "Anton", fontSize: 110, color: "#16a34a", x: 150, y: 170 }),
    t({ text: "VÌ CỘNG ĐỒNG · 2026", font: "Montserrat", fontSize: 15, color: "#1d1d1f", bold: true, x: 150, y: 240, letterSpacing: 0.12 }),
  ]),
  P("family", "Gia đình", "Gia đình & cặp đôi", [
    t({ text: "Family trip", font: "Pacifico", fontSize: 48, color: "#0ea5e9", x: 150, y: 120 }),
    t({ text: "HÈ 2026", font: "Oswald", fontSize: 40, color: "#1d1d1f", bold: true, x: 150, y: 190, letterSpacing: 0.2 }),
  ]),
  P("birthday", "Sinh nhật", "Gia đình & cặp đôi", [
    t({ text: "HAPPY BIRTHDAY", font: "Montserrat", fontSize: 30, color: "#ec4899", bold: true, x: 150, y: 95, curve: 24, letterSpacing: 0.05 }),
    t({ text: "Minh Anh", font: "Dancing Script", fontSize: 56, color: "#1d1d1f", bold: true, x: 150, y: 170 }),
    t({ text: "TRÒN 18 TUỔI", font: "Oswald", fontSize: 20, color: "#1d1d1f", x: 150, y: 228, letterSpacing: 0.25 }),
  ]),
  P("couple", "Cặp đôi", "Gia đình & cặp đôi", [
    t({ text: "Của anh", font: "Lobster", fontSize: 60, color: "#e11d48", x: 150, y: 130 }),
    t({ text: "SINCE 2026", font: "Montserrat", fontSize: 16, color: "#1d1d1f", bold: true, x: 150, y: 190, letterSpacing: 0.3 }),
  ]),
  P("arc-badge", "Chữ vòng tròn", "Chữ nghệ thuật", [
    t({ text: "• CHỮ UỐN THEO VÒNG TRÒN • ", font: "Oswald", fontSize: 24, color: "#1d1d1f", bold: true, x: 150, y: 150, curve: 100, letterSpacing: 0.08 }),
  ]),
  P("smile", "Chữ cong xuống", "Chữ nghệ thuật", [
    t({ text: "Ngày tuyệt vời", font: "Nunito", fontSize: 44, color: "#7c3aed", bold: true, x: 150, y: 150, curve: -26 }),
  ]),
];
