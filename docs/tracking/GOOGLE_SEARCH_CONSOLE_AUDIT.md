# Kiểm tra Search Console / SEO kỹ thuật – YALA.vn

Ngày kiểm tra: 31/10/2026. Phương pháp: kiểm tra **từ bên ngoài** (curl, DNS, đọc HTML). **Chưa truy cập được GSC** (không có quyền) → mọi số liệu Clicks / Impressions / CTR / Position / Index coverage **chưa có**.

## 1. Xác minh quyền sở hữu

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| DNS TXT `google-site-verification` | **Không có** | `Resolve-DnsName yala.vn -Type TXT` trả về SOA, không có TXT nào. NS: `dnssec1/2.pavietnam.vn` |
| Thẻ meta xác minh trên trang chủ | **Không có** | `curl https://yala.vn/` không chứa `google-site-verification` |
| File HTML xác minh | Không kiểm được (không biết tên file) | — |

→ Nhiều khả năng **chưa có Domain Property**. Cách làm (chủ shop, 10 phút):
1. search.google.com/search-console → Add property → **Domain** → `yala.vn` → copy bản ghi TXT.
2. Trang quản lý DNS P.A Việt Nam → thêm bản ghi **TXT**, host `@`, giá trị vừa copy. Không xoá bản ghi khác.
3. Chờ 5–60 phút → Verify. Giữ bản ghi vĩnh viễn.
4. Sitemaps → nhập `sitemap.xml` → Submit.
5. Settings → Associations → liên kết GA4.

## 2. robots.txt — **Đạt**
```
Allow: /
Disallow: /gio-hang /thanh-toan /don-hang/ /tai-khoan /seller /thiet-ke/ /dang-nhap /dang-ky
Sitemap: https://yala.vn/sitemap.xml
```
Chặn đúng trang riêng tư/giao dịch. `/thiet-ke` (trang công cụ) vẫn được phép; chỉ chặn `/thiet-ke/…` (bản thiết kế cá nhân).

## 3. Sitemap — **Đã sửa lỗi (chưa deploy)**
| | Trước | Sau sửa (thử trên máy) |
|---|---|---|
| Tổng URL | 200 | 870 |
| Sản phẩm | **101 / 770** | 770 / 770 |

Nguyên nhân: `app/sitemap.ts` chỉ lấy trang 1 của API (100 SP). Đã sửa để đi hết các trang. Đã kiểm tra một SP ngoài top 100 (`/san-pham/tui-bao-tu-qua-tang-khuyen-mai-in-logo`): 200, canonical tự trỏ, không noindex → **669 SP đang bị thiếu trong sitemap** trên bản live.

## 4. Mã trạng thái, redirect — **Đạt**
| URL | Kết quả |
|---|---|
| http://yala.vn/ | 301 → https://yala.vn/ |
| https://www.yala.vn/, http://www.yala.vn/ | 301 → https://yala.vn/ |
| https://yala.vn/san-pham/ (dấu / cuối) | 308 → /san-pham |
| URL không tồn tại | 404 |
| 200 URL trong sitemap (live) | 200/200 trả 200 |

## 5. Canonical, indexability, trùng lặp
| Kiểm tra | Kết quả |
|---|---|
| Canonical tự trỏ trên 200 URL sitemap | **Đạt** 200/200 |
| URL trong sitemap bị noindex | **0** |
| Tiêu đề trùng trong sitemap | **0** |
| Trang tìm kiếm `/san-pham?q=` | `noindex, follow` – đúng |
| Giỏ hàng | `noindex` – đúng |
| ⚠ Trang noindex có canonical trỏ về **trang chủ** (`/san-pham?q=…`, `/gio-hang`) | Tín hiệu lẫn lộn, rủi ro thấp (đã noindex). Đề xuất: bỏ canonical hoặc trỏ về chính nó. **Chưa sửa** – chờ duyệt |
| `/doanh-nghiep/san-pham?nganh=…` / `?dip=…` có trong sitemap với canonical giữ query | Chấp nhận nếu nội dung mỗi trang khác nhau; theo dõi báo cáo "Duplicate without user-selected canonical" trong GSC |

## 6. Dữ liệu có cấu trúc
| Trang | Schema | Nhận xét |
|---|---|---|
| Sản phẩm | Product + Offer + Brand | Đạt cơ bản. Thiếu BreadcrumbList. Không thêm AggregateRating vì chưa có đánh giá thật |
| /doanh-nghiep | Organization, Service, OfferCatalog, FAQPage | Tốt |
| Trang chủ, /san-pham, /bo-suu-tap/*, /doanh-nghiep/san-pham | **Không có JSON-LD** | Đề xuất WebSite (+ SearchAction) và Organization ở trang chủ; BreadcrumbList ở danh mục/bộ sưu tập. **Chưa làm** – chờ duyệt |

Kiểm tra rich results chính thức: dùng search.google.com/test/rich-results (chủ shop hoặc sau khi có GSC).

## 7. Core Web Vitals — **Chưa đo được**
- PageSpeed Insights API: hết hạn mức miễn phí trong ngày (không có API key).
- Đo trong trình duyệt của Claude: khung trình duyệt bị ẩn nên LCP không ghi nhận → không dùng số này.
- TTFB trang chủ đo được: ~139 ms, DOMContentLoaded ~216 ms (1 lần đo, mạng máy này – chỉ tham khảo).
→ Cần xem **GSC → Core Web Vitals** (dữ liệu thực của người dùng Chrome) hoặc chạy pagespeed.web.dev.

Mobile Usability: Google đã bỏ báo cáo này khỏi GSC (12/2023) → dùng Lighthouse.

## 8. Việc chủ shop cần làm trong GSC sau khi xác minh
1. Pages (Indexing) → ghi lại số Indexed / Not indexed và lý do.
2. URL Inspection 3 URL: trang chủ, 1 danh mục, 1 SP ngoài top 100 → "Request indexing".
3. Performance → lọc 28 ngày → xuất Queries, Pages, Devices, Countries, Search appearance.
4. Gửi file xuất (hoặc cấp quyền đọc cho service account – xem GOOGLE_API_INTEGRATION.md) để phân tích từ khoá → trang chuyển đổi cao (ghép với GA4 landing page + key events).
