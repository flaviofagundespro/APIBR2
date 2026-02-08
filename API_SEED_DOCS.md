# 📡 API de Geração de Imagens - Documentação Completa com Seed

## Endpoints Disponíveis

### 1. Backend Node.js (Recomendado)
```
POST http://localhost:3000/api/v1/image/generate
```

### 2. Python Direto (Avançado)
```
POST http://localhost:5001/generate
```

---

## 🎨 Geração de Imagens

### Request Body

```json
{
  "prompt": "string (obrigatório)",
  "model": "string (opcional, padrão: lykon/dreamshaper-8)",
  "steps": "number (opcional, padrão: 20)",
  "guidance_scale": "number (opcional, padrão: 7.5)",
  "width": "number (opcional, padrão: 512)",
  "height": "number (opcional, padrão: 512)",
  "seed": "number (opcional, para reproduzibilidade)"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "image_url": "http://apibr.giesel.com.br/images/dreamshaper-8_xxx.png",
    "local_path": "/path/to/image.png",
    "prompt": "um gato fofo",
    "model": "lykon/dreamshaper-8",
    "size": "512x512",
    "timestamp": "2026-02-04T00:00:00"
  },
  "metadata": {
    "model": "lykon/dreamshaper-8",
    "generation_time": 18.5,
    "steps": 20,
    "guidance_scale": 7.5,
    "scheduler": "euler_a",
    "seed": 123456,  // ← Seed usado
    "device": "cuda",
    "optimization_level": "ultra_v2",
    "timestamp": "2026-02-04T00:00:00"
  }
}
```

---

## 📋 Exemplos de Uso

### Exemplo 1: Geração Básica (Seed Automático)

```bash
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "um gato fofo dormindo em uma almofada",
    "model": "lykon/dreamshaper-8",
    "steps": 20,
    "guidance_scale": 7.5
  }'
```

**Resultado:**
- Sistema gera seed automaticamente
- Seed retornado em `metadata.seed`
- Imagem única

### Exemplo 2: Geração com Seed Fixo

```bash
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "um gato fofo dormindo em uma almofada",
    "model": "lykon/dreamshaper-8",
    "steps": 20,
    "seed": 42
  }'
```

**Resultado:**
- Usa seed 42
- Sempre gera a mesma imagem
- Reproduzível

### Exemplo 3: Reproduzir Imagem Anterior

```bash
# 1. Gerar imagem e salvar seed
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "uma paisagem montanhosa ao pôr do sol",
    "model": "lykon/dreamshaper-8"
  }')

# 2. Extrair seed
SEED=$(echo $RESPONSE | jq -r '.metadata.seed')
echo "Seed usado: $SEED"

# 3. Reproduzir com mesmo seed
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"uma paisagem montanhosa ao pôr do sol\",
    \"model\": \"lykon/dreamshaper-8\",
    \"seed\": $SEED
  }"
```

### Exemplo 4: Variações com Seed Fixo

```bash
# Mesmo seed, prompts diferentes
SEED=12345

# Variação 1
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"um gato\",
    \"seed\": $SEED
  }"

# Variação 2 (mesma composição, mais detalhes)
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"um gato fofo com olhos azuis\",
    \"seed\": $SEED
  }"

# Variação 3 (mesma composição, contexto diferente)
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"um gato fofo com olhos azuis dormindo em uma almofada rosa\",
    \"seed\": $SEED
  }"
```

---

## 🔧 Modelos Disponíveis

| ID | Nome | Descrição |
|----|------|-----------|
| `runwayml/stable-diffusion-v1-5` | SD 1.5 | Baseline versátil |
| `lykon/dreamshaper-8` | DreamShaper 8 | Artístico (padrão) |
| `SG161222/Realistic_Vision_V5.1_noVAE` | Realistic Vision | Fotorrealismo |
| `emilianJR/epiCRealism` | Epic Realism | Cinematográfico |

---

## 🎯 Casos de Uso

### 1. Desenvolvimento/Teste
```bash
# Use seed fixo para testes consistentes
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "teste de qualidade",
    "seed": 999,
    "steps": 10
  }'
```

### 2. Produção (Variabilidade)
```bash
# Não envie seed - cada imagem será única
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "produto comercial",
    "model": "SG161222/Realistic_Vision_V5.1_noVAE",
    "steps": 25
  }'
```

### 3. Refinamento Iterativo
```bash
# 1. Gerar e encontrar boa composição
# 2. Copiar seed
# 3. Refinar prompt mantendo seed
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "retrato profissional, iluminação natural, 8k",
    "seed": 456789,
    "model": "SG161222/Realistic_Vision_V5.1_noVAE"
  }'
```

---

## 🧪 Script de Teste

Execute o script de teste completo:

```bash
cd /home/flaviofagundes/Projetos/APIBR2
./test_seed_api.sh
```

Testa:
- ✅ Seed automático
- ✅ Seed fixo
- ✅ Reproduzibilidade
- ✅ API Python direta

---

## 📊 Integração com N8N

### Workflow: Gerar Imagem com Seed

```json
{
  "nodes": [
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3000/api/v1/image/generate",
        "method": "POST",
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{$json.prompt}}"
            },
            {
              "name": "model",
              "value": "lykon/dreamshaper-8"
            },
            {
              "name": "seed",
              "value": "={{$json.seed || null}}"
            }
          ]
        }
      }
    }
  ]
}
```

---

## ⚠️ Notas Importantes

1. **Reproduzibilidade Não é 100%**
   - Mesmo seed pode gerar imagens ligeiramente diferentes em hardware diferente
   - Para reprodução exata, use mesmo hardware + mesma versão do modelo

2. **Seed Range**
   - Valores válidos: 0 a 4,294,967,295 (2^32 - 1)
   - Valores fora do range serão normalizados

3. **Performance**
   - Usar seed não afeta performance
   - Tempo de geração é o mesmo

---

**Status:** ✅ Totalmente funcional
**Versão:** 2.2.0
**Data:** 04/02/2026
