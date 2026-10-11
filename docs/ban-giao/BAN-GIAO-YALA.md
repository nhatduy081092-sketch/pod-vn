# BÀN GIAO DỰ ÁN YALA (yala.vn) – chuyển sang tài khoản Claude mới

Cập nhật: 11/10/2026 · Commit mới nhất: `bc50ca2` (build GitHub Actions: success) · Ngôn ngữ làm việc: **tiếng Việt**

---

## 0. Cách dùng gói này ở tài khoản mới
1. Tạo Project mới trên claude.ai (ví dụ “YALA – website POD”).
2. Tải lên Project: file này + toàn bộ thư mục `tai-lieu/` (11 tài liệu nghiên cứu/quyết định).
3. Nối GitHub cho tài khoản mới và cấp quyền repo **nhatduy081092-sketch/pod-vn** (private). Bản sao các tài liệu này cũng nằm trong repo: `docs/ban-giao/`.
4. Dán câu mở đầu ở mục 10 vào cuộc trò chuyện đầu tiên.

---

## 1. Dự án là gì
- **YALA** – website in theo yêu cầu (POD): áo, túi, cốc, quà in logo… Domain production **yala.vn**, CMS **admin.yala.vn**.
- Ban đầu clone bố cục Printdoors (allOverPrint), rồi đổi tên OEM → YALA, rồi định vị lại.
- **Định vị hiện tại (11/10/2026)** – khách **tập thể**:
  - Doanh nghiệp (`/doanh-nghiep`) · CLB & đội thể thao (`/dong-phuc-the-thao`) · Hội nhóm, lớp, gia đình (`/ao-nhom`) · Team building & sự kiện (`/team-building`).
  - **Đơn nhóm từ 10 sản phẩm**; ít hơn vẫn đặt được (tính như mua lẻ). Khách lẻ vẫn mua được nhưng không quảng bá (khu “Mua lẻ” cuối trang chủ).
  - Cách mua: **giá hiện ngay + đặt online** cho đơn vừa; đơn lớn/đặc biệt gửi **yêu cầu báo giá** (Zalo).
  - **Giá bậc thang theo số lượng: chủ shop tự nhập trong CMS** (chưa nhập – web tự hiện bảng giá khi có).
  - Khách lớn tuổi hơn → **giao diện chững chạc** (đã đổi ở commit 1015bf2).
- Thương hiệu: YALA = Young – Ambitious – Limitless – Authentic. Slogan VN: “Trẻ trung – Khát vọng – Không giới hạn – Sống thật.” Màu chính **cam đậm #E4570B + đen #1d1d1f**. Có logo chữ + monogram “YA”.
- Liên hệ: 39 Nguyễn Văn Đậu, Phường Bình Lợi Trung, TP.HCM · Hotline/Zalo 0971808330 · contact@yala.vn.
- Ảnh sản phẩm thật sẽ do bên sản xuất cung cấp; hiện dùng ảnh phôi trơn tạo bằng ChatGPT (gắn nhãn “Ảnh minh hoạ”).

## 2. Kỹ thuật
| Hạng mục | Chi tiết |
|---|---|
| Repo | github.com/nhatduy081092-sketch/pod-vn (private) · máy chủ nhân: `C:\Users\Admin\dev\pod-vn` |
| Monorepo | pnpm 10 + turbo · Node ≥ 20.12 |
| `apps/web` | Next.js 15 storefront (port 3000) |
| `apps/cms` | Next.js 15 quản trị – admin.yala.vn (port 3001) |
| `apps/api` | Hono + Prisma, chạy bằng tsx (port 4000), không mở ra Internet |
| `packages/db` | Prisma schema, migrations, seed |
| `packages/shared` | types, zod, giá, render canvas dùng chung, nội dung (segments, mẫu có sẵn, chiến dịch…) |
| DB | PostgreSQL (Docker trên VPS) |
| Hạ tầng | VPS Ubuntu `14.225.253.165`, Docker + Nginx + Let's Encrypt; image build trên **GitHub Actions** (`.github/workflows/images.yml`) → GHCR |
| Deploy | `ssh -t root@14.225.253.165 "cd /opt/yala && bash deploy/deploy.sh"` (git pull → backup → kéo image → `prisma migrate deploy` → health check → tự rollback nếu lỗi). `--force` để chạy lại cùng bản |
| Vận hành | `deploy/health.sh`, `backup.sh`, `rollback.sh`, `restore.sh` – chi tiết `tai-lieu/yala-deploy.md` |

**Biến môi trường** (`.env.production`, KHÔNG commit): NEXT_PUBLIC_SITE_URL, CORS_ORIGINS, DATABASE_URL, POSTGRES_PASSWORD, JWT_SECRET, REVALIDATE_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, R2_* (5 biến), NEXT_PUBLIC_UPLOADS_BASE, OPENAI_API_KEY, OPENAI_IMAGE_MODEL, OPENAI_IMAGE_QUALITY, AI_IMAGE_PROVIDER, GEMINI_*, AI_PHOTO_BUDGET_USD, NEXT_PUBLIC_GA4_ID, NEXT_PUBLIC_META_PIXEL_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, IMAGE_REGISTRY, CERTBOT_EMAIL, BACKUP_KEEP_*.

**Migration gần nhất**: `20261005120000_group_order` (bảng GroupOrder, GroupMember).

**Cập nhật cài đặt 1 lần khi API khởi động** (`apps/api/src/lib/settings-updates.ts`, đánh dấu bằng bảng Setting – không ghi đè nội dung chủ shop đã sửa): liên hệ thương hiệu, ảnh phôi trơn (`update:blank-photos:2026-10-07`), định vị áo nhóm (`update:group-pivot:2026-10-11`). Thêm danh mục màu YALA Everyday: `ensureEverydayColors` (`starter-catalog.ts`).

## 3. Tính năng đã có (tóm tắt)
- **Cửa hàng**: danh mục, tìm không dấu, trang sản phẩm (tab mô tả/size/vận chuyển/hướng dẫn in, ảnh đổi theo màu), giỏ, thanh toán COD + VietQR, 34 tỉnh mới, tra cứu đơn mã + SĐT, tài khoản khách SĐT, Help Center, trang chính sách (CMS), thông báo Telegram, GA4/Meta Pixel + UTM.
- **Trang sản phẩm áo**: tab **“Đặt cho nhóm”** mở sẵn (danh sách tên/số/size – tải Excel/CSV/dán), “Mua lẻ” thứ hai; bảng giá theo số lượng tự hiện khi có bậc giá.
- **YALA Studio** (`/thiet-ke/<slug>`, `apps/web/src/components/editor/`): nhiều mặt in, ảnh + chữ (font VN), kéo/xoay/phóng, lặp 5 kiểu, xoá nền trên máy, cắt/mặt nạ, cảnh báo DPI, thư viện 168 mẫu chữ + 3.588 hình MIT, khung ghép ảnh 8 bố cục, ảnh thành tranh vẽ 5 kiểu, ô tên/số từng người, xem trên người mẫu, cốc/bình in 2 bên, lịch tháng âm lịch, xuất file in đúng mm×DPI. Điện thoại: kiểu app, khung ~2/3 màn hình, mặc định “cận vùng in”, vẽ Retina.
- **Gom đơn nhóm**: Studio → Hoàn tất → “Tạo link gom đơn nhóm” → `/nhom/<mã>`; thành viên tự ghi tên/số/size; trưởng nhóm chốt, hạn chót, đặt 1 đơn.
- **Mẫu có sẵn** `/bo-suu-tap` (~30 bộ, sửa chữ, 5 dáng × 6 màu phôi thật).
- **Chiến dịch theo dịp** `/dip/<slug>` (20/10, Halloween, 20/11, Noel, Tết 2027) – đếm ngược hạn chót, giá ưu đãi từ CMS.
- **Doanh nghiệp**: `/doanh-nghiep` (điều kiện đặt hàng, ngành hàng, giải pháp theo dịp, quy trình, form báo giá), `/doanh-nghiep/san-pham` lọc ngân sách, giỏ báo giá.
- **Trang nhóm khách** (`packages/shared/src/segments.ts` + `components/segments/SegmentPage.tsx`): hero + minh hoạ áo in tên/số, lợi ích, 4 bước, sản phẩm gợi ý, FAQ schema, form báo giá ghi “Nhóm khách”.
- **CMS**: sản phẩm (biến thể SKU, vùng in, bậc giá, bảng giá nhanh), danh mục, đơn, nội dung trang chủ, đánh giá, thư viện hình (nguồn/giấy phép/duyệt), chiến dịch, seller dropship, **Ảnh thật** (phôi trơn, người mẫu, ảnh sản phẩm bằng ChatGPT làm tay), Ảnh AI (hạn mức 3 USD).
- **Seller dropship** `/seller` (đã làm, đang không ưu tiên).

## 4. Thiết kế hiện tại (commit 1015bf2 – “chững chạc”)
- 1 font **Be Vietnam Pro** cho cả tiêu đề; tiêu đề vừa phải, giãn dòng 1.15 cho dấu tiếng Việt.
- Màu nền khối là **sắc vải trầm** (token cũ `sun/sky/bubble/mint/lilac/peach` giữ tên, đổi giá trị trong `apps/web/tailwind.config.ts`); cam đậm chỉ cho nút/điểm nhấn.
- Không viền đen dày, không bóng cứng, không nghiêng/lắc/nảy; nút bo vừa, cao 44px (`apps/web/src/app/globals.css`).
- Dải slogan đầu trang tĩnh, chữ nhỏ.
- Studio giữ viền rõ để dễ thao tác.

## 5. Việc đang dở / nên làm tiếp
1. **Deploy** commit mới nhất (`1015bf2`) nếu chưa chạy: lệnh ở mục 2.
2. **Bảo mật VPS**: mật khẩu root có thể đã lộ trong ảnh chụp terminal (11/10) → đổi qua trang quản lý nhà cung cấp VPS; sau đó cài **khoá SSH** để deploy không cần gõ mật khẩu.
3. Nhập **bậc giá theo số lượng** cho 6 sản phẩm YALA Everyday (áo thun 199k, dài tay 229k, sweater 359k, hoodie 399k, jogger 349k, tote 129k) – mốc gợi ý 10/30/50/100.
4. ~~Khối “Vì sao chọn YALA” + câu chân trang + dải TopBar còn “In từ 1 chiếc”~~ – đã sửa (cập nhật 1 lần `update:why-choose-group:2026-10-11`, không ghi đè câu chủ shop đã sửa). Còn: cân nhắc tắt dải slogan “Young/Ambitious…” nếu không hợp khách lớn tuổi.
5. **SEO** (xem `tai-lieu/yala-seo-2-cong-thuc.md`, mục 6): đã làm 4 trang mẫu áo theo nhóm + 4 trang công cụ (bc50ca2). Còn: nhập bảng size + bậc giá trong CMS, Search Console, Google Business Profile, ảnh thật. Đã làm trang `/mau-danh-sach-in-ao` + file `public/tai-ve/mau-danh-sach-in-ao-yala.xlsx` (tạo lại: `python scripts/gen/roster-template.py`); KPI: sự kiện GA4 `resource_download`.
6. Ảnh thật áo nhóm (đội bóng, lớp, team building) thay ảnh minh hoạ; case study thật cho doanh nghiệp.
7. Tắt biến thể màu Hồng/Trắng trong CMS nếu xưởng chưa có phôi; ảnh người mẫu cho sweater, dài tay, tote, áo thun đen.
8. Nội dung 4 trang nhóm khách đang nằm trong code (`segments.ts`) – có thể đưa vào CMS nếu cần sửa thường xuyên.

## 6. Quy tắc & sở thích làm việc của chủ dự án
- Trả lời **tiếng Việt**, ngắn gọn, thẳng; làm luôn khi đủ thông tin (Build > Discuss), báo kết quả + lệnh deploy.
- Kiểm tra trước khi kết luận: typecheck, chụp màn hình (điện thoại + laptop), chờ build GitHub Actions success.
- **Tuyệt đối không** `prisma migrate reset` / `db push --force-reset` trên production; migration chỉ thêm.
- Không commit secret (`.env*` bị ignore); không đưa URL/SECRET Apps Script lên GitHub hay CMS.
- Không nhập mật khẩu/đăng nhập hộ (VPS, CMS, ChatGPT); không nhập thẻ, không thanh toán – chủ shop tự làm.
- Chủ shop **không muốn dùng tiện ích Claude in Chrome** (đã từ chối 3 lần); thích nhận link hơn mở bảng trình duyệt bên cạnh.
- Ảnh AI: không dùng Gemini; hạn mức chi ~**3 USD**; thường tự tạo ảnh bằng ChatGPT theo prompt Claude soạn.
- Không bịa đánh giá, logo khách hàng, số liệu; không dùng tên/khẳng định của OEM Group như của YALA; không chép logo thương hiệu khác.
- Hiển thị giá/điều kiện nhất quán (đơn nhóm từ 10).

## 7. Bản đồ code hay sửa
| Việc | File |
|---|---|
| Trang chủ | `apps/web/src/app/page.tsx`, `components/landing/GroupHero.tsx` |
| Trang nhóm khách | `packages/shared/src/segments.ts`, `apps/web/src/components/segments/SegmentPage.tsx`, `app/{dong-phuc-the-thao,ao-nhom,team-building}/page.tsx` |
| Doanh nghiệp | `apps/web/src/app/doanh-nghiep/page.tsx`, `components/b2b/*` |
| Menu/footer | `components/layout/Header.tsx`, `Footer.tsx` |
| Màu/font/nút | `apps/web/tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx` |
| Studio | `apps/web/src/components/editor/` (`DesignEditor.tsx`, `Stage.tsx`, `OrderSheet.tsx`) · render dùng chung `packages/shared/src/render.ts` |
| Trang sản phẩm | `components/product/ProductConfigurator.tsx`, `TeamOrderPanel.tsx` |
| Gom đơn nhóm | `apps/api/src/routes/groups.ts`, `apps/web/src/app/nhom/[code]`, `lib/group.ts` |
| Cài đặt trang (mặc định) | `packages/shared/src/landing.ts` (`DEFAULT_LANDING`, `mergeLanding`) |
| Cập nhật cài đặt 1 lần | `apps/api/src/lib/settings-updates.ts` |
| Phôi trơn | `apps/web/public/blanks/<dáng>-<màu>.webp` (36 ảnh) |

## 8. Lịch sử gần đây (mới → cũ)
- Trang mẫu danh sách in áo (tải Excel) + thông điệp “Đơn nhóm từ 10” thống nhất (TopBar, Vì sao chọn YALA, chân trang, /thiet-ke, /bo-suu-tap)
- bc50ca2 SEO: 4 trang mẫu áo theo nhóm, thiết kế áo lớp online, bảng size, slogan áo lớp, tên đội bóng; 18 mẫu đồng phục có ô tên/số
- 1015bf2 Giao diện chững chạc cho khách tập thể
- 968de6e Định vị khách tập thể: trang chủ áo nhóm, 3 trang nhóm khách, đơn nhóm từ 10
- 1b6cd40 / eb704e1 / 29f3560 Studio: khung thiết kế to hơn (điện thoại ~2/3 màn hình), cận vùng in, nét Retina
- 57b59ae Tự tải lại khi gặp lỗi JS cũ sau deploy
- 2166b7c / 5ea0fe7 Ảnh phôi trơn thật 6 dáng × 6 màu; YALA Everyday đủ 6 màu
- 4429673 CMS tạo ảnh sản phẩm bằng ChatGPT làm tay
- c942143 / 547a06c / 1a2f1c4 / a5fe378 Cốc in 2 bên, người mẫu, gom đơn nhóm, khung ghép ảnh, tranh vẽ
- cf5f9f6 Chiến dịch theo dịp `/dip`
(Tổng 67 commit – xem `git log`.)

## 9. Danh sách tài liệu kèm theo (`tai-lieu/`)
| File | Nội dung |
|---|---|
| pod-vn-README.md | README kỹ thuật + roadmap + bảo mật |
| yala-deploy.md | Deploy/vận hành VPS |
| yala-dinh-vi-khach-tap-the.md | Quyết định định vị khách tập thể |
| yala-seo-2-cong-thuc.md | Nghiên cứu SEO + 2 công thức |
| doi-thu-canh-tranh.md | Bản đồ đối thủ VN |
| doi-thu-merch-b2b.md | 6 đối thủ quà tặng B2B |
| yala-studio-thiet-ke-dot-10-2026.md | Đợt nâng cấp Studio 10/2026 |
| yala-studio-vs-printdoors-editor.md | Studio vs Printdoors, quyết định chức năng |
| yala-vs-printdoors-christmas.md | Chiến dịch theo dịp |
| core-gap-vs-printdoors.md | Khoảng cách lõi hệ thống |
| audit-vs-printdoors.md | Rà soát bố cục ban đầu |

## 10. Câu mở đầu dán vào tài khoản mới
> Tôi đang tiếp tục dự án YALA (yala.vn) từ tài khoản Claude khác. Hãy đọc file BAN-GIAO-YALA.md và các tài liệu trong Project trước, sau đó clone repo nhatduy081092-sketch/pod-vn để làm việc. Trả lời bằng tiếng Việt. Việc tiếp theo: [ghi việc bạn muốn làm].
