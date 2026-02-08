# 🎨 Image-to-Image (img2img) - Plano de Implementação

## O Que É img2img?

Permite gerar variações de uma imagem existente:
- **Seed:** Reproduzir exatamente a mesma imagem
- **Upload:** Modificar uma imagem (mudar roupa, postura, etc.)
- **Strength:** Controlar quanto a imagem original é preservada

## Funcionalidades a Implementar

### 1. Seed (Reprodutibilidade)
```python
# Gerar com seed fixo
generator = torch.Generator(device="cuda").manual_seed(12345)
image = pipe(prompt, generator=generator)

# Salvar seed junto com a imagem
metadata = {"seed": 12345, "prompt": "..."}
```

### 2. Upload de Imagem (img2img)
```python
from PIL import Image
from diffusers import StableDiffusionImg2ImgPipeline

# Carregar imagem base
init_image = Image.open("foto.png").convert("RGB")

# Gerar variação
image = pipe(
    prompt="mesma mulher, vestido vermelho",
    image=init_image,
    strength=0.75,  # 0.0=original, 1.0=completamente novo
    guidance_scale=7.5
)
```

### 3. Inpainting (Edição Localizada)
```python
from diffusers import StableDiffusionInpaintPipeline

# Máscara define área a modificar
image = pipe(
    prompt="vestido vermelho",
    image=init_image,
    mask_image=mask,  # Branco=editar, Preto=manter
    strength=0.75
)
```

## Arquivos a Modificar

### Backend Python (`ultra_optimized_server.py`)
```python
# Novo endpoint
@app.post("/img2img")
def image_to_image(
    prompt: str,
    image: UploadFile,
    strength: float = 0.75,
    seed: Optional[int] = None
):
    # Carregar imagem
    init_image = Image.open(image.file)
    
    # Configurar seed
    generator = None
    if seed:
        generator = torch.Generator(device="cuda").manual_seed(seed)
    
    # Gerar variação
    result = img2img_pipe(
        prompt=prompt,
        image=init_image,
        strength=strength,
        generator=generator
    )
    
    return {"image": result, "seed": seed}
```

### Frontend (`App.jsx`)
```javascript
// Novo componente img2img
const [baseImage, setBaseImage] = useState(null);
const [strength, setStrength] = useState(0.75);
const [useSeed, setUseSeed] = useState(false);
const [seed, setSeed] = useState(null);

// Upload de imagem
<input 
    type="file" 
    accept="image/*"
    onChange={(e) => setBaseImage(e.target.files[0])}
/>

// Slider de strength
<input 
    type="range" 
    min="0" 
    max="1" 
    step="0.05"
    value={strength}
    onChange={(e) => setStrength(e.target.value)}
/>

// Seed
<input 
    type="checkbox"
    checked={useSeed}
    onChange={(e) => setUseSeed(e.target.checked)}
/>
{useSeed && (
    <input 
        type="number"
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
    />
)}
```

## Casos de Uso

### 1. Reproduzir Imagem Exata
```
Seed: 12345
Prompt: "mulher sorrindo"
→ Sempre gera a mesma imagem
```

### 2. Mudar Roupa
```
Upload: foto_mulher.png
Prompt: "mesma mulher, vestido vermelho elegante"
Strength: 0.6 (preserva rosto/postura, muda roupa)
```

### 3. Mudar Postura
```
Upload: foto_mulher.png
Prompt: "mesma mulher, sentada, relaxada"
Strength: 0.8 (mais liberdade para mudar pose)
```

### 4. Mudar Estilo
```
Upload: foto.png
Prompt: "mesma cena, estilo anime"
Strength: 0.9 (transforma completamente o estilo)
```

## Implementação Passo a Passo

### Fase 1: Seed (Mais Simples)
1. Adicionar campo seed no backend
2. Salvar seed nos metadados da imagem
3. Adicionar input de seed no frontend
4. Permitir copiar seed de imagens anteriores

### Fase 2: img2img (Upload)
1. Adicionar endpoint `/img2img`
2. Carregar `StableDiffusionImg2ImgPipeline`
3. Adicionar upload de imagem no frontend
4. Adicionar slider de strength

### Fase 3: Inpainting (Avançado)
1. Adicionar endpoint `/inpaint`
2. Criar editor de máscara no frontend
3. Permitir pintar áreas a modificar

## Estimativa de Tempo

- **Seed:** ~30 minutos
- **img2img:** ~2 horas
- **Inpainting:** ~4 horas

## Quer que eu implemente?

Posso começar pela funcionalidade de **Seed** (mais simples e útil) e depois adicionar **img2img** (upload de imagem).

Qual prefere começar?
1. Seed (reproduzir imagens)
2. img2img (upload + variações)
3. Ambos
