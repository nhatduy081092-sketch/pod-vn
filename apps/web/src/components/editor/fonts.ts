import { DESIGN_FONTS, type DesignLayer } from "@pod/shared";
import { fontString } from "./render";

/** Link Google Fonts cho mọi font trong editor (subset tiếng Việt tự nạp theo unicode-range) */
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  DESIGN_FONTS.map((f) => {
    const fam = f.family.replace(/ /g, "+");
    return f.weights.length > 1 || f.weights[0] !== 400 ? `family=${fam}:wght@${f.weights.join(";")}` : `family=${fam}`;
  }).join("&") +
  "&display=swap";

/** Đảm bảo font đã tải trước khi vẽ canvas (canvas không tự chờ web font) */
export async function ensureFonts(layers: DesignLayer[]): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const jobs = layers
    .filter((l): l is Extract<DesignLayer, { type: "text" }> => l.type === "text")
    .map((l) => document.fonts.load(fontString(l, 40), l.text).catch(() => []));
  await Promise.all(jobs);
}
