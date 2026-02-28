# 🤖 APIBR2 Context for AI Assistance

This file contains the current state, architecture, and critical configurations of the APIBR2 project. Feed this file to any AI assistant to get accurate, context-aware help with Linux implementation and feature expansion.

---

## 🚀 Project Status (Linux Migration - SUCCESS)
**Current Date**: December 06, 2025
**Environment**: Ubuntu Linux (Migrated from Windows)
**Hardware**: AMD Ryzen 9 7900X + Radeon RX 6750 XT
**Key Achievement**: Moved from Windows DirectML (slow) to Linux ROCm Native (fast).

### Hardware Baseline (Host Machine)
| Component | Specification |
|--------|-------------------|
| **CPU** | AMD Ryzen 9 7900X (12 cores / 24 threads, 4.7 GHz base, 5.6 GHz boost) |
| **Motherboard** | Asus TUF Gaming X670E-Plus WIFI |
| **RAM** | 32 GB DDR5 (2x16 GB) 5600 MHz |
| **Storage** | Lexar Professional NM800 Pro 2 TB NVMe |
| **GPU** | XFX AMD Radeon RX 6750 XT (12 GB GDDR6) |
| **PSU** | MSI MAG A850GL 850W (80 Plus Gold) |
| **Cooling** | Be Quiet Dark Rock Pro 5 |
| **Case** | Cooler Master Masterbox TD500 Mesh ARGB |

### ⚡ Performance Benchmarks
| Metric | Windows (DirectML) | Linux (ROCm 6.0) | Improvement |
|--------|-------------------|------------------|-------------|
| **Speed (it/s)** | ~1.3 it/s | **~7.1 it/s** | **5.4x Faster** |
| **Generation Time** | ~18s | **~4.8s** | **Instant** |
| **Backend State** | Stable | Stable | - |
| **Puppeteer** | Unstable | **Fixed (Custom Flags)** | - |

---

## 🏗️ Architecture Overview

The system is a hybrid Monorepo with two main components interacting via HTTP:

### 1. Node.js Backend (`/backend`)
*   **Role**: Orchestrator, API Gateway, and Web Scraper.
*   **Port**: `3000`
*   **Tech**: Express.js, Puppeteer, Redis (Bull/Queue).
*   **Critical Linux Configuration** (`browserPool.js`):
    ```javascript
    args: [
      '--no-sandbox',        // REQUIRED for Linux
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
    ```

### 2. Python AI Engine (`/integrations`)
*   **Port 5001**: `ultra_optimized_server.py` (GPU Image Gen - Stable Diffusion).
    *   **Driver**: ROCm 6.0 (AMD Native) - RX 6750 XT.
    *   **Env**: `HSA_OVERRIDE_GFX_VERSION=10.3.0`.
*   **Port 5002**: `instagram_server.py` (Video Downloader).
*   **Port 5003**: `text_generation_server.py` (Magic Prompt & Chat Relay).
    *   **Function**: Acts as a middleware between App and Ollama.
*   **Port 11435**: **Ollama (CPU Dedicated)**.
    *   **Configuration**: `OLLAMA_NUM_GPU=0` (Forces CPU), `OLLAMA_KEEP_ALIVE=24h` (Infinite RAM persistence).
    *   **Why**: Frees up 100% VRAM for Image Generation while using the Ryzen 9 for Text.

### 4. API & Automation Features (n8n Support)
*   **Video Downloads**: Endpoints (`/api/instagram/download`, `/api/tiktok/download`, etc.) support a `returnBase64: true` parameter.
    *   **Function**: Returns the full file content in `base64_content` field, allowing direct file handling in n8n/Make without public file hosting.

### 5. Frontend (`/frontend`)
*   **Role**: Dashboard & Chat Studio.
*   **Port**: `5173`.
*   **Tech**: Vite / React.
*   **Modules**: Image Studio, Audio Studio, Downloader Universal, **Chat Studio (New)**.

---

## 🛠️ Usage Commands

### Start Everything (One-Click)
We use a custom script that handles all environment variables and tabs.
```bash
./start_all.sh
```

### Manual Python Start (Debugging)
```bash
cd integrations
source venv/bin/activate
export HSA_OVERRIDE_GFX_VERSION=10.3.0
export TORCH_ROCM_AOT_DISABLE_HIPBLASLT=1
python3 ultra_optimized_server.py
```

---

## 📂 Key Files for context
*   `backend/src/infrastructure/browserPool.js` -> Browser configuration.
*   `integrations/ultra_optimized_server.py` -> The AI Server logic.
*   `start_all.sh` -> System orchestration.
*   `README.md` -> General documentation.
