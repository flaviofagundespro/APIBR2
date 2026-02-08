# 📘 Manual de Uso APIBR2 via cURL

Este manual fornece exemplos práticos de como interagir com a API usando `curl`.

## 📸 Instagram Downloader (Nova Feature)

Para baixar vídeos do Instagram, você precisa ter o serviço `instagram_server.py` rodando.

### 1. Iniciar o Serviço
Execute o script na raiz do projeto:
```powershell
./start_instagram.ps1
```

### 2. Configurar Cookies (Importante!)
Para baixar conteúdo restrito ou evitar bloqueios, coloque seu arquivo de cookies no seguinte local:
`c:\Projetos\APIBR2\integrations\cookies\insta_cookie.txt`

> **Nota**: O arquivo deve estar no formato Netscape HTTP Cookie File. Você pode usar extensões de navegador como "Get cookies.txt LOCALLY" para exportar.

### 3. Baixar Vídeo
Envie uma requisição POST para a API principal (Node.js) ou diretamente para o serviço Python.

**Via API Principal (Recomendado):**
```bash
curl -X POST http://localhost:3000/api/instagram/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/C-xyz123/"}'
```

**Direto no Serviço Python:**
```bash
curl -X POST http://localhost:5002/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/C-xyz123/"}'
```

Os vídeos serão salvos em: `c:\Projetos\APIBR2\integrations\downloads`

---

## 🏥 Health Check

Verificar se a API está online.

```bash
curl http://localhost:3000/health
```

## 🕷️ Web Scraping

Fazer scraping de uma página.

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "strategy": "puppeteer"
  }'
```

## 🎨 Geração de Imagens

Gerar uma imagem com IA.

```bash
curl -X POST http://localhost:3000/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a futuristic city, cyberpunk style, high detail",
    "model": "runwayml/stable-diffusion-v1-5"
  }'
```

## 📺 YouTube Scraping

Obter informações de um vídeo.

```bash
curl -X POST http://localhost:3000/api/youtube/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "type": "info"
  }'
```
