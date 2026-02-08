# APIBR2 - Servidor Real de Geração de Imagens

## 🎨 **Geração Real com Stable Diffusion 3.5**

Este servidor Python gera **imagens reais** usando Stable Diffusion 3.5, integrado ao projeto APIBR2.

## 📁 **Arquivos principais:**

- `real_image_server.py` - Servidor FastAPI com Stable Diffusion real
- `start_real_server.bat` - Script para iniciar o servidor
- `test_real_server.ps1` - Script de testes PowerShell
- `REAL_IMAGE_GENERATION.md` - Guia completo de uso

## 🚀 **Início rápido:**

### **1. Instalar dependências:**
```bash
pip install -r requirements.txt
```

### **2. Iniciar servidor:**
```bash
# Opção 1: Script batch
start_real_server.bat

# Opção 2: Comando direto
python real_image_server.py
```

### **3. Testar:**
```bash
# PowerShell
.\test_real_server.ps1

# Ou manualmente
curl -X POST http://localhost:5001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Um gato fofo no jardim"}'
```

## 🔧 **Endpoints disponíveis:**

### **Health Check:**
```
GET /health
```

### **Gerar Imagem:**
```
POST /generate
{
  "prompt": "Descrição da imagem",
  "model": "stabilityai/stable-diffusion-3.5",
  "steps": 30,
  "guidance_scale": 7.5,
  "width": 1024,
  "height": 1024
}
```

### **Listar Modelos:**
```
GET /models
```

### **Servir Imagem:**
```
GET /images/{filename}
```

## ⚡ **Performance:**

- **Primeira execução**: ~30-60s (download do modelo)
- **Gerações subsequentes**: ~8-15s
- **Qualidade**: Alta (Stable Diffusion 3.5)
- **Tamanho padrão**: 1024x1024 pixels

## 🎯 **Exemplos de uso:**

### **Via n8n:**
```json
{
  "url": "http://apibr.giesel.com.br:3000/api/v1/image/generate",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "prompt": "Um gato astronauta no espaço, estilo aquarela",
    "model": "stabilityai/stable-diffusion-3.5",
    "size": "1024x1024"
  }
}
```

### **Via cURL:**
```bash
curl -X POST http://localhost:5001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Uma paisagem de montanha ao pôr do sol",
    "model": "stabilityai/stable-diffusion-3.5",
    "steps": 20,
    "guidance_scale": 7.5
  }'
```

## 🔍 **Troubleshooting:**

### **Erro de memória:**
- Reduza `steps` para 15-20
- Use `width` e `height` menores (512x512)

### **Modelo não carrega:**
- Verifique conexão com internet
- Aguarde download completar
- Verifique espaço em disco

### **Servidor não inicia:**
- Verifique se porta 5001 está livre
- Execute `python real_image_server.py` para ver logs detalhados

## 📊 **Logs e monitoramento:**

O servidor gera logs detalhados:
- Carregamento de modelos
- Tempo de geração
- Erros e exceções
- Performance metrics

## 🎉 **Próximos passos:**

1. **Flux**: Integração com modelo Flux
2. **Edição**: Edição de imagens existentes
3. **Upscale**: Melhoria de resolução
4. **Cache**: Cache de imagens geradas
5. **Autenticação**: Sistema de autenticação

---

**Agora você tem geração real de imagens com IA!** 🎨✨ 