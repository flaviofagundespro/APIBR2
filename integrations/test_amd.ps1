# Teste específico para GPU AMD
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APIBR2 - Teste GPU AMD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se torch-directml está instalado
Write-Host "1. Verificando instalacao do torch-directml..." -ForegroundColor Yellow
try {
    $torchCheck = python -c "import torch; print('PyTorch version:', torch.__version__); print('DirectML available:', hasattr(torch, 'dml')); print('Device:', torch.device('dml') if hasattr(torch, 'dml') else 'DirectML not available')" 2>&1
    Write-Host "   $torchCheck" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: torch-directml nao instalado" -ForegroundColor Red
    Write-Host "   Execute: install_amd_support.bat" -ForegroundColor Yellow
}

Write-Host ""

# Teste 1: Health check
Write-Host "2. Health check do servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET
    Write-Host "   OK: $($response.status)" -ForegroundColor Green
    Write-Host "   Device: $($response.device)" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Certifique-se de que o servidor esta rodando: python real_image_server_amd.py" -ForegroundColor Yellow
}

Write-Host ""

# Teste 2: Listar modelos
Write-Host "3. Listar modelos disponiveis..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/models" -Method GET
    Write-Host "   Modelos publicos:" -ForegroundColor Green
    foreach ($model in $response.models.PSObject.Properties) {
        if ($model.Name -like "*stable-diffusion-v1-5*" -or $model.Name -like "*sdxl-turbo*" -or $model.Name -like "*dreamshaper*") {
            Write-Host "     - $($model.Name): $($model.Value.name)" -ForegroundColor White
        }
    }
    Write-Host "   Device info: $($response.device_info.current_device)" -ForegroundColor Green
    Write-Host "   AMD optimized: $($response.device_info.amd_optimized)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 3: Gerar imagem com modelo público
Write-Host "4. Teste de geracao com modelo publico..." -ForegroundColor Yellow
$body = @{
    prompt = "Um gato fofo sentado em um jardim colorido"
    model = "runwayml/stable-diffusion-v1-5"
    size = "512x512"
    steps = 20
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
    Write-Host "   Modelo: $($response.metadata.model)" -ForegroundColor White
    
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
Write-Host "5. Teste SDXL Turbo (muito rapido)..." -ForegroundColor Yellow
$body = @{
    prompt = "Um cachorro astronauta no espaco, estilo cartoon"
    model = "stabilityai/sdxl-turbo"
    size = "512x512"
    steps = 10
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 300
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "   OK: SDXL Turbo funcionando!" -ForegroundColor Green
    Write-Host "   Tempo de geracao: $($response.metadata.generation_time)s" -ForegroundColor White
    Write-Host "   Tempo total: $([math]::Round($duration, 2))s" -ForegroundColor White
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE AMD CONCLUIDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se tudo funcionou, sua GPU AMD esta otimizada!" -ForegroundColor Green
Write-Host "Use os modelos publicos no n8n:" -ForegroundColor Yellow
Write-Host "  - runwayml/stable-diffusion-v1-5" -ForegroundColor White
Write-Host "  - stabilityai/sdxl-turbo" -ForegroundColor White
Write-Host "  - lykon/dreamshaper-8" -ForegroundColor White
Write-Host ""
Write-Host "Para mais informacoes: AMD_GPU_GUIDE.md" -ForegroundColor Cyan 