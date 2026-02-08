#!/usr/bin/env python3
"""
Test FLUX with optimized memory settings for 12GB VRAM
"""
import os
import sys
import torch
import gc
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

# Set memory optimization environment variables
os.environ['PYTORCH_HIP_ALLOC_CONF'] = 'expandable_segments:True'

token = os.getenv('HUGGINGFACE_HUB_TOKEN')
if not token:
    print("❌ No token found")
    sys.exit(1)

print("=" * 60)
print("🧪 FLUX Memory-Optimized Test")
print("=" * 60)

try:
    from diffusers import FluxPipeline
    
    print("📥 Loading FLUX with memory optimizations...")
    print("   Using: Sequential CPU offload + VAE tiling")
    
    # Clear any existing GPU memory
    gc.collect()
    torch.cuda.empty_cache()
    
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.1-schnell",
        torch_dtype=torch.bfloat16,
        token=token,
        use_safetensors=True,
        local_files_only=True  # Use cached files
    )
    
    print("✅ Model loaded from cache")
    
    # Apply aggressive memory optimizations
    print("🔧 Applying memory optimizations...")
    
    # Sequential offload - moves components to GPU only when needed
    pipe.enable_sequential_cpu_offload()
    print("   ✅ Sequential CPU offload enabled")
    
    # VAE optimizations
    pipe.vae.enable_slicing()
    pipe.vae.enable_tiling()
    print("   ✅ VAE slicing and tiling enabled")
    
    # Clear memory before generation
    gc.collect()
    torch.cuda.empty_cache()
    
    print("\n🎨 Generating test image (512x512)...")
    print("   This may take 30-60 seconds...")
    
    image = pipe(
        "a beautiful sunset over mountains, photorealistic, 8k",
        num_inference_steps=4,
        guidance_scale=0.0,
        height=512,
        width=512,
        max_sequence_length=256  # Reduce sequence length to save memory
    ).images[0]
    
    output = "/tmp/flux_optimized_test.png"
    image.save(output)
    
    print(f"\n✅ SUCCESS!")
    print(f"   Image saved: {output}")
    print("\n🎉 FLUX is working with your 12GB RX 6750 XT!")
    print("   You can now use it in the frontend.")
    
    # Show VRAM usage
    if torch.cuda.is_available():
        vram_used = torch.cuda.memory_allocated() / 1024**3
        vram_total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"\n📊 VRAM Usage: {vram_used:.2f}GB / {vram_total:.2f}GB")
    
except torch.OutOfMemoryError as e:
    print(f"\n❌ Out of Memory Error")
    print(f"   Your GPU ran out of VRAM")
    print(f"\n💡 Solutions:")
    print(f"   1. Close other GPU-using programs")
    print(f"   2. Try generating at 256x256 first")
    print(f"   3. Restart your system to clear GPU memory")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
