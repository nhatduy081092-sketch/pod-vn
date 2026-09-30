#!/usr/bin/env bash
# Hàm dùng chung cho các script deploy YALA (source file này, không chạy trực tiếp)
set -Eeuo pipefail
trap 'echo "✗ Lỗi ở dòng $LINENO: $BASH_COMMAND (script: ${BASH_SOURCE[0]})" >&2' ERR

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env.production"
COMPOSE_FILE="$ROOT/docker-compose.production.yml"
mkdir -p "$ROOT/logs" "$ROOT/backups" "$ROOT/.deploy"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$ROOT/logs/deploy.log" >&2; }
die() { log "✗ $*"; exit 1; }

# Đọc 1 biến trong .env.production (bỏ dấu ngoặc kép), không in ra màn hình
env_get() {
  [ -f "$ENV_FILE" ] || return 0
  { grep -E "^$1=" "$ENV_FILE" || true; } | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

require_env() {
  [ -f "$ENV_FILE" ] || die "Thiếu .env.production – chạy: cp .env.production.example .env.production rồi điền giá trị"
  local missing=()
  for v in "$@"; do
    local val
    val="$(env_get "$v")"
    if [ -z "$val" ] || [[ "$val" == *"<"* ]]; then missing+=("$v"); fi
  done
  [ ${#missing[@]} -eq 0 ] || die "Chưa điền trong .env.production: ${missing[*]}"
  local jwt
  jwt="$(env_get JWT_SECRET)"
  [ ${#jwt} -ge 32 ] || die "JWT_SECRET phải ≥ 32 ký tự (openssl rand -hex 48)"
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

uses_localdb() {
  [[ "$(env_get DATABASE_URL)" == *"@db:5432/"* ]]
}

compose_profiles() {
  if uses_localdb; then echo "--profile localdb"; fi
}

# Chờ web + api + cms khoẻ (tối đa ~2 phút)
wait_healthy() {
  local i
  for i in $(seq 1 40); do
    if curl -fsS --max-time 5 http://127.0.0.1:3180/healthz >/dev/null 2>&1 \
      && curl -fsS --max-time 5 http://127.0.0.1:3180/api/health >/dev/null 2>&1 \
      && curl -fsS --max-time 5 http://127.0.0.1:3181/healthz >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
  done
  return 1
}
