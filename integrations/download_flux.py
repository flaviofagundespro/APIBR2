#!/usr/bin/env python3
"""
Robust FLUX downloader with resume capability
"""
import os
import sys
from pathlib import Path

# Load .env
env_file = Path(__file__).parent.parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

token = os.getenv('HUGGINGFACE_HUB_TOKEN')
if not token:
    print("❌ No HUGGINGFACE_HUB_TOKEN found")
    sys.exit(1)

print("=" * 60)
print("🚀 FLUX.1 Downloader (with resume support)")
print("=" * 60)
print(f"✅ Token: {token[:10]}...{token[-5:]}")

try:
    from diffusers import FluxPipeline
    import torch
    from huggingface_hub import snapshot_download
    
    print("\n📥 Downloading FLUX.1-schnell...")
    print("   This will resume if interrupted")
    print("   Total size: ~23GB")
    print("   Please wait...\n")
    
    # Use snapshot_download for better resume support
    model_path = snapshot_download(
        repo_id="black-forest-labs/FLUX.1-schnell",
        token=token,
        resume_download=True,
        local_files_only=False
    )
    
    print(f"\n✅ Download complete!")
    print(f"   Model cached at: {model_path}")
    
    print("\n🔄 Loading model into memory...")
    pipe = FluxPipeline.from_pretrained(
        model_path,
        torch_dtype=torch.bfloat16,
        local_files_only=True
    )
    
    print("✅ Model loaded!")
    print("🎨 Generating quick test...")
    
    pipe.enable_model_cpu_offload()
    
    image = pipe(
        "a cat",
        num_inference_steps=4,
        guidance_scale=0.0,
        height=512,
        width=512
    ).images[0]
    
    output = "/tmp/flux_success.png"
    image.save(output)
    
    print(f"\n🎉 SUCCESS! Test image: {output}")
    print("   FLUX is ready to use in APIBR2!")
    
except KeyboardInterrupt:
    print("\n\n⚠️ Download interrupted by user")
    print("   Run this script again to resume")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
