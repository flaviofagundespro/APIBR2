# Plano de Reorganização do Repositório APIBR2

**Data**: 2026-02-08
**Objetivo**: Limpar raiz do repositório movendo documentação e scripts para diretórios apropriados

---

## 📊 Análise da Situação Atual

### Raiz do Repositório (34 arquivos)
```
Total: 34 arquivos (22 .md + 8 .sh + 4 .ps1)
- Arquivos principais (manter): 3
- Documentação (mover): 19
- Scripts (mover): 12
```

### Estrutura Atual vs. Proposta
```
Antes:                          Depois:
├── README.md                   ├── README.md
├── CLAUDE.md                   ├── CLAUDE.md
├── CHANGELOG.md                ├── CHANGELOG.md
├── 19 outros .md ❌           ├── docs/
├── 12 scripts ❌               │   ├── FLUX.md (já existe)
├── docs/ (9 arquivos)          │   ├── notes/ (novos 13 arquivos)
├── _legacy/                    │   └── guides/ (novos 6 arquivos)
└── ...                         ├── scripts/ (novo - 12 arquivos)
                                ├── _legacy/
                                └── ...
```

---

## 📁 CATEGORIA 1: Documentação (19 arquivos)

### Subcategoria A: Notas Técnicas/Status (13 arquivos) → `docs/notes/`
Documentos de troubleshooting, notas de desenvolvimento, status de features:

1. **AI_CONTEXT.md** - Contexto para IA
2. **CURRENT_STATUS.md** - Status atual do projeto
3. **FEBRUARY_2026_UPDATE.md** - Update de migração Linux/ROCm
4. **LIMPEZA_COMPLETA.md** - Notas de limpeza
5. **PROJECT_SUMMARY.md** - Sumário do projeto (duplica README?)
6. **SEED_BACKEND_COMPLETO.md** - Implementação seed
7. **SEED_COMPLETO.md** - Documentação seed
8. **SEED_CORRECAO.md** - Correções seed
9. **IMG2IMG_PLANO.md** - Plano de implementação img2img
10. **IMG2IMG_GUIA.md** - Guia img2img
11. **API_SEED_DOCS.md** - Docs da API seed
12. **IMG2IMG_API_DOCS.md** - Docs da API img2img
13. **INDEX.md** - Índice de documentos (redundante?)

### Subcategoria B: Guias de Usuário (6 arquivos) → `docs/guides/`
Guias práticos, tutoriais, manuais:

1. **QUICK_START.md** - Guia rápido de início
2. **INSTALACAO_PYTHON.md** - Guia de instalação Python
3. **MANUAL_CURL.md** - Exemplos de uso com curl
4. **STARTUP_SCRIPTS.md** - Documentação dos scripts de startup

**MANTER NA RAIZ** (já referenciados em muitos lugares):
- ~~README.md~~ ✅
- ~~CLAUDE.md~~ ✅
- ~~CHANGELOG.md~~ ✅

---

## 🔧 CATEGORIA 2: Scripts (12 arquivos)

### Subcategoria A: Scripts de Startup (8 arquivos) → `scripts/startup/`
**⚠️ ALTA PRIORIDADE - Muitas referências em docs**

**Linux/macOS (.sh - 4 arquivos)**:
1. **start_all.sh** - Inicia todos os serviços
2. **start_system.sh** - Startup alternativo
3. **stop_apibr2.sh** - Para os serviços

**Windows (.ps1 - 4 arquivos)**:
4. **start_all.ps1** - Inicia todos (Windows)
5. **start_apibr2.ps1** - Backend only
6. **start_frontend.ps1** - Frontend only
7. **start_instagram.ps1** - Video downloader only
8. **stop_apibr2.ps1** - Para serviços (Windows)

### Subcategoria B: Scripts Utilitários (4 arquivos) → `scripts/utils/`
**⚠️ Médias referências**

**Testes (.sh - 2 arquivos)**:
1. **test_img2img.sh** - Teste de image-to-image
2. **test_seed_api.sh** - Teste de seed API
3. **diagnostico.sh** - Diagnóstico do sistema

**Manutenção (.ps1 - 2 arquivos)**:
4. **check_status.ps1** - Verifica status dos serviços
5. **clean_cache.ps1** - Limpa cache

---

## 🔗 Análise de Referências

### Arquivos com MUITAS referências (requer atualização):
```
Arquivo               Referências em:
start_all.sh          CLAUDE.md, AI_CONTEXT.md, LIMPEZA_COMPLETA.md, FLUX_*
start_apibr2.ps1      INDEX.md, CURRENT_STATUS.md, PROJECT_SUMMARY.md, STARTUP_SCRIPTS.md
test_img2img.sh       CLAUDE.md, IMG2IMG_API_DOCS.md
test_seed_api.sh      CLAUDE.md, API_SEED_DOCS.md
diagnostico.sh        CLAUDE.md
check_status.ps1      INDEX.md, PROJECT_SUMMARY.md, STARTUP_SCRIPTS.md
```

### Documentos que referenciam scripts:
1. **CLAUDE.md** ⚠️ CRÍTICO - Referencia 6 scripts
2. **INDEX.md** - Referencia 4 scripts
3. **PROJECT_SUMMARY.md** - Referencia 3 scripts
4. **STARTUP_SCRIPTS.md** - Referencia todos os scripts de startup
5. **API_SEED_DOCS.md** - Referencia test_seed_api.sh
6. **IMG2IMG_API_DOCS.md** - Referencia test_img2img.sh
7. **QUICK_START.md** - Referencia test_ultra.ps1 (integrations)
8. **AI_CONTEXT.md** - Referencia start_all.sh

---

## 📋 PLANO DE EXECUÇÃO (2 Commits)

### ✅ Commit 1: Reorganizar Documentação
**Foco**: Mover documentos, sem impacto em scripts

```bash
# Criar estrutura
mkdir -p docs/notes docs/guides

# Mover notas técnicas (13 arquivos)
git mv AI_CONTEXT.md docs/notes/
git mv CURRENT_STATUS.md docs/notes/
git mv FEBRUARY_2026_UPDATE.md docs/notes/
git mv LIMPEZA_COMPLETA.md docs/notes/
git mv PROJECT_SUMMARY.md docs/notes/
git mv SEED_BACKEND_COMPLETO.md docs/notes/
git mv SEED_COMPLETO.md docs/notes/
git mv SEED_CORRECAO.md docs/notes/
git mv IMG2IMG_PLANO.md docs/notes/
git mv IMG2IMG_GUIA.md docs/notes/
git mv API_SEED_DOCS.md docs/notes/
git mv IMG2IMG_API_DOCS.md docs/notes/
git mv INDEX.md docs/notes/

# Mover guias (4 arquivos)
git mv QUICK_START.md docs/guides/
git mv INSTALACAO_PYTHON.md docs/guides/
git mv MANUAL_CURL.md docs/guides/
git mv STARTUP_SCRIPTS.md docs/guides/

# Commit
git commit -m "docs: reorganize documentation into docs/notes and docs/guides"
```

**Impacto**: BAIXO (documentos raramente referenciados entre si)

---

### ✅ Commit 2: Reorganizar Scripts + Atualizar Referências
**Foco**: Mover scripts e atualizar TODAS as referências

```bash
# Criar estrutura
mkdir -p scripts/startup scripts/utils

# Mover scripts de startup (8 arquivos)
git mv start_all.sh scripts/startup/
git mv start_system.sh scripts/startup/
git mv stop_apibr2.sh scripts/startup/
git mv start_all.ps1 scripts/startup/
git mv start_apibr2.ps1 scripts/startup/
git mv start_frontend.ps1 scripts/startup/
git mv start_instagram.ps1 scripts/startup/
git mv stop_apibr2.ps1 scripts/startup/

# Mover scripts utilitários (4 arquivos)
git mv test_img2img.sh scripts/utils/
git mv test_seed_api.sh scripts/utils/
git mv diagnostico.sh scripts/utils/
git mv check_status.ps1 scripts/utils/
git mv clean_cache.ps1 scripts/utils/

# ATUALIZAR REFERÊNCIAS (arquivos a editar):
# 1. CLAUDE.md - 9 referências
# 2. docs/notes/INDEX.md - 4 referências
# 3. docs/notes/PROJECT_SUMMARY.md - 3 referências
# 4. docs/guides/STARTUP_SCRIPTS.md - ~20 referências
# 5. docs/notes/API_SEED_DOCS.md - 1 referência
# 6. docs/notes/IMG2IMG_API_DOCS.md - 1 referência
# 7. docs/notes/AI_CONTEXT.md - 1 referência
# 8. docs/guides/QUICK_START.md - verificar
# 9. docs/guides/MANUAL_CURL.md - verificar
# 10. README.md - verificar se menciona scripts

# Commit
git commit -m "refactor: move scripts to scripts/ directory and update all references"
```

**Impacto**: ALTO - Requer atualização em 8-10 arquivos de documentação

---

## 🎯 Benefícios da Reorganização

### Para Novos Usuários:
✅ Raiz limpa com apenas 3 arquivos principais
✅ Documentação organizada por categoria
✅ Scripts agrupados por função
✅ Estrutura clara e navegável

### Para Desenvolvimento:
✅ Fácil localização de scripts
✅ Separação clara entre docs técnicos e guias
✅ Histórico preservado (git mv mantém history)
✅ Sem arquivos apagados (tudo movido)

### Estrutura Final (Raiz):
```
APIBR2/
├── README.md                   (8KB)
├── CLAUDE.md                   (8KB)
├── CHANGELOG.md                (5KB)
├── backend/
├── frontend/
├── integrations/
├── docs/
│   ├── FLUX.md
│   ├── notes/          (13 arquivos técnicos)
│   ├── guides/         (4 guias práticos)
│   └── [outros 9 existentes]
├── scripts/
│   ├── startup/        (8 scripts de start/stop)
│   └── utils/          (4 scripts de teste/manutenção)
└── _legacy/
    └── flux/
```

---

## ⚠️ Riscos e Mitigações

### Risco 1: Links Quebrados
**Mitigação**: Busca completa por referências antes de cada commit

### Risco 2: Scripts que chamam outros scripts
**Mitigação**: Verificar imports/calls dentro dos scripts

### Risco 3: Referências hardcoded no backend/frontend
**Mitigação**: Grep em backend/frontend por nomes dos scripts

---

## 🔍 Próximos Passos

1. **Aprovação do plano** pelo usuário
2. **Executar Commit 1** (documentação - baixo risco)
3. **Verificação** de links após Commit 1
4. **Executar Commit 2** (scripts - alto impacto)
5. **Testes manuais** dos scripts movidos
6. **Push** para repositório remoto

---

## 📝 Notas Adicionais

- **Não apagar nada**: Apenas mover (git mv)
- **Não mudar código**: Apenas caminhos/links
- **Preservar executabilidade**: Scripts .sh mantêm chmod +x
- **Testar localmente**: Antes de push, testar scripts em nova localização
