@echo off
cd /d "%~dp0"

powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/k npm run dev' -WindowStyle Normal }"

timeout /t 3 /nobreak >nul
start "" http://localhost:5173
