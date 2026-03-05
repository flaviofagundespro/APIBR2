---
name: apibr2-tts-ab-cleanup
description: Executa teste A/B de TTS no APIBR2 (priorizando XTTS finetuned) e limpa artefatos temporários de áudio de forma segura.
---

# APIBR2 TTS A/B + Cleanup

## Quando usar
- Comparar engines TTS de forma rápida (A/B) sem poluir disco.
- Encerrar experimentos e remover arquivos de teste volumosos.
- Padronizar decisão de promoção para produção (manter XTTS ou não).

## Pré-requisitos
- Projeto em: `/home/flaviofagundes/Projetos/APIBR2`
- Venv principal de áudio: `integrations/venv`
- Para smoke de API externa (opcional): `DASHSCOPE_API_KEY`

## Regras operacionais
1. Engine principal de produção é `XTTS finetuned`.
2. Toda comparação A/B deve usar a mesma frase e, quando aplicável, o mesmo áudio de referência.
3. Não manter artefatos desnecessários: preferir limpeza ao final de cada rodada.
4. Nunca apagar modelos finetuned em `backend/models/xtts_finetuned/*/current`.

## Fluxo recomendado (rápido)
1. Gerar baseline XTTS finetuned (`test_xtts_finetuned.py` ou endpoint existente).
2. Gerar alternativa de laboratório (se aplicável).
3. Comparar 3 critérios:
- Naturalidade PT-BR
- Similaridade de voz
- Latência
4. Decidir:
- Se alternativa perder em naturalidade/similaridade: manter XTTS e encerrar experimento.

## Limpeza de artefatos
Use o script do projeto:

```bash
# Dry-run (não remove, só lista)
bash scripts/cleanup_tts_artifacts.sh

# Aplicar remoção
bash scripts/cleanup_tts_artifacts.sh --apply
```

## O que o cleanup remove
- Áudios de experimento em `integrations/generated_audio` com padrões:
- `ab_*`
- `qwen*`
- `chatterbox*`
- `*_smoke_*`
- `test_*tts*.wav`

## O que o cleanup NÃO remove
- Modelos de produção/fine-tuned (`backend/models/xtts_finetuned/**`)
- Datasets (`backend/workers/xtts/datasets/**`)
- Áudios fora dos padrões acima

## Resultado esperado
- Ambiente limpo para novos testes
- Sem acúmulo de WAV/MP3 temporários
- Decisão de engine documentada por rodada A/B
