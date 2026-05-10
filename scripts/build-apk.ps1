$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Missing required command: $name" }
}

Assert-Command "node"
Assert-Command "npm"

# Prefer token-based auth for CI; local dev can rely on `eas login`.
$hasToken = ($env:EXPO_TOKEN -and $env:EXPO_TOKEN.Trim().Length -gt 0)
if (-not $hasToken) {
  Write-Host "EXPO_TOKEN not set. If this is CI, set EXPO_TOKEN. If local, run: npx eas-cli login" -ForegroundColor Yellow
}

Set-Location (Split-Path -Parent $PSCommandPath)
Set-Location ".."

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm ci

Write-Host "Starting EAS build (Android APK, profile: preview)..." -ForegroundColor Cyan
npx eas-cli build -p android --profile preview

