#!/usr/bin/env bash
# ============================================================
# Deploy YALA lên VPS:  git pull → backup → (tải image từ GHCR | build) → migrate → start → health check → (rollback nếu lỗi)
#   bash deploy/deploy.sh                 # deploy bản mới nhất của nhánh hiện tại
#   bash deploy/deploy.sh --no-pull       # dùng mã nguồn đang có
#   bash deploy/deploy.sh --build         # build ngay trên VPS (bỏ qua image GitHub Actions)
#   bash deploy/deploy.sh --force         # chạy lại dù bản đó đang chạy
# Có IMAGE_REGISTRY trong .env.production (VD ghcr.io/nhatduy081092-sketch) -> tải image GitHub Actions đã build,
# VPS không phải build (nhanh, không cần nhiều ổ đĩa). Không có -> build trên VPS như cũ.
#   bash deploy/deploy.sh --seed          # lần đầu: tạo admin + dữ liệu mẫu (idempotent)
#   bash deploy/deploy.sh --skip-backup   # KHÔNG khuyến khích
# ============================================================
# Cả thân script nằm trong { … } -> bash đọc hết trước khi chạy, `git pull` sửa file này giữa chừng không làm hỏng lần chạy
{
source "$(dirname "$0")/lib.sh"

ARGS=("$@")
PULL=1; SEED=0; BACKUP=1; LOCAL_BUILD=0; FORCE=0
for a in "$@"; do
  case "$a" in
    --no-pull) PULL=0 ;;
    --seed) SEED=1 ;;
    --skip-backup) BACKUP=0 ;;
    --build) LOCAL_BUILD=1 ;;
    --force) FORCE=1 ;;
    *) die "Tham số không hợp lệ: $a" ;;
  esac
done

command -v docker >/dev/null || die "Chưa cài Docker – chạy deploy/setup-vps.sh"
require_env DATABASE_URL JWT_SECRET REVALIDATE_SECRET NEXT_PUBLIC_SITE_URL
exec 9>"$ROOT/.deploy/lock"; flock -n 9 || die "Đang có 1 lần deploy khác chạy"

# 1) Mã nguồn (script deploy đổi sau khi pull -> chạy lại bằng bản mới)
if [ "$PULL" = 1 ]; then
  log "git pull"
  before="$(cat deploy/deploy.sh deploy/lib.sh | sha1sum)"
  git fetch --prune
  git pull --ff-only
  if [ "$(cat deploy/deploy.sh deploy/lib.sh | sha1sum)" != "$before" ]; then
    log "Script deploy vừa cập nhật – chạy lại bằng bản mới"
    exec 9>&-
    exec bash deploy/deploy.sh --no-pull "${ARGS[@]}"
  fi
fi

REGISTRY="$(env_get IMAGE_REGISTRY)"
REGISTRY="${REGISTRY%/}"
if [ -n "$REGISTRY" ] && [ "$LOCAL_BUILD" = 0 ]; then
  # Tag = commit cuối cùng có đổi mã cần build (khớp paths-ignore trong .github/workflows/images.yml)
  NEW_TAG="$(git log -1 --format=%h --abbrev=7 -- . ':(exclude)*.md' ':(exclude)docs' ':(exclude)deploy')"
  MODE=pull
else
  NEW_TAG="$(git rev-parse --short=7 HEAD)"
  MODE=build
fi
PREV_TAG="$(cat .deploy/current_tag 2>/dev/null || true)"
if [ "$NEW_TAG" = "$PREV_TAG" ] && [ "$FORCE" = 0 ] && [ "$SEED" = 0 ]; then
  log "✓ Bản $NEW_TAG đang chạy – không có gì mới để deploy (thêm --force để chạy lại)"
  exit 0
fi
log "Deploy $NEW_TAG (đang chạy: ${PREV_TAG:-chưa có}, cách lấy image: $([ "$MODE" = pull ] && echo "tải từ $REGISTRY" || echo "build trên VPS"))"
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

# 4) Lấy image mới – container đang chạy không bị ảnh hưởng
free_gb() { df -P -BG "$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || echo /)" | awk 'NR==2{gsub("G","",$4); print $4}'; }
# Dọn khi thiếu chỗ: image YALA cũ (giữ bản đang chạy), cache build, log journal – không đụng container đang chạy
free_space() {
  local want="$1" s
  [ "$(free_gb)" -ge "$want" ] && return 0
  log "Ổ đĩa còn $(free_gb)GB – dọn image YALA cũ (giữ bản đang chạy ${PREV_TAG:-?}) + cache build"
  for s in api web cms; do
    docker images "yala-$s" --format '{{.Tag}}' | grep -vxF "${PREV_TAG:-__none__}" | xargs -r -I{} docker rmi "yala-$s:{}" >/dev/null 2>&1 || true
  done
  docker builder prune -af >/dev/null 2>&1 || true
  docker image prune -f >/dev/null 2>&1 || true
  journalctl --vacuum-size=200M >/dev/null 2>&1 || true
  log "Sau khi dọn: còn $(free_gb)GB"
}

if [ "$MODE" = pull ]; then
  # Image GitHub Actions: ~1.5GB tải về lần đầu, các lần sau chỉ tải tầng thay đổi
  free_space 5
  [ "$(free_gb)" -ge 3 ] || die "Ổ đĩa chỉ còn $(free_gb)GB (cần ≥ 3GB để tải image) – xem: df -h ; du -xh / --max-depth=2 | sort -rh | head -20"
  log "Tải image $NEW_TAG từ $REGISTRY"
  ok=0
  for i in $(seq 1 45); do
    ok=1
    for s in api web cms; do
      if ! out="$(docker pull -q "$REGISTRY/yala-$s:$NEW_TAG" 2>&1)"; then
        ok=0
        if grep -qiE "denied|unauthorized" <<<"$out"; then
          die "GHCR từ chối tải $REGISTRY/yala-$s – đặt package Public (GitHub → Packages → yala-$s → Package settings → Change visibility) hoặc chạy: docker login ghcr.io"
        fi
        break
      fi
    done
    [ "$ok" = 1 ] && break
    [ "$i" = 1 ] && log "Chưa có image $NEW_TAG – GitHub Actions có thể đang build, chờ tối đa 15 phút… (xem tab Actions trên GitHub)"
    sleep 20
  done
  [ "$ok" = 1 ] || die "Không tải được image $NEW_TAG sau 15 phút – kiểm tra tab Actions trên GitHub (build lỗi?). Tạm thời có thể chạy: bash deploy/deploy.sh --build"
  for s in api web cms; do
    docker tag "$REGISTRY/yala-$s:$NEW_TAG" "yala-$s:$NEW_TAG"
    docker rmi "$REGISTRY/yala-$s:$NEW_TAG" >/dev/null 2>&1 || true
  done
  log "✓ Đã tải image $NEW_TAG"
else
  # build web + cms trên VPS dùng ~5GB tạm (4GB từng hết chỗ giữa chừng)
  free_space 8
  [ "$(free_gb)" -ge 6 ] || die "Ổ đĩa chỉ còn $(free_gb)GB (cần ≥ 6GB để build) – xoá bớt file trên VPS hoặc dùng image GitHub Actions (IMAGE_REGISTRY). Xem: df -h"
  log "Build image $NEW_TAG trên VPS (5–10 phút)"
  TAG="$NEW_TAG" compose build api web cms 2>&1 | tee -a "$ROOT/logs/build-$NEW_TAG.log" >/dev/null \
    || die "Build lỗi – xem logs/build-$NEW_TAG.log (bản cũ vẫn chạy)"
fi

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

# 9) Dọn image cũ: giữ bản mới + bản liền trước để rollback (mỗi bộ ~1–1.5GB, ổ VPS nhỏ)
for s in api web cms; do
  docker images "yala-$s" --format '{{.Tag}}' | grep -vE "^(latest|$NEW_TAG)$" | grep -vxF -f <(tail -2 .deploy/history) | xargs -r -I{} docker rmi "yala-$s:{}" >/dev/null 2>&1 || true
done
docker image prune -f >/dev/null 2>&1 || true
# cache build cũ hơn 3 ngày (giữ cache mới để lần sau build nhanh)
docker builder prune -f --filter "until=72h" >/dev/null 2>&1 || true
[ "$MODE" = pull ] && docker builder prune -af >/dev/null 2>&1 || true

log "✓ Deploy $NEW_TAG thành công"
if curl -fsS --max-time 10 https://yala.vn/healthz >/dev/null 2>&1; then log "✓ https://yala.vn phản hồi"; else log "! https://yala.vn chưa phản hồi (DNS/SSL/Nginx?) – xem DEPLOY.md"; fi
exit 0
}
