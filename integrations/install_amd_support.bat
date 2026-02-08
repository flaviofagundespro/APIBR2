@echo off
echo ========================================
echo APIBR2 - Instalacao de Suporte AMD GPU
echo ========================================
echo.
echo Instalando dependencias para GPU AMD...
echo.

echo 1. Desinstalando PyTorch atual...
pip uninstall torch torchvision torchaudio -y

echo.
echo 2. Instalando PyTorch DirectML...
pip install torch-directml

echo.
echo 3. Instalando outras dependencias...
pip install onnxruntime-directml
pip install --upgrade huggingface_hub

echo.
echo 4. Verificando instalacao...
python -c "import torch; print('PyTorch version:', torch.__version__); print('DirectML available:', hasattr(torch, 'dml')); print('Device:', torch.device('dml') if hasattr(torch, 'dml') else 'DirectML not available')"

echo.
echo ========================================
echo Instalacao concluida!
echo.
echo Para usar GPU AMD:
echo 1. Execute: python real_image_server_amd.py
echo 2. O servidor detectara automaticamente sua GPU AMD
echo 3. Use modelos publicos como runwayml/stable-diffusion-v1-5
echo.
echo Para mais informacoes, consulte: AMD_GPU_GUIDE.md
echo ========================================
pause 