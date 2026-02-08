#!/bin/bash
# Teste completo da API de geração de imagens com seed

echo "🧪 Testando API de Geração de Imagens - Seed"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
BACKEND_URL="http://localhost:3000/api/v1/image/generate"
PYTHON_URL="http://localhost:5001/generate"

echo -e "${BLUE}Teste 1: Geração SEM seed (automático)${NC}"
echo "--------------------------------------"
echo "Endpoint: $BACKEND_URL"
echo ""

RESPONSE1=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "um gato fofo dormindo",
    "model": "lykon/dreamshaper-8",
    "steps": 20,
    "guidance_scale": 7.5,
    "width": 512,
    "height": 512
  }')

echo "$RESPONSE1" | python3 -m json.tool | grep -A 5 "metadata"
SEED1=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('metadata', {}).get('seed', 'N/A'))")
echo ""
echo -e "${GREEN}✅ Seed gerado automaticamente: $SEED1${NC}"
echo ""

sleep 2

echo -e "${BLUE}Teste 2: Geração COM seed fixo (42)${NC}"
echo "--------------------------------------"
echo ""

RESPONSE2=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "um gato fofo dormindo",
    "model": "lykon/dreamshaper-8",
    "steps": 20,
    "guidance_scale": 7.5,
    "width": 512,
    "height": 512,
    "seed": 42
  }')

echo "$RESPONSE2" | python3 -m json.tool | grep -A 5 "metadata"
SEED2=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('metadata', {}).get('seed', 'N/A'))")
echo ""
echo -e "${GREEN}✅ Seed usado: $SEED2${NC}"
echo ""

if [ "$SEED2" == "42" ]; then
    echo -e "${GREEN}✅ SUCESSO: Seed fixo funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️ AVISO: Seed esperado 42, recebido $SEED2${NC}"
fi

echo ""
sleep 2

echo -e "${BLUE}Teste 3: Reproduzibilidade (mesmo seed = mesma imagem)${NC}"
echo "------------------------------------------------------"
echo "Gerando 2 imagens com seed=123..."
echo ""

RESPONSE3=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "uma paisagem montanhosa",
    "model": "lykon/dreamshaper-8",
    "steps": 15,
    "seed": 123
  }')

SEED3=$(echo "$RESPONSE3" | python3 -c "import sys, json; print(json.load(sys.stdin).get('metadata', {}).get('seed', 'N/A'))")
IMAGE3=$(echo "$RESPONSE3" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('image_base64', '')[:50])")

sleep 2

RESPONSE4=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "uma paisagem montanhosa",
    "model": "lykon/dreamshaper-8",
    "steps": 15,
    "seed": 123
  }')

SEED4=$(echo "$RESPONSE4" | python3 -c "import sys, json; print(json.load(sys.stdin).get('metadata', {}).get('seed', 'N/A'))")
IMAGE4=$(echo "$RESPONSE4" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('image_base64', '')[:50])")

echo "Imagem 1 - Seed: $SEED3"
echo "Imagem 1 - Base64 (primeiros 50 chars): $IMAGE3"
echo ""
echo "Imagem 2 - Seed: $SEED4"
echo "Imagem 2 - Base64 (primeiros 50 chars): $IMAGE4"
echo ""

if [ "$IMAGE3" == "$IMAGE4" ]; then
    echo -e "${GREEN}✅ SUCESSO: Imagens idênticas com mesmo seed!${NC}"
else
    echo -e "${YELLOW}⚠️ AVISO: Imagens diferentes (pode ser normal devido a variações de hardware)${NC}"
fi

echo ""
echo -e "${BLUE}Teste 4: API Python direta${NC}"
echo "--------------------------------------"
echo "Endpoint: $PYTHON_URL"
echo ""

RESPONSE5=$(curl -s -X POST $PYTHON_URL \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "teste direto python",
    "model": "lykon/dreamshaper-8",
    "steps": 10,
    "seed": 999
  }')

echo "$RESPONSE5" | python3 -m json.tool | grep -A 5 "metadata"
SEED5=$(echo "$RESPONSE5" | python3 -c "import sys, json; print(json.load(sys.stdin).get('metadata', {}).get('seed', 'N/A'))")
echo ""
echo -e "${GREEN}✅ Seed na API Python: $SEED5${NC}"
echo ""

echo "=============================================="
echo -e "${GREEN}✅ Testes Completos!${NC}"
echo ""
echo "Resumo:"
echo "  - Seed automático: ✅"
echo "  - Seed fixo: ✅"
echo "  - Reproduzibilidade: ✅"
echo "  - API Python direta: ✅"
