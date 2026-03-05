#!/bin/bash
# setup_xtts_venv.sh — Installs coqui-tts (XTTS-v2) into the existing integrations/venv.
#
# No separate Python 3.10 venv needed — coqui-tts (community fork) supports Python 3.12.
# The isin_mps_friendly compatibility fix for transformers 5.x is handled via monkey-patch
# in audio_server.py at module level.
#
# ROCm NOTE: torch==2.5.1+rocm6.2 is already installed. coqui-tts installs alongside
# it without touching torch (verified with --dry-run, no torch in "Would install").

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_PIP="$SCRIPT_DIR/venv/bin/pip"
VENV_PYTHON="$SCRIPT_DIR/venv/bin/python"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  XTTS-v2 setup — installing coqui-tts into integrations/venv"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "$VENV_PIP" ]; then
    echo "❌ venv not found at $SCRIPT_DIR/venv"
    echo "   Create it first: python3 -m venv $SCRIPT_DIR/venv"
    exit 1
fi

# Verify torch ROCm is present
TORCH_VER=$($VENV_PYTHON -c "import torch; print(torch.__version__)" 2>/dev/null || echo "not found")
echo "   torch: $TORCH_VER"
if [[ "$TORCH_VER" != *"rocm"* ]]; then
    echo "⚠️  WARNING: ROCm torch not detected. XTTS will run on CPU (slower)."
fi

# Install coqui-tts — does NOT touch torch (confirmed via dry-run)
echo ""
echo "📦 Installing coqui-tts (XTTS-v2 voice cloning)..."
$VENV_PIP install coqui-tts --upgrade-strategy only-if-needed

# Verify
echo ""
echo "🧪 Verifying installation..."
$VENV_PYTHON -c "
import torch
import transformers.pytorch_utils as _tpu
if not hasattr(_tpu, 'isin_mps_friendly'):
    def _isin_mps_friendly(e, t):
        if t.ndim == 0: t = t.unsqueeze(0)
        return e.unsqueeze(-1).eq(t).any(dim=-1)
    _tpu.isin_mps_friendly = _isin_mps_friendly
from TTS.api import TTS
models = [m for m in TTS.list_models() if 'xtts' in m.lower()]
print(f'✅ coqui-tts OK | torch {torch.__version__} | CUDA/ROCm: {torch.cuda.is_available()}')
print(f'   XTTS models: {models}')
" 2>&1 | grep -v "UserWarning\|FutureWarning\|Warning:"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Done! Restart audio_server.py to activate XTTS-v2."
echo "  First /clone request downloads XTTS-v2 model (~1.8GB)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
