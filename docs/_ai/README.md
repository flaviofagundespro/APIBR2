# AI/ML Documentation

Central documentation for APIBR2's AI and machine learning capabilities, including image generation APIs, GPU configuration, and model documentation.

## Overview

APIBR2 provides GPU-accelerated AI services through Python FastAPI backends:

- **Image Generation**: Stable Diffusion models (v1.5, SDXL Turbo, DreamShaper, OpenJourney, Anything-v3)
- **Image Editing**: img2img transformations with seed consistency
- **GPU Support**: AMD ROCm (Linux), DirectML (Windows), CUDA (NVIDIA), MPS (Apple Silicon)
- **Performance**: ~7.1 it/s on AMD RX 6750 XT (Linux/ROCm native)

## Quick Links

### API Documentation

Core API references for image generation and editing:

- **[IMAGE_API.md](api/IMAGE_API.md)** - Main image generation API reference
- **[IMG2IMG_DOCS.md](api/IMG2IMG_DOCS.md)** - Image-to-image transformation API
- **[SEED_DOCS.md](api/SEED_DOCS.md)** - Seed consistency and reproducibility
- **[STUDIO_API_PT.md](api/STUDIO_API_PT.md)** - Portuguese API documentation (Studio)

### Implementation Guides

Detailed implementation and setup guides:

- **[IMG2IMG_GUIDE_PT.md](api/IMG2IMG_GUIDE_PT.md)** - Portuguese img2img implementation guide
- **[IMG2IMG_PLAN_PT.md](api/IMG2IMG_PLAN_PT.md)** - Portuguese img2img planning docs
- **[SEED_BACKEND.md](api/SEED_BACKEND.md)** - Backend seed implementation
- **[SEED_COMPLETE.md](api/SEED_COMPLETE.md)** - Complete seed documentation
- **[SEED_FIXES.md](api/SEED_FIXES.md)** - Seed-related fixes and troubleshooting

### GPU Setup & Optimization

Hardware configuration and performance guides:

- **[AMD_SETUP.md](gpu/AMD_SETUP.md)** - AMD GPU setup (ROCm, DirectML)
- **[REAL_IMAGE_GENERATION.md](gpu/REAL_IMAGE_GENERATION.md)** - Real-world image generation performance
- **[REAL_SERVER.md](gpu/REAL_SERVER.md)** - Production server configuration
- **[ROCM_MIGRATION.md](ROCM_MIGRATION.md)** - Linux/ROCm migration notes (Feb 2026)

### Models & Platforms

Model documentation and platform support:

- **[FLUX.md](models/FLUX.md)** - FLUX model reference (see `_legacy/flux/` for archived experiments)

### Troubleshooting

Common issues and solutions:

- **[IMAGE_GENERATION_PT.md](troubleshooting/IMAGE_GENERATION_PT.md)** - Portuguese image generation troubleshooting

### Studio Documentation

Production media studio documentation:

- **[STUDIO_DEPLOYMENT_PT.md](STUDIO_DEPLOYMENT_PT.md)** - Portuguese deployment guide
- **[STUDIO_USAGE_PT.md](STUDIO_USAGE_PT.md)** - Portuguese usage guide

### Context & History

- **[AI_CONTEXT.md](AI_CONTEXT.md)** - AI integration context and architecture decisions

## Testing

Test scripts for validating AI functionality:

```bash
# Test image-to-image generation
./scripts/utils/test_img2img.sh

# Test seed consistency
./scripts/utils/test_seed_api.sh

# System diagnostics
./scripts/utils/diagnostico.sh
```

## Architecture

### Python Image Server

Located at `integrations/ultra_optimized_server.py`:

- **Port**: 5001
- **Framework**: FastAPI
- **Auto-detection**: ROCm → DirectML → CUDA → MPS → CPU
- **Caching**: In-memory pipeline caching for fast subsequent requests
- **Memory optimization**: Aggressive VRAM management for stable generation

### Endpoints

- `POST /generate` - Text-to-image generation
- `POST /edit` - Image-to-image transformations
- `GET /models` - List available models
- `GET /benchmark` - Performance benchmarking
- `GET /health` - Service health check

### Environment Variables

```env
# Force CPU mode (debugging)
FORCE_CPU=false
PREFER_CPU=false

# Hugging Face authentication (for gated models)
HUGGINGFACE_HUB_TOKEN=your_token_here
```

## Supported Models

| Model | ID | Use Case | Speed |
|-------|-----|----------|-------|
| Stable Diffusion v1.5 | `runwayml/stable-diffusion-v1-5` | General purpose | Medium |
| SDXL Turbo | `stabilityai/sdxl-turbo` | Fast generation | Fast |
| DreamShaper | `Lykon/DreamShaper` | Artistic style | Medium |
| OpenJourney | `prompthero/openjourney` | Midjourney-style | Medium |
| Anything-v3 | `Linaqruf/anything-v3.0` | Anime/illustration | Medium |

## GPU Performance

### Current Platform (Linux + ROCm)

- **GPU**: AMD Radeon RX 6750 XT
- **Driver**: ROCm native (Linux)
- **Performance**: ~7.1 it/s
- **Speedup**: 4x faster than Windows/DirectML setup

### Previous Platform (Windows + DirectML)

- **GPU**: AMD Radeon RX 6750 XT
- **Driver**: DirectML
- **Performance**: ~1.8 it/s
- **Notes**: Fallback for Windows environments

## Documentation Organization

```
docs/_ai/
├── README.md                    # This file
├── AI_CONTEXT.md                # Architecture context
├── ROCM_MIGRATION.md            # Linux/ROCm migration notes
├── STUDIO_DEPLOYMENT_PT.md      # Studio deployment (Portuguese)
├── STUDIO_USAGE_PT.md           # Studio usage (Portuguese)
├── api/                         # API documentation
│   ├── IMAGE_API.md
│   ├── IMG2IMG_DOCS.md
│   ├── IMG2IMG_GUIDE_PT.md
│   ├── IMG2IMG_PLAN_PT.md
│   ├── SEED_BACKEND.md
│   ├── SEED_COMPLETE.md
│   ├── SEED_DOCS.md
│   ├── SEED_FIXES.md
│   └── STUDIO_API_PT.md
├── gpu/                         # GPU setup & optimization
│   ├── AMD_SETUP.md
│   ├── REAL_IMAGE_GENERATION.md
│   └── REAL_SERVER.md
├── models/                      # Model documentation
│   └── FLUX.md
└── troubleshooting/             # Problem-solving
    └── IMAGE_GENERATION_PT.md
```

## See Also

- **[../guides/QUICK_START.md](../guides/QUICK_START.md)** - Getting started guide
- **[../guides/STARTUP_SCRIPTS.md](../guides/STARTUP_SCRIPTS.md)** - System startup documentation
- **[../notes/PROJECT_SUMMARY.md](../notes/PROJECT_SUMMARY.md)** - Overall project documentation
- **[../../CLAUDE.md](../../CLAUDE.md)** - Claude Code instructions and project conventions
- **[../../integrations/](../../integrations/)** - Python service source code

## Contributing

When adding AI/ML documentation:

1. Place API docs in `api/`
2. Place GPU/hardware docs in `gpu/`
3. Place model-specific docs in `models/`
4. Place troubleshooting guides in `troubleshooting/`
5. Update this README.md with links
6. Follow naming convention: `TOPIC_PURPOSE[_LANG].md`
