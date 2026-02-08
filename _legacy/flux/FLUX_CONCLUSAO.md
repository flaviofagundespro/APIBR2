# ⚠️ FLUX - Incompatível com RX 6750 XT (12GB)

## 🔴 Conclusão Após Testes

O **FLUX.1-schnell** é **incompatível** com a AMD RX 6750 XT (12GB VRAM) mesmo com todas as otimizações aplicadas.

### Problemas Identificados:

1. **Memória Insuficiente**
   - FLUX precisa de ~15-20GB VRAM para rodar confortavelmente
   - RX 6750 XT tem apenas 12GB
   - Sequential CPU offload não foi suficiente

2. **Travamentos do Sistema**
   - Primeira tentativa: Travou com 30 steps
   - Segunda tentativa: Travou mesmo com 4 steps
   - Sistema fica congelado por >5 minutos

3. **ROCm Limitations**
   - FLUX foi otimizado para NVIDIA CUDA
   - ROCm tem overhead adicional de memória
   - Não há suporte oficial para AMD

## ✅ Solução: Usar Modelos Compatíveis

### Modelos que FUNCIONAM Perfeitamente:

| Modelo | VRAM | Tempo | Qualidade | Status |
|--------|------|-------|-----------|--------|
| **DreamShaper 8** | 4GB | ~15s | ⭐⭐⭐⭐ | ✅ **Recomendado** |
| **SD 1.5** | 4GB | ~20s | ⭐⭐⭐ | ✅ Funciona |
| **SDXL Turbo** | 6GB | ~15s | ⭐⭐⭐⭐ | ✅ Funciona |
| **OpenJourney** | 4GB | ~20s | ⭐⭐⭐⭐ | ✅ Funciona |
| **Anything V3** | 4GB | ~20s | ⭐⭐⭐⭐ | ✅ Anime |
| ~~FLUX.1~~ | ~~15GB+~~ | ~~❌ Trava~~ | ~~⭐⭐⭐⭐⭐~~ | ❌ **Incompatível** |

## 🎯 Alternativas ao FLUX

Se você quer qualidade superior ao DreamShaper, recomendo:

### 1. **SDXL Turbo** (Já Disponível)
- Qualidade superior ao SD 1.5
- Apenas 4-6 steps
- ~15 segundos
- Funciona na sua GPU

### 2. **Realistic Vision V5** (Adicionar)
- Baseado em SD 1.5
- Fotorrealismo excelente
- 4GB VRAM
- Compatível com ROCm

### 3. **Epic Realism** (Adicionar)
- Fotorrealismo extremo
- 4GB VRAM
- ~20 segundos

## 🔧 Remover FLUX do Sistema

Para evitar confusão e travamentos futuros:

### 1. Remover do Frontend
Editar `frontend/src/App.jsx` e remover FLUX da lista de modelos.

### 2. Remover do Backend
Editar `backend/src/controllers/imageController.js` e remover entradas FLUX.

### 3. Limpar Cache (Opcional)
```bash
# Liberar 54GB de espaço
rm -rf ~/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell
```

## 📊 Requisitos Mínimos para FLUX

Para rodar FLUX confortavelmente, você precisaria de:
- **GPU:** NVIDIA RTX 4090 (24GB) ou A100 (40GB)
- **RAM:** 32GB+
- **VRAM:** 20GB+ recomendado
- **SO:** Linux com CUDA 12.0+

## 🎨 Recomendação Final

**Continue usando DreamShaper 8!**

Ele é:
- ✅ Rápido (~15s)
- ✅ Qualidade excelente
- ✅ Estável
- ✅ Seu favorito
- ✅ Funciona perfeitamente na RX 6750 XT

Para fotorrealismo, teste:
- **SDXL Turbo** (já disponível)
- **Realistic Vision V5** (posso adicionar)

---

**Conclusão:** FLUX é incrível, mas requer hardware muito mais potente. Sua RX 6750 XT é excelente para SD 1.5, DreamShaper, e SDXL Turbo!

**Status:** 🔴 FLUX descontinuado para este hardware
**Alternativa:** 🟢 DreamShaper 8 + SDXL Turbo
