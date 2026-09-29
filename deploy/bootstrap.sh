#!/usr/bin/env bash
# ============================================================
# YALA – cài đặt production LẦN ĐẦU trên VPS, 1 lệnh (chạy bằng root, trong thư mục repo):
#   cd /opt/yala && bash deploy/bootstrap.sh
# Làm lần lượt: chuẩn bị VPS → tạo .env.production (hỏi vài câu, tự sinh secret)
#               → SSL + Nginx → build + migrate + seed → sao lưu hằng ngày → kiểm tra
# Chạy lại an toàn: bước nào đã xong sẽ được bỏ qua / làm lại không mất dữ liệu.
# ============================================================
set -Eeuo pipefail
trap 'echo "✗ Lỗi ở dòng $LINENO: $BASH_COMMAND" >&2' ERR
[ "$(id -u)" = 0 ] || { echo "Chạy bằng root"; exit 1; }
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env.production"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# ---------- 1. VPS ----------
say "1/6 Chuẩn bị VPS (Docker, Nginx, Certbot, tường lửa, swap)"
bash deploy/setup-vps.sh >/tmp/yala-setup.log 2>&1 || { tail -30 /tmp/yala-setup.log; echo "Lỗi chuẩn bị VPS (log: /tmp/yala-setup.log)"; exit 1; }
echo "✓ xong (log: /tmp/yala-setup.log)"

# ---------- 2. .env.production ----------
say "2/6 Cấu hình .env.production"
rand() { openssl rand -hex "$1"; }
ask() { # ask "Câu hỏi" "mặc định" -> REPLY
  local q="$1" def="${2:-}"
  read -r -p "$q${def:+ [$def]}: " REPLY
  REPLY="${REPLY:-$def}"
}
no_quote() { [[ "$1" != *"'"* ]] || { echo "Giá trị không được chứa dấu nháy đơn ('). Nhập lại."; return 1; }; }

if [ -f "$ENV_FILE" ] && ! grep -q '<' "$ENV_FILE"; then
  echo "✓ Đã có .env.production – giữ nguyên (xoá file này nếu muốn tạo lại)"
else
  echo "Database: Enter = PostgreSQL chạy ngay trên VPS (khuyên dùng khi bắt đầu, tự sao lưu hằng ngày)"
  echo "          hoặc dán connection string Neon/Supabase (bản KHÔNG qua pooler)."
  while :; do ask "DATABASE_URL" ""; no_quote "$REPLY" && break; done
  DB_URL="$REPLY"; PG_PASS=""
  if [ -z "$DB_URL" ]; then PG_PASS="$(rand 24)"; DB_URL="postgresql://yala:${PG_PASS}@db:5432/yala?schema=public"; fi

  while :; do ask "Email đăng nhập CMS (admin)" ""; [[ "$REPLY" == *@*.* ]] && no_quote "$REPLY" && break; echo "Email không hợp lệ"; done
  ADMIN_EMAIL="$REPLY"
  while :; do
    read -r -s -p "Mật khẩu admin CMS (≥ 12 ký tự): " P1; echo
    read -r -s -p "Nhập lại: " P2; echo
    [ "$P1" = "$P2" ] || { echo "Không khớp"; continue; }
    [ ${#P1} -ge 12 ] || { echo "Cần ≥ 12 ký tự"; continue; }
    no_quote "$P1" && break
  done
  ask "Email nhận thông báo SSL (Let's Encrypt)" "$ADMIN_EMAIL"; CERT_EMAIL="$REPLY"

  umask 077
  cat > "$ENV_FILE" <<EOF
# Tạo bởi deploy/bootstrap.sh lúc $(date -Is) – KHÔNG commit, KHÔNG gửi file này cho ai
NEXT_PUBLIC_SITE_URL='https://yala.vn'
CORS_ORIGINS='https://yala.vn,https://admin.yala.vn'
DATABASE_URL='${DB_URL}'
POSTGRES_PASSWORD='${PG_PASS}'
JWT_SECRET='$(rand 48)'
REVALIDATE_SECRET='$(rand 24)'
ADMIN_EMAIL='${ADMIN_EMAIL}'
ADMIN_PASSWORD='${P1}'
CERTBOT_EMAIL='${CERT_EMAIL}'
BACKUP_KEEP_DAYS=14
# Tuỳ chọn – điền sau rồi chạy lại: bash deploy/deploy.sh --no-pull
R2_ACCOUNT_ID=''
R2_ACCESS_KEY_ID=''
R2_SECRET_ACCESS_KEY=''
R2_BUCKET=''
R2_PUBLIC_URL=''
NEXT_PUBLIC_UPLOADS_BASE=''
NEXT_PUBLIC_GA4_ID=''
NEXT_PUBLIC_META_PIXEL_ID=''
TELEGRAM_BOT_TOKEN=''
TELEGRAM_CHAT_ID=''
EOF
  chmod 600 "$ENV_FILE"
  unset P1 P2
  echo "✓ Đã tạo .env.production (quyền 600, secret sinh ngẫu nhiên)"
fi

# ---------- 3. SSL + Nginx ----------
say "3/6 SSL Let's Encrypt + Nginx"
bash deploy/ssl-init.sh

# ---------- 4. Build + migrate + seed ----------
say "4/6 Build, migrate database, tạo tài khoản admin (lần đầu 5–15 phút)"
bash deploy/deploy.sh --no-pull --seed

# ---------- 5. Sao lưu hằng ngày ----------
say "5/6 Sao lưu tự động 02:30 mỗi ngày"
bash deploy/install-cron.sh

# ---------- 6. Kiểm tra ----------
say "6/6 Kiểm tra"
bash deploy/health.sh || true

cat <<'MSG'

✓ HOÀN TẤT. Website: https://yala.vn
  CMS: https://admin.yala.vn (nếu đã có DNS admin.yala.vn)
       chưa có DNS -> từ máy bạn: ssh -L 3001:127.0.0.1:3001 root@<IP-VPS>  rồi mở http://localhost:3001
  Deploy bản mới: cd /opt/yala && bash deploy/deploy.sh
  Bảo mật: đổi mật khẩu root (passwd) và chuyển sang đăng nhập SSH bằng key.
MSG
