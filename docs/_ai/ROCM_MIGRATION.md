# APIBR2 - ROCm Migration Notes (Updated 2026-02-16)

> **Original report:** February 2, 2026. Updated 2026-02-16 to reflect current torch version.

## 🚀 Status Review

### 1. Image Generation (AMD GPU)
**Status:** ✅ Native ROCm Working
- **PyTorch Version:** `2.5.1+rocm6.2` (locked — do NOT upgrade to 2.6.0+rocm6.1, breaks Conv2d on RX 6750 XT)
- **Device Detected:** AMD Radeon RX 6750 XT via ROCm (`gfx1030`)
- **Performance:** ~6s warm generation (512×512, SD 1.5)

**Action Taken:**
No code changes were needed in the image generation server (`ultra_optimized_server.py`) because it correctly detects `torch.cuda.is_available()` which returns `True` for your ROCm setup. You are **NOT** using emulation; you are using native, high-performance ROCm kernels.

### 2. Chat Studio (LLM)
**Status:** ✅ Upgraded to Dynamic Model Loading
Previously, the Chat Studio had a hardcoded list of models. If you downloaded a new "2026 model" in Ollama, it wouldn't show up.

**Improvements Implemented:**
1.  **Backend (Python)**: Added `/models` endpoint to `integrations/text_generation_server.py` that queries your local Ollama instance.
2.  **API Gateway (Node.js)**: Created a proxy route `/api/v1/chat/models` in `backend/src/routes/chat.js`.
3.  **Frontend (React)**: Updated `ChatStudio` in `App.jsx` to automatically fetch available models on load.

**How to use updates:**
Simply run `ollama pull <new-model>` in your terminal. Refresh the web page, and the new model will appear in the dropdown automatically.

### 3. Hardware Separation (Verified)
- **Image Generation:** The startup script (`start_all.sh`) loads the image server with `HSA_OVERRIDE_GFX_VERSION=10.3.0`, enabling native ROCm acceleration on your RX 6750 XT.
- **Chat LLM:** The startup script intentionally launches Ollama with `OLLAMA_NUM_GPU=0` on port 11435. Roughly translated: "Do not touch the Video Card".
- **Result:** Your GPU VRAM is 100% dedicated to generating images, while the CPU handles the intelligent conversation.

## 🛠️ Summary of Changes
- Modified `integrations/text_generation_server.py`: Added endpoint to list Ollama models.
- Modified `backend/src/routes/chat.js`: Added proxy for model listing.
- Modified `frontend/src/App.jsx`: Implemented dynamic fetching with fallback descriptions.

### 4. Audio Studio (Added 2026-02-16)
**Status:** ✅ All endpoints working via ROCm GPU

- **Transcription:** `transformers` pipeline (HuggingFace) with `whisper-large-v3-turbo`, fp16, **12.5x real-time** on RX 6750 XT
- **Speaker diarization:** `pyannote.audio==3.3.2` with monkey-patch for `huggingface_hub` 1.x compatibility
- **TTS:** `edge-tts` cloud service (no local GPU required)
- **Key gotcha:** `torchcodec` must be uninstalled — requires `libavutil.so.57` but Ubuntu 22.04 ships `.58` (FFmpeg 6.x)
- See `docs/notes/audio-studio-status-2026-02-16.md` for full details

## 📝 Recommendations

- **Image Gen:** Stick to `torch==2.5.1+rocm6.2`. Native ROCm is ~6.5x faster than Windows DirectML. Do not use DirectML on Linux.
- **Audio:** Use `transformers` pipeline (not `faster-whisper` — ctranslate2 is NVIDIA-only). ROCm fp16 is the target.
- **LLM:** Keep Ollama models updated. `llama3.2` and `qwen2.5` are good choices.
- **torch version:** Locked at `2.5.1+rocm6.2` for both image and audio servers. Any upgrade must be tested — 2.6.0+rocm6.1 is confirmed broken on gfx1030.
- **Startup:** Use `./startlinux.sh` — ensures all ROCm env vars (`HSA_OVERRIDE_GFX_VERSION=10.3.0`, etc.) are set correctly.
