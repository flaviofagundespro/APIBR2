#!/usr/bin/env python3
"""
Quick test: generate audio using fine-tuned GPT-SoVITS models for flaviofagundes.
Usage: python test_my_clone.py
"""

import os
import sys
import numpy as np
import soundfile as sf

# ── ROCm / GPU environment ────────────────────────────────────────────────────
os.environ["HSA_OVERRIDE_GFX_VERSION"]    = "10.3.0"
os.environ["PYTORCH_ROCM_ARCH"]           = "gfx1030"
os.environ["PYTORCH_TUNABLEOP_ENABLED"]   = "0"
os.environ["PYTORCH_HIP_ALLOC_CONF"]      = "expandable_segments:True"

# ── Paths ─────────────────────────────────────────────────────────────────────
GSV_ROOT   = "/home/flaviofagundes/Projetos/GPT-SoVITS"
GSV_PKG    = f"{GSV_ROOT}/GPT_SoVITS"
PRETRAINED = f"{GSV_PKG}/pretrained_models"
FINETUNED  = "/home/flaviofagundes/Projetos/APIBR2/integrations/gpt_sovits/models/finetuned/flaviofagundes"
CLIPS_DIR  = "/home/flaviofagundes/Projetos/GPT-SoVITS/logs/flaviofagundes/clips"

SOVITS_MODEL = f"{FINETUNED}/flaviofagundes_sovits_infer.pth"
GPT_MODEL    = f"{FINETUNED}/flaviofagundes_gpt.ckpt"
OUTPUT_PATH  = "/home/flaviofagundes/Projetos/APIBR2/resultado_clone_flavio.wav"

# ── Reference audio: must be 3-10s. Using the 8.5s clip. ────────────────────
REF_AUDIO = f"{CLIPS_DIR}/flaviofagundes_spont_005_003.wav"
REF_TEXT  = (
    "plano de origem. Então, teoricamente, essa é a primeira portabilidade, "
    "porque ano passado foi feito outro processo que não foi a"
)

# ── Text to synthesize ────────────────────────────────────────────────────────
TARGET_TEXT = "Fala Miguel! O papai agora é uma inteligência artificial rodando no computador. Bora pro Albion?"

# ── Change to GPT-SoVITS package dir (required for relative imports) ──────────
os.chdir(GSV_PKG)
sys.path.insert(0, GSV_ROOT)
sys.path.insert(0, GSV_PKG)
sys.path.insert(0, f"{GSV_PKG}/eres2net")

# ── Monkey-patch: transformers 5.x blocks torch.load for torch < 2.6
# We're locked to torch 2.5.1 on ROCm (gfx1030). Safe to disable for local files.
# Must patch both: the source module AND the already-imported reference in modeling_utils.
import transformers.utils.import_utils as _tu
import transformers.modeling_utils as _mu
_noop = lambda: None
_tu.check_torch_load_is_safe = _noop
_mu.check_torch_load_is_safe = _noop

print("=" * 60)
print("GPT-SoVITS Clone Test — flaviofagundes")
print("=" * 60)
print(f"SoVITS: {SOVITS_MODEL}")
print(f"GPT:    {GPT_MODEL}")
print(f"Ref:    {REF_AUDIO}")
print(f"Text:   {TARGET_TEXT}")
print()

from TTS_infer_pack.TTS import TTS, TTS_Config

# ── Build config dict pointing to fine-tuned models ──────────────────────────
config = {
    "custom": {
        "device": "cuda",
        "is_half": True,
        "version": "v2",
        "t2s_weights_path":    GPT_MODEL,
        "vits_weights_path":   SOVITS_MODEL,
        "cnhuhbert_base_path": f"{PRETRAINED}/chinese-hubert-base",
        "bert_base_path":      f"{PRETRAINED}/chinese-roberta-wwm-ext-large",
    }
}

print("Loading TTS config...")
tts_config = TTS_Config(config)
print(tts_config)

print("Loading models (this may take ~30s)...")
tts = TTS(tts_config)
print("Models loaded. Generating audio...\n")

inputs = {
    "text":              TARGET_TEXT,
    "text_lang":         "en",   # trained with "en" labels (Brazilian Portuguese)
    "ref_audio_path":    REF_AUDIO,
    "prompt_text":       REF_TEXT,
    "prompt_lang":       "en",
    "top_k":             15,
    "top_p":             0.6,
    "temperature":       0.6,
    "text_split_method": "cut0",  # no auto-split (short text)
    "batch_size":        1,
    "speed_factor":      1.0,
    "seed":              42,
    "repetition_penalty": 1.35,
}

result_list = list(tts.run(inputs))

if result_list:
    sr, audio = result_list[-1]
    sf.write(OUTPUT_PATH, audio, sr)
    duration = len(audio) / sr
    print(f"\n✅  Done!")
    print(f"   Output:      {OUTPUT_PATH}")
    print(f"   Sample rate: {sr} Hz")
    print(f"   Duration:    {duration:.2f}s")
    print(f"\n   Play with:")
    print(f"   aplay {OUTPUT_PATH}")
    print(f"   or: vlc {OUTPUT_PATH}")
else:
    print("❌  No audio was generated. Check the logs above for errors.")
    sys.exit(1)
