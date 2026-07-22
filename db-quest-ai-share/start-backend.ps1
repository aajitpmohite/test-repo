# Start the DB Quest AI backend (FastAPI on http://localhost:8000)
$ErrorActionPreference = 'Stop'
Push-Location "$PSScriptRoot\backend"
if (-not (Test-Path .venv)) {
    Write-Host "Virtual environment not found. Run ./setup.ps1 first." -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "Backend running on http://localhost:8000  (docs at /docs)" -ForegroundColor Cyan
& .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
Pop-Location
