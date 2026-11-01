# Kiểm toán Meta & TikTok – 01/11/2026

Không có quyền Events Manager (Meta) và TikTok Ads Manager → không xem được Test Events / Event Match Quality.

## Meta

| Câu hỏi | Kết quả | Bằng chứng |
|---|---|---|
| Pixel nhận event? | **Không** – Pixel không được nạp | `window.fbq` undefined; không có `fbevents.js`; `NEXT_PUBLIC_META_PIXEL_ID` trống |
| CAPI gửi event? | **Không có CAPI** | `apps/api` không có mã gọi `graph.facebook.com` |
| Khử trùng browser–server | Chuẩn bị sẵn phía trình duyệt: mỗi sự kiện có `eventID`; purchase dùng `eventID = mã đơn` để sau này CAPI gửi cùng mã | `lib/track.ts` |
| Event ID khớp? | Không áp dụng (chưa có server) | – |
| Value / Currency | Code gửi `value` + `currency: "VND"` cho ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase | `lib/track.ts` |
| Event Match Quality | CHƯA KIỂM ĐƯỢC. Dự đoán thấp: trình duyệt không gửi email/SĐT (cố ý, chưa có consent), chưa có CAPI kèm `fbp`/`fbc` | – |

Ánh xạ sự kiện (code): view_item→ViewContent, add_to_cart→AddToCart, begin_checkout→InitiateCheckout, add_payment_info→AddPaymentInfo, purchase→Purchase, search→Search, generate_lead→Lead, sign_up→CompleteRegistration, contact→Contact; nhóm: GroupCreate, GroupJoin (custom).

## TikTok

| Câu hỏi | Kết quả | Bằng chứng |
|---|---|---|
| Pixel nhận event? | **Không** – Pixel không được nạp | `window.ttq` undefined; `NEXT_PUBLIC_TIKTOK_PIXEL_ID` trống |
| Events API | **Không có** | `apps/api` không có mã gọi `business-api.tiktok.com` |
| Event ID | Có `event_id` mỗi sự kiện; purchase = mã đơn | `lib/track.ts` |
| CompletePayment | **Không dùng.** Code gửi `PlaceAnOrder` khi đặt hàng – đúng nghĩa hơn vì đơn chưa thanh toán. `CompletePayment` nên do server gửi khi đơn chuyển PAID | `lib/track.ts` dòng purchase |
| Value / Currency | `value` + `currency: "VND"` | – |
| Lỗi gửi / trùng | Không áp dụng (không gửi gì) | – |

## Đề xuất

1. Nếu dùng GTM: cấu hình Meta Pixel + TikTok Pixel **trong GTM**, không đặt thêm `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_TIKTOK_PIXEL_ID` (tránh cài trùng). Tag trong GTM phải truyền `event_id` từ dataLayer sang `eventID` (Meta) / `event_id` (TikTok).
2. CAPI / Events API làm ở `apps/api`, token chỉ để trong biến môi trường server (xem `SERVER_TRACKING_AUDIT.md`).
3. Chỉ gửi email/SĐT (băm SHA-256) sau khi có consent.
