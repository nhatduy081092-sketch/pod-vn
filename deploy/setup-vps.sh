#!/usr/bin/env bash
# ============================================================
# Chuẩn bị VPS Ubuntu 22.04/24.04 lần đầu (chạy bằng root):
#   Docker + Compose, Nginx, Certbot, tường lửa, swap, thư mục /opt/yala
#   curl -fsSL <raw-url>/deploy/setup-vps.sh | sudo bash   hoặc   sudo bash deploy/setup-vps.sh
# ============================================================
set -Eeuo pipefail
[ "$(id -u)" = 0 ] || { echo "Chạy bằng root: sudo bash deploy/setup-vps.sh"; exit 1; }
export DEBIAN_FRONTEND=noninteractive

echo "==> Cập nhật hệ thống + gói cần thiết"
apt-get update -y
apt-get install -y ca-certificates curl git ufw nginx certbot cron

echo "==> Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
docker compose version

echo "==> Swap 2GB (build Next.js cần RAM; bỏ qua nếu đã có swap)"
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Tường lửa: chỉ mở SSH, HTTP, HTTPS (Postgres/API/web/cms không mở ra ngoài)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Nginx: tắt site mặc định, thư mục xác minh Let's Encrypt"
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/www/certbot
sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf || true
systemctl enable --now nginx

echo "==> Thư mục ứng dụng"
mkdir -p /opt/yala
cat <<'MSG'

✓ VPS đã sẵn sàng. Bước tiếp theo:
  1) Tải mã nguồn (repo private -> dùng deploy key hoặc token chỉ đọc):
       git clone git@github.com:nhatduy081092-sketch/pod-vn.git /opt/yala
  2) cd /opt/yala && cp .env.production.example .env.production && nano .env.production
  3) Trỏ DNS: yala.vn, www.yala.vn, admin.yala.vn  ->  A record = IP VPS này
  4) sudo bash deploy/ssl-init.sh          (xin SSL, cấu hình Nginx)
  5) bash deploy/deploy.sh --seed          (lần đầu) – các lần sau: bash deploy/deploy.sh
  6) Sao lưu hằng ngày: sudo bash deploy/install-cron.sh
MSG
