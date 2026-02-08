#!/usr/bin/env python3
"""
APIBR2 - Flux e Stable Diffusion Integration
Integração com modelos de geração de imagem
"""

import os
import time
import uuid
from datetime import datetime
from pathlib import Path
import logging
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_image_flux(prompt, model="FLUX.1-dev"):
    """
    Gera imagem usando Flux
    Por enquanto, cria uma imagem de placeholder
    """
    logger.info(f"Generating image with Flux for prompt: {prompt} using model: {model}")
    
    start_time = time.time()
    
    # Criar uma imagem de placeholder (simulando geração)
    width, height = 1024, 1024
    image = Image.new('RGB', (width, height), color='#f0f0f0')
    draw = ImageDraw.Draw(image)
    
    # Adicionar texto na imagem
    try:
        # Tentar usar uma fonte do sistema
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        # Fallback para fonte padrão
        font = ImageFont.load_default()
    
    # Centralizar o texto
    text = f"FLUX: {prompt[:50]}..."
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), text, fill='#333333', font=font)
    
    # Adicionar informações do modelo
    model_text = f"Model: {model}"
    draw.text((20, height - 60), model_text, fill='#666666', font=font)
    
    # Salvar a imagem
    output_dir = Path("generated_images")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = int(time.time())
    filename = f"flux_{timestamp}_{uuid.uuid4().hex[:8]}.png"
    filepath = output_dir / filename
    
    image.save(filepath)
    
    generation_time = time.time() - start_time
    
    logger.info(f"Flux image generated: {filepath}")
    
    return {
        "image_url": f"http://localhost:5001/images/{filename}",
        "local_path": str(filepath),
        "generation_time": generation_time,
        "model": model,
        "prompt": prompt
    }

def generate_image_sd35(prompt, model="stabilityai/stable-diffusion-3.5-large"):
    """
    Gera imagem usando Stable Diffusion 3.5
    Por enquanto, cria uma imagem de placeholder
    """
    logger.info(f"Generating image with Stable Diffusion 3.5 for prompt: {prompt} using model: {model}")
    
    start_time = time.time()
    
    # Criar uma imagem de placeholder (simulando geração)
    width, height = 1024, 1024
    image = Image.new('RGB', (width, height), color='#e8f4f8')
    draw = ImageDraw.Draw(image)
    
    # Adicionar texto na imagem
    try:
        # Tentar usar uma fonte do sistema
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        # Fallback para fonte padrão
        font = ImageFont.load_default()
    
    # Centralizar o texto
    text = f"SD 3.5: {prompt[:50]}..."
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), text, fill='#2c5aa0', font=font)
    
    # Adicionar informações do modelo
    model_text = f"Model: {model}"
    draw.text((20, height - 60), model_text, fill='#666666', font=font)
    
    # Salvar a imagem
    output_dir = Path("generated_images")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = int(time.time())
    filename = f"sd35_{timestamp}_{uuid.uuid4().hex[:8]}.png"
    filepath = output_dir / filename
    
    image.save(filepath)
    
    generation_time = time.time() - start_time
    
    logger.info(f"Stable Diffusion 3.5 image generated: {filepath}")
    
    return {
        "image_url": f"http://localhost:5001/images/{filename}",
        "local_path": str(filepath),
        "generation_time": generation_time,
        "model": model,
        "prompt": prompt
    }

def edit_image_sd35(image_url, prompt):
    """
    Edita imagem usando Stable Diffusion 3.5
    """
    logger.info(f"Editing image {image_url} with Stable Diffusion 3.5 for prompt: {prompt}")
    
    start_time = time.time()
    
    # Simular edição de imagem
    width, height = 1024, 1024
    image = Image.new('RGB', (width, height), color='#fff0e8')
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    text = f"EDITED: {prompt[:50]}..."
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), text, fill='#8b4513', font=font)
    
    # Salvar a imagem
    output_dir = Path("generated_images")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = int(time.time())
    filename = f"edited_sd35_{timestamp}_{uuid.uuid4().hex[:8]}.png"
    filepath = output_dir / filename
    
    image.save(filepath)
    
    generation_time = time.time() - start_time
    
    return {
        "image_url": f"http://localhost:5001/images/{filename}",
        "local_path": str(filepath),
        "generation_time": generation_time,
        "original_image": image_url,
        "prompt": prompt
    }

def upscale_image_sd35(image_url):
    """
    Faz upscale de imagem usando Stable Diffusion 3.5
    """
    logger.info(f"Upscaling image {image_url} with Stable Diffusion 3.5")
    
    start_time = time.time()
    
    # Simular upscale (imagem maior)
    width, height = 2048, 2048  # 2x upscale
    image = Image.new('RGB', (width, height), color='#f8f8f8')
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.truetype("arial.ttf", 80)  # Fonte maior
    except:
        font = ImageFont.load_default()
    
    text = "UPSCALED 2x"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    draw.text((x, y), text, fill='#444444', font=font)
    
    # Salvar a imagem
    output_dir = Path("generated_images")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = int(time.time())
    filename = f"upscaled_sd35_{timestamp}_{uuid.uuid4().hex[:8]}.png"
    filepath = output_dir / filename
    
    image.save(filepath)
    
    generation_time = time.time() - start_time
    
    return {
        "image_url": f"http://localhost:5001/images/{filename}",
        "local_path": str(filepath),
        "generation_time": generation_time,
        "original_image": image_url,
        "upscale_factor": 2
    }

# Teste das funções
if __name__ == "__main__":
    print("Testing image generation...")
    
    # Teste Flux
    result_flux = generate_image_flux("Um gato fofo no jardim")
    print(f"Flux result: {result_flux}")
    
    # Teste Stable Diffusion
    result_sd = generate_image_sd35("Um cachorro brincando na praia")
    print(f"SD result: {result_sd}")
    
    print("Tests completed!")


