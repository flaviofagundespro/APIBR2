#!/usr/bin/env python3
"""
Test script to diagnose FLUX.1 compatibility on ROCm
"""
import torch
import sys

print("=" * 60)
print("FLUX.1 Compatibility Test")
print("=" * 60)

# 1. Check PyTorch and device
print(f"\n1. PyTorch Version: {torch.__version__}")
print(f"   CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"   Device: {torch.cuda.get_device_name(0)}")
    print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")

# 2. Check bfloat16 support
print(f"\n2. bfloat16 Support:")
try:
    test_tensor = torch.randn(1, 1, dtype=torch.bfloat16, device='cuda')
    print(f"   ✅ bfloat16 works on GPU")
except Exception as e:
    print(f"   ❌ bfloat16 failed: {e}")
    print(f"   💡 Will need to use float16 instead")

# 3. Check diffusers version
print(f"\n3. Diffusers Library:")
try:
    import diffusers
    print(f"   Version: {diffusers.__version__}")
    
    # Check if FluxPipeline exists
    from diffusers import FluxPipeline
    print(f"   ✅ FluxPipeline available")
except ImportError as e:
    print(f"   ❌ FluxPipeline not found: {e}")
    print(f"   💡 Need to upgrade diffusers: pip install --upgrade diffusers")
    sys.exit(1)

# 4. Check transformers
print(f"\n4. Transformers Library:")
try:
    import transformers
    print(f"   Version: {transformers.__version__}")
except ImportError:
    print(f"   ❌ Transformers not installed")
    sys.exit(1)

# 5. Check sentencepiece (needed for FLUX text encoder)
print(f"\n5. SentencePiece (FLUX dependency):")
try:
    import sentencepiece
    print(f"   ✅ SentencePiece installed")
except ImportError:
    print(f"   ❌ SentencePiece missing")
    print(f"   💡 Install: pip install sentencepiece protobuf")

# 6. Test minimal FLUX loading (without downloading full model)
print(f"\n6. FLUX Pipeline Test:")
print(f"   Attempting to initialize FLUX pipeline...")
print(f"   (This will download ~12GB on first run)")

try:
    from diffusers import FluxPipeline
    
    # Try to load with minimal config
    print(f"   Loading FLUX.1-schnell...")
    
    # Determine dtype based on bfloat16 support
    try:
        torch.randn(1, dtype=torch.bfloat16, device='cuda')
        dtype = torch.bfloat16
        print(f"   Using dtype: bfloat16")
    except:
        dtype = torch.float16
        print(f"   Using dtype: float16 (bfloat16 not supported)")
    
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.1-schnell",
        torch_dtype=dtype,
        use_safetensors=True
    )
    
    # Enable CPU offload to save VRAM
    pipe.enable_model_cpu_offload()
    
    print(f"   ✅ FLUX loaded successfully!")
    print(f"   Testing generation...")
    
    # Quick test
    image = pipe(
        "a cat",
        num_inference_steps=4,
        guidance_scale=0.0,
        height=512,
        width=512
    ).images[0]
    
    image.save("/tmp/flux_test.png")
    print(f"   ✅ Test image saved to /tmp/flux_test.png")
    print(f"\n🎉 FLUX is working! Ready to integrate.")
    
except Exception as e:
    print(f"   ❌ FLUX failed: {e}")
    print(f"\n📋 Error details:")
    import traceback
    traceback.print_exc()
    print(f"\n💡 Common fixes:")
    print(f"   1. pip install --upgrade diffusers transformers accelerate")
    print(f"   2. pip install sentencepiece protobuf")
    print(f"   3. Ensure you have ~12GB free disk space")

print("\n" + "=" * 60)
