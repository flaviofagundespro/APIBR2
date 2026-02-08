# Lista Completa de Referências a Atualizar

**Data**: 2026-02-08
**Contexto**: Movendo scripts da raiz para `scripts/startup/` e `scripts/utils/`

---

## 📊 Resumo Executivo

- **Total de arquivos a atualizar**: 15 arquivos
- **Total de linhas a modificar**: ~62 linhas
- **Scripts movidos**: 12 scripts
- **Categorias**: Documentação (11 arquivos) + Scripts (4 arquivos)

---

## 🔧 Scripts que Serão Movidos

### Startup Scripts → `scripts/startup/`
1. `start_all.sh` → `scripts/startup/start_all.sh`
2. `start_system.sh` → `scripts/startup/start_system.sh`
3. `stop_apibr2.sh` → `scripts/startup/stop_apibr2.sh`
4. `start_all.ps1` → `scripts/startup/start_all.ps1`
5. `start_apibr2.ps1` → `scripts/startup/start_apibr2.ps1`
6. `start_frontend.ps1` → `scripts/startup/start_frontend.ps1`
7. `start_instagram.ps1` → `scripts/startup/start_instagram.ps1`
8. `stop_apibr2.ps1` → `scripts/startup/stop_apibr2.ps1`

### Utility Scripts → `scripts/utils/`
9. `test_img2img.sh` → `scripts/utils/test_img2img.sh`
10. `test_seed_api.sh` → `scripts/utils/test_seed_api.sh`
11. `diagnostico.sh` → `scripts/utils/diagnostico.sh`
12. `check_status.ps1` → `scripts/utils/check_status.ps1`
13. `clean_cache.ps1` → `scripts/utils/clean_cache.ps1`

---

## 📄 ARQUIVOS A ATUALIZAR (por prioridade)

### 🔴 PRIORIDADE CRÍTICA

#### 1. **CLAUDE.md** (9 referências)
**Impacto**: CRÍTICO - Documento principal para Claude Code

**Linhas a atualizar**:
```
Linha 53: ./start_all.sh       → ./scripts/startup/start_all.sh
Linha 54: ./start_system.sh    → ./scripts/startup/start_system.sh
Linha 55: ./stop_apibr2.sh     → ./scripts/startup/stop_apibr2.sh
Linha 58: .\start_all.ps1      → .\scripts\startup\start_all.ps1
Linha 59: .\start_apibr2.ps1   → .\scripts\startup\start_apibr2.ps1
Linha 60: .\start_frontend.ps1 → .\scripts\startup\start_frontend.ps1
Linha 61: .\start_instagram.ps1 → .\scripts\startup\start_instagram.ps1
Linha 62: .\stop_apibr2.ps1    → .\scripts\startup\stop_apibr2.ps1
Linha 65: ./test_img2img.sh    → ./scripts/utils/test_img2img.sh
Linha 66: ./test_seed_api.sh   → ./scripts/utils/test_seed_api.sh
Linha 67: ./diagnostico.sh     → ./scripts/utils/diagnostico.sh
Linha 205: ./test_img2img.sh   → ./scripts/utils/test_img2img.sh (duplicado)
Linha 206: ./test_seed_api.sh  → ./scripts/utils/test_seed_api.sh (duplicado)
Linha 207: ./diagnostico.sh    → ./scripts/utils/diagnostico.sh (duplicado)
```

---

#### 2. **docs/guides/STARTUP_SCRIPTS.md** (~20 referências)
**Impacto**: ALTO - Documentação dos scripts de startup

**Linhas a atualizar**:
```
Linha 8:   ./start_apibr2.ps1     → ./scripts/startup/start_apibr2.ps1
Linha 11:  ./start_apibr2.sh      → ./scripts/startup/start_apibr2.sh
Linha 53:  start_apibr2.bat       → (menciona arquivo que não existe)
Linha 103: start_apibr2.ps1       → scripts/startup/start_apibr2.ps1
Linha 151: start_apibr2.sh        → scripts/startup/start_apibr2.sh
Linha 207: ./clean_cache.bat      → (menciona arquivo que não existe)
Linha 210: ./clean_cache.ps1      → ./scripts/utils/clean_cache.ps1
Linha 213: ./clean_cache.sh       → (menciona arquivo que não existe)
Linha 231: ./check_status.bat     → (menciona arquivo que não existe)
Linha 234: ./check_status.ps1     → ./scripts/utils/check_status.ps1
Linha 237: ./check_status.sh      → (menciona arquivo que não existe)
Linha 242: check_status.ps1       → scripts/utils/check_status.ps1 (título de seção)
Linha 267: ./start_apibr2.ps1     → ./scripts/startup/start_apibr2.ps1
Linha 270: clean_cache.ps1        → scripts/utils/clean_cache.ps1 (título de seção)
Linha 298: ./start_apibr2.ps1     → ./scripts/startup/start_apibr2.ps1
Linha 304: ./start_apibr2.ps1     → ./scripts/startup/start_apibr2.ps1
Linha 314: ./check_status.ps1     → ./scripts/utils/check_status.ps1
Linha 317: ./clean_cache.ps1      → ./scripts/utils/clean_cache.ps1
```

---

#### 3. **README.md** (1 referência)
**Impacto**: ALTO - Documento principal do repositório

**Linhas a atualizar**:
```
Linha 187: start_apibr2.ps1, start_frontend.ps1, and start_instagram.ps1
           → scripts/startup/start_apibr2.ps1, scripts/startup/start_frontend.ps1,
              and scripts/startup/start_instagram.ps1
```

---

### 🟡 PRIORIDADE ALTA

#### 4. **docs/notes/INDEX.md** (6 referências)
**Impacto**: MÉDIO - Índice de navegação

**Linhas a atualizar**:
```
Linha 23:  🚀 start_apibr2.ps1   → scripts/startup/start_apibr2.ps1
Linha 24:  🔍 check_status.ps1   → scripts/utils/check_status.ps1
Linha 25:  🧹 clean_cache.ps1    → scripts/utils/clean_cache.ps1
Linha 108: ./start_apibr2.ps1    → ./scripts/startup/start_apibr2.ps1
Linha 114: ./start_apibr2.ps1    → ./scripts/startup/start_apibr2.ps1
Linha 117: ./check_status.ps1    → ./scripts/utils/check_status.ps1
Linha 120: ./clean_cache.ps1     → ./scripts/utils/clean_cache.ps1
```

---

#### 5. **docs/notes/PROJECT_SUMMARY.md** (5 referências)
**Impacto**: MÉDIO - Sumário do projeto

**Linhas a atualizar**:
```
Linha 19:  start_apibr2.ps1      → scripts/startup/start_apibr2.ps1
Linha 20:  stop_apibr2.ps1       → scripts/startup/stop_apibr2.ps1
Linha 21:  check_status.ps1      → scripts/utils/check_status.ps1
Linha 72:  ./start_apibr2.ps1    → ./scripts/startup/start_apibr2.ps1
Linha 78:  ./check_status.ps1    → ./scripts/utils/check_status.ps1
Linha 81:  ./stop_apibr2.ps1     → ./scripts/startup/stop_apibr2.ps1
```

---

#### 6. **docs/notes/CURRENT_STATUS.md** (3 referências)
**Impacto**: MÉDIO - Status atual do projeto

**Linhas a atualizar**:
```
Linha 33:  stop_apibr2.ps1       → scripts/startup/stop_apibr2.ps1
Linha 109: ./start_apibr2.ps1    → ./scripts/startup/start_apibr2.ps1
Linha 115: cd integrations; ./test_ultra.ps1 → (nota: test_ultra.ps1 está em integrations, não mover)
```

---

#### 7. **docs/notes/AI_CONTEXT.md** (3 referências)
**Impacto**: MÉDIO - Contexto para IA

**Linhas a atualizar**:
```
Linha 69:  ./start_all.sh        → ./scripts/startup/start_all.sh
Linha 86:  start_all.sh          → scripts/startup/start_all.sh
```

---

### 🟢 PRIORIDADE MÉDIA

#### 8. **docs/guides/MANUAL_CURL.md** (1 referência)
**Impacto**: BAIXO - Exemplos de curl

**Linhas a atualizar**:
```
Linha 12:  ./start_instagram.ps1 → ./scripts/startup/start_instagram.ps1
```

---

#### 9. **docs/notes/IMG2IMG_API_DOCS.md** (1 referência)
**Impacto**: BAIXO - Documentação de API

**Linhas a atualizar**:
```
Linha 187: ./test_img2img.sh     → ./scripts/utils/test_img2img.sh
```

---

#### 10. **docs/notes/API_SEED_DOCS.md** (1 referência)
**Impacto**: BAIXO - Documentação de API

**Linhas a atualizar**:
```
Linha 218: ./test_seed_api.sh    → ./scripts/utils/test_seed_api.sh
```

---

#### 11. **docs/notes/FEBRUARY_2026_UPDATE.md** (2 referências)
**Impacto**: BAIXO - Update de fevereiro

**Linhas a atualizar**:
```
Linha 28:  start_all.sh          → scripts/startup/start_all.sh
Linha 40:  ./start_all.sh        → ./scripts/startup/start_all.sh
```

---

#### 12. **docs/notes/LIMPEZA_COMPLETA.md** (1 referência)
**Impacto**: BAIXO - Notas de limpeza

**Linhas a atualizar**:
```
Linha 63:  ./start_all.sh        → ./scripts/startup/start_all.sh
```

---

### 🔵 AUTO-REFERÊNCIAS (Scripts referenciando scripts)

#### 13. **scripts/utils/check_status.ps1** (2 referências internas)
**Impacto**: MÉDIO - Script referencia outros scripts

**Linhas a atualizar**:
```
Linha 28:  ./start_apibr2.ps1    → ../startup/start_apibr2.ps1
Linha 31:  cd integrations && ./test_ultra.ps1 → (test_ultra.ps1 permanece em integrations)
```

---

#### 14. **scripts/utils/clean_cache.ps1** (1 referência interna)
**Impacto**: MÉDIO - Script referencia outro script

**Linhas a atualizar**:
```
Linha 42:  ./start_apibr2.ps1    → ../startup/start_apibr2.ps1
```

---

#### 15. **scripts/startup/start_system.sh** (0 referências externas)
**Impacto**: BAIXO - Usa caminhos relativos internos (.venv/bin/python)

**Linhas verificadas**: Nenhuma atualização necessária (usa caminhos relativos a integrations/)

---

## 🚫 ARQUIVOS QUE NÃO PRECISAM ATUALIZAÇÃO

### Arquivos em _legacy/flux/
- `FLUX_4STEPS_PROTECTION.md` (linha 60)
- `FLUX_SCHEDULER_FIX.md` (linha 50)
- `FLUX_CORRECAO.md` (linha 52)
- `FLUX_CORRECAO_FINAL.md` (linha 33)

**Motivo**: Arquivos arquivados em `_legacy/`, baixa prioridade de atualização

---

### Arquivos em integrations/
- `integrations/fix_huggingface.ps1` (linha 92)
- `integrations/install_amd_gpu.ps1` (linha 89)

**Motivo**: Scripts em integrations/ referenciam scripts da raiz, mas:
1. São scripts de instalação (raramente usados)
2. Podem ser atualizados em commit separado de manutenção

---

## 📋 Checklist de Atualização

### Commit 2: Scripts + Referências

```bash
# 1. Mover scripts
git mv start_all.sh scripts/startup/
git mv start_system.sh scripts/startup/
git mv stop_apibr2.sh scripts/startup/
git mv start_all.ps1 scripts/startup/
git mv start_apibr2.ps1 scripts/startup/
git mv start_frontend.ps1 scripts/startup/
git mv start_instagram.ps1 scripts/startup/
git mv stop_apibr2.ps1 scripts/startup/
git mv test_img2img.sh scripts/utils/
git mv test_seed_api.sh scripts/utils/
git mv diagnostico.sh scripts/utils/
git mv check_status.ps1 scripts/utils/
git mv clean_cache.ps1 scripts/utils/

# 2. Atualizar referências (15 arquivos)
# ✅ CLAUDE.md (14 linhas)
# ✅ docs/guides/STARTUP_SCRIPTS.md (~18 linhas)
# ✅ README.md (1 linha)
# ✅ docs/notes/INDEX.md (7 linhas)
# ✅ docs/notes/PROJECT_SUMMARY.md (6 linhas)
# ✅ docs/notes/CURRENT_STATUS.md (3 linhas)
# ✅ docs/notes/AI_CONTEXT.md (2 linhas)
# ✅ docs/guides/MANUAL_CURL.md (1 linha)
# ✅ docs/notes/IMG2IMG_API_DOCS.md (1 linha)
# ✅ docs/notes/API_SEED_DOCS.md (1 linha)
# ✅ docs/notes/FEBRUARY_2026_UPDATE.md (2 linhas)
# ✅ docs/notes/LIMPEZA_COMPLETA.md (1 linha)
# ✅ scripts/utils/check_status.ps1 (1 linha)
# ✅ scripts/utils/clean_cache.ps1 (1 linha)

# 3. Testar scripts
./scripts/startup/start_all.sh --help
./scripts/utils/test_img2img.sh --help
./scripts/utils/check_status.ps1

# 4. Commit
git add -A
git commit -m "refactor: move scripts to scripts/ directory and update all references"
```

---

## 🎯 Estratégia de Atualização

### Padrões de Substituição

**Linux/macOS (bash)**:
```
./start_all.sh      → ./scripts/startup/start_all.sh
./test_img2img.sh   → ./scripts/utils/test_img2img.sh
```

**Windows (PowerShell)**:
```
.\start_all.ps1     → .\scripts\startup\start_all.ps1
.\check_status.ps1  → .\scripts\utils\check_status.ps1
```

**Auto-referências (scripts chamando scripts)**:
```
De: scripts/utils/check_status.ps1
./start_apibr2.ps1  → ../startup/start_apibr2.ps1
```

---

## ⚠️ Notas Importantes

1. **STARTUP_SCRIPTS.md**: Contém referências a arquivos .bat e .sh que não existem (clean_cache.bat, check_status.sh, etc.). Decisão: manter como documentação histórica ou remover?

2. **integrations/**: Scripts em `integrations/` (fix_huggingface.ps1, install_amd_gpu.ps1) referenciam scripts da raiz. Atualizar em commit separado.

3. **_legacy/flux/**: Arquivos arquivados referenciam start_all.sh. Decisão: atualizar ou deixar como histórico?

4. **Caminhos relativos**: Scripts movidos para `scripts/utils/` que referenciam `scripts/startup/` precisam usar `../startup/`

---

## 📊 Estatísticas Finais

- **Total de arquivos a atualizar**: 15 arquivos
- **Total estimado de linhas**: ~62 linhas
- **Tempo estimado**: 15-20 minutos
- **Risco**: MÉDIO (muitas referências, mas simples substituição de strings)
- **Prioridade crítica**: 3 arquivos (CLAUDE.md, STARTUP_SCRIPTS.md, README.md)
