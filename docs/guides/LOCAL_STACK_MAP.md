# APIBR2 Local Stack Map

Technical snapshot for daily local development on Linux (Ubuntu + AMD ROCm).

## 1) Service Diagram

```text
Frontend (React/Vite :5173)
  -> Node API Gateway (Express :3000)
      -> Redis (:6379) for cache + async job metadata
      -> BrowserPool (Puppeteer) for scraping routes
      -> Python Image Server (:5001)
      -> Python Audio Server (:5002)
           -> GPT-SoVITS worker subprocess
                -> external sibling repo: ~/Projetos/GPT-SoVITS
      -> Python Chat Server (:5003)
           -> Ollama server (:11434)
      -> Python Downloader Server (:5004)
```

## 2) Ports and Ownership

| Port | Owner | Purpose |
|------|-------|---------|
| `3000` | `backend/src/server.js` | Main API gateway (`/api/*`) |
| `5001` | `integrations/ultra_optimized_server.py` | Image generation (`/generate`, `/img2img`, `/models`) |
| `5002` | `integrations/audio_server.py` | TTS, clone, transcribe, onboarding, train |
| `5003` | `integrations/text_generation_server.py` | Chat/models proxy to Ollama |
| `5004` | `integrations/instagram_server.py` | Video/social downloader endpoints |
| `11434` | `ollama serve` | Local LLM runtime (CPU) |
| `5173` | `frontend` (Vite) | UI studio |

## 3) Required Dependencies

### Base
- Node.js `>=18`
- Python `>=3.10`
- Redis running locally (or `REDIS_URL` pointing to remote)
- `npm install` in `backend/` and `frontend/`
- Python venv in `integrations/venv` + `pip install -r integrations/requirements.txt`

### Audio fine-tuning / inference
- External sibling folder exists:
  - `/home/flaviofagundes/Projetos/GPT-SoVITS`
- APIBR2 uses this path directly in:
  - `integrations/gpt_sovits_worker.py`
  - `integrations/gpt_sovits/training/scripts/gsv_train_pipeline.py`

## 4) Environment Variables (minimum viable set)

### `backend/.env`
```env
PORT=3000
API_KEYS=dev-key-1
REDIS_URL=redis://localhost:6379

PYTHON_SERVER_URL=http://localhost:5001
AUDIO_SERVER_URL=http://localhost:5002
CHAT_SERVER_URL=http://localhost:5003
PYTHON_INSTAGRAM_URL=http://localhost:5004
PYTHON_SERVICE_URL=http://localhost:5004
PYTHON_TIKTOK_URL=http://localhost:5004
PYTHON_YOUTUBE_URL=http://localhost:5004
```

### Optional AIOS (`backend/.env`)
```env
ANTHROPIC_API_KEY=
CLAUDE_CLI_PATH=/usr/local/bin/claude
AIOS_PROJECT_PATH=/home/flaviofagundes/aios
EVOLUTION_API_BASE_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=
```

### Optional Python toggles (`integrations` process env)
```env
FORCE_CPU=false
PREFER_CPU=false
HF_TOKEN=
WHISPER_MODELS_PATH=/mnt/windows/Projetos/Whisper-BR/models
INSTAGRAM_SERVER_PORT=5004
```

## 5) Reliable Startup Checklist

1. Confirm sibling dependency exists:
   - `ls /home/flaviofagundes/Projetos/GPT-SoVITS`
2. Confirm Redis is running:
   - `redis-cli ping` returns `PONG`
3. Start all services:
   - `bash startlinux.sh`
4. Validate health quickly:
   - `curl -sf http://localhost:3000/health`
   - `curl -sf http://localhost:5001/health`
   - `curl -sf http://localhost:5002/health`
   - `curl -sf http://localhost:5003/models`
   - `curl -sf http://localhost:5004/health`
5. Validate UI:
   - open `http://localhost:5173`

## 6) Smoke Test (quick API check)

```bash
curl -s http://localhost:3000/health | jq .

curl -s http://localhost:3000/api/v1/audio/voices \
  -H "x-api-key: dev-key-1" | jq .

curl -s http://localhost:3000/api/v1/chat/models \
  -H "x-api-key: dev-key-1" | jq .
```

## 7) Common Failure Points

- `503 Audio service unavailable`: `audio_server.py` down or wrong `AUDIO_SERVER_URL`.
- `GPT-SoVITS` errors on fine-tuned voice:
  - missing sibling repo `~/Projetos/GPT-SoVITS`
  - missing fine-tuned files in `integrations/gpt_sovits/models/finetuned/<user_id>/`
- Downloader routes failing:
  - backend still pointing to `:5002` instead of `:5004` in env.
- Chat routes failing:
  - `text_generation_server.py` up, but Ollama (`:11434`) not running/model not pulled.
