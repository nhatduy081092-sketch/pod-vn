@echo off
chcp 65001 >nul
cd /d "%~dp0apps\api"
title POD-VN API debug
if not exist ..\..\logs mkdir ..\..\logs
echo Dang chay API - log ghi vao logs\api.log (Claude se tu doc)
call pnpm exec tsx src/index.ts > ..\..\logs\api.log 2>&1
echo API da dung. Ma thoat: %errorlevel%
pause
