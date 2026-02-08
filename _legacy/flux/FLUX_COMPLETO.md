# 🎉 FLUX.1 - Instalação Completa!

## ✅ Status: INSTALADO (54GB)

O FLUX.1-schnell foi baixado com sucesso! Tamanho maior que o esperado porque inclui todas as variantes e checkpoints.

## 🔧 Otimizações Aplicadas

Para fazer o FLUX funcionar na sua **RX 6750 XT (12GB VRAM)**, implementei:

### 1. Sequential CPU Offload
- Move componentes do modelo para GPU apenas quando necessário
- Economiza ~6-8GB de VRAM comparado ao carregamento normal

### 2. VAE Tiling e Slicing
- Processa imagens em blocos menores
- Permite gerar imagens maiores sem estourar memória

### 3. Variável de Ambiente
```bash
export PYTORCH_HIP_ALLOC_CONF=expandable_segments:True
```
- Evita fragmentação de memória no ROCm

## 🚀 Como Usar

### No Servidor de Imagens

O servidor já está atualizado. Basta iniciar com o token:

```bash
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
export HUGGINGFACE_HUB_TOKEN=$(grep HUGGINGFACE_HUB_TOKEN ../.env | cut -d= -f2)
export PYTORCH_HIP_ALLOC_CONF=expandable_segments:True
python ultra_optimized_server.py
```

### No Frontend

1. Abra http://localhost:5173
2. Vá para "Image Studio"
3. Selecione "FLUX.1 [Schnell]"
4. Configure:
   - **Resolução:** Comece com 512x512 (mais rápido)
   - **Steps:** 4 (padrão)
   - **Guidance:** 0.0 (FLUX ignora)

## 📊 Performance Esperada

| Resolução | Tempo (Primeira) | Tempo (Seguintes) | VRAM |
|-----------|------------------|-------------------|------|
| 512x512   | ~40-60s          | ~20-30s           | ~8GB |
| 768x768   | ~60-90s          | ~30-45s           | ~10GB |
| 1024x1024 | ~90-120s         | ~45-60s           | ~11GB |

**Nota:** Primeira geração é mais lenta (carrega modelo na GPU)

## 🎨 Prompts Recomendados

O FLUX é excelente com:

### Texto nas Imagens
```
A neon sign that says "APIBR2" in a cyberpunk city
```

### Fotorrealismo
```
Professional photo of a sunset over mountains, golden hour, 8k, sharp focus
```

### Detalhes Complexos
```
Intricate mechanical watch, macro photography, studio lighting, highly detailed
```

## ⚠️ Troubleshooting

### Erro: Out of Memory

**Solução 1:** Feche outros programas usando GPU
```bash
# Ver processos usando GPU
rocm-smi
```

**Solução 2:** Gere em resolução menor
- Comece com 256x256 ou 512x512
- Aumente gradualmente

**Solução 3:** Reinicie o sistema
- Limpa completamente a VRAM

### Erro: Geração muito lenta

**Causa:** Primeira geração sempre é lenta (carrega modelo)
**Solução:** Gerações subsequentes serão ~2x mais rápidas

### Comparação com DreamShaper

| Aspecto | DreamShaper 8 | FLUX.1 |
|---------|---------------|---------|
| **Velocidade** | ⚡⚡⚡⚡⚡ (20s) | ⚡⚡⚡ (30s) |
| **Qualidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Texto** | ❌ Ruim | ✅ Perfeito |
| **Realismo** | Bom | Excepcional |
| **VRAM** | 4GB | 8-11GB |
| **Resolução** | 512x512 | 1024x1024 |

## 🎯 Quando Usar Cada Modelo

### Use DreamShaper 8 quando:
- Precisa de velocidade máxima
- Quer estilo artístico/ilustrativo
- Não precisa de texto nas imagens
- Gerando muitas imagens rapidamente

### Use FLUX.1 quando:
- Precisa de fotorrealismo extremo
- Quer texto perfeito nas imagens
- Qualidade é mais importante que velocidade
- Gerando imagens para apresentações/marketing

## 📝 Próximos Passos

1. ✅ Teste o FLUX com `test_flux_optimized.py`
2. ✅ Inicie o servidor com as otimizações
3. ✅ Gere sua primeira imagem no frontend
4. 🎨 Experimente diferentes prompts!

---

**Status:** 🟢 Pronto para uso
**Tamanho:** 54GB (cached)
**Otimizado para:** AMD RX 6750 XT (12GB)
