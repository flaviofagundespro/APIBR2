#!/bin/bash
# restart_all.sh — restart APIBR2 using tabbed launcher (start_all.sh)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Reiniciando stack APIBR2 (modo abas)..."
bash "$PROJECT_ROOT/stoplinux.sh"
sleep 1
bash "$PROJECT_ROOT/start_all.sh"
