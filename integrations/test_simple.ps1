# Teste simples do servidor real
Write-Host "Testando servidor real..." -ForegroundColor Cyan

# Teste 1: Health check
Write-Host "1. Health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET
    Write-Host "   OK: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Listar modelos
Write-Host "2. Listar modelos..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/models" -Method GET
    Write-Host "   OK: $($response.models.PSObject.Properties.Count) modelos" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Gerar imagem
Write-Host "3. Gerar imagem..." -ForegroundColor Yellow
$body = @{
    prompt = "Um gato fofo"
    model = "stable-diffusion-3.5"
    size = "1024x1024"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $body -ContentType "application/json"
    Write-Host "   OK: Imagem gerada em $($response.metadata.generation_time)s" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Teste concluido!" -ForegroundColor Cyan 