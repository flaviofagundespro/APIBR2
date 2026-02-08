Write-Host "Limpando cache do APIBR2..." -ForegroundColor Green
Write-Host ""

# Limpar imagens geradas
if (Test-Path "integrations/generated_images") {
    $files = Get-ChildItem "integrations/generated_images" -File | Measure-Object
    Remove-Item "integrations/generated_images/*" -Force -Recurse
    Write-Host "✅ Cache de imagens limpo ($($files.Count) arquivos removidos)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Pasta de imagens não encontrada" -ForegroundColor Yellow
}

# Limpar logs antigos (mais de 7 dias)
if (Test-Path "backend/logs") {
    $oldLogs = Get-ChildItem "backend/logs/*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)}
    if ($oldLogs) {
        $oldLogs | Remove-Item -Force
        Write-Host "✅ Logs antigos removidos ($($oldLogs.Count) arquivos)" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Nenhum log antigo encontrado" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Pasta de logs não encontrada" -ForegroundColor Yellow
}

# Limpar cache do Node.js
if (Test-Path "backend/node_modules/.cache") {
    Remove-Item "backend/node_modules/.cache" -Force -Recurse
    Write-Host "✅ Cache do Node.js limpo" -ForegroundColor Green
}

# Limpar arquivos temporários Python
if (Test-Path "integrations/__pycache__") {
    Remove-Item "integrations/__pycache__" -Force -Recurse
    Write-Host "✅ Cache Python limpo" -ForegroundColor Green
}

Write-Host ""
Write-Host "Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Para reiniciar o sistema:" -ForegroundColor Cyan
Write-Host "  ./start_apibr2.ps1" -ForegroundColor White 