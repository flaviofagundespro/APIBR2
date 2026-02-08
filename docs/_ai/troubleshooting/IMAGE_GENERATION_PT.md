# 🐛 Problema: Geração de Imagem Local - Lenta e Travando

## 📅 Data: 24/11/2025

## 🔴 Problema Principal

A geração de imagens está funcionando remotamente via n8n (comunicação backend Node.js → servidor Python OK), mas **localmente está muito lenta e travando**.

## 🖥️ Configuração do Hardware

- **Processador**: AMD Ryzen 9 7900X, 12-Core, 24-Threads, 4.7GHz (5.6GHz Turbo)
- **Placa de Vídeo**: XFX AMD Radeon RX 6750 XT Speedster QICK 319, **12GB GDDR6**
- **Memória RAM**: 32GB (2x16GB) 5600MHz DDR5
- **Sistema**: Windows 10

## 🔍 Problemas Identificados

### 1. DirectML (torch-directml) - Muito Lento/Travando

**Sintomas:**
- GPU AMD detectada corretamente: `✅ AMD GPU detectada via torch-directml - usando DirectML`
- Device detectado: `privateuseone:0`
- Geração inicia mas **travou após 5 minutos sem progresso**
- Barra de progresso: `0%|...| 0/30 [00:00<?, ?it/s]` (não avança)

**Tentativas de Solução:**
- ✅ Instalado `torch-directml` corretamente
- ✅ GPU detectada e pipeline carregado
- ✅ Otimizações aplicadas (attention_slicing, vae_slicing)
- ✅ Limite de tamanho para 512x512
- ✅ Limite de steps para 20 (DirectML)
- ⚠️ **Problema persiste**: DirectML muito lento ou travando

**Erros Encontrados:**
1. `ensure_in_bounds: sizes [4, 16384, 16384]` - Tensor muito grande
2. `Could not allocate tensor with 1073741824 bytes` - Falta de memória (mesmo com 12GB)
3. Geração trava sem erro (timeout silencioso)

### 2. CPU - Funcional mas Muito Lento

**Status:**
- ✅ Funciona corretamente
- ⚠️ **Muito lento**: ~43 segundos por iteração
- ⚠️ Para 30 steps: ~20-30 minutos por imagem

**Solução Temporária:**
- Usar `FORCE_CPU=true` para estabilidade
- Script criado: `start_cpu_mode.ps1`

## 📝 Correções Aplicadas

### Código (`ultra_optimized_server.py`)

1. ✅ Detecção melhorada de GPU (torch-directml)
2. ✅ Fallback automático para CPU se DirectML falhar
3. ✅ Limite de tamanho para DirectML (512x512)
4. ✅ Limite de steps para DirectML (máximo 20)
5. ✅ Tratamento de erro de memória com fallback
6. ✅ Parsing correto do campo `size`
7. ✅ Variável de ambiente `FORCE_CPU` para forçar CPU
8. ✅ Logs melhorados com avisos sobre lentidão

### Backend Node.js

1. ✅ URL do servidor Python configurável via `PYTHON_SERVER_URL`
2. ✅ Parsing correto do campo `size` (1024x1024 → width/height)
3. ✅ Timeout aumentado para 10 minutos
4. ✅ Logs melhorados

## 🎯 Status Atual

### ✅ Funcionando
- Comunicação n8n → Backend Node.js → Servidor Python
- Servidor Python detecta GPU AMD corretamente
- Pipeline carrega sem erros
- CPU funciona (lento mas estável)

### ❌ Não Funcionando
- DirectML trava ou é extremamente lento
- Geração não completa com DirectML

## 💡 Soluções Temporárias

### Opção 1: Usar CPU (Recomendado para Estabilidade)
```powershell
cd APIBR2\integrations
$env:FORCE_CPU = "true"
python ultra_optimized_server.py
```

Ou usar o script:
```powershell
.\start_cpu_mode.ps1
```

### Opção 2: Reduzir Steps para DirectML
```json
{
  "prompt": "gatinho fofo",
  "model": "runwayml/stable-diffusion-v1-5",
  "steps": 10,
  "width": 512,
  "height": 512
}
```

### Opção 3: Usar Servidor AMD Alternativo
```powershell
cd integrations
python real_image_server_amd.py
```

## 🔬 Investigação Necessária

### 1. DirectML Performance
- [ ] Verificar drivers AMD atualizados
- [ ] Testar versões diferentes do torch-directml
- [ ] Verificar se há conflitos com outros processos usando GPU
- [ ] Testar com modelos menores (SDXL Turbo)

### 2. Alternativas
- [ ] Investigar ROCm (suporte AMD nativo no Linux)
- [ ] Testar ONNX Runtime com DirectML
- [ ] Considerar usar API externa (Replicate, Stability AI)

### 3. Otimizações
- [ ] Reduzir ainda mais os steps (5-10 para DirectML)
- [ ] Usar modelos quantizados
- [ ] Implementar cache de modelos
- [ ] Usar batch size menor

## 📚 Referências

- [AMD GPU Guide](AMD_GPU_GUIDE.md)
- [DirectML Documentation](https://github.com/microsoft/DirectML)
- [torch-directml GitHub](https://github.com/microsoft/DirectML)

## 🎯 Próximos Passos

1. **Curto Prazo**: Usar CPU para estabilidade
2. **Médio Prazo**: Investigar alternativas ao DirectML
3. **Longo Prazo**: Considerar migração para Linux com ROCm (melhor suporte AMD)

## 📝 Notas Adicionais

- DirectML ainda está em desenvolvimento e pode ser instável
- AMD tem melhor suporte no Linux com ROCm
- CPU funciona mas é muito lento para produção
- Comunicação remota (n8n) está funcionando perfeitamente

---

**Última Atualização**: 24/11/2025  
**Status**: 🔴 Problema Ativo - DirectML Lento/Travando  
**Solução Temporária**: Usar CPU com `FORCE_CPU=true`



