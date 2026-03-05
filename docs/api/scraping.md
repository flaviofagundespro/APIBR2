# Web Scraping API

Base URL: `http://localhost:3000/api`

Uses Puppeteer (headless Chrome) with a pre-allocated browser pool.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scrape` | Synchronous scraping |
| `POST` | `/api/scrape/async` | Async scraping (returns job ID) |
| `GET`  | `/api/scrape/stats` | Browser pool stats |
| `GET`  | `/api/jobs/:id` | Get async job result |
| `GET`  | `/api/jobs` | Job queue statistics |
| `POST` | `/api/youtube/scrape` | Scrape YouTube channel |
| `POST` | `/api/youtube/video` | YouTube video details |
| `POST` | `/api/youtube/ocr` | OCR from image URL |

---

## POST /api/scrape

Synchronous — waits and returns the result.

### Parameters (JSON body)

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✅ | Target URL |
| `strategy` | string | ✅ | `basic`, `screenshot`, or `javascript` |
| `selectors` | object | for `basic` | CSS selector map |
| `script` | string | for `javascript` | JS to run on the page |
| `screenshotOptions` | object | for `screenshot` | `{ fullPage, type }` |
| `waitFor` | string/number | ❌ | CSS selector or ms to wait |

### Strategies

| Strategy | Description |
|---|---|
| `basic` | DOM extraction via CSS selectors |
| `screenshot` | Returns base64 screenshot |
| `javascript` | Runs custom JS, returns any value |

### cURL Examples

```bash
# Basic: extract title and links
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "basic",
    "url": "https://example.com",
    "selectors": {
      "title":       { "query": "h1" },
      "description": { "query": "p" },
      "links":       { "query": "a", "attribute": "href", "multiple": true }
    }
  }' | jq .

# Full-page screenshot (PNG)
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "screenshot",
    "url": "https://example.com",
    "screenshotOptions": { "fullPage": true, "type": "png" }
  }' | jq .

# Viewport screenshot (JPEG)
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "screenshot",
    "url": "https://example.com",
    "screenshotOptions": { "fullPage": false, "type": "jpeg" }
  }' | jq .

# Custom JavaScript
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "javascript",
    "url": "https://example.com",
    "script": "return { title: document.title, length: document.body.innerText.length }"
  }' | jq .

# Wait for element (useful for SPAs)
curl -s -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "basic",
    "url": "https://app.example.com",
    "waitFor": "#content-loaded",
    "selectors": {
      "items": { "query": ".item", "multiple": true }
    }
  }' | jq .
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "links": ["https://www.iana.org/domains/example"]
  },
  "url": "https://example.com",
  "strategy": "basic",
  "duration_ms": 1234
}
```

---

## POST /api/scrape/async

Queues a job and returns immediately.

### Extra parameters (beyond `/api/scrape`)

| Field | Type | Description |
|---|---|---|
| `webhook` | object | `{ url, method }` — called when done |
| `priority` | string | `"normal"` or `"high"` |

```bash
curl -s -X POST http://localhost:3000/api/scrape/async \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "basic",
    "url": "https://example.com",
    "selectors": { "title": { "query": "h1" } },
    "webhook": {
      "url": "https://your-n8n/webhook/done",
      "method": "POST"
    }
  }' | jq .
```

**Response:**
```json
{
  "message": "Job queued",
  "jobId": "a1b2c3d4-...",
  "status": "pending",
  "statusUrl": "/api/jobs/a1b2c3d4-..."
}
```

---

## GET /api/jobs/:id

```bash
curl -s http://localhost:3000/api/jobs/a1b2c3d4-... | jq .
```

**Response:**
```json
{
  "id": "a1b2c3d4-...",
  "status": "completed",
  "result": { "success": true, "data": { "title": "Example" } },
  "createdAt": "2026-02-17T10:00:00Z",
  "completedAt": "2026-02-17T10:00:02Z"
}
```

---

## GET /api/jobs

```bash
curl -s http://localhost:3000/api/jobs | jq .
```

---

## GET /api/scrape/stats

```bash
curl -s http://localhost:3000/api/scrape/stats | jq .
```

---

## POST /api/youtube/scrape

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `channelUrl` | string | ✅ | — | YouTube channel URL |
| `sort` | string | ❌ | `popular` | `popular` or `recent` |
| `maxResults` | integer | ❌ | `10` | Max videos (1–100) |
| `enableOCR` | boolean | ❌ | `false` | OCR on thumbnails |

```bash
curl -s -X POST http://localhost:3000/api/youtube/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "channelUrl": "https://www.youtube.com/@CanalExemplo",
    "sort": "recent",
    "maxResults": 20
  }' | jq .
```

---

## POST /api/youtube/video

```bash
curl -s -X POST http://localhost:3000/api/youtube/video \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }' | jq .
```

---

## POST /api/youtube/ocr

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `imageUrl` | string | ✅ | — | Image URL |
| `languages` | string | ❌ | `por+eng` | Tesseract language codes |

```bash
curl -s -X POST http://localhost:3000/api/youtube/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "languages": "por+eng"
  }' | jq .
```
