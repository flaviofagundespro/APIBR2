# Documentação da API do Estúdio de Produção de Mídia com IA

Esta documentação descreve os novos endpoints adicionados à APIBR para funcionalidades de geração de mídia com IA.

## 1. Endpoints de Áudio

### 1.1. Clonar Voz
- **Endpoint:** `POST /api/v1/audio/clone-voice`
- **Descrição:** Clona uma voz a partir de um arquivo de áudio fornecido.
- **Corpo da Requisição:**
```json
{
  "audio_file": "<URL_DO_ARQUIVO_DE_AUDIO>",
  "name": "<NOME_DA_VOZ>"
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Voice cloning initiated."
}
```

### 1.2. Gerar Fala
- **Endpoint:** `POST /api/v1/audio/generate-speech`
- **Descrição:** Gera fala a partir de um texto usando uma voz específica.
- **Corpo da Requisição:**
```json
{
  "text": "<TEXTO_PARA_GERAR_FALA>",
  "voice_id": "<ID_DA_VOZ>"
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Speech generation initiated."
}
```

### 1.3. Obter Vozes Disponíveis
- **Endpoint:** `GET /api/v1/audio/voices`
- **Descrição:** Retorna uma lista de vozes disponíveis para geração de fala.
- **Resposta de Sucesso (200 OK):**
```json
{
  "voices": [
    { "id": "voz_padrao_1", "name": "Voz Padrão Feminina" },
    { "id": "voz_padrao_2", "name": "Voz Padrão Masculina" }
  ]
}
```

## 2. Endpoints de Imagem

### 2.1. Gerar Imagem
- **Endpoint:** `POST /api/v1/image/generate`
- **Descrição:** Gera uma imagem a partir de um prompt de texto.
- **Corpo da Requisição:**
```json
{
  "prompt": "<PROMPT_DE_TEXTO>",
  "model": "<MODELO_DE_IA>" (ex: "flux", "stable-diffusion-3.5")
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Image generation initiated."
}
```

### 2.2. Editar Imagem
- **Endpoint:** `POST /api/v1/image/edit`
- **Descrição:** Edita uma imagem existente com base em um prompt.
- **Corpo da Requisição:**
```json
{
  "image_url": "<URL_DA_IMAGEM>",
  "prompt": "<PROMPT_DE_EDICAO>"
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Image editing initiated."
}
```

### 2.3. Aumentar Resolução da Imagem (Upscale)
- **Endpoint:** `POST /api/v1/image/upscale`
- **Descrição:** Aumenta a resolução de uma imagem existente.
- **Corpo da Requisição:**
```json
{
  "image_url": "<URL_DA_IMAGEM>"
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Image upscale initiated."
}
```

## 3. Endpoints de Vídeo

### 3.1. Criar Avatar
- **Endpoint:** `POST /api/v1/video/create-avatar`
- **Descrição:** Cria um avatar de vídeo a partir de uma imagem e um script de áudio.
- **Corpo da Requisição:**
```json
{
  "image_url": "<URL_DA_IMAGEM>",
  "voice_id": "<ID_DA_VOZ>",
  "script": "<TEXTO_DO_SCRIPT>",
  "duration": <DURACAO_EM_SEGUNDOS>
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Avatar creation initiated."
}
```

### 3.2. Animar Vídeo
- **Endpoint:** `POST /api/v1/video/animate`
- **Descrição:** Anima um vídeo existente com base em parâmetros.
- **Corpo da Requisição:**
```json
{
  "video_url": "<URL_DO_VIDEO>",
  "animation_params": { ... }
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Video animation initiated."
}
```

### 3.3. Obter Status do Vídeo
- **Endpoint:** `GET /api/v1/video/status/{job_id}`
- **Descrição:** Retorna o status de um trabalho de geração de vídeo.
- **Parâmetros de URL:**
  - `job_id`: ID do trabalho de geração de vídeo.
- **Resposta de Sucesso (200 OK):**
```json
{
  "job_id": "<ID_DO_TRABALHO>",
  "status": "<STATUS>" (ex: "pending", "processing", "completed", "failed")
}
```

## 4. Endpoints de Estúdio

### 4.1. Criar Projeto
- **Endpoint:** `POST /api/v1/studio/create-project`
- **Descrição:** Cria um novo projeto no estúdio de mídia.
- **Corpo da Requisição:**
```json
{
  "name": "<NOME_DO_PROJETO>",
  "type": "<TIPO_DO_PROJETO>" (ex: "audio", "image", "video", "mixed")
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Project created."
}
```

### 4.2. Gerar Conteúdo do Projeto
- **Endpoint:** `POST /api/v1/studio/generate-content`
- **Descrição:** Inicia a geração de conteúdo para um projeto, acionando workflows N8n.
- **Corpo da Requisição:**
```json
{
  "contentType": "<TIPO_DE_CONTEUDO>" (ex: "video", "audio", "image"),
  "data": { ... } (dados específicos para o tipo de conteúdo)
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "message": "Content generation initiated and N8n workflow triggered."
}
```

### 4.3. Obter Projetos
- **Endpoint:** `GET /api/v1/studio/projects`
- **Descrição:** Retorna uma lista de projetos existentes no estúdio.
- **Resposta de Sucesso (200 OK):**
```json
{
  "projects": [
    { "id": "<ID_DO_PROJETO>", "name": "<NOME_DO_PROJETO>", "type": "<TIPO>", "status": "<STATUS>" }
  ]
}
```


