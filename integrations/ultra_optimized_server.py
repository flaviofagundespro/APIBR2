#!/usr/bin/env python3
"""
APIBR2 - Ultra Optimized Image Generation Server v2.1
High-throughput FastAPI service with aggressive memory management strategies
Originally tuned for AMD Radeon RX 6750 XT, but works on CPU/GPU fallbacks
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import torch
import uuid
import time
import os
import base64
import logging
import gc
from datetime import datetime
import psutil  # Used to monitor real-time resource usage

# Force PyTorch to use every CPU core (Ryzen 9 7900X = 12c/24t on the target host)
num_threads = os.cpu_count() or 12  # Fallback to 12 threads if detection fails
torch.set_num_threads(num_threads)
torch.set_num_interop_threads(num_threads)

# Enable fast matmul path when available
if hasattr(torch, 'set_float32_matmul_precision'):
    torch.set_float32_matmul_precision('high')

logger = logging.getLogger(__name__)
logger.info(f"🔧 PyTorch configured to use {num_threads} threads")

# Keep linear algebra libraries aligned with our threading preferences
os.environ['OMP_NUM_THREADS'] = str(num_threads)
os.environ['MKL_NUM_THREADS'] = str(num_threads)
os.environ['OPENBLAS_NUM_THREADS'] = str(num_threads)
os.environ['VECLIB_MAXIMUM_THREADS'] = str(num_threads)
os.environ['NUMEXPR_NUM_THREADS'] = str(num_threads)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="APIBR2 Ultra Optimized Generator v2.1", version="2.1.0")

# Allow any frontend to call this service; it is shielded by reverse proxy auth
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Output directory for generated assets
OUT_DIR = Path("generated_images")
OUT_DIR.mkdir(exist_ok=True)

# Optional toggles controlled via environment variables
FORCE_CPU = os.getenv("FORCE_CPU", "false").lower() == "true"

PREFER_CPU = os.getenv("PREFER_CPU", "false").lower() == "true"

# Cache to avoid reloading heavy pipelines on every request
pipes = {}

class ImageRequest(BaseModel):
    """Simple request schema so FastAPI can validate payloads."""
    prompt: str
    model: str = "runwayml/stable-diffusion-v1-5"
    steps: int = 10  # Default kept small for latency, automatically tuned later
    guidance_scale: float = 7.5
    width: int = 512
    height: int = 512
    size: str = "512x512"
    scheduler: str = "auto"  # auto, dpm++, euler_a, ddim
    
    def __init__(self, **data):
        super().__init__(**data)
        # Allow clients to send "size": "WxH" while keeping width/height inside dataclass
        if 'size' in data and data['size']:
            try:
                parts = data['size'].split('x')
                if len(parts) == 2:
                    self.width = int(parts[0])
                    self.height = int(parts[1])
            except:
                pass

def detect_device():
    """Detect the best available compute device honoring override flags."""
    try:
        if FORCE_CPU:
            logger.info("⚠️ FORCE_CPU enabled - forcing CPU execution")
            return "cpu"
        
        if PREFER_CPU:
            logger.info("⚠️ PREFER_CPU enabled - sticking to CPU for stability")
            return "cpu"
        
        try:
            if hasattr(torch, 'dml') and torch.dml.is_available():
                logger.info("✅ AMD GPU detected - running with DirectML")
                logger.warning("⚠️ DirectML can be slow. Set PREFER_CPU=true to stay on CPU during dev")
                return "dml"
            else:
                try:
                    import torch_directml
                    if torch_directml.is_available():
                        logger.info("✅ AMD GPU detected via torch-directml - running with DirectML")
                        logger.warning("⚠️ DirectML can be slow. Set PREFER_CPU=true to stay on CPU during dev")
                        return "dml"
                except ImportError:
                    logger.warning("⚠️ torch-directml not installed")
                    logger.info("💡 Tip: pip install torch-directml to leverage AMD GPUs")
        except Exception as e:
            logger.debug(f"DirectML check failed: {e}")
        
        if torch.cuda.is_available():
            logger.info("✅ NVIDIA GPU detected - running with CUDA")
            return "cuda"
        
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            logger.info("✅ Apple Silicon detected - running with MPS")
            return "mps"
        
        logger.info("ℹ️ Using CPU - the Ryzen 9 7900X is surprisingly capable for dev loops")
        logger.info("💡 Estimated time: 20-40s for 512x512 at 10 steps")
        return "cpu"
    except Exception as e:
        logger.warning(f"Device detection failed ({e}); falling back to CPU")
        return "cpu"

def get_scheduler(pipe, scheduler_name, device="cpu", model_name=""):
    """Attach a scheduler tuned for the current device/model combination."""
    from diffusers import (
        DPMSolverMultistepScheduler,
        EulerAncestralDiscreteScheduler,
        DDIMScheduler,
        PNDMScheduler
    )
    
    if scheduler_name == "auto":
        scheduler_name = "dpm++"
    
    schedulers = {
        "dpm++": DPMSolverMultistepScheduler,
        "euler_a": EulerAncestralDiscreteScheduler,
        "ddim": DDIMScheduler,
        "pndm": PNDMScheduler
    }
    
    scheduler_class = schedulers.get(scheduler_name, DPMSolverMultistepScheduler)
    
    try:
        if "dreamshaper" in model_name.lower() and scheduler_name == "dpm++":
            logger.info("DreamShaper detected: Using Euler A scheduler instead of DPM++")
            scheduler_class = EulerAncestralDiscreteScheduler
            scheduler_name = "euler_a"
        
        pipe.scheduler = scheduler_class.from_config(pipe.scheduler.config)
        logger.info(f"Using scheduler: {scheduler_name}")
    except Exception as e:
        logger.warning(f"Could not set scheduler {scheduler_name}: {e}, using default")
    
    return pipe

def get_model_config(model_name, device="cpu"):
    """Return per-model overrides so we always run with sane defaults."""
    
    if device == "dml":
        base_steps = 12  # DirectML is unpredictable; keep steps modest
        scheduler = "dpm++"
    elif device == "cuda":
        base_steps = 20  # CUDA stacks can easily handle more steps
        scheduler = "dpm++"
    else:
        base_steps = 15  # CPU-only path needs a balance between time and detail
        scheduler = "dpm++"
    
    configs = {
        'runwayml/stable-diffusion-v1-5': {
            'steps': base_steps,
            'guidance_scale': 7.5,
            'size': '512x512',
            'scheduler': scheduler,
            'memory_efficient': True
        },
        'stabilityai/sdxl-turbo': {
            'steps': 4 if device == "dml" else 6,
            'guidance_scale': 0.0,  # SDXL Turbo ignores guidance by design
            'size': '512x512',
            'scheduler': 'euler_a',  # Euler A behaves better with Turbo
            'memory_efficient': True,
            'is_turbo': True  # Flag so Turbo models get special handling downstream
        },
        'lykon/dreamshaper-8': {
            'steps': base_steps,
            'guidance_scale': 7.5,
            'size': '512x512',
            'scheduler': 'euler_a',  # DreamShaper behaves better with Euler A
            'memory_efficient': True
        },
        'prompthero/openjourney': {
            'steps': base_steps,
            'guidance_scale': 7.5,
            'size': '512x512',
            'scheduler': scheduler,
            'memory_efficient': True
        },
        'Linaqruf/anything-v3.0': {
            'steps': base_steps,
            'guidance_scale': 7.5,
            'size': '512x512',
            'scheduler': scheduler,
            'memory_efficient': True
        }
    }
    return configs.get(model_name, configs['runwayml/stable-diffusion-v1-5'])

def get_pipe(model_name):
    """Lazy-load and memoize a Stable Diffusion pipeline with heavy tweaks."""
    
    model_mapping = {
        'stable-diffusion-1.5': 'runwayml/stable-diffusion-v1-5',
        'sd-1.5': 'runwayml/stable-diffusion-v1-5',
        'sdxl-turbo': 'stabilityai/sdxl-turbo',
        'dreamshaper': 'lykon/dreamshaper-8',
        'openjourney': 'prompthero/openjourney',
        'anything-v3': 'Linaqruf/anything-v3.0',
        'FLUX.1-dev': 'black-forest-labs/FLUX.1-schnell'
    }
    
    full_model_name = model_mapping.get(model_name, model_name)
    
    if full_model_name not in pipes:
        logger.info(f"Loading model: {full_model_name} (requested: {model_name})")
        try:
            device = detect_device()
            
            # --- 1. FLUX Handling (Specific Logic) ---
            if "flux" in full_model_name.lower():
                from diffusers import FluxPipeline
                logger.info("Flux model detected. Using FluxPipeline with bfloat16.")
                
                if device == "dml":
                    logger.warning("⚠️ FLUX on DirectML (Windows) might be extremely slow or fail. Expect issues.")
                
                # Flux requires bfloat16 for best results/compatibility
                pipes[full_model_name] = FluxPipeline.from_pretrained(
                    full_model_name,
                    torch_dtype=torch.bfloat16,
                    token=os.getenv("HUGGINGFACE_HUB_TOKEN")
                )
                
                # Flux is VRAM hungry; force offload to system RAM even on GPU
                # This ensures it fits in 12GB VRAM cards alongside Windows overhead
                try:
                    pipes[full_model_name].enable_model_cpu_offload()
                    logger.info("Enabled CPU offload for Flux.")
                except Exception as e:
                    logger.warning(f"Could not enable CPU offload for Flux: {e}")
                    
                # Return immediately as Flux doesn't use the standard schedulers/optimizations below
                return pipes[full_model_name]

            # --- 2. Standard SD/SDXL Handling ---
            if device == "dml":
                torch_dtype = torch.float32
            elif device == "cuda":
                torch_dtype = torch.float16
            else:
                torch_dtype = torch.float32
            
            logger.info(f"Using device: {device}, dtype: {torch_dtype}")
            
            from diffusers import StableDiffusionPipeline
            
            # Determine if we should apply Long Prompt Weighting (LPW)
            # Only for SD 1.5 based models. SDXL handles text differently (dual encoders).
            is_sdxl = "sdxl" in full_model_name.lower()
            custom_pipe_arg = None
            
            if not is_sdxl:
                custom_pipe_arg = "lpw_stable_diffusion"
                logger.info("Enabling Long Prompt Weighting (LPW) for SD 1.5 model")
            else:
                logger.info("SDXL detected - skipping LPW (using native dual-encoder handling)")

            pipes[full_model_name] = StableDiffusionPipeline.from_pretrained(
                full_model_name, 
                torch_dtype=torch_dtype,
                safety_checker=None,  # Disable safety checker for throughput gains
                requires_safety_checker=False,
                token=os.getenv("HUGGINGFACE_HUB_TOKEN"), # Updated from use_auth_token
                custom_pipeline=custom_pipe_arg
            )
            
            # Apply Device-Specific Optimizations
            if device == "dml":
                try:
                    pipes[full_model_name] = pipes[full_model_name].to("dml")
                    logger.info("Using DirectML device: dml")
                except Exception as e:
                    logger.warning(f"Could not use DirectML with .to('dml'): {e}")
                    try:
                        import torch_directml
                        dml_device = torch_directml.device()
                        pipes[full_model_name] = pipes[full_model_name].to(dml_device)
                        logger.info(f"Using DirectML device: {dml_device}")
                    except Exception as e2:
                        logger.warning(f"Could not use DirectML, falling back to CPU: {e2}")
                        pipes[full_model_name] = pipes[full_model_name].to("cpu")
                        device = "cpu"
                
                if device == "dml":
                    pipes[full_model_name].enable_attention_slicing(1)
                    pipes[full_model_name].enable_vae_slicing()
                    logger.info("Applied AMD GPU optimizations (DirectML)")
                    
            elif device == "cuda":
                pipes[full_model_name] = pipes[full_model_name].to("cuda")
                pipes[full_model_name].enable_attention_slicing()
                pipes[full_model_name].enable_vae_slicing()
                try:
                    pipes[full_model_name].enable_xformers_memory_efficient_attention()
                    logger.info("Applied NVIDIA GPU optimizations (with xformers)")
                except:
                    logger.info("Applied NVIDIA GPU optimizations (without xformers)")
                    
            else:
                pipes[full_model_name] = pipes[full_model_name].to("cpu")
                pipes[full_model_name].enable_attention_slicing()
                pipes[full_model_name].enable_vae_slicing()
                
                try:
                    pipes[full_model_name].enable_model_cpu_offload()
                    logger.info("Applied CPU optimizations with model offload")
                except:
                    logger.info("Applied CPU optimizations (standard mode)")
            
            # Apply Scheduler Configuration
            model_config = get_model_config(full_model_name, device)
            pipes[full_model_name] = get_scheduler(
                pipes[full_model_name], 
                model_config['scheduler'],
                device
            )
            
            logger.info(f"✅ Model {full_model_name} loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Error loading model {full_model_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")
    
    return pipes[full_model_name]

@app.get("/health")
def health_check():
    """Health check endpoint"""
    device = detect_device()
    
    # Capture live system usage to expose inside health payload
    import psutil
    cpu_percent = psutil.cpu_percent(interval=0.1)
    ram_percent = psutil.virtual_memory().percent
    
    health_info = {
        "status": "healthy",
        "service": "APIBR2 Ultra Optimized Image Generation v2.1",
        "device": device,
        "cpu": "AMD Ryzen 9 7900X (12-Core)",
        "gpu": "AMD Radeon RX 6750 XT (12GB)" if device == "dml" else "N/A",
        "ram": "32GB DDR5 5600MHz",
        "timestamp": datetime.now().isoformat(),
        "loaded_models": list(pipes.keys()),
        "system_usage": {
            "cpu_percent": cpu_percent,
            "ram_percent": ram_percent
        },
        "optimizations": {
            "scheduler": "DPM++ 2M (default)",
            "attention_slicing": "enabled",
            "vae_slicing": "enabled",
            "safety_checker": "disabled"
        },
        "important_note": "⚠️ DirectML still runs on CPU. Use device='cpu' to free VRAM."
    }
    
    return health_info

@app.post("/generate")
def generate_image(req: ImageRequest):
    """Main image generation endpoint with aggressive fallbacks."""
    try:
        logger.info(f"🎨 Generating: {req.prompt[:50]}... | Model: {req.model}")
        
        start_time = time.time()
        current_device = detect_device()
        
        model_config = get_model_config(req.model, current_device)
        
        if req.steps == 10:
            req.steps = model_config['steps']
        
        if current_device == "dml" and req.steps > 25:
            logger.warning(f"DirectML: Limiting steps from {req.steps} to 25 for performance")
            req.steps = 25
        
        pipe = get_pipe(req.model)
        
        if req.scheduler != "auto":
            pipe = get_scheduler(pipe, req.scheduler, current_device, req.model)
        
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        if current_device == "dml":
            max_size = 512
        elif current_device == "cuda":
            max_size = 768
        else:
            max_size = 640  # CPU can stretch a bit further than DirectML
        
        original_width = req.width
        original_height = req.height
        
        if req.width > max_size or req.height > max_size:
            logger.warning(f"Size {req.width}x{req.height} exceeds max {max_size}x{max_size}")
            if req.width > req.height:
                req.width = max_size
                req.height = int((req.height / original_width) * max_size)
            else:
                req.height = max_size
                req.width = int((req.width / original_height) * max_size)
        
        req.width = (req.width // 8) * 8
        req.height = (req.height // 8) * 8
        
        req.width = max(req.width, 256)
        req.height = max(req.height, 256)
        
        logger.info(f"📐 Size: {req.width}x{req.height} | Steps: {req.steps} | Device: {current_device}")
        
        if current_device == "dml":
            estimated_time = req.steps * 3  # Roughly 3s per step on DirectML
            logger.warning(f"⏱️ DirectML: Estimated time ~{estimated_time}s")
        elif current_device == "cpu":
            estimated_time = req.steps * 2  # Around 2s per step on the Ryzen 9 7900X
            logger.info(f"⏱️ CPU: Estimated time ~{estimated_time}s")
        else:
            estimated_time = req.steps * 0.5  # CUDA stacks can hit ~0.5s per step
            logger.info(f"⏱️ GPU: Estimated time ~{estimated_time}s")
        
        try:
            guidance = req.guidance_scale
            if "turbo" in req.model.lower():
                guidance = 0.0
            
            result = pipe(
                req.prompt,
                num_inference_steps=req.steps,
                guidance_scale=guidance,
                height=req.height,
                width=req.width
            )
            
        except Exception as gen_error:
            error_str = str(gen_error).lower()
            
            if "memory" in error_str or "not enough" in error_str or "allocate" in error_str:
                logger.warning(f"⚠️ Memory error: {gen_error}")
                
                if req.width > 512 or req.height > 512:
                    logger.info("Trying reduced size 512x512...")
                    req.width = 512
                    req.height = 512
                    try:
                        result = pipe(
                            req.prompt,
                            num_inference_steps=req.steps,
                            guidance_scale=guidance,
                            height=req.height,
                            width=req.width
                        )
                        logger.info("✅ Generation completed with reduced size")
                    except:
                        logger.info("Falling back to CPU...")
                        pipe_cpu = pipe.to("cpu")
                        result = pipe_cpu(
                            req.prompt,
                            num_inference_steps=req.steps,
                            guidance_scale=guidance,
                            height=req.height,
                            width=req.width
                        )
                        logger.info("✅ Generation completed on CPU")
                else:
                    logger.info("Falling back to CPU...")
                    pipe_cpu = pipe.to("cpu")
                    result = pipe_cpu(
                        req.prompt,
                        num_inference_steps=req.steps,
                        guidance_scale=guidance,
                        height=req.height,
                        width=req.width
                    )
                    logger.info("✅ Generation completed on CPU")
                    
            elif "dml" in error_str or "privateuseone" in error_str:
                logger.warning(f"⚠️ DirectML error: {gen_error}")
                logger.info("Falling back to CPU...")
                pipe_cpu = pipe.to("cpu")
                result = pipe_cpu(
                    req.prompt,
                    num_inference_steps=req.steps,
                    guidance_scale=guidance,
                    height=req.height,
                    width=req.width
                )
                logger.info("✅ Generation completed on CPU (DirectML fallback)")
            else:
                raise
        
        image = result.images[0]
        generation_time = time.time() - start_time
        
        # Salvar imagem
        timestamp = int(time.time())
        model_short_name = req.model.split('/')[-1] if '/' in req.model else req.model
        filename = f"{model_short_name}_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = OUT_DIR / filename
        
        image.save(filepath)
        logger.info(f"✅ Image saved: {filename} | Time: {generation_time:.2f}s")
        
        # Convert to base64 for inline API responses
        with open(filepath, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Free any leftover GPU memory allocations
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return {
            "success": True,
            "data": {
                "image_base64": image_base64,
                "image_url": f"http://apibr.giesel.com.br/images/{filename}",
                "local_path": str(filepath),
                "prompt": req.prompt,
                "model": req.model,
                "size": f"{req.width}x{req.height}",
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "model": req.model,
                "generation_time": round(generation_time, 2),
                "steps": req.steps,
                "guidance_scale": req.guidance_scale,
                "scheduler": req.scheduler,
                "device": current_device,
                "optimization_level": "ultra_v2",
                "estimated_vs_actual": f"{estimated_time}s vs {generation_time:.1f}s",
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
def list_models():
    """List available pipelines plus recommended schedulers/steps."""
    device = detect_device()
    
    # Performance estimada baseada no device
    if device == "dml":
        perf_512 = "25-40s"
        perf_note = "DirectML (lento mas funcional)"
    elif device == "cpu":
        perf_512 = "20-30s"
        perf_note = "CPU Ryzen 9 7900X (fast for dev workloads)"
    else:
        perf_512 = "5-10s"
        perf_note = "GPU CUDA (very fast)"
    
    return {
        "models": {
            "runwayml/stable-diffusion-v1-5": {
                "name": "Stable Diffusion 1.5",
                "alias": ["sd-1.5", "stable-diffusion-1.5"],
                "description": "Baseline model, versatile and fast",
                "recommended_steps": 15,
                "recommended_scheduler": "dpm++",
                "recommended_size": "512x512",
                "performance_512x512": perf_512
            },
            "stabilityai/sdxl-turbo": {
                "name": "SDXL Turbo",
                "alias": ["sdxl-turbo"],
                "description": "Ultra-fast, 4-6 steps",
                "recommended_steps": 6,
                "recommended_scheduler": "euler_a",
                "recommended_size": "512x512",
                "performance_512x512": "10-20s",
                "note": "Requer guidance_scale=0.0, pode ter problemas com DirectML"
            },
            "lykon/dreamshaper-8": {
                "name": "DreamShaper 8",
                "alias": ["dreamshaper"],
                "description": "Artistic / photoreal crossover",
                "recommended_steps": 15,
                "recommended_scheduler": "euler_a",
                "recommended_size": "512x512",
                "performance_512x512": perf_512,
                "note": "Usa Euler A para melhor compatibilidade"
            },
            "prompthero/openjourney": {
                "name": "OpenJourney",
                "alias": ["openjourney"],
                "description": "Estilo Midjourney",
                "recommended_steps": 15,
                "recommended_scheduler": "dpm++",
                "recommended_size": "512x512",
                "performance_512x512": perf_512
            },
            "Linaqruf/anything-v3.0": {
                "name": "Anything V3",
                "alias": ["anything-v3"],
                "description": "Anime/Manga style",
                "recommended_steps": 15,
                "recommended_scheduler": "dpm++",
                "recommended_size": "512x512",
                "performance_512x512": perf_512
            }
        },
        "schedulers": {
            "dpm++": "DPM++ 2M (recommended - speed + quality)",
            "euler_a": "Euler Ancestral (great for SDXL Turbo)",
            "ddim": "DDIM (classic, slower)",
            "pndm": "PNDM (original default)"
        },
        "device_info": {
            "current_device": device,
            "device_note": perf_note,
            "cpu": "AMD Ryzen 9 7900X (12-Core, 24-Threads)",
            "cpu_threads_configured": num_threads,
            "gpu": "AMD Radeon RX 6750 XT (12GB GDDR6)" if device == "dml" else "N/A",
            "optimization_level": "ultra_v2.1",
            "optimizations_enabled": [
                "DPM++ Scheduler",
                "Attention Slicing",
                "VAE Slicing",
                "Safety Checker Disabled",
                "Memory Management",
                f"Multi-threading ({num_threads} threads)"
            ]
        },
        "tips": {
            "fastest": "Use SDXL Turbo com 4-6 steps (guidance_scale=0.0)",
            "best_quality": "Use SD 1.5 com 20-30 steps",
            "balanced": "Use SD 1.5 com 15 steps (recomendado)",
            "development": "Set PREFER_CPU=true to run on the Ryzen during dev",
            "directml_truth": "⚠️ DirectML still uses CPU for compute; VRAM holds tensors only.",
            "recommendation": "Use device='cpu' to free VRAM with the same throughput",
            "negative_prompt": "Use negative_prompt para melhorar qualidade"
        }
    }

@app.get("/images/{filename}")
def serve_image(filename: str):
    """Serve generated images directly from disk."""
    try:
        filepath = OUT_DIR / filename
        if filepath.exists():
            return FileResponse(filepath, media_type='image/png')
        else:
            raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        logger.error(f"Error serving image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/benchmark")
def benchmark_info():
    """Expose the reference hardware profile used for tuning."""
    device = detect_device()
    
    benchmarks = {
        "system": {
            "cpu": "AMD Ryzen 9 7900X",
            "cores": "12-Core / 24-Threads",
            "threads_configured": num_threads,
            "base_clock": "4.7 GHz",
            "boost_clock": "5.6 GHz",
            "gpu": "AMD Radeon RX 6750 XT",
            "vram": "12GB GDDR6",
            "ram": "32GB DDR5 5600MHz"
        },
        "estimated_performance": {
            "cpu_512x512_15steps": "25-35 segundos (100% CPU, 0% GPU)",
            "cpu_512x512_20steps": "35-50 segundos (100% CPU, 0% GPU)",
            "cpu_512x512_30steps": "50-75 segundos (100% CPU, 0% GPU)",
            "dml_512x512_15steps": "25-35 segundos (90% CPU, 4% GPU) - MESMA VELOCIDADE QUE CPU!",
            "dml_512x512_20steps": "35-50 segundos (90% CPU, 4% GPU) - MESMA VELOCIDADE QUE CPU!",
            "note": "⚠️ DirectML usa CPU para processar! GPU apenas armazena tensors na VRAM.",
            "truth": "DirectML = CPU processando + VRAM ocupada. Use device='cpu' para liberar VRAM!"
        },
        "recommendations": {
            "development": "Use CPU (set PREFER_CPU=true) para liberar VRAM",
            "production": "Use CPU - DirectML tem mesma velocidade mas ocupa VRAM",
            "fastest_model": "SDXL Turbo com 6 steps (~12-18s)",
            "best_quality": "SD 1.5 com 20-25 steps (~40-55s)",
            "directml_warning": "DirectML does not speed up generation; prefer CPU to free 12GB VRAM"
        },
        "current_device": device
    }
    
    return benchmarks

if __name__ == "__main__":
    import uvicorn
    logger.info("=" * 60)
    logger.info("🚀 Starting APIBR2 Ultra Optimized v2.1")
    logger.info("=" * 60)
    logger.info(f"📁 Output directory: {OUT_DIR.absolute()}")
    logger.info(f"💻 CPU: AMD Ryzen 9 7900X (12-Core, {num_threads} threads)")
    logger.info(f"🎮 GPU: AMD Radeon RX 6750 XT (12GB)")
    logger.info(f"🔧 Device: {detect_device()}")
    logger.info(f"✨ Optimizations: DPM++, Multi-threading, Attention Slicing, VAE Slicing")
    logger.info("=" * 60)
    logger.info("⚠️  IMPORTANT - DIRECTML:")
    logger.info("   DirectML does not execute on the GPU cores; it mainly stores tensors in VRAM.")
    logger.info("   CPU still performs ~90% of the work even while device='dml'.")
    logger.info("   Same throughput as CPU-only, but consumes 12GB VRAM.")
    logger.info("=" * 60)
    logger.info("💡 Tips:")
    logger.info("   - To free VRAM: set PREFER_CPU=true")
    logger.info("   - To force CPU from clients: pass device='cpu'")
    logger.info("   - DirectML = CPU workload + VRAM consumption (no acceleration)")
    logger.info("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=5001)