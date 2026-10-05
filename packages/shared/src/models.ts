import { z } from "zod";

/**
 * Ảnh người mẫu mặc áo trơn ("Xem trên người mẫu" trong Studio): mỗi ô = dáng × màu (VD "tshirt-trang").
 * x, y, w, h: vùng in trên ngực/lưng áo, tỉ lệ 0–1 so với ảnh. Studio vẽ thiết kế vào vùng này + đổ bóng nếp vải.
 */
const unit = z.number().min(0).max(1);
export const modelPhotoSchema = z.object({ photo: z.string().max(500), x: unit, y: unit, w: unit, h: unit });
export type ModelPhoto = z.infer<typeof modelPhotoSchema>;

export const MODEL_GARMENTS = ["tshirt", "hoodie", "sweater", "longsleeve", "tote"] as const;
export type ModelGarment = (typeof MODEL_GARMENTS)[number];
export const MODEL_GARMENT_VI: Record<ModelGarment, string> = { tshirt: "Áo thun", hoodie: "Hoodie", sweater: "Sweater", longsleeve: "Áo dài tay", tote: "Túi tote" };
export const MODEL_COLORS = { trang: "Trắng", den: "Đen" } as const;
export type ModelColor = keyof typeof MODEL_COLORS;

export const MODEL_SLOTS = MODEL_GARMENTS.flatMap((g) => (Object.keys(MODEL_COLORS) as ModelColor[]).map((c) => ({ key: `${g}-${c}`, garment: g, color: c, label: `${MODEL_GARMENT_VI[g]} · ${MODEL_COLORS[c]}` })));

const GARMENT_EN: Record<ModelGarment, string> = {
  tshirt: "plain relaxed-fit short-sleeve crew-neck cotton T-shirt",
  hoodie: "plain cotton fleece pullover hoodie (hood down)",
  sweater: "plain crew-neck cotton fleece sweatshirt",
  longsleeve: "plain relaxed-fit long-sleeve crew-neck cotton T-shirt",
  tote: "plain natural canvas tote bag carried on the shoulder, bag facing the camera",
};
const COLOR_EN: Record<ModelColor, string> = { trang: "white", den: "black" };

/** Lệnh tạo ảnh người mẫu (ChatGPT / AI ảnh) – ngực áo trống, nhìn thẳng để in thiết kế lên */
export function modelPrompt(g: ModelGarment, c: ModelColor): string {
  const item = g === "tote" ? `${COLOR_EN[c]} ${GARMENT_EN[g]}` : `a ${COLOR_EN[c]} ${GARMENT_EN[g]}`;
  return (
    `Photorealistic e-commerce lifestyle photo of a young Vietnamese person (early 20s, natural friendly look) ${g === "tote" ? "with" : "wearing"} ${item}. ` +
    "Front view, standing straight, facing the camera, framed from mid-thigh to just above the head, arms relaxed at the sides so the " +
    (g === "tote" ? "bag" : "chest") +
    " area is completely unobstructed and flat. The garment is completely blank: no print, no logo, no text, no labels. " +
    "Soft natural studio daylight, clean light warm-grey background, realistic fabric folds. Portrait 4:5. No watermark."
  );
}

/** Ảnh có sẵn của YALA (ảnh lookbook) làm mặc định – CMS thay/xoá được (xoá = lưu photo rỗng) */
export const DEFAULT_MODELS: Record<string, ModelPhoto> = {
  "tshirt-trang": { photo: "/showcase/ao-thun.webp", x: 0.39, y: 0.42, w: 0.17, h: 0.24 },
  "hoodie-den": { photo: "/showcase/hoodie.webp", x: 0.4, y: 0.5, w: 0.2, h: 0.18 },
  "hoodie-trang": { photo: "/showcase/hoodie.webp", x: 0.7, y: 0.58, w: 0.15, h: 0.16 },
};

/** Đoán dáng sản phẩm để chọn ảnh người mẫu */
export function garmentOfProduct(p: { name: string; slug: string }): ModelGarment | null {
  const s = `${p.slug} ${p.name}`.toLowerCase();
  if (/tote|túi vải|tui-vai/.test(s)) return "tote";
  if (/hoodie/.test(s)) return "hoodie";
  if (/sweater|ni bông|ni-bong|nỉ/.test(s)) return "sweater";
  if (/dài tay|dai-tay|long ?sleeve/.test(s)) return "longsleeve";
  if (/áo thun|ao-thun|t-?shirt|áo phông|ao-phong|\btee\b/.test(s)) return "tshirt";
  return null;
}

/** Ảnh người mẫu hợp màu áo: áo tối -> ảnh mặc áo đen, còn lại ảnh áo trắng */
export function pickModel(models: Record<string, ModelPhoto> | undefined, g: ModelGarment | null, dark: boolean): ModelPhoto | null {
  if (!g || !models) return null;
  const m = models[`${g}-${dark ? "den" : "trang"}`];
  return m?.photo ? m : null;
}
