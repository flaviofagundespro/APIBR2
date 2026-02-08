# APIBR2 - Geração Real de Imagens com Stable Diffusion

## 🎨 **IMAGENS REAIS COM IA!**

Agora você tem um servidor Python que gera **imagens reais** usando Stable Diffusion 3.5!

## 🚀 **Como usar:**

### **1. Iniciar o servidor real:**
```bash
# Na pasta integrations
cd "C:\Projetos\APIBR2\integrations"

# Opção 1: Script batch (recomendado)
start_real_server.bat

# Opção 2: Comando direto
python real_image_server.py
```

### **2. Primeira execução:**
- O modelo Stable Diffusion 3.5 será baixado automaticamente
- Pode demorar alguns minutos na primeira vez
- O modelo fica em cache para próximas execuções

### **3. Testar no n8n:**
- **URL**: `http://apibr.giesel.com.br:3000/api/v1/image/generate`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "prompt": "Um gato fofo sentado em um jardim colorido",
  "model": "stabilityai/stable-diffusion-3.5",
  "size": "1024x1024"
}
```

## 📊 **Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "image_url": "http://apibr.giesel.com.br/images/stable-diffusion-3.5_1234567890_abc123.png",
    "local_path": "generated_images\\stable-diffusion-3.5_1234567890_abc123.png",
    "prompt": "Um gato fofo sentado em um jardim colorido",
    "model": "stabilityai/stable-diffusion-3.5",
    "size": "1024x1024",
    "timestamp": "2025-07-05T06:30:00.000000"
  },
  "metadata": {
    "model": "stabilityai/stable-diffusion-3.5",
    "generation_time": 8.5,
    "steps": 30,
    "guidance_scale": 7.5,
    "timestamp": "2025-07-05T06:30:00.000000"
  }
}
```

## ⚙️ **Parâmetros disponíveis:**

### **Básicos:**
- `prompt` (obrigatório): Descrição da imagem
- `model`: Modelo a usar (padrão: "stabilityai/stable-diffusion-3.5")
- `size`: Tamanho da imagem (padrão: "1024x1024")

### **Avançados:**
- `steps`: Número de passos de inferência (padrão: 30)
- `guidance_scale`: Escala de orientação (padrão: 7.5)
- `width`: Largura em pixels (padrão: 1024)
- `height`: Altura em pixels (padrão: 1024)

## 🎯 **Exemplos de prompts:**

### **Realista:**
```json
{
  "prompt": "Um gato persa branco sentado em um jardim de rosas, fotografia profissional, alta qualidade"
}
```

### **Artístico:**
```json
{
  "prompt": "Um gato astronauta flutuando no espaço, estilo aquarela, cores vibrantes"
}
```

### **Fantasia:**
```json
{
  "prompt": "Um gato mágico com asas de borboleta, cercado por fadas, estilo fantasia"
}
```

## 🔧 **Troubleshooting:**

### **Erro de memória:**
- Reduza `steps` para 20 ou 15
- Use `width` e `height` menores (512x512)

### **Modelo não carrega:**
- Verifique conexão com internet
- Aguarde o download completar
- Verifique espaço em disco

### **Imagem não gera:**
- Verifique se o prompt é adequado
- Tente prompts mais simples
- Verifique logs do servidor

## 📈 **Performance:**

- **Primeira geração**: ~30-60 segundos (carregamento do modelo)
- **Gerações subsequentes**: ~8-15 segundos
- **Qualidade**: Alta (Stable Diffusion 3.5)
- **Tamanho**: 1024x1024 pixels

## 🎉 **Próximos passos:**

1. **Flux**: Quando tiver o modelo/sdk do Flux
2. **Edição**: Implementar edição de imagens
3. **Upscale**: Implementar upscale de imagens
4. **Cache**: Cache de imagens geradas
5. **Autenticação**: Sistema de autenticação

---

**Agora você tem geração real de imagens com IA!** 🎨✨ 