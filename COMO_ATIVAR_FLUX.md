# 🚀 Como Ativar o FLUX.1 no APIBR2

## Status Atual
✅ Dependências instaladas (sentencepiece, protobuf)
✅ Código implementado e pronto
⚠️ Requer autenticação HuggingFace (gratuito)

## Passos para Ativar (5 minutos)

### 1. Criar Conta HuggingFace (Gratuito)
Acesse: https://huggingface.co/join

### 2. Aceitar Termos do FLUX
Acesse: https://huggingface.co/black-forest-labs/FLUX.1-schnell
Clique em "Agree and access repository"

### 3. Gerar Token de Acesso
1. Vá para: https://huggingface.co/settings/tokens
2. Clique em "New token"
3. Nome: "APIBR2" (ou qualquer nome)
4. Tipo: "Read" (suficiente)
5. Copie o token gerado (começa com `hf_...`)

### 4. Configurar Token no Sistema

#### Opção A: Variável de Ambiente (Temporário)
```bash
export HUGGINGFACE_HUB_TOKEN="hf_seu_token_aqui"
```

#### Opção B: Arquivo .env (Permanente - Recomendado)
```bash
# Criar/editar arquivo .env na raiz do projeto
echo "HUGGINGFACE_HUB_TOKEN=hf_seu_token_aqui" >> /home/flaviofagundes/Projetos/APIBR2/.env
```

### 5. Reiniciar Servidor de Imagens
```bash
# Pare o servidor atual (Ctrl+C na aba do terminal)
# Depois reinicie:
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
python ultra_optimized_server.py
```

### 6. Testar FLUX
No frontend, selecione "FLUX.1 [Schnell]" e gere uma imagem.
**Primeira vez:** Vai baixar ~12GB (pode demorar 10-30 min dependendo da internet)
**Próximas vezes:** Instantâneo (modelo fica em cache)

## O que Esperar

### Vantagens do FLUX
- ✨ **Fotorrealismo extremo** - Indistinguível de fotos reais
- 📝 **Texto perfeito** - Escreve palavras e frases corretamente nas imagens
- ⚡ **Apenas 4 passos** - Mais rápido que SD 1.5 em qualidade equivalente
- 🎨 **Resolução nativa 1024x1024** - Imagens maiores sem perda

### Comparação de Performance
| Modelo | Passos | Tempo | Qualidade | Texto |
|--------|--------|-------|-----------|-------|
| SD 1.5 | 15-25 | ~20s | Boa | Ruim |
| DreamShaper 8 | 15-25 | ~20s | Muito Boa | Ruim |
| **FLUX.1** | **4** | **~25s** | **Excepcional** | **Perfeito** |

## Troubleshooting

### Erro: "401 Authentication failed"
- Verifique se aceitou os termos em: https://huggingface.co/black-forest-labs/FLUX.1-schnell
- Confirme que o token está correto (começa com `hf_`)
- Teste o token: `huggingface-cli whoami`

### Erro: "Out of memory"
- FLUX usa ~10GB de VRAM com CPU offload
- Sua RX 6750 XT (12GB) é suficiente
- Se falhar, tente gerar em 512x512 primeiro

### Download muito lento
- Primeira vez baixa ~12GB
- Use conexão estável
- Modelo fica em: `~/.cache/huggingface/hub/`

## Alternativa Sem Autenticação

Se preferir não criar conta, posso configurar modelos alternativos:
- **Stable Diffusion XL** - Melhor que SD 1.5, sem autenticação
- **Playground v2.5** - Excelente fotorrealismo
- **RealVisXL** - Focado em realismo

Quer que eu configure algum desses?
