# ============================================================
# YALA - kiem tra production build tren may Windows (khong deploy)
# Chay bang: scripts\prod-check.cmd   (log: logs\prod-check.log)
# ============================================================
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null
$log = "$root\logs\prod-check.log"
$sum = "$root\logs\prod-check-summary.txt"
"YALA prod-check $(Get-Date -Format s)" | Out-File -Encoding utf8 $log
"" | Out-File -Encoding utf8 $sum
$results = @()

function Step($name, [scriptblock]$cmd) {
  Write-Host "==> $name" -ForegroundColor Cyan
  "`n===== $name =====" | Out-File -Append -Encoding utf8 $log
  $t = Get-Date
  & $cmd 2>&1 | ForEach-Object { "$_" } | Tee-Object -FilePath $log -Append | Select-Object -Last 3 | ForEach-Object { Write-Host "    $_" }
  $code = $LASTEXITCODE
  $sec = [int]((Get-Date) - $t).TotalSeconds
  $status = if ($code -eq 0) { "PASS" } else { "FAIL($code)" }
  $line = "{0,-38} {1,-10} {2}s" -f $name, $status, $sec
  Write-Host "    $status" -ForegroundColor $(if ($code -eq 0) { "Green" } else { "Red" })
  $script:results += $line
  $line | Out-File -Append -Encoding utf8 $sum
}

Write-Host "Tat dev server (cong 3000/3001/4000/4999) de khong khoa file..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000,3001,4000,4999 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Step "node/pnpm version" { node -v; pnpm -v }
Step "pnpm install --frozen-lockfile" { pnpm install --frozen-lockfile }
Step "prisma validate" { pnpm --filter @pod/db exec prisma validate }
Step "prisma generate" { pnpm --filter @pod/db generate }
Step "prisma migrate status (chi doc)" { pnpm --filter @pod/db exec prisma migrate status }
Step "typecheck shared" { pnpm --filter @pod/shared typecheck }
Step "typecheck api" { pnpm --filter @pod/api typecheck }
Step "typecheck db" { pnpm --filter @pod/db typecheck }

# Build Next.js giong Docker: URL production, API KHONG chay (kiem tra build khong phu thuoc API)
$env:NEXT_PUBLIC_SITE_URL = "https://yala.vn"
$env:API_URL = "http://127.0.0.1:59999"
$env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:59999"
$env:NEXT_TELEMETRY_DISABLED = "1"
Step "next build web" { pnpm --filter @pod/web build }
Step "next build cms" { pnpm --filter @pod/cms build }
Remove-Item Env:API_URL, Env:NEXT_PUBLIC_API_URL, Env:NEXT_PUBLIC_SITE_URL -ErrorAction SilentlyContinue

# API chay che do production + health check (dung DATABASE_URL trong .env, chi SELECT 1)
Step "api production boot + /api/health" {
  $env:NODE_ENV = "production"; $env:API_PORT = "4999"
  $p = Start-Process -FilePath "node" -ArgumentList "--import","tsx","src/index.ts" -WorkingDirectory "$root\apps\api" -PassThru -NoNewWindow -RedirectStandardOutput "$root\logs\prod-check-api.out" -RedirectStandardError "$root\logs\prod-check-api.err"
  $ok = $false
  for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
    Start-Sleep -Seconds 1
    try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 "http://127.0.0.1:4999/api/health"; Write-Output $r.Content; $ok = ($r.StatusCode -eq 200) } catch { }
  }
  Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
  Remove-Item Env:NODE_ENV, Env:API_PORT -ErrorAction SilentlyContinue
  Get-Content "$root\logs\prod-check-api.err" -ErrorAction SilentlyContinue | Select-Object -Last 20
  if ($ok) { $global:LASTEXITCODE = 0 } else { $global:LASTEXITCODE = 1 }
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker -and $env:YALA_DOCKER_TEST -eq "1") {
  Step "docker compose config" { docker compose --env-file .env.production.example -f docker-compose.production.yml config --quiet }
  Step "docker build api/web/cms" { docker compose --env-file .env.production.example -f docker-compose.production.yml build api web cms }
}

"`n==== KET QUA ====" | Out-File -Append -Encoding utf8 $log
$results | Out-File -Append -Encoding utf8 $log
Write-Host "`n==== KET QUA ====" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
"DONE $(Get-Date -Format s)" | Out-File -Append -Encoding utf8 $sum
Write-Host "`nXong. Log: logs\prod-check.log  -  Chay lai start-dev.cmd de tiep tuc dev." -ForegroundColor Green
