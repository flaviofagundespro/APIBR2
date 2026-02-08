Write-Host "========================================" -ForegroundColor Green
Write-Host "   APIBR2 - Iniciando Sistema Completo" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/4] Iniciando Backend Node.js..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

Write-Host "[2/4] Aguardando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[3/4] Iniciando Servidor Python IA..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd integrations; python ultra_optimized_server.py" -WindowStyle Normal

Write-Host "[4/4] Iniciando Instagram Downloader..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd integrations; python instagram_server.py" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "    Backend:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "    Python IA: http://localhost:5001" -ForegroundColor Cyan
Write-Host "    Instagram: http://localhost:5002" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$response = Read-Host "Executar testes agora? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host "Executando testes..." -ForegroundColor Yellow
    Set-Location integrations
    .\test_ultra.ps1
}