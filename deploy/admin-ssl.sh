#!/usr/bin/env bash
# Tự chờ DNS admin.yala.vn trỏ về VPS rồi cấp SSL + mở CMS (chạy nền, tối đa 3 giờ)
#   bash deploy/admin-ssl.sh        -> chạy nền, log: logs/admin-ssl.log
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ "${1:-}" != "--fg" ]; then
  mkdir -p "$ROOT/logs"
  nohup bash "$0" --fg > "$ROOT/logs/admin-ssl.log" 2>&1 &
  echo "✓ Đang chờ DNS admin.yala.vn ở chế độ nền (có thể thoát SSH). Xem: tail -f $ROOT/logs/admin-ssl.log"
  exit 0
fi
cd "$ROOT"
IP="$(curl -4 -fsS --max-time 10 https://api.ipify.org || true)"
echo "[$(date '+%F %T')] Chờ admin.yala.vn -> $IP"
for i in $(seq 1 180); do
  got="$(getent ahostsv4 admin.yala.vn 2>/dev/null | awk 'NR==1{print $1}' || true)"
  if [ -n "$IP" ] && [ "$got" = "$IP" ]; then
    echo "[$(date '+%F %T')] DNS đã trỏ đúng – cấp SSL"
    bash deploy/ssl-init.sh && echo "[$(date '+%F %T')] ✓ CMS: https://admin.yala.vn" && exit 0
    echo "✗ ssl-init lỗi"; exit 1
  fi
  sleep 60
done
echo "✗ Hết 3 giờ chờ mà DNS admin.yala.vn chưa trỏ về $IP"; exit 1
