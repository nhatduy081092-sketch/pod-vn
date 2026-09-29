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

const NOTE = "\n\n*Nội dung mẫu – vui lòng chỉnh theo thực tế doanh nghiệp trong CMS → Trang nội dung.*";

export const DEFAULT_PAGES: ContentPage[] = [
  {
    slug: "gioi-thieu",
    title: "Giới thiệu",
    showInFooter: true,
    sortOrder: 0,
    content: `Chúng tôi là xưởng in áo theo yêu cầu, chuyên **in toàn thân (All-Over Print)** trên áo thun, hoodie, pijama, sơ mi, đồ thể thao và phụ kiện.

## Chúng tôi làm gì
- In từ 1 chiếc, không yêu cầu số lượng tối thiểu
- Hỗ trợ thiết kế và gửi mockup duyệt miễn phí trước khi in
- Nhận in đồng phục lớp, nhóm, công ty, sự kiện với giá sỉ theo số lượng

## Liên hệ
Nhắn Zalo hoặc gọi hotline ở cuối trang để được tư vấn nhanh nhất.${NOTE}`,
  },
  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả",
    showInFooter: true,
    sortOrder: 1,
    content: `Sản phẩm in theo yêu cầu được sản xuất riêng cho từng khách, vì vậy chính sách đổi trả áp dụng như sau.

## Trường hợp được đổi mới miễn phí
- Lỗi in: sai hình so với mockup đã duyệt, lem màu, bong tróc, lệch vị trí rõ rệt
- Lỗi sản xuất: rách, thủng, đường may bung, sai size so với đơn
- Giao nhầm sản phẩm

## Điều kiện
- Báo lỗi trong vòng **3 ngày** kể từ khi nhận hàng, kèm video mở hàng và ảnh chụp lỗi
- Sản phẩm chưa qua sử dụng, chưa giặt

## Trường hợp không áp dụng
- Khách đổi ý, chọn sai size so với bảng size đã tư vấn
- Chất lượng file thiết kế khách cung cấp thấp (ảnh mờ, vỡ hạt) dù đã được cảnh báo trước khi in

## Cách thực hiện
Nhắn Zalo kèm mã đơn hàng. Shop kiểm tra và phản hồi trong 24 giờ làm việc; chi phí vận chuyển đổi hàng lỗi do shop chịu.${NOTE}`,
  },
  {
    slug: "van-chuyen-thanh-toan",
    title: "Vận chuyển & thanh toán",
    showInFooter: true,
    sortOrder: 2,
    content: `## Thời gian
- Sản xuất: 2–4 ngày làm việc sau khi duyệt mockup
- Giao hàng: 1–2 ngày nội thành, 3–5 ngày tỉnh/thành khác (qua GHN, GHTK, Viettel Post, J&T)

## Phí vận chuyển
- Đồng giá theo cấu hình của shop, **miễn phí** cho đơn đạt ngưỡng hiển thị ở giỏ hàng

## Hình thức thanh toán
- **COD**: thanh toán cho shipper khi nhận hàng, được kiểm tra hàng trước khi thanh toán
- **Chuyển khoản (VietQR)**: quét mã sau khi đặt, nội dung chuyển khoản là mã đơn hàng

Đơn đồng phục số lượng lớn có thể yêu cầu đặt cọc trước khi sản xuất.${NOTE}`,
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
- Hệ màu RGB, dung lượng tối đa 15MB

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
