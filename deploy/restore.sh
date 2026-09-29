#!/usr/bin/env bash
# KHÔI PHỤC database từ bản sao lưu (GHI ĐÈ dữ liệu hiện tại – chỉ dùng khi thật sự cần)
#   bash deploy/restore.sh backups/db-YYYYmmdd-HHMMSS.dump [backups/uploads-....tgz]
source "$(dirname "$0")/lib.sh"

DB_FILE="${1:-}"
UP_FILE="${2:-}"
[ -f "$DB_FILE" ] || die "Cách dùng: bash deploy/restore.sh backups/db-....dump [backups/uploads-....tgz]"
require_env DATABASE_URL

echo "⚠️  Sẽ GHI ĐÈ database bằng $DB_FILE${UP_FILE:+ và ảnh bằng $UP_FILE}."
read -r -p "Gõ KHOI PHUC để tiếp tục: " ok
[ "$ok" = "KHOI PHUC" ] || die "Đã huỷ"

# Sao lưu trạng thái hiện tại trước khi ghi đè
bash "$ROOT/deploy/backup.sh" >/dev/null || die "Không sao lưu được trạng thái hiện tại – dừng"

log "Tạm dừng web/cms/api"
compose stop web cms api || true

if uses_localdb; then
  compose --profile localdb exec -T db pg_restore -U yala -d yala --clean --if-exists --no-owner --no-privileges < "$DB_FILE"
else
  DATABASE_URL="$(env_get DATABASE_URL)" docker run --rm -i -e DATABASE_URL postgres:17-alpine \
    sh -c 'u=$(echo "$DATABASE_URL" | sed -E "s/([?&])schema=[^&]*&?/\1/; s/[?&]\$//"); pg_restore -d "$u" --clean --if-exists --no-owner --no-privileges' < "$DB_FILE"
fi
log "✓ Đã khôi phục database từ $DB_FILE"

if [ -n "$UP_FILE" ]; then
  [ -f "$UP_FILE" ] || die "Không thấy $UP_FILE"
  docker run --rm -v yala_uploads:/data -v "$ROOT/$(dirname "$UP_FILE")":/backup alpine:3.20 \
    sh -c "tar xzf /backup/$(basename "$UP_FILE") -C /data && chown -R 1000:1000 /data"
  log "✓ Đã khôi phục ảnh upload từ $UP_FILE"
fi

TAG="$(cat .deploy/current_tag 2>/dev/null || echo latest)" compose $(compose_profiles) up -d api web cms
wait_healthy && log "✓ Hệ thống chạy lại bình thường" || die "Chưa khoẻ – xem: docker compose -f docker-compose.production.yml logs --tail=200"
