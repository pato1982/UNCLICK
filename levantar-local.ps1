# Levanta el ambiente de desarrollo local de UNCLICK de una sola vez.
# Uso:  doble clic en levantar-local.cmd   ó   pwsh -File levantar-local.ps1
# Hace: arranca Docker Desktop (si hace falta) -> contenedor MySQL -> backend (:3002) -> frontend (:5173)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host "== UNCLICK :: levantar ambiente local ==" -ForegroundColor Cyan

# 1) Docker Desktop
function Test-Docker { try { docker info --format '{{.ServerVersion}}' *> $null; return $LASTEXITCODE -eq 0 } catch { return $false } }
if (-not (Test-Docker)) {
  Write-Host "Docker no responde, arrancando Docker Desktop..." -ForegroundColor Yellow
  $ddp = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $ddp) { Start-Process -FilePath $ddp | Out-Null }
  for ($i = 0; $i -lt 40; $i++) {
    if (Test-Docker) { break }
    Start-Sleep -Seconds 5
  }
  if (-not (Test-Docker)) { Write-Host "ERROR: Docker no arranco a tiempo." -ForegroundColor Red; pause; exit 1 }
}
Write-Host "Docker OK" -ForegroundColor Green

# 2) Contenedor MySQL
Push-Location $root
docker compose up -d | Out-Null
for ($i = 0; $i -lt 20; $i++) {
  $s = (docker inspect -f '{{.State.Health.Status}}' unclick-mysql 2>$null)
  if ($s -eq 'healthy') { break }
  Start-Sleep -Seconds 3
}
Write-Host "MySQL (unclick-mysql) healthy en 127.0.0.1:3309" -ForegroundColor Green
Pop-Location

# 3) Liberar puertos si quedaron ocupados
foreach ($p in 3002, 5173) {
  Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction Stop } catch {} }
}

# 4) Backend y frontend en ventanas propias (persisten al cerrar esta consola)
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$root\backend`" && npm run dev"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$root`" && npm run dev"

Write-Host ""
Write-Host "Listo. Backend -> http://localhost:3002   Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host "Login QA: cualquier email @qa.dev / password Dev1234!" -ForegroundColor Green
Start-Sleep -Seconds 2
