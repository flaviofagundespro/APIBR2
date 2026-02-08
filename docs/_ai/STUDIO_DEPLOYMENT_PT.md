# Guia de Deploy e Configuração do Estúdio de Produção de Mídia com IA

Este guia detalha o processo de deploy e configuração dos componentes do Estúdio de Produção de Mídia com IA, incluindo a API (APIBR), a interface web (React) e os serviços de suporte (Redis, PostgreSQL, Celery).

## 1. Pré-requisitos

Certifique-se de ter os seguintes softwares instalados em seu ambiente de deploy:

- Docker e Docker Compose (versão 1.29.2 ou superior)
- Node.js (versão 18 ou superior) e npm/pnpm
- Python 3.x e pip

## 2. Deploy da API (APIBR)

A APIBR é uma aplicação Node.js que utiliza Docker para orquestrar seus serviços de suporte (Redis para Celery e PostgreSQL para Supabase).

### 2.1. Configuração do Ambiente

1. **Clone o Repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO_APIBR>
   cd APIBR
   ```

2. **Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto APIBR com as seguintes variáveis:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   N8N_WEBHOOK_URL=your_n8n_webhook_url
   REDIS_HOST=redis
   REDIS_PORT=6379
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   POSTGRES_USER=your_pg_user
   POSTGRES_PASSWORD=your_pg_password
   POSTGRES_DB=your_pg_db
   ```
   - `SUPABASE_URL` e `SUPABASE_KEY`: Credenciais do seu projeto Supabase para persistência de dados.
   - `N8N_WEBHOOK_URL`: URL do webhook do N8n para acionar workflows de automação.
   - `REDIS_HOST`, `REDIS_PORT`: Configurações para o serviço Redis (usado pelo Celery).
   - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Configurações para o serviço PostgreSQL (usado pelo Supabase).

### 2.2. Execução com Docker Compose

Navegue até o diretório raiz do projeto APIBR e execute:

```bash
/usr/local/bin/docker-compose up -d --build
```

Este comando irá:
- Construir a imagem Docker da APIBR.
- Iniciar os contêineres para Redis, PostgreSQL e a própria APIBR.
- O `--build` garante que a imagem da APIBR seja reconstruída com as últimas alterações.

Verifique o status dos serviços:

```bash
/usr/local/bin/docker-compose ps
```

## 3. Deploy da Interface Web (React)

A interface web é uma aplicação React que se comunica com a APIBR.

### 3.1. Configuração do Ambiente

1. **Clone o Repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO_WEB_INTERFACE>
   cd web-interface
   ```

2. **Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto da interface web com as seguintes variáveis:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
   - `VITE_API_BASE_URL`: A URL base da sua APIBR. Se a APIBR estiver rodando localmente, use `http://localhost:3000/api/v1`. Se estiver em um servidor remoto, use a URL pública do servidor.

### 3.2. Instalação e Build

Navegue até o diretório raiz do projeto da interface web e execute:

```bash
pnpm install
pnpm run build
```

Este comando irá instalar as dependências e construir a aplicação React para produção. Os arquivos estáticos serão gerados no diretório `dist/`.

### 3.3. Servindo a Aplicação

Você pode servir os arquivos estáticos gerados de diversas maneiras, como com um servidor Nginx, Apache, ou um serviço de hospedagem de sites estáticos. Exemplo com `serve` (instale com `npm install -g serve`):

```bash
serve -s dist -l 5173
```

## 4. Configuração do Celery Worker

O Celery é usado para processamento assíncrono das tarefas de IA. Ele se conecta ao Redis como broker.

1. **Instalar Dependências Python:**
   No ambiente onde o worker Celery será executado, instale as dependências Python:
   ```bash
   pip install -r requirements.txt
   ```
   (Você precisará criar um `requirements.txt` com `celery`, `redis`, `supabase` e as bibliotecas dos modelos de IA como `transformers`, `torch`, etc.)

2. **Executar o Worker Celery:**
   Navegue até o diretório `APIBR/workers` e execute:
   ```bash
   celery -A celery_app worker --loglevel=info
   ```
   Certifique-se de que o Redis esteja acessível a partir do ambiente onde o worker está rodando.

## 5. Configuração do N8n

Para a integração com N8n, você precisará ter uma instância do N8n rodando (localmente ou em um servidor).

1. **Criar Workflow:** No N8n, crie um novo workflow.
2. **Adicionar Webhook:** Adicione um nó "Webhook" ao seu workflow. Configure-o para o método `POST`.
3. **Copiar URL do Webhook:** Copie a URL gerada pelo nó Webhook. Esta URL será usada na variável de ambiente `N8N_WEBHOOK_URL` da APIBR.
4. **Processar Dados:** Configure os nós subsequentes no N8n para processar os dados recebidos do Estúdio de Produção de Mídia (ex: enviar para um serviço de armazenamento, notificar usuários, etc.).

## 6. Considerações de Produção

- **HTTPS:** Para ambientes de produção, é altamente recomendável configurar HTTPS para a APIBR e a interface web.
- **Escalabilidade:** Para alta disponibilidade e escalabilidade, considere usar um orquestrador de contêineres como Kubernetes.
- **Monitoramento:** Implemente ferramentas de monitoramento para acompanhar a saúde e o desempenho da API, da interface web e dos workers Celery.
- **Segurança:** Garanta que todas as credenciais e chaves de API sejam armazenadas de forma segura (ex: usando um gerenciador de segredos).


