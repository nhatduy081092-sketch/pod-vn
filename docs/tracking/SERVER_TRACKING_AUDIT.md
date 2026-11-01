# Kiểm toán server tracking – 01/11/2026

## Hiện trạng: chưa có server-side tracking

| Hạng mục | Hiện trạng | Bằng chứng |
|---|---|---|
| API endpoint gửi Meta CAPI / TikTok Events API / GA4 Measurement Protocol | **Không có** | grep `apps/api/src`: không có graph.facebook, business-api.tiktok, google-analytics.com/mp |
| Authentication / biến môi trường token | Không có (chưa cần) | – |
| Retry / Timeout / Logging / Outbox | Không có cho tracking. Có mẫu tốt để dùng lại: `lib/webhooks.ts` (webhook seller) thử lại 3 lần 0s/5s/30s, lưu lịch sử `WebhookDelivery`, chạy nền không chặn request | `apps/api/src/lib/webhooks.ts` |
| Idempotency / khử trùng | Không có cho tracking | – |
| Webhook thanh toán (SePay, cổng thanh toán) | **Không có.** Chuyển khoản được xác nhận tay trong CMS (PATCH đơn, đổi `paymentStatus` UNPAID→PAID/REFUNDED) hoặc theo lô thanh toán của seller (`paymentBatch` → PAID) | `routes/admin.ts` dòng 458–464, 806–807 |
| Lưu nguồn khách vào đơn | ✔ `Order.utm` (JSON) nhận first-touch + `last_*` + `order_type` + `group` từ web; thông báo đơn mới kèm `utmSource` suy ra từ fbclid/gclid/ttclid | `routes/checkout.ts` dòng 88, 111 |

## Lỗi tracking có làm hỏng việc bán hàng không?

- **Phía server:** không có mã tracking nào trong luồng tạo đơn → Meta/TikTok sập không ảnh hưởng gì tới việc tạo đơn.
- **Phía trình duyệt (trước khi sửa):** `track.purchase()` được gọi **trong cùng khối `try`** với bước tạo đơn và chuyển trang (`CheckoutForm.tsx`). Nếu pixel / gtag ném lỗi lúc đó: đơn **đã tạo** trên server nhưng khách thấy thông báo lỗi, giỏ không bị xoá, không sang trang đơn hàng → dễ bấm đặt lại → **đơn trùng**. Hiện chưa xảy ra vì chưa nạp pixel nào, nhưng sẽ thành rủi ro ngay khi bật ID. Đã tái hiện trên yala.vn thật với nút "Thêm vào giỏ": giả lập gtag lỗi → `Uncaught Error: gtag down`, phần code sau lệnh track bị bỏ dở (không hiện "Đã thêm").
- **Sau khi sửa (nhánh `tracking-audit-2026-11`):** mọi lần gửi đều bọc `try/catch`, mỗi nền tảng tách riêng. Đã thử trên localhost: giả lập gtag, fbq, ttq cùng ném lỗi → giỏ hàng vẫn thêm được, giao diện vẫn báo "Đã thêm", `add_to_cart` vẫn vào dataLayer, lỗi chỉ ghi `console.warn`. Giả lập riêng gtag lỗi → Meta `AddToCart` và TikTok `AddToCart` vẫn được gọi, đều có event_id.

## Thiết kế đề xuất (chưa làm – cần token và quyết định của chủ shop)

1. Bảng `TrackingOutbox` (eventName, eventId, orderId, platform, payload, attempts, status, lastError) – unique `(platform, eventId)` để **idempotent**: webhook / thao tác CMS lặp lại không tạo sự kiện trùng.
2. Ghi outbox **trong cùng transaction** với việc đổi trạng thái đơn:
   - Đơn tạo → `PlaceAnOrder` (TikTok) / sự kiện "đặt hàng" tuỳ chọn.
   - `paymentStatus` → PAID (chuyển khoản xác nhận) hoặc đơn COD giao thành công → `Purchase` (Meta) / `CompletePayment` (TikTok) / `purchase` GA4 MP với `event_id = mã đơn`.
   - → REFUNDED / CANCELLED sau khi đã PAID → `refund` GA4 MP.
3. Worker nền gửi outbox: timeout 5s, thử lại lũy tiến tối đa 5 lần, log lỗi, **không bao giờ** nằm trên đường request của khách.
4. Token (`META_CAPI_TOKEN`, `TIKTOK_EVENTS_TOKEN`, `GA4_API_SECRET`) chỉ ở biến môi trường server (`apps/api`), không có tiền tố `NEXT_PUBLIC_`, không commit.
5. Dữ liệu cá nhân (SĐT, email) chỉ gửi dạng băm SHA-256 và chỉ khi có consent.

## Chưa kiểm được

Server log, database production (đơn có `utm`), Meta Test Events, TikTok Test Events – cần quyền và/hoặc đơn test có kiểm soát.
