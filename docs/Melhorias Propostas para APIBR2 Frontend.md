# Melhorias Propostas para APIBR2 Frontend

## 1. Análise Atual

### Frontend (React/Vite)
- **Localização**: `frontend/src/App.jsx`
- **Componente ImageStudio**: Interface básica com apenas prompt de texto
- **Parâmetros Utilizados**: 
  - prompt (obrigatório)
  - model (fixo: runwayml/stable-diffusion-v1-5)
  - size (fixo: 512x512)

### Backend (Python - real_image_server.py)
- **Parâmetros Disponíveis na API**:
  - `prompt`: string (obrigatório)
  - `model`: string (padrão: stabilityai/stable-diffusion-3.5)
  - `steps`: int (padrão: 30) - Número de passos de inferência
  - `guidance_scale`: float (padrão: 7.5) - Escala de orientação
  - `width`: int (padrão: 1024)
  - `height`: int (padrão: 1024)
  - `size`: string (padrão: 1024x1024)

### Modelos Disponíveis
- stabilityai/stable-diffusion-3.5
- stabilityai/stable-diffusion-3
- runwayml/stable-diffusion-v1-5 (mencionado no frontend)

## 2. Melhorias Propostas para Frontend de Geração de Imagens

### 2.1 Seletor de Modelo
- Dropdown com modelos disponíveis
- Descrição de cada modelo
- Informações sobre qualidade vs velocidade

### 2.2 Controles de Tamanho
- Presets: 512x512, 768x768, 1024x1024
- Opção customizada (width/height independentes)
- Validação de proporções

### 2.3 Controles de Qualidade
- **Número de Passos (Steps)**: Slider de 10 a 50
  - Mais passos = melhor qualidade mas mais lento
  - Recomendação: 20-30 para uso geral
  
- **Guidance Scale**: Slider de 1.0 a 20.0
  - Controla quanto o modelo segue o prompt
  - Valores baixos = mais criatividade
  - Valores altos = mais fidelidade ao prompt

### 2.4 Histórico e Gerenciamento
- Galeria de imagens geradas na sessão
- Opção de baixar imagens
- Opção de usar imagem anterior como referência

### 2.5 Melhorias de UX
- Indicador de progresso durante geração
- Estimativa de tempo de geração
- Exibição de metadados da imagem gerada
- Botão para copiar prompt

## 3. Funcionalidade de Download de Vídeos

### 3.1 Estrutura Atual
- **VideoStudio Component**: Apenas Instagram downloader
- **Endpoint**: POST `/api/instagram/download`
- **Parâmetros**: { url }

### 3.2 Melhorias Propostas

#### 3.2.1 Seletor de Plataforma
- Abas ou dropdown para selecionar:
  - Instagram (existente)
  - TikTok (novo)
  - YouTube (novo)

#### 3.2.2 Funcionalidades por Plataforma

**Instagram** (mantém atual)
- Download de vídeos/reels
- Download de stories

**TikTok** (novo)
- Download de vídeos
- Opção de remover marca d'água
- Seleção de qualidade

**YouTube** (novo)
- Download de vídeos
- Download de playlists
- Seleção de qualidade (360p, 720p, 1080p)
- Download apenas de áudio (MP3)

#### 3.2.3 Interface Unificada
- Input único para URL
- Detecção automática de plataforma
- Opções específicas por plataforma
- Histórico de downloads

## 4. Implementação Técnica

### 4.1 Frontend (React Components)
```
components/
├── ImageStudio/
│   ├── ImageGenerator.jsx (componente principal)
│   ├── ModelSelector.jsx
│   ├── SizeControls.jsx
│   ├── QualityControls.jsx
│   └── ImageGallery.jsx
└── VideoStudio/
    ├── VideoDownloader.jsx (componente principal)
    ├── PlatformTabs.jsx
    ├── InstagramDownloader.jsx
    ├── TikTokDownloader.jsx
    └── YouTubeDownloader.jsx
```

### 4.2 Backend (Python)
- Expandir `real_image_server.py` com novos endpoints
- Adicionar suporte para TikTok (yt-dlp ou similar)
- Adicionar suporte para YouTube (yt-dlp)
- Manter compatibilidade com n8n

### 4.3 Endpoints Necessários
```
POST /api/v1/image/generate
  - Adicionar: steps, guidance_scale, width, height, model

GET /api/v1/image/models
  - Retornar lista de modelos disponíveis

POST /api/v1/video/download
  - Parâmetros: url, platform (auto-detect), options

POST /api/v1/video/tiktok/download
  - Parâmetros: url, quality, remove_watermark

POST /api/v1/video/youtube/download
  - Parâmetros: url, quality, audio_only, format
```

## 5. Próximas Etapas

1. ✅ Análise do código existente
2. ⏳ Criar componentes React melhorados
3. ⏳ Implementar novos endpoints backend
4. ⏳ Integrar TikTok downloader
5. ⏳ Integrar YouTube downloader
6. ⏳ Testar funcionalidades
7. ⏳ Documentar mudanças
