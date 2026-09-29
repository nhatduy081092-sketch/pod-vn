# Lõi hệ thống: local (OEM Group POD) vs Printdoors – 29/09/2026

Nguồn: API công khai của Printdoors (`/req/frontend/basicProduct/:id`, `getPurchaseRule`, `logisticsCal`, `systemNotice`, `helpCenterArticle`), trang /products, /how-it-work, Help Center. Công cụ thiết kế `/design/design` bắt buộc đăng nhập → mô tả lấy từ Help Center + data model sản phẩm (FACT), không thao tác trực tiếp.

## Kết luận
- **Vỏ (landing, card, catalog, trang SP)**: gần 1:1.
- **Lõi POD**: mới ở mức "upload 1 ảnh + xem trước 2D". Thiếu 3 trụ cột Printdoors dựa vào: (1) biến thể SKU + vùng in theo mặt, (2) công cụ thiết kế đa mặt xuất file in, (3) tính phí ship theo cân nặng/địa chỉ.
- **Khác mô hình**: Printdoors = nền tảng B2B cho seller dropship (tích hợp Shopify/Etsy/TikTok, API, CSV). Local = cửa hàng bán thẳng B2C + báo giá B2B. Phần "seller platform" không nên clone khi chưa chọn mô hình.

## 1. Data model sản phẩm (quan trọng nhất)
| Printdoors | Local | Trạng thái |
|---|---|---|
| Biến thể SKU theo màu × size: mã SKU, cân nặng, kích thước gói, giá vốn | `colors[]`, `sizes[]` dạng chuỗi, không có bảng SKU | ❌ |
| Màu có mã hex (hiện swatch) | Tên màu | ❌ |
| Nhiều mặt in (view 1–5: trước, sau, tay…) + vùng in (rộng/cao, DPI) | 1 `mockShape` cho cả SP, không có vùng in | ❌ |
| Mockup theo màu × mặt: ảnh nền + lớp mask + normal map + ánh sáng; model 3D (.glb) | CSS mask trên silhouette SVG, 14 dáng | 🟡 |
| Giá sỉ theo bậc (1–9 / 10–49 / 50+) | `priceTiers` | ✅ |
| Khuyến mãi: % giảm, giá KM, ngày kết thúc, nhãn "Limited time offer" | `compareAtPrice` tĩnh | 🟡 |
| Thời gian SX trung bình theo từng SP | 1 giá trị chung | ❌ |
| Kho/xưởng xuất hàng (CN/US/UK…) | Không cần cho VN | — |
| Tạm ngưng SX theo khung giờ (thông báo trên trang SP) | Không | ❌ |

## 2. Công cụ thiết kế
| Printdoors | Local | Trạng thái |
|---|---|---|
| Trang editor riêng, chọn từng mặt in | Khối upload trong trang SP | 🟡 |
| Add File / Upload + **thư viện thiết kế miễn phí** (1000+ mẫu, thêm ~30/tuần) | Chỉ upload | ❌ |
| Kéo, thả, co giãn, căn canvas | Chỉ Phủ kín / Lặp + cỡ lặp | ❌ |
| Xem trước trên model (3D) | 2D mask | 🟡 |
| Lưu thiết kế → mẫu sản phẩm (tái sử dụng, đặt lại) | Không lưu | ❌ |
| Kiểm tra file: PNG/JPG, ≤20MB, ≤30.000px, ≥150 DPI | Magic bytes + ≤15MB, không kiểm DPI | 🟡 |
| Ghép + cắt file sản xuất phía server (merge design, production crop) | Xưởng nhận file gốc + ghi chú | ❌ |
| Branding: nhãn, bao bì in logo | Không | ❌ |
| Đồng phục nhóm (tên/số/size từ Excel) | **Có** (Printdoors không có) | ✅+ |
| 764 SP OEM | Chỉ upload logo trong form báo giá, không thiết kế online | ❌ |

## 3. Giá, vận chuyển, đơn hàng
| Printdoors | Local | Trạng thái |
|---|---|---|
| Phí ship = cân nặng SKU × điểm đến, nhiều gói (Standard/Express), số ngày | Đồng giá + ngưỡng miễn phí | ❌ |
| Giỏ gộp nhiều đơn, thanh toán gộp | Giỏ 1 đơn | 🟡 |
| Huỷ đơn, đổi địa chỉ, xuất hoá đơn, tracking, yêu cầu hậu mãi | Tra cứu mã + SĐT, CMS nhập mã vận đơn | 🟡 |
| Nhập đơn bằng CSV | Không | ❌ (seller) |
| COD, VietQR, 34 tỉnh mới | **Có** | ✅+ |
| Báo giá B2B | **Có** | ✅+ |

## 4. Catalog & tìm kiếm
| Printdoors | Local | Trạng thái |
|---|---|---|
| Bộ sưu tập: Best Sellers / New / Sale / Made in USA / Fast / Branding | Chỉ Bán chạy | 🟡 |
| Cây danh mục 2 cấp (8 nhóm) | Danh mục + nhóm con + lọc | ✅ |
| Lọc nơi xuất hàng | Không cần | — |
| Badge SALE/NEW + thời gian SX trên card | -% | 🟡 |
| Tìm kiếm | Không dấu + gợi ý tức thì (tốt hơn cho VN) | ✅+ |

## 5. Tài khoản & kênh bán (mô hình seller)
Đăng ký/đăng nhập (email, Google, Facebook) · Workbench: mẫu SP, đơn, cửa hàng, branding · tích hợp Shopify/Etsy/WooCommerce/Shoplazza/Wix/TikTok · Open API · Transfer Order · Group-buying · Affiliate · Free sample. **Local: chưa có** (V3, phụ thuộc quyết định mô hình).

## 6. Nội dung & vận hành
| Printdoors | Local | Trạng thái |
|---|---|---|
| Help Center 7 nhóm, ~60 bài, có tìm kiếm | 5 trang tĩnh | ❌ |
| Bảng thông báo (lịch nghỉ lễ, chính sách) | Không | ❌ |
| Chat: chủ đề + form để lại thông tin | Zalo / gọi / Messenger | 🟡 |
| Ảnh CDN resize theo kích thước (200/469/1000px) | Ảnh gốc, chưa resize | ❌ |
| SEO: SPA, meta qua API | SSR/ISR, JSON-LD, sitemap | ✅+ |

## Lộ trình đề xuất (không clone phần seller trước khi chốt mô hình)
- **A. Lõi dữ liệu**: bảng `ProductVariant` (màu hex × size, SKU, cân nặng, trạng thái), `PrintArea` theo mặt (tên, rộng×cao mm, DPI tối thiểu, ảnh mockup + mask theo mặt), `productionDays` theo SP. Migrate từ `colors[]`/`sizes[]`.
- **B. Editor v1** (Konva): tab theo mặt in, ảnh + chữ (font tiếng Việt), kéo/co/xoay, cảnh báo DPI, xem trước trên ảnh mockup; lưu JSON thiết kế vào đơn; server render file in từng mặt (sharp) → CMS tải file sẵn in. Áp dụng cả SP OEM (in logo 1 vị trí).
- **C. Giá & ship**: khuyến mãi có hạn + bộ sưu tập Mới/Sale; phí ship theo cân nặng × tỉnh (API GHN/GHTK); thông báo nghỉ lễ; resize ảnh.
- **D. Khách hàng**: tài khoản SĐT/Zalo, thiết kế đã lưu, đặt lại; Help Center; form lead trong widget.
- **E. Chỉ khi làm mô hình seller**: workspace seller, mẫu SP, CSV import, Shopee/TikTok Shop/Haravan, API.
