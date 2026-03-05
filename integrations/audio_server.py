#!/usr/bin/env python3
"""
APIBR2 - Audio Processing Server v2.0
FastAPI service for speech synthesis, voice cloning, and transcription.
Follows ultra_optimized_server.py architecture patterns.

TTS Engine:
  - Standard TTS: edge-tts (Microsoft Edge TTS — PT-BR voices, cloud)
  - Voice cloning: XTTS-v2 (coqui-tts, in-process, Python 3.12 compatible)
    Install: pip install coqui-tts
    Falls back to edge-tts if coqui-tts is not installed.

Voice Profiles:
  Saved reference audios stored in models/voice_profiles/<name>.wav.
  Speaker embeddings are cached in memory after first use for faster generation.

Endpoints:
  GET  /voices                  - List TTS voices (edge-tts + saved XTTS profiles)
  POST /tts                     - Text → Audio (edge-tts, fast, cloud PT-BR)
  POST /clone                   - Text + voice → Cloned audio (XTTS-v2 or edge-tts fallback)
  POST /voices/clone/save       - Save reference audio as permanent named voice profile
  POST /transcribe              - Audio → Text (whisper-large-v3-turbo, ROCm GPU)
  POST /transcribe-speakers     - Audio → Text with speaker labels (+ pyannote)
  POST /onboarding/upload       - Voice dataset builder (normalize + transcribe batch)
"""

import subprocess
import os
import shutil
import importlib.util
# ROCm stability — must be set BEFORE torch is imported
os.environ.setdefault("HSA_OVERRIDE_GFX_VERSION", "10.3.0")   # RX 6750 XT (gfx1031 → gfx1030)
os.environ.setdefault("PYTORCH_ROCM_ARCH", "gfx1030")
os.environ.setdefault("PYTORCH_TUNABLEOP_ENABLED", "0")        # Reduces RDNA2 instability

# Monkey-patch 1: huggingface_hub 1.x removed use_auth_token from hf_hub_download.
# pyannote 3.3.2 still passes it — silently convert to token= to keep compatibility.
import huggingface_hub
_orig_hf_hub_download = huggingface_hub.hf_hub_download
def _patched_hf_hub_download(*args, **kwargs):
    if "use_auth_token" in kwargs:
        kwargs["token"] = kwargs.pop("use_auth_token")
    return _orig_hf_hub_download(*args, **kwargs)
huggingface_hub.hf_hub_download = _patched_hf_hub_download

# Monkey-patch 2: transformers 5.x removed isin_mps_friendly from pytorch_utils.
# coqui-tts (XTTS-v2) still imports it from there — restore the function.
import transformers.pytorch_utils as _tpu
if not hasattr(_tpu, "isin_mps_friendly"):
    import torch as _torch_patch
    def _isin_mps_friendly(elements: "_torch_patch.Tensor", test_elements: "_torch_patch.Tensor") -> "_torch_patch.Tensor":
        if test_elements.ndim == 0:
            test_elements = test_elements.unsqueeze(0)
        return elements.unsqueeze(-1).eq(test_elements).any(dim=-1)
    _tpu.isin_mps_friendly = _isin_mps_friendly

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import torch
import time
import base64
import logging
import gc
import sys
import tempfile
import uuid
import io
import asyncio
import json
import re
import threading
import urllib.request
import urllib.error
from typing import Optional, List, Dict
from datetime import datetime
import torchaudio

# ─── Thread / CPU configuration ────────────────────────────────────────────────
num_threads = os.cpu_count() or 12
torch.set_num_threads(num_threads)
torch.set_num_interop_threads(num_threads)
if hasattr(torch, 'set_float32_matmul_precision'):
    torch.set_float32_matmul_precision('high')

os.environ['OMP_NUM_THREADS'] = str(num_threads)
os.environ['MKL_NUM_THREADS'] = str(num_threads)
os.environ['OPENBLAS_NUM_THREADS'] = str(num_threads)
os.environ['NUMEXPR_NUM_THREADS'] = str(num_threads)

# ─── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info(f"🔧 PyTorch configured to use {num_threads} threads")

# ─── App & CORS ────────────────────────────────────────────────────────────────
app = FastAPI(title="APIBR2 Audio Server v1.0", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Environment flags (consistent with image server) ──────────────────────────
FORCE_CPU = os.getenv("FORCE_CPU", "false").lower() == "true"
PREFER_CPU = os.getenv("PREFER_CPU", "false").lower() == "true"
AUDIO_SERVER_PORT = int(os.getenv("AUDIO_SERVER_PORT", "5002"))
HF_TOKEN = os.getenv("HF_TOKEN", os.getenv("HUGGINGFACE_HUB_TOKEN", ""))
EVOLUTION_BASE_URL = os.getenv("EVOLUTION_API_BASE_URL", "").rstrip("/")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "")

# Whisper models path — reuse pre-downloaded models from Whisper-BR if available
WHISPER_MODELS_PATH = os.getenv(
    "WHISPER_MODELS_PATH",
    "/mnt/windows/Projetos/Whisper-BR/models"
)

# ─── Voice profiles directory ──────────────────────────────────────────────────
VOICE_PROFILES_DIR = Path(__file__).parent / "models" / "voice_profiles"

# ─── Model caches (load once, reuse across requests) ───────────────────────────
_tts_voices_cache = None    # Cached list of edge-tts voices
_whisper_model = None       # transformers ASR pipeline (whisper-large-v3-turbo)
_pyannote_pipeline = None   # pyannote speaker diarization
_xtts_model = None          # Coqui TTS XTTS-v2 (lazy-loaded on first /clone request)
_xtts_embedding_cache = {}  # profile_name → (gpt_cond_latent, speaker_embedding)
_xtts_finetuned_cache = {}  # user_id -> {"mtime": float, "tts": TTS}
_chatterbox_model = None    # Native chatterbox runtime (lazy-loaded)

# edge-tts PT-BR voices (static fallback if network is unavailable)
EDGE_TTS_PT_VOICES = [
    {"id": "pt-BR-FranciscaNeural",           "name": "Francisca (Feminino)",          "language": "pt", "gender": "Female"},
    {"id": "pt-BR-AntonioNeural",             "name": "Antonio (Masculino)",            "language": "pt", "gender": "Male"},
    {"id": "pt-BR-ThalitaMultilingualNeural", "name": "Thalita Multilingual (Feminino)","language": "pt", "gender": "Female"},
    {"id": "en-US-JennyNeural",               "name": "Jenny EN (Feminino)",            "language": "en", "gender": "Female"},
    {"id": "en-US-GuyNeural",                 "name": "Guy EN (Masculino)",             "language": "en", "gender": "Male"},
    {"id": "es-MX-DaliaNeural",               "name": "Dalia ES (Feminino)",            "language": "es", "gender": "Female"},
    {"id": "de-DE-KatjaNeural",               "name": "Katja DE (Feminino)",            "language": "de", "gender": "Female"},
]

# ─── Temp output directory ─────────────────────────────────────────────────────
OUT_DIR = Path(__file__).parent / "generated_audio"
OUT_DIR.mkdir(exist_ok=True)


def chatterbox_available() -> bool:
    """Return True if a Chatterbox package is available in this environment."""
    try:
        return importlib.util.find_spec("chatterbox") is not None
    except Exception:
        return False


def get_chatterbox():
    """Load or return cached Chatterbox TTS model."""
    global _chatterbox_model
    if _chatterbox_model is not None:
        return _chatterbox_model
    from chatterbox.tts import ChatterboxTTS
    device = detect_device()
    logger.info("🧪 Loading Chatterbox on %s...", device)
    _chatterbox_model = ChatterboxTTS.from_pretrained(device)
    logger.info("✅ Chatterbox ready")
    return _chatterbox_model


def xtts_available() -> bool:
    """Return True if coqui-tts (XTTS-v2) is importable in the current environment."""
    try:
        import importlib.util
        return importlib.util.find_spec("TTS") is not None
    except Exception:
        return False


def get_xtts():
    """Load or return cached XTTS-v2 model (Coqui TTS / coqui-tts).

    Note: isin_mps_friendly monkey-patch (transformers 5.x compat) is applied at
    module level before this function is ever called.
    First call: ~15-30s to download + init model (~1.8GB, cached to ~/.local/share/tts/).
    Subsequent calls: instant (model stays in VRAM).
    """
    global _xtts_model
    if _xtts_model is None:
        from TTS.api import TTS
        device = detect_device()
        # Bypass interactive license prompt — XTTS-v2 uses Coqui CPML (non-commercial)
        # Set env var before TTS() initializes to skip stdin.input() call
        os.environ["COQUI_TOS_AGREED"] = "1"
        logger.info(f"🎙️ Loading XTTS-v2 on {device} (first run downloads ~1.8GB model)...")
        _xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        logger.info("✅ XTTS-v2 ready")
    return _xtts_model


def get_xtts_embeddings(speaker_wav_path: str, cache_key: str = None):
    """Compute (or return cached) XTTS-v2 speaker conditioning latents.

    For saved voice profiles (permanent files), cache_key = profile_name so the
    embeddings survive across requests. Temporary uploads skip the cache.
    """
    global _xtts_embedding_cache
    if cache_key and cache_key in _xtts_embedding_cache:
        logger.info(f"🎯 Speaker embedding cache hit: '{cache_key}'")
        return _xtts_embedding_cache[cache_key]

    logger.info(f"🔄 Computing speaker embedding{' for ' + cache_key if cache_key else ''}...")
    tts = get_xtts()
    gpt_cond_latent, speaker_embedding = tts.synthesizer.tts_model.get_conditioning_latents(
        audio_path=[speaker_wav_path]
    )
    if cache_key:
        _xtts_embedding_cache[cache_key] = (gpt_cond_latent, speaker_embedding)
        logger.info(f"✅ Speaker embedding cached: '{cache_key}'")
    return gpt_cond_latent, speaker_embedding


def xtts_synthesize(text: str, language: str, speaker_wav_path: str, out_path: str, cache_key: str = None) -> None:
    """Synthesize text using XTTS-v2 with optional embedding cache."""
    final_text = clean_text_for_xtts(text)
    print(f"Texto Final para TTS: {final_text}")
    tts = get_xtts()
    if xtts_available():
        try:
            gpt_cond_latent, speaker_embedding = get_xtts_embeddings(speaker_wav_path, cache_key)
            out = tts.synthesizer.tts_model.inference(
                final_text, "pt", gpt_cond_latent, speaker_embedding,
                temperature=0.8,
                repetition_penalty=2.0,
                speed=1.1,
                enable_text_splitting=True,
            )
            wav = out["wav"]
            tts.synthesizer.save_wav(wav, out_path)
            return
        except Exception as e:
            logger.warning(f"⚠️ Low-level XTTS inference failed ({e}), falling back to tts_to_file")
    # Fallback: standard API (no embedding cache benefit)
    xtts_tts_to_file_with_style(tts, final_text, speaker_wav_path, out_path)


def clean_text_for_xtts(text: str) -> str:
    """Normalize whitespace only; keep punctuation symbols for prosody pauses."""
    cleaned = text.replace("\r", " ").replace("\n", " ")
    cleaned = "".join(ch for ch in cleaned if (ch.isprintable() or ch == "\t"))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def xtts_tts_to_file_with_style(tts, text: str, speaker_wav: str, file_path: str) -> None:
    """Call XTTS tts_to_file with style params and fallback for older signatures."""
    try:
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language="pt",
            file_path=file_path,
            temperature=0.8,
            repetition_penalty=2.0,
            speed=1.1,
        )
    except TypeError:
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language="pt",
            file_path=file_path,
            temperature=0.8,
            repetition_penalty=2.0,
        )


def finetuned_tts_to_file(tts, text: str, speaker_wav: str, file_path: str, speed: float = 1.0) -> None:
    """Synthesize using a finetuned XTTS model with optional speech speed."""
    clamped_speed = max(0.5, min(1.8, float(speed)))
    try:
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language="pt",
            file_path=file_path,
            temperature=0.8,
            repetition_penalty=2.0,
            speed=clamped_speed,
        )
    except TypeError:
        # Older signatures may not support speed.
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language="pt",
            file_path=file_path,
            temperature=0.8,
            repetition_penalty=2.0,
        )


def _finetuned_model_metadata(user_id: str) -> Optional[dict]:
    """Build lightweight metadata for one user's latest fine-tuned model."""
    model_dir = _find_latest_finetuned_dir(user_id)
    if not model_dir:
        return None

    best_files = sorted(model_dir.glob("best_model*.pth"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not best_files:
        return None

    model_file = best_files[0]
    created_at = datetime.utcfromtimestamp(model_file.stat().st_mtime).isoformat() + "Z"
    size_mb = round(model_file.stat().st_size / (1024 * 1024), 2)
    return {
        "user_id": user_id,
        "created_at": created_at,
        "size_mb": size_mb,
        "model_path": str(model_file),
        "run_dir": str(model_dir),
    }


def _resolve_first_profile_reference(user_id: str) -> Optional[Path]:
    """Pick a reference wav from onboarding dataset for a finetuned profile."""
    layout = get_profile_layout(user_id)
    for base in (layout["manual_dir"], layout["spontaneous_dir"]):
        if base.exists():
            wavs = sorted(base.glob("*.wav"))
            if wavs:
                return wavs[0]
    return None


def _find_latest_finetuned_dir(user_id: str) -> Optional[Path]:
    """Return latest finetuned run directory containing best_model*.pth + config.json."""
    runs_dir = FINETUNE_BASE / user_id / "runs"
    if not runs_dir.exists():
        return None
    best_files = sorted(
        runs_dir.glob("**/best_model*.pth"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for bf in best_files:
        model_dir = bf.parent
        if (model_dir / "config.json").exists():
            return model_dir
    return None


def _has_finetuned_model(user_id: str) -> bool:
    """Fast check for existence of any valid finetuned run for a user."""
    return _find_latest_finetuned_dir(user_id) is not None


def _resolve_vocab_for_finetuned(model_dir: Path) -> Optional[Path]:
    """Find vocab.json for a finetuned run using config path or fallback cache search."""
    cfg_path = model_dir / "config.json"
    if cfg_path.exists():
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
            vocab = cfg.get("model_args", {}).get("tokenizer_file")
            if vocab:
                vp = Path(vocab)
                if vp.exists():
                    return vp
        except Exception:
            pass

    # fallback: search near profile runs
    user_runs_dir = model_dir.parents[1] if len(model_dir.parents) > 1 else model_dir.parent
    hits = sorted(
        user_runs_dir.glob("**/pretrained_cache/coqui_xtts_v2/vocab.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if hits:
        return hits[0]
    return None


def _promote_finetuned_current(user_id: str) -> Optional[Path]:
    """Prepare backend/models/xtts_finetuned/<user_id>/current for inference."""
    layout = ensure_profile_layout(user_id)
    current_dir = layout["current_dir"]
    model_dir = _find_latest_finetuned_dir(user_id)
    if not model_dir:
        return None

    src_model = model_dir / "best_model.pth"
    if not src_model.exists():
        all_best = sorted(model_dir.glob("best_model*.pth"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not all_best:
            return None
        src_model = all_best[0]

    src_cfg = model_dir / "config.json"
    src_vocab = _resolve_vocab_for_finetuned(model_dir)
    if not src_vocab or not src_vocab.exists():
        current_vocab = current_dir / "vocab.json"
        global_vocab = FINETUNE_BASE / "_pretrained_cache" / "coqui_xtts_v2" / "vocab.json"
        if current_vocab.exists():
            src_vocab = current_vocab
        elif global_vocab.exists():
            src_vocab = global_vocab

    if not src_cfg.exists() or not src_vocab or not src_vocab.exists():
        logger.warning("Finetuned promotion skipped for %s (missing config/vocab)", user_id)
        return None

    current_dir.mkdir(parents=True, exist_ok=True)
    dst_model = current_dir / "model.pth"
    dst_cfg = current_dir / "config.json"
    dst_vocab = current_dir / "vocab.json"

    # Avoid copying large model files on every request.
    if (not dst_model.exists()) or (src_model.stat().st_mtime > dst_model.stat().st_mtime):
        shutil.copy2(src_model, dst_model)
    if (not dst_cfg.exists()) or (src_cfg.stat().st_mtime > dst_cfg.stat().st_mtime):
        shutil.copy2(src_cfg, dst_cfg)
    if (not dst_vocab.exists()) or (src_vocab.stat().st_mtime > dst_vocab.stat().st_mtime):
        shutil.copy2(src_vocab, dst_vocab)
    return current_dir


def _get_finetuned_tts(user_id: str):
    """Load cached finetuned XTTS model for one user from /current."""
    current_dir = _promote_finetuned_current(user_id)
    if not current_dir:
        raise RuntimeError(f"No finetuned model available for profile '{user_id}'.")

    model_path = current_dir / "model.pth"
    config_path = current_dir / "config.json"
    if not model_path.exists() or not config_path.exists():
        raise RuntimeError(f"Invalid finetuned current model for '{user_id}'.")

    mtime = model_path.stat().st_mtime
    cached = _xtts_finetuned_cache.get(user_id)
    if cached and cached.get("mtime") == mtime and cached.get("tts") is not None:
        return cached["tts"]

    from TTS.api import TTS

    device = detect_device()
    logger.info("🎙️ Loading finetuned XTTS for '%s' on %s", user_id, device)
    tts = TTS(model_path=str(current_dir), config_path=str(config_path)).to(device)
    _xtts_finetuned_cache[user_id] = {"mtime": mtime, "tts": tts}
    return tts


# ────────────────────────────────────────────────────────────────────────────────
# Device detection (identical to ultra_optimized_server.py)
# ────────────────────────────────────────────────────────────────────────────────
def detect_device(requested_device: str = "auto") -> str:
    """Detect the best available compute device honoring override flags and requests."""
    try:
        if requested_device and requested_device != "auto":
            if requested_device == "cpu":
                return "cpu"
            if requested_device == "cuda" and torch.cuda.is_available():
                return "cuda"
            logger.warning(f"Requested device '{requested_device}' not available, falling back to auto")

        if FORCE_CPU:
            logger.info("⚠️ FORCE_CPU enabled — forcing CPU execution")
            return "cpu"

        if PREFER_CPU and requested_device == "auto":
            logger.info("⚠️ PREFER_CPU enabled — sticking to CPU for stability")
            return "cpu"

        # Linux / ROCm priority — on Ubuntu with ROCm, cuda.is_available() == True
        if sys.platform in ("linux", "linux2"):
            if torch.cuda.is_available():
                logger.debug("🐧 Linux + ROCm detected: using CUDA/ROCm path")
                return "cuda"

        if torch.cuda.is_available():
            return "cuda"

        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps"

        logger.info("ℹ️ Falling back to CPU")
        return "cpu"
    except Exception as e:
        logger.warning(f"Device detection failed ({e}); falling back to CPU")
        return "cpu"


# ────────────────────────────────────────────────────────────────────────────────
# TTS via edge-tts (Python 3.12 compatible — Coqui TTS requires Python <3.12)
# ────────────────────────────────────────────────────────────────────────────────
async def edge_tts_generate(text: str, voice: str, output_path: str) -> None:
    """Generate speech using edge-tts and save to output_path as MP3."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


def get_whisper():
    """Load or return cached HuggingFace transformers Whisper pipeline.

    Uses whisper-large-v3-turbo — faster than large-v3, same accuracy, less VRAM.
    ROCm-native: loads on CPU first then moves to GPU to avoid AMD segfault.
    See: docs/notes/audio-studio-status-2026-02-16.md
    """
    global _whisper_model
    if _whisper_model is None:
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline as hf_pipeline

        device = detect_device()
        torch_dtype = torch.float16 if device == "cuda" else torch.float32
        model_id = "openai/whisper-large-v3-turbo"

        logger.info(f"📝 Loading {model_id} on {device} ({torch_dtype})...")

        # Load on CPU first to avoid ROCm segfault with direct device='cuda'
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_id,
            torch_dtype=torch_dtype,
            low_cpu_mem_usage=True,
            use_safetensors=True,
        )
        if device == "cuda":
            model = model.to(torch.device("cuda"))

        processor = AutoProcessor.from_pretrained(model_id)

        _whisper_model = hf_pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            torch_dtype=torch_dtype,
        )
        logger.info(f"✅ {model_id} ready on {device}")
    return _whisper_model


def get_pyannote():
    """Load or return cached pyannote speaker diarization pipeline."""
    global _pyannote_pipeline
    if _pyannote_pipeline is None:
        from pyannote.audio import Pipeline
        if not HF_TOKEN:
            raise RuntimeError(
                "HF_TOKEN environment variable is required for speaker diarization. "
                "Set it in your .env file."
            )
        logger.info("👥 Loading pyannote/speaker-diarization-3.1...")
        _pyannote_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HF_TOKEN,
        )
        device = detect_device()
        if device == "cuda":
            _pyannote_pipeline = _pyannote_pipeline.to(torch.device("cuda"))
        logger.info("✅ pyannote ready")
    return _pyannote_pipeline


# ────────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────────
def audio_file_to_base64(file_path: str) -> str:
    """Read an audio file and return base64-encoded data URI (auto-detects WAV/MP3)."""
    with open(file_path, "rb") as f:
        data = f.read()
    encoded = base64.b64encode(data).decode("utf-8")
    mime = "audio/mpeg" if file_path.endswith(".mp3") else "audio/wav"
    return f"data:{mime};base64,{encoded}"


def save_upload_to_temp(upload: UploadFile) -> str:
    """Save an uploaded file to a temp path and return the path."""
    suffix = Path(upload.filename).suffix if upload.filename else ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(upload.file.read())
    tmp.flush()
    tmp.close()
    return tmp.name


def combine_speakers_transcription(diarization_segments, transcription_segments):
    """
    Match transcription segments to speaker segments (from Whisper-BR deduplication logic).
    Returns list of {speaker, start, end, text}.
    """
    result = []
    for seg_dia in diarization_segments:
        start_dia = seg_dia["start"]
        end_dia = seg_dia["end"]
        speaker = seg_dia["speaker"]
        texts = []
        for seg_trans in transcription_segments:
            overlap_start = max(seg_trans["start"], start_dia)
            overlap_end = min(seg_trans["end"], end_dia)
            overlap = overlap_end - overlap_start
            duration = seg_trans["end"] - seg_trans["start"]
            if duration > 0 and overlap > 0.3 and (overlap / duration) > 0.5:
                texts.append({"text": seg_trans["text"], "start": seg_trans["start"]})
        if texts:
            texts.sort(key=lambda x: x["start"])
            result.append({
                "speaker": speaker,
                "start": start_dia,
                "end": end_dia,
                "text": " ".join(t["text"] for t in texts).strip(),
            })
    return result


def get_audio_duration(audio_path: str) -> float:
    """Get audio duration in seconds via soundfile."""
    try:
        import soundfile as sf
        with sf.SoundFile(audio_path) as f:
            return len(f) / f.samplerate
    except Exception:
        return 0.0


def format_timestamp(seconds: float) -> str:
    """Format seconds as MM:SS."""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"


# ────────────────────────────────────────────────────────────────────────────────
# Voice Onboarding helpers
# ────────────────────────────────────────────────────────────────────────────────

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Base directory for onboarding datasets (centralized under backend workers)
DATASETS_BASE = PROJECT_ROOT / "backend" / "workers" / "xtts" / "datasets"

# Fine-tuning artifacts per profile:
# backend/models/xtts_finetuned/<user_id>/{jobs,runs,current}
FINETUNE_BASE = PROJECT_ROOT / "backend" / "models" / "xtts_finetuned"
TRAIN_SCRIPT_PATH = PROJECT_ROOT / "train_xtts_amd.py"

# In-memory train job registry (runtime only).
TRAIN_JOBS: Dict[str, dict] = {}


def _normalize_whatsapp_number(number: str) -> str:
    digits = "".join(ch for ch in (number or "") if ch.isdigit())
    # BR convenience: if user sends DDD+numero (10/11 digits), prepend country code 55.
    if len(digits) in (10, 11) and not digits.startswith("55"):
        digits = f"55{digits}"
    return digits


def _send_whatsapp_message(number: str, text: str) -> tuple[bool, str]:
    """Send message via Evolution API. Returns (sent, reason)."""
    to = _normalize_whatsapp_number(number)
    if not to:
        return False, "invalid_number"
    if not EVOLUTION_BASE_URL or not EVOLUTION_API_KEY or not EVOLUTION_INSTANCE:
        logger.warning("WhatsApp notifier not configured (missing Evolution env vars)")
        return False, "not_configured"

    url = f"{EVOLUTION_BASE_URL}/message/sendText/{EVOLUTION_INSTANCE}"
    payload = {
        "number": to,
        "text": text,
        "options": {"delay": 1200, "presence": "composing"},
    }
    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = getattr(resp, "status", 200)
            if 200 <= status < 300:
                logger.info("WhatsApp notification sent to %s", to)
                return True, "ok"
            logger.warning("WhatsApp notification failed with status %s", status)
            return False, f"http_{status}"
    except urllib.error.HTTPError as e:
        logger.error("WhatsApp notification HTTPError: %s", e.code)
        return False, f"http_{e.code}"
    except Exception as e:
        logger.error("WhatsApp notification error: %s", e)
        return False, "exception"


def _watch_training_job(job_id: str, proc: subprocess.Popen) -> None:
    """Background watcher to update job status as soon as training exits."""
    t0 = time.time()
    exit_code = proc.wait()
    job = TRAIN_JOBS.get(job_id)
    if not job:
        return
    job["status"] = "completed" if exit_code == 0 else "failed"
    job["exit_code"] = exit_code
    job["finished_at"] = datetime.utcnow().isoformat() + "Z"
    job["duration_minutes"] = round((time.time() - t0) / 60.0, 1)

    wa = _normalize_whatsapp_number(job.get("whatsapp", ""))
    if wa:
        user_id = job.get("user_id", "unknown")
        dataset = job.get("dataset", {})
        if exit_code == 0:
            msg = (
                "✅ XTTS fine-tuning concluído com sucesso!\n\n"
                f"🎙️ Perfil: {user_id}\n"
                f"📊 Dataset: {dataset.get('manual_files', 0)} guiadas + {dataset.get('spontaneous_files', 0)} espontâneas\n"
                f"⏱️ Tempo: {job['duration_minutes']} minutos\n"
                f"🆔 Job: {job_id}\n"
            )
        else:
            msg = (
                "❌ XTTS fine-tuning falhou\n\n"
                f"🎙️ Perfil: {user_id}\n"
                f"🆔 Job: {job_id}\n"
                f"📄 Log: {job.get('log_path')}\n"
                "Verifique o log para detalhes do erro."
            )
        sent, reason = _send_whatsapp_message(wa, msg)
        job["notification_finish"] = {"requested": True, "sent": sent, "reason": reason}


def _release_gpu_for_training() -> None:
    """Free GPU-heavy runtime models before spawning a long fine-tuning job."""
    global _whisper_model, _pyannote_pipeline, _xtts_model, _xtts_embedding_cache, _xtts_finetuned_cache
    released = []

    if _whisper_model is not None:
        _whisper_model = None
        released.append("whisper")
    if _pyannote_pipeline is not None:
        _pyannote_pipeline = None
        released.append("pyannote")
    if _xtts_model is not None:
        _xtts_model = None
        released.append("xtts_base")
    if _xtts_embedding_cache:
        _xtts_embedding_cache.clear()
        released.append("xtts_embeddings")
    if _xtts_finetuned_cache:
        _xtts_finetuned_cache.clear()
        released.append("xtts_finetuned")

    gc.collect()
    if torch.cuda.is_available():
        try:
            torch.cuda.empty_cache()
        except Exception:
            pass
        try:
            torch.cuda.ipc_collect()
        except Exception:
            pass

    if released:
        logger.info("🧹 Released GPU resources before training: %s", ", ".join(released))


async def ffmpeg_normalize(input_path: str, output_path: str) -> None:
    """Convert any audio format to 22050Hz mono WAV via ffmpeg.
    Handles: OGG Opus (WhatsApp), MP3, M4A, WebM (browser recording), FLAC, etc.
    """
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "22050", "-ac", "1", "-acodec", "pcm_s16le",
        output_path,
        "-loglevel", "error",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg normalization failed: {stderr.decode(errors='replace')}")


def get_next_index(directory: Path, prefix: str) -> int:
    """Find the next available integer index for files named <prefix>_NNN.wav."""
    existing = list(directory.glob(f"{prefix}_*.wav"))
    if not existing:
        return 1
    indices = []
    for f in existing:
        try:
            indices.append(int(f.stem.rsplit("_", 1)[-1]))
        except ValueError:
            pass
    return max(indices) + 1 if indices else 1


def sanitize_user_id(user_id: str) -> str:
    """Sanitize user_id to filesystem-safe lowercase token."""
    return "".join(c for c in user_id.strip().lower() if c.isalnum() or c in "_-")


def get_profile_layout(user_id: str) -> dict:
    """Return canonical dataset and artifacts layout for one profile."""
    dataset_root = DATASETS_BASE / user_id
    artifacts_root = FINETUNE_BASE / user_id
    return {
        "dataset_root": dataset_root,
        "manual_dir": dataset_root / "manual",
        "spontaneous_dir": dataset_root / "spontaneous",
        "manifest_path": dataset_root / "manifest.json",
        "artifacts_root": artifacts_root,
        "jobs_dir": artifacts_root / "jobs",
        "runs_dir": artifacts_root / "runs",
        "current_dir": artifacts_root / "current",
        "profile_info": artifacts_root / "profile.json",
    }


def ensure_profile_layout(user_id: str) -> dict:
    layout = get_profile_layout(user_id)
    layout["manual_dir"].mkdir(parents=True, exist_ok=True)
    layout["spontaneous_dir"].mkdir(parents=True, exist_ok=True)
    layout["jobs_dir"].mkdir(parents=True, exist_ok=True)
    layout["runs_dir"].mkdir(parents=True, exist_ok=True)
    layout["current_dir"].mkdir(parents=True, exist_ok=True)
    return layout


def _profile_dataset_stats(user_id: str) -> dict:
    layout = get_profile_layout(user_id)
    manual_count = len(list(layout["manual_dir"].glob("*.wav"))) if layout["manual_dir"].exists() else 0
    spontaneous_count = len(list(layout["spontaneous_dir"].glob("*.wav"))) if layout["spontaneous_dir"].exists() else 0
    total_files = manual_count + spontaneous_count
    total_duration = 0.0
    if layout["manifest_path"].exists():
        try:
            entries = json.loads(layout["manifest_path"].read_text())
            total_duration = sum(e.get("duration", 0) for e in entries)
        except Exception:
            pass
    return {
        "manual_files": manual_count,
        "spontaneous_files": spontaneous_count,
        "total_files": total_files,
        "total_duration_seconds": round(total_duration, 2),
        "dataset_dir": str(layout["dataset_root"]),
    }


def _dataset_stats_from_root(dataset_root: Path, user_id: str) -> dict:
    manual_dir = dataset_root / "manual"
    spontaneous_dir = dataset_root / "spontaneous"
    manual_count = len(list(manual_dir.glob("*.wav"))) if manual_dir.exists() else 0
    spontaneous_count = len(list(spontaneous_dir.glob("*.wav"))) if spontaneous_dir.exists() else 0
    total_files = manual_count + spontaneous_count

    total_duration = 0.0
    manifest_path = dataset_root / "manifest.json"
    if manifest_path.exists():
        try:
            entries = json.loads(manifest_path.read_text())
            total_duration = sum(e.get("duration", 0) for e in entries)
        except Exception:
            pass

    wavs = list(dataset_root.rglob("*.wav"))

    # Fallback for fixed datasets (usually don't have manifest.json/manual/spontaneous split)
    if total_files == 0 and wavs:
        total_files = len(wavs)
        manual_count = len(wavs)
        spontaneous_count = 0

    if total_duration == 0.0 and wavs:
        total_duration = sum(get_audio_duration(str(w)) for w in wavs)

    return {
        "manual_files": manual_count,
        "spontaneous_files": spontaneous_count,
        "total_files": total_files,
        "total_duration_seconds": round(total_duration, 2),
        "dataset_dir": str(dataset_root),
        "profile_user_id": user_id,
    }


def _resolve_training_dataset_root(user_id: str) -> tuple[Path, str]:
    """Select training dataset root. Prefer '<user_id>_fixed' when available and non-empty."""
    base_root = DATASETS_BASE / user_id
    fixed_root = DATASETS_BASE / f"{user_id}_fixed"

    if fixed_root.exists():
        fixed_wavs = list(fixed_root.rglob("*.wav"))
        if len(fixed_wavs) >= 2:
            return fixed_root, "fixed"
    return base_root, "base"


async def process_onboarding_file(
    upload: UploadFile,
    user_dir: Path,
    prefix: str,
    index: int,
    language: str = "pt",
) -> dict:
    """Normalize one uploaded audio file and transcribe it.

    Pipeline: save upload → ffmpeg 22050Hz mono WAV → whisper transcript → save .txt
    """
    raw_path = save_upload_to_temp(upload)
    clip_name = f"{prefix}_{index:03d}"
    wav_path  = user_dir / f"{clip_name}.wav"
    txt_path  = user_dir / f"{clip_name}.txt"

    try:
        await ffmpeg_normalize(raw_path, str(wav_path))
        duration = get_audio_duration(str(wav_path))

        pipe = get_whisper()
        generate_kwargs = {"task": "transcribe"}
        if language and language != "auto":
            generate_kwargs["language"] = language

        # return_timestamps=True is required for audio > 30s (> 3000 mel features).
        # For short clips it works equally well — always use it to avoid the error.
        result = pipe(
            str(wav_path),
            return_timestamps=True,
            chunk_length_s=30,
            stride_length_s=5,
            generate_kwargs=generate_kwargs,
        )
        # Extract full text from chunks (same pattern as /transcribe endpoint)
        chunks = result.get("chunks", [])
        if chunks:
            transcript = " ".join(c["text"].strip() for c in chunks if c.get("text")).strip()
        else:
            transcript = result.get("text", "").strip()
        txt_path.write_text(transcript, encoding="utf-8")

        return {
            "filename": f"{clip_name}.wav",
            "transcript": transcript,
            "duration_seconds": round(duration, 2),
            "path": str(wav_path),
        }
    finally:
        try:
            os.remove(raw_path)
        except Exception:
            pass


def _update_onboarding_manifest(user_id: str, source: str, results: list, user_dir: Path):
    """Append successfully processed files to the user's manifest.json."""
    manifest_path = DATASETS_BASE / user_id / "manifest.json"
    existing = []
    if manifest_path.exists():
        try:
            existing = json.loads(manifest_path.read_text())
        except Exception:
            pass
    for r in results:
        if "error" not in r:
            existing.append({
                "audio":    r["path"],
                "text":     r["transcript"],
                "speaker":  user_id,
                "source":   source,
                "duration": r["duration_seconds"],
                "filename": r["filename"],
            })
    manifest_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2))


# ────────────────────────────────────────────────────────────────────────────────
# Routes
# ────────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    device = detect_device()
    xtts_ready = xtts_available()
    return {
        "status": "ok",
        "device": device,
        "cuda_available": torch.cuda.is_available(),
        "clone_engine": "xtts_v2" if xtts_ready else "edge-tts (fallback — pip install coqui-tts)",
        "tts_engine": "edge-tts (cloud, PT-BR voices)",
        "models_loaded": {
            "whisper": _whisper_model is not None,
            "pyannote": _pyannote_pipeline is not None,
        },
    }


@app.get("/voices")
def get_voices():
    """List available TTS voices (edge-tts standard + saved XTTS-v2 profiles)."""
    voices = [dict(v, type="standard", is_profile=False) for v in EDGE_TTS_PT_VOICES]

    if VOICE_PROFILES_DIR.exists():
        for wav_file in sorted(VOICE_PROFILES_DIR.glob("*.wav")):
            profile_name = wav_file.stem
            duration = get_audio_duration(str(wav_file))
            voices.append({
                "id": f"profile:{profile_name}",
                "name": profile_name.replace("_", " ").title(),
                "language": "multilingual",
                "model": "xtts_v2",
                "clone_capable": True,
                "is_profile": True,
                "type": "profile",
                "profile_name": profile_name,
                "duration_seconds": round(duration, 2),
                "cached": profile_name in _xtts_embedding_cache,
            })

    if FINETUNE_BASE.exists():
        for user_dir in sorted(FINETUNE_BASE.iterdir()):
            if not user_dir.is_dir():
                continue
            user_id = user_dir.name
            if not _has_finetuned_model(user_id):
                continue
            voices.append({
                "id": f"finetuned:{user_id}",
                "name": f"{user_id.replace('_', ' ').title()} (Fine-tuned)",
                "language": "pt",
                "model": "xtts_v2_finetuned",
                "clone_capable": True,
                "is_profile": True,
                "is_finetuned": True,
                "type": "profile",
                "profile_name": f"finetuned:{user_id}",
                "duration_seconds": None,
                "cached": user_id in _xtts_finetuned_cache,
            })

    return {"voices": voices}


@app.get("/finetuned-models")
def list_finetuned_models():
    """List latest finetuned model metadata for every profile."""
    models = []
    if FINETUNE_BASE.exists():
        for user_dir in sorted(FINETUNE_BASE.iterdir()):
            if not user_dir.is_dir():
                continue
            meta = _finetuned_model_metadata(user_dir.name)
            if meta:
                models.append(meta)
    return {"models": models}


@app.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    voice: str = Form("pt-BR-FranciscaNeural"),
    language: str = Form("pt"),
):
    """
    Convert text to speech using edge-tts (cloud, excellent PT-BR quality).
    Returns base64-encoded MP3 audio.
    Note: Coqui TTS requires Python <3.12. edge-tts is used instead.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    # Auto-select a default voice matching the language if the caller sends old IDs
    voice_map = {
        "pt_vits": "pt-BR-FranciscaNeural",
        "pt": "pt-BR-FranciscaNeural",
        "en": "en-US-JennyNeural",
        "es": "es-MX-DaliaNeural",
        "de": "de-DE-KatjaNeural",
    }
    resolved_voice = voice_map.get(voice, voice)

    logger.info(f"🔊 TTS request: {len(text)} chars, voice={resolved_voice}")
    t0 = time.time()

    out_path = str(OUT_DIR / f"tts_{uuid.uuid4().hex[:8]}.mp3")

    try:
        await edge_tts_generate(text, resolved_voice, out_path)
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    elapsed = time.time() - t0
    audio_b64 = audio_file_to_base64(out_path)

    try:
        os.remove(out_path)
    except Exception:
        pass

    logger.info(f"✅ TTS done in {elapsed:.2f}s")

    return {
        "audio_base64": audio_b64,
        "format": "mp3",
        "duration_seconds": elapsed,
        "model": f"edge-tts/{resolved_voice}",
        "characters": len(text),
    }


@app.post("/voices/clone/save")
async def save_voice_profile(
    name: str = Form(...),
    reference_audio: UploadFile = File(...),
):
    """
    Save a reference audio file as a permanent named voice profile.

    The audio is normalized to 22050Hz mono WAV and stored in models/voice_profiles/.
    Saved profiles appear in GET /voices and can be used in POST /clone via
    voice_profile_name (no re-upload required).
    """
    if not name.strip():
        raise HTTPException(status_code=400, detail="name is required")

    safe_name = "".join(
        c for c in name.strip().lower().replace(" ", "_") if c.isalnum() or c == "_"
    )
    if not safe_name:
        raise HTTPException(status_code=400, detail="name contains no valid characters")

    VOICE_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    profile_path = VOICE_PROFILES_DIR / f"{safe_name}.wav"

    raw_path = save_upload_to_temp(reference_audio)
    try:
        await ffmpeg_normalize(raw_path, str(profile_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio normalization failed: {e}")
    finally:
        try:
            os.remove(raw_path)
        except Exception:
            pass

    # Invalidate stale embedding cache for this profile
    if safe_name in _xtts_embedding_cache:
        del _xtts_embedding_cache[safe_name]
        logger.info(f"🗑️  Cleared stale embedding cache for '{safe_name}'")

    duration = get_audio_duration(str(profile_path))
    logger.info(f"✅ Voice profile saved: '{safe_name}' ({duration:.1f}s)")

    return {
        "profile_name": safe_name,
        "display_name": safe_name.replace("_", " ").title(),
        "path": str(profile_path),
        "duration_seconds": round(duration, 2),
        "message": f"Voice profile '{safe_name}' saved successfully",
    }


@app.post("/clone")
async def clone_voice(
    text: str = Form(...),
    language: str = Form("pt"),
    reference_audio: Optional[UploadFile] = File(None),
    voice_profile_name: Optional[str] = Form(None),
):
    """
    Voice cloning: synthesize text using a speaker voice.

    Two input modes (one is required):
      - voice_profile_name: use a previously saved profile from models/voice_profiles/
        (fast — speaker embeddings are cached in memory after first use)
      - reference_audio: upload a WAV/MP3/OGG file on-the-fly (6-30s of clean speech)
        (no caching — embedding is computed each request)

    Engine priority:
      1. XTTS-v2 (Coqui) — true zero-shot voice cloning, GPU-accelerated via ROCm.
      2. edge-tts fallback — if coqui-tts is not installed.

    Returns base64-encoded WAV (XTTS) or MP3 (edge-tts fallback).
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    if not voice_profile_name and not reference_audio:
        raise HTTPException(
            status_code=400,
            detail="either voice_profile_name or reference_audio is required",
        )

    t0 = time.time()
    ref_path = None
    out_path = None
    cache_key = None
    finetuned_user_id = None
    temp_ref_upload = False
    final_text = clean_text_for_xtts(text)
    print(f"Texto Final para TTS: {final_text}")

    try:
        # Resolve reference audio path
        if voice_profile_name and voice_profile_name.startswith("finetuned:"):
            finetuned_user_id = sanitize_user_id(voice_profile_name.split(":", 1)[1])
            if not finetuned_user_id:
                raise HTTPException(status_code=400, detail="invalid finetuned profile id")

        if reference_audio:
            ref_path = save_upload_to_temp(reference_audio)
            temp_ref_upload = True
            if finetuned_user_id:
                logger.info(
                    "🎤 XTTS-v2 finetuned clone: profile='%s', ref=%s, chars=%d, lang=%s",
                    finetuned_user_id, reference_audio.filename, len(text), language
                )
            else:
                logger.info(f"🎤 XTTS-v2 clone: ref={reference_audio.filename}, {len(text)} chars, lang={language}")
        elif voice_profile_name:
            if finetuned_user_id:
                ref_wav = _resolve_first_profile_reference(finetuned_user_id)
                if not ref_wav or not ref_wav.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Finetuned profile '{finetuned_user_id}' has no reference audio in dataset.",
                    )
                ref_path = str(ref_wav)
                cache_key = None
                logger.info(
                    "🎤 XTTS-v2 finetuned clone: profile='%s', chars=%d, lang=%s",
                    finetuned_user_id, len(text), language
                )
            else:
                profile_path = VOICE_PROFILES_DIR / f"{voice_profile_name}.wav"
                if not profile_path.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Voice profile '{voice_profile_name}' not found",
                    )
                ref_path = str(profile_path)
                cache_key = voice_profile_name
                logger.info(f"🎤 XTTS-v2 clone: profile='{voice_profile_name}', {len(text)} chars, lang={language}")

        # ── Path 1: XTTS-v2 (coqui-tts installed in same venv) ───────────────
        if xtts_available():
            out_path = str(OUT_DIR / f"clone_{uuid.uuid4().hex[:8]}.wav")
            device = detect_device()

            # Run in thread pool — XTTS is synchronous and CPU/GPU blocking
            loop = asyncio.get_event_loop()
            if finetuned_user_id:
                await loop.run_in_executor(
                    None,
                    lambda: xtts_tts_to_file_with_style(_get_finetuned_tts(finetuned_user_id), final_text, ref_path, out_path),
                )
            else:
                await loop.run_in_executor(
                    None,
                    lambda: xtts_synthesize(final_text, language, ref_path, out_path, cache_key),
                )

            elapsed = time.time() - t0
            audio_b64 = audio_file_to_base64(out_path)
            cached = cache_key in _xtts_embedding_cache
            logger.info(
                f"✅ XTTS-v2 clone done in {elapsed:.1f}s on {device}"
                f"{' (embedding cached)' if cached else ''}"
            )

            return {
                "audio_base64": audio_b64,
                "format": "wav",
                "duration_seconds": round(elapsed, 2),
                "model": "xtts_v2_finetuned" if finetuned_user_id else "xtts_v2",
                "device": device,
                "characters": len(text),
                "profile_used": voice_profile_name,
                "embedding_cached": cached,
            }

        # ── Path 2: edge-tts fallback (coqui-tts not installed) ───────────────
        logger.warning("⚠️  coqui-tts not installed — using edge-tts fallback")
        lang_voice = {
            "pt": "pt-BR-ThalitaMultilingualNeural",
            "en": "en-US-JennyNeural",
            "es": "es-MX-DaliaNeural",
            "de": "de-DE-KatjaNeural",
        }.get(language, "pt-BR-ThalitaMultilingualNeural")

        out_path = str(OUT_DIR / f"clone_{uuid.uuid4().hex[:8]}.mp3")
        await edge_tts_generate(text, lang_voice, out_path)

        elapsed = time.time() - t0
        audio_b64 = audio_file_to_base64(out_path)
        logger.info(f"✅ edge-tts fallback done in {elapsed:.2f}s")

        return {
            "audio_base64": audio_b64,
            "format": "mp3",
            "duration_seconds": round(elapsed, 2),
            "model": f"edge-tts/{lang_voice}",
            "characters": len(text),
            "note": "XTTS-v2 not installed. Run: pip install coqui-tts",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clone error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Only clean up temp uploads — never delete saved profiles
        if ref_path and temp_ref_upload:
            try:
                os.remove(ref_path)
            except Exception:
                pass
        if out_path:
            try:
                os.remove(out_path)
            except Exception:
                pass


@app.get("/chatterbox/health")
def chatterbox_health():
    """Return Chatterbox integration readiness."""
    return {
        "available": chatterbox_available(),
        "engine": "chatterbox" if chatterbox_available() else "fallback",
        "note": None if chatterbox_available() else "Install chatterbox-tts to enable native engine.",
    }


@app.post("/chatterbox/generate")
async def chatterbox_generate(
    text: str = Form(...),
    language: str = Form("pt"),
    reference_audio: Optional[UploadFile] = File(None),
    voice_profile_name: Optional[str] = Form(None),
    exaggeration: float = Form(0.5),
    cfg_weight: float = Form(0.5),
):
    """
    Chatterbox test endpoint.

    Current behavior:
      - If native chatterbox package exists: use native Chatterbox inference.
      - Else: safe fallback using XTTS (with reference/profile) or edge-tts.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    t0 = time.time()
    ref_path = None
    out_path = None
    final_text = clean_text_for_xtts(text)

    try:
        # Resolve reference similarly to /clone.
        if reference_audio:
            ref_path = save_upload_to_temp(reference_audio)
        elif voice_profile_name:
            if voice_profile_name.startswith("finetuned:"):
                user_id = sanitize_user_id(voice_profile_name.split(":", 1)[1])
                if not user_id:
                    raise HTTPException(status_code=400, detail="invalid finetuned profile id")
                ref_wav = _resolve_first_profile_reference(user_id)
                if not ref_wav or not ref_wav.exists():
                    raise HTTPException(status_code=404, detail=f"Finetuned profile '{user_id}' has no reference audio.")
                ref_path = str(ref_wav)
            else:
                profile_path = VOICE_PROFILES_DIR / f"{voice_profile_name}.wav"
                if not profile_path.exists():
                    raise HTTPException(status_code=404, detail=f"Voice profile '{voice_profile_name}' not found")
                ref_path = str(profile_path)

        # Native Chatterbox path.
        if chatterbox_available():
            out_path = str(OUT_DIR / f"chatterbox_native_{uuid.uuid4().hex[:8]}.wav")
            cbx = get_chatterbox()
            loop = asyncio.get_event_loop()
            # Chatterbox generate is blocking.
            audio = await loop.run_in_executor(
                None,
                lambda: cbx.generate(
                    text=final_text,
                    audio_prompt_path=ref_path,
                    exaggeration=max(0.0, min(1.0, float(exaggeration))),
                    cfg_weight=max(0.0, min(1.0, float(cfg_weight))),
                ),
            )
            # Save tensor -> wav (chatterbox returns torch tensor [1, T]).
            torchaudio.save(out_path, audio.detach().cpu(), cbx.sr)
            audio_b64 = audio_file_to_base64(out_path)
            return {
                "audio_base64": audio_b64,
                "format": "wav",
                "model": "chatterbox_native",
                "engine": "chatterbox",
                "characters": len(text),
                "duration_seconds": round(time.time() - t0, 2),
                "profile_used": voice_profile_name,
                "exaggeration": max(0.0, min(1.0, float(exaggeration))),
                "cfg_weight": max(0.0, min(1.0, float(cfg_weight))),
                "note": "Native Chatterbox generation.",
            }

        # Fallback path while Chatterbox package is not installed.
        if ref_path and xtts_available():
            out_path = str(OUT_DIR / f"chatterbox_fallback_{uuid.uuid4().hex[:8]}.wav")
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: xtts_synthesize(final_text, language, ref_path, out_path, None),
            )
            audio_b64 = audio_file_to_base64(out_path)
            return {
                "audio_base64": audio_b64,
                "format": "wav",
                "model": "chatterbox_fallback_xtts",
                "engine": "xtts_v2",
                "characters": len(text),
                "duration_seconds": round(time.time() - t0, 2),
                "profile_used": voice_profile_name,
                "exaggeration": max(0.0, min(1.0, float(exaggeration))),
                "cfg_weight": max(0.0, min(1.0, float(cfg_weight))),
                "note": "Chatterbox package not installed; fallback to XTTS.",
            }

        # No ref path: fallback to fast TTS.
        out_path = str(OUT_DIR / f"chatterbox_fallback_{uuid.uuid4().hex[:8]}.mp3")
        await edge_tts_generate(text, "pt-BR-FranciscaNeural", out_path)
        audio_b64 = audio_file_to_base64(out_path)
        return {
            "audio_base64": audio_b64,
            "format": "mp3",
            "model": "chatterbox_fallback_edge",
            "engine": "edge-tts",
            "characters": len(text),
            "duration_seconds": round(time.time() - t0, 2),
            "profile_used": voice_profile_name,
            "exaggeration": max(0.0, min(1.0, float(exaggeration))),
            "cfg_weight": max(0.0, min(1.0, float(cfg_weight))),
            "note": "Chatterbox package not installed; fallback to edge-tts.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Chatterbox generate error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if reference_audio and ref_path:
            try:
                os.remove(ref_path)
            except Exception:
                pass
        if out_path:
            try:
                os.remove(out_path)
            except Exception:
                pass


@app.post("/generate-finetuned")
async def generate_finetuned(
    user_id: str = Form(...),
    text: str = Form(...),
    speed: float = Form(1.0),
):
    """Generate speech using one user's fine-tuned XTTS model."""
    safe_uid = sanitize_user_id(user_id)
    if not safe_uid:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    ref_wav = _resolve_first_profile_reference(safe_uid)
    if not ref_wav or not ref_wav.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Profile '{safe_uid}' has no reference audio in dataset.",
        )

    out_path = str(OUT_DIR / f"finetuned_{safe_uid}_{uuid.uuid4().hex[:8]}.wav")
    t0 = time.time()
    final_text = clean_text_for_xtts(text)
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: finetuned_tts_to_file(_get_finetuned_tts(safe_uid), final_text, str(ref_wav), out_path, speed),
        )
        audio_b64 = audio_file_to_base64(out_path)
        elapsed = round(time.time() - t0, 2)
        return {
            "audio_base64": audio_b64,
            "format": "wav",
            "model": "finetuned",
            "engine": "xtts_v2_finetuned",
            "user_id": safe_uid,
            "speed": max(0.5, min(1.8, float(speed))),
            "characters": len(text),
            "duration_seconds": elapsed,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Generate finetuned error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(out_path)
        except Exception:
            pass


@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("pt"),
):
    """
    Transcribe audio to text using whisper-large-v3-turbo (ROCm-native, GPU-accelerated).
    Fast mode — suitable for short audio, narration, podcast clips.
    """
    logger.info(f"📝 Transcription request: {audio.filename}, lang={language}")
    t0 = time.time()

    audio_path = save_upload_to_temp(audio)

    try:
        pipe = get_whisper()
        audio_duration = get_audio_duration(audio_path)

        generate_kwargs = {"task": "transcribe"}
        if language and language != "auto":
            generate_kwargs["language"] = language

        result = pipe(
            audio_path,
            return_timestamps=True,
            chunk_length_s=30,
            stride_length_s=5,
            batch_size=4,
            generate_kwargs=generate_kwargs,
        )

        segments = []
        full_text_parts = []
        for chunk in result.get("chunks", []):
            start, end = chunk["timestamp"]
            if end is None:
                end = start + 30.0
            segments.append({
                "start": round(start, 2),
                "end": round(end, 2),
                "text": chunk["text"].strip(),
            })
            full_text_parts.append(chunk["text"].strip())

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(audio_path)
        except Exception:
            pass

    elapsed = time.time() - t0
    gc.collect()
    logger.info(f"✅ Transcription done in {elapsed:.2f}s, {len(segments)} segments")

    return {
        "text": " ".join(full_text_parts),
        "segments": segments,
        "language": language,
        "duration_audio": round(audio_duration, 2),
        "processing_seconds": round(elapsed, 2),
        "model": "whisper-large-v3-turbo",
    }


@app.post("/transcribe-speakers")
async def transcribe_with_speakers(
    audio: UploadFile = File(...),
    language: str = Form("pt"),
    max_speakers: int = Form(8),
):
    """
    Transcribe audio with speaker identification (diarization).
    Uses faster-whisper + pyannote. Suitable for meetings and multi-person recordings.
    Requires HF_TOKEN environment variable.
    """
    logger.info(f"👥 Speaker transcription: {audio.filename}, lang={language}, max_speakers={max_speakers}")
    t0 = time.time()

    audio_path = save_upload_to_temp(audio)

    try:
        # ── Step 1: Transcription ──────────────────────────────────────────────
        logger.info("📝 Step 1/3: Transcribing...")
        t_trans = time.time()
        pipe = get_whisper()
        audio_duration = get_audio_duration(audio_path)

        generate_kwargs = {"task": "transcribe"}
        if language and language != "auto":
            generate_kwargs["language"] = language

        result = pipe(
            audio_path,
            return_timestamps=True,
            chunk_length_s=30,
            stride_length_s=5,
            batch_size=4,
            generate_kwargs=generate_kwargs,
        )
        transcription_segments = []
        for chunk in result.get("chunks", []):
            start, end = chunk["timestamp"]
            if end is None:
                end = start + 30.0
            transcription_segments.append({
                "start": start,
                "end": end,
                "text": chunk["text"].strip(),
            })
        logger.info(f"   ✅ Transcription done ({time.time()-t_trans:.1f}s), {len(transcription_segments)} segments")

        # ── Step 2: Diarization ────────────────────────────────────────────────
        logger.info("👥 Step 2/3: Speaker diarization...")
        t_dia = time.time()
        pipeline = get_pyannote()
        # Pre-load audio as tensor to avoid torchcodec dependency issues
        import soundfile as sf
        waveform_np, sample_rate = sf.read(audio_path, dtype="float32", always_2d=True)
        waveform_tensor = torch.tensor(waveform_np.T)  # (channels, time)
        diarization = pipeline(
            {"waveform": waveform_tensor, "sample_rate": sample_rate},
            min_speakers=2,
            max_speakers=max_speakers,
        )
        diarization_segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            diarization_segments.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker,
            })
        diarization_segments.sort(key=lambda x: x["start"])
        num_speakers = len(diarization.labels())
        logger.info(f"   ✅ Diarization done ({time.time()-t_dia:.1f}s), {num_speakers} speakers detected")

        # ── Step 3: Combine ────────────────────────────────────────────────────
        logger.info("🔗 Step 3/3: Combining speakers + text...")
        combined = combine_speakers_transcription(diarization_segments, transcription_segments)

        # Format output same as Whisper-BR
        formatted_lines = []
        for seg in combined:
            ts_start = format_timestamp(seg["start"])
            ts_end = format_timestamp(seg["end"])
            formatted_lines.append(f"**{seg['speaker']}** [{ts_start} - {ts_end}]:\n{seg['text']}\n")

    except Exception as e:
        logger.error(f"Speaker transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(audio_path)
        except Exception:
            pass

    elapsed = time.time() - t0
    gc.collect()
    logger.info(f"✅ Full pipeline done in {elapsed:.1f}s")

    return {
        "segments": combined,
        "formatted_text": "\n".join(formatted_lines),
        "num_speakers": num_speakers,
        "language": language,
        "duration_audio": round(audio_duration, 2),
        "processing_seconds": round(elapsed, 2),
        "model": "whisper-large-v3-turbo + pyannote/speaker-diarization-3.1",
    }


@app.post("/onboarding/upload")
async def onboarding_upload(
    user_id:  str = Form(...),
    source:   str = Form("manual"),   # "manual" | "spontaneous"
    language: str = Form("pt"),
    audio:    List[UploadFile] = File(...),
):
    """
    Voice onboarding dataset builder.

    Receives 1..N audio files (from browser recording or external upload),
    normalizes each to 22050Hz mono WAV, transcribes with whisper-large-v3-turbo,
    and saves to the XTTS training dataset directory:

        backend/workers/xtts/datasets/<user_id>/manual/manual_001.wav   ← guided readings
        backend/workers/xtts/datasets/<user_id>/spontaneous/spont_001.wav ← WhatsApp audios

    Accepted formats: WAV, MP3, OGG Opus (WhatsApp), M4A, WebM, FLAC.
    Updates manifest.json for XTTS fine-tuning training.
    """
    if source not in ("manual", "spontaneous"):
        raise HTTPException(status_code=400, detail="source must be 'manual' or 'spontaneous'")
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")

    # Sanitize: alphanumeric + _ + - only, lowercase
    safe_uid = sanitize_user_id(user_id)
    if not safe_uid:
        raise HTTPException(status_code=400, detail="user_id contains no valid characters")

    layout = ensure_profile_layout(safe_uid)
    prefix = "manual" if source == "manual" else "spontaneous"
    user_dir = layout["manual_dir"] if source == "manual" else layout["spontaneous_dir"]

    start_index = get_next_index(user_dir, prefix)
    results     = []

    logger.info(f"Onboarding upload: user={safe_uid}, source={source}, files={len(audio)}, start_idx={start_index}")

    for i, upload_file in enumerate(audio):
        try:
            r = await process_onboarding_file(upload_file, user_dir, prefix, start_index + i, language)
            results.append(r)
            logger.info(f"  [{i+1}/{len(audio)}] {r['filename']} — {r['duration_seconds']}s — \"{r['transcript'][:60]}\"")
        except Exception as e:
            logger.error(f"  [{i+1}/{len(audio)}] {upload_file.filename} failed: {e}")
            results.append({"filename": upload_file.filename or f"file_{i+1}", "error": str(e)})

    _update_onboarding_manifest(safe_uid, source, results, user_dir)
    profile_info = {
        "user_id": safe_uid,
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "dataset_root": str(layout["dataset_root"]),
        "artifacts_root": str(layout["artifacts_root"]),
    }
    layout["profile_info"].write_text(json.dumps(profile_info, ensure_ascii=False, indent=2))
    success = sum(1 for r in results if "error" not in r)
    logger.info(f"Onboarding complete: {success}/{len(results)} OK for user={safe_uid}")

    return {
        "user_id": safe_uid,
        "source":  source,
        "files":   results,
        "total":   len(results),
        "success": success,
        "dataset_dir": str(user_dir),
        "artifacts_dir": str(layout["artifacts_root"]),
    }


# ────────────────────────────────────────────────────────────────────────────────
# Onboarding — profile listing & fine-tuning trigger
# ────────────────────────────────────────────────────────────────────────────────

@app.post("/train/start")
def start_finetune_training(
    user_id: str = Form(...),
    whatsapp: str = Form(""),
    epochs: int = Form(10),
):
    """Start XTTS fine-tuning job for one profile (non-blocking)."""
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    safe_uid = sanitize_user_id(user_id)
    if not safe_uid:
        raise HTTPException(status_code=400, detail="user_id contains no valid characters")

    if not TRAIN_SCRIPT_PATH.exists():
        raise HTTPException(status_code=500, detail=f"Train script not found: {TRAIN_SCRIPT_PATH}")

    layout = ensure_profile_layout(safe_uid)
    dataset_root, dataset_variant = _resolve_training_dataset_root(safe_uid)
    stats = _dataset_stats_from_root(dataset_root, safe_uid)
    if stats["total_files"] < 2:
        raise HTTPException(
            status_code=400,
            detail=f"Perfil '{safe_uid}' possui poucas amostras ({stats['total_files']}). Minimo recomendado: 2.",
        )

    job_id = f"xtts_{safe_uid}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    job_dir = layout["jobs_dir"] / job_id
    run_dir = layout["runs_dir"] / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    run_dir.mkdir(parents=True, exist_ok=True)

    log_path = job_dir / "train.log"
    _release_gpu_for_training()
    cmd = [
        sys.executable,
        str(TRAIN_SCRIPT_PATH),
        "--dataset-dir",
        str(dataset_root),
        "--output-dir",
        str(run_dir),
        "--speaker-name",
        safe_uid,
        "--language",
        "pt",
        "--epochs",
        str(epochs),
        "--batch-size",
        "1",
        "--eval-batch-size",
        "1",
        "--num-workers",
        "0",
        "--max-audio-seconds",
        "20",
    ]

    with log_path.open("a", encoding="utf-8") as logf:
        logf.write(f"[{datetime.utcnow().isoformat()}Z] Starting job {job_id}\n")
        logf.write(f"CMD: {' '.join(cmd)}\n\n")
        logf.flush()
        proc = subprocess.Popen(
            cmd,
            cwd=str(PROJECT_ROOT),
            stdout=logf,
            stderr=subprocess.STDOUT,
        )

    TRAIN_JOBS[job_id] = {
        "job_id": job_id,
        "user_id": safe_uid,
        "status": "running",
        "pid": proc.pid,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "dataset_dir": str(dataset_root),
        "dataset_variant": dataset_variant,
        "run_dir": str(run_dir),
        "log_path": str(log_path),
        "whatsapp": whatsapp.strip() if whatsapp else "",
        "epochs": epochs,
        "dataset": stats,
    }
    threading.Thread(target=_watch_training_job, args=(job_id, proc), daemon=True).start()

    wa = _normalize_whatsapp_number(whatsapp)
    notif = {"requested": bool(wa), "sent": False, "reason": "not_requested"}
    if wa:
        start_msg = (
            "🎙️ Fine-tuning APIBR2\n\n"
            f"Perfil: {safe_uid}\n"
            f"Dataset: {stats['manual_files']} leituras guiadas + {stats['spontaneous_files']} espontâneas\n"
            f"Job ID: {job_id}\n\n"
            "⏳ O treinamento foi colocado na fila. "
            "Você receberá outra mensagem quando concluir."
        )
        sent, reason = _send_whatsapp_message(wa, start_msg)
        notif = {"requested": True, "sent": sent, "reason": reason}
        TRAIN_JOBS[job_id]["notification_start"] = notif

    logger.info(
        "🚀 Fine-tune job started: %s | user=%s | pid=%s | dataset_files=%s | dataset_variant=%s",
        job_id,
        safe_uid,
        proc.pid,
        stats["total_files"],
        dataset_variant,
    )

    return {
        "ok": True,
        "job_id": job_id,
        "status": "running",
        "user_id": safe_uid,
        "dataset": stats,
        "paths": {
            "dataset_root": str(dataset_root),
            "artifacts_root": str(layout["artifacts_root"]),
            "run_dir": str(run_dir),
            "log_path": str(log_path),
        },
        "dataset_variant": dataset_variant,
        "whatsapp": whatsapp.strip() if whatsapp else None,
        "notification": notif,
        "note": "Treino iniciado em background. Consulte /train/jobs/{job_id} para status.",
    }


@app.get("/train/jobs/{job_id}")
def get_train_job(job_id: str):
    """Get runtime status for a previously started training job."""
    job = TRAIN_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"job '{job_id}' not found")

    pid = job.get("pid")
    if job.get("status") == "running" and pid:
        try:
            waited_pid, status = os.waitpid(pid, os.WNOHANG)
            if waited_pid != 0:
                exit_code = os.waitstatus_to_exitcode(status)
                job["status"] = "completed" if exit_code == 0 else "failed"
                job["exit_code"] = exit_code
                job["finished_at"] = datetime.utcnow().isoformat() + "Z"
        except ChildProcessError:
            # Process already reaped by system; keep prior state.
            pass

    return job

@app.get("/onboarding/profiles")
def list_profiles():
    """List all user profiles that have onboarding data."""
    if not DATASETS_BASE.exists():
        return {"profiles": []}

    profiles = []
    for user_dir in sorted(DATASETS_BASE.iterdir()):
        if not user_dir.is_dir():
            continue
        safe_uid = user_dir.name
        layout = ensure_profile_layout(safe_uid)
        stats = _profile_dataset_stats(safe_uid)
        total = stats["total_files"]
        if total == 0:
            continue

        profiles.append({
            "user_id": safe_uid,
            "manual_count": stats["manual_files"],
            "spontaneous_count": stats["spontaneous_files"],
            "total_files": total,
            "total_duration_seconds": stats["total_duration_seconds"],
            "artifacts_dir": str(layout["artifacts_root"]),
        })

    return {"profiles": profiles}


@app.get("/onboarding/profiles/{user_id}")
def get_profile_files(user_id: str):
    """Return all audio files for a profile, grouped by source with metadata."""
    safe_uid = sanitize_user_id(user_id)
    layout = get_profile_layout(safe_uid)
    user_dir = layout["dataset_root"]
    if not safe_uid or not user_dir.exists():
        raise HTTPException(status_code=404, detail=f"Profile '{safe_uid}' not found")

    files = []
    for source in ("manual", "spontaneous"):
        source_dir = user_dir / source
        if not source_dir.exists():
            continue
        for wav in sorted(source_dir.glob("*.wav")):
            txt = wav.with_suffix(".txt")
            transcript = txt.read_text(encoding="utf-8").strip() if txt.exists() else ""
            duration = get_audio_duration(str(wav))
            files.append({
                "filename": wav.name,
                "source": source,            # "manual" | "spontaneous"
                "duration_seconds": round(duration, 2),
                "transcript": transcript[:120] + ("…" if len(transcript) > 120 else ""),
            })

    total_duration = sum(f["duration_seconds"] for f in files)
    manual_count = sum(1 for f in files if f["source"] == "manual")
    spontaneous_count = sum(1 for f in files if f["source"] == "spontaneous")

    return {
        "user_id": safe_uid,
        "files": files,
        "total_files": len(files),
        "manual_count": manual_count,
        "spontaneous_count": spontaneous_count,
        "total_duration_seconds": round(total_duration, 2),
        "artifacts_dir": str(layout["artifacts_root"]),
        "runs_dir": str(layout["runs_dir"]),
    }



# ────────────────────────────────────────────────────────────────────────────────
# Entry point
# ────────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    device = detect_device()
    logger.info(f"🎵 APIBR2 Audio Server v2.0 starting on port {AUDIO_SERVER_PORT}")
    logger.info(f"🖥️  Device: {device} | CUDA/ROCm: {torch.cuda.is_available()}")
    logger.info(f"🔊 TTS Engine: edge-tts (cloud, PT-BR voices)")
    logger.info(f"🎤 Clone Engine: {'XTTS-v2 (tts_venv)' if xtts_available() else 'edge-tts fallback (run setup_xtts_venv.sh)'}")
    logger.info(f"📝 Transcription: whisper-large-v3-turbo (transformers, ROCm-native) on {device}")
    logger.info(f"🔑 HF_TOKEN: {'set' if HF_TOKEN else 'NOT SET (speaker diarization unavailable)'}")
    uvicorn.run(app, host="0.0.0.0", port=AUDIO_SERVER_PORT)
