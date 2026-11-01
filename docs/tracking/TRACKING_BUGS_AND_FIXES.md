# Lỗi tracking và cách sửa – 01/11/2026

Mức: CRITICAL (sai doanh thu, mất đơn, trùng purchase, ảnh hưởng checkout) · HIGH (mất conversion/attribution nghiêm trọng) · MEDIUM (sai/thiếu tham số) · LOW.

| # | Mức | Lỗi | Nguyên nhân | Cách sửa | Trạng thái |
|---|---|---|---|---|---|
| B1 | CRITICAL (tiềm ẩn) | Lỗi pixel/gtag lúc đặt hàng có thể làm khách thấy "đặt hàng lỗi" dù đơn đã tạo → bấm lại → **đơn trùng** | `track.purchase()` nằm trong khối `try` của bước tạo đơn; `emit()` không tự bắt lỗi | Bọc mọi lần gửi trong `try/catch`, tách riêng từng nền tảng (`lib/track.ts`: `emit` → `send` + `isolated`; `pageView` cũng bọc) | **ĐÃ SỬA** trên nhánh `tracking-audit-2026-11`, đã thử trên localhost; chưa deploy |
| B2 | HIGH | **Không nền tảng nào nhận dữ liệu** (GTM, GA4, Meta, TikTok, Ads) | GitHub Variables `NEXT_PUBLIC_GTM_ID` / `GA4_ID` / `META_PIXEL_ID` / `TIKTOK_PIXEL_ID` trống lúc build | Chủ shop tạo GTM container, đặt `NEXT_PUBLIC_GTM_ID` (chỉ GTM để không cài trùng), build lại | Chờ chủ shop – cần ID |
| B3 | HIGH | Purchase tính lúc **đặt hàng**, không phải lúc **đã thanh toán**; đơn chuyển khoản chưa trả tiền và đơn COD chưa giao đều thành doanh thu; đơn huỷ không bị trừ | Thiết kế: chỉ có sự kiện trình duyệt, không có sự kiện server khi `paymentStatus` đổi | Phương án A: giữ purchase = "đặt hàng thành công" (thêm `payment_type` đã có) và đối soát doanh thu thật từ CMS. Phương án B: purchase do server gửi khi PAID/giao COD thành công, trình duyệt đổi sang sự kiện "đặt hàng" | Chờ chủ shop chọn (đổi logic kinh doanh) |
| B4 | HIGH | Không có Meta CAPI, TikTok Events API, GA4 Measurement Protocol | Chưa làm | Outbox + worker trong `apps/api` (xem `SERVER_TRACKING_AUDIT.md`) | Chờ token + duyệt |
| B5 | HIGH (pháp lý) | Không có consent / banner đồng ý | `lib/consent.ts` chưa commit, `consentDefaults()` còn `TODO(human)` | Chọn trạng thái mặc định Consent Mode v2 + banner; Nghị định 13/2023/NĐ-CP về dữ liệu cá nhân | Chờ chủ shop quyết |
| B6 | MEDIUM | Không có sự kiện `refund` | Không có điểm phát khi REFUNDED | Gửi từ server khi `paymentStatus` → REFUNDED (cùng outbox B4) | Chờ B4 |
| B7 | MEDIUM | SP "Báo giá" gửi `price: 0` / `value: 0` (24/24 kết quả tìm "binh giu nhiet") | `track.viewItem` / `ListTracker` dùng `basePrice`, SP báo giá có `basePrice = 0` | Bỏ `value`/`price` khi = 0, hoặc dùng `priceFrom` kèm nhãn – cần chọn | Đề xuất |
| B8 | MEDIUM | Google Ads chưa có Conversion ID/Label, Conversion Linker, Enhanced Conversions | Chưa cấu hình | Cấu hình trong GTM sau B2 | Chờ B2 |
| B9 | MEDIUM | Đơn không phân biệt khách Google tự nhiên / Facebook tự nhiên với khách gõ thẳng | Chỉ lưu tham số URL, không lưu `document.referrer` | Khi không có UTM, lưu tên miền giới thiệu (google.com, facebook.com…) vào touch | Đề xuất – nhỏ, an toàn |
| B10 | LOW | `add_shipping_info` + `add_payment_info` cùng bắn lúc bấm Đặt hàng; bắn lại nếu API lỗi rồi bấm lại | Gọi trong `submit()` | Bắn khi khách chọn cách giao / cách trả; hoặc chặn theo phiên | Đề xuất |
| B11 | LOW | SPA: `view_item` vào dataLayer trước `virtual_page_view` | React chạy effect con trước effect cha | Tag GTM lấy `page_location`/`page_title` từ URL/tiêu đề lúc bắn, không từ biến dataLayer | Ghi chú cho cấu hình GTM |
| B12 | LOW | Khối "Bán chạy" trang chủ không bắn `view_item_list` | Không bọc `ListTracker` | Thêm `ListTracker` | Đề xuất |
| B13 | LOW | TikTok dùng `PlaceAnOrder`, không có `CompletePayment` | Cố ý vì đơn chưa trả tiền | `CompletePayment` từ server khi PAID (B4) | Chờ B4 |
| B14 | INFO | Search Console: không thấy dấu hiệu xác minh công khai | Không có TXT DNS / thẻ meta | Chủ shop mở GSC kiểm tra | Chờ chủ shop |

## Trước / sau (các mục đã sửa)

| Thử nghiệm | Trước (bản e9fff27) | Sau (nhánh `tracking-audit-2026-11`) |
|---|---|---|
| gtag ném lỗi (trước) / gtag + fbq + ttq cùng ném lỗi (sau), bấm "Thêm vào giỏ" | **Thử trên yala.vn thật:** `Uncaught Error: gtag down`, giỏ +1 nhưng UI **không** hiện "Đã thêm" (phần code sau lệnh track bị bỏ dở) | Giỏ +1, UI "Đã thêm", `add_to_cart` vào dataLayer, chỉ `console.warn "[track] add_to_cart gtag down"` |
| Chỉ gtag ném lỗi | Meta/TikTok của sự kiện đó không được gọi | Meta `AddToCart` + TikTok `AddToCart` vẫn gọi, có event_id |
| Purchase khi pixel lỗi | Khách thấy lỗi dù đơn đã tạo (đọc code `CheckoutForm.tsx`) | `track.purchase` không thể ném lỗi → giỏ xoá, sang trang đơn hàng (suy ra từ B1; chưa thử bằng đơn thật) |
| Typecheck web | – | `tsc --noEmit` đạt |

Không deploy lên production khi chưa được duyệt.
