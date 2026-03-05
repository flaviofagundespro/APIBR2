#!/usr/bin/env python3
import os
import sys
import time
import torch
from pathlib import Path

# ROCm environment
os.environ["HSA_OVERRIDE_GFX_VERSION"] = "10.3.0"
os.environ["PYTORCH_ROCM_ARCH"] = "gfx1030"
os.environ["COQUI_TOS_AGREED"] = "1"

# Monkey-patch for transformers 5.x
import transformers.pytorch_utils as _tpu
if not hasattr(_tpu, "isin_mps_friendly"):
    def _isin_mps_friendly(elements, test_elements):
        if test_elements.ndim == 0:
            test_elements = test_elements.unsqueeze(0)
        return elements.unsqueeze(-1).eq(test_elements).any(dim=-1)
    _tpu.isin_mps_friendly = _isin_mps_friendly

from TTS.api import TTS

USER_ID = "flaviobest"
CURRENT_DIR = Path(f"/home/flaviofagundes/Projetos/APIBR2/backend/models/xtts_finetuned/{USER_ID}/current")
OUT_PATH = f"/home/flaviofagundes/Projetos/APIBR2/test_xtts_finetuned_{USER_ID}.wav"

# Pick a reference audio from the dataset
REF_AUDIO = f"/home/flaviofagundes/Projetos/APIBR2/backend/workers/xtts/datasets/{USER_ID}/manual/manual_004.wav"

if not CURRENT_DIR.exists():
    print(f"Error: {CURRENT_DIR} not found")
    sys.exit(1)

print(f"Loading finetuned model from {CURRENT_DIR}...")
t0 = time.time()
tts = TTS(model_path=str(CURRENT_DIR), config_path=str(CURRENT_DIR / "config.json")).to("cuda")
print(f"Model loaded in {time.time() - t0:.2f}s")

TEXT = "Fala Miguel. O papai agora é uma inteligência artificial rodando no computador. Bora para a praia? Ou vai ficar aí enrolando?"

print(f"Synthesizing: {TEXT}")
t1 = time.time()
tts.tts_to_file(
    text=TEXT,
    speaker_wav=REF_AUDIO,
    language="pt",
    file_path=OUT_PATH,
    temperature=0.7,
    repetition_penalty=2.0,
    speed=1.15
)
print(f"Synthesis done in {time.time() - t1:.2f}s")
print(f"Output saved to: {OUT_PATH}")
