#!/usr/bin/env python3
"""
Script to add img2img endpoint to ultra_optimized_server.py
"""

import sys

# Read the file
with open('/home/flaviofagundes/Projetos/APIBR2/integrations/ultra_optimized_server.py', 'r') as f:
    lines = f.readlines()

# Find the line with @app.get("/models")
insert_line = None
for i, line in enumerate(lines):
    if '@app.get("/models")' in line:
        insert_line = i
        break

if insert_line is None:
    print("ERROR: Could not find @app.get('/models')")
    sys.exit(1)

# The img2img endpoint code
img2img_code = '''@app.post("/img2img")
async def image_to_image(
    image: UploadFile = File(...),
    prompt: str = "",
    model: str = "lykon/dreamshaper-8",
    steps: int = 20,
    guidance_scale: float = 7.5,
    strength: float = 0.75,
    seed: Optional[int] = None
):
    """
    Image-to-image generation endpoint.
    Upload an image and transform it based on a prompt.
    
    - strength: 0.0 = keep original, 1.0 = completely new (default: 0.75)
    """
    try:
        logger.info(f"🖼️ img2img: {prompt[:50]}... | Model: {model} | Strength: {strength}")
        
        start_time = time.time()
        current_device = detect_device()
        
        # Load and process input image
        image_data = await image.read()
        init_image = Image.open(BytesIO(image_data)).convert("RGB")
        logger.info(f"📸 Input image: {init_image.size}")
        
        # Get img2img pipeline
        pipe = get_img2img_pipe(model)
        
        # Setup generator with seed
        generator = None
        actual_seed = seed
        if actual_seed is None:
            actual_seed = torch.randint(0, 2**32 - 1, (1,)).item()
        
        device_str = "cuda" if current_device == "cuda" else "cpu"
        generator = torch.Generator(device=device_str).manual_seed(actual_seed)
        logger.info(f"🎲 Using seed: {actual_seed}")
        
        # Generate
        result = pipe(
            prompt=prompt,
            image=init_image,
            strength=strength,
            num_inference_steps=steps,
            guidance_scale=guidance_scale,
            generator=generator
        )
        
        image = result.images[0]
        generation_time = time.time() - start_time
        
        # Save image
        timestamp = int(time.time())
        model_short_name = model.split('/')[-1] if '/' in model else model
        filename = f"{model_short_name}_img2img_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = OUT_DIR / filename
        
        image.save(filepath)
        logger.info(f"✅ img2img saved: {filename} | Time: {generation_time:.2f}s")
        
        # Convert to base64
        with open(filepath, "rb") as image_file:
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return {
            "success": True,
            "data": {
                "image_base64": image_base64,
                "image_url": f"http://apibr.giesel.com.br/images/{filename}",
                "local_path": str(filepath),
                "prompt": prompt,
                "model": model,
                "input_size": f"{init_image.size[0]}x{init_image.size[1]}",
                "output_size": f"{image.size[0]}x{image.size[1]}",
                "timestamp": datetime.now().isoformat()
            },
            "metadata": {
                "model": model,
                "generation_time": round(generation_time, 2),
                "steps": steps,
                "guidance_scale": guidance_scale,
                "strength": strength,
                "seed": actual_seed,
                "device": current_device,
                "type": "img2img",
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ img2img error: {str(e)}")
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=str(e))

'''

# Insert the code
lines.insert(insert_line, img2img_code)

# Write back
with open('/home/flaviofagundes/Projetos/APIBR2/integrations/ultra_optimized_server.py', 'w') as f:
    f.writelines(lines)

print(f"✅ img2img endpoint added at line {insert_line}")
print("🔄 Restart the Python server to apply changes")
