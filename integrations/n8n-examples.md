# APIBR2 - Exemplos para n8n

## 🎨 Geração de Imagens

### 1. Geração Básica (Flux)
```bash
curl -X POST "http://localhost:3000/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Um gato fofo sentado em um jardim colorido",
    "model": "FLUX.1-dev",
    "size": "1024x1024"
  }'
```

### 2. Geração com Stable Diffusion 3.5
```bash
curl -X POST "http://localhost:3000/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Um cachorro brincando na praia ao pôr do sol",
    "model": "stabilityai/stable-diffusion-3.5-large",
    "size": "1024x1024"
  }'
```

### 3. Geração com Prompt Detalhado
```bash
curl -X POST "http://localhost:3000/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Uma paisagem futurista com prédios altos, carros voadores e neon azul, estilo cyberpunk",
    "model": "FLUX.1-dev",
    "size": "1024x1024"
  }'
```

## ✏️ Edição de Imagens

### 4. Editar Imagem Existente
```bash
curl -X POST "http://localhost:3000/api/v1/image/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "http://localhost:5001/images/FLUX.1-dev_1751695914_6041ce18.png",
    "prompt": "Adicionar um arco-íris no céu",
    "model": "stabilityai/stable-diffusion-3.5-large"
  }'
```

## 🔍 Upscale de Imagens

### 5. Fazer Upscale 2x
```bash
curl -X POST "http://localhost:3000/api/v1/image/upscale" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "http://localhost:5001/images/FLUX.1-dev_1751695914_6041ce18.png",
    "model": "stabilityai/stable-diffusion-3.5-large"
  }'
```

## 📋 Listar Modelos Disponíveis

### 6. Ver Modelos Suportados
```bash
curl -X GET "http://localhost:5001/models" \
  -H "Accept: application/json"
```

## 🏥 Health Check

### 7. Verificar Status do Servidor
```bash
curl -X GET "http://localhost:5001/health" \
  -H "Accept: application/json"
```

## 📊 Exemplos de Resposta

### Resposta de Sucesso (Geração)
```json
{
  "success": true,
  "data": {
    "image_url": "http://localhost:5001/images/FLUX.1-dev_1751695914_6041ce18.png",
    "local_path": "generated_images\\FLUX.1-dev_1751695914_6041ce18.png",
    "model": "FLUX.1-dev",
    "prompt": "Um gato fofo sentado em um jardim colorido",
    "size": "1024x1024",
    "timestamp": "2025-07-05T03:11:54.657587"
  },
  "metadata": {
    "generation_time": 0.011457204818725586,
    "model": "FLUX.1-dev",
    "timestamp": "2025-07-05T03:11:54.657587"
  }
}
```

### Resposta de Erro
```json
{
  "error": "Validation Error",
  "message": "Prompt is required"
}
```

## 🎯 Configuração no n8n

### HTTP Request Node:
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/image/generate`
- **Headers**: 
  - `Content-Type: application/json`
- **Body**: JSON
```json
{
  "prompt": "{{ $json.prompt }}",
  "model": "{{ $json.model || 'FLUX.1-dev' }}",
  "size": "{{ $json.size || '1024x1024' }}"
}
```

### Variáveis Disponíveis:
- `{{ $json.data.image_url }}` - URL da imagem gerada
- `{{ $json.data.prompt }}` - Prompt usado
- `{{ $json.data.model }}` - Modelo usado
- `{{ $json.metadata.generation_time }}` - Tempo de geração
- `{{ $json.success }}` - Status da operação

## 🚀 Workflow Exemplo

1. **Trigger**: Manual ou Schedule
2. **Set**: Definir prompt e modelo
3. **HTTP Request**: Chamar API de geração
4. **IF**: Verificar se success = true
5. **HTTP Request**: Baixar imagem (opcional)
6. **Save**: Salvar imagem localmente (opcional)

## ⚠️ Notas Importantes

- **Servidor Python**: Deve estar rodando na porta 5001
- **Servidor Node.js**: Deve estar rodando na porta 3000
- **Timeouts**: Configurados para 5 minutos
- **Imagens**: Salvas em `generated_images/`
- **Formato**: PNG 1024x1024 por padrão 