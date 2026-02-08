# 🎨 APIBR2 - Guia Completo de Geração de Imagens

Este documento detalha todas as capacidades da API de Geração de Imagens do APIBR2.
A API roda localmente na porta **5001** e utiliza modelos de Inteligência Artificial de última geração (Stable Diffusion).

---

## 🚀 Endpoint Principal

**URL:** `http://localhost:5001/generate`
**Método:** `POST`
**Headers:** `Content-Type: application/json`

---

## 🛠️ Parâmetros do JSON (Body)

Você tem controle total sobre a geração. Aqui estão todos os campos que você pode enviar:

| Parâmetro | Tipo | Obrigatório? | Padrão | Descrição |
|-----------|------|--------------|--------|-----------|
| `prompt` | string | **SIM** | - | O texto descrevendo a imagem que você quer criar (em inglês funciona melhor). |
| `model` | string | Não | `sd-1.5` | O "cérebro" da IA. Define o estilo visual (veja lista abaixo). |
| `device` | string | Não | `auto` | Onde processar: `cpu` (processador), `dml` (GPU AMD), `cuda` (NVIDIA) ou `auto`. |
| `steps` | int | Não | `10` | Qualidade vs. Velocidade. Mais passos = mais detalhe, mas mais lento. |
| `width` | int | Não | `512` | Largura da imagem (múltiplo de 8). |
| `height` | int | Não | `512` | Altura da imagem (múltiplo de 8). |
| `guidance_scale` | float | Não | `7.5` | Fidelidade ao prompt. Valores altos (7-12) seguem o texto à risca. |
| `scheduler` | string | Não | `dpm++` | O algoritmo de desenho. `dpm++` é o melhor balanceado. |

---

## 🤖 Modelos Disponíveis (O "Cérebro")

Escolha o modelo certo para o seu objetivo. Use o **Alias** para facilitar.

| Alias | Nome Completo | Melhor Uso | Estilo Visual |
|-------|---------------|------------|---------------|
| `sd-1.5` | `runwayml/stable-diffusion-v1-5` | **Uso Geral** | Fotorealista, equilibrado. O "pau pra toda obra". |
| `sdxl-turbo` | `stabilityai/sdxl-turbo` | **Velocidade** | Gera em ~10s. Ótimo para testes rápidos. |
| `dreamshaper` | `lykon/dreamshaper-8` | **Arte Digital** | Estilo pintura, RPG, fantasia, concept art. |
| `openjourney` | `prompthero/openjourney` | **Midjourney** | Estilo artístico dramático, similar ao Midjourney v4. |
| `anything-v3` | `Linaqruf/anything-v3.0` | **Anime** | Traços de anime, manga e ilustração 2D. |

stable-diffusion-1.5
sdxl-turbo
---

## ⚙️ Configurações Avançadas

### 1. Controlando o Hardware (`device`)
Se você quer garantir estabilidade ou testar performance:
*   `"device": "cpu"` -> **Recomendado para Estabilidade**. Usa seu Ryzen 9 (rápido e não trava).
*   `"device": "dml"` -> Usa sua GPU AMD (Radeon). Pode ser mais rápido, mas às vezes instável no Windows.
*   `"device": "cuda"` -> Apenas para placas NVIDIA.

### 2. Schedulers (O "Pincel")
Como a IA desenha a imagem:
*   `"scheduler": "dpm++"` -> **Recomendado**. Rápido e alta qualidade em poucos passos (10-15).
*   `"scheduler": "euler_a"` -> Criativo e rápido. Ótimo para o modelo `sdxl-turbo`.
*   `"scheduler": "ddim"` -> Mais determinístico, bom para editar imagens (inpainting).

### 3. Dicas de Otimização
*   **Para velocidade máxima:**
    ```json
    { "model": "sdxl-turbo", "steps": 4, "device": "cpu" }
    ```
*   **Para qualidade máxima:**
    ```json
    { "model": "dreamshaper", "steps": 20, "scheduler": "dpm++", "device": "cpu" }
    ```

---

## 📦 Exemplos de JSON para Copiar e Colar (n8n)

### Exemplo 1: Fotografia Realista (Padrão)
```json
{
  "prompt": "portrait of a cyberpunk warrior, neon lights, highly detailed, 8k, photorealistic",
  "model": "sd-1.5",
  "steps": 15,
  "device": "cpu"
}
```

### Exemplo 2: Teste Rápido (Turbo)
```json
{
  "prompt": "a futuristic city flying car",
  "model": "sdxl-turbo",
  "steps": 4,
  "device": "cpu"
}
```

### Exemplo 3: Estilo Anime
```json
{
  "prompt": "magical girl casting a spell, vibrant colors, anime style, studio ghibli",
  "model": "anything-v3",
  "steps": 12,
  "device": "cpu"
}
```

---

## 🔍 Outros Endpoints Úteis

*   **Listar tudo:** `GET /models` - Mostra modelos e seu hardware atual.
*   **Status:** `GET /health` - Vê se o servidor está de pé.
*   **Benchmark:** `GET /benchmark` - Estima o tempo de geração no seu PC.
