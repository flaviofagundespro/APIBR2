# 🚀 Scripts de Inicialização - APIBR2

## 📋 Scripts Disponíveis

### 🎯 Script Principal - Iniciar Tudo
```bash
# Windows PowerShell
./start_apibr2.ps1

# Linux/Mac
./start_apibr2.sh
```

### 🔧 Scripts Individuais

#### 1. Iniciar Backend Node.js
```bash
# Windows
./start_backend.bat

# PowerShell
./start_backend.ps1

# Linux/Mac
./start_backend.sh
```

#### 2. Iniciar Servidor Python
```bash
# Windows
./start_python.bat

# PowerShell
./start_python.ps1

# Linux/Mac
./start_python.sh
```

#### 3. Teste Completo
```bash
# PowerShell
./test_ultra.ps1

# Linux/Mac
./test_ultra.sh
```

## 🛠️ Criando os Scripts

### Windows Batch (.bat)

#### start_apibr2.bat
```batch
@echo off
echo ========================================
echo    APIBR2 - Iniciando Sistema Completo
echo ========================================
echo.

echo [1/3] Iniciando Backend Node.js...
start "APIBR2 Backend" cmd /k "cd backend && npm start"

echo [2/3] Aguardando 5 segundos...
timeout /t 5 /nobreak > nul

echo [3/3] Iniciando Servidor Python...
start "APIBR2 Python" cmd /k "cd integrations && python ultra_optimized_server.py"

echo.
echo ========================================
echo    Sistema iniciado com sucesso!
echo    Backend: http://localhost:3000
echo    Python:  http://localhost:5001
echo ========================================
echo.
echo Pressione qualquer tecla para executar testes...
pause > nul

echo Executando testes...
cd integrations
test_ultra.ps1
```

#### start_backend.bat
```batch
@echo off
echo Iniciando APIBR2 Backend...
cd backend
npm start
```

#### start_python.bat
```batch
@echo off
echo Iniciando APIBR2 Python Server...
cd integrations
python ultra_optimized_server.py
```

### PowerShell (.ps1)

#### start_apibr2.ps1
```powershell
Write-Host "========================================" -ForegroundColor Green
Write-Host "   APIBR2 - Iniciando Sistema Completo" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/3] Iniciando Backend Node.js..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

Write-Host "[2/3] Aguardando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[3/3] Iniciando Servidor Python..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd integrations; python ultra_optimized_server.py" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "    Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "    Python:  http://localhost:5001" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$response = Read-Host "Executar testes agora? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host "Executando testes..." -ForegroundColor Yellow
    Set-Location integrations
    .\test_ultra.ps1
}
```

#### start_backend.ps1
```powershell
Write-Host "Iniciando APIBR2 Backend..." -ForegroundColor Green
Set-Location backend
npm start
```

#### start_python.ps1
```powershell
Write-Host "Iniciando APIBR2 Python Server..." -ForegroundColor Green
Set-Location integrations
python ultra_optimized_server.py
```

### Linux/Mac Shell (.sh)

#### start_apibr2.sh
```bash
#!/bin/bash

echo "========================================"
echo "   APIBR2 - Iniciando Sistema Completo"
echo "========================================"
echo ""

echo "[1/3] Iniciando Backend Node.js..."
gnome-terminal -- bash -c "cd backend && npm start; exec bash" &
# Para outros terminais: xterm, konsole, etc.

echo "[2/3] Aguardando 5 segundos..."
sleep 5

echo "[3/3] Iniciando Servidor Python..."
gnome-terminal -- bash -c "cd integrations && python ultra_optimized_server.py; exec bash" &

echo ""
echo "========================================"
echo "    Sistema iniciado com sucesso!"
echo "    Backend: http://localhost:3000"
echo "    Python:  http://localhost:5001"
echo "========================================"
echo ""

read -p "Executar testes agora? (s/n): " response
if [[ $response =~ ^[Ss]$ ]]; then
    echo "Executando testes..."
    cd integrations
    ./test_ultra.sh
fi
```

#### start_backend.sh
```bash
#!/bin/bash
echo "Iniciando APIBR2 Backend..."
cd backend
npm start
```

#### start_python.sh
```bash
#!/bin/bash
echo "Iniciando APIBR2 Python Server..."
cd integrations
python ultra_optimized_server.py
```

## 🔧 Scripts de Manutenção

### Limpar Cache
```bash
# PowerShell
./scripts/utils/clean_cache.ps1

# ~~Windows .bat~~ (deprecated/removed)
# ~~Linux/Mac .sh~~ (deprecated/removed)
```

### Reiniciar Tudo
```bash
# Windows
./restart_all.bat

# PowerShell
./restart_all.ps1

# Linux/Mac
./restart_all.sh
```

### Verificar Status
```bash
# PowerShell
./scripts/utils/check_status.ps1

# ~~Windows .bat~~ (deprecated/removed)
# ~~Linux/Mac .sh~~ (deprecated/removed)
```

## 📊 Scripts de Monitoramento

### check_status.ps1 (scripts/utils/)
```powershell
Write-Host "Verificando status do APIBR2..." -ForegroundColor Green
Write-Host ""

# Verificar Backend
Write-Host "Backend Node.js:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    Write-Host "  ✅ Rodando (Porta 3000)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Não está rodando" -ForegroundColor Red
}

# Verificar Python
Write-Host "Servidor Python:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 5
    Write-Host "  ✅ Rodando (Porta 5001)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Não está rodando" -ForegroundColor Red
}

Write-Host ""
Write-Host "Para iniciar os serviços:" -ForegroundColor Cyan
Write-Host "  ./start_apibr2.ps1" -ForegroundColor White
```

### clean_cache.ps1 (scripts/utils/)
```powershell
Write-Host "Limpando cache do APIBR2..." -ForegroundColor Green

# Limpar imagens geradas
if (Test-Path "integrations/generated_images") {
    Remove-Item "integrations/generated_images/*" -Force -Recurse
    Write-Host "✅ Cache de imagens limpo" -ForegroundColor Green
}

# Limpar logs antigos
if (Test-Path "backend/logs") {
    Get-ChildItem "backend/logs/*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Force
    Write-Host "✅ Logs antigos removidos" -ForegroundColor Green
}

Write-Host "Limpeza concluída!" -ForegroundColor Green
```

## 🎯 Uso Rápido

### 1. Primeira Vez
```bash
# Instalar dependências
cd backend && npm install
cd ../integrations && pip install -r requirements.txt

# Iniciar sistema
./start_apibr2.ps1
```

### 2. Uso Diário
```bash
# Iniciar tudo
./start_apibr2.ps1

# Ou individualmente
./start_backend.ps1
./start_python.ps1
```

### 3. Manutenção
```bash
# Verificar status
./scripts/utils/check_status.ps1

# Limpar cache
./scripts/utils/clean_cache.ps1

# Reiniciar tudo
./restart_all.ps1
```

## 📝 Notas Importantes

### Permissões (Linux/Mac)
```bash
chmod +x *.sh
```

### Dependências
- Node.js instalado
- Python instalado
- Dependências instaladas

### Portas
- 3000: Backend Node.js
- 5001: Servidor Python

---

**🎯 Objetivo**: Inicialização rápida e fácil  
**✅ Status**: Scripts prontos para uso  
**📚 Documentação**: Ver README.md para detalhes 