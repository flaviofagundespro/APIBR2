# APIBR2 — Current Status

**Date:** 2026-02-16
**Version:** 2.2.0
**Platform:** Ubuntu + AMD ROCm (migrated from Windows in 2026)
**Status:** ✅ All core features operational

---

## ✅ Implemented Features

### 🌐 Web Scraping
- [x] **Puppeteer scraping** — Full-page screenshots, dynamic content extraction
- [x] **JavaScript scraping** — Custom script execution on target pages
- [x] **Screenshot scraping** — High-fidelity captures
- [x] **YouTube scraping** — Video info, comments, transcript extraction
- [x] **Instagram scraping** — Media downloader

### 🎨 AI Image Generation (`ultra_optimized_server.py`, port 5001)
- [x] **Stable Diffusion 1.5** — Fully optimized for AMD ROCm
- [x] **SDXL Turbo** — Ultra-fast (4-6 steps, ~6s on GPU)
- [x] **DreamShaper 8** — Artistic style generation
- [x] **Base64 response** — Optimized for n8n integration
- [x] **Pipeline caching** — Models stay loaded in memory
- [x] **ROCm GPU acceleration** — RX 6750 XT (gfx1030), torch 2.5.1+rocm6.2

### 🎙️ Audio Studio (`audio_server.py`, port 5002)
- [x] **TTS** (`POST /tts`) — edge-tts, 7 voices (PT-BR, EN, ES, DE), ~1.2s
- [x] **Voice list** (`GET /voices`) — Available TTS voices
- [x] **Clone voice** (`POST /clone`) — edge-tts fallback (true cloning not yet implemented)
- [x] **Transcription** (`POST /transcribe`) — transformers pipeline, **12.5x real-time** on ROCm GPU
- [x] **Speaker diarization** (`POST /transcribe-speakers`) — pyannote 3.3.2, ~23s for 2min audio
- [x] **OGG Opus support** — WhatsApp audio format confirmed working
- [x] **ROCm GPU transcription** — whisper-large-v3-turbo, fp16, RX 6750 XT

### 🔧 Infrastructure
- [x] **Node.js API** — Main gateway (port 3000)
- [x] **Frontend dashboard** — React/Vite (port 5173) — Image Studio + Audio Studio tabs
- [x] **n8n integration** — Full JSON configuration and compatibility
- [x] **WhatsApp gateway** — Evolution API integration
- [x] **Startup scripts** — `startlinux.sh` for Ubuntu

---

## 📊 Performance Benchmarks

### Image Generation (RX 6750 XT, ROCm)
| Model | Device | Resolution | Cold Start | Warm |
|-------|--------|------------|------------|------|
| SD 1.5 | GPU (ROCm fp16) | 512×512 | ~10s | **~6s** |
| SDXL Turbo | GPU (ROCm fp16) | 512×512 | ~15s | **~6s** |

_Ubuntu ROCm is ~6.5x faster than Windows DirectML for same hardware._

### Audio Transcription (RX 6750 XT, ROCm)
| Model | Speed | 90min meeting |
|-------|-------|---------------|
| whisper-large-v3-turbo (transformers fp16) | **12.5x real-time** | **~7 min** |

---

## 🖥️ Hardware

| Component | Spec |
|-----------|------|
| OS | Ubuntu 22.04 (primary) |
| CPU | AMD Ryzen 9 7900X (12C/24T, 4.7–5.6GHz) |
| GPU | XFX AMD Radeon RX 6750 XT 12GB GDDR6 |
| RAM | 32GB DDR5 5600MHz |
| SSD | 2TB NVMe PCIe |

**Key GPU notes:**
- ROCm 6.2, `gfx1030` arch (RDNA2)
- `torch==2.5.1+rocm6.2` — locked (2.6.0+rocm6.1 breaks Conv2d on this card)
- Env var required: `HSA_OVERRIDE_GFX_VERSION=10.3.0`

---

## 🗂️ Service Map

| Service | File | Port | Status |
|---------|------|------|--------|
| Node.js API gateway | `backend/app.js` | 3000 | ✅ |
| Image generation server | `integrations/ultra_optimized_server.py` | 5001 | ✅ |
| Audio studio server | `integrations/audio_server.py` | 5002 | ✅ |
| Frontend | `frontend/` (Vite) | 5173 | ✅ |

---

## 🔑 Required Environment Variables

Located in `backend/.env` and `integrations/.env`:

```bash
# Audio
AUDIO_SERVER_URL=http://localhost:5002
HF_TOKEN=<huggingface_token>            # Required for speaker diarization
WHISPER_MODELS_PATH=/mnt/windows/Projetos/Whisper-BR/models

# Image
IMAGE_SERVER_URL=http://localhost:5001

# Evolution/WhatsApp
EVOLUTION_API_BASE_URL=https://...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=...
```

---

## ⚠️ Known Limitations

| Item | Status | Notes |
|------|--------|-------|
| Voice cloning | ⚠️ Fallback | Returns edge-tts, not real cloning. Options: OpenVoice V2, XTTS-v2, GPT-SoVITS |
| `torchcodec` | ❌ Must uninstall | Incompatible with FFmpeg 6.x. Run `pip uninstall torchcodec` after any install. |
| torch version | 🔒 Locked | Must stay at `2.5.1+rocm6.2` — do not upgrade |

---

## 🚀 Startup

```bash
# Start all services (Ubuntu)
./startlinux.sh

# Or manually:
node backend/server.js &
python integrations/ultra_optimized_server.py &
python integrations/audio_server.py &
cd frontend && npm run dev &
```

---

## 📋 Next Steps

1. **Voice cloning** — Implement real cloning (OpenVoice V2 is easiest; XTTS-v2 for best PT-BR quality)
2. **Authentication** — JWT or API key for public exposure
3. **Batch transcription** — Queue system for multiple audio files
4. **TikTok cookie management** — Improve cookie extraction UX

---

**Last updated:** 2026-02-16
