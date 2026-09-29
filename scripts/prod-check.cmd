@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
title YALA prod-check
echo Kiem tra production build (khoang 5-10 phut). Dev server se duoc tat tam thoi.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0prod-check.ps1"
pause
