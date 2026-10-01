import { prisma } from "@pod/db";
import { importOemCatalog } from "./oem-import";

/**
 * Phôi in từ nguồn OEM (8–9 ngành hàng): vùng in mặc định theo loại sản phẩm để khách tải logo/thiết kế
 * và xem trước ngay trên ảnh sản phẩm thật (YALA Studio). Toạ độ vùng = tỉ lệ trên ảnh (ảnh nguồn chụp chính diện, sản phẩm ở giữa).
 */
type Preset = { name: string; widthMm: number; heightMm: number; zoneX: number; zoneY: number; zoneW: number; zoneH: number; tips: string };

const BY_CATEGORY: Record<string, Preset> = {
  "dong-phuc-may-mac": { name: "Mặt trước", widthMm: 250, heightMm: 300, zoneX: 0.33, zoneY: 0.27, zoneW: 0.34, zoneH: 0.38, tips: "Logo ngực trái ~9 cm, in giữa ngực tối đa A4." },
  "balo-tui-phu-kien": { name: "Mặt trước túi/balo", widthMm: 200, heightMm: 200, zoneX: 0.34, zoneY: 0.36, zoneW: 0.32, zoneH: 0.32, tips: "Logo 1–2 màu in/thêu rõ nhất; tránh đè lên khoá kéo, đường may." },
  "binh-nuoc-ly-coc": { name: "Thân bình/cốc", widthMm: 50, heightMm: 80, zoneX: 0.43, zoneY: 0.38, zoneW: 0.14, zoneH: 0.22, tips: "Khắc laser 1 màu trên thân; logo nét đơn giản khắc đẹp nhất." },
  "mu-non-ao-mua-o-du": { name: "Vị trí logo", widthMm: 80, heightMm: 50, zoneX: 0.38, zoneY: 0.34, zoneW: 0.24, zoneH: 0.15, tips: "Mũ: logo trước trán; ô dù: in trên 1 múi; áo mưa: in ngực/lưng." },
  "van-phong-pham": { name: "Bìa / mặt in", widthMm: 80, heightMm: 80, zoneX: 0.38, zoneY: 0.38, zoneW: 0.24, zoneH: 0.24, tips: "Sổ: ép kim hoặc in UV logo trên bìa; bút: khắc 1 dòng trên thân." },
  "hop-giay-san-pham-giay": { name: "Mặt hộp / mặt giấy", widthMm: 150, heightMm: 100, zoneX: 0.3, zoneY: 0.35, zoneW: 0.4, zoneH: 0.27, tips: "In offset/UV toàn mặt; gửi file vector (AI, PDF) để in sắc nét." },
  "vali-du-lich": { name: "Mặt vali", widthMm: 150, heightMm: 150, zoneX: 0.36, zoneY: 0.36, zoneW: 0.28, zoneH: 0.28, tips: "In UV logo trên mặt vali; thẻ hành lý in 2 mặt." },
  "gia-dung-dien-bep": { name: "Vị trí logo", widthMm: 60, heightMm: 60, zoneX: 0.4, zoneY: 0.4, zoneW: 0.2, zoneH: 0.2, tips: "Logo nhỏ 1 màu (in pad / khắc) trên thân sản phẩm." },
  "do-choi-me-be": { name: "Vị trí logo / in tên", widthMm: 60, heightMm: 60, zoneX: 0.4, zoneY: 0.4, zoneW: 0.2, zoneH: 0.2, tips: "Thêu/in logo lên nhãn hoặc áo thú bông; in tên bé theo yêu cầu." },
};

const FLAG_PRESET = "oem:print-presets:v1";
const FLAG_IMPORT = "oem:auto-import:v1";

/** Áp vùng in theo ngành cho sản phẩm nguồn còn vùng in mặc định (chưa chỉnh trong CMS) – chạy 1 lần + sau mỗi lần nhập */
export async function applyOemPrintPresets(force = false): Promise<number> {
  if (!force && (await prisma.setting.findUnique({ where: { key: FLAG_PRESET } }))) return 0;
  let n = 0;
  for (const [slug, p] of Object.entries(BY_CATEGORY)) {
    const r = await prisma.printArea.updateMany({
      where: {
        // vùng in mặc định do hệ thống tạo (100×100mm ở giữa ảnh) -> chưa ai chỉnh
        key: "logo",
        widthMm: 100,
        heightMm: 100,
        zoneX: 0.35,
        zoneY: 0.3,
        product: { externalId: { startsWith: "oem:" }, category: { slug } },
      },
      data: { ...p, dpi: 300, safeMm: 3 },
    });
    n += r.count;
  }
  await prisma.setting.upsert({ where: { key: FLAG_PRESET }, update: { value: { at: new Date().toISOString(), n } }, create: { key: FLAG_PRESET, value: { at: new Date().toISOString(), n } } });
  if (n) console.log(`[oem] đã đặt vùng in theo ngành cho ${n} sản phẩm`);
  return n;
}

/**
 * Lần đầu deploy: chưa có sản phẩm nguồn nào -> tự đồng bộ từ OEM (chạy nền, không chặn khởi động).
 * Sau đó cập nhật bằng nút "Đồng bộ" trong CMS.
 */
export async function ensureOemCatalog() {
  if (await prisma.setting.findUnique({ where: { key: FLAG_IMPORT } })) return applyOemPrintPresets();
  const existing = await prisma.product.count({ where: { externalId: { startsWith: "oem:" } } });
  if (!existing) {
    await new Promise((r) => setTimeout(r, 20_000)); // đợi API ổn định
    console.log("[oem] chưa có sản phẩm nguồn – bắt đầu đồng bộ lần đầu…");
    const report = await importOemCatalog();
    console.log(`[oem] đồng bộ xong: ${report.created} mới, ${report.updated} cập nhật, ${report.errors.length} lỗi`);
    if (report.created + report.updated === 0) return; // lỗi mạng -> lần khởi động sau thử lại
  }
  await prisma.setting.upsert({ where: { key: FLAG_IMPORT }, update: { value: { at: new Date().toISOString(), existing } }, create: { key: FLAG_IMPORT, value: { at: new Date().toISOString(), existing } } });
  await applyOemPrintPresets(true);
}
