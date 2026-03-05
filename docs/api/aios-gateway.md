# AIOS WhatsApp Gateway API

Base URL: `http://localhost:3000/api/aios`

Recebe mensagens do WhatsApp (via n8n + Evolution API), roteia para o agente AIOS correto (Claude) e envia a resposta de volta via WhatsApp. Fire-and-forget: retorna 202 imediatamente.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/aios/agent` | Rotear mensagem WhatsApp para um agente AIOS |

---

## POST /api/aios/agent

### Authentication

Requer header `x-api-key` (configurar `API_KEYS` no `backend/.env`).

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `message` | string | ✅ | — | Conteúdo da mensagem do WhatsApp |
| `from` | string | ✅ | — | Número do remetente (internacional, sem `+`) |
| `agent` | string | ❌ | `dev` | Agente: `dev`, `qa`, `architect`, `pm`, `sm`, `analyst` |
| `session_id` | string | ❌ | = `from` | ID de sessão para histórico de conversa |

### Roteamento de Agentes

| Prefixo / Intenção | Agente |
|---|---|
| `@dev` ou "Dex" | `dev` — Full Stack Developer |
| `@qa` ou "Quinn" | `qa` — QA Engineer |
| `@architect` | `architect` — Arquiteto de Sistema |
| `@pm` | `pm` — Product Manager |
| `@sm` | `sm` — Scrum Master |
| `@analyst` | `analyst` — Analista de Dados |
| Sem menção | Auto-roteamento por intenção |

### cURL Examples

```bash
# Menção direta a agente
curl -s -X POST http://localhost:3000/api/aios/agent \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "message": "@dev como implemento autenticação JWT?",
    "from": "5527992618345"
  }' | jq .

# Agente específico via parâmetro
curl -s -X POST http://localhost:3000/api/aios/agent \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "message": "preciso criar uma história para o novo endpoint de áudio",
    "from": "5527992618345",
    "agent": "sm"
  }' | jq .

# Com session_id customizado
curl -s -X POST http://localhost:3000/api/aios/agent \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-1" \
  -d '{
    "message": "@analyst resumo dos anúncios de hoje",
    "from": "5527992618345",
    "session_id": "flavio-daily"
  }' | jq .
```

### Response (202 — fire & forget)

```json
{
  "status": "processing",
  "session_id": "5527992618345",
  "agent": "dev"
}
```

> A resposta real é entregue de forma assíncrona via WhatsApp para o número `from`.

---

## Configuração necessária (`backend/.env`)

```env
EVOLUTION_API_BASE_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua-chave
EVOLUTION_INSTANCE=nome-da-instancia
API_KEYS=dev-key-1,dev-key-2
```
