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
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python ultra_optimized_server.py    # image generation (port 5001)
python instagram_server.py          # video downloader (port 5002)
```

### Full Stack
```powershell
.\start_all.ps1      # Windows: launches all services in separate windows
.\stop_apibr2.ps1    # Windows: graceful shutdown
```
```bash
./start_all.sh       # Linux/macOS
./stop_apibr2.sh
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
All `/api/*` routes require an `x-api-key` header matching a value from the `API_KEYS` env var (comma-separated list). The middleware is at `src/middlewares/apiKeyAuth.js`.

### Python Image Server (`integrations/ultra_optimized_server.py`)
- Auto-detects device: DirectML (AMD) → CUDA (NVIDIA) → MPS (Apple) → CPU
- Caches loaded pipelines in memory (`pipes` dict) — first request is slow (model load), subsequent requests are fast
- Env vars: `FORCE_CPU`, `PREFER_CPU`, `HUGGINGFACE_HUB_TOKEN` (for gated models)

### Python Video Downloader (`integrations/instagram_server.py`)
- Uses yt-dlp for multi-platform downloads (Instagram, TikTok, YouTube, Facebook, Amazon, Shopee)
- Supports cookie-based auth for private content
- Output directories: `integrations/downloads/`, `integrations/generated_images/`

### Frontend Structure
All UI is in a single `frontend/src/App.jsx` (~1100 lines) containing Home, ImageStudio, VideoStudio, AudioStudio (placeholder), and Projects components with React Router v6. Styling uses glass-morphism dark theme in `index.css`.

## Environment Configuration

Backend `.env` (see `backend/.env.example`):
```
PORT=3000
API_KEYS=dev-key-1,dev-key-2
REDIS_URL=redis://localhost:6379
PYTHON_SERVER_URL=http://localhost:5001
BROWSER_POOL_SIZE=5
LOG_LEVEL=info
NODE_ENV=development
```

## Route Organization

Main router at `backend/src/routes/api.js` combines all sub-routers:
- `imageRoutes.js` → `/api/v1/image/*`
- `audioRoutes.js` → `/api/v1/audio/*`
- `videoRoutes.js` → `/api/v1/video/*`
- `studioRoutes.js` → `/api/v1/studio/*`
- `youtube.js` → `/api/youtube/*`
- `instagram.js` → `/api/instagram/*`
- `tiktokYoutube.js` → `/api/tiktok/*`, `/api/youtube/download`
- `universal.js` → `/api/facebook/*`, `/api/amazon/*`, `/api/shopee/*`
- `scrape.js`, `jobs.js`, `metrics.js`, `docs.js`

## Monitoring

- Prometheus metrics at `GET /api/metrics` (prom-client)
- Health checks: `GET /health` (Node), `GET /health` (Python services)
- Logging: Winston JSON logs (backend), STDOUT (Python)
- n8n integration: configure `N8N_BASE_URL`, `N8N_API_KEY`, `N8N_WEBHOOK_URL`
