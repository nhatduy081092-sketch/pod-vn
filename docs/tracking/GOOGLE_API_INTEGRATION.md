# Tích hợp Search Console API & Google Ads API – thiết kế

Trạng thái: **chưa kết nối API nào** (chưa có credentials). Tài liệu này là thiết kế để làm khi có quyền.

## 1. Search Console API
| Mục | Thiết kế |
|---|---|
| Xác thực | **Service account** (Google Cloud) → thêm email service account vào GSC với quyền **Restricted (chỉ đọc)** |
| Secret | File JSON key đặt trên VPS `/opt/yala/secrets/gsc.json` (quyền 600), đường dẫn qua `GSC_KEY_FILE` trong `.env`. **Không** vào git, **không** vào `NEXT_PUBLIC_*` |
| Dữ liệu | `searchanalytics.query`, property `sc-domain:yala.vn`, dimensions: `date, query, page, device, country` (+ `searchAppearance` truy vấn riêng – không ghép được với dimension khác) |
| Lịch | Cron 1 lần/ngày 09:00 GMT+7, lấy ngày **D-3** (GSC trễ 2–3 ngày), ghi đè 3 ngày gần nhất để lấy số đã chốt |
| Lưu | Bảng mới (migration chỉ thêm) `SeoDaily(date, query, page, device, country, clicks, impressions, ctr, position)`, khoá duy nhất theo 5 chiều đầu |
| Quota | 1.200 truy vấn/phút/site; `rowLimit` 25.000, phân trang `startRow`. Một ngày của yala.vn dự kiến < 10.000 dòng |
| Lỗi | 401/403 → ghi log + báo Telegram/Zalo admin "mất quyền GSC"; 429/5xx → thử lại theo backoff 3 lần |
| Tối thiểu dữ liệu | Không lấy URL Inspection hàng loạt (quota 2.000/ngày) – chỉ khi cần |

## 2. Google Ads API
Cần đủ 4 thứ – **hiện thiếu cả 4**:
1. **Developer token** (Ads Manager account → API Center; cấp Basic access cần Google duyệt, 1–3 ngày làm việc).
2. **OAuth client** (Google Cloud, loại Desktop/Web) + **refresh token** của một user có quyền đọc tài khoản Ads.
3. **Customer ID** tài khoản Ads (và login-customer-id nếu qua MCC).
4. Bật Google Ads API trong Google Cloud project.

| Mục | Thiết kế |
|---|---|
| Secret | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` trong `.env` VPS |
| Dữ liệu (GAQL) | `campaign`, `ad_group`, `keyword_view` (keyword, match type), `search_term_view` (search term), `segments.device`, `landing_page_view`; metrics: `cost_micros, clicks, impressions, conversions, conversions_value` |
| Lịch | Hằng ngày, lấy D-1 và ghi đè 7 ngày gần nhất (chuyển đổi về muộn) |
| Lưu | `AdsDaily(date, campaign, adGroup, keyword, matchType, searchTerm, device, landingPage, cost, clicks, impressions, conversions, value)` |
| Ghép backend | CPA = cost / số đơn **đã thu tiền** có gclid trong kỳ; ROAS = doanh thu thực / cost. Ghép theo `gclid` ↔ `click_view` (chỉ truy vấn được 90 ngày) |
| Upload offline | `ConversionUploadService.UploadClickConversions` cho đơn PAID (thay CSV tay) |
| Quota | Basic access: 15.000 thao tác/ngày – dư dùng |

## 3. Báo cáo tổng hợp (khi có dữ liệu)
| KPI | Nguồn | Ghi chú |
|---|---|---|
| Organic Clicks / Impressions / CTR / Avg Position | GSC | Trễ 2–3 ngày, chỉ Google Search |
| Sessions / Users | GA4 | Thiếu khách chặn tracking |
| Add to Cart / Checkout | GA4 | Hành vi |
| Purchases | **Backend** (chính) + GA4 (tham khảo) | Ghi rõ "đặt" vs "đã thu tiền" |
| Revenue | **Backend** (chính) + GA4 | VND |
| Ads Cost / Ads Conversions | Google Ads | Theo mô hình quy đổi của Ads |
| CPA / ROAS | Ads cost ÷ backend | — |

Quy tắc trình bày: mỗi ô ghi **nguồn, múi giờ (GMT+7), tiền tệ (VND), thời điểm cập nhật**; không cộng số giữa các nguồn.
