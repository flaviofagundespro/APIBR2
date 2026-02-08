Write-Host "Verificando status do APIBR2..." -ForegroundColor Green
Write-Host ""

# Verificar Backend
Write-Host "Backend Node.js:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    Write-Host "  ✅ Rodando (Porta 3000)" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ Não está rodando" -ForegroundColor Red
    Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar Python
Write-Host "Servidor Python:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 5
    Write-Host "  ✅ Rodando (Porta 5001)" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ Não está rodando" -ForegroundColor Red
    Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Para iniciar os serviços:" -ForegroundColor Cyan
Write-Host "  ./start_apibr2.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Para executar testes:" -ForegroundColor Cyan
Write-Host "  cd integrations && ./test_ultra.ps1" -ForegroundColor White 