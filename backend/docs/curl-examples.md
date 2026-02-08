# 🧪 APIBR2 - Exemplos de cURL

## Configuração
```bash
# Substitua pela sua API key real
API_KEY="your-api-key-here"
API_BASE="http://localhost:3000"
```

## 🏥 Health Check
```bash
curl -X GET "$API_BASE/health"
```

## 📋 API Info
```bash
curl -X GET "$API_BASE/api"
```

## 📊 Métricas
```bash
curl -X GET "$API_BASE/api/metrics"
```

## 📚 Documentação Swagger
```bash
curl -X GET "$API_BASE/api/docs/spec"
```

## 🕷️ Web Scraping

### Scraping Básico
```bash
curl -X POST "$API_BASE/api/scrape" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "strategy": "basic",
    "url": "https://httpbin.org/json",
    "selectors": {
      "title": {
        "query": "h1"
      },
      "content": {
        "query": "p"
      },
      "links": {
        "query": "a",
        "attribute": "href",
        "multiple": true
      }
    }
  }'
```

### Scraping Assíncrono
```bash
curl -X POST "$API_BASE/api/scrape/async" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "strategy": "basic",
    "url": "https://httpbin.org/html",
    "selectors": {
      "title": {
        "query": "h1"
      }
    },
    "priority": "normal"
  }'
```

### Scraping com Screenshot
```bash
curl -X POST "$API_BASE/api/scrape" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "strategy": "screenshot",
    "url": "https://httpbin.org/html",
    "screenshotOptions": {
      "fullPage": true,
      "type": "png",
      "quality": 90
    }
  }'
```

### Scraping JavaScript
```bash
curl -X POST "$API_BASE/api/scrape" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "strategy": "javascript",
    "url": "https://httpbin.org/json",
    "script": "return document.title;"
  }'
```

### Estatísticas do Browser Pool
```bash
curl -X GET "$API_BASE/api/scrape/stats" \
  -H "X-API-Key: $API_KEY"
```

## 🎬 YouTube

### Scraping de Canal
```bash
curl -X POST "$API_BASE/api/youtube/scrape" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "channelUrl": "https://www.youtube.com/@thiagocalimanIA",
    "maxResults": 2,
    "sort": "popular",
    "enableOCR": false
  }'
```

### Detalhes de Video
```bash
curl -X POST "$API_BASE/api/youtube/video" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "videoUrl": "https://www.youtube.com/watch?v=3awkj2_gSes"
  }'
```

### OCR de Imagem
```bash
curl -X POST "$API_BASE/api/youtube/ocr" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "imageUrl": "https://i.ytimg.com/vi/3awkj2_gSes/hqdefault.jpg",
    "languages": "por+eng"
  }'
```

## ⚙️ Jobs
```bash
curl -X GET "$API_BASE/api/jobs" \
  -H "X-API-Key: $API_KEY"
```

## 🎵 Audio Studio

### Listar Vozes
```bash
curl -X GET "$API_BASE/api/v1/audio/voices" \
  -H "X-API-Key: $API_KEY"
```

### Gerar Speech
```bash
curl -X POST "$API_BASE/api/v1/audio/generate-speech" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "text": "Olá! Esta é uma demonstração da API de geração de áudio do APIBR2.",
    "voice": "pt-BR-1",
    "speed": 1.0,
    "pitch": 1.0
  }'
```

### Clonar Voz
```bash
curl -X POST "$API_BASE/api/v1/audio/clone-voice" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "test_voice",
    "description": "Voz de teste",
    "audio_file": "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
  }'
```

## 🖼️ Image Studio

### Gerar Imagem
```bash
curl -X POST "$API_BASE/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "prompt": "Um gato fofo sentado em um jardim colorido, estilo cartoon",
    "negative_prompt": "blur, low quality, distorted",
    "width": 512,
    "height": 512,
    "steps": 20,
    "guidance_scale": 7.5
  }'
```

### Editar Imagem
```bash
curl -X POST "$API_BASE/api/v1/image/edit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "prompt": "Adicionar um chapéu ao gato",
    "mask": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  }'
```

### Upscale Imagem
```bash
curl -X POST "$API_BASE/api/v1/image/upscale" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "scale": 2,
    "model": "esrgan"
  }'
```

## 🎬 Video Studio

### Criar Avatar
```bash
curl -X POST "$API_BASE/api/v1/video/create-avatar" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "test_avatar",
    "description": "Avatar de teste",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  }'
```

### Animar Avatar
```bash
curl -X POST "$API_BASE/api/v1/video/animate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "avatar_id": "test_avatar",
    "audio_file": "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
    "output_format": "mp4"
  }'
```

### Status do Job
```bash
curl -X GET "$API_BASE/api/v1/video/status/job_id_here" \
  -H "X-API-Key: $API_KEY"
```

## 🎭 Studio Projects

### Listar Projetos
```bash
curl -X GET "$API_BASE/api/v1/studio/projects" \
  -H "X-API-Key: $API_KEY"
```

### Criar Projeto
```bash
curl -X POST "$API_BASE/api/v1/studio/create-project" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "name": "Projeto Teste",
    "description": "Projeto de demonstração da API",
    "type": "video",
    "settings": {
      "resolution": "1080p",
      "fps": 30
    }
  }'
```

### Gerar Conteúdo
```bash
curl -X POST "$API_BASE/api/v1/studio/generate-content" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "project_id": "test_project",
    "type": "video",
    "script": "Olá! Bem-vindo ao APIBR2, uma plataforma completa de produção de mídia com IA.",
    "voice": "pt-BR-1",
    "background": "office"
  }'
```

## 🔧 Testes Rápidos

### Teste Básico (sem API key)
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

### Teste com API Key
```bash
# Substitua pela sua API key
API_KEY="sua-api-key-aqui"

# Métricas
curl -H "X-API-Key: $API_KEY" http://localhost:3000/api/metrics

# Scraping simples
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"url": "https://httpbin.org/json"}'
```

## 💡 Dicas

1. **API Key**: A maioria dos endpoints requer uma API key no header `X-API-Key`
2. **Formatação**: Use `jq` para formatação JSON bonita: `curl ... | jq '.'`
3. **Logs**: Verifique os logs do servidor para debug
4. **Dependências**: Alguns endpoints precisam das dependências Python instaladas
5. **Timeout**: Para operações longas, use `--max-time 300` no curl

## 🚨 Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se a API key está correta
- Certifique-se de que o header `X-API-Key` está presente

### Erro 500 (Internal Server Error)
- Verifique os logs do servidor
- Alguns endpoints podem precisar de dependências Python

### Erro de Conexão
- Verifique se o servidor está rodando em localhost:3000
- Use `npm start` no diretório backend para iniciar 