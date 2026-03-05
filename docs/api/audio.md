# Audio API

Base URL: `http://localhost:3000/api/v1/audio`

Python server direct: `http://localhost:5002`

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/audio/voices` | List available TTS voices |
| `POST` | `/api/v1/audio/generate-speech` | Text-to-speech |
| `POST` | `/api/v1/audio/clone-voice` | Speak with a cloned voice |
| `POST` | `/api/v1/audio/voices/clone/save` | Save a voice profile |
| `POST` | `/api/v1/audio/transcribe` | Transcribe audio to text (GPU 12.5x real-time) |
| `POST` | `/api/v1/audio/transcribe-meeting` | Transcribe with speaker diarization |
| `POST` | `/api/v1/audio/onboarding/upload` | Upload audio to build a voice dataset |
| `GET`  | `/api/v1/audio/onboarding/profiles` | List voice profiles |
| `GET`  | `/api/v1/audio/onboarding/profiles/:userId` | Files for a specific profile |
| `POST` | `/api/v1/audio/train/start` | Start XTTS-v2 fine-tuning (async) |
| `GET`  | `/api/v1/audio/train/jobs/:jobId` | Check fine-tuning job status |
| `GET`  | `/api/v1/audio/finetuned-models` | List available fine-tuned models |
| `POST` | `/api/v1/audio/generate-finetuned` | Generate audio with fine-tuned model |

---

## GET /api/v1/audio/voices

```bash
curl -s http://localhost:3000/api/v1/audio/voices | jq .
```

**Response:**
```json
{
  "voices": [
    { "id": "pt-BR-FranciscaNeural", "name": "Francisca (PT-BR)", "gender": "female" },
    { "id": "pt-BR-AntonioNeural",   "name": "Antonio (PT-BR)",   "gender": "male" },
    { "id": "en-US-JennyNeural",     "name": "Jenny (EN-US)",     "gender": "female" },
    { "id": "es-ES-ElviraNeural",    "name": "Elvira (ES)",       "gender": "female" }
  ]
}
```

---

## POST /api/v1/audio/generate-speech

TTS via edge-tts cloud (~1.2s response).

### Parameters (JSON body)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | string | ✅ | — | Text to speak |
| `voice` | string | ❌ | `pt-BR-FranciscaNeural` | Voice ID from `/voices` |
| `language` | string | ❌ | `pt` | Language code |

```bash
# PT-BR feminino
curl -s -X POST http://localhost:3000/api/v1/audio/generate-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Olá! Bem-vindo ao estúdio de áudio.",
    "voice": "pt-BR-FranciscaNeural"
  }' | jq .

# PT-BR masculino
curl -s -X POST http://localhost:3000/api/v1/audio/generate-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Este é um teste de síntese de voz.",
    "voice": "pt-BR-AntonioNeural"
  }' | jq .

# Inglês
curl -s -X POST http://localhost:3000/api/v1/audio/generate-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a TTS test.",
    "voice": "en-US-JennyNeural",
    "language": "en"
  }' | jq .
```

**Response:**
```json
{
  "status": "success",
  "audio_base64": "//NExAA...",
  "format": "mp3",
  "voice": "pt-BR-FranciscaNeural",
  "duration_seconds": 2.4
}
```

---

## POST /api/v1/audio/clone-voice

Speak text using a saved voice profile or reference audio.

### Parameters (multipart/form-data)

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | ✅ | Text to speak |
| `language` | string | ❌ | Language code (default: `pt`) |
| `voice_profile_name` | string | ✅ ou arquivo | Nome de um perfil salvo |
| `reference_audio` | file | ✅ ou perfil | Arquivo de referência (WAV/MP3/OGG) |

```bash
# Using saved profile
curl -s -X POST http://localhost:3000/api/v1/audio/clone-voice \
  -F "text=Olá, esta é minha voz clonada." \
  -F "language=pt" \
  -F "voice_profile_name=flavio" | jq .

# Using reference file
curl -s -X POST http://localhost:3000/api/v1/audio/clone-voice \
  -F "text=Olá, esta é minha voz clonada." \
  -F "language=pt" \
  -F "reference_audio=@/path/to/sample.wav" | jq .
```

---

## POST /api/v1/audio/voices/clone/save

Save a voice reference as a named profile for reuse.

### Parameters (multipart/form-data)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Profile name (e.g. `flavio`, `miguel`) |
| `reference_audio` | file | ✅ | WAV/MP3, 6–30s recommended |

```bash
curl -s -X POST http://localhost:3000/api/v1/audio/voices/clone/save \
  -F "name=flavio" \
  -F "reference_audio=@/path/to/sample.wav" | jq .
```

---

## POST /api/v1/audio/transcribe

Transcribe audio to text. **GPU: 12.5x real-time** (whisper-large-v3-turbo, ROCm fp16).

Supports: WAV, MP3, OGG (WhatsApp Opus), M4A, FLAC.

### Parameters (multipart/form-data)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `audio` | file | ✅ | — | Audio file |
| `language` | string | ❌ | `pt` | Language hint |

```bash
# PT-BR
curl -s -X POST http://localhost:3000/api/v1/audio/transcribe \
  -F "audio=@/path/to/recording.mp3" \
  -F "language=pt" | jq .

# WhatsApp OGG
curl -s -X POST http://localhost:3000/api/v1/audio/transcribe \
  -F "audio=@/path/to/audio.ogg" \
  -F "language=pt" | jq .
```

**Response:**
```json
{
  "status": "success",
  "text": "Texto transcrito aqui.",
  "language": "pt",
  "duration_seconds": 12.4,
  "processing_time_seconds": 1.1
}
```

---

## POST /api/v1/audio/transcribe-meeting

Transcribe with speaker diarization (quem falou o quê).

### Parameters (multipart/form-data)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `audio` | file | ✅ | — | Audio file |
| `language` | string | ❌ | `pt` | Language hint |
| `max_speakers` | integer | ❌ | `8` | Max distinct speakers |

```bash
curl -s -X POST http://localhost:3000/api/v1/audio/transcribe-meeting \
  -F "audio=@/path/to/meeting.mp3" \
  -F "language=pt" \
  -F "max_speakers=4" | jq .
```

**Response:**
```json
{
  "status": "success",
  "speakers": [
    { "speaker": "SPEAKER_00", "start": 0.5, "end": 12.3, "text": "Bom dia a todos." },
    { "speaker": "SPEAKER_01", "start": 13.1, "end": 25.7, "text": "Obrigado, vou começar." }
  ],
  "full_transcript": "SPEAKER_00: Bom dia...\nSPEAKER_01: Obrigado...",
  "duration_seconds": 120.0,
  "processing_time_seconds": 23.0
}
```

---

## POST /api/v1/audio/onboarding/upload

Upload audio files to build a speaker dataset for fine-tuning (up to 50 files per request).

### Parameters (multipart/form-data)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `user_id` | string | ✅ | — | Speaker ID (e.g. `flavio`, `miguel`) |
| `audio` | files | ✅ | — | Audio files (WAV/MP3/OGG) |
| `source` | string | ❌ | `manual` | `manual` or `spontaneous` |
| `language` | string | ❌ | `pt` | Language |

```bash
curl -s -X POST http://localhost:3000/api/v1/audio/onboarding/upload \
  -F "user_id=flavio" \
  -F "source=manual" \
  -F "language=pt" \
  -F "audio=@recording1.wav" \
  -F "audio=@recording2.wav" | jq .
```

---

## GET /api/v1/audio/onboarding/profiles

```bash
curl -s http://localhost:3000/api/v1/audio/onboarding/profiles | jq .
```

## GET /api/v1/audio/onboarding/profiles/:userId

```bash
curl -s http://localhost:3000/api/v1/audio/onboarding/profiles/flavio | jq .
```

---

## POST /api/v1/audio/train/start

Start GPT-SoVITS fine-tuning for a voice profile.

### Parameters (form fields)

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | ✅ | Profile to train (must have files via onboarding) |
| `whatsapp` | string | ❌ | Number to notify when done (e.g. `5527992618345`) |

```bash
curl -s -X POST http://localhost:3000/api/v1/audio/train/start \
  -F "user_id=flavio" \
  -F "whatsapp=5527992618345" | jq .
```

**Response:**
```json
{
  "status": "queued",
  "job_id": "train-flavio-20260217-143022",
  "user_id": "flavio",
  "dataset": { "manual_files": 12, "spontaneous_files": 8 }
}
```
