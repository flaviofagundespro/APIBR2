# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

APIBR2 is a hybrid-architecture automation platform combining:
- **Node.js/Express REST API** (port 3000) — gateway for routing, scraping, and orchestration
- **Python FastAPI services** (port 5001 for image gen, port 5002 for video downloads) — GPU-accelerated AI workloads
- **React/Vite frontend** (port 5173) — media studio dashboard
- **Redis** (port 6379) — caching and async job queue

The backend uses ES modules (`"type": "module"` in package.json).

## Commands

### Backend
```bash
cd backend
npm install
npm run dev          # development with --watch
npm start            # production (node src/server.js)
npm test             # jest with ES modules (--experimental-vm-modules)
npm run test:watch   # jest in watch mode
npm run test:coverage
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # vite dev server on port 5173
npm run build    # production build
npm run lint     # eslint
npm run preview  # preview production build
```

### Python Services
```bash
cd integrations
# Use existing venv or create new one
source venv/bin/activate             # Linux/macOS (existing venv)
# Windows: venv\Scripts\Activate.ps1
# Or create new: python -m venv venv
pip install -r requirements.txt
python ultra_optimized_server.py    # image generation (port 5001, FastAPI)
python instagram_server.py          # video downloader (port 5002, FastAPI)
```

### Full Stack
```bash
# Linux/macOS (current platform)
./start_all.sh       # launches all services
./start_system.sh    # alternative startup
./stop_apibr2.sh     # graceful shutdown

# Windows (PowerShell)
.\start_all.ps1      # launches all services in separate windows
.\start_apibr2.ps1   # backend only
.\start_frontend.ps1 # frontend only
.\start_instagram.ps1 # video downloader only
.\stop_apibr2.ps1    # graceful shutdown

# Test/diagnostic scripts
./scripts/utils/test_img2img.sh    # test image-to-image generation
./scripts/utils/test_seed_api.sh   # test seed consistency
./scripts/utils/diagnostico.sh     # system diagnostics
```

### Docker
```bash
cd backend
docker-compose up -d                              # production
docker-compose --profile dev up -d apibr-dev      # development
docker-compose --profile monitoring up -d          # with Prometheus + Grafana
```

## Architecture

### Request Flow
The Node.js API acts as a gateway. For AI workloads, it proxies requests to Python services:
- Image generation: `POST /api/v1/image/generate` → Node controller → `POST http://localhost:5001/generate` (Python)
- Video downloads: `POST /api/{platform}/download` → Node routes → `POST http://localhost:5002/{platform}/download` (Python via yt-dlp)
- Web scraping: `POST /api/scrape` → Puppeteer browser pool (Node-native)
- Async scraping: `POST /api/scrape/async` → Redis job queue → `GET /api/jobs/:id` for polling

### Backend Middleware Stack (order matters)
helmet → cors → compression → json body parser → requestLogger → metricsMiddleware → rateLimiter → apiKeyAuth → routes → errorHandler → 404

### Key Backend Singletons
- **BrowserPool** (`src/infrastructure/browserPool.js`) — pre-allocated Puppeteer instances, shared across requests
- **CacheService** (`src/infrastructure/cacheService.js`) — Redis wrapper with graceful fallback if Redis is unavailable
- **JobProcessor** — background loop polling Redis for async scraping jobs

### Authentication
All `/api/*` routes use API key authentication via `src/middlewares/apiKeyAuth.js`:
- **Production/secured mode**: Set `API_KEYS` env var (comma-separated list). Requests must include `x-api-key` header or `?apiKey=` query param.
- **Development/local mode**: If `API_KEYS` is empty or unset, authentication is **automatically disabled** (middleware skips checks). This allows n8n, local testing, and development workflows without 401 errors.
- Example: `API_KEYS=dev-key-1,dev-key-2` or leave empty for unrestricted local access.

### Python Image Server (`integrations/ultra_optimized_server.py`)
- FastAPI-based Stable Diffusion service with aggressive memory optimization
- **Current platform**: Linux with ROCm native drivers (RX 6750 XT) — ~7.1 it/s, 4x faster than previous Windows/DirectML setup
- Auto-detects device: ROCm (AMD on Linux) → DirectML (AMD on Windows) → CUDA (NVIDIA) → MPS (Apple) → CPU
- Caches loaded pipelines in memory (`pipes` dict) — first request is slow (model load), subsequent requests are fast (~5s avg)
- Env vars: `FORCE_CPU`, `PREFER_CPU`, `HUGGINGFACE_HUB_TOKEN` (for gated models)
- Supports models: Stable Diffusion v1.5, SDXL Turbo, DreamShaper, OpenJourney, Anything-v3
- Endpoints: `/generate`, `/edit`, `/benchmark`, `/models`, `/health`

### Python Video Downloader (`integrations/instagram_server.py`)
- FastAPI-based universal downloader using yt-dlp
- **Currently supported platforms**: Instagram, TikTok, YouTube, Shopee
- **Partially supported**: Facebook (may work, platform-dependent)
- **Not currently supported**: Amazon (unstable due to heavy platform protections)
- Cookie-based auth for private/restricted content (see `integrations/cookies/`)
- Output directories: `integrations/downloads/`, `integrations/generated_images/`
- Endpoints: `/download` (Instagram), `/tiktok/download`, `/youtube/download`, `/facebook/download`, `/shopee/download`, `/universal/download`

### Frontend Structure
All UI is in a single `frontend/src/App.jsx` (~1100 lines) containing Home, ImageStudio, VideoStudio, AudioStudio (placeholder), and Projects components with React Router v6. Styling uses glass-morphism dark theme in `index.css`.

## Environment Configuration

Backend `.env` (see `backend/.env.example`):
```env
# Server
PORT=3000
NODE_ENV=development

# Security (leave empty to disable auth in local/dev mode)
API_KEYS=dev-key-1,dev-key-2

# Browser Pool
BROWSER_POOL_SIZE=5
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Python Integration
PYTHON_SERVER_URL=http://localhost:5001

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Webhooks
WEBHOOK_TIMEOUT=10000
WEBHOOK_RETRIES=3

# Proxy (optional)
PROXY_LIST=               # comma-separated
PROXY_ROTATION=false
```

## Route Organization

Main router at `backend/src/routes/api.js` combines all sub-routers:
- `imageRoutes.js` → `/api/v1/image/*` (generate, edit, upscale)
- `audioRoutes.js` → `/api/v1/audio/*` (generate-speech, clone-voice, voices)
- `videoRoutes.js` → `/api/v1/video/*` (create-avatar, animate, status)
- `studioRoutes.js` → `/api/v1/studio/*` (create-project, generate-content, projects)
- `youtube.js` → `/api/youtube/*` (scrape, video, ocr)
- `instagram.js` → `/api/instagram/*` (download endpoint)
- `tiktokYoutube.js` → `/api/tiktok/download`, `/api/youtube/download`
- `universal.js` → `/api/facebook/download`, `/api/amazon/download`, `/api/shopee/download`, `/api/universal/download`
- `scrape.js` → `/api/scrape`, `/api/scrape/async`
- `jobs.js` → `/api/jobs/:id`
- `metrics.js` → `/api/metrics`
- `docs.js` → `/api/docs`

## Backend Directory Structure

All backend code lives in `backend/src/`:
```
src/
├── server.js              # Entry point
├── app.js                 # Express app setup
├── config/                # Environment config, logger
├── routes/                # Route definitions (api.js is main router)
├── controllers/           # Request handlers
├── services/              # Business logic (scraping, jobs, n8n)
├── infrastructure/        # BrowserPool, CacheService singletons
├── middlewares/           # Auth, logging, metrics, rate limiting, error handling
├── utils/                 # Validation, retry logic, graceful shutdown
└── tests/                 # Jest test files
```

## Testing

```bash
# Backend tests (Jest with ES modules)
cd backend
npm test                   # run all tests
npm run test:watch         # watch mode
npm run test:coverage      # coverage report

# Manual/integration tests
./scripts/utils/test_img2img.sh          # test image-to-image API
./scripts/utils/test_seed_api.sh         # test seed consistency
./scripts/utils/diagnostico.sh           # system health diagnostics
```

## Monitoring

- Prometheus metrics at `GET /api/metrics` (prom-client)
- Health checks: `GET /health` (Node), `GET /health` (Python services)
- Logging: Winston JSON logs (backend), STDOUT (Python)
- n8n integration: configure `N8N_BASE_URL`, `N8N_API_KEY`, `N8N_WEBHOOK_URL`
