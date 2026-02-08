# 🎨 img2img - Implementação Completa

## Status Atual

### ✅ Já Implementado (Backend Python)
1. Imports adicionados (UploadFile, File, PIL, BytesIO)
2. Cache `img2img_pipes` criado
3. Modelo `Img2ImgRequest` criado
4. Função `get_img2img_pipe()` implementada

### 📝 Próximo Passo: Adicionar Endpoint

Adicione o código do arquivo `IMG2IMG_ENDPOINT.txt` no arquivo `ultra_optimized_server.py` **ANTES** do endpoint `@app.get("/models")` (linha ~647).

## 🔧 Implementação Manual

### Localização
Arquivo: `/home/flaviofagundes/Projetos/APIBR2/integrations/ultra_optimized_server.py`
Linha: ~646 (após o endpoint `/generate`, antes de `@app.get("/models")`)

### Código a Adicionar
Copie todo o conteúdo de `IMG2IMG_ENDPOINT.txt` e cole no local indicado.

## 🧪 Teste Rápido (Após Adicionar)

```bash
# Reiniciar servidor Python
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
python ultra_optimized_server.py

# Testar endpoint
curl -X POST http://localhost:5001/img2img \
  -F "image=@/path/to/image.png" \
  -F "prompt=mesma pessoa, vestido vermelho" \
  -F "strength=0.75"
```

## 📊 Parâmetros do img2img

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `image` | File | obrigatório | Imagem base (PNG/JPG) |
| `prompt` | string | "" | O que mudar |
| `model` | string | dreamshaper-8 | Modelo a usar |
| `steps` | int | 20 | Passos de geração |
| `guidance_scale` | float | 7.5 | Força do prompt |
| `strength` | float | 0.75 | Quanto transformar |
| `seed` | int | null | Seed (opcional) |

### Strength (Importante!)
- **0.0-0.3:** Pequenas mudanças (cor, iluminação)
- **0.4-0.6:** Mudanças médias (roupa, acessórios)
- **0.7-0.9:** Mudanças grandes (postura, estilo)
- **1.0:** Completamente novo (ignora imagem)

## 🎯 Casos de Uso

### 1. Mudar Roupa
```bash
strength=0.6
prompt="mesma pessoa, vestido vermelho elegante"
```

### 2. Mudar Postura
```bash
strength=0.8
prompt="mesma pessoa, sentada, relaxada"
```

### 3. Mudar Estilo
```bash
strength=0.9
prompt="mesma cena, estilo anime"
```

### 4. Ajustes Sutis
```bash
strength=0.3
prompt="mesma imagem, iluminação mais quente"
```

## 🚀 Próximos Passos

Depois de adicionar o endpoint:
1. Reiniciar servidor Python
2. Testar via cURL
3. Implementar frontend (upload de imagem)
4. Adicionar ao backend Node.js

Quer que eu continue com o frontend ou prefere testar o backend primeiro?
