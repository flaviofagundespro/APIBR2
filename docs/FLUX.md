# FLUX.1 - Legacy Experiments

## Status: ❌ Incompatível / Arquivado

FLUX.1 foi testado extensivamente mas provou-se **incompatível** com a configuração atual do projeto (AMD RX 6750 XT, 12GB VRAM).

## Requisitos Mínimos

- **VRAM**: 15-20GB (GPU dedicada)
- **Plataforma recomendada**: NVIDIA CUDA
- **ROCm/DirectML**: Overhead adicional de memória, não recomendado

## Por Que Falha em 12GB VRAM

1. **Modelo muito grande**: FLUX.1 precisa de ~15-20GB VRAM para rodar confortavelmente
2. **Sequential CPU offload insuficiente**: Mesmo com offload agressivo, o sistema trava
3. **ROCm overhead**: AMD ROCm tem overhead de memória maior que CUDA
4. **Não há suporte oficial**: FLUX foi otimizado para NVIDIA

## Tentativas Realizadas

- ✅ Download e autenticação com Hugging Face
- ✅ Sequential CPU offload
- ✅ Redução de steps (30 → 4)
- ✅ Offload agressivo de memória
- ❌ Sistema trava após 4+ minutos (out of memory)

## Como Tentar (Não Recomendado)

```bash
# 1. Configure token Hugging Face
export HUGGINGFACE_HUB_TOKEN="your_token_here"

# 2. Ative o modelo no ultra_optimized_server.py
# FLUX.1-dev já está mapeado mas com warnings

# 3. Faça request
curl -X POST http://localhost:5001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "FLUX.1-dev",
    "prompt": "...",
    "steps": 4,
    "size": "512x512"
  }'

# ⚠️ Espere travamento do sistema
```

## Alternativas Recomendadas

Em vez de FLUX, use modelos que **funcionam perfeitamente** na configuração atual:

| Modelo | VRAM | Tempo | Qualidade | Status |
|--------|------|-------|-----------|--------|
| **DreamShaper 8** | 4GB | ~6s | ⭐⭐⭐⭐ | ✅ **Recomendado** |
| **SDXL Turbo** | 6GB | ~5s | ⭐⭐⭐⭐ | ✅ Rápido |
| **SD 1.5** | 4GB | ~5s | ⭐⭐⭐ | ✅ Leve |
| **OpenJourney** | 4GB | ~6s | ⭐⭐⭐⭐ | ✅ Artístico |
| **Anything V3** | 4GB | ~6s | ⭐⭐⭐⭐ | ✅ Anime |

_Tempos de geração medidos com ROCm nativo em Linux (RX 6750 XT)._

## Arquivos Relacionados

Toda documentação, scripts e testes FLUX foram movidos para `_legacy/flux/`:

- Documentação: `FLUX_*.md`, `COMO_ATIVAR_FLUX.md`
- Scripts: `download_flux.py`, `test_flux*.py`, `flux_sd_integration.py`
- Utilitários: `remove_flux_cache.sh`, `monitor_flux_download.sh`
- Logs: `flux_download.log`

## Suporte Teórico

O `integrations/ultra_optimized_server.py` mantém suporte teórico para FLUX (caso você tenha GPU com 20GB+ VRAM), mas com warnings explícitos sobre limitações.

---

**Última atualização**: 2026-02-08
**Conclusão**: Usar DreamShaper 8 ou SDXL Turbo para melhor experiência.
