import { z } from "zod";

/**
 * Trang nội dung (chính sách, hướng dẫn...). Lưu trong bảng Setting với key "page:<slug>"
 * -> không cần migrate DB. Chưa lưu trong CMS thì dùng nội dung mặc định bên dưới.
 *
 * Cú pháp nội dung (rút gọn, an toàn – không cho HTML):
 *   ## Tiêu đề mục     |  - gạch đầu dòng     |  **chữ đậm**     |  dòng trống = tách đoạn
 */
export type ContentPage = { slug: string; title: string; content: string; showInFooter: boolean; sortOrder: number };

export const PAGE_KEY_PREFIX = "page:";

export const pageUpsertSchema = z.object({
  title: z.string().trim().min(2, "Nhập tiêu đề").max(120),
  content: z.string().max(20000),
  showInFooter: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type PageUpsertInput = z.infer<typeof pageUpsertSchema>;

export const pageSlugSchema = z.string().regex(/^[a-z0-9-]{2,60}$/, "Slug chỉ gồm a-z, 0-9, dấu gạch");

/** Điều kiện số lượng (định vị đơn nhóm 11/10/2026) – dùng lại khi cập nhật trang Giới thiệu đã lưu trong CMS */
export const GROUP_MIN_LINE = "Đơn nhóm từ 10 sản phẩm; ít hơn vẫn đặt được, tính như mua lẻ";
export const OLD_MIN_LINE = "In từ 1 chiếc, không yêu cầu số lượng tối thiểu";

/** Ghi chú cho trang còn là nội dung mẫu (chưa được chủ shop xác nhận) */
const NOTE = "\n\n*Nội dung mẫu – vui lòng chỉnh theo thực tế doanh nghiệp trong CMS → Trang nội dung.*";

export const DEFAULT_PAGES: ContentPage[] = [
  {
    slug: "gioi-thieu",
    title: "Giới thiệu",
    showInFooter: true,
    sortOrder: 0,
    content: `YALA nhận làm áo nhóm, đồng phục và quà tặng in logo cho **tập thể và doanh nghiệp**: công ty, CLB thể thao, lớp – hội nhóm – gia đình, team building và sự kiện. Khách thiết kế và duyệt mẫu ngay trên web; YALA lo phần còn lại: kiểm file in, sản xuất cùng xưởng đối tác và giao tận nơi.

## YALA làm gì
- Áo nhóm, áo lớp, đồng phục công ty, áo đội bóng – in tên, số riêng từng người trong cùng một đơn; thu tên – size cả nhóm bằng một link
- Quà tặng doanh nghiệp in logo: áo, bình giữ nhiệt, ly, sổ, bút, túi, ô dù, balo… – một đầu mối cho cả bộ quà
- Thiết kế và xem mockup trên web bằng YALA Studio; cần hỗ trợ thì YALA làm mockup miễn phí trước khi in

## Cách làm việc
- **Duyệt mẫu**: tự thiết kế trên web, hoặc gửi logo để YALA dựng mockup cho bạn duyệt
- **Báo giá**: áo in có giá ngay trên web; quà tặng số lượng lớn gửi yêu cầu báo giá theo số lượng, ngân sách và ngày cần hàng
- **Chốt mẫu**: đơn doanh nghiệp và đơn báo giá đặt cọc 30% khi chốt mẫu, phần còn lại thanh toán khi giao
- **Sản xuất**: áo in 2–4 ngày làm việc sau khi duyệt mockup; quà tặng doanh nghiệp thường 7–15 ngày tuỳ sản phẩm và số lượng
- **Giao hàng**: toàn quốc, một điểm hoặc chia nhiều chi nhánh theo danh sách công ty gửi

## Số lượng
- ${GROUP_MIN_LINE}
- Quà tặng khác theo số lượng tối thiểu ghi trên từng sản phẩm

## Liên hệ
Nhắn Zalo hoặc gọi hotline ở cuối trang. Doanh nghiệp gửi yêu cầu báo giá tại [trang Doanh nghiệp](/doanh-nghiep).`,
  },
  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả",
    showInFooter: true,
    sortOrder: 1,
    content: `Sản phẩm in theo yêu cầu được sản xuất riêng cho từng khách, vì vậy chính sách đổi trả áp dụng như sau.

## Được đổi mới miễn phí khi
- Lỗi in: sai hình so với mockup đã duyệt, lem màu, bong tróc, lệch vị trí rõ rệt
- Lỗi sản xuất: rách, thủng, đường may bung, sai size so với đơn
- Giao nhầm sản phẩm

## Điều kiện
- Báo lỗi trong vòng **3 ngày** kể từ khi nhận hàng, kèm video mở hàng và ảnh chụp lỗi
- Sản phẩm chưa qua sử dụng, chưa giặt

## Không áp dụng khi
- Khách đổi ý, hoặc chọn sai size so với bảng size đã tư vấn
- File thiết kế khách cung cấp chất lượng thấp (ảnh mờ, vỡ hạt) dù đã được cảnh báo trước khi in
- Màu in trên vải chênh nhẹ so với màn hình điện thoại hoặc máy tính

## Đơn doanh nghiệp
Mockup đã duyệt là căn cứ nghiệm thu: vị trí, kích thước, nội dung in đúng mockup. Hàng lỗi được đổi theo đúng số lượng lỗi, không ảnh hưởng phần hàng đạt.

## Cách thực hiện
Nhắn Zalo kèm mã đơn hàng, ảnh và video lỗi. Shop kiểm tra và hướng dẫn đổi hàng.`,
  },
  {
    slug: "van-chuyen-thanh-toan",
    title: "Vận chuyển & thanh toán",
    showInFooter: true,
    sortOrder: 2,
    content: `## Thời gian sản xuất
- Áo in: 2–4 ngày làm việc sau khi duyệt mockup
- Quà tặng doanh nghiệp: thường 7–15 ngày tuỳ sản phẩm và số lượng – thời gian cụ thể ghi trong báo giá
- Cần hàng cho sự kiện: ghi ngày cần hàng khi gửi yêu cầu báo giá để YALA xác nhận trước khi chốt

## Giao hàng
- Giao toàn quốc; phí và thời gian giao dự kiến theo khu vực hiện ngay ở bước đặt hàng
- **Miễn phí giao** cho đơn đạt ngưỡng hiển thị ở giỏ hàng
- Đơn doanh nghiệp giao một điểm hoặc chia nhiều chi nhánh theo danh sách công ty gửi

## Thanh toán
- **COD**: thanh toán cho shipper khi nhận hàng, được kiểm tra hàng trước khi thanh toán
- **Chuyển khoản (VietQR)**: quét mã sau khi đặt, nội dung chuyển khoản là mã đơn hàng
- **Đơn doanh nghiệp, đơn báo giá**: đặt cọc **30%** khi chốt mẫu, phần còn lại thanh toán khi giao hàng`,
  },
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    showInFooter: true,
    sortOrder: 3,
    content: `## Thông tin thu thập
Họ tên, số điện thoại, email (không bắt buộc), địa chỉ giao hàng và file thiết kế bạn tải lên.

## Mục đích sử dụng
- Xử lý, giao đơn hàng và liên hệ xác nhận mockup
- Chăm sóc khách hàng, xử lý đổi trả
- Thống kê nguồn truy cập (Google Analytics, Meta Pixel) để cải thiện dịch vụ

## Cam kết
- Không bán hoặc chia sẻ thông tin cá nhân cho bên thứ ba, trừ đơn vị vận chuyển để giao hàng
- File thiết kế chỉ dùng để in đơn của bạn, không sử dụng cho mục đích khác khi chưa được đồng ý

## Quyền của bạn
Bạn có thể yêu cầu xem, sửa hoặc xoá thông tin cá nhân bằng cách liên hệ qua Zalo/email ở cuối trang.${NOTE}`,
  },
  {
    slug: "huong-dan-file-in",
    title: "Hướng dẫn chuẩn bị file in",
    showInFooter: true,
    sortOrder: 4,
    content: `## Định dạng
- PNG, JPG hoặc WEBP; PNG nền trong suốt cho logo, chữ
- Hệ màu RGB, dung lượng tối đa 50MB

## Độ phân giải
- In toàn thân: ảnh tối thiểu **3000px** cạnh dài, khuyến nghị 4500px trở lên
- Ảnh chụp điện thoại vẫn in được nhưng nên chọn ảnh gốc, không qua Zalo/Facebook (bị nén)

## Lưu ý
- Chữ, logo nên cách mép vải ít nhất 2cm để tránh bị cắt khi may
- Màu in trên vải có thể chênh nhẹ so với màn hình điện thoại
- Không nhận in nội dung vi phạm bản quyền, thương hiệu của bên khác hoặc trái pháp luật

Chưa có file? Gửi ý tưởng qua Zalo, bên mình hỗ trợ thiết kế miễn phí.${NOTE}`,
  },
];

export function defaultPage(slug: string): ContentPage | undefined {
  return DEFAULT_PAGES.find((p) => p.slug === slug);
}

/* ---------- Parser nội dung rút gọn (không HTML) ---------- */
export type Inline = { text: string; bold?: boolean; italic?: boolean; href?: string };

/** Chỉ cho phép link https:// hoặc đường dẫn nội bộ "/..." (chặn javascript:, data:...) */
export function safeHref(url: string): string | null {
  const u = url.trim();
  if (/^\/(?!\/)/.test(u)) return u;
  if (/^https:\/\/[^\s]+$/i.test(u)) return u;
  if (/^(mailto:|tel:)[^\s]+$/i.test(u)) return u;
  return null;
}
export type Block = { type: "h2"; text: string } | { type: "p"; inlines: Inline[] } | { type: "ul"; items: Inline[][] };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    if (m[1] !== undefined) {
      const href = safeHref(m[2] ?? "");
      out.push(href ? { text: m[1], href } : { text: m[0] });
    } else if (m[3] !== undefined) out.push({ text: m[3], bold: true });
    else out.push({ text: m[4] ?? "", italic: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

export function parseContent(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Inline[][] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", inlines: parseInline(para.join(" ")) });
    if (list.length) blocks.push({ type: "ul", items: list });
    para = [];
    list = [];
  };
  for (const raw of src.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (/^[-•*]\s+/.test(line)) {
      if (para.length) {
        blocks.push({ type: "p", inlines: parseInline(para.join(" ")) });
        para = [];
      }
      list.push(parseInline(line.replace(/^[-•*]\s+/, "")));
    } else {
      if (list.length) {
        blocks.push({ type: "ul", items: list });
        list = [];
      }
      para.push(line);
    }
  }
  flush();
  return blocks;
}

/** Mô tả cho Google từ nội dung CMS: chữ của đoạn văn + gạch đầu dòng (bỏ tiêu đề), cắt ở ranh giới từ, ≤ max ký tự */
export function contentExcerpt(src: string, max = 155): string {
  const text = parseContent(src)
    .flatMap((b) => (b.type === "p" ? [b.inlines] : b.type === "ul" ? b.items : []))
    .map((inl) => inl.map((x) => x.text).join("").trim().replace(/[;:,]$/, "").replace(/([^.!?…])$/, "$1."))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s.,;:–-]+$/, "")}…`;
}
