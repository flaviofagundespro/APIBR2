# APIBR2 — Project Summary

**Date:** 2026-02-16
**Version:** 2.2.0
**Status:** ✅ Production-ready on Ubuntu + AMD ROCm

---

## Architecture

### Node.js Backend (Port 3000)
- REST API gateway — handles routing, validation, and orchestration
- Proxies compute-heavy tasks to Python services
- WhatsApp gateway via Evolution API

### Python AI Services
| Service | File | Port | Description |
|---------|------|------|-------------|
| Image Server | `ultra_optimized_server.py` | 5001 | Stable Diffusion (SD 1.5, SDXL Turbo, DreamShaper) via ROCm |
| Audio Server | `audio_server.py` | 5002 | TTS + transcription + speaker diarization via ROCm |

### Frontend (Port 5173)
- React/Vite dashboard
- **Image Studio** — txt2img, img2img
- **Audio Studio** — txt→audio (TTS + voice clone), audio→txt (transcription + diarization)

### n8n Integration
- Native JSON configuration support
- Supports chained workflows (scrape → summarize → generate image)

---

## GPU Strategy: AMD ROCm

All GPU inference runs via **AMD ROCm** on the RX 6750 XT (`gfx1030`, RDNA2).

- `torch==2.5.1+rocm6.2` — locked version (2.6.0+rocm6.1 breaks Conv2d on this card)
- Image generation: ~6s warm (vs ~40s on Windows/DirectML)
- Audio transcription: **12.5x real-time** (whisper-large-v3-turbo, fp16)

DirectML is no longer used. All references to Windows/DirectML in older docs are historical only.

---

## Key Features

### Web Scraping
- Puppeteer full-browser automation
- YouTube metadata and transcript extraction
- Instagram media downloading

### Image Generation
- Stable Diffusion 1.5, SDXL Turbo, DreamShaper 8
- Runtime model switching, pipeline caching, automatic device fallback
- Base64 response format for n8n compatibility

### Audio Processing
- Text-to-speech: 7 voices across PT-BR, EN, ES, DE
- Transcription: whisper-large-v3-turbo, OGG Opus (WhatsApp) + WAV/MP3/FLAC/M4A
- Speaker diarization: pyannote 3.3.2 (requires `HF_TOKEN`)

---

## How to Run (Linux)

```bash
# Install dependencies
cd backend && npm install
cd ../integrations && pip install -r requirements.txt
pip uninstall torchcodec -y  # Required: incompatible with FFmpeg 6.x

# Start all services
./startlinux.sh

# Or individually:
python integrations/ultra_optimized_server.py &  # Port 5001
python integrations/audio_server.py &             # Port 5002
node backend/server.js &                          # Port 3000
cd frontend && npm run dev &                      # Port 5173
```

---

## Technical Achievements

1. **Hybrid architecture** — Node.js (I/O-bound) + Python (GPU-bound)
2. **ROCm GPU acceleration** — Full AMD support without NVIDIA dependency
3. **12.5x real-time transcription** — Entire meeting transcribed in minutes
4. **Local AI** — No external paid APIs for image or audio generation
5. **WhatsApp integration** — Evolution API for message-based workflows

---

**APIBR2** — Professional Web Scraping and AI Media Production API
**Platform:** Ubuntu + AMD ROCm
