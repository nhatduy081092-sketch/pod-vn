#!/usr/bin/env bash
# Tạo ảnh thật (AI) cho sản phẩm còn ảnh vẽ 2D rồi gắn luôn vào sản phẩm – chạy trong container API.
#   bash deploy/ai-photos.sh            # tạo + gắn (tốn ~0,034 USD/ảnh với model Lite)
#   bash deploy/ai-photos.sh --dry      # xem danh sách, không tốn tiền
#   bash deploy/ai-photos.sh --style=model | --style=flatlay | --keep-2d
source "$(dirname "$0")/lib.sh"
[ -n "$(env_get GEMINI_API_KEY)" ] || [[ " $* " == *" --dry "* ]] || die "Chưa có GEMINI_API_KEY trong .env.production – thêm dòng: GEMINI_API_KEY=\"…\" rồi chạy: bash deploy/deploy.sh --force"
compose ps --status running api | grep -q api || die "Container API chưa chạy – chạy bash deploy/deploy.sh trước"
compose exec -T api node --import tsx src/scripts/ai-photos.ts "$@"
