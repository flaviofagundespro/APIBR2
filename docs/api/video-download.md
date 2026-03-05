# Video Download API

Base URL: `http://localhost:3000/api`

Uses `yt-dlp` via the Python downloader service (port 5004).

---

## Endpoints

| Method | Path | Platform | Status |
|--------|------|----------|--------|
| `POST` | `/api/instagram/download` | Instagram | ✅ |
| `POST` | `/api/instagram/profile` | Instagram profile info | ✅ |
| `POST` | `/api/instagram/posts` | Instagram post list | ✅ |
| `POST` | `/api/instagram/post` | Single Instagram post info | ✅ |
| `POST` | `/api/tiktok/download` | TikTok | ✅ |
| `POST` | `/api/youtube/download` | YouTube | ✅ |
| `POST` | `/api/facebook/download` | Facebook | ⚠️ May work |
| `POST` | `/api/shopee/download` | Shopee | ✅ |
| `POST` | `/api/universal/download` | Any (yt-dlp) | ✅ |
| `POST` | `/api/amazon/download` | Amazon | ❌ Unstable |

---

## POST /api/instagram/download

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | ✅ | — | Instagram post/reel URL |
| `returnBase64` | boolean | ❌ | `false` | Return file as base64 (for n8n) |

```bash
# Basic download
curl -s -X POST http://localhost:3000/api/instagram/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reel/ABC123/"
  }' | jq .

# With base64 (para n8n/automação)
curl -s -X POST http://localhost:3000/api/instagram/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reel/ABC123/",
    "returnBase64": true
  }' | jq .
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "path": "/path/to/integrations/downloads/video.mp4",
    "filename": "video.mp4",
    "platform": "instagram"
  }
}
```

With `returnBase64: true`, adds:
```json
{ "base64_content": "AAAAIGZ0eXB...", "mime_type": "video/mp4" }
```

---

## POST /api/instagram/profile

```bash
curl -s -X POST http://localhost:3000/api/instagram/profile \
  -H "Content-Type: application/json" \
  -d '{ "username": "flaviofagundespro" }' | jq .
```

---

## POST /api/instagram/posts

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `username` | string | ✅ | — | Instagram handle |
| `limit` | integer | ❌ | `12` | Number of posts |
| `profile` | string | ❌ | — | Cookie profile name |

```bash
curl -s -X POST http://localhost:3000/api/instagram/posts \
  -H "Content-Type: application/json" \
  -d '{ "username": "flaviofagundespro", "limit": 6 }' | jq .
```

---

## POST /api/instagram/post

```bash
curl -s -X POST http://localhost:3000/api/instagram/post \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://www.instagram.com/p/ABC123/" }' | jq .
```

---

## POST /api/tiktok/download

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | ✅ | — | TikTok video URL |
| `quality` | string | ❌ | `high` | `high`, `medium`, `low` |
| `remove_watermark` | boolean | ❌ | `true` | Remove watermark |

```bash
curl -s -X POST http://localhost:3000/api/tiktok/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.tiktok.com/@user/video/123456789",
    "quality": "high",
    "remove_watermark": true
  }' | jq .
```

---

## POST /api/youtube/download

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | ✅ | — | YouTube URL |
| `quality` | string | ❌ | `720` | `360`, `480`, `720`, `1080` |
| `audio_only` | boolean | ❌ | `false` | Extract audio only (MP3) |
| `playlist` | boolean | ❌ | `false` | Download entire playlist |

```bash
# Vídeo 720p
curl -s -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "quality": "720" }' | jq .

# Só áudio (MP3)
curl -s -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "audio_only": true }' | jq .
```

---

## POST /api/facebook/download

```bash
curl -s -X POST http://localhost:3000/api/facebook/download \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://www.facebook.com/watch?v=123456789" }' | jq .
```

---

## POST /api/shopee/download

```bash
curl -s -X POST http://localhost:3000/api/shopee/download \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://shopee.com.br/produto/123" }' | jq .
```

---

## POST /api/universal/download

Tenta download de qualquer plataforma suportada pelo yt-dlp.

```bash
curl -s -X POST http://localhost:3000/api/universal/download \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://qualquer-plataforma.com/video/123" }' | jq .
```

---

## Notes

- Downloads salvos em `integrations/downloads/`
- Para conteúdo privado do Instagram, configure cookies em `integrations/cookies/`
- `returnBase64: true` (apenas Instagram) evita precisar de acesso ao filesystem do servidor via n8n
