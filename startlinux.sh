#!/bin/bash
# startlinux.sh — APIBR2 full stack startup (Ubuntu + AMD ROCm)
#
# Services started:
#   3000  Node.js API gateway       (backend/src/server.js)
#   5001  Image generation server   (integrations/ultra_optimized_server.py)
#   5002  Audio server              (integrations/audio_server.py)  ← TTS + Whisper + XTTS-v2
#   5003  Chat / LLM server         (integrations/text_generation_server.py) ← Ollama proxy
#   5004  Video/Instagram downloader(integrations/instagram_server.py)
#   5173  Frontend React            (frontend/)
#
# ROCm: torch==2.5.1+rocm6.2 locked — do NOT upgrade (breaks Conv2d on RX 6750 XT gfx1030)

set -e

# Increase open-files limit when possible to reduce EMFILE on watchers (Vite/chokidar).
ulimit -n 65535 2>/dev/null || true

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="$PROJECT_ROOT/integrations/venv/bin/python"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   APIBR2 — Iniciando Sistema           ${NC}"
echo -e "${GREEN}   Ubuntu + AMD ROCm (RX 6750 XT)       ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ── Dependency checks ──────────────────────────────────────────────────────────
if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${RED}❌ venv não encontrado: $VENV_PYTHON${NC}"
    echo "   Crie com: python3 -m venv integrations/venv && integrations/venv/bin/pip install -r integrations/requirements.txt"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
    cd "$PROJECT_ROOT/backend" && npm install
fi

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
    cd "$PROJECT_ROOT/frontend" && npm install
fi

# ── Load environment variables ─────────────────────────────────────────────────
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    set -a; source "$PROJECT_ROOT/backend/.env"; set +a
fi

# ── ROCm environment (must be set for all Python processes) ───────────────────
export HSA_OVERRIDE_GFX_VERSION=10.3.0    # RX 6750 XT: gfx1031 → gfx1030 alias
export PYTORCH_ROCM_ARCH=gfx1030
export PYTORCH_TUNABLEOP_ENABLED=0        # Reduces RDNA2 instability
export TORCH_ROCM_AOT_DISABLE_HIPBLASLT=1 # Avoid hipBLASLt issues on RDNA2

# ── Port conflict check ────────────────────────────────────────────────────────
# IMPORTANT: do not use variable name PORT here (it is exported from backend/.env).
for CHECK_PORT in 3000 5001 5002 5003 5004 5173 11434; do
    if fuser "${CHECK_PORT}/tcp" &>/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Porta ${CHECK_PORT} ocupada — encerrando processo anterior...${NC}"
        fuser -k "${CHECK_PORT}/tcp" 2>/dev/null || true
        sleep 1
    fi
done

# ── Helper: start service in background ───────────────────────────────────────
start_service() {
    local NAME="$1"
    local CMD="$2"
    local LOG="$LOG_DIR/$3.log"
    echo -e "${YELLOW}▶ $NAME${NC}"
    nohup bash -lc "$CMD" > "$LOG" 2>&1 &
    local PID=$!
    echo "  PID: $PID | log: logs/$3.log"
}

echo ""
echo -e "${CYAN}── Iniciando serviços ──────────────────${NC}"

# 0. Ollama CPU (port 11434) — required by chat server /models
if command -v ollama >/dev/null 2>&1; then
    start_service \
        "Ollama CPU               → :11434" \
        "export OLLAMA_HOST=127.0.0.1:11434 OLLAMA_NUM_GPU=0 OLLAMA_KEEP_ALIVE=24h && ollama serve" \
        "ollama"
    sleep 3
else
    echo -e "${YELLOW}⚠️  ollama não encontrado no PATH; chat server pode falhar em /models${NC}"
fi

# 1. Node.js backend (port 3000)
start_service \
    "Backend Node.js          → :3000" \
    "cd '$PROJECT_ROOT/backend' && PORT=3000 node src/server.js" \
    "backend"
sleep 2

# 2. Image generation server (port 5001) — ROCm GPU, Stable Diffusion
start_service \
    "Image Server (SD/SDXL)   → :5001" \
    "cd '$PROJECT_ROOT/integrations' && '$VENV_PYTHON' ultra_optimized_server.py" \
    "image_server"
sleep 2

# 3. Audio server (port 5002) — TTS (edge-tts) + Whisper large-v3-turbo + XTTS-v2
start_service \
    "Audio Server (TTS+Whisper)→ :5002" \
    "cd '$PROJECT_ROOT/integrations' && '$VENV_PYTHON' audio_server.py" \
    "audio_server"
sleep 2

# 4. Chat / LLM server (port 5003) — Ollama proxy for Chat Brain
start_service \
    "Chat LLM Server (Ollama)  → :5003" \
    "cd '$PROJECT_ROOT/integrations' && '$VENV_PYTHON' text_generation_server.py" \
    "chat_server"
sleep 1

# 5. Video/Instagram downloader (port 5004) — yt-dlp based
#    NOTE: was previously on 5002 (now audio_server). instagram_server.py has its port
#    hardcoded to 5002 — we patch it at runtime via INSTAGRAM_SERVER_PORT env var.
#    instagram_server.py reads: port=int(os.getenv("INSTAGRAM_SERVER_PORT", "5002"))
export PYTHON_INSTAGRAM_URL=http://localhost:5004
export PYTHON_SERVICE_URL=http://localhost:5004
start_service \
    "Video Downloader          → :5004" \
    "cd '$PROJECT_ROOT/integrations' && INSTAGRAM_SERVER_PORT=5004 '$VENV_PYTHON' instagram_server.py" \
    "downloader"
sleep 1

# 6. Frontend React (port 5173)
start_service \
    "Frontend React            → :5173" \
    "cd '$PROJECT_ROOT/frontend' && CHOKIDAR_USEPOLLING=true CHOKIDAR_INTERVAL=1000 npm run dev -- --host" \
    "frontend"

# ── Wait for services to boot ──────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Aguardando serviços iniciarem (10s)...${NC}"
sleep 10

# ── Health check ───────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Health check ────────────────────────${NC}"
check() {
    local NAME="$1" URL="$2"
    local MAX_TRIES="${3:-12}" # ~60s with 5s interval
    local i=1
    while [ "$i" -le "$MAX_TRIES" ]; do
        if curl -sf "$URL" -o /dev/null --max-time 3; then
            echo -e "  ${GREEN}✅ $NAME${NC}"
            return 0
        fi
        sleep 5
        i=$((i + 1))
    done
    echo -e "  ${RED}❌ $NAME — não respondeu após $((MAX_TRIES * 5))s${NC}"
    return 1
}
check "Backend Node.js   :3000" "http://localhost:3000/health" 12
check "Image Server      :5001" "http://localhost:5001/health" 12
check "Audio Server      :5002" "http://localhost:5002/health" 12
check "Chat Server       :5003" "http://localhost:5003/health" 12
check "Video Downloader  :5004" "http://localhost:5004/health" 12
check "Frontend          :5173" "http://localhost:5173" 12

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Sistema APIBR2 iniciado!             ${NC}"
echo -e "${CYAN}   Frontend:  http://localhost:5173      ${NC}"
echo -e "${CYAN}   API:       http://localhost:3000      ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Logs em: $LOG_DIR/${NC}"
echo -e "${YELLOW}Para parar tudo: bash stoplinux.sh${NC}"
echo ""
