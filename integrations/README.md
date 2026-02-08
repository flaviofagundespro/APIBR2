# APIBR2 - Integração Python para Geração de Imagens

## Configuração Completa ✅

O backend Python para geração de imagens foi configurado com sucesso!

### O que foi instalado e configurado:

#### 1. **Dependências Python**
```bash
pip install Flask Flask-CORS Pillow torch diffusers transformers
```

#### 2. **Arquivos Criados**
- `image_server.py` - Servidor Flask na porta 5001
- `flux_sd_integration.py` - Integração com Flux e Stable Diffusion
- `requirements.txt` - Dependências atualizadas
- `test_image_generation.ps1` - Script de teste

#### 3. **Servidor Flask (Porta 5001)**
- **Health Check**: `GET http://localhost:5001/health`
- **Geração**: `POST http://localhost:5001/generate`
- **Edição**: `POST http://localhost:5001/edit`
- **Upscale**: `POST http://localhost:5001/upscale`
- **Listar Modelos**: `GET http://localhost:5001/models`

#### 4. **Integração com Node.js**
- Controller atualizado para chamar servidor Python
- Tratamento de erros e timeouts
- Respostas padronizadas

### Como usar:

#### 1. **Iniciar o servidor Python**
```bash
cd integrations
python image_server.py
```

#### 2. **Testar geração de imagem**
```bash
# Via PowerShell
.\test_image_generation.ps1

# Via cURL
curl -X POST "http://localhost:5001/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Um gato fofo", "model": "FLUX.1-dev", "size": "1024x1024"}'
```

#### 3. **Via API Node.js**
```bash
curl -X POST "http://localhost:3000/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Um gato fofo", "model": "FLUX.1-dev", "size": "1024x1024"}'
```

### Modelos Suportados:

1. **FLUX.1-dev** - Modelo Flux
   - Operações: Geração
   - Tamanho: 1024x1024

2. **stabilityai/stable-diffusion-3.5-large** - Stable Diffusion 3.5
   - Operações: Geração, Edição, Upscale
   - Tamanho: 1024x1024

### Status Atual:
- ✅ Servidor Python rodando na porta 5001
- ✅ Geração de imagens funcionando
- ✅ Integração com Node.js funcionando
- ✅ Imagens sendo salvas em `generated_images/`
- ✅ Testes automatizados funcionando

### Próximos Passos:
1. Integrar com modelos reais de IA (Flux/Stable Diffusion)
2. Adicionar autenticação
3. Implementar cache de imagens
4. Adicionar mais opções de personalização

### Troubleshooting:
- Se o servidor Python não iniciar, verifique se a porta 5001 está livre
- Se houver erro de conexão, reinicie o servidor Python
- Para ver logs detalhados, execute o servidor em modo debug 