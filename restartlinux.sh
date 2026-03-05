#!/bin/bash
# restartlinux.sh — one-command restart for APIBR2 stack

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Reiniciando stack APIBR2..."
bash "$PROJECT_ROOT/stoplinux.sh"
sleep 1
bash "$PROJECT_ROOT/startlinux.sh"
