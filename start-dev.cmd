@echo off
chcp 65001 >nul
cd /d "%~dp0"
title POD-VN dev server
if not exist logs mkdir logs
echo [1/3] Tat server cu tren cong 3000 / 3001 / 4000 (neu con chay)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000,3001,4000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [2/3] Cap nhat database (migrate) + nap du lieu mau...
call pnpm --filter @pod/db run migrate:deploy > logs\migrate.log 2>&1
call pnpm db:generate >> logs\migrate.log 2>&1
type logs\migrate.log
call pnpm db:seed > logs\seed.log 2>&1
type logs\seed.log
echo [3/3] Khoi dong web (3000) + cms (3001) + api (4000). Log: logs\dev.log
echo      De tat server: dong cua so nay.
powershell -NoProfile -ExecutionPolicy Bypass -Command "pnpm dev 2>&1 | Tee-Object -FilePath logs\dev.log"
pause
