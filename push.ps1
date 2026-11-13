# LOCI > GitHub : first push
# Run from PowerShell inside the folder that contains package.json:
#   .\push.ps1
# If PowerShell blocks the script, run once:
#   Set-ExecutionPolicy -Scope Process -Bypass

$ErrorActionPreference = "Stop"
$repo = "https://github.com/matricphase-dot/loci.git"

if (-not (Test-Path "package.json")) {
  Write-Host "ERROR: package.json not found. cd into the folder that contains it first." -ForegroundColor Red
  exit 1
}
if (-not (Test-Path ".github\workflows\deploy.yml")) {
  Write-Host "ERROR: .github\workflows\deploy.yml missing - you're in the wrong folder, or an old zip." -ForegroundColor Red
  exit 1
}

git --version | Out-Null
git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { git init | Out-Null }

# git needs an identity before it will commit
if (-not (git config user.email)) { git config user.email "matricphase-dot@users.noreply.github.com" }
if (-not (git config user.name))  { git config user.name  "matricphase-dot" }

git add -A
git commit -m "LOCI - a memory palace for your real room" 2>$null
git branch -M main

git remote remove origin 2>$null
git remote add origin $repo

Write-Host "`nPushing to $repo ..." -ForegroundColor Cyan
git push -u origin main

Write-Host "`nDONE. Now, once:" -ForegroundColor Green
Write-Host "  Repo > Settings > Pages > Source = GitHub Actions"
Write-Host "  Live at: https://matricphase-dot.github.io/loci/"
