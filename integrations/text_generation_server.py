import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ollama import Client
import time
import os

# Ollama host (default: standard local port 11434)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
client = Client(host=OLLAMA_HOST)

app = FastAPI(title="APIBR2 Magic Prompt Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de dados para entrada
class PromptRequest(BaseModel):
    prompt: str
    model: str = "qwen2.5:3b" 

# O segredo do Magic Prompt: Instruções claras para a LLM
SYSTEM_PROMPT = """
You are an expert AI Art Prompt Engineer for Stable Diffusion. 
Your task is to take a simple user concept and expand it into a detailed, high-quality prompt.

Guidelines:
1. Focus on visual descriptions: lighting, texture, camera angle, artistic style.
2. Include keywords for quality: "8k", "masterpiece", "cinematic lighting", "ultra detailed".
3. Keep the prompt concise (under 50 words).
4. Output ONLY the raw prompt text. Do not write "Here is the prompt" or use quotes.

Example Input: "a cat"
Example Output: cute fluffy cat, soft fur, rim lighting, macro photography, pixar style, 8k, vibrant colors, bokeh background
"""

@app.post("/enhance_prompt")
async def enhance_prompt(req: PromptRequest):
    start_time = time.time()
    try:
        print(f"✨ Enhancing prompt: {req.prompt}")
        
        # Chama o Ollama local (CPU Dedicated)
        response = client.chat(model=req.model, messages=[
            {
                'role': 'system',
                'content': SYSTEM_PROMPT,
            },
            {
                'role': 'user',
                'content': f"Concept: {req.prompt}",
            },
        ])
        
        enhanced_text = response['message']['content']
        duration = time.time() - start_time
        
        print(f"✅ Done in {duration:.2f}s: {enhanced_text}")
        
        return {
            "original": req.prompt,
            "enhanced": enhanced_text,
            "duration": duration,
            "model": req.model
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        # Se o modelo 3b não existir, tenta fallback ou avisa
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List available models from Ollama"""
    try:
        response = client.list()
        # Extract just the relevant info.
        # Ollama versions may return model entries with either "name" or "model".
        models_raw = response.get('models', []) if isinstance(response, dict) else getattr(response, 'models', [])
        models = []
        for m in models_raw:
            model_id = m.get('name') or m.get('model') or 'unknown'
            size = m.get('size', 0)
            models.append({
                "id": model_id,
                "name": model_id,
                "desc": f"Size: {size // 1024 // 1024}MB"
            })
        return {"models": models}
    except Exception as e:
        print(f"❌ Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Chat server health endpoint (includes Ollama reachability)."""
    try:
        client.list()
        return {"status": "ok", "ollama": "connected"}
    except Exception as e:
        # Service is alive, but upstream Ollama is unavailable.
        return {"status": "degraded", "ollama": "disconnected", "detail": str(e)}

from typing import List

# Modelo para o Chat
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "qwen2.5:3b"

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    start_time = time.time()
    try:
        print(f"💬 Chat Incoming ({len(req.messages)} msgs)...")
        
        # Converte pydantic models para dicts
        msgs = [{"role": m.role, "content": m.content} for m in req.messages]
        
        response = client.chat(model=req.model, messages=msgs)
        reply = response['message']['content']
        
        duration = time.time() - start_time
        print(f"✅ Chat Reply in {duration:.2f}s")
        
        return {
            "role": "assistant",
            "content": reply,
            "duration": duration,
            "model": req.model
        }

    except Exception as e:
        print(f"❌ Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Rodando na porta 5003
    print("🧠 Magic Prompt & Chat Server running on port 5003...")
    uvicorn.run(app, host="0.0.0.0", port=5003)
