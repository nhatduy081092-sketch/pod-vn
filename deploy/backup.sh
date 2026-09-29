#!/usr/bin/env bash
# Sao lưu database + ảnh upload vào ./backups (chạy trước mỗi lần deploy, và hằng ngày qua cron)
#   bash deploy/backup.sh
source "$(dirname "$0")/lib.sh"

TS="$(date +%Y%m%d-%H%M%S)"
KEEP="$(env_get BACKUP_KEEP_DAYS)"; KEEP="${KEEP:-14}"
require_env DATABASE_URL

# 1) Database (định dạng custom -Fc: nén sẵn, khôi phục bằng deploy/restore.sh)
DB_FILE="backups/db-$TS.dump"
if uses_localdb; then
  log "Sao lưu Postgres nội bộ -> $DB_FILE"
  compose --profile localdb exec -T db pg_dump -U yala -d yala -Fc --no-owner --no-privileges > "$DB_FILE"
else
  log "Sao lưu database (pg_dump qua Docker) -> $DB_FILE"
  # URL truyền qua biến môi trường (không lộ trong danh sách tiến trình)
  DATABASE_URL="$(env_get DATABASE_URL)" docker run --rm -e DATABASE_URL postgres:17-alpine \
    sh -c 'u=$(echo "$DATABASE_URL" | sed -E "s/([?&])schema=[^&]*&?/\1/; s/[?&]\$//"); pg_dump "$u" -Fc --no-owner --no-privileges' > "$DB_FILE"
fi
[ -s "$DB_FILE" ] || die "File sao lưu database rỗng – kiểm tra DATABASE_URL"
chmod 600 "$DB_FILE"

# 2) Ảnh upload (Docker volume) – bỏ qua nếu dùng R2 và volume trống
if docker volume inspect yala_uploads >/dev/null 2>&1; then
  UP_FILE="backups/uploads-$TS.tgz"
  docker run --rm -v yala_uploads:/data:ro -v "$ROOT/backups":/backup alpine:3.20 \
    tar czf "/backup/uploads-$TS.tgz" -C /data . 2>/dev/null || true
  [ -f "$UP_FILE" ] && log "Sao lưu ảnh upload -> $UP_FILE ($(du -h "$UP_FILE" | cut -f1))"
fi

# 3) Xoá bản cũ
find "$ROOT/backups" -type f \( -name 'db-*.dump' -o -name 'uploads-*.tgz' \) -mtime +"$KEEP" -delete
log "✓ Sao lưu xong ($(du -h "$DB_FILE" | cut -f1)), giữ $KEEP ngày"
echo "$DB_FILE"
