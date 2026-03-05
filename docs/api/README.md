# APIBR2 — API Reference

Base URL: `http://localhost:3000`

All services run locally. No authentication required in dev mode (leave `API_KEYS` empty in `.env`).

---

## Service Map

| Service | Port | Tech |
|---------|------|------|
| Node.js API Gateway | 3000 | Express.js |
| Image Generation | 5001 | FastAPI + Stable Diffusion (ROCm GPU) |
| Audio Studio | 5002 | FastAPI + Whisper + edge-tts |
| Chat / LLM | 5003 | FastAPI + Ollama (CPU) |
| Video Downloader | 5004 | FastAPI + yt-dlp |
| Frontend | 5173 | React / Vite |

---

## Documentation by Feature

| File | Description |
|------|-------------|
| [image-generation.md](image-generation.md) | Text-to-image, img2img, edit, upscale — Stable Diffusion |
| [audio.md](audio.md) | TTS, voice cloning, transcription, diarization, fine-tuning |
| [scraping.md](scraping.md) | Web scraping (Puppeteer), YouTube scraper, OCR, async jobs |
| [video-download.md](video-download.md) | Instagram, TikTok, YouTube, Facebook, Shopee downloads |
| [chat.md](chat.md) | Local LLM chat via Ollama |
| [aios-gateway.md](aios-gateway.md) | WhatsApp → AIOS agent routing |

---

## Quick Health Check

```bash
curl -s http://localhost:3000/api/health | jq .
curl -s http://localhost:5001/health | jq .
curl -s http://localhost:5002/health | jq .
curl -s http://localhost:5003/health | jq .
curl -s http://localhost:5004/health | jq .
```

---

## Common Patterns

### Response with base64 image
Most image endpoints return `image_base64` — decode with:
```bash
echo "<base64_string>" | base64 -d > output.png
```

### Response with base64 audio
Audio endpoints return `audio_base64` — decode with:
```bash
echo "<base64_string>" | base64 -d > output.mp3
```

### n8n integration
- All download endpoints support `returnBase64: true` (Instagram) for direct file handling
- Scraping async jobs support `webhook` callback to n8n
- AIOS gateway is designed to be called directly by n8n workflows
