# APIBR2 — Documentation Index

**Version:** 2.2.0
**Platform:** Ubuntu + AMD ROCm
**Last updated:** 2026-02-16

---

## Notes & Status

| File | Description |
|------|-------------|
| `CURRENT_STATUS.md` | Full feature status, benchmarks, service map |
| `PROJECT_SUMMARY.md` | Architecture overview and technical achievements |
| `audio-studio-status-2026-02-16.md` | Audio Studio implementation details, gotchas, voice cloning roadmap |
| `VOICEBOX_RESEARCH_2026-02-21.md` | Research log: Voicebox (Qwen3-TTS) viability for APIBR2 |
| `LIMPEZA_COMPLETA.md` | Historical cleanup log |

## Guides

| File | Description |
|------|-------------|
| `docs/guides/QUICK_START.md` | Getting started for new contributors |
| `docs/guides/STARTUP_SCRIPTS.md` | Startup scripts reference |
| `docs/guides/LOCAL_STACK_MAP.md` | Technical service map + local run checklist |
| `docs/guides/MANUAL_CURL.md` | cURL examples for all endpoints |

## AI / ML Docs

| File | Description |
|------|-------------|
| `docs/_ai/README.md` | AI/ML documentation index |
| `docs/_ai/ROCM_MIGRATION.md` | Ubuntu + ROCm migration notes |
| `docs/_ai/gpu/AMD_SETUP.md` | AMD GPU setup guide |
| `docs/_ai/api/IMAGE_API.md` | Image generation API reference |

---

## Service Ports

| Port | Service |
|------|---------|
| 3000 | Node.js API gateway |
| 5001 | Python image generation server |
| 5002 | Python audio studio server |
| 5003 | Python chat/LLM proxy (Ollama client) |
| 5004 | Python universal downloader (Instagram/TikTok/YouTube/Facebook) |
| 11434 | Ollama server (CPU-only, local) |
| 5173 | React/Vite frontend |

---

## Quick API Reference

```bash
# Health
GET  http://localhost:3000/health

# Image generation
POST http://localhost:3000/api/v1/image/generate
     { "prompt": "...", "model": "sd-1.5", "steps": 20 }

# Audio TTS
POST http://localhost:3000/api/v1/audio/generate-speech
     { "text": "...", "voice": "pt-BR-FranciscaNeural", "language": "pt" }

# Transcription
POST http://localhost:3000/api/v1/audio/transcribe
     multipart: audio (file), language ("pt"|"en"|"de"|"es")

# Speaker diarization
POST http://localhost:3000/api/v1/audio/transcribe-meeting
     multipart: audio (file), language, max_speakers (default 8)

# Web scraping
POST http://localhost:3000/api/scrape
     { "url": "https://example.com", "strategy": "puppeteer" }
```
