/**
 * Lệnh tạo ảnh sản phẩm bằng ChatGPT (làm tay, không cần API key) cho sản phẩm có ảnh nguồn từ nhà cung cấp.
 * Ảnh nguồn chỉ để AI hiểu dáng/chất liệu/màu – ảnh mới là ảnh gốc của YALA, sản phẩm TRƠN (không logo, chữ, watermark)
 * để khách hình dung in logo của mình lên.
 */
export type PhotoPromptStyle = "studio" | "lifestyle";
export type PhotoPromptProduct = { name: string; categorySlug?: string; categoryName?: string; material?: string };

type Cat = { slug?: string; match: RegExp; studio: string; lifestyle: string };

/** Theo ngành hàng (slug danh mục nguồn hoặc tên sản phẩm) */
const CATS: Cat[] = [
  {
    slug: "dong-phuc-may-mac",
    match: /dong-phuc|may-mac|áo|ao-|polo|sơ mi|so-mi|khoác|khoac|gile|tạp dề|tap-de|đồng phục/i,
    studio: "ghost-mannequin (invisible mannequin) style, front view, symmetrical, the chest area flat and clearly visible, realistic fabric texture, seams and soft natural folds",
    lifestyle: "worn by a young Vietnamese office worker in a bright modern office, front view from mid-thigh up, arms relaxed so the chest area is fully visible, natural confident smile",
  },
  {
    slug: "balo-tui-phu-kien",
    match: /balo|túi|tui-|tote|cặp|cap-|ví|vi-|phu-kien|túi rút|clutch/i,
    studio: "standing upright on its own, front view, slightly filled so it keeps its shape, straps and zippers neatly arranged, realistic material texture and stitching",
    lifestyle: "carried by a young Vietnamese person on a city street or in a co-working space, the front panel of the bag facing the camera and large in frame",
  },
  {
    slug: "binh-nuoc-ly-coc",
    match: /bình|binh-|ly|cốc|coc-|cup|mug|giữ nhiệt|giu-nhiet|chai/i,
    studio: "standing upright, front view at eye level, the flat printable side facing the camera, realistic material, subtle natural reflections",
    lifestyle: "on a clean wooden office desk next to a laptop and a small plant, morning daylight, the printable side facing the camera",
  },
  {
    slug: "mu-non-ao-mua-o-du",
    match: /mũ|mu-non|nón|non-|ô dù|ô gấp|o-du|áo mưa|ao-mua|bucket|lưỡi trai/i,
    studio: "front three-quarter view, the front panel (logo area) facing the camera, holding its natural shape, realistic fabric texture",
    lifestyle: "used by a young Vietnamese person outdoors on a sunny day, the logo area clearly visible and large in frame",
  },
  {
    slug: "van-phong-pham",
    match: /văn phòng|van-phong|sổ|so-|bút|but-|lịch|lich-|notebook|planner|móc khoá|moc-khoa/i,
    studio: "neat top-down flat-lay, the cover / printable surface fully visible, realistic paper or material texture",
    lifestyle: "on a tidy office desk with a laptop and a coffee cup, soft daylight, the cover / printable surface clearly visible",
  },
  {
    slug: "hop-giay-san-pham-giay",
    match: /hộp|hop-|giấy|giay-|túi giấy|bao bì|bao-bi|thiệp|thiep/i,
    studio: "front three-quarter view, standing, the main printable face toward the camera, crisp edges, realistic paperboard texture",
    lifestyle: "as a corporate gift set on a table with ribbon and greenery, the main printable face clearly visible",
  },
  {
    slug: "vali-du-lich",
    match: /vali|du-lich|du lịch|hành lý|hanh-ly/i,
    studio: "standing upright, front three-quarter view, handle retracted, wheels visible, realistic shell texture",
    lifestyle: "next to a young Vietnamese traveler in an airport terminal, the front shell clearly visible",
  },
  {
    slug: "gia-dung-dien-bep",
    match: /gia dụng|gia-dung|bếp|bep-|điện|dien-|quạt|đèn|den-|khăn|khan-/i,
    studio: "front three-quarter view, centered, the area where a small logo would go facing the camera, realistic materials",
    lifestyle: "in a bright modern Vietnamese home kitchen or living room, the product in use and clearly visible",
  },
  {
    slug: "do-choi-me-be",
    match: /đồ chơi|do-choi|mẹ|me-be|bé|gấu|gau-|thú bông|thu-bong/i,
    studio: "front view, sitting or standing naturally, soft and friendly, realistic plush or material texture",
    lifestyle: "in a cosy bright nursery or play corner, held by a happy Vietnamese child, the product clearly visible",
  },
];
const FALLBACK: Cat = {
  match: /./,
  studio: "front three-quarter view, centered, the printable surface facing the camera, realistic materials and texture",
  lifestyle: "in a bright, natural Vietnamese everyday setting, the product in use and clearly visible",
};

export function photoCategory(p: PhotoPromptProduct): Cat {
  // ngành hàng nguồn (slug chuẩn) trước, rồi đoán theo tên sản phẩm, cuối cùng theo tên danh mục
  return CATS.find((c) => c.slug && c.slug === p.categorySlug) ?? CATS.find((c) => c.match.test(p.name)) ?? CATS.find((c) => c.match.test(p.categoryName ?? "")) ?? FALLBACK;
}

/** Lệnh đầy đủ để dán vào ChatGPT, kèm ảnh nguồn đính kèm */
export function productPhotoPrompt(p: PhotoPromptProduct, style: PhotoPromptStyle): string {
  const c = photoCategory(p);
  const item = `"${p.name}"${p.material ? ` (${p.material})` : ""}`;
  const ref =
    "Use the attached photo ONLY as a reference for the product's shape, proportions, material, color and construction details. " +
    "Create a brand-new, original photo – do not copy the reference background, angle or composition.";
  const clean =
    "The product must be completely BLANK and clean: remove every logo, brand name, printed text, slogan, graphic, label, tag, sticker and watermark that appears in the reference. " +
    "No text anywhere in the image. No watermark.";
  const scene =
    style === "studio"
      ? `Photorealistic e-commerce catalog photo of ${item}, ${c.studio}. Seamless plain warm light-grey background (#F4F2EF), soft even studio lighting, soft natural shadow, product centered and filling about 75% of the frame.`
      : `Photorealistic lifestyle marketing photo of ${item}, ${c.studio.split(",")[0]}, ${c.lifestyle}. Natural light, realistic people with natural hands and faces, shallow depth of field, the product in sharp focus.`;
  return `${ref} ${scene} ${clean} Square 1:1.`;
}
