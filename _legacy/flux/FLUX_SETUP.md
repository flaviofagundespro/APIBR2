# FLUX.1 Setup Guide

## Problema Identificado
O FLUX.1-schnell é um modelo "gated" (com restrição de acesso) no HuggingFace. Você precisa:
1. Criar uma conta no HuggingFace
2. Aceitar os termos do modelo
3. Gerar um token de acesso

## Solução Passo a Passo

### 1. Instalar Dependências Faltantes
```bash
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
pip install sentencepiece protobuf
```

### 2. Configurar HuggingFace Token

#### Opção A: Criar conta e obter token (Recomendado)
1. Acesse: https://huggingface.co/join
2. Crie sua conta (gratuito)
3. Vá para: https://huggingface.co/settings/tokens
4. Clique em "New token" → "Read" → Copie o token
5. Aceite os termos do FLUX: https://huggingface.co/black-forest-labs/FLUX.1-schnell
6. Configure o token:
```bash
# No terminal:
export HUGGINGFACE_HUB_TOKEN="seu_token_aqui"

# Ou adicione ao .env do projeto:
echo "HUGGINGFACE_HUB_TOKEN=seu_token_aqui" >> /home/flaviofagundes/Projetos/APIBR2/.env
```

#### Opção B: Usar modelo alternativo (Sem autenticação)
Podemos usar o **FLUX.1-dev** de outra fonte ou um modelo similar que não requer autenticação.

### 3. Testar FLUX
Depois de configurar o token:
```bash
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
python test_flux.py
```

## Alternativa: Modelos Similares Sem Restrição

Se preferir não criar conta no HuggingFace, posso configurar modelos alternativos de alta qualidade:

1. **Stable Diffusion XL (SDXL)** - Qualidade superior ao SD 1.5
2. **Playground v2.5** - Excelente para fotorrealismo
3. **RealVisXL** - Focado em realismo extremo

Qual caminho prefere seguir?
