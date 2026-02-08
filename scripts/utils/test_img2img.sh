#!/bin/bash
# Teste completo do endpoint img2img

echo "🧪 Testando img2img API"
echo "======================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Criar imagem de teste se não existir
TEST_IMAGE="/tmp/test_img2img.png"
if [ ! -f "$TEST_IMAGE" ]; then
    echo "📸 Criando imagem de teste..."
    # Gerar uma imagem simples primeiro
    curl -s -X POST http://localhost:5001/generate \
      -H "Content-Type: application/json" \
      -d '{
        "prompt": "um gato fofo",
        "model": "lykon/dreamshaper-8",
        "steps": 10,
        "width": 512,
        "height": 512
      }' | python3 -c "import sys, json, base64; data=json.load(sys.stdin); open('$TEST_IMAGE', 'wb').write(base64.b64decode(data['data']['image_base64']))"
    
    if [ -f "$TEST_IMAGE" ]; then
        echo -e "${GREEN}✅ Imagem de teste criada${NC}"
    else
        echo -e "${YELLOW}⚠️ Erro ao criar imagem de teste${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Teste 1: img2img básico (strength=0.75)${NC}"
echo "----------------------------------------"

RESPONSE1=$(curl -s -X POST http://localhost:5001/img2img \
  -F "image=@$TEST_IMAGE" \
  -F "prompt=mesma imagem, estilo aquarela" \
  -F "model=lykon/dreamshaper-8" \
  -F "steps=15" \
  -F "strength=0.75")

echo "$RESPONSE1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"✅ Seed: {data.get('metadata',{}).get('seed','N/A')}\"); print(f\"✅ Tempo: {data.get('metadata',{}).get('generation_time','N/A')}s\"); print(f\"✅ Strength: {data.get('metadata',{}).get('strength','N/A')}\")"

echo ""
echo -e "${BLUE}Teste 2: Mudança sutil (strength=0.3)${NC}"
echo "---------------------------------------"

RESPONSE2=$(curl -s -X POST http://localhost:5001/img2img \
  -F "image=@$TEST_IMAGE" \
  -F "prompt=mesma imagem, iluminação mais quente" \
  -F "strength=0.3" \
  -F "steps=15")

echo "$RESPONSE2" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"✅ Strength: {data.get('metadata',{}).get('strength','N/A')}\"); print(f\"✅ Tempo: {data.get('metadata',{}).get('generation_time','N/A')}s\")"

echo ""
echo -e "${BLUE}Teste 3: Transformação grande (strength=0.9)${NC}"
echo "---------------------------------------------"

RESPONSE3=$(curl -s -X POST http://localhost:5001/img2img \
  -F "image=@$TEST_IMAGE" \
  -F "prompt=mesma cena, estilo anime" \
  -F "strength=0.9" \
  -F "steps=20")

echo "$RESPONSE3" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"✅ Strength: {data.get('metadata',{}).get('strength','N/A')}\"); print(f\"✅ Tempo: {data.get('metadata',{}).get('generation_time','N/A')}s\")"

echo ""
echo -e "${BLUE}Teste 4: Com seed fixo${NC}"
echo "----------------------"

RESPONSE4=$(curl -s -X POST http://localhost:5001/img2img \
  -F "image=@$TEST_IMAGE" \
  -F "prompt=gato com óculos de sol" \
  -F "strength=0.6" \
  -F "seed=42")

SEED4=$(echo "$RESPONSE4" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('metadata',{}).get('seed','N/A'))")
echo -e "${GREEN}✅ Seed usado: $SEED4${NC}"

if [ "$SEED4" == "42" ]; then
    echo -e "${GREEN}✅ SUCESSO: Seed fixo funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️ AVISO: Seed esperado 42, recebido $SEED4${NC}"
fi

echo ""
echo "======================="
echo -e "${GREEN}✅ Testes Completos!${NC}"
echo ""
echo "Imagens geradas em: /home/flaviofagundes/Projetos/APIBR2/integrations/generated_images/"
echo "Imagem de teste: $TEST_IMAGE"
