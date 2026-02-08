#!/usr/bin/env python3
"""
Quick FLUX test with authentication
"""
import os
import sys

# Load .env file
from pathlib import Path
env_file = Path(__file__).parent.parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
    print(f"✅ Loaded .env file")
else:
    print(f"⚠️ No .env file found at {env_file}")

# Check token
token = os.getenv('HUGGINGFACE_HUB_TOKEN')
if token:
    print(f"✅ Token found: {token[:10]}...{token[-5:]}")
else:
    print(f"❌ No token found in environment")
    sys.exit(1)

print("\n🧪 Testing FLUX authentication...")

try:
    from diffusers import FluxPipeline
    import torch
    
    print("📥 Attempting to load FLUX.1-schnell...")
    print("   (First time will download ~12GB, please wait...)")
    
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.1-schnell",
        torch_dtype=torch.bfloat16,
        token=token,
        use_safetensors=True
    )
    
    print("✅ FLUX loaded successfully!")
    print("🎨 Generating test image...")
    
    # Enable CPU offload to save VRAM
    pipe.enable_model_cpu_offload()
    
    # Quick test generation
    image = pipe(
        "a beautiful sunset over mountains, photorealistic",
        num_inference_steps=4,
        guidance_scale=0.0,
        height=512,
        width=512
    ).images[0]
    
    output_path = "/tmp/flux_test_success.png"
    image.save(output_path)
    
    print(f"✅ Test image saved to: {output_path}")
    print("\n🎉 FLUX is working perfectly!")
    print("   You can now use it in the frontend.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
