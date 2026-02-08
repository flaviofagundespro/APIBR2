# APIBR2 - Teste do Servidor Real de Geracao de Imagens
# Testa o servidor Python com Stable Diffusion real

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APIBR2 - Teste do Servidor Real" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$SERVER_URL = "http://localhost:5001"
$TEST_PROMPTS = @(
    "Um gato fofo sentado em um jardim colorido",
    "Um cachorro astronauta no espaco, estilo cartoon",
    "Uma paisagem de montanha ao por do sol, estilo realista"
)

# Funcao para testar health check
function Test-HealthCheck {
    Write-Host "Testando health check..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$SERVER_URL/health" -Method GET -TimeoutSec 10
        Write-Host "Health check OK:" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor White
        Write-Host "   Service: $($response.service)" -ForegroundColor White
        Write-Host "   Available models: $($response.available_models -join ', ')" -ForegroundColor White
        return $true
    }
    catch {
        Write-Host "Health check falhou: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcao para testar listagem de modelos
function Test-ModelsList {
    Write-Host "Testando listagem de modelos..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$SERVER_URL/models" -Method GET -TimeoutSec 10
        Write-Host "Modelos disponiveis:" -ForegroundColor Green
        foreach ($model in $response.models.PSObject.Properties) {
            Write-Host "   - $($model.Name): $($model.Value.name)" -ForegroundColor White
        }
        return $true
    }
    catch {
        Write-Host "Listagem de modelos falhou: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funcao para testar geracao de imagem
function Test-ImageGeneration {
    param($prompt, $model = "stabilityai/stable-diffusion-3.5")
    
    Write-Host "Testando geracao de imagem..." -ForegroundColor Yellow
    Write-Host "   Prompt: $prompt" -ForegroundColor Gray
    Write-Host "   Model: $model" -ForegroundColor Gray
    
    $body = @{
        prompt = $prompt
        model = $model
        size = "1024x1024"
        steps = 20
        guidance_scale = 7.5
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$SERVER_URL/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 300
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Host "Geracao bem-sucedida!" -ForegroundColor Green
        Write-Host "   Tempo de geracao: $($response.metadata.generation_time)s" -ForegroundColor White
        Write-Host "   Tempo total: $([math]::Round($duration, 2))s" -ForegroundColor White
        Write-Host "   Imagem salva em: $($response.data.local_path)" -ForegroundColor White
        Write-Host "   Tamanho base64: $($response.data.image_base64.Length) caracteres" -ForegroundColor White
        
        if (Test-Path $response.data.local_path) {
            $fileSize = (Get-Item $response.data.local_path).Length
            Write-Host "   Tamanho do arquivo: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor White
        }
        
        return $true
    }
    catch {
        Write-Host "Geracao falhou: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Detalhes: $errorBody" -ForegroundColor Red
        }
        return $false
    }
}

# Funcao para testar integracao com backend Node.js
function Test-BackendIntegration {
    Write-Host "Testando integracao com backend Node.js..." -ForegroundColor Yellow
    
    $body = @{
        prompt = "Um gato fofo sentado em um jardim colorido"
        model = "stabilityai/stable-diffusion-3.5"
        size = "1024x1024"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/image/generate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 300
        Write-Host "Integracao com backend OK!" -ForegroundColor Green
        Write-Host "   Resposta do backend recebida" -ForegroundColor White
        return $true
    }
    catch {
        Write-Host "Integracao com backend falhou: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Executar testes
Write-Host "Iniciando testes do servidor real..." -ForegroundColor Cyan
Write-Host ""

# Teste 1: Health check
$healthOK = Test-HealthCheck
Write-Host ""

# Teste 2: Listagem de modelos
$modelsOK = Test-ModelsList
Write-Host ""

# Teste 3: Geracao de imagem (primeiro prompt)
if ($healthOK) {
    $generationOK = Test-ImageGeneration -prompt $TEST_PROMPTS[0]
    Write-Host ""
}

# Teste 4: Integracao com backend
Write-Host "Para testar integracao com backend, certifique-se de que o servidor Node.js esta rodando na porta 3000" -ForegroundColor Yellow
$backendOK = Test-BackendIntegration
Write-Host ""

# Resumo
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Health Check: $(if ($healthOK) {'OK'} else {'FALHOU'})" -ForegroundColor $(if ($healthOK) {'Green'} else {'Red'})
Write-Host "Listagem de Modelos: $(if ($modelsOK) {'OK'} else {'FALHOU'})" -ForegroundColor $(if ($modelsOK) {'Green'} else {'Red'})
Write-Host "Geracao de Imagem: $(if ($generationOK) {'OK'} else {'FALHOU'})" -ForegroundColor $(if ($generationOK) {'Green'} else {'Red'})
Write-Host "Integracao Backend: $(if ($backendOK) {'OK'} else {'FALHOU'})" -ForegroundColor $(if ($backendOK) {'Green'} else {'Red'})
Write-Host ""

if ($healthOK -and $modelsOK -and $generationOK) {
    Write-Host "Todos os testes principais passaram!" -ForegroundColor Green
    Write-Host "O servidor esta funcionando corretamente." -ForegroundColor Green
} else {
    Write-Host "Alguns testes falharam. Verifique os logs acima." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para mais informacoes, consulte: REAL_IMAGE_GENERATION.md" -ForegroundColor Cyan 