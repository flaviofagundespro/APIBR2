# Audio Studio — Status Report
**Date:** 2026-02-16 (last updated 2026-02-16)

## ✅ All Endpoints Working

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /health` | ✅ | Python audio server alive check |
| `GET /voices` | ✅ | Returns 7 voices (PT-BR, EN, ES, DE) |
| `POST /tts` | ✅ | edge-tts cloud TTS, ~1.2s response |
| `POST /clone` | ✅ | edge-tts fallback (not true cloning — see below) |
| `POST /transcribe` | ✅ | **GPU 12.5x real-time** (transformers pipeline, ROCm) |
| `POST /transcribe-speakers` | ✅ | Speaker diarization via pyannote 3.3.2, ~23s for 2min |

---

## 📊 Transcription Benchmarks

| Mode | Model | Device | Speed | ~90min meeting |
|------|-------|--------|-------|----------------|
| faster-whisper (removed) | large-v3 | CPU int8 | 1.1x real-time | ~82 min |
| openai-whisper (tested, not used) | large-v3 | GPU fp32 | 2.1x real-time | ~43 min |
| **transformers pipeline (current)** | **large-v3-turbo** | **GPU fp16 (ROCm)** | **12.5x real-time** | **~7 min** |

**Confirmed benchmark:** 88.7min meeting → 8.8min transcription (10.1x real-time end-to-end including model load).

---

## 🏗️ Architecture

**Python server:** `integrations/audio_server.py` — FastAPI, port 5002

**Key dependencies (locked versions):**
- `torch==2.5.1+rocm6.2` — **do NOT upgrade** (2.6.0+rocm6.1 breaks Conv2d on RX 6750 XT)
- `transformers>=4.44.0` — HuggingFace pipeline for Whisper
- `pyannote.audio==3.3.2` — speaker diarization
- `huggingface_hub==1.4.1` — **monkey-patch applied** (see Gotchas below)
- `edge-tts` — TTS cloud service
- `soundfile`, `librosa` — audio I/O

**GPU device:** `gfx1030` (RX 6750 XT, RDNA2)
- ROCm env vars set at server startup: `HSA_OVERRIDE_GFX_VERSION=10.3.0`, `PYTORCH_ROCM_ARCH=gfx1030`, `PYTORCH_TUNABLEOP_ENABLED=0`
- Model load pattern: CPU → `.to(cuda)` (avoids ROCm segfault with direct `device='cuda'`)

---

## 🔧 Gotchas & Known Issues

### 1. torchcodec incompatibility
`torchcodec` (pulled by transformers/pyannote) requires `libavutil.so.57` (FFmpeg 4.x) but Ubuntu 22.04 ships `.58` (FFmpeg 6.x).
**Fix:** `pip uninstall torchcodec` — no functionality lost (soundfile/librosa handle audio I/O).
Re-occurs when reinstalling pyannote — must uninstall again.

### 2. huggingface_hub 1.x removed `use_auth_token`
pyannote 3.3.2 internally calls `hf_hub_download(use_auth_token=...)` which no longer exists in huggingface_hub ≥1.0.
**Fix:** Monkey-patch applied at the top of `audio_server.py` (before any imports) to convert `use_auth_token` → `token`.

### 3. pyannote 4.0.4 pulls NVIDIA torch
Upgrading to pyannote 4.x triggers a pip dependency chain that installs `torch 2.10.0+cu128` (NVIDIA CUDA), breaking ROCm.
**Fix:** Stay on pyannote 3.3.2 + monkey-patch.

### 4. Old server process on port 5002
When restarting the server, old processes may still hold port 5002.
**Fix:** `fuser -k 5002/tcp` before starting.

---

## 🎙️ Voice Cloning — Current State

`POST /clone` currently returns edge-tts audio (same as `/tts`) with a note explaining true cloning is not yet implemented.

**Options for real voice cloning (not yet implemented):**

| Option | Tech | Complexity | PT-BR Quality |
|--------|------|-----------|---------------|
| A — OpenVoice V2 | MIT, Python 3.12 compat | Low | Good |
| B — XTTS-v2 (Coqui) | Python 3.10 venv required | Medium | Excellent |
| C — GPT-SoVITS v2 | Complex setup | High | State-of-art |

---

## 🗂️ File Reference

| File | Purpose |
|------|---------|
| `integrations/audio_server.py` | Python FastAPI audio server |
| `backend/src/controllers/audioController.js` | Node.js proxy controller |
| `backend/src/routes/audioRoutes.js` | Route definitions |
| `frontend/src/App.jsx` | AudioStudio React component |
| `backend/.env` | Contains `HF_TOKEN`, `AUDIO_SERVER_URL`, `WHISPER_MODELS_PATH` |

---

## 🔑 Environment Variables Required

```bash
# backend/.env and integrations/.env
HF_TOKEN=<huggingface_token>           # For pyannote diarization (gated models)
AUDIO_SERVER_URL=http://localhost:5002  # Backend → audio server
WHISPER_MODELS_PATH=/mnt/windows/Projetos/Whisper-BR/models  # Optional: reuse downloaded models
```
