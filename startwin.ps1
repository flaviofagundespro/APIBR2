# APIBR2 - Script Unificado para Iniciar Todo o Sistema
# Inicia Backend, Python Services e Frontend em um unico comando

Write-Host "========================================" -ForegroundColor Green
Write-Host "   APIBR2 - Iniciando Sistema Completo" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Backend Node.js
Write-Host "[1/5] Iniciando Backend Node.js (porta 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal

Write-Host "[2/5] Aguardando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 2: Python AI Server
Write-Host "[3/5] Iniciando Servidor Python IA (porta 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\integrations'; python ultra_optimized_server.py" -WindowStyle Normal

Write-Host "[4/5] Aguardando 2 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Step 3: Instagram/TikTok/YouTube Downloader
Write-Host "[5/5] Iniciando Video Downloader (porta 5002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\integrations'; python instagram_server.py" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Servicos iniciados com sucesso!" -ForegroundColor Green
Write-Host "    Backend:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "    Python IA: http://localhost:5001" -ForegroundColor Cyan
Write-Host "    Downloader: http://localhost:5002" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 4: Frontend
Write-Host "Iniciando Frontend React (porta 5173)..." -ForegroundColor Yellow

# Check if node_modules exists before starting
Set-Location frontend
if (!(Test-Path "node_modules")) {
    Write-Host "Instalando dependencias do frontend (primeira execucao)..." -ForegroundColor Yellow
    npm install
}
Set-Location ..

# Start frontend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Sistema Completo Iniciado!" -ForegroundColor Green
Write-Host "    Backend:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "    Python IA: http://localhost:5001" -ForegroundColor Cyan
Write-Host "    Downloader: http://localhost:5002" -ForegroundColor Cyan
Write-Host "    Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Todos os servicos estao rodando em janelas separadas." -ForegroundColor Green
Write-Host "Para parar tudo, execute: .\stop_apibr2.ps1" -ForegroundColor Yellow
Write-Host ""

