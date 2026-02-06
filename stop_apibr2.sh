#!/bin/bash
echo "Parando todos os processos Node e Python..."

# Mata processos baseados no nome (Cuidado: mata todos os nodes e pythons do usuário)
pkill -f "node"
pkill -f "python3 ultra_optimized_server.py"
pkill -f "python3 instagram_server.py"
pkill -f "vite"

echo "Serviços encerrados."