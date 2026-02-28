#!/bin/bash
# stoplinux.sh — stop APIBR2 local stack safely
#
# Stops only known APIBR2 ports/processes (does not kill every node/python process).

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Parando stack APIBR2...${NC}"

# Kill services by known ports first.
PORTS=(3000 5001 5002 5003 5004 5173 11435)
for port in "${PORTS[@]}"; do
  if fuser "${port}/tcp" >/dev/null 2>&1; then
    echo " - Encerrando porta ${port}"
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  fi
done

# Extra safety: kill exact known command patterns (if not port-bound anymore).
pkill -f "ultra_optimized_server.py" >/dev/null 2>&1 || true
pkill -f "audio_server.py" >/dev/null 2>&1 || true
pkill -f "text_generation_server.py" >/dev/null 2>&1 || true
pkill -f "instagram_server.py" >/dev/null 2>&1 || true
pkill -f "node src/server.js" >/dev/null 2>&1 || true
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "ollama serve" >/dev/null 2>&1 || true

sleep 1
echo -e "${GREEN}Stack APIBR2 encerrada.${NC}"
