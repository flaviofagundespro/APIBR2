# Voicebox Research — 2026-02-21

## Context
- Investigação para melhorar TTS/clonagem no APIBR2 após resultados fracos com XTTS2 fine-tuning e GPT-SoVITS.
- Candidato avaliado: `jamiepine/voicebox` (Qwen3-TTS local-first).

## Findings
1. Repositório confirmado:
   - https://github.com/jamiepine/voicebox
2. Proposta técnica:
   - Studio local open-source para clonagem de voz.
   - Backend FastAPI + API REST local.
   - Motor principal atual: Qwen3-TTS.
3. API esperada (via README/código):
   - `POST /generate`
   - `GET /profiles`
   - `POST /profiles`
   - OpenAPI em `/docs`
4. Idioma:
   - Qwen3-TTS oficial inclui suporte a português.
5. Risco principal para nosso ambiente:
   - Compatibilidade/performance em Linux + AMD ROCm (parte da comunicação do projeto mistura status de Linux build; tratar como incerto até PoC local).

## Conclusion
- **Tem chance real de melhorar qualidade out-of-the-box** versus nosso fluxo atual de fine-tune.
- Não migrar direto: fazer PoC controlado primeiro.

## Recommended Next Step (PoC)
1. Rodar Voicebox em modo dev/backend local.
2. Criar 1-2 perfis PT-BR com o mesmo conjunto curto de referência.
3. Fazer A/B contra API atual do APIBR2 (clareza, prosódia, latência, estabilidade).
4. Se aprovado, integrar por adapter no `audio_server.py` sem remover fallback atual.

## Quick References
- Voicebox: https://github.com/jamiepine/voicebox
- Qwen3-TTS: https://github.com/QwenLM/Qwen3-TTS
