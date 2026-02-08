#!/usr/bin/env python3
"""
APIBR2 - Working Image Generation Server
Servidor que funciona com CPU e otimiza para melhor performance
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
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="APIBR2 Working Image Generator", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações
OUT_DIR = Path("generated_images")
OUT_DIR.mkdir(exist_ok=True)

# Cache de pipelines carregados
pipes = {}

class ImageRequest(BaseModel):
    prompt: str
    model: str = "runwayml/stable-diffusion-v1-5"  # Modelo público por padrão
    steps: int = 15  # Reduzido para CPU
    guidance_scale: float = 7.5
    width: int = 512  # Reduzido para CPU
    height: int = 512
    size: str = "512x512"

def detect_device():
    """Detectar o melhor device disponível"""
    try:
        # Tentar DirectML primeiro
        if hasattr(torch, 'dml') and torch.dml.is_available():
            logger.info("AMD GPU detectada - usando DirectML")
            return "dml"
        elif torch.cuda.is_available():
            logger.info("NVIDIA GPU detectada - usando CUDA")
            return "cuda"
        elif torch.backends.mps.is_available():
            logger.info("Apple Silicon detectado - usando MPS")
            return "mps"
        else:
            logger.info("Usando CPU otimizado")
            return "cpu"
    except Exception as e:
        logger.warning(f"Erro ao detectar device: {e}, usando CPU")
        return "cpu"

def get_pipe(model_name):
    """Carrega o pipeline do modelo (com cache)"""
    
    # Mapear nomes curtos para nomes completos
    model_mapping = {
        'stable-diffusion-1.5': 'runwayml/stable-diffusion-v1-5',
        'stable-diffusion-3.5': 'stabilityai/stable-diffusion-3.5',
        'stable-diffusion-3.5-large': 'stabilityai/stable-diffusion-3.5-large',
        'sdxl-turbo': 'stabilityai/sdxl-turbo',
        'dreamshaper': 'lykon/dreamshaper-8',
        'FLUX.1-dev': 'runwayml/stable-diffusion-v1-5'  # Fallback para Flux
    }
    
    # Usar nome mapeado se existir
    full_model_name = model_mapping.get(model_name, model_name)
    
    if full_model_name not in pipes:
        logger.info(f"Loading model: {full_model_name} (requested: {model_name})")
        try:
            device = detect_device()
            
            # Configurar dtype baseado no device
            if device == "dml":
                torch_dtype = torch.float32
            elif device == "cuda":
                torch_dtype = torch.float16
            else:
                torch_dtype = torch.float32  # CPU funciona melhor com float32
            
            logger.info(f"Using device: {device}, dtype: {torch_dtype}")
            
            # Importar diffusers
            from diffusers import StableDiffusionPipeline
            
            # Carregar pipeline
            pipes[full_model_name] = StableDiffusionPipeline.from_pretrained(
                full_model_name, 
                torch_dtype=torch_dtype,
                use_auth_token=os.getenv("HUGGINGFACE_HUB_TOKEN")  # Token opcional
            )
            
            # Otimizações baseadas no device
            if device == "dml":
                pipes[full_model_name] = pipes[full_model_name].to("dml")
                pipes[full_model_name].enable_attention_slicing()
                pipes[full_model_name].enable_vae_slicing()
                logger.info("Applied AMD GPU optimizations")
            elif device == "cuda":
                pipes[full_model_name] = pipes[full_model_name].to("cuda")
                pipes[full_model_name].enable_attention_slicing()
                logger.info("Applied NVIDIA GPU optimizations")
            else:
                # Otimizações para CPU
                pipes[full_model_name] = pipes[full_model_name].to("cpu")
                pipes[full_model_name].enable_attention_slicing()
                pipes[full_model_name].enable_vae_slicing()
                # Reduzir uso de memória
                pipes[full_model_name].enable_model_cpu_offload()
                logger.info("Applied CPU optimizations")
            
            logger.info(f"Model {full_model_name} loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model {full_model_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")
    
    return pipes[full_model_name]

@app.get("/health")
def health_check():
    """Health check endpoint"""
    device = detect_device()
    return {
        "status": "healthy",
        "service": "APIBR2 Working Image Generation",
        "device": device,
        "timestamp": datetime.now().isoformat(),
        "available_models": list(pipes.keys())
    }

@app.post("/generate")
def generate_image(req: ImageRequest):
    """Endpoint para geração real de imagem"""
    try:
        logger.info(f"Generating image with model: {req.model}, prompt: {req.prompt}")
        
        start_time = time.time()
        
        # Carregar pipeline
        pipe = get_pipe(req.model)
        
        # Gerar imagem
        logger.info("Starting image generation...")
        result = pipe(
            req.prompt,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance_scale,
            height=req.height,
            width=req.width
        )
        
        image = result.images[0]
        generation_time = time.time() - start_time
        
        # Salvar imagem
        timestamp = int(time.time())
        model_short_name = req.model.split('/')[-1] if '/' in req.model else req.model
        filename = f"{model_short_name}_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = OUT_DIR / filename
        
        image.save(filepath)
        logger.info(f"Image saved: {filepath}")
        
        # Converter para base64
        with open(filepath, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        return {
            "success": True,
            "data": {
                "image_base64": image_base64,
                "image_url": f"http://apibr.giesel.com.br/images/{filename}",
                "local_path": str(filepath),
                "prompt": req.prompt,
                "model": req.model,
                "size": req.size,
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "model": req.model,
                "generation_time": round(generation_time, 2),
                "steps": req.steps,
                "guidance_scale": req.guidance_scale,
                "device": detect_device(),
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
def list_models():
    """Listar modelos disponíveis"""
    return {
        "models": {
            "runwayml/stable-diffusion-v1-5": {
                "name": "Stable Diffusion 1.5",
                "description": "Modelo público estável e confiável",
                "supported_operations": ["generate"],
                "default_steps": 15,
                "default_guidance_scale": 7.5,
                "recommended_size": "512x512"
            },
            "stabilityai/sdxl-turbo": {
                "name": "SDXL Turbo",
                "description": "Geração muito rápida, boa qualidade",
                "supported_operations": ["generate"],
                "default_steps": 8,
                "default_guidance_scale": 7.5,
                "recommended_size": "512x512"
            },
            "lykon/dreamshaper-8": {
                "name": "DreamShaper",
                "description": "Estilo artístico variado",
                "supported_operations": ["generate"],
                "default_steps": 15,
                "default_guidance_scale": 7.5,
                "recommended_size": "512x512"
            }
        },
        "device_info": {
            "current_device": detect_device(),
            "optimization_tips": {
                "cpu": "Use steps=15, size=512x512 para melhor performance",
                "gpu": "Use steps=20, size=512x512 para melhor qualidade"
            }
        }
    }

@app.get("/images/{filename}")
def serve_image(filename: str):
    """Servir imagens geradas"""
    try:
        filepath = OUT_DIR / filename
        if filepath.exists():
            return FileResponse(filepath, media_type='image/png')
        else:
            raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        logger.error(f"Error serving image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting APIBR2 Working Image Generation Server...")
    logger.info(f"Output directory: {OUT_DIR.absolute()}")
    logger.info(f"Detected device: {detect_device()}")
    logger.info("Available models will be loaded on first request")
    uvicorn.run(app, host="0.0.0.0", port=5001) 