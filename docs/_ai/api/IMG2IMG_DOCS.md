# 🎨 img2img - Documentação Completa da API

## ✅ Status: Backend Python Implementado!

### Endpoint
```
POST http://localhost:5001/img2img
```

---

## 📋 Parâmetros

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `image` | File | ✅ Sim | - | Imagem base (PNG/JPG/WEBP) |
| `prompt` | string | Não | "" | O que transformar |
| `model` | string | Não | dreamshaper-8 | Modelo a usar |
| `steps` | int | Não | 20 | Passos de geração |
| `guidance_scale` | float | Não | 7.5 | Força do prompt |
| `strength` | float | Não | 0.75 | Quanto transformar (0.0-1.0) |
| `seed` | int | Não | random | Seed para reprodução |

---

## 🎯 Strength - Guia Completo

O parâmetro `strength` controla o quanto a imagem original é preservada:

### 0.0 - 0.3: Ajustes Sutis
- Iluminação
- Cores
- Pequenos detalhes
- **Exemplo:** "mesma imagem, iluminação mais quente"

### 0.4 - 0.6: Mudanças Médias
- Roupas
- Acessórios
- Expressões
- **Exemplo:** "mesma pessoa, vestido vermelho"

### 0.7 - 0.9: Transformações Grandes
- Postura
- Estilo artístico
- Composição
- **Exemplo:** "mesma cena, estilo anime"

### 1.0: Completamente Novo
- Ignora imagem original
- Usa apenas como referência vaga
- **Exemplo:** Não recomendado para img2img

---

## 📡 Exemplos de Uso

### Exemplo 1: Mudar Roupa (cURL)

```bash
curl -X POST http://localhost:5001/img2img \
  -F "image=@foto_pessoa.jpg" \
  -F "prompt=mesma pessoa, vestido vermelho elegante" \
  -F "strength=0.6" \
  -F "steps=20" \
  -F "model=lykon/dreamshaper-8"
```

### Exemplo 2: Estilo Artístico (Python)

```python
import requests

with open('foto.jpg', 'rb') as f:
    files = {'image': f}
    data = {
        'prompt': 'mesma cena, estilo aquarela',
        'strength': 0.8,
        'steps': 25,
        'seed': 42
    }
    
    response = requests.post(
        'http://localhost:5001/img2img',
        files=files,
        data=data
    )
    
    result = response.json()
    print(f"Seed usado: {result['metadata']['seed']}")
    print(f"Tempo: {result['metadata']['generation_time']}s")
```

### Exemplo 3: Ajuste Sutil (JavaScript/Node.js)

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('image', fs.createReadStream('foto.png'));
form.append('prompt', 'mesma imagem, cores mais vibrantes');
form.append('strength', '0.3');
form.append('steps', '15');

axios.post('http://localhost:5001/img2img', form, {
    headers: form.getHeaders()
}).then(response => {
    console.log('Seed:', response.data.metadata.seed);
    console.log('Tempo:', response.data.metadata.generation_time);
});
```

---

## 📊 Response

```json
{
  "success": true,
  "data": {
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "image_url": "http://apibr.giesel.com.br/images/dreamshaper-8_img2img_xxx.png",
    "local_path": "/path/to/image.png",
    "prompt": "mesma pessoa, vestido vermelho",
    "model": "lykon/dreamshaper-8",
    "input_size": "512x512",
    "output_size": "512x512",
    "timestamp": "2026-02-04T00:00:00"
  },
  "metadata": {
    "model": "lykon/dreamshaper-8",
    "generation_time": 12.5,
    "steps": 20,
    "guidance_scale": 7.5,
    "strength": 0.6,
    "seed": 123456,
    "device": "cuda",
    "type": "img2img",
    "timestamp": "2026-02-04T00:00:00"
  }
}
```

---

## 🎨 Casos de Uso Práticos

### 1. E-commerce: Trocar Cor de Produto
```bash
strength=0.4
prompt="mesmo produto, cor azul"
```

### 2. Fotografia: Ajustar Iluminação
```bash
strength=0.2
prompt="mesma foto, golden hour lighting"
```

### 3. Design: Variações de Estilo
```bash
strength=0.8
prompt="mesmo design, estilo minimalista"
```

### 4. Retratos: Mudar Expressão
```bash
strength=0.5
prompt="mesma pessoa, sorrindo"
```

### 5. Arquitetura: Mudar Materiais
```bash
strength=0.6
prompt="mesmo prédio, fachada de vidro"
```

---

## 🧪 Script de Teste

Execute o script de teste completo:

```bash
cd /home/flaviofagundes/Projetos/APIBR2
./scripts/utils/test_img2img.sh
```

Testa:
- ✅ img2img básico (strength=0.75)
- ✅ Mudança sutil (strength=0.3)
- ✅ Transformação grande (strength=0.9)
- ✅ Seed fixo

---

## ⚠️ Limitações e Dicas

### Limitações
1. **Tamanho:** Imagens grandes são redimensionadas para 768x768 (CUDA) ou 512x512 (CPU)
2. **Formato:** Aceita PNG, JPG, WEBP
3. **Memória:** Imagens muito grandes podem causar OOM

### Dicas
1. **Prompts Específicos:** Use "mesma pessoa", "mesmo objeto" para manter identidade
2. **Strength Progressivo:** Comece com 0.5 e ajuste
3. **Seed para Iteração:** Use seed fixo para testar diferentes prompts
4. **Modelos:** Realistic Vision melhor para fotos, DreamShaper para arte

---

## 🚀 Próximos Passos

1. ✅ Backend Python implementado
2. ⏳ Backend Node.js (proxy)
3. ⏳ Frontend (upload + preview)
4. ⏳ Galeria de variações

---

**Status:** 🟢 Backend Python pronto para uso
**Versão:** 2.3.0
**Data:** 04/02/2026
