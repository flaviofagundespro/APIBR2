# Chat / LLM API

Base URL: `http://localhost:3000/api/v1/chat`

Proxy para Ollama local (porta 11435) via `text_generation_server.py` (porta 5003).

> Ollama roda apenas em CPU (`OLLAMA_NUM_GPU=0`) — mantém 100% da VRAM livre para geração de imagem.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/chat/chat` | Enviar mensagem ao LLM local |
| `GET`  | `/api/v1/chat/models` | Listar modelos Ollama disponíveis |

---

## GET /api/v1/chat/models

Lista modelos instalados localmente. Atualiza automaticamente após `ollama pull`.

```bash
curl -s http://localhost:3000/api/v1/chat/models | jq .
```

---

## POST /api/v1/chat/chat

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `messages` | array | ✅ | — | Array de mensagens (formato OpenAI) |
| `model` | string | ❌ | `qwen2.5:3b` | Nome do modelo Ollama |

### Message format

```json
{ "role": "user" | "system" | "assistant", "content": "..." }
```

### cURL Examples

```bash
# Mensagem simples
curl -s -X POST http://localhost:3000/api/v1/chat/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Explique fine-tuning em 3 linhas." }
    ],
    "model": "qwen2.5:3b"
  }' | jq .

# Com system prompt
curl -s -X POST http://localhost:3000/api/v1/chat/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "system",    "content": "Você é um especialista em marketing digital." },
      { "role": "user",      "content": "Como criar um carrossel de Instagram que converte?" }
    ],
    "model": "qwen2.5:3b"
  }' | jq .

# Conversa com histórico
curl -s -X POST http://localhost:3000/api/v1/chat/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user",      "content": "Qual é a capital da França?" },
      { "role": "assistant", "content": "A capital da França é Paris." },
      { "role": "user",      "content": "E qual é a população dessa cidade?" }
    ],
    "model": "llama3.2:latest"
  }' | jq .
```

**Response:**
```json
{
  "status": "success",
  "response": "Fine-tuning é o processo de ajustar um modelo pré-treinado...",
  "model": "qwen2.5:3b",
  "tokens_used": 142,
  "duration_ms": 3200
}
```

---

## Modelos disponíveis (defaults)

| Model | RAM | Ideal para |
|---|---|---|
| `qwen2.5:3b` | ~1.9 GB | Respostas rápidas, multilingual (PT-BR ok) |
| `llama3.2:latest` | ~2.0 GB | Propósito geral |

Para adicionar: `ollama pull <nome>` → aparece automaticamente em `/models`.
