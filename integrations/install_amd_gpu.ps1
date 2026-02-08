# APIBR2 - Instalação de Suporte AMD GPU (DirectML)
# Este script instala o torch-directml para usar GPU AMD

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APIBR2 - Instalação de Suporte AMD GPU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "1. Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Python não encontrado!" -ForegroundColor Red
    Write-Host "   Instale Python 3.10+ primeiro" -ForegroundColor Red
    exit 1
}

# Verificar se pip está instalado
Write-Host ""
Write-Host "2. Verificando pip..." -ForegroundColor Yellow
try {
    $pipVersion = pip --version 2>&1
    Write-Host "   ✅ $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ pip não encontrado!" -ForegroundColor Red
    exit 1
}

# Desinstalar PyTorch padrão se existir
Write-Host ""
Write-Host "3. Desinstalando PyTorch padrão (se existir)..." -ForegroundColor Yellow
pip uninstall torch torchvision torchaudio -y 2>&1 | Out-Null
Write-Host "   ✅ Concluído" -ForegroundColor Green

# Instalar torch-directml
Write-Host ""
Write-Host "4. Instalando torch-directml..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray
try {
    pip install torch-directml
    Write-Host "   ✅ torch-directml instalado" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao instalar torch-directml" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Red
    exit 1
}

# Instalar outras dependências
Write-Host ""
Write-Host "5. Instalando dependências adicionais..." -ForegroundColor Yellow
pip install onnxruntime-directml 2>&1 | Out-Null
pip install --upgrade huggingface_hub 2>&1 | Out-Null
Write-Host "   ✅ Dependências instaladas" -ForegroundColor Green

# Verificar instalação
Write-Host ""
Write-Host "6. Verificando instalação..." -ForegroundColor Yellow
try {
    $checkResult = python -c "import torch; import torch_directml; print('PyTorch:', torch.__version__); print('DirectML available:', torch_directml.is_available()); print('Device:', torch_directml.device() if torch_directml.is_available() else 'N/A')" 2>&1
    Write-Host "   $checkResult" -ForegroundColor Cyan
    
    if ($checkResult -match "DirectML available: True") {
        Write-Host "   ✅ DirectML funcionando!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ DirectML pode não estar funcionando corretamente" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Não foi possível verificar (pode estar OK)" -ForegroundColor Yellow
}

# Instalar accelerate para melhor performance
Write-Host ""
Write-Host "7. Instalando accelerate (para melhor performance)..." -ForegroundColor Yellow
try {
    pip install accelerate>=0.20.0
    Write-Host "   ✅ accelerate instalado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Erro ao instalar accelerate (opcional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Reinicie o servidor Python" -ForegroundColor White
Write-Host "2. Execute: .\start_apibr2.ps1" -ForegroundColor White
Write-Host "3. O servidor deve detectar sua GPU AMD automaticamente" -ForegroundColor White
Write-Host ""
Write-Host "Para testar:" -ForegroundColor Yellow
Write-Host "   python test_directml.py" -ForegroundColor White
Write-Host ""
Write-Host "Para mais informações, consulte: AMD_GPU_GUIDE.md" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

