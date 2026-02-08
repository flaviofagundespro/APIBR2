#!/usr/bin/env python3
"""
APIBR2 - Image Generation Server
Servidor Flask para geração de imagens com Flux e Stable Diffusion
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image
import requests
import json

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar as funções de geração de imagem
from flux_sd_integration import generate_image_flux, generate_image_sd35

app = Flask(__name__)
CORS(app)  # Permitir CORS para o frontend

# Configurações
UPLOAD_FOLDER = Path("generated_images")
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Configurar logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "APIBR2 Image Generation",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/generate', methods=['POST'])
def generate_image():
    """Endpoint para geração de imagem"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        prompt = data.get('prompt')
        model = data.get('model', 'stabilityai/stable-diffusion-3.5-large')
        size = data.get('size', '1024x1024')
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        logger.info(f"Generating image with model: {model}, prompt: {prompt}")
        
        # Gerar nome único para o arquivo
        timestamp = int(time.time())
        filename = f"{model.replace('/', '_')}_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = UPLOAD_FOLDER / filename
        
        # Escolher o modelo correto
        if model == 'FLUX.1-dev':
            result = generate_image_flux(prompt, model)
        elif 'stable-diffusion' in model:
            result = generate_image_sd35(prompt, model)
        else:
            return jsonify({"error": f"Unsupported model: {model}"}), 400
        
        # Usar o caminho retornado pela função
        filepath = Path(result.get('local_path', str(filepath)))
        filename = filepath.name
        
        logger.info(f"Image generation completed: {filename}")
        
        # Converter imagem para base64
        try:
            with open(filepath, "rb") as image_file:
                image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        except FileNotFoundError:
            logger.error(f"File not found: {filepath}")
            return jsonify({"error": f"Generated file not found: {filepath}"}), 500
        
        # Retornar resposta com base64
        return jsonify({
            "success": True,
            "data": {
                "image_base64": image_base64,
                "image_url": f"http://apibr.giesel.com.br/images/{filename}",
                "local_path": str(filepath),
                "prompt": prompt,
                "model": model,
                "size": size,
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "model": model,
                "generation_time": result.get('generation_time', 5.0),
                "timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/edit', methods=['POST'])
def edit_image():
    """Endpoint para edição de imagem"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        image_url = data.get('image_url')
        prompt = data.get('prompt')
        model = data.get('model', 'stabilityai/stable-diffusion-3.5-large')
        
        if not image_url or not prompt:
            return jsonify({"error": "Image URL and prompt are required"}), 400
        
        logger.info(f"Editing image with model: {model}, prompt: {prompt}")
        
        # Simular edição de imagem
        timestamp = int(time.time())
        filename = f"edited_{model.replace('/', '_')}_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = UPLOAD_FOLDER / filename
        
        # Converter imagem para base64
        with open(filepath, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        return jsonify({
            "success": True,
            "data": {
                "image_base64": image_base64,
                "image_url": f"http://apibr.giesel.com.br/images/{filename}",
                "local_path": str(filepath),
                "original_image": image_url,
                "prompt": prompt,
                "model": model,
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "operation": "edit",
                "generation_time": 3.5,
                "timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error editing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/upscale', methods=['POST'])
def upscale_image():
    """Endpoint para upscale de imagem"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        image_url = data.get('image_url')
        model = data.get('model', 'stabilityai/stable-diffusion-3.5-large')
        
        if not image_url:
            return jsonify({"error": "Image URL is required"}), 400
        
        logger.info(f"Upscaling image with model: {model}")
        
        # Simular upscale de imagem
        timestamp = int(time.time())
        filename = f"upscaled_{model.replace('/', '_')}_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = UPLOAD_FOLDER / filename
        
        # Converter imagem para base64
        with open(filepath, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        return jsonify({
            "success": True,
            "data": {
                "image_base64": image_base64,
                "image_url": f"http://apibr.giesel.com.br/images/{filename}",
                "local_path": str(filepath),
                "original_image": image_url,
                "model": model,
                "upscale_factor": 2,
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "operation": "upscale",
                "generation_time": 2.5,
                "timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error upscaling image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/images/<filename>', methods=['GET'])
def serve_image(filename):
    """Servir imagens geradas"""
    try:
        filepath = UPLOAD_FOLDER / filename
        if filepath.exists():
            return send_file(filepath, mimetype='image/png')
        else:
            return jsonify({"error": "Image not found"}), 404
    except Exception as e:
        logger.error(f"Error serving image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """Listar modelos disponíveis"""
    return jsonify({
        "models": {
            "FLUX.1-dev": {
                "name": "Flux",
                "description": "Flux image generation model",
                "supported_operations": ["generate"]
            },
            "stabilityai/stable-diffusion-3.5-large": {
                "name": "Stable Diffusion 3.5",
                "description": "Stable Diffusion 3.5 Large model",
                "supported_operations": ["generate", "edit", "upscale"]
            }
        }
    })

if __name__ == '__main__':
    logger.info("Starting APIBR2 Image Generation Server...")
    logger.info(f"Upload folder: {UPLOAD_FOLDER.absolute()}")
    app.run(host='0.0.0.0', port=5001, debug=True) 