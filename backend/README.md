# APIBR - API REST para Web Scraping Local

Uma API REST profissional e production-ready para web scraping, desenvolvida para substituir a necessidade do Apify com alta performance, modularidade e recursos avançados.

## 🚀 Características Principais

- **Pool de Browsers**: Gestão inteligente de recursos com Puppeteer
- **Cache Redis**: Sistema de cache com TTL configurável
- **Rate Limiting**: Controle por IP e API Key
- **Jobs Assíncronos**: Sistema completo com webhooks
- **Métricas Prometheus**: Observabilidade completa
- **Documentação Swagger**: API auto-documentada
- **Docker Support**: Deploy simplificado
- **Graceful Shutdown**: Cleanup seguro de recursos
- **Error Recovery**: Retry exponencial automático

## 📋 Requisitos

- Node.js 18+
- Redis (opcional, para cache)
- Docker & Docker Compose (para deploy)

## 🛠️ Instalação Rápida

### Método 1: Docker (Recomendado)

```bash
# Clone o repositório
git clone <repository-url>
cd APIBR

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie com Docker (escolha 1 perfil)
# VPS recomendado (scraper + downloads + /api/aios)
docker-compose --profile vps up -d apibr-cpu redis

# Full (GPU-ready)
docker-compose --profile full up -d apibr redis

# API-only (sem downloads)
docker-compose --profile api-only up -d apibr-api redis
```

### Método 2: Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd APIBR

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# Pool de Browsers
BROWSER_POOL_SIZE=5
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Redis (Cache)
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Segurança
API_KEYS=your-api-key-1,your-api-key-2

# Logs
LOG_LEVEL=info
LOG_FORMAT=json

# Feature flags (modos de deploy)
FEATURE_IMAGE_AI=true
FEATURE_AUDIO_AI=true
FEATURE_CHAT_AI=true
FEATURE_VIDEO_DL=true
```

## 📚 Uso da API

### Endpoints Principais

- `POST /api/scrape` - Scraping síncrono
- `POST /api/scrape/async` - Scraping assíncrono
- `GET /api/jobs/:id` - Status de job
- `GET /api/metrics` - Métricas Prometheus
- `GET /api/docs` - Documentação Swagger
- `GET /health` - Health check

### Autenticação

Inclua sua API Key no header:
```
x-api-key: your-api-key
```

### Exemplos de Uso

#### 1. Scraping Básico (Síncrono)

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "strategy": "basic",
    "url": "https://example.com",
    "selectors": {
      "title": {
        "query": "h1"
      },
      "links": {
        "query": "a",
        "attribute": "href",
        "multiple": true
      }
    }
  }'
```

#### 2. Screenshot

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "strategy": "screenshot",
    "url": "https://example.com",
    "screenshotOptions": {
      "fullPage": true,
      "type": "png"
    }
  }'
```

#### 3. Scraping Assíncrono com Webhook

```bash
curl -X POST http://localhost:3000/api/scrape/async \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "strategy": "basic",
    "url": "https://example.com",
    "selectors": {
      "title": { "query": "h1" }
    },
    "webhook": {
      "url": "https://your-app.com/webhook",
      "method": "POST"
    },
    "priority": "high"
  }'
```

## 🎯 Estratégias de Scraping

### 1. Basic HTML (`basic`)
Para páginas HTML estáticas simples.

```json
{
  "strategy": "basic",
  "url": "https://example.com",
  "selectors": {
    "title": { "query": "h1" },
    "description": { "query": ".description" }
  }
}
```

### 2. JavaScript Heavy (`javascript`)
Para páginas com muito JavaScript.

```json
{
  "strategy": "javascript",
  "url": "https://spa-example.com",
  "script": "return { data: document.querySelector('.dynamic-content').textContent };"
}
```

### 3. Form Interaction (`form`)
Para interação com formulários.

```json
{
  "strategy": "form",
  "url": "https://example.com/search",
  "interactions": [
    { "type": "type", "selector": "#search", "value": "query" },
    { "type": "click", "selector": "#submit" },
    { "type": "wait", "selector": ".results" }
  ],
  "finalSelectors": {
    "results": { "query": ".result-item", "multiple": true }
  }
}
```

### 4. Screenshot (`screenshot`)
Para captura de tela.

```json
{
  "strategy": "screenshot",
  "url": "https://example.com",
  "screenshotOptions": {
    "fullPage": true,
    "type": "png",
    "quality": 90
  }
}
```

## 🐳 Deploy com Docker

### Produção (perfis)

```bash
# VPS recomendado (scraper + downloads + /api/aios)
docker-compose --profile vps up -d apibr-cpu redis
docker-compose --profile vps logs -f apibr-cpu

# Full (GPU-ready)
docker-compose --profile full up -d apibr redis
docker-compose --profile full logs -f apibr

# API-only (sem downloads)
docker-compose --profile api-only up -d apibr-api redis
docker-compose --profile api-only logs -f apibr-api

# Stop (use o mesmo profile ativo)
docker-compose --profile vps down
```

### Desenvolvimento

```bash
# Start em modo desenvolvimento
docker-compose --profile dev up -d apibr-dev
```

### Monitoramento (Opcional)

```bash
# Start com Prometheus e Grafana
docker-compose --profile monitoring up -d
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 📊 Monitoramento

### Métricas Disponíveis

- Requisições HTTP (total, duração)
- Jobs de scraping (total, duração por estratégia)
- Pool de browsers (tamanho, disponibilidade)
- Cache (operações, hit/miss)
- Webhooks (sucessos/falhas)

### Endpoints de Monitoramento

- `GET /api/metrics` - Métricas Prometheus
- `GET /api/metrics/json` - Métricas em JSON
- `GET /api/scrape/stats` - Stats do pool de browsers
- `GET /api/jobs` - Stats dos jobs
- `GET /health` - Health check

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 🔒 Segurança

### API Keys
Configure API keys no arquivo `.env`:
```env
API_KEYS=key1,key2,key3
```

### Rate Limiting
- Limite padrão: 100 requests por 15 minutos
- Configurável via variáveis de ambiente

### Headers de Segurança
- Helmet.js para headers de segurança
- CORS configurado
- Validação de entrada com Joi

## 🚀 Performance

### Pool de Browsers
- Reutilização de instâncias do Chromium
- Gestão automática de recursos
- Configuração flexível do tamanho do pool

### Cache Redis
- Cache automático de resultados
- TTL configurável
- Fallback gracioso se Redis não disponível

### Otimizações
- Compressão gzip
- Timeouts configuráveis
- Retry automático com backoff exponencial

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
src/
├── config/          # Configurações
├── controllers/     # Controladores
├── domain/          # Lógica de domínio
├── infrastructure/  # Infraestrutura (cache, browsers)
├── middlewares/     # Middlewares
├── routes/          # Rotas da API
├── services/        # Serviços
├── tests/           # Testes
└── utils/           # Utilitários
```

### Scripts Disponíveis

```bash
npm start          # Produção
npm run dev        # Desenvolvimento com watch
npm test           # Testes
npm run test:coverage  # Testes com coverage
```

## 📝 Logs

### Estrutura dos Logs

```json
{
  "level": "info",
  "message": "Request completed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "method": "POST",
  "url": "/api/scrape",
  "status": 200,
  "duration": "1234ms"
}
```

### Níveis de Log
- `error`: Erros críticos
- `warn`: Avisos importantes
- `info`: Informações gerais
- `debug`: Debug detalhado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

ISC License

## 🆘 Suporte

- Documentação: http://localhost:3000/api/docs
- Issues: [GitHub Issues]
- Email: support@apibr.com

---

**APIBR** - Sua solução completa para web scraping profissional! 🚀

