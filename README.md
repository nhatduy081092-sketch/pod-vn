# POD Việt – Website in toàn thân (All-Over Print) theo yêu cầu

Monorepo clone **bố cục 1:1** trang `printdoors.com/activity/allOverPrint`, Việt hoá và tối ưu cho khách Việt:
VND, giá sỉ theo số lượng, 34 tỉnh/thành mới, COD + VietQR, Zalo, tra cứu đơn bằng mã + SĐT.

> Chỉ clone **layout/UX**. Logo, tên thương hiệu, ảnh người mẫu và ảnh sản phẩm của Printdoors **không** được sao chép.
> Ảnh sản phẩm hiện tại là mockup SVG tự sinh. Thay bằng ảnh thật qua CMS.

```
pod-vn/
├── apps/
│   ├── web/   Next.js 15 – storefront (port 3000)
│   ├── cms/   Next.js 15 – trang quản trị (port 3001)
│   └── api/   Hono + Node – REST API, upload, tính giá (port 4000)
├── packages/
│   ├── db/      Prisma schema, seed, sinh mockup SVG
│   └── shared/  Types, zod schema, format VND, tỉnh thành, giá sỉ (dùng chung FE/BE)
├── docker-compose.yml   PostgreSQL 16 cho dev
└── turbo.json / pnpm-workspace.yaml
```

Luồng dữ liệu: `web` và `cms` → gọi `api` → `Prisma` → `PostgreSQL`.
CMS gọi API **từ phía server** (token nằm trong cookie httpOnly, trình duyệt không thấy).

---

## 1. Chạy lần đầu (Windows / macOS / Linux)

Yêu cầu: **Node ≥ 20.12**, **pnpm 10** (`corepack enable`), PostgreSQL (Docker, Supabase hoặc Neon).

```bash
corepack enable
pnpm install

# 1) Tạo .env ở thư mục gốc rồi sửa giá trị (DATABASE_URL, JWT_SECRET, ADMIN_*)
cp .env.example .env          # PowerShell: Copy-Item .env.example .env

# 2) Database: dùng Docker…
docker compose up -d
#    …hoặc dán connection string Supabase/Neon vào DATABASE_URL

# 3) Copy .env xuống từng app + tạo bảng + dữ liệu mẫu
pnpm init-env
pnpm db:migrate --name init
pnpm db:seed

# 4) Chạy cả 3 app
pnpm dev
```

| App | URL | Ghi chú |
|---|---|---|
| Website | http://localhost:3000 | Landing, danh mục, sản phẩm, giỏ, thanh toán |
| CMS | http://localhost:3001 | Đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env` |
| API | http://localhost:4000/health | REST: `/api/*` (public), `/api/admin/*` (JWT) |

Sinh lại mockup SVG (nếu sửa palette): `pnpm --filter @pod/db mockups`

---

## 2. Bản đồ clone 1:1 (trang mẫu → component)

| # | Section trên trang mẫu | Component | Chỉnh trong CMS |
|---|---|---|---|
| 1 | Banner "U.S. FACTORY DELIVERY ZONE" | `web/components/landing/TopBanner.tsx` | Nội dung landing → Banner trên cùng |
| 2 | Header (menu, logo, icon tài khoản cam) | `layout/Header.tsx` (thay icon TK bằng Tra cứu đơn + Giỏ hàng) | Thương hiệu |
| 3 | Hero cửa sổ "ALL-OVER PRINT" + tab vàng + badge | `landing/Hero.tsx` | Hero (upload PNG người mẫu nền trong) |
| 4 | Best Sellers – card xấp giấy so le | `landing/BestSellers.tsx` | Tick "Bán chạy" ở sản phẩm |
| 5 | Step 1 → 5 zig-zag màu | `landing/Steps.tsx` | Quy trình (text + màu) |
| 6 | Đoạn AOP + 3 mẫu vải + GET STARTED | `landing/FabricIntro.tsx` | Giới thiệu chất liệu, Mẫu chất liệu |
| 7 | Hot Sale Products + 3 ô Men/Women/Kids | `landing/SectionTitle.tsx`, `AudienceTiles.tsx` | Ô danh mục đối tượng |
| 8 | Grid T-shirt / Hoodie / Pajamas / Shirt / Sportswear | `landing/CategorySection.tsx` + `shop/ProductCard.tsx` (card cửa sổ cam, badge -%) | Danh mục (thứ tự, bật trang chủ) + Sản phẩm |
| 9 | Review khách (trang live) | `landing/Testimonials.tsx` | Đánh giá |
| 10 | Why Choose / We deliver with / Payment | `landing/WhyChoose.tsx`, `layout/Footer.tsx` | Vì sao chọn chúng tôi |
| 11 | Widget chat nổi | `layout/FloatingContact.tsx` (Zalo, gọi, Messenger) | Thương hiệu → Zalo/Messenger |

Màu lấy mẫu trực tiếp từ ảnh: cam card `#FFA415`, nền kem `#FFF6C1`, hero `#FEBB2E`, chữ badge `#FFE44D`, viền `#1d1d1f` (xem `apps/web/tailwind.config.ts`).

---

## 3. Tính năng tối ưu cho người Việt

- **Giá VND + giá sỉ theo bậc** (1–9 / 10–49 / 50–99 / 100+). Server luôn tính lại giá, không tin giá client.
- **Customizer AOP**: khách upload ảnh → xem trước đổ tràn lên dáng áo (CSS mask, nhẹ trên mobile), 2 chế độ *Phủ kín* / *Lặp họa tiết*.
- **Địa chỉ 34 tỉnh/thành mới** (Tỉnh → Phường/Xã, bỏ Quận/Huyện).
- **Validate SĐT VN** (03/05/07/08/09, chấp nhận +84).
- **COD + chuyển khoản VietQR** (QR điền sẵn số tiền + nội dung = mã đơn).
- **Zalo-first**: nút Zalo nổi, "Gửi ý tưởng qua Zalo", CMS có link Zalo tới khách.
- **Tra cứu đơn** bằng mã + SĐT (SĐT không nằm trên URL).
- **Tracking**: GA4 + Meta Pixel (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `contact`), lưu UTM/fbclid/gclid first-touch vào đơn → xem nguồn đơn trong CMS.
- **SEO**: slug không dấu, metadata, JSON-LD Product, sitemap, robots, ISR 60s.

---

## 4. Checklist trước khi chạy quảng cáo

- [ ] Đổi `JWT_SECRET`, `ADMIN_PASSWORD`
- [ ] CMS → Thương hiệu: tên, hotline, **Zalo**, email, địa chỉ
- [ ] CMS → VietQR: mã ngân hàng, số TK, tên chủ TK (HOA, không dấu)
- [ ] Upload ảnh sản phẩm thật (chụp/mockup của bạn) + ảnh hero, ảnh 3 ô Nam/Nữ/Trẻ em
- [x] ~~Xoá 3 đánh giá mẫu~~ (đã xoá) – chỉ đăng review thật (review giả vi phạm chính sách Meta/TikTok và luật BVQLNTD)
- [ ] CMS → Sản phẩm → **Bảng giá nhanh**: lọc "Chưa có giá nào" → điền giá bán hoặc giá "Từ" cho 20–40 sản phẩm chủ lực
- [ ] CMS → Sản phẩm: lọc ảnh "Ảnh gốc oemgroup.vn (cần thay)" → tải ảnh thật; CMS → Danh mục → điền **Bảng size**
- [ ] Điền 5 biến `R2_*` trước khi deploy (ảnh upload không bị mất)
- [ ] Đổi mật khẩu database Neon (đã lộ trong ảnh chụp màn hình) → cập nhật `DATABASE_URL`
- [ ] Điền `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` → test bằng Tag Assistant / Pixel Helper
- [ ] Trang chính sách đổi trả, bảo mật, liên hệ (cần cho duyệt quảng cáo)
- [ ] Đặt thử 1 đơn COD + 1 đơn chuyển khoản end-to-end

---

## 5. Deploy đề xuất

> **Production yala.vn: xem [DEPLOY.md](DEPLOY.md)** (Docker + Nginx + Let's Encrypt trên VPS, script deploy/backup/rollback). Bảng dưới là phương án thay thế (Vercel/Railway).


| Thành phần | Nơi chạy | Ghi chú |
|---|---|---|
| `apps/web`, `apps/cms` | Vercel (2 project, Root Directory = `apps/web`, `apps/cms`) | Env: `NEXT_PUBLIC_API_URL`, `API_URL`, `NEXT_PUBLIC_SITE_URL` |
| `apps/api` | Railway / Render / VPS | Lệnh start: `pnpm --filter @pod/api start`. Chạy `pnpm --filter @pod/db run migrate:deploy` khi deploy |
| PostgreSQL | Neon / Supabase | |
| File upload | **Cloudflare R2** (đã hỗ trợ sẵn) | Điền `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` cho API. Không điền = lưu ổ đĩa, mất khi redeploy |

---

## 6. Roadmap

**MVP (đã có)**: landing 1:1, danh mục, chi tiết + customizer, giỏ, checkout COD/VietQR, tra cứu đơn, CMS (sản phẩm, danh mục, đơn, nội dung landing, đánh giá), tracking.

**V2 (vận hành & tăng chuyển đổi)**
- [x] Trang chính sách/hướng dẫn chỉnh trong CMS (`/trang/<slug>`, link ở footer) + tên DN, MST ở footer
- [x] On-demand revalidate: lưu CMS → web cập nhật ngay (`REVALIDATE_SECRET`)
- [x] Thông báo đơn mới qua Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- [x] Lưu ảnh lên Cloudflare R2 (điền 5 biến `R2_*` trong `.env`; không có thì lưu ổ đĩa). DB luôn lưu `/uploads/<tên>`, API tự chuyển hướng sang CDN
- [x] Giá tham khảo "Từ …₫" cho sản phẩm báo giá + **Bảng giá nhanh** (CMS → Sản phẩm → Bảng giá nhanh, gõ `45k` = 45.000₫, lọc "Chưa có giá")
- [x] Trang sản phẩm 4 tab: Mô tả / Bảng size / Vận chuyển / Hướng dẫn file in; ảnh nhỏ bấm đổi ảnh + phóng to
- [x] Bảng size theo danh mục (CMS → Danh mục) + ghi đè theo sản phẩm, dán thẳng từ Excel
- [x] Lọc sản phẩm theo ảnh: "Ảnh gốc oemgroup.vn (cần thay)"; đồng bộ lại OEM **không ghi đè** ảnh đã tự upload
- [x] Bỏ đánh giá mẫu (migration xoá, seed không tạo lại)
- [ ] Tạo thumbnail/WebP khi upload (sharp)
- [ ] Webhook ngân hàng (SePay/Casso) → tự động chuyển "Đã thanh toán"
- [ ] API GHN/GHTK: tính phí ship theo tỉnh, tạo vận đơn từ CMS
- [x] Đồng phục nhóm: tải Excel/CSV hoặc dán danh sách tên/số/size, tự áp giá sỉ, CMS tải CSV cho xưởng
- [x] Nhận diện OEM Group (navy #1C4D99 + cam #F88125), khối giải pháp doanh nghiệp
- [x] Đồng bộ ~764 sản phẩm từ oemgroup.vn (CMS → Sản phẩm → "Đồng bộ từ oemgroup.vn"), 9 danh mục
- [x] Sản phẩm chưa có giá = form "Cá nhân hoá & nhận báo giá" (mã BG…, lọc trong CMS)
- [x] Tìm kiếm không dấu + gợi ý tức thì; lọc nhóm con/giá; sidebar desktop, chip + bảng lọc mobile
- [x] Công cụ thiết kế `/thiet-ke/<slug>`: nhiều mặt in, ảnh + chữ (9 font tiếng Việt), kéo/xoay/phóng, lặp họa tiết, cảnh báo DPI, nháp tự lưu, xuất file in PNG đúng kích thước mm×DPI (CMS tải file in từng mặt)

**Chạy nhanh trên Windows**: double-click `start-dev.cmd` (log ghi vào `logs/dev.log`).

**Đợt A–E (đã có)**
- **A. Dữ liệu lõi**: biến thể SKU (màu × size, mã màu, cân nặng, phụ phí), vùng in từng mặt (mm, DPI, mockup/mask/overlay, phụ phí), thời gian SX + cân nặng theo sản phẩm – CMS → Sản phẩm → Sửa
- **B. Công cụ thiết kế + file in** (xem trên)
- **C. Vận hành**: KM có hạn (đếm ngược), bộ sưu tập Hàng mới/Khuyến mãi/Bán chạy, phí ship theo vùng × cân nặng (CMS → Cài đặt → Vận chuyển), thông báo/tạm dừng SX (dải đầu trang + `/thong-bao`), ảnh tối ưu next/image
- **D. Khách hàng**: tài khoản SĐT + mật khẩu (`/dang-ky`, `/tai-khoan`), lưu thiết kế, đặt lại đơn, sổ địa chỉ, gắn đơn cũ theo mã, Help Center `/ho-tro` (CMS → Help Center), form "Gọi lại cho tôi" → CMS → Khách để lại SĐT
- **E. Seller dropship** (`/seller`): đăng ký → CMS duyệt + đặt % chiết khấu; mẫu sản phẩm (phôi + thiết kế + mã), đơn tay / CSV / Open API `/api/v1` (API key `pk_live_…`, chống trùng theo `externalId`), thanh toán gộp VietQR (CMS → Thanh toán seller), webhook ký HMAC, đóng gói thương hiệu riêng

**Còn lại (cần tài khoản đối tác / quyết định kinh doanh)**
- [ ] API GHN/GHTK/Viettel Post: tạo vận đơn, cước thật (hiện dùng bảng phí CMS)
- [ ] Đồng bộ đơn Shopee / TikTok Shop / Shopify (hiện: CSV + Open API)
- [ ] Webhook ngân hàng (SePay/Casso) tự đối soát VietQR; ví/công nợ seller
- [ ] Kiểm tra lại kích thước vùng in mặc định với xưởng (migration tạo mặc định 600×700mm@100dpi cho AOP, 100×100mm@300dpi cho logo)

---

## 7. Bảo mật đã xử lý

JWT admin (HS256, 7 ngày) trong cookie httpOnly · mật khẩu hash scrypt · zod validate toàn bộ input · giá tính phía server ·
upload kiểm tra magic bytes (chặn SVG/HTML) + giới hạn 15MB · rate limit đơn/upload/login/tra cứu (in-memory; khi scale nhiều instance chuyển sang Redis) ·
CORS whitelist · secure headers · CMS `noindex` + `X-Frame-Options: DENY`.
Tài khoản khách: cookie `pod_session` httpOnly, token khách **không** dùng được cho CMS (kiểm `typ` + admin còn tồn tại) · API key lưu SHA-256, chỉ hiện 1 lần · webhook chỉ https, chặn IP nội bộ (SSRF), không theo redirect · form lead có honeypot + rate limit · `?next=` chỉ cho đường dẫn nội bộ.
