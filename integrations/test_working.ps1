# Teste do servidor otimizado
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APIBR2 - Teste Servidor Otimizado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Health check
Write-Host "1. Health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET
    Write-Host "   OK: $($response.status)" -ForegroundColor Green
    Write-Host "   Device: $($response.device)" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Certifique-se de que o servidor esta rodando: python working_image_server.py" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Teste 2: Listar modelos
Write-Host "2. Listar modelos..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/models" -Method GET
    Write-Host "   Modelos disponiveis:" -ForegroundColor Green
    foreach ($model in $response.models.PSObject.Properties) {
        Write-Host "     - $($model.Name): $($model.Value.name)" -ForegroundColor White
    }
    Write-Host "   Device: $($response.device_info.current_device)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 3: Gerar imagem com Stable Diffusion 1.5 (otimizado)
Write-Host "3. Teste Stable Diffusion 1.5 (otimizado)..." -ForegroundColor Yellow
$body = @{
    prompt = "Um gato fofo sentado em um jardim colorido"
    model = "runwayml/stable-diffusion-v1-5"
    size = "512x512"
    steps = 15
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 300
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "   OK: Imagem gerada!" -ForegroundColor Green
    Write-Host "   Tempo de geracao: $($response.metadata.generation_time)s" -ForegroundColor White
    Write-Host "   Tempo total: $([math]::Round($duration, 2))s" -ForegroundColor White
    Write-Host "   Device usado: $($response.metadata.device)" -ForegroundColor White
    Write-Host "   Steps: $($response.metadata.steps)" -ForegroundColor White
    
    if (Test-Path $response.data.local_path) {
        $fileSize = (Get-Item $response.data.local_path).Length
        Write-Host "   Arquivo: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor White
    }
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Detalhes: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""

# Teste 4: SDXL Turbo (muito rápido)
Write-Host "4. Teste SDXL Turbo (muito rapido)..." -ForegroundColor Yellow
$body = @{
    prompt = "Um cachorro astronauta no espaco, estilo cartoon"
    model = "stabilityai/sdxl-turbo"
    size = "512x512"
    steps = 8
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 300
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "   OK: SDXL Turbo funcionando!" -ForegroundColor Green
    Write-Host "   Tempo de geracao: $($response.metadata.generation_time)s" -ForegroundColor White
    Write-Host "   Tempo total: $([math]::Round($duration, 2))s" -ForegroundColor White
    Write-Host "   Steps: $($response.metadata.steps)" -ForegroundColor White
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Detalhes: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""

# Teste 5: DreamShaper (artístico)
Write-Host "5. Teste DreamShaper (artistico)..." -ForegroundColor Yellow
$body = @{
    prompt = "Uma paisagem de fantasia com castelo no ceu, estilo aquarela"
    model = "lykon/dreamshaper-8"
    size = "512x512"
    steps = 15
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 300
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "   OK: DreamShaper funcionando!" -ForegroundColor Green
    Write-Host "   Tempo de geracao: $($response.metadata.generation_time)s" -ForegroundColor White
    Write-Host "   Tempo total: $([math]::Round($duration, 2))s" -ForegroundColor White
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE CONCLUIDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se todos os testes passaram, o servidor esta funcionando!" -ForegroundColor Green
Write-Host ""
Write-Host "Modelos testados:" -ForegroundColor Yellow
Write-Host "  - runwayml/stable-diffusion-v1-5 (estavel)" -ForegroundColor White
Write-Host "  - stabilityai/sdxl-turbo (rapido)" -ForegroundColor White
Write-Host "  - lykon/dreamshaper-8 (artistico)" -ForegroundColor White
Write-Host ""
Write-Host "Use no n8n com a URL: http://apibr.giesel.com.br:3000/api/v1/image/generate" -ForegroundColor Cyan 