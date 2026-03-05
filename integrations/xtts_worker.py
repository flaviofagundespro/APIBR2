#!/usr/bin/env python3
"""
XTTS-v2 Worker — runs inside tts_venv (Python 3.10).
Called by audio_server.py via subprocess for true voice cloning.

Usage:
    /path/to/tts_venv/bin/python xtts_worker.py \
        --text "Olá, como vai você?" \
        --reference_audio /tmp/miguel.wav \
        --language pt \
        --output /tmp/out.wav

Output (stdout JSON):
    {"success": true, "output": "/tmp/out.wav", "duration_seconds": 12.3, "device": "cuda"}
    {"success": false, "error": "message", "duration_seconds": 1.2}

ROCm note: torch==2.5.1+rocm6.2 — do NOT upgrade.
RX 6750 XT (gfx1030) — HSA_OVERRIDE_GFX_VERSION=10.3.0 is required.
"""

import os
# ROCm env vars — must be set BEFORE torch is imported
os.environ.setdefault("HSA_OVERRIDE_GFX_VERSION", "10.3.0")    # gfx1031 → gfx1030 alias
os.environ.setdefault("PYTORCH_ROCM_ARCH", "gfx1030")
os.environ.setdefault("PYTORCH_TUNABLEOP_ENABLED", "0")         # Reduces RDNA2 instability

import sys
import json
import time
import argparse
import tempfile
import re
from pathlib import Path


# XTTS-v2 supported language codes
# Full list: https://docs.coqui.ai/en/latest/models/xtts.html
XTTS_LANGUAGES = {
    "pt": "pt",      # Portuguese (PT-BR and PT-PT)
    "en": "en",      # English
    "es": "es",      # Spanish
    "de": "de",      # German
    "fr": "fr",      # French
    "it": "it",      # Italian
    "nl": "nl",      # Dutch
    "pl": "pl",      # Polish
    "ru": "ru",      # Russian
    "tr": "tr",      # Turkish
    "zh": "zh-cn",   # Chinese (Simplified)
    "ja": "ja",      # Japanese
    "ko": "ko",      # Korean
    "ar": "ar",      # Arabic
    "hu": "hu",      # Hungarian
    "hi": "hi",      # Hindi
}


def clean_text_for_xtts(text: str) -> str:
    """
    Keep punctuation symbols as-is for prosody.
    Do NOT expand punctuation into words ("." -> "ponto", etc.).
    """
    cleaned = text.replace("\r", " ").replace("\n", " ")
    # Remove control chars but preserve common punctuation and accents.
    cleaned = "".join(ch for ch in cleaned if (ch.isprintable() or ch == "\t"))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def convert_to_wav_if_needed(audio_path: str) -> tuple[str, bool]:
    """
    Convert audio to WAV 22050Hz mono if needed (XTTS requirement).
    Returns (path_to_wav, was_converted).
    """
    import soundfile as sf
    path = Path(audio_path)

    # Check if already a valid WAV
    if path.suffix.lower() == ".wav":
        try:
            with sf.SoundFile(audio_path) as f:
                if f.samplerate >= 16000:
                    return audio_path, False
        except Exception:
            pass

    # Convert via ffmpeg
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.close()
    ret = os.system(
        f'ffmpeg -y -i "{audio_path}" -ar 22050 -ac 1 "{tmp.name}" -loglevel error'
    )
    if ret != 0:
        raise RuntimeError(f"ffmpeg conversion failed for {audio_path}")
    return tmp.name, True


def main():
    parser = argparse.ArgumentParser(description="XTTS-v2 voice cloning worker")
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--reference_audio", required=True, help="Reference speaker audio (6-30s)")
    parser.add_argument("--language", default="pt", help="Language code (pt, en, es, de, ...)")
    parser.add_argument("--output", required=True, help="Output WAV file path")
    args = parser.parse_args()

    t0 = time.time()
    converted_ref = None

    try:
        import torch
        from TTS.api import TTS

        # PT-BR inference target: force XTTS language to "pt".
        lang_code = "pt"
        if args.language and args.language != "pt":
            print(f"⚠️ XTTS worker overriding language '{args.language}' -> 'pt'", file=sys.stderr)

        final_text = clean_text_for_xtts(args.text)
        if not final_text:
            raise RuntimeError("text is empty after cleaning")
        print(f"Texto Final para TTS: {final_text}")

        # Detect device — ROCm exposes as 'cuda' on Linux
        device = "cuda" if torch.cuda.is_available() else "cpu"

        # Convert reference audio to WAV if needed (OGG/MP3/M4A → WAV)
        ref_path, converted_ref_flag = convert_to_wav_if_needed(args.reference_audio)
        if converted_ref_flag:
            converted_ref = ref_path  # Remember to clean up

        # Initialize XTTS-v2
        # Model is cached to ~/.local/share/tts/ on first run (~1.8GB download)
        # Subsequent runs load from cache (~15-25s init on GPU)
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

        # Generate cloned speech
        # XTTS-v2 clones the voice from reference_audio and applies it to text
        # Naturalness tuning for PT-BR.
        gen_kwargs = {
            "text": final_text,
            "speaker_wav": ref_path,
            "language": lang_code,
            "file_path": args.output,
            "temperature": 0.8,
            "repetition_penalty": 2.0,
            "speed": 1.1,
        }
        try:
            tts.tts_to_file(**gen_kwargs)
        except TypeError:
            # Some coqui-tts builds may not support all kwargs (e.g. speed).
            gen_kwargs.pop("speed", None)
            tts.tts_to_file(**gen_kwargs)

        elapsed = time.time() - t0

        print(json.dumps({
            "success": True,
            "output": args.output,
            "duration_seconds": round(elapsed, 2),
            "device": device,
            "model": "xtts_v2",
            "language": lang_code,
        }))

    except Exception as e:
        elapsed = time.time() - t0
        print(json.dumps({
            "success": False,
            "error": str(e),
            "duration_seconds": round(elapsed, 2),
        }))
        sys.exit(1)

    finally:
        # Clean up converted reference audio temp file
        if converted_ref:
            try:
                os.remove(converted_ref)
            except Exception:
                pass


if __name__ == "__main__":
    main()
