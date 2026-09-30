#!/usr/bin/env bash
# Sao lưu tự động hằng ngày 02:30 (giờ VPS) + dọn log Docker cũ
source "$(dirname "$0")/lib.sh"
LINE="30 2 * * * cd $ROOT && bash deploy/backup.sh >> logs/backup.log 2>&1"
{ crontab -l 2>/dev/null | grep -vF "deploy/backup.sh" || true; echo "$LINE"; } | crontab -
log "✓ Đã hẹn sao lưu hằng ngày: $LINE"
