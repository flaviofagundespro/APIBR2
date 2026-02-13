#!/bin/bash

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== APIBR2 Linux Launcher (AMD Optimized) ===${NC}"

PROJECT_ROOT=$(pwd)

# Função para abrir abas já com o ambiente ativado
open_tab() {
    TITLE=$1
    # O comando abaixo:
    # 1. Entra na pasta integrations
    # 2. Ativa o venv
    # 3. Exporta a variável da AMD (só pra garantir, mal não faz)
    # 4. Executa o comando final
    CMD="cd integrations && source venv/bin/activate && export HSA_OVERRIDE_GFX_VERSION=10.3.0 && export TORCH_ROCM_AOT_DISABLE_HIPBLASLT=1 && $2"
    
    gnome-terminal --tab --title="$TITLE" -- bash -c "cd '$PROJECT_ROOT'; $CMD; exec bash"
}

# 0. Check & Start Redis (Database)
echo -e "${YELLOW}[0/5] Verificando Redis Database...${NC}"
# Tenta iniciar o redis se não estiver rodando (pode pedir senha sudo)
if ! pgrep redis-server > /dev/null; then
    echo "Redis não está rodando. Tentando iniciar..."
    sudo service redis-server start
fi
sleep 1

# 1. Backend Node
echo -e "${YELLOW}[1/4] Iniciando Backend (Porta 3000)...${NC}"
gnome-terminal --tab --title="Backend API" -- bash -c "cd '$PROJECT_ROOT/backend'; npm start; exec bash"
sleep 3

# 2. Python IA (Com VENV e ROCm ativados)
echo -e "${YELLOW}[2/4] Iniciando IA Server (Porta 5001)...${NC}"
open_tab "Python IA" "python3 ultra_optimized_server.py"
sleep 2

# 3. Python Downloader (Com VENV ativado)
echo -e "${YELLOW}[3/4] Iniciando Downloader (Porta 5002)...${NC}"
open_tab "Downloader" "python3 instagram_server.py"
sleep 1

# 3.2 Magic Prompt Server
echo -e "${YELLOW}[3.5/5] Iniciando Magic Prompt (Porta 5003)...${NC}"
open_tab "Magic Prompt" "python3 text_generation_server.py"
sleep 1

# 3.5. Ollama CPU (Dedicated Port 11435)
echo -e "${YELLOW}[4/5] Iniciando LLM Brain (CPU Only - Porta 11435)...${NC}"
# Força CPU (NUM_GPU=0) e Porta Customizada, Keep Alive 24h
gnome-terminal --tab --title="Ollama CPU" -- bash -c "export OLLAMA_HOST=127.0.0.1:11435; export OLLAMA_NUM_GPU=0; export OLLAMA_KEEP_ALIVE=24h; echo 'Iniciando Ollama em modo CPU...'; ollama serve & PID=\$!; sleep 5; echo 'Baixando modelo Qwen (pode demorar na primeira vez)...'; ollama pull qwen2.5:3b; wait \$PID; exec bash"
sleep 2

# 4. Frontend React
echo -e "${YELLOW}[5/5] Iniciando Frontend (Porta 5173)...${NC}"
gnome-terminal --tab --title="Frontend" -- bash -c "cd '$PROJECT_ROOT/frontend'; npm run dev; exec bash"

echo ""
echo -e "${GREEN}Sistema iniciado!${NC}"
echo -e "${CYAN}Backend: http://localhost:3000${NC}"
echo -e "${CYAN}IA:      http://localhost:5001${NC}"
echo -e "${CYAN}Down.:   http://localhost:5002${NC}"
echo -e "${CYAN}Front:   http://localhost:5173${NC}"
