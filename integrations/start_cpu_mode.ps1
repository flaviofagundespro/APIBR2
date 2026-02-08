# APIBR2 - Iniciar servidor em modo CPU (mais estável que DirectML)
# DirectML pode ser muito lento ou travar, então este script força CPU

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APIBR2 - Modo CPU (Estável)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando servidor em modo CPU..." -ForegroundColor Yellow
Write-Host "DirectML pode ser muito lento, então vamos usar CPU" -ForegroundColor Gray
Write-Host ""

# Definir variável de ambiente para forçar CPU
$env:FORCE_CPU = "true"

# Iniciar servidor
Write-Host "Servidor iniciando em modo CPU..." -ForegroundColor Green
python ultra_optimized_server.py

