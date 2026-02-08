# APIBR2 - Guia para GPU AMD (Radeon)

## 🎯 **Suporte Otimizado para GPU AMD no Windows**

Este guia mostra como usar sua GPU AMD Radeon para geração de imagens com Stable Diffusion usando DirectML.

## 🚀 **Instalação Rápida:**

### **1. Instalar suporte AMD:**
```bash
# Execute o script de instalação
install_amd_support.bat

# Ou manualmente:
pip uninstall torch torchvision torchaudio -y
pip install torch-directml
pip install onnxruntime-directml
pip install --upgrade huggingface_hub
```

### **2. Iniciar servidor AMD otimizado:**
```bash
python real_image_server_amd.py
```

### **3. Testar:**
```bash
.\test_simple.ps1
```

## ⚡ **Modelos Recomendados para AMD:**

### **Modelos Públicos (funcionam sem token):**

| Modelo | Qualidade | Velocidade | VRAM | Recomendado |
|--------|-----------|------------|------|-------------|
| `runwayml/stable-diffusion-v1-5` | Boa | Média | ~4GB | ✅ **Sim** |
| `stabilityai/sdxl-turbo` | Boa | Muito rápida | ~6GB | ✅ **Sim** |
| `lykon/dreamshaper-8` | Artística | Média | ~4GB | ✅ **Sim** |

### **Modelos Premium (requerem token):**
| Modelo | Qualidade | Velocidade | VRAM | Status |
|--------|-----------|------------|------|--------|
| `stabilityai/stable-diffusion-3.5` | Excelente | Lenta | ~8GB | ⚠️ Requer token |
| `stabilityai/stable-diffusion-3.5-large` | Excelente | Muito lenta | ~12GB | ⚠️ Requer aprovação |

## 🎨 **Exemplos de uso no n8n:**

### **Modelo Público (recomendado):**
```json
{
  "url": "http://apibr.giesel.com.br:3000/api/v1/image/generate",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "prompt": "Um gato fofo sentado em um jardim colorido",
    "model": "runwayml/stable-diffusion-v1-5",
    "size": "512x512",
    "steps": 20
  }
}
```

### **SDXL Turbo (muito rápido):**
```json
{
  "body": {
    "prompt": "Um gato astronauta no espaço, estilo cartoon",
    "model": "stabilityai/sdxl-turbo",
    "size": "512x512",
    "steps": 10
  }
}
```

## 🔧 **Otimizações Automáticas:**

O servidor AMD aplica automaticamente:

- **Attention Slicing**: Reduz uso de VRAM
- **VAE Slicing**: Otimiza decodificação
- **Float32**: Melhor compatibilidade com DirectML
- **Tamanho 512x512**: Balance entre qualidade e velocidade

## 📊 **Performance Esperada:**

### **GPU AMD Radeon:**
- **Primeira geração**: 30-60 segundos (download do modelo)
- **Gerações subsequentes**: 15-30 segundos
- **Qualidade**: Boa a muito boa
- **VRAM**: 4-8GB recomendado

### **Comparação:**
| Device | Velocidade | Qualidade | Estabilidade |
|--------|------------|-----------|--------------|
| NVIDIA CUDA | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| AMD DirectML | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| CPU | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔍 **Troubleshooting:**

### **Erro: "DirectML not available"**
```bash
# Verificar instalação
python -c "import torch; print('DirectML:', hasattr(torch, 'dml'))"

# Reinstalar se necessário
pip uninstall torch-directml -y
pip install torch-directml
```

### **Erro: "Out of memory"**
- Reduza `steps` para 15-20
- Use `size` 512x512
- Feche outros programas que usam GPU

### **Erro: "Model not found"**
- Use modelos públicos listados acima
- Verifique conexão com internet
- Aguarde download completar

### **Erro: "Token required"**
- Use modelos públicos
- Ou configure token Hugging Face:
```bash
huggingface-cli login --token hf_seuTokenAqui
```

## 🎯 **Dicas para melhor performance:**

### **1. Configurações otimizadas:**
```json
{
  "steps": 20,
  "guidance_scale": 7.5,
  "size": "512x512"
}
```

### **2. Prompts eficientes:**
```
✅ Bom: "Um gato fofo no jardim"
❌ Evite: "Um gato extremamente detalhado com texturas complexas..."
```

### **3. Monitoramento:**
- Use Task Manager para monitorar uso de GPU
- Mantenha pelo menos 2GB de VRAM livre

## 🎉 **Próximos passos:**

1. **Teste com modelo público**: `runwayml/stable-diffusion-v1-5`
2. **Experimente SDXL Turbo**: Para gerações rápidas
3. **Configure token**: Para modelos premium
4. **Ajuste parâmetros**: Para sua GPU específica

---

**Agora você tem geração otimizada para GPU AMD!** 🎨✨ 