# APIBR2 – AI-Powered Web Scraping & Media Studio Platform

APIBR2 is a production-grade automation stack that blends high-volume web scraping, media enrichment, and AI content generation. The backend is built with Node.js/Express, while Python services handle GPU-accelerated workloads such as Stable Diffusion, Whisper, and video processing. Automations can be chained through n8n or invoked directly via REST.

## Architecture

```
APIBR2/
├── backend/            # Node.js REST API, queueing, scraping engines
├── integrations/       # Python workers (image/audio/video generation)
├── frontend/           # Optional dashboard (React/Vite)
├── docs/               # Deep-dive guides per subsystem
├── scripts/            # Helper scripts and PowerShell launchers
├── controllers/        # Legacy routing layer kept for compatibility
└── start_*.ps1         # Windows shortcuts for local development
```

### Core components
- **Scraping API** – Puppeteer browser pool, proxy rotation, caching, and asynchronous job tracking.
- **Media Studio API** – `/api/v1/{audio|image|video|studio}` endpoints that orchestrate the Python workers.
- **Python GPU Services** – `integrations/ultra_optimized_server.py` exposes `/generate`, `/edit`, `/benchmark`, and `/models`.
- **Automation hooks** – Built-in n8n connector (`backend/src/services/n8n_integration.js`) for multi-step pipelines.
- **Monitoring** – Prometheus metrics, structured logs, health/benchmark endpoints, and shell scripts for manual QA.

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+ (with pip) and optionally CUDA/DirectML drivers
- Redis (local or remote) for cache/job metadata
- Git, PowerShell 7+, and optional Docker for deployment

### Backend (Node.js)
```bash
cd APIBR2/backend
cp ../env.example .env        # or set environment variables manually
npm install
npm run dev                   # watches src/ for changes
# npm start                   # production-style start
```

Key environment variables (`backend/.env`):
```
PORT=3000
API_KEYS=dev-key-1,dev-key-2        # comma-separated list required for /api/*
REDIS_URL=redis://localhost:6379
PYTHON_SERVER_URL=http://localhost:5001
BROWSER_POOL_SIZE=5
LOG_LEVEL=info
```

### Python AI services
```bash
cd APIBR2/integrations
python -m venv .venv && source .venv/bin/activate  # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
# CPU-friendly torch build
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# Optional AMD DirectML stack
pip install torch-directml onnxruntime-directml
python ultra_optimized_server.py
```

Environment toggles (read inside `ultra_optimized_server.py`):
- `FORCE_CPU=true` – bypass DirectML/CUDA and keep everything on CPU.
- `PREFER_CPU=true` – automatically stay on CPU unless CUDA is available.
- `HUGGINGFACE_HUB_TOKEN` – unlocks gated models when needed.

### Frontend (optional)
```bash
cd APIBR2/frontend
npm install
npm run dev   # serves dashboard on http://localhost:5173
```

## Usage

### Start the stack
1. Launch Redis locally or update `REDIS_URL` to point at your instance.
2. Start the Python server (`python ultra_optimized_server.py`).
3. Start the Node.js API (`npm run dev` or `npm start`).
4. Export `API_KEYS` or place them in `.env`; use them via `x-api-key` header.

### Primary endpoints
| Capability | Route | Notes |
|------------|-------|-------|
| Health/metrics | `GET /health`, `GET /api/metrics` | Includes cache stats + Prometheus data |
| Web scraping | `POST /api/scrape`, `POST /api/scrape/async` | Supports Puppeteer strategies + async job polling |
| Job tracking | `GET /api/jobs/:id` | Retrieves async scrape status/results |
| YouTube ingestion | `POST /api/youtube/scrape`, `/video`, `/ocr` | OCR support auto-disables when Tesseract is missing |
| Media studio | `/api/v1/{audio,image,video,studio}` | Proxies to Python services or triggers n8n |
| Image AI | `POST /api/v1/image/generate` (Node) → `POST /generate` (Python) | Stable Diffusion v1.5, SDXL Turbo, DreamShaper, OpenJourney, Anything-v3 |

Authentication: every `/api/*` route expects an `x-api-key` header that matches one of the comma-separated values defined in `API_KEYS`.

## Examples

### 1. Scrape a page using Puppeteer
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
        "url": "https://example.com",
        "strategy": "puppeteer",
        "actions": [
          {"type": "waitForSelector", "selector": "main"},
          {"type": "screenshot"}
        ]
      }'
```

### 2. Generate an image with SDXL Turbo
```bash
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
        "prompt": "futuristic brazilian skyline at dusk, cinematic, 35mm",
        "model": "stabilityai/sdxl-turbo",
        "scheduler": "euler_a",
        "size": "768x512",
        "guidance_scale": 0.0,
        "device": "cpu"
      }'
```

### 3. Call Python server directly (bypassing Node)
```bash
curl -X POST http://localhost:5001/generate \
  -H "Content-Type: application/json" \
  -d '{
        "prompt": "ultra detailed concept art of a cyberpunk Recife street",
        "model": "runwayml/stable-diffusion-v1-5",
        "steps": 15,
        "size": "512x512"
      }'
```

## Results

### Confirmed benchmarks (Linux + ROCm Native) 🚀

| Scenario | Steps | Time | Speed | Notes |
|----------|-------|------|-------|-------|
| **Stable Diffusion 1.5** | 30 | **4.78s** | 7.06 it/s | **native ROCm 6.0** - 4x faster than Windows DirectML! |
| **DreamShaper 8** | 30 | **6.71s** | 7.09 it/s | High quality, extremely fast generation |
| Legacy (Windows DirectML) | 25 | ~18s | ~1.3 it/s | Old setup (for comparison) |

### Performance Leap
Moving to Linux and using native ROCm drivers transformed the experience. The RX 6750 XT now performs comparably to high-end NVIDIA cards for this workload, jumping from ~1.3 it/s to **~7.1 it/s**.

### Cross-hardware comparison (Standard workloads)

| Hardware / Environment | Avg. time | Status |
|------------------------|-----------|--------|
| **RX 6750 XT (Linux ROCm)** | **~4.8s** | **Current Production** 🟢 |
| RTX 4070 (CUDA) | ~6s | Comparable |
| RX 6750 XT (Win DirectML) | ~18s | Deprecated 🔴 |
| CPU Only | ~45s | Fallback |

Notes:
- DirectML now competes with entry-level NVIDIA GPUs once Secure Boot and driver optimizations are applied.
- Automatic fallbacks still shrink resolution or migrate to CPU when memory pressure is detected.
- `ultra_optimized_server.py` keeps pipelines cached, so the first request is slower while subsequent generations leverage warm caches.

## Testing
```bash
# Backend unit/integration tests
cd backend
npm test

# Python test suite (if pytest is configured)
cd ../integrations
python -m pytest

# Browser + scraping smoke tests
./test-basic.sh                # Linux/macOS
pwsh ./test-js.ps1             # Windows PowerShell scripts
```

## Monitoring & Operations
- **Prometheus metrics**: expose `/api/metrics` and scrape from your collector.
- **Logs**: backend uses winston JSON logs; Python server logs to STDOUT (redirect to `server.log` if needed).
- **Health checks**: `GET /health` (Node) and `GET /health` on the Python service include CPU/RAM usage, loaded models, and applied optimizations.
- **n8n**: configure `N8N_BASE_URL`, `N8N_API_KEY`, and `N8N_WEBHOOK_URL` to trigger automation workflows directly from controllers.
- **PowerShell helpers**: `start_apibr2.ps1`, `start_frontend.ps1`, and `start_instagram.ps1` speed up local demos.

## Additional Documentation
- `docs/_ai/README.md` – AI/ML documentation index (image generation, GPU setup, models)
- `docs/_ai/api/IMAGE_API.md` – exhaustive parameter list for the Python image API
- `docs/_ai/gpu/AMD_SETUP.md` – AMD GPU configuration (ROCm, DirectML)
- `docs/_ai/troubleshooting/IMAGE_GENERATION_PT.md` – troubleshooting image generation issues
- `docs/guides/INSTALACAO_PYTHON.md` – Windows-specific Python environment guide
- `docs/guides/STARTUP_SCRIPTS.md` – explanation of the PowerShell helpers

## Contributing
1. Fork the repository and create a feature branch.
2. Run `npm test` (backend) and `python -m pytest` (integrations) before opening a PR.
3. Follow the existing ESLint/Prettier rules and keep comments in English.

## License

This project is released under the MIT License. See `LICENSE` for full details.
