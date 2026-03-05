import sys
from pathlib import Path
import json
import os

os.environ["HSA_OVERRIDE_GFX_VERSION"] = "10.3.0"
os.environ["PYTORCH_ROCM_ARCH"] = "gfx1030"

sys.path.append("/home/flaviofagundes/Projetos/APIBR2/integrations")
from audio_server import get_whisper, get_audio_duration

pipe = get_whisper()
target_dir = Path("/home/flaviofagundes/Projetos/APIBR2/backend/workers/xtts/datasets/flaviobest")

manifest = []

for wav in target_dir.rglob("*.wav"):
    if "wavs" in str(wav): continue # ignore already split ones
    print(f"Processing {wav.name}...")
    res = pipe(str(wav), chunk_length_s=30, stride_length_s=5, generate_kwargs={"task": "transcribe", "language": "pt", "return_timestamps": True})
    
    chunks = res.get("chunks", [])
    if chunks:
        txt = " ".join(c["text"].strip() for c in chunks if c.get("text")).strip()
    else:
        txt = res.get("text", "").strip()

    txt_path = wav.with_suffix(".txt")
    txt_path.write_text(txt)
    
    dur = float(get_audio_duration(str(wav)))
    manifest.append({
        "audio": str(wav),
        "text": txt,
        "speaker": "flaviobest",
        "source": wav.parent.name,
        "duration": dur,
        "filename": wav.name
    })

with (target_dir / "manifest.json").open("w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print("done")
