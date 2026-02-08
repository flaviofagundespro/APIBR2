# Deploy do Servidor Python na VPS

## 🚀 Configuração na VPS

### 1. **Instalar Python e dependências**
```bash
# Na VPS
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Criar ambiente virtual
python3 -m venv apibr2_env
source apibr2_env/bin/activate

# Instalar dependências
pip install Flask Flask-CORS Pillow torch diffusers transformers
```

### 2. **Configurar o servidor**
```bash
# Criar diretório
mkdir -p /opt/apibr2/integrations
cd /opt/apibr2/integrations

# Copiar arquivos
# - image_server.py
# - flux_sd_integration.py
# - requirements.txt
```

### 3. **Configurar systemd service**
```bash
sudo nano /etc/systemd/system/apibr2-image.service
```

Conteúdo do service:
```ini
[Unit]
Description=APIBR2 Image Generation Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/apibr2/integrations
Environment=PATH=/opt/apibr2/integrations/apibr2_env/bin
ExecStart=/opt/apibr2/integrations/apibr2_env/bin/python image_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 4. **Configurar Nginx**
```bash
sudo nano /etc/nginx/sites-available/apibr2-image
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name apibr.giesel.com.br;

    # API Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Imagens geradas
    location /images/ {
        alias /opt/apibr2/integrations/generated_images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check Python
    location /python/health {
        proxy_pass http://localhost:5001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. **Ativar e iniciar**
```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/apibr2-image /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Iniciar serviço Python
sudo systemctl enable apibr2-image
sudo systemctl start apibr2-image
sudo systemctl status apibr2-image
```

## 🔄 **Atualizar URLs**

### No servidor Python (`image_server.py`):
```python
# Mudar de localhost para domínio
"image_url": f"http://apibr.giesel.com.br/images/{filename}",
```

### No controller Node.js:
```javascript
const PYTHON_SERVER_URL = 'http://localhost:5001'; // Mantém local
```

## 📊 **URLs finais:**

- **API Node.js**: `http://apibr.giesel.com.br/api/v1/image/generate`
- **Imagens**: `http://apibr.giesel.com.br/images/nome_arquivo.png`
- **Health Python**: `http://apibr.giesel.com.br/python/health`

## 🧪 **Teste:**
```bash
# Testar geração
curl -X POST "http://apibr.giesel.com.br/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Um gato fofo", "model": "FLUX.1-dev"}'

# Acessar imagem gerada
# http://apibr.giesel.com.br/images/FLUX.1-dev_1234567890_abc123.png
``` 