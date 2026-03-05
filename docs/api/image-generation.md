# Image Generation API

Base URL: `http://localhost:3000/api/v1/image`

Python server direct: `http://localhost:5001` (for debugging only)

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/image/generate` | Text-to-image generation |
| `POST` | `/api/v1/image/img2img` | Image-to-image transformation |
| `POST` | `/api/v1/image/edit` | Edit image from URL |
| `POST` | `/api/v1/image/upscale` | Upscale image from URL |
| `GET`  | `/api/v1/image/models` | List available models |

---

## Available Models

| Short Name | Full ID | Style |
|---|---|---|
| `stable-diffusion-1.5` | `runwayml/stable-diffusion-v1-5` | General purpose |
| `dreamshaper` | `lykon/dreamshaper-8` | Artistic |
| `openjourney` | `prompthero/openjourney` | Midjourney-style |
| `anything-v3` | `Linaqruf/anything-v3.0` | Anime/illustration |
| `realistic-vision` | `SG161222/Realistic_Vision_V5.1_noVAE` | Ultra realistic |
| `epic-realism` | `emilianJR/epiCRealism` | Ultra defined |

---

## POST /api/v1/image/generate

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | string | ✅ | — | Text description of the image |
| `model` | string | ✅ | — | Model name (short or full ID) |
| `size` | string | ❌ | `512x512` | Resolution `WxH` (multiples of 64) |
| `steps` | integer | ❌ | `10` | Inference steps (more = better, slower) |
| `guidance_scale` | float | ❌ | `7.5` | Prompt adherence (1–20) |
| `scheduler` | string | ❌ | `dpm++` | Sampling scheduler |
| `seed` | integer | ❌ | random | Fixed seed for reproducibility |
| `device` | string | ❌ | `cuda` | `cuda` or `cpu` |

### cURL Examples

```bash
# Basic
curl -s -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a futuristic cityscape at sunset, cinematic lighting",
    "model": "stable-diffusion-1.5"
  }' | jq .

# Full parameters
curl -s -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "portrait of a warrior, detailed armor, fantasy art",
    "model": "dreamshaper",
    "size": "768x512",
    "steps": 25,
    "guidance_scale": 8.5,
    "seed": 42
  }' | jq .

# Anime style
curl -s -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "anime girl, sakura background, soft lighting",
    "model": "anything-v3",
    "size": "512x768",
    "steps": 20
  }' | jq .
```

### Response

```json
{
  "status": "success",
  "image_base64": "iVBORw0KGgoAAAA...",
  "model": "runwayml/stable-diffusion-v1-5",
  "seed": 42,
  "width": 512,
  "height": 512,
  "steps": 10
}
```

---

## POST /api/v1/image/img2img

Transform an existing image guided by a prompt.

### Parameters (multipart/form-data)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `image` | file | ✅ | — | Input image (PNG/JPG) |
| `prompt` | string | ✅ | — | Target description |
| `model` | string | ❌ | `runwayml/stable-diffusion-v1-5` | Model ID |
| `steps` | integer | ❌ | `15` | Inference steps |
| `guidance_scale` | float | ❌ | `7.5` | Prompt adherence |
| `strength` | float | ❌ | `0.75` | Transformation intensity (0.0–1.0) |
| `seed` | integer | ❌ | random | Fixed seed |

```bash
curl -s -X POST http://localhost:3000/api/v1/image/img2img \
  -F "image=@/path/to/input.jpg" \
  -F "prompt=oil painting style portrait" \
  -F "model=dreamshaper" \
  -F "strength=0.7" \
  -F "steps=20" \
  -F "seed=123" | jq .
```

> **Strength tip:** 0.3–0.5 = subtle style transfer · 0.7–0.9 = near-full transformation

---

## POST /api/v1/image/edit

Edit an image using its URL.

### Parameters (JSON body)

| Field | Type | Required | Description |
|---|---|---|---|
| `image_url` | string | ✅ | URL of the source image |
| `prompt` | string | ✅ | Edit instructions |
| `model` | string | ❌ | Model ID |

```bash
curl -s -X POST http://localhost:3000/api/v1/image/edit \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "prompt": "add a sunset background, warm lighting"
  }' | jq .
```

---

## POST /api/v1/image/upscale

```bash
curl -s -X POST http://localhost:3000/api/v1/image/upscale \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/low-res.jpg"
  }' | jq .
```

---

## GET /api/v1/image/models

```bash
curl -s http://localhost:3000/api/v1/image/models | jq .
```

---

## Tips

- **Cold start:** First request loads model into VRAM (~10–15s). Subsequent: ~6s.
- **Seed:** Same seed + same prompt = reproducible result.
- **Size:** Use multiples of 64. Higher resolution = slower.
- **Steps:** 10–15 for speed, 25–30 for quality.
