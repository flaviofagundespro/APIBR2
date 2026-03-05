import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Upload, CheckCircle, AlertCircle, Square, RotateCcw, FileAudio, Loader, Cpu, Phone } from 'lucide-react';

const API = `http://${window.location.hostname}:3000/api/v1/audio`;

// ─── Reading texts ─────────────────────────────────────────────────────────────
const READING_TEXTS = [
  {
    id: 'epic',
    label: 'Épico',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: 'O horizonte se abriu em chamas quando os guerreiros avançaram pelo desfiladeiro. Nada poderia deter aquela força implacável — nem o vento uivante, nem a chuva torrencial, nem o peso esmagador do tempo. Eles lutavam por algo maior que si mesmos, por uma causa que transcendia qualquer dor ou fadiga. O general ergueu a espada, seus olhos refletindo o brilho dos escudos dourados à sua frente. "Avante!", ordenou, com uma voz que cortou o ar frio da madrugada como um trovão. Cada soldado sentiu aquela palavra ecoar dentro do peito — não como um comando, mas como uma promessa. A terra tremeu sob o peso de milhares de passos sincronizados. As bandeiras se ergueram contra o céu cor de sangue, e o exército avançou como uma maré de ferro e determinação. Cavalos relinchavam. Armaduras tilintavam. E no centro daquele caos magnificente, cada homem e cada mulher carregava no coração a mesma chama — a chama daqueles que sabem que algumas batalhas valem mais do que a própria vida. O inimigo recuou um passo. Apenas um. Mas foi o suficiente para que todos soubessem: a vitória estava próxima.',
    tip: 'Leia com emoção e dramaticidade. Varie o ritmo e a intensidade.',
  },
  {
    id: 'journalistic',
    label: 'Jornalístico / Economia',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: 'De acordo com o relatório divulgado nesta segunda-feira, o índice de inflação recuou 0,3 ponto percentual em março, surpreendendo analistas que esperavam alta. O Banco Central deverá se reunir na próxima semana para revisar as projeções do segundo trimestre. Economistas ouvidos pela reportagem avaliam que a queda reflete, em parte, a desaceleração nos preços de alimentos e energia, setores que pressionaram os índices ao longo do primeiro bimestre. O ministro da Fazenda afirmou em coletiva de imprensa que o governo está monitorando os dados com atenção, mas que não há motivo para alterações na política fiscal no curto prazo. No mercado financeiro, a reação foi positiva: o Ibovespa fechou em alta de 1,7%, e o dólar recuou frente ao real pela segunda sessão consecutiva. Operadores de câmbio apontam que a melhora no cenário inflacionário abre espaço para que o Banco Central adote uma postura mais flexível nas próximas reuniões do Comitê de Política Monetária. Analistas do setor privado revisaram para cima as estimativas de crescimento do Produto Interno Bruto para o ano, com projeções que agora variam entre 2,8% e 3,2%. A próxima divulgação de dados do mercado de trabalho, prevista para quinta-feira, será um indicador-chave para avaliar a sustentabilidade dessa tendência.',
    tip: 'Leia com calma e clareza. Tom neutro e informativo.',
  },
  {
    id: 'casual',
    label: 'Casual / Futebol',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: 'Cara, você viu aquele jogo ontem? Que partida incrível, sério. Fui dormir tarde e ainda assim não me arrependo nem um pouco. Domingo que vem tem mais — estou pensando em levar a galera aqui de casa. Vai ser ótimo. Mas vou te falar uma coisa: aquele gol no segundo tempo? Não acreditei quando aconteceu. O cara pegou a bola de peito, girou e mandou no ângulo sem chance nenhuma pro goleiro. Estádio inteiro foi ao delírio. Eu fiquei de pé gritando por uns três minutos, com minha vizinha batendo na parede do apartamento. Nem liguei. Essas coisas a gente não esquece, entende? Tem jogo que vai além do resultado — fica na memória como uma daquelas histórias que você conta anos depois pro seu filho, pro seu neto. E o técnico, na entrevista depois? Humilde pra caramba, falando que o crédito é todo dos jogadores, que o grupo tá unido. É isso que faz diferença. Quando você tem elenco comprometido, comprometido de verdade, aí as coisas fluem. Semana que vem vai ser dureza, o adversário é forte, mas tô confiante. Vamos ver o que acontece.',
    tip: 'Fale natural, como uma conversa. Relaxado e espontâneo.',
  },
  {
    id: 'weather',
    label: 'Previsão do Tempo',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.3)',
    text: 'Acompanhe agora a previsão do tempo para os próximos dias em todo o território nacional. Segundo o Instituto Nacional de Meteorologia, uma massa de ar frio avança pelo Sul do país a partir desta quarta-feira, derrubando temperaturas em até oito graus em relação à média histórica para o período. Em Porto Alegre, a mínima deve chegar a onze graus na madrugada de quinta para sexta-feira. Há possibilidade de geada nas regiões serranas do Rio Grande do Sul e de Santa Catarina, especialmente em altitudes superiores a oitocentos metros. Moradores dessas áreas devem redobrar atenção com tubulações expostas e plantas sensíveis ao frio. No Sudeste, a situação é diferente: uma frente quente mantém temperaturas acima da média em São Paulo e Rio de Janeiro até o final da semana, com previsão de pancadas de chuva isoladas no período da tarde, mais intensas na faixa litorânea. Já no Centro-Oeste e no Norte do país, o tempo segue estável e quente, com baixa umidade relativa do ar. Autoridades de saúde recomendam ingestão frequente de água e evitar exposição prolongada ao sol entre as dez da manhã e as quatro da tarde. Para o final de semana, a massa de ar frio perde força gradualmente, e as temperaturas devem se normalizar no Sul a partir de sábado. Fique atento às atualizações ao longo do dia.',
    tip: 'Tom formal e claro. Entonação variada conforme as regiões.',
  },
  {
    id: 'tech-ai',
    label: 'Tecnologia e IA',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
    text: 'A inteligência artificial generativa está transformando a maneira como empresas desenvolvem produtos, tomam decisões e se relacionam com seus clientes. Modelos de linguagem de grande escala, como os que alimentam assistentes virtuais e ferramentas de criação de conteúdo, já processam bilhões de consultas por dia em todo o mundo. Especialistas apontam que estamos apenas no início de uma transição que será tão impactante quanto a chegada da internet banda larga nos anos 2000. No mercado de trabalho, o impacto já é perceptível: funções repetitivas e baseadas em processamento de dados estão sendo automatizadas em velocidade crescente, enquanto profissões que exigem criatividade, empatia e raciocínio estratégico ganham ainda mais valor. Pesquisadores alertam, no entanto, que a adoção acelerada de sistemas autônomos exige marcos regulatórios sólidos. A União Europeia aprovou em 2024 o primeiro conjunto abrangente de regras para IA, classificando aplicações por nível de risco e impondo obrigações de transparência a desenvolvedores e operadores. No Brasil, o debate legislativo avança, mas especialistas cobram mais agilidade diante do ritmo de inovação do setor. Paralelamente, o custo de treinamento de modelos de inteligência artificial caiu drasticamente nos últimos dois anos, democratizando o acesso à tecnologia e permitindo que startups menores compitam com gigantes do Vale do Silício. A próxima fronteira, segundo pesquisadores, é o desenvolvimento de sistemas capazes de raciocínio multimodal — que integrem texto, imagem, áudio e dados estruturados de forma coerente.',
    tip: 'Tom técnico mas acessível. Pronuncie siglas com clareza.',
  },
  {
    id: 'datacenters',
    label: 'Datacenters',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.1)',
    border: 'rgba(100, 116, 139, 0.3)',
    text: 'A corrida global por capacidade de processamento está reacendendo um debate que parecia superado: onde e como construir os datacenters do futuro? Com a demanda por infraestrutura de inteligência artificial crescendo em ritmo exponencial, grandes empresas de tecnologia anunciaram investimentos superiores a trezentos bilhões de dólares em novos complexos de servidores ao longo dos próximos cinco anos. O consumo energético é um dos maiores desafios. Um único datacenter de última geração pode consumir energia equivalente à de uma cidade de médio porte. Isso pressiona governos e empresas a buscar soluções mais eficientes: refrigeração por imersão líquida, uso de energia renovável e localização estratégica em regiões com clima frio naturalmente. Países nórdicos como Islândia, Noruega e Finlândia tornaram-se destinos disputados, aproveitando a abundância de energia geotérmica e hidroelétrica e as baixas temperaturas ambientes para reduzir custos operacionais. No Brasil, o potencial é reconhecido internacionalmente: o país possui uma das matrizes energéticas mais limpas do mundo, com predominância de hidroelétricas e expansão acelerada de solar e eólica. Grupos estrangeiros já iniciaram negociações para instalar operações no Nordeste e no Centro-Oeste. A latência, no entanto, ainda é um fator limitante para aplicações que exigem respostas em tempo real. Arquiteturas distribuídas, com pequenos datacenters de borda instalados próximos aos usuários finais, surgem como solução complementar aos grandes centros de dados centralizados.',
    tip: 'Tom técnico e informativo. Leia os números com precisão.',
  },
  {
    id: 'workplace',
    label: 'Diálogo Chefe-Funcionário',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.3)',
    text: 'Bom dia, pode sentar. Obrigado por ter vindo. Eu queria conversar com você sobre o projeto que fechamos semana passada. Olha, quero começar dizendo que fiquei bastante satisfeito com o resultado final. A apresentação para o cliente foi excelente, e o feedback que recebemos foi muito positivo. Mas, ao mesmo tempo, quero ser honesto porque acho que você merece isso: houve alguns momentos no meio do caminho que me preocuparam. Aquela semana em que ficamos dois dias sem atualização nenhuma sobre o cronograma — eu fiquei numa situação complicada perante a diretoria, porque não tinha informações para passar. Entendo que a carga estava alta, que surgiram imprevistos. Mas comunicação, especialmente em momentos de pressão, é fundamental para que eu possa te apoiar da maneira certa. O que eu precisaria para os próximos projetos é um alinhamento mais frequente — não precisa ser longo, pode ser uma mensagem rápida, um status de cinco linhas. Isso já faz uma diferença enorme. Agora, do lado positivo, e há muito a destacar: sua capacidade técnica está evidente, o cliente perguntou especificamente se você vai continuar no projeto de continuidade, o que é um reconhecimento muito significativo. Eu quero te ver crescendo aqui dentro, e para isso preciso que a gente construa juntos essa comunicação mais fluida. O que você acha? Tem alguma coisa do seu lado que dificultou e que eu possa ajudar a resolver?',
    tip: 'Dois tons: firme e construtivo como chefe; receptivo como funcionário.',
  },
  {
    id: 'health',
    label: 'Saúde',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.3)',
    text: 'Pesquisadores da Universidade de São Paulo publicaram esta semana um estudo que reforça a relação entre qualidade do sono e saúde cardiovascular. A pesquisa, conduzida ao longo de quatro anos com mais de oito mil participantes adultos, concluiu que pessoas que dormem regularmente menos de seis horas por noite têm risco 34% maior de desenvolver hipertensão arterial em comparação com quem dorme entre sete e nove horas. Os dados corroboram recomendações já estabelecidas por entidades internacionais de cardiologia, mas trazem um elemento novo: o estudo controlou variáveis como estresse percebido, alimentação e sedentarismo, isolando o efeito do sono como fator independente. "Muitas pessoas ainda tratam o sono como uma variável opcional, algo que pode ser sacrificado em favor da produtividade. O que nosso estudo mostra é que essa lógica tem um custo biológico real e mensurável", afirmou a pesquisadora responsável. Os mecanismos envolvidos incluem a desregulação de hormônios como o cortisol e a leptina, aumento da inflamação sistêmica e comprometimento da regulação da pressão arterial durante o período noturno. Especialistas recomendam estabelecer horários regulares de sono, reduzir a exposição a telas uma hora antes de dormir e manter o quarto em temperatura confortável, entre dezoito e vinte e dois graus. Para quem sofre de insônia crônica, o tratamento de primeira linha recomendado atualmente é a terapia cognitivo-comportamental, mais eficaz a longo prazo do que o uso de medicamentos.',
    tip: 'Tom de notícia científica. Pronuncie termos técnicos com clareza.',
  },
  {
    id: 'technical',
    label: 'Instrucional Técnico',
    color: '#84cc16',
    bg: 'rgba(132, 204, 22, 0.1)',
    border: 'rgba(132, 204, 22, 0.3)',
    text: 'Vamos configurar o ambiente de desenvolvimento passo a passo. Primeiro, certifique-se de que o Node.js versão dezoito ou superior está instalado na sua máquina. Você pode verificar isso abrindo o terminal e digitando: node traço traço version. Se o número exibido for inferior a dezoito, acesse o site oficial do Node.js e instale a versão LTS mais recente. Com o Node.js instalado corretamente, navegue até o diretório do projeto usando o comando cd seguido do caminho da pasta. Em seguida, execute npm install para instalar todas as dependências listadas no arquivo package.json. Esse processo pode levar alguns minutos dependendo da conexão com a internet e da quantidade de pacotes. Quando a instalação concluir sem erros, copie o arquivo de exemplo de configuração de ambiente: cp ponto env ponto example ponto env. Abra o arquivo ponto env com seu editor de texto preferido e preencha as variáveis obrigatórias, como a URL do banco de dados e a chave de API do serviço de autenticação. Nunca versione esse arquivo — ele já deve estar listado no gitignore. Para iniciar o servidor em modo de desenvolvimento, execute npm run dev. O terminal exibirá o endereço local onde a aplicação estará disponível, geralmente localhost na porta três mil. Abra esse endereço no navegador para confirmar que o ambiente está funcionando corretamente. Caso encontre erros, consulte a seção de troubleshooting no README do projeto ou abra uma issue no repositório.',
    tip: 'Leia pausado e articulado. Cada passo deve ser bem separado.',
  },
  {
    id: 'slice-of-life',
    label: 'Conto / Cotidiano',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.1)',
    border: 'rgba(167, 139, 250, 0.3)',
    text: 'A padaria da esquina abre às seis da manhã, mas dona Cida sempre chega às cinco e meia. Ela diz que precisa do silêncio daquele meia hora para colocar os pensamentos no lugar antes do movimento começar. Ligava o forno, colocava água para o café e ficava ali parada por alguns minutos, olhando pela janela para a rua ainda vazia, onde os postes ainda estavam acesos e o cachorro do vizinho latejava preguiçosamente para alguma coisa que só ele enxergava. Era o ritual dela. Tinha dias que o seu Jair, o marido, acordava junto e vinha tomar café sentado no balcão antes dos primeiros clientes chegarem. Não precisavam falar muito — era uma daquelas companias silenciosas que valem mais do que qualquer conversa. Mas naquela manhã de terça-feira, ela estava sozinha. Jair tinha viajado para visitar a irmã em Belo Horizonte. A padaria cheirava do mesmo jeito — fermento, canela, café fresco — mas alguma coisa estava diferente no ar. Talvez fosse o silêncio mais pesado, ou talvez fosse ela mesma, que percebeu, naquele instante, que já fazia vinte e três anos que os dois tinham aberto aquele lugar juntos, com pouco dinheiro, muito medo e uma determinação que ela até hoje não sabe bem de onde veio. A campainha da porta tilintou. Era o primeiro cliente. Ela sorriu, como sempre.',
    tip: 'Tom narrativo e íntimo. Deixe as emoções aparecerem sutilmente.',
  },
  {
    id: 'sports',
    label: 'Esportes',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.3)',
    text: 'E estamos de volta ao estúdio após um primeiro tempo eletrizante. O placar marca dois a um, com gol de falta magistral anotado aos quarenta e dois minutos, praticamente no apagar das luzes da primeira etapa. A partida, que prometia ser equilibrada, ganhou outro ritmo após o cartão amarelo que tirou o volante titular do time visitante — uma ausência que abre espaço para o meio-campo da equipe da casa pressionar com mais liberdade no segundo tempo. Nosso comentarista técnico aponta que o técnico visitante precisará fazer ajustes na saída de bola, que está sendo interceptada com muita facilidade nos últimos quinze minutos. Do lado do time que está ganhando, a questão é manter a intensidade sem se expor demais no contra-ataque. A velocidade dos pontas adversários é um perigo constante, e qualquer vacilo defensivo pode mudar o cenário rapidamente. Nos acréscimos do primeiro tempo, uma confusão entre jogadores dos dois times resultou em mais um amarelo — a situação está esquentando, e o árbitro terá um desafio e tanto para controlar os ânimos nos quarenta e cinco minutos finais. Para os torcedores no estádio e em casa: fique ligado. Esse jogo ainda tem muito a oferecer. A bola rola novamente em instantes.',
    tip: 'Tom animado e ritmado de narrador esportivo. Variedade de volume.',
  },
  {
    id: 'entrepreneurship',
    label: 'Empreendedorismo',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.3)',
    text: 'Construir uma startup do zero é um exercício constante de adaptação. O plano de negócios que você escreveu no primeiro mês raramente é o mesmo que guia a empresa seis meses depois — e isso não é um sinal de fracasso, é um sinal de que você está aprendendo. Os empreendedores mais bem-sucedidos que conheço compartilham uma característica em comum: eles são obcecados pelo problema que estão resolvendo, não pela solução que criaram. Essa distinção parece sutil, mas muda tudo. Quando você se apega à solução, fica difícil pivotar quando o mercado te diz que aquela abordagem não funciona. Quando você se apega ao problema, cada feedback do cliente é uma oportunidade de afinar o produto. Outra lição que aprendi na prática: não tente fazer tudo ao mesmo tempo. O erro clássico de fundadores iniciantes é querer construir todas as funcionalidades antes de lançar. Comece pequeno, meça, itere. O conceito de produto mínimo viável existe justamente para forçar esse foco — o mercado vai te dizer o que é essencial muito mais rápido do que qualquer pesquisa interna. E sobre captação de recursos: investimento não é sinônimo de sucesso. Conheço empresas que captaram milhões e faliram porque não tinham clareza sobre o modelo de negócios. E conheço outras que cresceram de forma consistente e lucrativa sem depender de nenhum investidor externo. O caminho certo depende do tipo de empresa que você quer construir e do mercado em que está inserido.',
    tip: 'Tom motivacional e reflexivo. Pausas naturais entre ideias.',
  },
];

// ─── RecordingCard ─────────────────────────────────────────────────────────────
function RecordingCard({ reading, userId, onUploaded }) {
  const [state, setState] = useState('idle'); // idle | countdown | recording | preview | uploading | done | error
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  useEffect(() => () => cleanup(), [cleanup]);

  const startCountdown = async () => {
    setErrorMsg('');
    setState('countdown');
    setCountdown(3);
    let n = 3;
    timerRef.current = setInterval(() => {
      n--;
      setCountdown(n);
      if (n === 0) {
        clearInterval(timerRef.current);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: mimeType });
        setBlob(recorded);
        setBlobUrl(URL.createObjectURL(recorded));
        setState('preview');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100);
      setState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } catch (e) {
      setErrorMsg('Microfone não disponível: ' + e.message);
      setState('error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const reset = () => {
    cleanup();
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    setState('idle');
    setResult(null);
    setErrorMsg('');
  };

  const upload = async () => {
    if (!blob) return;
    setState('uploading');
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('source', 'manual');
      formData.append('language', 'pt');
      formData.append('audio', blob, `${reading.id}.webm`);
      const resp = await fetch(`${API}/onboarding/upload`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Upload failed');
      const file = data.files?.[0];
      if (file?.error) throw new Error(file.error);
      setResult(file);
      setState('done');
      onUploaded?.(reading.id, file);
    } catch (e) {
      setErrorMsg(e.message);
      setState('error');
    }
  };

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      border: `1px solid ${reading.border}`,
      borderRadius: '12px',
      padding: '1.5rem',
      background: reading.bg,
      marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{
          background: reading.color,
          color: '#000',
          borderRadius: '6px',
          padding: '2px 10px',
          fontWeight: '700',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        }}>{reading.label}</span>
        {state === 'done' && <CheckCircle size={18} color="#10b981" />}
        {state === 'error' && <AlertCircle size={18} color="#ef4444" />}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8' }}>{reading.tip}</span>
      </div>

      {/* Text to read */}
      <p style={{
        fontSize: '1rem',
        lineHeight: '1.7',
        color: '#e2e8f0',
        marginBottom: '1.25rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
      }}>{reading.text}</p>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {state === 'idle' && (
          <button onClick={startCountdown} style={btnStyle(reading.color)}>
            <Mic size={16} /> Gravar
          </button>
        )}

        {state === 'countdown' && (
          <div style={{ ...btnStyle('#64748b'), cursor: 'default', fontSize: '1.25rem', fontWeight: '700' }}>
            {countdown}
          </div>
        )}

        {state === 'recording' && (
          <>
            <span style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
              {fmtTime(elapsed)}
            </span>
            <button onClick={stopRecording} style={btnStyle('#ef4444')}>
              <Square size={14} /> Parar
            </button>
          </>
        )}

        {state === 'preview' && (
          <>
            <audio controls src={blobUrl} style={{ height: '36px', flex: 1, minWidth: '200px' }} />
            <button onClick={upload} style={btnStyle(reading.color)}>
              <Upload size={14} /> Confirmar
            </button>
            <button onClick={reset} style={btnStyle('#475569')}>
              <RotateCcw size={14} /> Regravar
            </button>
          </>
        )}

        {state === 'uploading' && (
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader size={16} className="spin" /> Processando...
          </span>
        )}

        {state === 'done' && (
          <>
            <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
              ✅ {result?.filename} — {result?.duration_seconds}s
            </span>
            <button onClick={reset} style={{ ...btnStyle('#475569'), padding: '4px 10px', fontSize: '0.8rem' }}>
              Regravar
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{errorMsg}</span>
            <button onClick={reset} style={btnStyle('#475569')}><RotateCcw size={14} /> Tentar novamente</button>
          </>
        )}
      </div>

      {/* Transcript preview */}
      {result?.transcript && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>TRANSCRIÇÃO GERADA</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>"{result.transcript}"</span>
        </div>
      )}
    </div>
  );
}

// ─── SpontaneousUpload ─────────────────────────────────────────────────────────
function SpontaneousUpload({ userId }) {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const ACCEPTED = ['.ogg', '.mp3', '.wav', '.m4a', '.flac', '.webm', '.opus'];

  const addFiles = newFiles => {
    const valid = Array.from(newFiles).filter(f =>
      ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  };

  const removeFile = name => setFiles(prev => prev.filter(f => f.name !== name));

  const upload = async () => {
    if (!files.length || !userId.trim()) return;
    setUploading(true);
    setResults([]);
    setProgress({ done: 0, total: files.length });

    const BATCH = 5;
    const allResults = [];
    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH);
      const formData = new FormData();
      formData.append('user_id', userId.trim());
      formData.append('source', 'spontaneous');
      formData.append('language', 'pt');
      batch.forEach(f => formData.append('audio', f, f.name));

      try {
        const resp = await fetch(`${API}/onboarding/upload`, { method: 'POST', body: formData });
        const data = await resp.json();
        if (data.files) allResults.push(...data.files);
      } catch (e) {
        batch.forEach(f => allResults.push({ filename: f.name, error: e.message }));
      }
      setProgress({ done: Math.min(i + BATCH, files.length), total: files.length });
    }

    setResults(allResults);
    setUploading(false);
    setFiles([]);
  };

  const fmtSize = b => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1024 / 1024).toFixed(1)}MB`;

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border: `2px dashed ${dragOver ? '#3b82f6' : '#334155'}`,
          borderRadius: '12px',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
          marginBottom: '1rem',
        }}
      >
        <FileAudio size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
        <p style={{ color: '#94a3b8', margin: 0 }}>
          Arraste arquivos ou <span style={{ color: '#3b82f6' }}>clique para selecionar</span>
        </p>
        <p style={{ color: '#475569', fontSize: '0.8rem', margin: '6px 0 0' }}>
          Aceitos: OGG (WhatsApp), MP3, WAV, M4A, FLAC — até 50 arquivos
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            {files.length} arquivo(s) selecionado(s)
          </p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {files.map(f => (
              <div key={f.name} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
              }}>
                <FileAudio size={14} color="#64748b" />
                <span style={{ color: '#cbd5e1', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{fmtSize(f.size)}</span>
                <button onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>
          <button
            onClick={upload}
            disabled={uploading || !userId.trim()}
            style={{ ...btnStyle('#3b82f6'), marginTop: '0.75rem', opacity: uploading || !userId.trim() ? 0.5 : 1 }}
          >
            {uploading
              ? <><Loader size={14} /> Processando {progress.done}/{progress.total}...</>
              : <><Upload size={14} /> Enviar {files.length} arquivo(s)</>}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div style={{ background: '#1e293b', borderRadius: '4px', height: '6px', marginBottom: '1rem' }}>
          <div style={{
            background: '#3b82f6',
            height: '100%',
            borderRadius: '4px',
            width: `${(progress.done / progress.total) * 100}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            ✅ {results.filter(r => !r.error).length} processados com sucesso
            {results.filter(r => r.error).length > 0 && ` — ⚠️ ${results.filter(r => r.error).length} com erro`}
          </p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {results.map((r, i) => (
              <div key={i} style={{
                padding: '6px 10px',
                background: r.error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${r.error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: r.error ? '#f87171' : '#6ee7b7',
              }}>
                {r.error
                  ? `❌ ${r.filename} — ${r.error}`
                  : `✅ ${r.filename} (${r.duration_seconds}s) — "${r.transcript?.slice(0, 60)}${r.transcript?.length > 60 ? '…' : ''}"`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FineTuningTab ─────────────────────────────────────────────────────────────
function FineTuningTab() {
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState('');

  // Source badge config
  const SOURCE = {
    manual: { label: 'Guiada', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' },
    spontaneous: { label: 'Espontânea', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)' },
  };

  // Load profiles list on mount
  useEffect(() => {
    setLoadingProfiles(true);
    fetch(`${API}/onboarding/profiles`)
      .then(r => r.json())
      .then(data => { if (data.profiles) setProfiles(data.profiles); })
      .catch(() => {})
      .finally(() => setLoadingProfiles(false));
  }, []);

  // Load files when a profile is selected
  useEffect(() => {
    if (!selectedUserId) { setProfileData(null); return; }
    setLoadingProfile(true);
    setProfileData(null);
    setTrainResult(null);
    setTrainError('');
    fetch(`${API}/onboarding/profiles/${selectedUserId}`)
      .then(r => r.json())
      .then(data => setProfileData(data))
      .catch(() => setProfileData(null))
      .finally(() => setLoadingProfile(false));
  }, [selectedUserId]);

  const handleStartTraining = async () => {
    if (!selectedUserId) return;
    setTraining(true);
    setTrainError('');
    setTrainResult(null);
    try {
      const formData = new FormData();
      formData.append('user_id', selectedUserId);
      if (whatsapp.trim()) formData.append('whatsapp', whatsapp.trim());
      const resp = await fetch(`${API}/train/start`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (!resp.ok) { setTrainError(data.message || 'Erro ao iniciar treino.'); return; }
      setTrainResult(data);
    } catch (e) {
      setTrainError('Erro de conexão. Verifique se o serviço de áudio está rodando.');
    } finally {
      setTraining(false);
    }
  };

  const fmtDuration = s => {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
  };

  return (
    <div>
      {/* Profile selector */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
          Selecionar perfil para treinar
        </label>

        {loadingProfiles ? (
          <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <Loader size={14} /> Carregando perfis...
          </div>
        ) : profiles.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
            Nenhum perfil encontrado. Faça o onboarding primeiro nas abas anteriores.
          </div>
        ) : (
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'white', fontSize: '0.95rem',
            }}
          >
            <option value="">— Selecionar perfil —</option>
            {profiles.map(p => (
              <option key={p.user_id} value={p.user_id}>
                {p.user_id} — {p.manual_count} guiada(s) • {p.spontaneous_count} espontânea(s) • {fmtDuration(p.total_duration_seconds)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Profile file list */}
      {selectedUserId && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          {loadingProfile ? (
            <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <Loader size={14} /> Carregando arquivos...
            </div>
          ) : profileData ? (
            <>
              {/* Stats bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ ...badgeStyle(SOURCE.manual.color, SOURCE.manual.bg, SOURCE.manual.border) }}>Guiada</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '600' }}>{profileData.manual_count}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ ...badgeStyle(SOURCE.spontaneous.color, SOURCE.spontaneous.bg, SOURCE.spontaneous.border) }}>Espontânea</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '600' }}>{profileData.spontaneous_count}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 'auto', alignSelf: 'center' }}>
                  {profileData.total_files} arquivo(s) • {fmtDuration(profileData.total_duration_seconds)} total
                </div>
              </div>

              {/* File list */}
              <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {profileData.files.map((f, i) => {
                  const src = SOURCE[f.source] || SOURCE.spontaneous;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 10px',
                      background: f.source === 'manual' ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)',
                      border: `1px solid ${f.source === 'manual' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'}`,
                      borderRadius: '6px',
                    }}>
                      <span style={{ ...badgeStyle(src.color, src.bg, src.border), flexShrink: 0, fontSize: '0.7rem' }}>
                        {src.label}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0, minWidth: '70px' }}>
                        {f.filename}
                      </span>
                      <span style={{ color: '#475569', fontSize: '0.75rem', flexShrink: 0 }}>
                        {f.duration_seconds}s
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.78rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{f.transcript}"
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Data quality hint */}
              {profileData.manual_count === 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', color: '#fde68a', fontSize: '0.82rem' }}>
                  ⚠️ Nenhuma leitura guiada. Recomendamos adicionar as 3 leituras para melhor qualidade do clone.
                </div>
              )}
              {profileData.spontaneous_count === 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#93c5fd', fontSize: '0.82rem' }}>
                  💡 Nenhum áudio espontâneo. Adicionar áudios do WhatsApp melhora a naturalidade da voz.
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>Erro ao carregar arquivos do perfil.</div>
          )}
        </div>
      )}

      {/* WhatsApp + start training */}
      {selectedUserId && profileData && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          {/* WhatsApp field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
              <Phone size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              WhatsApp para notificação (opcional)
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              placeholder="5527999999999 (código do país + DDD + número)"
              style={{
                width: '100%', padding: '0.6rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', fontSize: '0.9rem', boxSizing: 'border-box',
              }}
            />
            <p style={{ color: '#475569', fontSize: '0.75rem', margin: '4px 0 0' }}>
              Quando o treino concluir, você receberá uma mensagem no WhatsApp.
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartTraining}
            disabled={training || !selectedUserId}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: '10px', border: 'none',
              background: training ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white', fontWeight: '700', fontSize: '1rem', cursor: training ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              boxShadow: training ? 'none' : '0 4px 15px rgba(168,85,247,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {training
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
              : <><Cpu size={18} /> Iniciar Fine-tuning — {selectedUserId}</>}
          </button>

          {/* Error */}
          {trainError && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              ⚠️ {trainError}
            </div>
          )}

          {/* Success */}
          {trainResult && (
            <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px' }}>
              <div style={{ color: '#c084fc', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                🚀 Job iniciado — {trainResult.job_id}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
                <div>📁 {trainResult.dataset?.manual_files} guiadas + {trainResult.dataset?.spontaneous_files} espontâneas</div>
                {trainResult.whatsapp && <div>📱 Notificação: {trainResult.whatsapp}</div>}
                <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>{trainResult.note}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VoiceOnboarding (main) ────────────────────────────────────────────────────
export default function VoiceOnboarding() {
  const [userId, setUserId] = useState('');
  const [tab, setTab] = useState('manual'); // 'manual' | 'finetune'
  const [uploaded, setUploaded] = useState({}); // { [textId]: result }
  const [selectedTextId, setSelectedTextId] = useState(READING_TEXTS[0].id);

  const handleUploaded = (id, result) => setUploaded(prev => ({ ...prev, [id]: result }));
  const completedCount = Object.keys(uploaded).length;
  const selectedReading = READING_TEXTS.find(r => r.id === selectedTextId);

  const TABS = [
    { id: 'manual',   label: `Leituras Guiadas${completedCount > 0 ? ` (${completedCount}/12)` : ''}`, color: '#f59e0b' },
    { id: 'finetune', label: 'Fine-tuning',                                                              color: '#a855f7' },
  ];

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem' }}>
          <span className="text-gradient">Onboarding de Voz</span>
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          Construa seu dataset de fine-tuning para clonagem de alta fidelidade
        </p>
      </div>

      {/* User ID input — shown only on collection tabs */}
      {tab !== 'finetune' && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
            ID do falante (ex: miguel, joao, maria)
          </label>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="ex: miguel"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#e2e8f0',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '1rem',
            }}
          />
          {!userId.trim() && (
            <p style={{ color: '#f59e0b', fontSize: '0.8rem', margin: '6px 0 0' }}>
              ⚠️ Defina um ID antes de gravar
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              background: tab === t.id ? t.color : 'rgba(255,255,255,0.06)',
              color: tab === t.id ? (t.id === 'manual' ? '#000' : '#fff') : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab: Manual readings */}
      {tab === 'manual' && (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Grave cada texto em voz alta, com boa qualidade de microfone. Essas leituras fornecem
            diversidade prosódica ao dataset — importante para o GPT-SoVITS capturar seu estilo vocal completo.
          </p>

          {completedCount === 12 && (
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              color: '#6ee7b7',
            }}>
              🎉 Todas as 12 leituras concluídas! O dataset manual está completo. Acesse Fine-tuning para iniciar o treino.
            </div>
          )}

          {/* Text selector dropdown */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
              Selecionar texto ({completedCount}/12 gravados)
            </label>
            <select
              value={selectedTextId}
              onChange={e => setSelectedTextId(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: '0.95rem',
              }}
            >
              {READING_TEXTS.map(r => (
                <option key={r.id} value={r.id}>
                  {uploaded[r.id] ? '✅' : '○'} {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Single RecordingCard — resets when text changes */}
          <RecordingCard
            key={selectedTextId}
            reading={selectedReading}
            userId={userId}
            onUploaded={handleUploaded}
          />

          {/* Progress bar */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Progresso</span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{completedCount} de 12</span>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '4px', height: '6px' }}>
              <div style={{
                background: '#f59e0b',
                height: '100%',
                borderRadius: '4px',
                width: `${(completedCount / 12) * 100}%`,
                transition: 'width 0.4s',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Fine-tuning */}
      {tab === 'finetune' && <FineTuningTab />}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
function btnStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    background: color,
    color: color === '#f59e0b' || color === '#10b981' ? '#000' : '#fff',
    transition: 'opacity 0.2s',
  };
}

function badgeStyle(color, bg, border) {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
    color: color,
    background: bg,
    border: `1px solid ${border}`,
  };
}
