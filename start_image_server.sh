#!/bin/bash
# start_image_server.sh - Inicia o servidor de imagens (FLUX/SD) em sessão tmux
#
# Uso:
#   ./start_image_server.sh          # inicia ou reanexar sessão existente
#   ./start_image_server.sh stop     # para o servidor e encerra a sessão
#   ./start_image_server.sh logs     # mostra os logs em tempo real
#   ./start_image_server.sh attach   # reanexar ao terminal tmux interativo

set -e

SESSION="image-server"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="$PROJECT_ROOT/integrations/venv/bin/python"
LOG_FILE="$PROJECT_ROOT/logs/image_server.log"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

mkdir -p "$PROJECT_ROOT/logs"

case "${1:-start}" in

  stop)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      tmux kill-session -t "$SESSION"
      echo -e "${GREEN}Sessao '$SESSION' encerrada.${NC}"
    else
      echo -e "${YELLOW}Sessao '$SESSION' nao encontrada.${NC}"
    fi
    ;;

  logs)
    echo -e "${CYAN}Logs em tempo real ($LOG_FILE) — Ctrl+C para sair${NC}"
    tail -f "$LOG_FILE"
    ;;

  attach)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo -e "${CYAN}Reanexando a sessao tmux '$SESSION'...${NC}"
      tmux attach-session -t "$SESSION"
    else
      echo -e "${RED}Sessao '$SESSION' nao encontrada. Execute: ./start_image_server.sh${NC}"
      exit 1
    fi
    ;;

  start|*)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo -e "${YELLOW}Sessao '$SESSION' ja existe.${NC}"
      echo -e "  Para reanexar:  ${CYAN}./start_image_server.sh attach${NC}"
      echo -e "  Para ver logs:  ${CYAN}./start_image_server.sh logs${NC}"
      echo -e "  Para parar:     ${CYAN}./start_image_server.sh stop${NC}"
      exit 0
    fi

    if [ ! -f "$VENV_PYTHON" ]; then
      echo -e "${RED}venv nao encontrado: $VENV_PYTHON${NC}"
      exit 1
    fi

    echo -e "${GREEN}Iniciando servidor de imagens em sessao tmux '$SESSION'...${NC}"

    # Cria um wrapper que roda o Python dentro de um systemd scope com
    # limite de oomd elevado (90%), evitando que o processo seja morto
    # durante o carregamento pesado do FLUX (que pressiona a RAM a ~80%).
    WRAPPER=$(mktemp /tmp/image_server_run.XXXXXX.sh)
    cat > "$WRAPPER" << WRAPPER_EOF
#!/bin/bash
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export PYTORCH_ROCM_ARCH=gfx1030
export PYTORCH_TUNABLEOP_ENABLED=0
export TORCH_ROCM_AOT_DISABLE_HIPBLASLT=1
cd '$PROJECT_ROOT/integrations'
# ManagedOOMPreference=omit marca o scope como inapto a ser vítima do oomd,
# protegendo o carregamento pesado do FLUX (~12GB) sem precisar de sudo.
exec systemd-run --user --scope \
  -p ManagedOOMPreference=omit \
  -p Description="APIBR2 Image Server (FLUX/SD)" \
  '$VENV_PYTHON' ultra_optimized_server.py
WRAPPER_EOF
    chmod +x "$WRAPPER"

    tmux new-session -d -s "$SESSION" -x 220 -y 50 \; \
      send-keys -t "$SESSION" "bash '$WRAPPER' 2>&1 | tee '$LOG_FILE'; rm -f '$WRAPPER'" Enter

    echo -e "${GREEN}Servidor iniciado na sessao tmux '$SESSION'.${NC}"
    echo ""
    echo -e "  Ver output ao vivo:  ${CYAN}./start_image_server.sh attach${NC}"
    echo -e "  Ver logs (tail -f):  ${CYAN}./start_image_server.sh logs${NC}"
    echo -e "  Parar servidor:      ${CYAN}./start_image_server.sh stop${NC}"
    echo ""
    echo -e "${YELLOW}O processo continua rodando mesmo se o terminal fechar.${NC}"
    ;;
esac
