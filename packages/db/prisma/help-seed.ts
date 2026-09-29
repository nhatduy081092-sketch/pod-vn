/**
 * Bài Help Center khởi tạo – chỉ mô tả cách dùng các tính năng CÓ THẬT trên website.
 * Chính sách (phí ship, thời gian, đổi trả) không ghi số cố định ở đây: dẫn về trang chính sách chỉnh trong CMS.
 * Chỉ tạo khi bảng trống; sửa/xoá thoải mái trong CMS → Help Center.
 */
export const HELP_SEED: { category: string; slug: string; title: string; content: string; sortOrder: number }[] = [
  {
    category: "bat-dau",
    slug: "dat-hang-lan-dau",
    title: "Đặt hàng lần đầu: 4 bước",
    sortOrder: 1,
    content: `## 1. Chọn sản phẩm
Vào **Tất cả sản phẩm**, lọc theo danh mục, nhóm con hoặc bộ sưu tập (Hàng mới, Khuyến mãi, Bán chạy).

## 2. Thiết kế
Bấm **Bắt đầu thiết kế** trên trang sản phẩm để mở công cụ thiết kế: tải ảnh, thêm chữ, chọn mặt in. Xong bấm **Hoàn tất** để quay lại trang sản phẩm.

## 3. Chọn phân loại và số lượng
Chọn màu, size, số lượng – giá sỉ tự áp khi đặt nhiều. Đặt cho cả nhóm thì chọn **Đồng phục nhóm** và tải danh sách tên/số/size.

## 4. Thanh toán
Nhập địa chỉ theo 34 tỉnh/thành mới, chọn cách giao hàng và thanh toán **COD** hoặc **chuyển khoản VietQR**.`,
  },
  {
    category: "bat-dau",
    slug: "tai-khoan-khach-hang",
    title: "Tài khoản: lưu thiết kế, xem lại đơn, đặt lại",
    sortOrder: 2,
    content: `Tạo tài khoản bằng **số điện thoại + mật khẩu** để:
- Lưu thiết kế và mở lại để chỉnh hoặc đặt thêm
- Xem lịch sử đơn và **đặt lại** đơn cũ chỉ với 1 lần bấm
- Lưu sẵn địa chỉ giao hàng

Đơn đã đặt trước khi có tài khoản: vào **Tài khoản → Đơn hàng → Thêm đơn cũ**, nhập mã đơn (đơn phải đặt bằng cùng số điện thoại).

Quên mật khẩu: nhắn Zalo/hotline ở cuối trang để được cấp lại.`,
  },
  {
    category: "thiet-ke",
    slug: "cach-dung-cong-cu-thiet-ke",
    title: "Cách dùng công cụ thiết kế",
    sortOrder: 1,
    content: `## Mặt in
Mỗi sản phẩm có một hoặc nhiều **mặt in** (mặt trước, mặt sau, tay áo, vị trí logo...). Chọn mặt ở thanh trên cùng. Mặt in thêm có thể có phụ phí – hiển thị ngay trên tab.

## Thêm nội dung
- **Tải ảnh**: PNG (nền trong suốt cho logo), JPG hoặc WEBP
- **Thêm chữ**: nhiều font hỗ trợ tiếng Việt, đổi màu, viền chữ, căn lề
- **Màu nền**: tô màu cả vùng in (hợp với in toàn thân)

## Chỉnh sửa
Kéo để di chuyển, kéo góc để phóng to/thu nhỏ, kéo nút tròn phía trên để xoay. Các nút nhanh: **Phủ kín vùng in**, **Vừa khít**, **Căn giữa**, **Lặp họa tiết**.

## Hoàn tất
Bấm **Hoàn tất** – hệ thống xuất file in đúng kích thước thật cho từng mặt và ảnh xem trước trên sản phẩm.`,
  },
  {
    category: "thiet-ke",
    slug: "chat-luong-anh-dpi",
    title: "Ảnh bao nhiêu pixel thì in đẹp? (cảnh báo DPI)",
    sortOrder: 2,
    content: `Công cụ thiết kế hiển thị **DPI thực tế** của từng ảnh theo kích thước bạn đặt trên sản phẩm:
- **Xanh** – đạt mức khuyến nghị của mặt in, in sắc nét
- **Vàng** – in được nhưng có thể hơi mềm
- **Đỏ** – ảnh quá nhỏ so với kích thước in, dễ vỡ hạt

Cách khắc phục: dùng ảnh gốc (không gửi qua Zalo/Facebook vì bị nén), hoặc thu nhỏ kích thước ảnh trên sản phẩm.

Xem thêm trang **Hướng dẫn chuẩn bị file in** ở cuối website.`,
  },
  {
    category: "dat-hang",
    slug: "dong-phuc-nhom-excel",
    title: "Đặt đồng phục nhóm bằng file Excel",
    sortOrder: 1,
    content: `Trên trang sản phẩm chọn **Đồng phục nhóm**:
- Tải **file mẫu**, điền mỗi dòng 1 áo: tên in, số áo, size, ghi chú
- Tải file lên (Excel .xlsx hoặc CSV) hoặc dán trực tiếp danh sách
- Hệ thống kiểm tra size hợp lệ, đếm số lượng theo size và **tự áp giá sỉ** theo tổng số áo`,
  },
  {
    category: "dat-hang",
    slug: "thanh-toan-cod-vietqr",
    title: "Thanh toán COD và chuyển khoản VietQR",
    sortOrder: 2,
    content: `- **COD**: thanh toán cho người giao hàng khi nhận hàng
- **Chuyển khoản VietQR**: sau khi đặt, trang đơn hàng hiện mã QR đã điền sẵn số tiền và nội dung (mã đơn) – quét bằng app ngân hàng là xong

Tra cứu đơn bất kỳ lúc nào tại **Tra cứu đơn** với mã đơn + số điện thoại.`,
  },
  {
    category: "van-chuyen",
    slug: "phi-giao-hang",
    title: "Phí giao hàng được tính thế nào?",
    sortOrder: 1,
    content: `Phí giao hàng hiển thị ở bước thanh toán ngay khi bạn chọn tỉnh/thành, tính theo **cân nặng** sản phẩm và **khu vực nhận** (nội tỉnh, cùng miền, khác miền). Đơn đạt ngưỡng sẽ được **miễn phí giao tiêu chuẩn**.

Chi tiết thời gian và chính sách xem trang **Vận chuyển & thanh toán** ở cuối website.`,
  },
  {
    category: "doi-tra",
    slug: "yeu-cau-doi-tra",
    title: "Sản phẩm lỗi: cách yêu cầu đổi",
    sortOrder: 1,
    content: `Nhắn Zalo/hotline kèm **mã đơn** và ảnh sản phẩm lỗi. Điều kiện đổi trả xem trang **Chính sách đổi trả** ở cuối website.`,
  },
  {
    category: "doanh-nghiep",
    slug: "bao-gia-doanh-nghiep",
    title: "Nhận báo giá in logo cho doanh nghiệp",
    sortOrder: 1,
    content: `Với sản phẩm ghi **Liên hệ báo giá** hoặc **Từ ...₫**:
- Thiết kế logo trực tiếp bằng công cụ thiết kế (hoặc tải file logo)
- Điền số lượng, thông tin công ty và gửi **Yêu cầu báo giá**
- Bạn nhận mã **BG...** để theo dõi, đội ngũ liên hệ báo giá chi tiết`,
  },
  {
    category: "doanh-nghiep",
    slug: "tro-thanh-seller",
    title: "Làm seller dropship: tạo mẫu, nhận đơn, không cần ôm hàng",
    sortOrder: 2,
    content: `## Đăng ký
Tạo tài khoản → **Tài khoản → Làm seller**, điền kênh bán (Shopee, TikTok Shop, website...). Sau khi được duyệt bạn có **Khu seller** với mức chiết khấu riêng.

## Quy trình
- **Mẫu sản phẩm**: chọn phôi, thiết kế, đặt mã mẫu (VD AO-MEO-01)
- **Tạo đơn**: nhập tay, **nhập CSV** nhiều đơn một lần, hoặc tự động qua **Open API**
- Hàng giao thẳng tới khách của bạn, có thể đóng gói theo thương hiệu của bạn và thu hộ (COD)
- **Thanh toán gộp** nhiều đơn bằng 1 lần chuyển khoản VietQR
- Nhận **webhook** khi đơn đổi trạng thái / có mã vận đơn`,
  },
];
