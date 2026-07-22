# Start the DB Quest AI frontend (Vite dev server on http://localhost:5173)
$ErrorActionPreference = 'Stop'
Push-Location "$PSScriptRoot\frontend"
if (-not (Test-Path node_modules)) {
    Write-Host "Dependencies not installed. Running npm install..." -ForegroundColor Yellow
    npm install
}
Write-Host "Frontend running on http://localhost:5173" -ForegroundColor Cyan
npm run dev
Pop-Location
