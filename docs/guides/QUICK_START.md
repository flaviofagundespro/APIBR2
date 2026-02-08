# 🚀 APIBR2 - Início Rápido

## ⚡ Inicialização em 3 Passos

### 1. Iniciar Backend Node.js
```bash
cd backend
npm install
npm start
```
**Resultado**: API rodando em `http://localhost:3000`

### 2. Iniciar Servidor Python de IA
```bash
cd integrations
pip install -r requirements.txt
python ultra_optimized_server.py
```
**Resultado**: Servidor IA rodando em `http://localhost:5001`

### 3. Testar Sistema
```bash
# PowerShell
./test_ultra.ps1

# ou cURL
curl -X GET http://localhost:3000/api/health
```

## 🎯 Testes Rápidos

### Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

### Scraping Simples
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "strategy": "puppeteer"}'
```

### Geração de Imagem
```bash
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Um gato fofo", "model": "stable-diffusion-1.5"}'
```

## 📋 Checklist de Verificação

### ✅ Sistema Funcionando
- [ ] Backend Node.js rodando na porta 3000
- [ ] Servidor Python rodando na porta 5001
- [ ] Health check retorna 200
- [ ] Scraping funcionando
- [ ] Geração de imagens funcionando

### ✅ Integração n8n
- [ ] Importar `apibr2-image-api.json`
- [ ] Configurar variáveis de ambiente
- [ ] Testar endpoints no n8n

## 🔧 Configurações Essenciais

### Variáveis de Ambiente
```bash
# Backend (.env)
PORT=3000
PYTHON_SERVER_URL=http://localhost:5001

# Python (ultra_optimized_server.py)
UPLOAD_FOLDER=generated_images
FLASK_ENV=development
```

### Portas Importantes
- **3000**: Backend Node.js
- **5001**: Servidor Python IA
- **5678**: n8n (se local)

## 🚨 Solução de Problemas

### Erro 503 - Servidor Python não responde
```bash
# Verificar se está rodando
curl http://localhost:5001/health

# Reiniciar servidor
python ultra_optimized_server.py
```

### Erro 500 - SDXL Turbo
- Use `stable-diffusion-1.5` ou `dreamshaper`
- SDXL Turbo ainda em ajustes

### Erro de Dependências
```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

## 📱 Integração n8n

### 1. Importar Configuração
- Abrir n8n
- Importar `apibr2-image-api.json`
- Configurar credenciais

### 2. Testar Endpoints
- Health Check: `GET /api/health`
- Scraping: `POST /api/scrape`
- Imagens: `POST /api/v1/image/generate`

### 3. Configurar Workflows
- Web scraping automático
- Geração de imagens em massa
- Processamento de mídia

## 🎨 Modelos de IA Disponíveis

### ✅ Funcionando Perfeitamente
- `stable-diffusion-1.5` - Rápido e confiável
- `dreamshaper` - Qualidade artística

### ⚠️ Em Ajustes
- `sdxl-turbo` - Rápido mas instável
- `flux` - Preparado para integração

## 📊 Monitoramento

### Logs Importantes
```bash
# Backend
tail -f backend/logs/app.log

# Python
# Logs aparecem no console
```

### Métricas
- Tempo de resposta < 30s para imagens
- Taxa de sucesso > 95%
- Uso de memória < 4GB

## 🔄 Comandos Úteis

### Reiniciar Tudo
```bash
# Terminal 1
cd backend && npm start

# Terminal 2  
cd integrations && python ultra_optimized_server.py
```

### Teste Completo
```bash
./test_ultra.ps1
```

### Limpar Cache
```bash
# Limpar imagens geradas
rm -rf integrations/generated_images/*
```

## 📞 Suporte Rápido

### Problemas Comuns
1. **Porta ocupada**: Mudar porta no `.env`
2. **Dependências**: `pip install -r requirements.txt`
3. **Memória**: Reiniciar servidor Python
4. **n8n**: Verificar URL da API

### Logs de Debug
```bash
# Backend detalhado
npm run dev

# Python detalhado
python ultra_optimized_server.py --debug
```

---

**🎯 Objetivo**: Sistema funcionando em < 5 minutos  
**✅ Status**: Pronto para uso  
**📚 Documentação**: `/docs` para detalhes completos 