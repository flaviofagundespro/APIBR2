# Script para iniciar o serviço de download do Instagram
Write-Host "Iniciando Instagram Downloader Service..." -ForegroundColor Green

cd integrations

# Verificar se o ambiente virtual existe (opcional, mas recomendado)
# Se não usar venv, assume python global

# Instalar dependências se necessário
Write-Host "Verificando dependências..."
pip install -r requirements_instagram.txt

# Iniciar servidor
Write-Host "Iniciando servidor na porta 5002..."
python instagram_server.py
