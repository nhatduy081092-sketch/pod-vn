#!/usr/bin/env bash
# ============================================================
# Deploy YALA lên VPS:  git pull → backup → build → migrate → start → health check → (rollback nếu lỗi)
#   bash deploy/deploy.sh                 # deploy bản mới nhất của nhánh hiện tại
#   bash deploy/deploy.sh --no-pull       # dùng mã nguồn đang có
#   bash deploy/deploy.sh --seed          # lần đầu: tạo admin + dữ liệu mẫu (idempotent)
#   bash deploy/deploy.sh --skip-backup   # KHÔNG khuyến khích
# ============================================================
source "$(dirname "$0")/lib.sh"

PULL=1; SEED=0; BACKUP=1
for a in "$@"; do
  case "$a" in
    --no-pull) PULL=0 ;;
    --seed) SEED=1 ;;
    --skip-backup) BACKUP=0 ;;
    *) die "Tham số không hợp lệ: $a" ;;
  esac
done

command -v docker >/dev/null || die "Chưa cài Docker – chạy deploy/setup-vps.sh"
require_env DATABASE_URL JWT_SECRET REVALIDATE_SECRET NEXT_PUBLIC_SITE_URL
exec 9>"$ROOT/.deploy/lock"; flock -n 9 || die "Đang có 1 lần deploy khác chạy"

# 1) Mã nguồn
if [ "$PULL" = 1 ]; then
  log "git pull"
  git fetch --prune
  git pull --ff-only
fi
NEW_TAG="$(git rev-parse --short HEAD)"
PREV_TAG="$(cat .deploy/current_tag 2>/dev/null || true)"
log "Deploy $NEW_TAG (đang chạy: ${PREV_TAG:-chưa có})"
PROFILES="$(compose_profiles)"

# 2) Database nội bộ (nếu dùng) phải chạy trước để backup/migrate
if uses_localdb; then
  compose --profile localdb up -d db
  for i in $(seq 1 30); do compose --profile localdb exec -T db pg_isready -U yala -d yala >/dev/null 2>&1 && break; sleep 2; done
fi

# 3) Sao lưu trước khi đổi schema
if [ "$BACKUP" = 1 ] && [ -n "$PREV_TAG" ]; then
  bash "$ROOT/deploy/backup.sh" >/dev/null || die "Sao lưu thất bại – dừng deploy (dữ liệu an toàn, bản cũ vẫn chạy)"
fi

# 4) Build image mới – container đang chạy không bị ảnh hưởng
# Ổ đĩa: build Next.js cần ~4GB trống; thiếu thì dọn cache build + image thừa (không đụng container đang chạy)
free_gb() { df -P -BG "$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || echo /)" | awk 'NR==2{gsub("G","",$4); print $4}'; }
if [ "$(free_gb)" -lt 6 ]; then
  log "Ổ đĩa còn $(free_gb)GB – dọn cache build Docker + image thừa"
  docker builder prune -af >/dev/null 2>&1 || true
  docker image prune -f >/dev/null 2>&1 || true
  journalctl --vacuum-size=200M >/dev/null 2>&1 || true
  log "Sau khi dọn: còn $(free_gb)GB"
fi
[ "$(free_gb)" -ge 4 ] || die "Ổ đĩa chỉ còn $(free_gb)GB (cần ≥ 4GB để build) – xoá bớt file/log/web cũ trên VPS rồi chạy lại. Xem: df -h ; docker system df"
log "Build image $NEW_TAG (lần đầu có thể mất 5–10 phút)"
TAG="$NEW_TAG" compose build api web cms 2>&1 | tee -a "$ROOT/logs/build-$NEW_TAG.log" >/dev/null \
  || die "Build lỗi – xem logs/build-$NEW_TAG.log (bản cũ vẫn chạy)"

# 5) Migration an toàn (prisma migrate deploy – không bao giờ reset dữ liệu)
log "Prisma migrate deploy"
TAG="$NEW_TAG" compose $PROFILES --profile tools run --rm migrate || die "Migration lỗi – bản cũ vẫn chạy. Xem log ở trên"

if [ "$SEED" = 1 ]; then
  require_env ADMIN_EMAIL ADMIN_PASSWORD
  log "Seed dữ liệu lần đầu"
  TAG="$NEW_TAG" compose $PROFILES --profile tools run --rm seed || die "Seed lỗi"
fi

# 6) Chạy bản mới
log "Khởi động bản $NEW_TAG"
TAG="$NEW_TAG" compose $PROFILES up -d --no-build --remove-orphans api web cms

# 7) Kiểm tra sức khoẻ – lỗi thì quay về bản cũ
if ! wait_healthy; then
  log "✗ Bản $NEW_TAG không khoẻ"
  TAG="$NEW_TAG" compose logs --tail=80 api web cms >> "$ROOT/logs/deploy.log" 2>&1 || true
  if [ -n "$PREV_TAG" ]; then
    log "↩ Quay về $PREV_TAG"
    TAG="$PREV_TAG" compose $PROFILES up -d --no-build api web cms
    wait_healthy && log "✓ Đã quay về $PREV_TAG" || log "✗ Bản cũ cũng lỗi – kiểm tra database/.env.production"
  fi
  die "Deploy thất bại (chi tiết: logs/deploy.log)"
fi

echo "$NEW_TAG" > .deploy/current_tag
echo "$NEW_TAG" >> .deploy/history

# 8) Làm mới nội dung (trang build sẵn lúc chưa có API)
curl -fsS -X POST -H "x-revalidate-secret: $(env_get REVALIDATE_SECRET)" http://127.0.0.1:3180/revalidate >/dev/null 2>&1 || true

# 9) Dọn image cũ: giữ 3 bản gần nhất để rollback
for s in api web cms; do
  docker images "yala-$s" --format '{{.Tag}}' | grep -vE "^(latest|$NEW_TAG)$" | grep -vxF -f <(tail -3 .deploy/history) | xargs -r -I{} docker rmi "yala-$s:{}" >/dev/null 2>&1 || true
done
docker image prune -f >/dev/null 2>&1 || true
# cache build cũ hơn 3 ngày (giữ cache mới để lần sau build nhanh)
docker builder prune -f --filter "until=72h" >/dev/null 2>&1 || true

log "✓ Deploy $NEW_TAG thành công"
if curl -fsS --max-time 10 https://yala.vn/healthz >/dev/null 2>&1; then log "✓ https://yala.vn phản hồi"; else log "! https://yala.vn chưa phản hồi (DNS/SSL/Nginx?) – xem DEPLOY.md"; fi
