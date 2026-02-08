# Guia de Uso do Estúdio de Produção de Mídia com IA

Este guia detalha como utilizar a interface web do Estúdio de Produção de Mídia com IA para gerar e gerenciar conteúdo de áudio, imagem e vídeo.

## 1. Visão Geral da Interface

Ao acessar a aplicação, você será direcionado para a página inicial, que oferece links para os diferentes estúdios e para a seção de projetos:

- **Estúdio de Áudio:** Para clonagem e geração de voz.
- **Estúdio de Imagem:** Para geração, edição e upscale de imagens.
- **Estúdio de Vídeo:** Para criação de avatares e animação de vídeos.
- **Meus Projetos:** Para visualizar o histórico de suas gerações e gerenciar seus projetos.

## 2. Estúdio de Áudio

Nesta seção, você poderá:

- **Clonar Voz:** Faça o upload de um arquivo de áudio (ex: `.mp3`, `.wav`) para clonar uma voz existente. Você precisará dar um nome à voz clonada para identificação futura.
- **Gerar Fala:** Insira um texto e selecione uma das vozes disponíveis (incluindo as que você clonou) para gerar um arquivo de áudio com a fala do texto.

## 3. Estúdio de Imagem

Nesta seção, você poderá:

- **Gerar Imagem:** Forneça um prompt de texto descrevendo a imagem desejada. Você poderá escolher entre diferentes modelos de IA (ex: Flux, Stable Diffusion 3.5) para a geração.
- **Editar Imagem:** Faça o upload de uma imagem existente ou selecione uma de seus projetos e forneça um prompt de texto para descrever as edições desejadas (ex: 


"mudar a cor do carro para azul", "adicionar um chapéu no personagem").
- **Aumentar Resolução (Upscale):** Selecione uma imagem e utilize esta funcionalidade para aumentar sua qualidade e resolução.

## 4. Estúdio de Vídeo

Nesta seção, você poderá:

- **Criar Avatar:** Faça o upload de uma imagem (rosto) e forneça um script de texto. A IA irá gerar um vídeo de um avatar falando o script com base na imagem fornecida.
- **Animar Vídeo:** Faça o upload de um vídeo existente e aplique parâmetros de animação para criar efeitos ou movimentos específicos.
- **Status do Vídeo:** Acompanhe o progresso de suas gerações de vídeo, que podem levar mais tempo para serem processadas.

## 5. Meus Projetos

Esta seção permite que você:

- **Visualizar Histórico:** Acesse um histórico de todas as suas gerações de mídia (áudio, imagem, vídeo).
- **Gerenciar Projetos:** Organize suas criações em projetos, facilitando a localização e o acesso a conteúdos relacionados.
- **Exportar Conteúdo:** Baixe seus arquivos de mídia gerados para uso externo.

## 6. Integração com N8n

O estúdio de produção de mídia está integrado com N8n para automação de fluxos de trabalho. Isso significa que você pode configurar seus próprios workflows no N8n para serem acionados automaticamente após a geração de conteúdo, permitindo, por exemplo, o envio automático para plataformas de mídia social, armazenamento em nuvem, ou qualquer outra ação que você deseje automatizar.

Para configurar a integração com N8n, você precisará:

1. **Obter a URL do Webhook:** No N8n, crie um novo workflow e adicione um nó "Webhook". Copie a URL gerada.
2. **Configurar no Estúdio:** No Estúdio de Produção de Mídia, na seção de configurações (a ser implementada na interface), você poderá colar a URL do Webhook do N8n. Isso permitirá que o estúdio envie os dados da geração de mídia para o seu workflow N8n.

Com esta integração, você pode personalizar e automatizar completamente o pós-processamento de suas criações de mídia.

