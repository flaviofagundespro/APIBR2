# Plano de Reorganização Revisado - APIBR2

**Data**: 2026-02-08 (Revisão)
**Objetivo**: Limpar raiz mantendo scripts de startup, movendo apenas docs e utilitários

---

## 🎯 Filosofia do Plano Revisado

### ✅ O QUE MOVER
- **Documentação** → `docs/notes/` e `docs/guides/`
- **Scripts utilitários/testes** → `scripts/utils/`

### ❌ O QUE NÃO MOVER
- **Scripts de startup** → Permanecem na raiz (start_*, stop_*)
- **Arquivos principais** → README.md, CLAUDE.md, CHANGELOG.md na raiz

### 🎯 Resultado Final
```
Raiz (de 34 → 11 arquivos):
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
├── start_all.sh
├── start_system.sh
├── stop_apibr2.sh
├── start_all.ps1
├── start_apibr2.ps1
├── start_frontend.ps1
├── start_instagram.ps1
└── stop_apibr2.ps1
```

---

## 📋 COMMIT 1: Reorganizar Documentação

### Arquivos a Mover (17 documentos)

#### → `docs/notes/` (13 arquivos - notas técnicas/status)
```bash
1.  AI_CONTEXT.md                # Contexto para IA
2.  API_SEED_DOCS.md             # Docs da API seed
3.  CURRENT_STATUS.md            # Status atual do projeto
4.  FEBRUARY_2026_UPDATE.md      # Update de migração Linux/ROCm
5.  IMG2IMG_API_DOCS.md          # Docs da API img2img
6.  IMG2IMG_GUIA.md              # Guia img2img
7.  IMG2IMG_PLANO.md             # Plano de implementação img2img
8.  INDEX.md                     # Índice de documentos
9.  LIMPEZA_COMPLETA.md          # Notas de limpeza
10. PROJECT_SUMMARY.md           # Sumário do projeto
11. SEED_BACKEND_COMPLETO.md     # Implementação seed backend
12. SEED_COMPLETO.md             # Documentação seed completa
13. SEED_CORRECAO.md             # Correções seed
```

#### → `docs/guides/` (4 arquivos - guias práticos)
```bash
14. INSTALACAO_PYTHON.md         # Guia de instalação Python
15. MANUAL_CURL.md               # Exemplos de uso com curl
16. QUICK_START.md               # Guia rápido de início
17. STARTUP_SCRIPTS.md           # Documentação dos scripts
```

### Referências a Atualizar no Commit 1

#### 1. **Referências entre documentos** (baixo impacto)
- **INDEX.md** pode referenciar outros docs
- **PROJECT_SUMMARY.md** pode referenciar STARTUP_SCRIPTS.md
- **README.md** pode mencionar QUICK_START.md ou outros guias

**Ação**: Verificar cross-references e atualizar caminhos se necessário.

---

## 📋 COMMIT 2: Reorganizar Utilitários

### Arquivos a Mover (7 arquivos)

#### → `scripts/utils/` (7 utilitários)
```bash
1. test_img2img.sh               # Teste de image-to-image API
2. test_seed_api.sh              # Teste de seed consistency
3. diagnostico.sh                # Diagnóstico do sistema
4. check_status.ps1              # Verifica status dos serviços
5. clean_cache.ps1               # Limpa cache
6. add_img2img.py                # Utilitário Python (adicionar img2img)
7. test_python.py                # Teste Python genérico
```

### ✅ Referências a Atualizar no Commit 2

#### **Total: 10 arquivos a modificar, ~30 linhas**

---

### 🔴 PRIORIDADE CRÍTICA

#### 1. **CLAUDE.md** (6 linhas)
```diff
Linha 65:
- ./test_img2img.sh    # test image-to-image generation
+ ./scripts/utils/test_img2img.sh    # test image-to-image generation

Linha 66:
- ./test_seed_api.sh   # test seed consistency
+ ./scripts/utils/test_seed_api.sh   # test seed consistency

Linha 67:
- ./diagnostico.sh     # system diagnostics
+ ./scripts/utils/diagnostico.sh     # system diagnostics

Linha 205: (duplicada)
- ./test_img2img.sh          # test image-to-image API
+ ./scripts/utils/test_img2img.sh          # test image-to-image API

Linha 206: (duplicada)
- ./test_seed_api.sh         # test seed consistency
+ ./scripts/utils/test_seed_api.sh         # test seed consistency

Linha 207: (duplicada)
- ./diagnostico.sh           # system health diagnostics
+ ./scripts/utils/diagnostico.sh           # system health diagnostics
```

---

### 🟡 PRIORIDADE ALTA

#### 2. **docs/guides/STARTUP_SCRIPTS.md** (~8 linhas + limpeza)

**Atualizar referências**:
```diff
Linha 210:
- ./clean_cache.ps1
+ ./scripts/utils/clean_cache.ps1

Linha 234:
- ./check_status.ps1
+ ./scripts/utils/check_status.ps1

Linha 242: (título de seção)
- ### check_status.ps1
+ ### check_status.ps1 (scripts/utils/)

Linha 270: (título de seção)
- ### clean_cache.ps1
+ ### clean_cache.ps1 (scripts/utils/)

Linha 314:
- ./check_status.ps1
+ ./scripts/utils/check_status.ps1

Linha 317:
- ./clean_cache.ps1
+ ./scripts/utils/clean_cache.ps1
```

**Remover menções a arquivos inexistentes**:
```diff
Linha 207-213:
- ./clean_cache.bat
- ./clean_cache.ps1
- ./clean_cache.sh

+ ./scripts/utils/clean_cache.ps1
+ ~~clean_cache.bat~~ (deprecated/removed)
+ ~~clean_cache.sh~~ (deprecated/removed)

Linha 231-237:
- ./check_status.bat
- ./check_status.ps1
- ./check_status.sh

+ ./scripts/utils/check_status.ps1
+ ~~check_status.bat~~ (deprecated/removed)
+ ~~check_status.sh~~ (deprecated/removed)
```

---

#### 3. **docs/notes/INDEX.md** (3 linhas)
```diff
Linha 24:
- ├── 🔍 check_status.ps1
+ ├── 🔍 scripts/utils/check_status.ps1

Linha 25:
- ├── 🧹 clean_cache.ps1
+ ├── 🧹 scripts/utils/clean_cache.ps1

Linha 117:
- ./check_status.ps1
+ ./scripts/utils/check_status.ps1

Linha 120:
- ./clean_cache.ps1
+ ./scripts/utils/clean_cache.ps1
```

---

#### 4. **docs/notes/PROJECT_SUMMARY.md** (2 linhas)
```diff
Linha 21:
- 3. **check_status.ps1** - System health monitor.
+ 3. **scripts/utils/check_status.ps1** - System health monitor.

Linha 78:
- ./check_status.ps1
+ ./scripts/utils/check_status.ps1
```

---

### 🟢 PRIORIDADE MÉDIA

#### 5. **docs/notes/IMG2IMG_API_DOCS.md** (1 linha)
```diff
Linha 187:
- ./test_img2img.sh
+ ./scripts/utils/test_img2img.sh
```

---

#### 6. **docs/notes/API_SEED_DOCS.md** (1 linha)
```diff
Linha 218:
- ./test_seed_api.sh
+ ./scripts/utils/test_seed_api.sh
```

---

### 🔵 AUTO-REFERÊNCIAS (Scripts)

#### 7. **scripts/utils/check_status.ps1** (1 linha interna)
```diff
Linha 28:
- Write-Host "  ./start_apibr2.ps1" -ForegroundColor White
+ Write-Host "  ../start_apibr2.ps1" -ForegroundColor White
  (nota: ou manter ./start_apibr2.ps1 já que startup permanece na raiz)

Linha 31:
  cd integrations && ./test_ultra.ps1
  (sem mudança - test_ultra.ps1 está em integrations)
```

**DECISÃO**: Como startup scripts permanecem na raiz, manter `./start_apibr2.ps1` sem mudança.

---

#### 8. **scripts/utils/clean_cache.ps1** (1 linha interna)
```diff
Linha 42:
- Write-Host "  ./start_apibr2.ps1" -ForegroundColor White
+ (manter sem mudança - startup na raiz)
```

---

## 🚫 ARQUIVOS QUE NÃO SERÃO ATUALIZADOS

### 1. **_legacy/flux/** (4 arquivos)
- FLUX_4STEPS_PROTECTION.md
- FLUX_SCHEDULER_FIX.md
- FLUX_CORRECAO.md
- FLUX_CORRECAO_FINAL.md

**Motivo**: Arquivos arquivados, baixa prioridade

---

### 2. **integrations/** (2 scripts)
- fix_huggingface.ps1
- install_amd_gpu.ps1

**Motivo**: Scripts de instalação, atualizar em commit separado

---

### 3. **docs/notes/** (pós-commit 1)
- AI_CONTEXT.md
- CURRENT_STATUS.md
- FEBRUARY_2026_UPDATE.md
- LIMPEZA_COMPLETA.md

**Motivo**: Referenciam apenas scripts de startup (que permanecem na raiz)

---

## 📊 Comparativo: Antes vs Depois

### Antes (Raiz - 34 arquivos)
```
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
├── 19 outros .md ❌
├── 8 scripts startup (.sh/.ps1)
└── 5 scripts utils ❌
```

### Depois (Raiz - 11 arquivos)
```
├── README.md ✅
├── CLAUDE.md ✅
├── CHANGELOG.md ✅
├── start_all.sh ✅
├── start_system.sh ✅
├── stop_apibr2.sh ✅
├── start_all.ps1 ✅
├── start_apibr2.ps1 ✅
├── start_frontend.ps1 ✅
├── start_instagram.ps1 ✅
└── stop_apibr2.ps1 ✅

docs/
├── FLUX.md (já existe)
├── notes/ (13 novos)
└── guides/ (4 novos)

scripts/
└── utils/ (7 novos)
```

---

## 🔨 Comandos para Execução

### **COMMIT 1: Reorganizar Documentação**

```bash
# 1. Criar estrutura
mkdir -p docs/notes docs/guides

# 2. Mover notas técnicas (13 arquivos)
git mv AI_CONTEXT.md docs/notes/
git mv API_SEED_DOCS.md docs/notes/
git mv CURRENT_STATUS.md docs/notes/
git mv FEBRUARY_2026_UPDATE.md docs/notes/
git mv IMG2IMG_API_DOCS.md docs/notes/
git mv IMG2IMG_GUIA.md docs/notes/
git mv IMG2IMG_PLANO.md docs/notes/
git mv INDEX.md docs/notes/
git mv LIMPEZA_COMPLETA.md docs/notes/
git mv PROJECT_SUMMARY.md docs/notes/
git mv SEED_BACKEND_COMPLETO.md docs/notes/
git mv SEED_COMPLETO.md docs/notes/
git mv SEED_CORRECAO.md docs/notes/

# 3. Mover guias (4 arquivos)
git mv INSTALACAO_PYTHON.md docs/guides/
git mv MANUAL_CURL.md docs/guides/
git mv QUICK_START.md docs/guides/
git mv STARTUP_SCRIPTS.md docs/guides/

# 4. Verificar e atualizar cross-references (se houver)
# TODO: Verificar INDEX.md, PROJECT_SUMMARY.md, README.md

# 5. Commit
git add -A
git commit -m "docs: reorganize documentation into docs/notes and docs/guides"
```

**Impacto**: BAIXO (poucos cross-references entre docs)

---

### **COMMIT 2: Reorganizar Utilitários + Atualizar Referências**

```bash
# 1. Criar estrutura
mkdir -p scripts/utils

# 2. Mover utilitários (7 arquivos)
git mv test_img2img.sh scripts/utils/
git mv test_seed_api.sh scripts/utils/
git mv diagnostico.sh scripts/utils/
git mv check_status.ps1 scripts/utils/
git mv clean_cache.ps1 scripts/utils/
git mv add_img2img.py scripts/utils/
git mv test_python.py scripts/utils/

# 3. Atualizar referências (10 arquivos)
# ✅ CLAUDE.md (6 linhas)
# ✅ docs/guides/STARTUP_SCRIPTS.md (~8 linhas + limpeza)
# ✅ docs/notes/INDEX.md (4 linhas)
# ✅ docs/notes/PROJECT_SUMMARY.md (2 linhas)
# ✅ docs/notes/IMG2IMG_API_DOCS.md (1 linha)
# ✅ docs/notes/API_SEED_DOCS.md (1 linha)
# ✅ scripts/utils/check_status.ps1 (verificar - manter como está)
# ✅ scripts/utils/clean_cache.ps1 (verificar - manter como está)

# 4. Commit
git add -A
git commit -m "refactor: move utility scripts to scripts/utils/ and update references"
```

**Impacto**: MÉDIO (10 arquivos, ~30 linhas)

---

## ✅ Checklist de Validação Pré-Execução

### Antes do Commit 1:
- [ ] Verificar se há cross-references entre docs
- [ ] Verificar se README.md referencia algum doc a ser movido
- [ ] Confirmar lista de 17 arquivos a mover

### Antes do Commit 2:
- [ ] Confirmar lista de 7 utilitários a mover
- [ ] Listar TODAS as referências (feito - 10 arquivos)
- [ ] Testar scripts após mover (chmod +x preservado?)
- [ ] Verificar auto-referências em check_status.ps1 e clean_cache.ps1

### Pós Commits:
- [ ] Testar scripts: `./scripts/utils/test_img2img.sh`
- [ ] Verificar links em CLAUDE.md
- [ ] Executar `git status` para confirmar limpeza
- [ ] Push para remote

---

## 📋 Resumo Final

### Estatísticas
- **Documentos movidos**: 17
- **Scripts movidos**: 7
- **Scripts que permanecem na raiz**: 8
- **Arquivos a atualizar**: 10
- **Linhas a modificar**: ~30

### Benefícios
✅ Raiz limpa (34 → 11 arquivos)
✅ Startup scripts acessíveis na raiz
✅ Documentação organizada
✅ Utilitários agrupados
✅ Zero arquivos apagados

---

## 🎯 Próximos Passos

1. **Revisar este plano** - Confirmar lista de arquivos
2. **Executar Commit 1** - Mover docs (baixo risco)
3. **Executar Commit 2** - Mover utils + atualizar refs (médio risco)
4. **Testar** - Validar scripts e links
5. **Push** - Enviar para remote

**Pronto para executar? Aguardando confirmação.**
