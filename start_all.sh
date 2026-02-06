#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   APIBR2 - Iniciando Sistema (Linux)   ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Pega o diretório atual
PROJECT_ROOT=$(pwd)

# Função para abrir nova aba no terminal (Estilo Ubuntu/Gnome)
# Se der erro de "gnome-terminal not found", você pode instalar com: sudo apt install gnome-terminal
open_tab() {
    TITLE=$1
    CMD=$2
    gnome-terminal --tab --title="$TITLE" -- bash -c "cd '$PROJECT_ROOT'; $CMD; exec bash"
}

# Step 1: Backend Node.js
echo -e "${YELLOW}[1/5] Iniciando Backend Node.js (porta 3000)...${NC}"
open_tab "Backend API" "cd backend && npm start"

echo -e "${YELLOW}[2/5] Aguardando 3 segundos...${NC}"
sleep 3

# Step 2: Python AI Server
# Nota: No Linux geralmente usamos 'python3' ou ativamos o venv antes
echo -e "${YELLOW}[3/5] Iniciando Servidor Python IA (porta 5001)...${NC}"
open_tab "Python AI" "cd integrations && python3 ultra_optimized_server.py"

echo -e "${YELLOW}[4/5] Aguardando 2 segundos...${NC}"
sleep 2

# Step 3: Video Downloader
echo -e "${YELLOW}[5/5] Iniciando Video Downloader (porta 5002)...${NC}"
open_tab "Downloader" "cd integrations && python3 instagram_server.py"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    Servicos iniciados em abas!         ${NC}"
echo -e "${CYAN}    Backend:   http://localhost:3000${NC}"
echo -e "${CYAN}    Python IA: http://localhost:5001${NC}"
echo -e "${CYAN}    Downloader: http://localhost:5002${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 4: Frontend
echo -e "${YELLOW}Iniciando Frontend React (porta 5173)...${NC}"

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias do frontend (primeira execucao)...${NC}"
    cd frontend && npm install && cd ..
fi

# Abre o frontend na última aba
open_tab "Frontend React" "cd frontend && npm run dev"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    Sistema Completo Iniciado!          ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Para parar tudo, feche o terminal ou crie um script de kill.${NC}"
echo ""