#!/usr/bin/env bash
# Dọn chi tiết nguồn khách (utm) của đơn cũ hơn 90 ngày – chạy trong container API.
#   bash deploy/prune-sources.sh            # chạy thử: chỉ đếm
#   bash deploy/prune-sources.sh --apply    # dọn thật (nên chạy sau bash deploy/backup.sh)
# Hẹn chạy hằng ngày (chỉ sau khi chủ shop đồng ý), 03:10 giờ VPS:
#   ( crontab -l; echo "10 3 * * * cd $PWD && bash deploy/prune-sources.sh --apply >> logs/prune-sources.log 2>&1" ) | crontab -
source "$(dirname "$0")/lib.sh"
compose ps --status running api | grep -q api || die "Container API chưa chạy – chạy bash deploy/deploy.sh trước"
compose exec -T api node --import tsx src/scripts/prune-sources.ts "$@"
