#!/bin/bash
# start_all.sh — APIBR2 full stack (Ubuntu + AMD ROCm)
#
# Serviços:
#   3000  Backend Node.js
#   5001  Image Server (Stable Diffusion / SDXL)
#   5002  Audio Server ← TTS + Whisper large-v3-turbo + XTTS-v2  [NOVO]
#   5003  Chat/LLM proxy (Ollama)
#   5004  Video/Instagram Downloader  ← movido de 5002 para liberar para o Audio
#  11434  Ollama CPU (Qwen / Llama)
#   5173  Frontend React
#
# ROCm lock: torch==2.5.1+rocm6.2 — NÃO atualizar (quebra Conv2d na RX 6750 XT gfx1030)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== APIBR2 Linux Launcher (AMD ROCm) ===${NC}"

PROJECT_ROOT=$(pwd)
24: 
25: # ── Limpeza de processos anteriores ──────────────────────────────────────────
26: echo -e "${YELLOW}[!] Matando processos antigos nas portas 3000-5004...${NC}"
27: fuser -k 3000/tcp 5001/tcp 5002/tcp 5003/tcp 5004/tcp 11434/tcp > /dev/null 2>&1
28: sleep 2
29:
# ── Carrega variáveis de ambiente do backend (.env) ───────────────────────────
# Isso traz: HF_TOKEN, AUDIO_SERVER_URL, PYTHON_INSTAGRAM_URL, etc.
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    set -a; source "$PROJECT_ROOT/backend/.env"; set +a
fi

# ── ROCm — exportar para todos os processos Python ────────────────────────────
export HSA_OVERRIDE_GFX_VERSION=10.3.0    # RX 6750 XT: alias gfx1031 → gfx1030
export PYTORCH_ROCM_ARCH=gfx1030
export PYTORCH_TUNABLEOP_ENABLED=0         # Reduz instabilidade no RDNA2
export TORCH_ROCM_AOT_DISABLE_HIPBLASLT=1

# ── Função para abrir aba no gnome-terminal ───────────────────────────────────
# Herda as vars exportadas acima para cada processo Python
open_tab() {
    local TITLE="$1"
    local CMD="cd integrations && source venv/bin/activate && \
        export HSA_OVERRIDE_GFX_VERSION=10.3.0 && \
        export PYTORCH_ROCM_ARCH=gfx1030 && \
        export PYTORCH_TUNABLEOP_ENABLED=0 && \
        export TORCH_ROCM_AOT_DISABLE_HIPBLASLT=1 && \
        export HF_TOKEN='$HF_TOKEN' && \
        export PYTHON_INSTAGRAM_URL='http://localhost:5004' && \
        export PYTHON_SERVICE_URL='http://localhost:5004' && \
        $2"
    gnome-terminal --tab --title="$TITLE" -- bash -c "cd '$PROJECT_ROOT'; $CMD; exec bash"
}

# ── 0. Redis ──────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[0] Verificando Redis...${NC}"
if ! pgrep redis-server > /dev/null; then
    echo "Redis não está rodando. Tentando iniciar..."
    sudo service redis-server start
fi
sleep 1

# ── 1. Backend Node.js (porta 3000) ───────────────────────────────────────────
echo -e "${YELLOW}[1/6] Backend Node.js → :3000${NC}"
gnome-terminal --tab --title="Backend API" -- bash -c "cd '$PROJECT_ROOT/backend'; npm start; exec bash"
sleep 3

# ── 2. Image Server (porta 5001) — Stable Diffusion + SDXL, ROCm ─────────────
echo -e "${YELLOW}[2/6] Image Server (SD/SDXL) → :5001${NC}"
open_tab "Image IA :5001" "python3 ultra_optimized_server.py"
sleep 2

# ── 3. Audio Server (porta 5002) — TTS + Whisper + XTTS-v2  [NOVO] ───────────
echo -e "${YELLOW}[3/6] Audio Server (TTS+Whisper+XTTS) → :5002${NC}"
open_tab "Audio :5002" "python3 audio_server.py"
sleep 2

# ── 4. Chat/LLM Server (porta 5003) — proxy Ollama para Chat Brain ───────────
echo -e "${YELLOW}[4/6] Chat LLM Server → :5003${NC}"
open_tab "Chat LLM :5003" "python3 text_generation_server.py"
sleep 1

# ── 5. Video/Instagram Downloader (porta 5004) — movido de 5002 ──────────────
# instagram_server.py lê INSTAGRAM_SERVER_PORT para definir a porta
echo -e "${YELLOW}[5/6] Video Downloader → :5004${NC}"
open_tab "Downloader :5004" "INSTAGRAM_SERVER_PORT=5004 python3 instagram_server.py"
sleep 1

# ── 6. Ollama CPU (porta 11434) — LLM dedicado para Chat Brain ───────────────
echo -e "${YELLOW}[6/6] Ollama CPU → :11434${NC}"
gnome-terminal --tab --title="Ollama CPU :11434" -- bash -c "
    export OLLAMA_HOST=127.0.0.1:11434
    export OLLAMA_NUM_GPU=0
    export OLLAMA_KEEP_ALIVE=24h
    echo 'Iniciando Ollama (CPU only)...'
    ollama serve &
    PID=\$!
    sleep 5
    ollama pull qwen2.5:3b
    wait \$PID
    exec bash"
sleep 2

# ── 7. Frontend React (porta 5173) ────────────────────────────────────────────
echo -e "${YELLOW}[+] Frontend React → :5173${NC}"
gnome-terminal --tab --title="Frontend :5173" -- bash -c "cd '$PROJECT_ROOT/frontend'; npm run dev; exec bash"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Sistema iniciado!                    ${NC}"
echo -e "${CYAN}   Frontend:   http://localhost:5173     ${NC}"
echo -e "${CYAN}   Backend:    http://localhost:3000     ${NC}"
echo -e "${CYAN}   Image:      http://localhost:5001     ${NC}"
echo -e "${CYAN}   Audio:      http://localhost:5002     ${NC}"
echo -e "${CYAN}   Chat LLM:   http://localhost:5003     ${NC}"
echo -e "${CYAN}   Downloader: http://localhost:5004     ${NC}"
echo -e "${GREEN}========================================${NC}"
