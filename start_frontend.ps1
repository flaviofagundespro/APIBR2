# Script para iniciar o Frontend
Write-Host "Iniciando Instalação e Execução do Frontend..." -ForegroundColor Green

cd frontend

if (!(Test-Path "node_modules")) {
    Write-Host "Instalando dependências (primeira execução)..." -ForegroundColor Yellow
    npm install
}

Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Green
npm run dev
