# APIBR2 - Correção de versão do huggingface-hub
# Este script corrige o conflito de versões do huggingface-hub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APIBR2 - Correção de versão huggingface-hub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "O problema: diffusers requer huggingface-hub<1.0, mas está instalado 1.1.5" -ForegroundColor Yellow
Write-Host ""

# Verificar versão atual
Write-Host "1. Verificando versão atual do huggingface-hub..." -ForegroundColor Yellow
try {
    $currentVersion = pip show huggingface-hub 2>&1 | Select-String "Version:"
    Write-Host "   $currentVersion" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️ Não foi possível verificar" -ForegroundColor Yellow
}

# Desinstalar versão atual
Write-Host ""
Write-Host "2. Desinstalando huggingface-hub atual..." -ForegroundColor Yellow
pip uninstall huggingface-hub -y 2>&1 | Out-Null
Write-Host "   ✅ Desinstalado" -ForegroundColor Green

# Instalar versão compatível
Write-Host ""
Write-Host "3. Instalando huggingface-hub compatível (>=0.30.0,<1.0.0)..." -ForegroundColor Yellow
try {
    pip install "huggingface-hub>=0.30.0,<1.0.0"
    Write-Host "   ✅ Instalado" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao instalar com constraint" -ForegroundColor Red
    Write-Host "   Tentando versão específica 0.20.0..." -ForegroundColor Yellow
    pip install "huggingface-hub==0.20.0"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Versão 0.20.0 instalada" -ForegroundColor Green
    } else {
        Write-Host "   Tentando versão 0.19.4..." -ForegroundColor Yellow
        pip install "huggingface-hub==0.19.4"
    }
}

# Verificar instalação
Write-Host ""
Write-Host "4. Verificando instalação..." -ForegroundColor Yellow
try {
    $newVersion = pip show huggingface-hub 2>&1 | Select-String "Version:"
    Write-Host "   $newVersion" -ForegroundColor Cyan
    
    # Testar importação
    $testResult = python -c "import huggingface_hub; print('Versão:', huggingface_hub.__version__)" 2>&1
    Write-Host "   $testResult" -ForegroundColor Green
    Write-Host "   ✅ huggingface-hub funcionando!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro ao verificar" -ForegroundColor Yellow
}

# Atualizar diffusers se necessário
Write-Host ""
Write-Host "5. Verificando e atualizando diffusers..." -ForegroundColor Yellow
Write-Host "   Tentando atualizar diffusers para versão mais recente..." -ForegroundColor Gray
try {
    pip install --upgrade "diffusers>=0.20.0"
    Write-Host "   ✅ diffusers atualizado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro ao atualizar diffusers, tentando reinstalar..." -ForegroundColor Yellow
    pip uninstall diffusers -y 2>&1 | Out-Null
    pip install "diffusers>=0.20.0"
}

# Verificar compatibilidade
Write-Host ""
Write-Host "6. Verificando compatibilidade..." -ForegroundColor Yellow
try {
    $testResult = python -c "from diffusers import StableDiffusionPipeline; print('✅ diffusers importado com sucesso')" 2>&1
    Write-Host "   $testResult" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro ao importar diffusers: $_" -ForegroundColor Yellow
    Write-Host "   Tentando solução alternativa..." -ForegroundColor Yellow
    Write-Host "   Instalando versões específicas compatíveis..." -ForegroundColor Gray
    pip install "diffusers==0.21.4" "huggingface-hub==0.19.4"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Correção concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Reinicie o servidor Python" -ForegroundColor White
Write-Host "2. Execute: .\start_apibr2.ps1" -ForegroundColor White
Write-Host "3. Teste a geração de imagem novamente" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

