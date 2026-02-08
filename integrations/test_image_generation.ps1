# Teste de Geracao de Imagem - APIBR2
Write-Host "Teste de Geracao de Imagem" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Testar servidor Python
Write-Host "`n1. Testando servidor Python..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET
    Write-Host "✓ Servidor Python esta rodando" -ForegroundColor Green
    Write-Host "Status: $($health.status)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Servidor Python nao esta rodando" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Testar geracao de imagem
Write-Host "`n2. Testando geracao de imagem..." -ForegroundColor Yellow

$imageData = @{
    prompt = "Um gato fofo no jardim"
    model = "FLUX.1-dev"
    size = "1024x1024"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $imageData -ContentType "application/json"
    Write-Host "✓ Geracao de imagem bem-sucedida!" -ForegroundColor Green
    Write-Host "URL da imagem: $($result.data.image_url)" -ForegroundColor Cyan
    Write-Host "Tempo de geracao: $($result.metadata.generation_time)s" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Erro na geracao de imagem" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar servidor Node.js
Write-Host "`n3. Testando servidor Node.js..." -ForegroundColor Yellow
try {
    $nodeResult = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/image/generate" -Method POST -Body $imageData -ContentType "application/json"
    Write-Host "✓ Servidor Node.js esta funcionando!" -ForegroundColor Green
    Write-Host "Resposta: $($nodeResult | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Erro no servidor Node.js" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTeste concluido!" -ForegroundColor Green 