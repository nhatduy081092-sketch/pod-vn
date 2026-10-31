# Kiến trúc đo lường Google – YALA.vn

Cập nhật 31/10/2026. Đi kèm [TRACKING.md](TRACKING.md) (sự kiện, Meta/TikTok).

## 1. Bốn nền tảng, bốn việc khác nhau

| Nền tảng | Đo cái gì | Nguồn dữ liệu | Không dùng để |
|---|---|---|---|
| **Search Console (GSC)** | Google *tìm kiếm tự nhiên*: lượt hiển thị, lượt bấm, CTR, vị trí, truy vấn, trang được lập chỉ mục | Máy chủ Google Search (trước khi khách vào web) | Đo doanh thu, đo quảng cáo trả phí |
| **GA4** | Hành vi *trên web*: phiên, người dùng, nguồn truy cập, phễu mua, doanh thu ghi nhận ở trình duyệt | Mã trên web (gtag hoặc GTM) | Thay số đơn thật trong CMS; đo từ khoá trả phí |
| **GTM** | *Công cụ triển khai thẻ*, không tự đo gì | dataLayer do web đẩy ra | Báo cáo |
| **Google Ads** | Chi phí, lượt bấm quảng cáo, từ khoá / search term trả phí, chuyển đổi được quy cho quảng cáo | Hệ thống Ads + thẻ chuyển đổi + nhập offline | Đo SEO |
| **Backend (DB đơn hàng)** | Đơn thật, trạng thái giao/thu tiền, doanh thu thực | Postgres qua CMS | — (đây là "sự thật" để đối chiếu) |

Số liệu giữa các nền tảng **không cộng hoặc trừ trực tiếp** được: GSC đếm lượt bấm trên trang kết quả, GA4 đếm phiên có chạy JS và không bị chặn, Ads quy chuyển đổi theo mô hình và cửa sổ riêng, backend đếm đơn thật.

## 2. Luồng dữ liệu

```
 Google Search ──(tự nhiên)──────────────┐            Search Console ◄── Google tự thu
 Google Ads   ──(gclid/gbraid/wbraid)────┤
                                         ▼
                                   yala.vn (Next.js)
                                         │
             lib/track.ts ── push ──► dataLayer ──► [GTM-XXXX] ──► GA4 (G-XXXX)
                    │                                      ├──────► Google Ads conversion + Conversion Linker
                    │ (không có GTM: gtag thẳng)            └──────► Meta / TikTok (tuỳ chọn)
                    ▼
       captureUtm(): utm_*, gclid, gbraid, wbraid, fbclid, ttclid, landing (đầu + cuối, 30 ngày)
                    │ gửi kèm khi đặt hàng / báo giá
                    ▼
       API /orders ──► DB Order.utm (JSON)  ──► CMS: nguồn đơn
                                               └─► (đề xuất) xuất CSV đơn ĐÃ THU TIỀN có gclid
                                                    ──► Google Ads "Offline conversion import"
```

## 3. Quyết định kiến trúc

1. **Một kênh phát sự kiện duy nhất**: mọi sự kiện đi qua `track.ts` → dataLayer. Có `NEXT_PUBLIC_GTM_ID` thì web *không* gọi gtag/fbq/ttq nữa → không thể vừa gửi thẳng vừa gửi qua GTM (đã thử: chế độ GTM 0 lệnh gửi thẳng).
2. **GTM nạp `afterInteractive`** (sau khi trang tương tác được) qua `next/script` trong `components/layout/Analytics.tsx`, nằm trong layout gốc → nạp 1 lần cho cả phiên, không nạp lại khi chuyển trang.
3. **Chuyển trang SPA**: Next.js không tải lại trang → web đẩy `virtual_page_view` (kèm `page_path`, `page_location`, `page_title`). Trong GTM, page_view GA4 gửi theo trigger này, **tắt** "page changes based on browser history" của Enhanced Measurement để không đếm đôi.
4. **Purchase = đặt hàng thành công**, không phải đã thu tiền (đơn COD). Doanh thu thật lấy từ backend; Google Ads nên tối ưu theo chuyển đổi offline "đã thu tiền" (xem [GOOGLE_ADS_CONVERSION_SETUP.md](GOOGLE_ADS_CONVERSION_SETUP.md)).
5. **Click ID lưu server-side** cùng đơn → quy đơn về quảng cáo được cả khi khách chặn GA4.
6. **Không gửi dữ liệu cá nhân** lên GA4/Ads. Enhanced Conversions (băm email/SĐT) chỉ bật khi đã có banner đồng ý.
7. **Consent Mode v2**: đã có chỗ đặt trạng thái mặc định; banner đồng ý cần chủ shop duyệt giao diện.

## 4. Hiện trạng kết nối (trung thực)

| Hạng mục | Trạng thái |
|---|---|
| Tài khoản Google đã kết nối với Claude | **Không có** – không đăng nhập hộ |
| GSC property | Không xác minh được từ bên ngoài: DNS yala.vn **không có** bản ghi TXT `google-site-verification`; trang chủ không có thẻ meta xác minh |
| GA4 property | Chưa có ID trên web |
| GTM container | Chưa có trên web (đã kiểm tra HTML yala.vn: không có googletagmanager) |
| Google Ads conversion action | Chưa tạo / chưa biết |
| API (GSC, Ads) | Chưa kết nối |
