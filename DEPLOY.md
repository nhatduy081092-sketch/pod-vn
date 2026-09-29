# YALA – Deploy production lên VPS (yala.vn)

Kiến trúc chạy thật (1 VPS, không đổi kiến trúc monorepo):

```
Internet ──443──► Nginx (VPS, SSL Let's Encrypt)
                   ├─ yala.vn        ─► 127.0.0.1:3000  web (Next.js standalone, Docker)
                   ├─ admin.yala.vn  ─► 127.0.0.1:3001  cms (Next.js standalone, Docker)
                   └─ www.yala.vn    ─► 301 https://yala.vn
web / cms ──(mạng Docker nội bộ)──► api:4000 (Hono + Prisma) ──► PostgreSQL (Neon/Supabase hoặc Postgres nội bộ)
                                     └─ volume "uploads" (hoặc Cloudflare R2)
```

- API **không** mở cổng ra Internet. Trình duyệt gọi `https://yala.vn/api/*` → web chuyển tiếp nội bộ.
- `/api/admin/*` bị Nginx chặn từ Internet – chỉ CMS gọi nội bộ.
- Tường lửa chỉ mở 22, 80, 443.

## Yêu cầu VPS

Ubuntu 22.04/24.04, ≥ 2 vCPU, ≥ 2 GB RAM (script tự tạo 2 GB swap để build Next.js), ≥ 25 GB ổ đĩa.

## Lần đầu (≈ 20 phút)

```bash
# 1. Trên VPS (root)
git clone <repo> /opt/yala && cd /opt/yala       # repo private: dùng deploy key chỉ đọc
sudo bash deploy/setup-vps.sh                     # Docker, Nginx, Certbot, UFW, swap

# 2. Biến môi trường
cp .env.production.example .env.production
nano .env.production                              # điền mọi giá trị <...>
chmod 600 .env.production

# 3. DNS (tại nơi mua tên miền): bản ghi A
#    yala.vn, www.yala.vn, admin.yala.vn  ->  IP VPS

# 4. SSL + Nginx (tự kiểm tra DNS trước, chưa trỏ đúng thì dừng)
sudo bash deploy/ssl-init.sh --staging            # thử trước (không tính hạn mức Let's Encrypt)
sudo bash deploy/ssl-init.sh                      # chứng chỉ thật

# 5. Build + migrate + chạy + tạo admin lần đầu
bash deploy/deploy.sh --seed

# 6. Sao lưu tự động hằng ngày 02:30
sudo bash deploy/install-cron.sh
```

Sau đó: đăng nhập `https://admin.yala.vn` bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`, đổi thông tin thương hiệu (tên YALA, hotline, Zalo, VietQR) trong CMS → Nội dung.

## Các lần deploy sau

```bash
cd /opt/yala && bash deploy/deploy.sh
```

Quy trình tự động: `git pull` → **sao lưu DB + ảnh** → build image mới (bản cũ vẫn chạy) → `prisma migrate deploy` → khởi động bản mới → **health check** → lỗi thì **tự quay về bản cũ** → làm mới cache nội dung → dọn image cũ (giữ 3 bản).

## Vận hành

| Việc | Lệnh |
|---|---|
| Kiểm tra sức khoẻ | `bash deploy/health.sh` |
| Xem log | `docker compose -f docker-compose.production.yml logs -f --tail=200 api web cms` |
| Log Nginx | `/var/log/nginx/yala*.log` |
| Sao lưu ngay | `bash deploy/backup.sh` → `backups/db-*.dump`, `backups/uploads-*.tgz` |
| Quay về bản trước | `bash deploy/rollback.sh` (hoặc `rollback.sh <tag>`, xem `.deploy/history`) |
| Khôi phục database | `bash deploy/restore.sh backups/db-....dump [backups/uploads-....tgz]` (tự sao lưu hiện trạng trước, yêu cầu gõ xác nhận) |
| Health endpoint | `https://yala.vn/healthz` (web) · `https://yala.vn/api/health` (api + DB) · `https://admin.yala.vn/healthz` |

## An toàn dữ liệu

- Chỉ dùng `prisma migrate deploy` (áp migration mới, không xoá dữ liệu). **Không bao giờ** chạy `prisma migrate reset` / `db push --force-reset` trên production.
- Deploy luôn sao lưu trước khi migrate; rollback code không tự lùi database – dùng `restore.sh` nếu migration làm hỏng dữ liệu.
- Bản sao lưu nằm trên chính VPS: nên tải định kỳ về máy/Drive, hoặc bật backup của Neon/Supabase.
- Ảnh upload: khuyên dùng Cloudflare R2 (`R2_*`); nếu không, ảnh nằm trong volume `yala_uploads` (đã nằm trong backup).

## Biến môi trường

Xem `.env.production.example`. Lưu ý:
- `NEXT_PUBLIC_*` được **đóng băng lúc build** – đổi giá trị thì phải deploy lại.
- `JWT_SECRET` ≥ 32 ký tự; đổi = mọi phiên đăng nhập (khách + admin) bị đăng xuất.
- Seed production từ chối mật khẩu admin mặc định/yếu.

## Kiểm tra build trước khi lên VPS (máy Windows)

`scripts\prod-check.cmd` – install, prisma validate/generate/migrate status, typecheck, `next build` web + cms (giả lập không có API như lúc build Docker), chạy API chế độ production + health check. Kết quả: `logs\prod-check-summary.txt`.
