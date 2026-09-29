#!/usr/bin/env bash
# ============================================================
# SSL Let's Encrypt cho yala.vn, www.yala.vn, admin.yala.vn + cài cấu hình Nginx
#   sudo bash deploy/ssl-init.sh            # thật
#   sudo bash deploy/ssl-init.sh --staging  # thử (chứng chỉ test, không tính hạn mức)
# Chỉ chạy certbot khi DNS đã trỏ đúng về VPS.
# ============================================================
source "$(dirname "$0")/lib.sh"
[ "$(id -u)" = 0 ] || die "Chạy bằng root: sudo bash deploy/ssl-init.sh"

DOMAINS=(yala.vn www.yala.vn admin.yala.vn)
STAGING=""; [ "${1:-}" = "--staging" ] && STAGING="--staging"
EMAIL="$(env_get CERTBOT_EMAIL)"
[ -n "$EMAIL" ] && [[ "$EMAIL" != *"<"* ]] || die "Điền CERTBOT_EMAIL trong .env.production"

# 1) Kiểm tra DNS trỏ đúng IP VPS
IP="$(curl -4 -fsS --max-time 10 https://api.ipify.org || curl -4 -fsS --max-time 10 https://ifconfig.me)"
[ -n "$IP" ] || die "Không xác định được IP công khai của VPS"
bad=0
for d in "${DOMAINS[@]}"; do
  got="$(getent ahostsv4 "$d" | awk 'NR==1{print $1}')"
  if [ "$got" = "$IP" ]; then log "✓ DNS $d -> $got"; else log "✗ DNS $d -> ${got:-(chưa có)} (cần $IP)"; bad=1; fi
done
[ "$bad" = 0 ] || die "DNS chưa trỏ về VPS – tạo bản ghi A cho các tên miền trên rồi chạy lại (có thể mất 5–30 phút)"

# 2) Nginx tạm (chỉ HTTP) để Let's Encrypt xác minh
install -d /var/www/certbot /etc/nginx/snippets
install -m 644 deploy/nginx/snippets-yala-proxy.conf    /etc/nginx/snippets/yala-proxy.conf
install -m 644 deploy/nginx/snippets-yala-security.conf /etc/nginx/snippets/yala-security.conf
install -m 644 deploy/nginx/snippets-yala-ssl.conf      /etc/nginx/snippets/yala-ssl.conf
if [ ! -f /etc/letsencrypt/live/yala.vn/fullchain.pem ]; then
  install -m 644 deploy/nginx/yala.vn.bootstrap.conf /etc/nginx/sites-available/yala.vn.conf
  ln -sf /etc/nginx/sites-available/yala.vn.conf /etc/nginx/sites-enabled/yala.vn.conf
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  # 3) Xin chứng chỉ (1 chứng chỉ cho cả 3 tên miền)
  args=(); for d in "${DOMAINS[@]}"; do args+=(-d "$d"); done
  certbot certonly --webroot -w /var/www/certbot "${args[@]}" \
    --email "$EMAIL" --agree-tos --no-eff-email --non-interactive $STAGING
fi

# 4) Cấu hình Nginx chính thức (HTTPS, www -> apex, admin)
install -m 644 deploy/nginx/yala.vn.conf /etc/nginx/sites-available/yala.vn.conf
ln -sf /etc/nginx/sites-available/yala.vn.conf /etc/nginx/sites-enabled/yala.vn.conf
nginx -t || die "Cấu hình Nginx lỗi – đã giữ nguyên cấu hình đang chạy"
systemctl reload nginx

# 5) Tự gia hạn: certbot đã cài systemd timer; thêm hook nạp lại Nginx sau khi gia hạn
install -d /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/bin/sh
systemctl reload nginx
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
systemctl list-timers | grep -q certbot || (crontab -l 2>/dev/null; echo "17 3 * * * certbot renew --quiet") | crontab -
certbot renew --dry-run && log "✓ Gia hạn tự động hoạt động"
log "✓ SSL xong: https://yala.vn  ·  https://admin.yala.vn"
