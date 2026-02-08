#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Iniciando APIBR2 System...${NC}"

# 1. Matar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "node src/server.js"
pkill -f "ultra_optimized_server.py"
sleep 2

# 2. Iniciar Python Backend
echo -e "${GREEN}🐍 Iniciando Backend Python (Porta 5001)...${NC}"
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
nohup .venv/bin/python ultra_optimized_server.py > ../python_server.log 2>&1 &
PYTHON_PID=$!
echo "   PID: $PYTHON_PID"

# 3. Iniciar Node Backend
echo -e "${GREEN}⚡ Iniciando Backend Node.js (Porta 3000)...${NC}"
cd /home/flaviofagundes/Projetos/APIBR2/backend
nohup npm start > ../node_server.log 2>&1 &
NODE_PID=$!
echo "   PID: $NODE_PID"

echo ""
echo "⏳ Aguardando inicialização (10s)..."
sleep 10

# 4. Verificação
echo ""
echo "🔍 Verificando status..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/image/models)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ SISTEMA ONLINE!${NC}"
    echo "   Backend Node: http://localhost:3000"
    echo "   Backend Python: http://localhost:5001"
    echo ""
    echo "Logs disponíveis em:"
    echo "   tail -f python_server.log"
    echo "   tail -f node_server.log"
else
    echo -e "${RED}❌ ERRO NA INICIALIZAÇÃO${NC}"
    echo "   Verifique os logs:"
    echo "   cat python_server.log"
    echo "   cat node_server.log"
fi
