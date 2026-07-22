# DB Quest AI — one-time setup (Windows PowerShell)
# Creates the Python virtual environment, installs backend + frontend dependencies.
$ErrorActionPreference = 'Stop'

Write-Host "`n=== DB Quest AI setup ===" -ForegroundColor Cyan

# ---- Backend -------------------------------------------------------------
Write-Host "`n[1/2] Backend (Python)..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\backend"
if (-not (Test-Path .venv)) {
    python -m venv .venv
}
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created backend/.env (demo mode). Edit it to enable live AI." -ForegroundColor DarkGray
}
Pop-Location

# ---- Frontend ------------------------------------------------------------
Write-Host "`n[2/2] Frontend (Node)..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\frontend"
npm install
Pop-Location

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "Start the backend:  ./start-backend.ps1" -ForegroundColor Green
Write-Host "Start the frontend: ./start-frontend.ps1" -ForegroundColor Green
