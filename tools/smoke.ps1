# STUDINNO smoke test - headless render check for all pages + key modals.
# Usage: npm run smoke   (or: powershell -File tools/smoke.ps1)
# Prereq: run "npm run build" first so dist/* exist.
$root = Split-Path $PSScriptRoot -Parent
$port = 8191
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { Write-Output "Edge not found: $edge"; exit 2 }

$srv = Start-Process -FilePath "node" `
  -ArgumentList "$root\node_modules\http-server\bin\http-server", $root, "-p", $port, "-c-1" `
  -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2
$code = 1
$domFile = Join-Path $env:TEMP "studinno_smoke_dom.html"
$errFile = Join-Path $env:TEMP "studinno_smoke_err.txt"
$udd = Join-Path $env:TEMP "studinno_smoke"
Remove-Item $udd -Recurse -Force -ErrorAction SilentlyContinue  # 프로필 잠금 방지
try {
  Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new", "--disable-gpu", "--no-first-run", "--virtual-time-budget=6000",
    "--user-data-dir=$udd", "--dump-dom", "http://localhost:$port/tools/smoke.html"
  ) -RedirectStandardOutput $domFile -RedirectStandardError $errFile -NoNewWindow -Wait
  Start-Sleep -Milliseconds 300
  $dom = ""
  if (Test-Path $domFile) {
    $raw = Get-Content $domFile -Raw
    if ($null -ne $raw) { $dom = $raw }
  }
  if ($dom -match "SMOKE: ALL PASS") {
    Write-Output "SMOKE: ALL PASS"
    $code = 0
  } else {
    $m = [regex]::Match($dom, "SMOKE: FAILS=\d+")
    if ($m.Success) { Write-Output $m.Value } else { Write-Output "SMOKE: result not found" }
    foreach ($f in [regex]::Matches($dom, "FAIL [^\n<]+")) { Write-Output $f.Value }
    $code = 1
  }
} finally {
  Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue
}
exit $code
