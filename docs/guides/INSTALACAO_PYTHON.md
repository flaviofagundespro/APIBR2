# 🚀 GUIA DE INSTALAÇÃO - APIBR2 ESTÚDIO DE MÍDIA

## 📋 PRÉ-REQUISITOS

### 1. Verificar Instalações:
```bash
python --version          # Deve ser 3.8+
pip --version            # Deve ser 20.0+
```

### 2. Atualizar pip:
```bash
python -m pip install --upgrade pip
```

---

## 🔧 INSTALAÇÃO PASSO A PASSO

### **PASSO 1: Criar Ambiente Virtual**
```bash
# Windows
python -m venv apibr2_env
apibr2_env\Scripts\activate

# Linux/Mac
python3 -m venv apibr2_env
source apibr2_env/bin/activate
```

### **PASSO 2: Instalar Dependências Básicas**
```bash
pip install numpy pillow requests python-dotenv
```

### **PASSO 3: Instalar PyTorch**
```bash
# CPU apenas (recomendado para começar)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Com GPU NVIDIA (se tiver)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### **PASSO 4: Instalar IA/ML Libraries**
```bash
pip install transformers diffusers accelerate
```

### **PASSO 5: Instalar Processamento de Áudio**
```bash
pip install librosa soundfile pydub
```

### **PASSO 6: Instalar Processamento de Imagem**
```bash
pip install opencv-python
```

### **PASSO 7: Instalar Processamento de Vídeo**
```bash
pip install moviepy ffmpeg-python
```

### **PASSO 8: Instalar Dependências Core**
```bash
pip install celery redis supabase-py
```

### **PASSO 9: Instalar Utilitários**
```bash
pip install aiohttp pydantic loguru
```

### **PASSO 10: Instalar Ferramentas de Desenvolvimento**
```bash
pip install pytest black flake8
```

---

## 🚀 INSTALAÇÃO RÁPIDA (ALTERNATIVA)

```bash
# Navegar para a pasta integrations
cd Projetos/APIBR2/integrations

# Ativar ambiente virtual (se criou)
apibr2_env\Scripts\activate

# Instalar tudo de uma vez
pip install -r requirements.txt
```

---

## 🔍 VERIFICAÇÃO DA INSTALAÇÃO

### Teste Completo:
```bash
python -c "
import torch
import transformers
import diffusers
import librosa
import cv2
import moviepy
import celery
import redis
import supabase
print('✅ Todas as dependências instaladas com sucesso!')
"
```

### Teste Individual:
```bash
# Testar PyTorch
python -c "import torch; print(f'PyTorch: {torch.__version__}')"

# Testar Transformers
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"

# Testar OpenCV
python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"
```

---

## ⚠️ SOLUÇÃO DE PROBLEMAS

### **1. FFmpeg não encontrado:**
```bash
# Windows: Baixar de https://ffmpeg.org/download.html
# Linux: sudo apt install ffmpeg
# Mac: brew install ffmpeg
```

### **2. PyTorch com erro:**
```bash
# Desinstalar e reinstalar
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### **3. OpenCV com erro:**
```bash
# Tentar versão headless
pip uninstall opencv-python
pip install opencv-python-headless
```

### **4. Librosa com erro:**
```bash
# Instalar dependências do sistema primeiro
# Windows: pip install librosa --no-deps
# Linux: sudo apt install libsndfile1
```

---

## 🎯 PRÓXIMOS PASSOS

### **1. Configurar Celery:**
```bash
cd Projetos/APIBR2/integrations
celery -A celery_app worker --loglevel=info
```

### **2. Testar Integrações:**
```bash
# Testar Flux SD
python flux_sd_integration.py

# Testar Supabase
python supabase_integration.py

# Testar Celery
python celery_app.py
```

### **3. Conectar com N8n:**
- Configurar webhooks
- Criar workflows de automação

---

## 📁 ESTRUTURA DO PROJETO

```
Projetos/APIBR2/
├── backend/              # API Node.js (funcionando)
│   ├── src/
│   │   ├── controllers/  # Controllers do estúdio
│   │   ├── routes/       # Rotas do estúdio
│   │   └── ...
│   └── package.json
├── integrations/         # Scripts Python
│   ├── requirements.txt  # Dependências Python
│   ├── celery_app.py     # Configuração Celery
│   ├── flux_sd_integration.py
│   ├── supabase_integration.py
│   └── ...
├── frontend/             # Interface React
├── docs/                 # Documentação
└── INSTALACAO_PYTHON.md  # Este arquivo
```

---

## 🌐 ENDPOINTS DISPONÍVEIS

### **Web Scraping:**
- `http://apibr.giesel.com.br:3000/api/scrape`

### **Estúdio de Áudio:**
- `http://apibr.giesel.com.br:3000/api/v1/audio/generate-speech`
- `http://apibr.giesel.com.br:3000/api/v1/audio/clone-voice`
- `http://apibr.giesel.com.br:3000/api/v1/audio/voices`

### **Estúdio de Imagem:**
- `http://apibr.giesel.com.br:3000/api/v1/image/generate`
- `http://apibr.giesel.com.br:3000/api/v1/image/edit`
- `http://apibr.giesel.com.br:3000/api/v1/image/upscale`

### **Estúdio de Vídeo:**
- `http://apibr.giesel.com.br:3000/api/v1/video/create-avatar`
- `http://apibr.giesel.com.br:3000/api/v1/video/animate`
- `http://apibr.giesel.com.br:3000/api/v1/video/status/:job_id`

### **Estúdio de Projetos:**
- `http://apibr.giesel.com.br:3000/api/v1/studio/create-project`
- `http://apibr.giesel.com.br:3000/api/v1/studio/generate-content`
- `http://apibr.giesel.com.br:3000/api/v1/studio/projects`

---

## 🎉 SUCESSO!

Após seguir este guia, você terá:
- ✅ **API Node.js** funcionando (web scraping + estúdio)
- ✅ **Dependências Python** instaladas
- ✅ **Integrações de IA** configuradas
- ✅ **Celery** para processamento assíncrono
- ✅ **Supabase** para banco de dados
- ✅ **N8n** para automação

**Agora você pode usar o APIBR2 como um estúdio completo de produção de mídia com IA!** 🚀 