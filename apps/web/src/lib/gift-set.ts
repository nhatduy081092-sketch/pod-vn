/**
 * "Bộ quà" – 1 logo xem trên nhiều món quà doanh nghiệp cùng lúc (/doanh-nghiep/bo-qua).
 * Mỗi nhóm lấy sản phẩm thật theo danh mục/nhóm con của CMS; khách đổi mẫu trong nhóm hoặc bỏ nhóm.
 * on = có sẵn trong bộ lúc mở trang (6 món quà phổ biến), còn lại khách tự thêm.
 */
export type GiftGroup = {
  key: string;
  /** tên ngắn trên thẻ */
  label: string;
  /** nguồn sản phẩm (gộp theo thứ tự); q = từ khoá tìm trong danh mục; match = chỉ lấy sản phẩm có tên khớp (không phân biệt hoa thường) */
  sources: { category: string; sub?: string; q?: string; match?: string }[];
  on: boolean;
  /**
   * Mẫu đưa lên đầu (slug), chọn theo ảnh: phôi trơn, không in sẵn logo hãng khác để logo khách nhìn rõ.
   * Slug không còn trong CMS thì bỏ qua, nhóm vẫn hiện các mẫu còn lại.
   */
  prefer?: string[];
};

export const GIFT_GROUPS: GiftGroup[] = [
  { key: "ao", label: "Áo", sources: [{ category: "yala-everyday", match: "^áo" }, { category: "dong-phuc-may-mac", match: "^áo" }], on: true },
  { key: "binh", label: "Bình giữ nhiệt", sources: [{ category: "binh-nuoc-ly-coc", sub: "binh-giu-nhiet" }], on: true, prefer: ["binh-giu-nhiet-qua-tang-tru-nham-2-tang"] },
  // lót ly nằm chung nhóm con "ly-coc" trong CMS: không lẫn vào nhóm ly. Nhóm "Lót ly" tạm ẩn vì CMS mới có 1 mẫu đã in kín
  // artwork và vùng in rơi vào cái ly; khi có mẫu phôi trơn thì thêm lại:
  // { key: "lot", label: "Lót ly", sources: [{ category: "binh-nuoc-ly-coc", q: "lót ly", match: "^lót" }], on: true },
  { key: "ly", label: "Ly, cốc", sources: [{ category: "binh-nuoc-ly-coc", sub: "ly-coc", match: "^(?!lót)" }], on: true },
  { key: "so", label: "Sổ tay", sources: [{ category: "van-phong-pham", sub: "so-tay" }], on: true },
  { key: "but", label: "Bút", sources: [{ category: "van-phong-pham", sub: "but-viet" }], on: true, prefer: ["but-bi-bam-in-logo-12"] },
  { key: "tote", label: "Túi tote", sources: [{ category: "yala-everyday", match: "tote" }, { category: "balo-tui-phu-kien", sub: "tui-tote-tui-rut" }], on: true },
  { key: "o", label: "Ô dù", sources: [{ category: "mu-non-ao-mua-o-du", sub: "o-du" }], on: true, prefer: ["o-du-qua-tang-gap-gon-01"] },
  { key: "balo", label: "Balo", sources: [{ category: "balo-tui-phu-kien", sub: "balo-laptop" }], on: false },
  { key: "mu", label: "Mũ nón", sources: [{ category: "mu-non-ao-mua-o-du", sub: "mu-non" }], on: false, prefer: ["mu-non-luoi-trai-theu-logo-2-vi-tri"] },
  { key: "lich", label: "Lịch", sources: [{ category: "hop-giay-san-pham-giay", sub: "lich-ban-lich-tuong" }], on: false },
];

/** Mẫu gợi ý cho 1 nhóm (thẻ sản phẩm rút gọn) */
export type GiftCandidate = { id: string; slug: string; name: string; image: string; priceLabel: string };
