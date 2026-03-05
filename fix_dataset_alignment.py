#!/usr/bin/env python3
import os
import sys
import json
import subprocess
from pathlib import Path
import torch

# ROCm environment
os.environ["HSA_OVERRIDE_GFX_VERSION"] = "10.3.0"
os.environ["PYTORCH_ROCM_ARCH"] = "gfx1030"

# Import Whisper from integrations
sys.path.append("/home/flaviofagundes/Projetos/APIBR2/integrations")
from audio_server import get_whisper, ffmpeg_normalize, get_audio_duration

USER_ID = "flaviobest"
DATASET_ROOT = Path(f"/home/flaviofagundes/Projetos/APIBR2/backend/workers/xtts/datasets/{USER_ID}")
FIXED_DATASET_ROOT = Path(f"/home/flaviofagundes/Projetos/APIBR2/backend/workers/xtts/datasets/{USER_ID}_fixed")

def slice_audio(input_wav, output_wav, start, end):
    duration = end - start
    cmd = [
        "ffmpeg", "-y", "-ss", str(start), "-t", str(duration),
        "-i", str(input_wav), "-c", "copy", str(output_wav),
        "-loglevel", "error"
    ]
    subprocess.run(cmd, check=True)

async def main():
    if not DATASET_ROOT.exists():
        print(f"Error: {DATASET_ROOT} not found")
        return

    print(f"🚀 Fixing alignment for dataset: {USER_ID}")
    FIXED_DATASET_ROOT.mkdir(parents=True, exist_ok=True)
    
    # We'll put everything in a single 'wavs' folder as per XTTS standard
    wavs_dir = FIXED_DATASET_ROOT / "wavs"
    wavs_dir.mkdir(exist_ok=True)
    
    metadata = []
    pipe = get_whisper()
    
    # Find all wav files in manual and spontaneous
    wav_files = list(DATASET_ROOT.rglob("*.wav"))
    print(f"Found {len(wav_files)} original files.")

    for wav_path in wav_files:
        print(f"Processing {wav_path.name}...")
        
        # Whisper transcription with timestamps
        result = pipe(
            str(wav_path),
            return_timestamps=True,
            chunk_length_s=30,
            stride_length_s=5,
            generate_kwargs={"task": "transcribe", "language": "pt"}
        )
        
        chunks = result.get("chunks", [])
        for i, chunk in enumerate(chunks):
            text = chunk["text"].strip()
            if not text or len(text) < 5:
                continue
                
            start, end = chunk["timestamp"]
            if end is None:
                # If it's the last chunk, we need the actual duration
                total_dur = get_audio_duration(str(wav_path))
                end = total_dur
            
            # Skip very short or very long slices (keep 2s - 20s)
            dur = end - start
            if dur < 1.0 or dur > 25.0:
                continue
                
            slice_name = f"{wav_path.stem}_slice_{i:03d}.wav"
            slice_path = wavs_dir / slice_name
            
            try:
                slice_audio(wav_path, slice_path, start, end)
                metadata.append(f"wavs/{slice_name}|{text}|{USER_ID}|neutral")
            except Exception as e:
                print(f"  Failed to slice {slice_name}: {e}")

    # Write new metadata.csv
    meta_path = FIXED_DATASET_ROOT / "metadata.csv"
    with meta_path.open("w", encoding="utf-8") as f:
        f.write("audio_file|text|speaker_name|emotion_name\n")
        for line in metadata:
            f.write(line + "\n")
            
    print(f"\n✅ Done! Fixed dataset created at: {FIXED_DATASET_ROOT}")
    print(f"Total slices created: {len(metadata)}")
    print(f"Now you can train using: python train_xtts_amd.py --dataset-dir {FIXED_DATASET_ROOT} --speaker-name {USER_ID}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
