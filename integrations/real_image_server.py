#!/usr/bin/env python3
"""
APIBR2 - Real Image Generation Server
Servidor FastAPI para geração real de imagens com Stable Diffusion
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from diffusers import StableDiffusionPipeline
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

app = FastAPI(title="APIBR2 Real Image Generator", version="1.0.0")

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
    model: str = "stabilityai/stable-diffusion-3.5"
    steps: int = 30
    guidance_scale: float = 7.5
    width: int = 1024
    height: int = 1024
    size: str = "1024x1024"

def get_pipe(model_name):
    """Carrega o pipeline do modelo (com cache)"""
    
    # Mapear nomes curtos para nomes completos
    model_mapping = {
        'stable-diffusion-3.5': 'stabilityai/stable-diffusion-3.5',
        'stable-diffusion-3.5-large': 'stabilityai/stable-diffusion-3.5-large',
        'FLUX.1-dev': 'stabilityai/stable-diffusion-3.5'  # Fallback para Flux
    }
    
    # Usar nome mapeado se existir
    full_model_name = model_mapping.get(model_name, model_name)
    
    if full_model_name not in pipes:
        logger.info(f"Loading model: {full_model_name} (requested: {model_name})")
        try:
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Using device: {device}, dtype: {torch_dtype}")
            
            pipes[full_model_name] = StableDiffusionPipeline.from_pretrained(
                full_model_name, 
                torch_dtype=torch_dtype
            ).to(device)
            
            logger.info(f"Model {full_model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model {full_model_name}: {e}")
            raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")
    
    return pipes[full_model_name]

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "APIBR2 Real Image Generation",
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
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/edit")
def edit_image(req: ImageRequest):
    """Endpoint para edição de imagem (placeholder)"""
    # TODO: Implementar edição real
    return {
        "success": True,
        "data": {
            "image_base64": "placeholder_base64",
            "message": "Edit functionality not implemented yet"
        }
    }

@app.post("/upscale")
def upscale_image(req: ImageRequest):
    """Endpoint para upscale de imagem (placeholder)"""
    # TODO: Implementar upscale real
    return {
        "success": True,
        "data": {
            "image_base64": "placeholder_base64",
            "message": "Upscale functionality not implemented yet"
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

@app.get("/models")
def list_models():
    """Listar modelos disponíveis"""
    return {
        "models": {
            "stabilityai/stable-diffusion-3.5": {
                "name": "Stable Diffusion 3.5",
                "description": "Stable Diffusion 3.5 model for high-quality image generation",
                "supported_operations": ["generate"],
                "default_steps": 30,
                "default_guidance_scale": 7.5
            },
            "stabilityai/stable-diffusion-3": {
                "name": "Stable Diffusion 3",
                "description": "Stable Diffusion 3 model",
                "supported_operations": ["generate"],
                "default_steps": 30,
                "default_guidance_scale": 7.5
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting APIBR2 Real Image Generation Server...")
    logger.info(f"Output directory: {OUT_DIR.absolute()}")
    logger.info("Available models will be loaded on first request")
    uvicorn.run(app, host="0.0.0.0", port=5001) 