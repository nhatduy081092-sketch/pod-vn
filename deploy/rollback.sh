#!/usr/bin/env bash
# Quay về bản trước (image cũ vẫn còn trên VPS). Database KHÔNG tự lùi – nếu cần dùng restore.sh.
#   bash deploy/rollback.sh          -> bản liền trước
#   bash deploy/rollback.sh <tag>    -> bản chỉ định (xem .deploy/history)
source "$(dirname "$0")/lib.sh"

CUR="$(cat .deploy/current_tag 2>/dev/null || true)"
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  TARGET="$(grep -v "^${CUR}\$" .deploy/history 2>/dev/null | tail -1 || true)"
fi
[ -n "$TARGET" ] || die "Không có bản trước để quay về (.deploy/history trống)"
for s in api web cms; do docker image inspect "yala-$s:$TARGET" >/dev/null 2>&1 || die "Không còn image yala-$s:$TARGET"; done

log "Rollback $CUR -> $TARGET"
TAG="$TARGET" compose $(compose_profiles) up -d --no-build api web cms
if wait_healthy; then
  echo "$TARGET" > .deploy/current_tag
  log "✓ Đã quay về $TARGET"
else
  die "Bản $TARGET cũng không khoẻ – xem logs: docker compose -f docker-compose.production.yml logs --tail=200"
fi
