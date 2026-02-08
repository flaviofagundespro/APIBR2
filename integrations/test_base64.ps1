# Teste Base64
Write-Host "Testando geracao com base64..." -ForegroundColor Green

$imageData = @{
    prompt = "Um gato fofo"
    model = "FLUX.1-dev"
    size = "1024x1024"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "http://localhost:5001/generate" -Method POST -Body $imageData -ContentType "application/json"
    
    Write-Host "✓ Sucesso: $($result.success)" -ForegroundColor Green
    Write-Host "✓ Tem base64: $($result.data.image_base64.Length -gt 0)" -ForegroundColor Green
    Write-Host "✓ Tamanho base64: $($result.data.image_base64.Length) caracteres" -ForegroundColor Cyan
    Write-Host "✓ Prompt: $($result.data.prompt)" -ForegroundColor Cyan
    Write-Host "✓ Modelo: $($result.data.model)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
} 