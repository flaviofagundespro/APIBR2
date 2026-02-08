# 🎉 FLUX.1 - Status de Instalação

## ✅ Progresso Atual

### Token Configurado
- ✅ HuggingFace token criado e configurado
- ✅ Token validado: `hf_nqnctOn...SLkLP`
- ✅ Arquivo `.env` atualizado

### Download em Andamento
- 📥 **FLUX.1-schnell está sendo baixado**
- 📊 Tamanho total: ~12GB
- ⏱️ Tempo estimado: 10-30 minutos (depende da conexão)

### Como Monitorar o Progresso

#### Opção 1: Script de Monitoramento (Recomendado)
```bash
cd /home/flaviofagundes/Projetos/APIBR2/integrations
./monitor_flux_download.sh
```

#### Opção 2: Verificação Manual
```bash
# Ver tamanho atual
du -sh ~/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell/

# Quando chegar a ~12GB, está completo
```

## 🚀 Próximos Passos

### Quando o Download Completar:

1. **Testar o FLUX:**
   ```bash
   cd /home/flaviofagundes/Projetos/APIBR2/integrations
   source venv/bin/activate
   python test_flux_auth.py
   ```

2. **Iniciar o servidor de imagens:**
   ```bash
   cd /home/flaviofagundes/Projetos/APIBR2/integrations
   source venv/bin/activate
   export HUGGINGFACE_HUB_TOKEN=$(grep HUGGINGFACE_HUB_TOKEN ../.env | cut -d= -f2)
   python ultra_optimized_server.py
   ```

3. **Usar no Frontend:**
   - Abra o frontend em http://localhost:5173
   - Vá para "Image Studio"
   - Selecione "FLUX.1 [Schnell]" no dropdown de modelos
   - Gere sua primeira imagem!

## 📝 Dicas de Uso

### Prompts para FLUX
O FLUX é excelente com texto nas imagens. Experimente:
```
A neon sign that says "APIBR2" in a cyberpunk city at night
```

### Configurações Recomendadas
- **Steps:** 4 (já é o padrão)
- **Guidance Scale:** 0.0 (FLUX ignora esse parâmetro)
- **Resolução:** 1024x1024 (nativa) ou 512x512 (mais rápido)

### Performance Esperada
- **Primeira geração:** ~30-40s (carregamento do modelo)
- **Gerações seguintes:** ~15-25s
- **VRAM usado:** ~10GB (com CPU offload)

## ⚠️ Troubleshooting

### Se o download parar ou falhar:
```bash
# Limpar cache parcial
rm -rf ~/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell

# Tentar novamente
cd /home/flaviofagundes/Projetos/APIBR2/integrations
source venv/bin/activate
python test_flux_auth.py
```

### Se der erro de VRAM:
- Tente gerar em 512x512 primeiro
- Feche outros programas que usam GPU
- Sua RX 6750 XT (12GB) é suficiente, mas o sistema precisa de memória livre

## 🎨 Comparação Rápida

| Aspecto | DreamShaper 8 | FLUX.1 |
|---------|---------------|---------|
| Realismo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Texto | ❌ | ✅ Perfeito |
| Velocidade | ~20s | ~20s |
| Resolução | 512x512 | 1024x1024 |
| VRAM | ~4GB | ~10GB |

---

**Status:** 🟡 Download em andamento
**Próximo passo:** Aguardar conclusão do download (~12GB)
