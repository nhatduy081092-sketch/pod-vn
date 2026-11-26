# Tải bản sao lưu YALA từ VPS về máy Windows của chủ shop (bản sao thứ hai, ngoài VPS).
# Chỉ ĐỌC trên VPS (liệt kê + tải file trong /opt/yala/backups do deploy/backup.sh tạo lúc 02:30 và mỗi lần deploy).
#   powershell -NoProfile -ExecutionPolicy Bypass -File deploy\pull-backups.ps1 [-Dest D:\YALA-sao-luu]
# Hẹn giờ hằng ngày: xem DEPLOY.md mục "Bản sao lưu trên máy chủ shop".
# Có vấn đề (VPS ngừng sao lưu, không tải được quá 2 ngày) -> tạo file YALA-SAO-LUU-CAN-XEM.txt trên Desktop.
param(
  [string]$Dest = "D:\YALA-sao-luu",
  [string]$Server = "root@14.225.253.165",
  [string]$Key = "$HOME\.ssh\jes_vps",
  [int]$KeepDbDays = 60,
  [int]$KeepUploads = 3
)
$ErrorActionPreference = "Stop"
$Remote = "/opt/yala/backups"
$dbDir = Join-Path $Dest "db"
$upDir = Join-Path $Dest "uploads"
New-Item -ItemType Directory -Force $dbDir, $upDir | Out-Null
$logFile = Join-Path $Dest "tai-ve.log"
$okFile = Join-Path $Dest ".lan-cuoi-thanh-cong"
$alert = Join-Path ([Environment]::GetFolderPath("Desktop")) "YALA-SAO-LUU-CAN-XEM.txt"
function Write-Log([string]$m) { $line = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $m; Add-Content -Path $logFile -Value $line -Encoding UTF8; Write-Output $line }
function Set-Alert([string]$m) {
  Write-Log "CẦN XEM: $m"
  Set-Content -Path $alert -Encoding UTF8 -Value @(
    "YALA – sao lưu cần xem ($((Get-Date).ToString('dd/MM/yyyy HH:mm')))", "", $m, "",
    "Nhật ký: $logFile", "Bản sao lưu trên máy: $Dest",
    "File này tự xoá khi lần tải sau thành công và mọi thứ bình thường."
  )
}

# OpenSSH của Windows (có sẵn từ Windows 10) – BatchMode: không bao giờ hỏi mật khẩu
$sshOpts = @("-i", $Key, "-o", "BatchMode=yes", "-o", "ConnectTimeout=20", "-o", "ServerAliveInterval=15")
function Invoke-Remote([string]$cmd) {
  $out = & ssh.exe @sshOpts $Server $cmd
  if ($LASTEXITCODE -ne 0) { throw "ssh lỗi (mã $LASTEXITCODE) khi chạy: $cmd" }
  return $out
}
# Tải 1 file về thư mục đích: ghi ra .part rồi mới đổi tên (không để lại file dở dang mang tên thật)
function Get-RemoteFile([string]$name, [string]$dir) {
  Push-Location $dir
  try {
    # đường dẫn tương đối: scp hiểu nhầm "D:\..." là tên máy chủ "D"
    & scp.exe @sshOpts -q "${Server}:$Remote/$name" ".\$name.part"
    if ($LASTEXITCODE -ne 0) { throw "scp lỗi (mã $LASTEXITCODE) khi tải $name" }
  } finally { Pop-Location }
  return (Join-Path $dir "$name.part")
}

try {
  Get-ChildItem $dbDir, $upDir -Filter *.part -ErrorAction SilentlyContinue | Remove-Item -Force
  # tên|kích thước|giờ sửa (epoch) của mọi bản sao lưu trên VPS
  $rows = Invoke-Remote "cd $Remote && stat -c '%n|%s|%Y' db-*.dump uploads-*.tgz 2>/dev/null; true"
  $files = @($rows | Where-Object { $_ -match '^(db-\d{8}-\d{6}\.dump|uploads-\d{8}-\d{6}\.tgz)\|\d+\|\d+$' } | ForEach-Object {
      $p = $_.Split("|"); [pscustomobject]@{ Name = $p[0]; Size = [int64]$p[1]; Time = [DateTimeOffset]::FromUnixTimeSeconds([int64]$p[2]).LocalDateTime }
    })
  $dbs = @($files | Where-Object Name -like "db-*" | Sort-Object Name)
  if ($dbs.Count -eq 0) { throw "Không thấy bản sao lưu database nào trên VPS ($Remote)" }

  # 1) Database: tải mọi bản chưa có (hoặc khác kích thước), kiểm tra đủ dung lượng + đầu file pg_dump "PGDMP"
  $got = 0
  foreach ($f in $dbs) {
    $local = Join-Path $dbDir $f.Name
    if ((Test-Path $local) -and (Get-Item $local).Length -eq $f.Size) { continue }
    if ($f.Time -lt (Get-Date).AddDays(-$KeepDbDays)) { continue }
    $part = Get-RemoteFile $f.Name $dbDir
    $len = (Get-Item $part).Length
    $fs = [IO.File]::OpenRead($part); $head = New-Object byte[] 5; [void]$fs.Read($head, 0, 5); $fs.Close()
    if ($len -ne $f.Size -or [Text.Encoding]::ASCII.GetString($head) -ne "PGDMP") {
      Remove-Item $part -Force
      throw "File $($f.Name) tải về không khớp (được $len/$($f.Size) byte hoặc không phải bản pg_dump)"
    }
    Move-Item $part $local -Force
    $got++
  }

  # 2) Ảnh upload: chỉ tải bản mới nhất, và chỉ khi nội dung khác bản đã có (so sha256)
  $up = $files | Where-Object Name -like "uploads-*" | Sort-Object Name | Select-Object -Last 1
  $upNote = "không có"
  if ($up) {
    $sha = ((Invoke-Remote "sha256sum $Remote/$($up.Name)") -split '\s+')[0].ToLower()
    $shaFile = Join-Path $upDir ".sha256-moi-nhat"
    $last = if (Test-Path $shaFile) { (Get-Content $shaFile -Raw).Trim() } else { "" }
    if ($sha -ne $last -or -not (Get-ChildItem $upDir -Filter "uploads-*.tgz")) {
      $part = Get-RemoteFile $up.Name $upDir
      $localSha = (Get-FileHash $part -Algorithm SHA256).Hash.ToLower()
      if ($localSha -ne $sha) { Remove-Item $part -Force; throw "Ảnh upload $($up.Name) tải về sai sha256" }
      Move-Item $part (Join-Path $upDir $up.Name) -Force
      Set-Content $shaFile $sha -Encoding ASCII
      $upNote = "tải mới $($up.Name) ($([math]::Round($up.Size / 1MB, 1)) MB)"
    } else { $upNote = "không đổi" }
  }

  # 3) Dọn bản cũ trên máy (chỉ trong thư mục này): database quá $KeepDbDays ngày, ảnh giữ $KeepUploads bản
  Get-ChildItem $dbDir -Filter "db-*.dump" | Where-Object LastWriteTime -lt (Get-Date).AddDays(-$KeepDbDays) | Remove-Item -Force
  Get-ChildItem $upDir -Filter "uploads-*.tgz" | Sort-Object Name -Descending | Select-Object -Skip $KeepUploads | Remove-Item -Force

  $newest = $dbs[-1]
  Write-Log "OK: tải $got bản database, mới nhất trên VPS $($newest.Name) lúc $($newest.Time.ToString('dd/MM HH:mm')); ảnh upload $upNote"
  Set-Content $okFile (Get-Date).ToString("o") -Encoding ASCII

  # 4) VPS có còn sao lưu đều không (cron 02:30 hằng ngày)
  if ($newest.Time -lt (Get-Date).AddHours(-36)) {
    Set-Alert "Bản sao lưu mới nhất trên VPS là $($newest.Name) ($($newest.Time.ToString('dd/MM/yyyy HH:mm'))) – đã quá 36 giờ. Cron sao lưu trên VPS có thể đã ngừng: xem /opt/yala/logs/backup.log."
  } elseif (Test-Path $alert) { Remove-Item $alert -Force }
} catch {
  Write-Log "LỖI: $($_.Exception.Message)"
  # máy có thể vừa tắt/mất mạng: chỉ báo khi đã quá 2 ngày không tải được
  $lastOk = if (Test-Path $okFile) { [datetime](Get-Content $okFile -Raw).Trim() } else { [datetime]::MinValue }
  if ($lastOk -lt (Get-Date).AddDays(-2)) {
    Set-Alert "Không tải được bản sao lưu YALA về máy từ $(if ($lastOk -eq [datetime]::MinValue) { 'trước tới giờ' } else { $lastOk.ToString('dd/MM/yyyy HH:mm') }). Lỗi gần nhất: $($_.Exception.Message)"
  }
  exit 1
}
