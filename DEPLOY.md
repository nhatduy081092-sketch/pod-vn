# YALA – Deploy production lên VPS (yala.vn)

Kiến trúc chạy thật (1 VPS, không đổi kiến trúc monorepo):

```
Internet ──443──► Nginx (VPS, SSL Let's Encrypt)
                   ├─ yala.vn        ─► 127.0.0.1:3180  web (Next.js standalone, Docker)
                   ├─ cms.yala.vn  ─► 127.0.0.1:3181  cms (Next.js standalone, Docker)
                   └─ www.yala.vn    ─► 301 https://yala.vn
web / cms ──(mạng Docker nội bộ)──► api:4000 (Hono + Prisma) ──► PostgreSQL (Neon/Supabase hoặc Postgres nội bộ)
                                     └─ volume "uploads" (hoặc Cloudflare R2)
```

- API **không** mở cổng ra Internet. Trình duyệt gọi `https://yala.vn/api/*` → web chuyển tiếp nội bộ.
- `/api/admin/*` bị Nginx chặn từ Internet – chỉ CMS gọi nội bộ.
- Tường lửa chỉ mở 22, 80, 443.

## Yêu cầu VPS

Ubuntu 22.04/24.04, ≥ 2 vCPU, ≥ 2 GB RAM (script tự tạo 2 GB swap để build Next.js), ≥ 25 GB ổ đĩa.

## Lần đầu – cách nhanh (1 lệnh)

```bash
# Trên VPS (root). Repo private -> tạo deploy key chỉ đọc
apt-get update && apt-get install -y git
ssh-keygen -t ed25519 -N "" -f ~/.ssh/yala_deploy -C yala-vps && cat ~/.ssh/yala_deploy.pub
#   -> GitHub: repo pod-vn > Settings > Deploy keys > Add deploy key (dán, KHÔNG tick write)
printf 'Host github.com\n  IdentityFile ~/.ssh/yala_deploy\n  StrictHostKeyChecking accept-new\n' >> ~/.ssh/config
git clone git@github.com:nhatduy081092-sketch/pod-vn.git /opt/yala
cd /opt/yala && bash deploy/bootstrap.sh
```

`bootstrap.sh` hỏi 3 thứ (database – Enter để dùng Postgres trên VPS, email + mật khẩu admin), tự sinh mọi secret, rồi chạy lần lượt các bước bên dưới. `cms.yala.vn` chưa có DNS thì CMS tạm chưa mở ra Internet – thêm bản ghi A rồi chạy lại `sudo bash deploy/ssl-init.sh`.

## Lần đầu – từng bước (≈ 20 phút)

```bash
# 1. Trên VPS (root)
git clone <repo> /opt/yala && cd /opt/yala       # repo private: dùng deploy key chỉ đọc
sudo bash deploy/setup-vps.sh                     # Docker, Nginx, Certbot, UFW, swap

# 2. Biến môi trường
cp .env.production.example .env.production
nano .env.production                              # điền mọi giá trị <...>
chmod 600 .env.production

# 3. DNS (tại nơi mua tên miền): bản ghi A
#    yala.vn, www.yala.vn, cms.yala.vn  ->  IP VPS

# 4. SSL + Nginx (tự kiểm tra DNS trước, chưa trỏ đúng thì dừng)
sudo bash deploy/ssl-init.sh --staging            # thử trước (không tính hạn mức Let's Encrypt)
sudo bash deploy/ssl-init.sh                      # chứng chỉ thật

# 5. Build + migrate + chạy + tạo admin lần đầu
bash deploy/deploy.sh --seed

# 6. Sao lưu tự động hằng ngày 02:30
sudo bash deploy/install-cron.sh
```

Sau đó: đăng nhập `https://cms.yala.vn` bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`, đổi thông tin thương hiệu (tên YALA, hotline, Zalo, VietQR) trong CMS → Nội dung.

## Các lần deploy sau

```bash
cd /opt/yala && bash deploy/deploy.sh
```

### Build trên GitHub, VPS chỉ tải image (khuyên dùng)

Mỗi lần push lên `main`, GitHub Actions (`.github/workflows/images.yml`) build 3 image và đẩy lên GHCR:
`ghcr.io/nhatduy081092-sketch/yala-{api,web,cms}:<commit>`. VPS không phải build → deploy ~1–2 phút, không cần nhiều ổ đĩa.

Cài 1 lần:
1. Push code → đợi job **Build images** xanh (tab *Actions* trên GitHub, lần đầu ~10–15 phút).
2. GitHub → hồ sơ → **Packages** → lần lượt `yala-api`, `yala-web`, `yala-cms` → *Package settings* → *Change visibility* → **Public**
   (repo đã public, image không chứa bí mật – `.env.production` chỉ nạp lúc chạy trên VPS).
   Muốn để Private: trên VPS chạy `docker login ghcr.io -u <user>` với token classic quyền `read:packages`.
3. Trên VPS thêm vào `.env.production`: `IMAGE_REGISTRY="ghcr.io/nhatduy081092-sketch"`.
4. Nếu dùng GA4 / Meta Pixel / CDN ảnh: GitHub → repo → *Settings → Secrets and variables → Actions → Variables* thêm
   `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_UPLOADS_BASE` (cùng giá trị như `.env.production`).

Từ đó: `cd /opt/yala && bash deploy/deploy.sh` – script tự chờ nếu GitHub chưa build xong (tối đa 15 phút).
Cần build ngay trên VPS (GitHub lỗi): `bash deploy/deploy.sh --build`.

Quy trình tự động: `git pull` → **sao lưu DB + ảnh** → tải image từ GHCR (hoặc build – bản cũ vẫn chạy) → `prisma migrate deploy` → khởi động bản mới → **health check** → lỗi thì **tự quay về bản cũ** → làm mới cache nội dung → dọn image cũ (giữ 2 bản).

## Vận hành

| Việc | Lệnh |
|---|---|
| Kiểm tra sức khoẻ | `bash deploy/health.sh` |
| Xem log | `docker compose -f docker-compose.production.yml logs -f --tail=200 api web cms` |
| Log Nginx | `/var/log/nginx/yala*.log` |
| Sao lưu ngay | `bash deploy/backup.sh` → `backups/db-*.dump`, `backups/uploads-*.tgz` |
| Quay về bản trước | `bash deploy/rollback.sh` (hoặc `rollback.sh <tag>`, xem `.deploy/history`) |
| Khôi phục database | `bash deploy/restore.sh backups/db-....dump [backups/uploads-....tgz]` (tự sao lưu hiện trạng trước, yêu cầu gõ xác nhận) |
| Health endpoint | `https://yala.vn/healthz` (web) · `https://yala.vn/api/health` (api + DB) · `https://cms.yala.vn/healthz` |

## An toàn dữ liệu

- Chỉ dùng `prisma migrate deploy` (áp migration mới, không xoá dữ liệu). **Không bao giờ** chạy `prisma migrate reset` / `db push --force-reset` trên production.
- Deploy luôn sao lưu trước khi migrate; rollback code không tự lùi database – dùng `restore.sh` nếu migration làm hỏng dữ liệu.
- Ảnh upload: khuyên dùng Cloudflare R2 (`R2_*`); nếu không, ảnh nằm trong volume `yala_uploads` (đã nằm trong backup). Hiện (11/2026) R2 chưa cấu hình – ảnh khách chỉ nằm trong volume này.

### Bản sao lưu thứ hai trên máy chủ shop

Bản trên VPS mất theo VPS, nên máy Windows của chủ shop tự tải về `D:\YALA-sao-luu` bằng `deploy/pull-backups.ps1` (chỉ đọc trên VPS qua SSH, khoá `~/.ssh/jes_vps`):

- Hẹn giờ trong Task Scheduler: **"YALA - tai sao luu ve may"**, 10:00 hằng ngày + 10 phút sau khi đăng nhập; máy tắt lúc tới giờ thì chạy bù. Script chạy là bản chép ở `D:\YALA-sao-luu\tai-sao-luu.ps1` – sửa `deploy/pull-backups.ps1` thì chép lại.
- Database: tải mọi bản mới vào `db\`, kiểm tra đủ dung lượng + đầu file `PGDMP`, giữ 60 ngày. Ảnh upload: chỉ tải bản mới nhất khi nội dung đổi (so sha256) vào `uploads\`, giữ 3 bản.
- Nhật ký: `D:\YALA-sao-luu\tai-ve.log`. Bản mới nhất trên VPS quá 36 giờ (cron 02:30 ngừng) hoặc không tải được quá 2 ngày → tạo file **`YALA-SAO-LUU-CAN-XEM.txt` trên Desktop**; lần sau bình thường thì file tự xoá.
- Khôi phục từ bản trên máy: trong PowerShell `cd D:\YALA-sao-luu\db; scp -i $HOME\.ssh\jes_vps .\db-....dump root@VPS:/opt/yala/backups/` (đường dẫn tương đối – scp hiểu `D:` là tên máy chủ) rồi trên VPS `bash deploy/restore.sh backups/db-....dump`.

### Canh web sập

`.github/workflows/uptime.yml` kiểm tra từ máy của GitHub mỗi 10 phút: trang chủ, `/healthz`, `/api/health` (database), CMS, hạn SSL yala.vn + cms.yala.vn (báo khi còn dưới 14 ngày); lỗi thì thử 3 lần cách 40 giây rồi mới tính. Lần chạy thất bại → GitHub gửi email cho tài khoản đã push workflow (GitHub → Settings → Notifications → Actions: bật email, chọn chỉ báo khi thất bại). Bảng kết quả từng lần ở tab Actions → "Canh web YALA". GitHub tắt lịch chạy nếu repo không có commit nào trong 60 ngày – khi đó vào tab Actions bật lại.

## Biến môi trường

Xem `.env.production.example`. Lưu ý:
- `NEXT_PUBLIC_*` được **đóng băng lúc build** – đổi giá trị thì phải deploy lại.
- `JWT_SECRET` ≥ 32 ký tự; đổi = mọi phiên đăng nhập (khách + admin) bị đăng xuất.
- Seed production từ chối mật khẩu admin mặc định/yếu.

## Kiểm tra build trước khi lên VPS (máy Windows)

`scripts\prod-check.cmd` – install, prisma validate/generate/migrate status, typecheck, `next build` web + cms (giả lập không có API như lúc build Docker), chạy API chế độ production + health check. Kết quả: `logs\prod-check-summary.txt`.

## Ảnh thật cho sản phẩm (AI – ảnh minh hoạ tạm)

28 sản phẩm mẫu dùng ảnh vẽ 2D. Đổi sang ảnh chụp bằng Google Gemini (Nano Banana 2 Lite, ~0,034 USD/ảnh):

1. Tạo key tại https://aistudio.google.com/apikey (gắn thanh toán – API không có gói free cho tạo ảnh).
2. `nano /opt/yala/.env.production` → thêm `GEMINI_API_KEY="…"` → `bash deploy/deploy.sh --force`
3. `bash deploy/ai-photos.sh` – tự tạo ảnh cho mọi sản phẩm còn ảnh 2D, gắn vào sản phẩm, làm mới web.
   `--dry` xem trước · `--style=model` ảnh người mẫu · `--keep-2d` giữ ảnh 2D làm ảnh phụ. Chạy lại an toàn.

Ảnh AI (`/uploads/ai-*`) có nhãn "Ảnh minh hoạ" trên web; thay bằng ảnh/mockup thật từ xưởng (CMS → Sản phẩm) thì nhãn tự mất.
Có thể tạo/duyệt từng ảnh trong CMS → **Ảnh thật AI**.
