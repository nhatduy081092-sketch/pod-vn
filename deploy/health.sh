#!/usr/bin/env bash
# Kiểm tra nhanh trạng thái production
source "$(dirname "$0")/lib.sh"
chk() { printf "%-40s " "$1"; if curl -fsS --max-time 8 "$1" -o /tmp/yala-h.json; then echo "OK $(head -c 160 /tmp/yala-h.json)"; else echo "LỖI"; fi; }
chk http://127.0.0.1:3180/healthz
chk http://127.0.0.1:3180/api/health
chk http://127.0.0.1:3181/healthz
chk https://yala.vn/healthz
chk https://yala.vn/api/health
chk https://admin.yala.vn/healthz
compose ps
echo "Bản đang chạy: $(cat .deploy/current_tag 2>/dev/null || echo '?')"
