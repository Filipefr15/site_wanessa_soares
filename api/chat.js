// Vercel Serverless Function (Node.js runtime) — POST /api/chat
// Contrato: recebe { message, history } e devolve { reply }.
// A chave de API só existe aqui (env var), nunca no frontend.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_PAIRS = 6;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_OUTPUT_TOKENS = 350;

const FALLBACK_REPLY =
  'No momento não consigo responder por aqui. Fale com a nossa equipe pelo WhatsApp (66) 99682-7697 que te ajudamos rapidinho.';

const SYSTEM_PROMPT = `Você é o assistente virtual da Clínica Wanessa Soares, uma clínica de estética e bem-estar em Jaciara, Mato Grosso.

FATOS INSTITUCIONAIS (use apenas estes dados; nunca invente outros):
- Cidade: Jaciara, Mato Grosso (MT).
- WhatsApp / telefone: (66) 99682-7697 — link direto https://wa.me/5566996827697
- Instagram: @clinicawanessasoares — link direto https://www.instagram.com/clinicawanessasoares/
- Profissional responsável: Dra. Wanessa Soares.
- Horário de funcionamento: segunda a sexta, das 09:00 às 12:00 e das 13:00 às 19:00; sábado, das 08:00 às 12:00; domingo a clínica não abre. Em feriados e datas especiais, oriente a confirmar pelo WhatsApp.
- Serviços em destaque: harmonização facial, toxina botulínica (Botox), Ultraformer III (ultrassom microfocado) e depilação a laser.
- Também oferece, sujeitos a confirmação com a equipe: nutrição, estética, lash design e micropigmentação.
- Todos os procedimentos são definidos após avaliação individual — a clínica não trabalha com preços ou pacotes fechados sem avaliação.

REGRAS DE COMPORTAMENTO (siga sempre, sem exceção):
1. Nunca invente informação variável que você não tem como saber em tempo real: agenda/horários específicos de profissionais, disponibilidade de vagas, preços ou promoções. Para qualquer coisa assim, diga que a equipe confirma pelo WhatsApp (66) 99682-7697 e ofereça o contato.
2. Nunca dê diagnóstico médico, avaliação clínica, indicação de procedimento específico para o caso da pessoa, nem qualquer conselho de saúde. Isso exige avaliação presencial com a equipe. Recuse com gentileza e direcione ao WhatsApp.
3. Nunca peça, armazene ou repita de volta dados sensíveis ou pessoais (CPF, endereço completo, dados de saúde, fotos, etc.). Se o usuário oferecer esse tipo de dado, não o confirme nem o repita; apenas explique que esse tipo de informação deve ser tratado diretamente com a equipe pelo WhatsApp.
4. Se a pergunta fugir do escopo da clínica (assuntos não relacionados a estética, bem-estar ou aos serviços listados), recuse educadamente e redirecione a conversa para o que a clínica oferece.
5. Nunca se apresente como profissional de saúde, médica(o) ou membro da equipe — você é um assistente virtual de atendimento inicial.
6. Respostas sempre curtas: no máximo 3 a 4 frases.
7. Tom de voz: acolhedor, educado, caloroso e elegante, sem ser informal demais — reflete o cuidado e a atenção individual que marcam a clínica. Trate o usuário por "você".
8. Não termine toda resposta com um convite para o WhatsApp — isso cansa e soa repetitivo. Só mencione o contato quando ele for de fato o próximo passo necessário: agendar, confirmar algo que você não sabe (regras 1, 2, 3 ou 4), ou quando a pessoa pedir para falar com alguém. Perguntas simples que você já respondeu com um fato institucional (cidade, horário, quais serviços existem, etc.) não precisam de nenhuma chamada para ação no final.
9. Quando for citar um contato (WhatsApp ou Instagram), use no máximo uma vez por resposta e em um único formato — nunca repita o mesmo contato de duas formas na mesma frase (ex: não escreva o número e o link do WhatsApp juntos, nem o @ e o link do Instagram juntos). Para o Instagram, use o link https://www.instagram.com/clinicawanessasoares/ quando a pessoa perguntar sobre fotos, resultados ou quiser seguir a clínica.
10. Não repita "Clínica Wanessa Soares", "Jaciara" ou "Jaciara (MT)" em toda resposta. Olhe o histórico da conversa: se você já disse o nome da clínica ou a cidade antes, não diga de novo — vá direto ao ponto da pergunta atual. Só cite o nome da clínica ou a cidade quando isso for realmente novo ou necessário para responder (ex.: a pessoa perguntou especificamente onde fica). Em respostas de continuidade (tipo "massa!", "obrigado", perguntas de acompanhamento), responda de forma natural e breve, sem reapresentar a clínica.`;

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];

  const validTurns = rawHistory.filter(
    (turn) =>
      turn &&
      typeof turn === 'object' &&
      (turn.role === 'user' || turn.role === 'model') &&
      typeof turn.text === 'string' &&
      turn.text.trim().length > 0 &&
      turn.text.length <= MAX_MESSAGE_LENGTH
  );

  return validTurns.slice(-MAX_HISTORY_PAIRS * 2);
}

async function callGemini(contents) {
  if (!GEMINI_API_KEY) {
    throw new Error('missing_api_key');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS
        }
      })
    });

    if (!upstreamResponse.ok) {
      throw new Error(`upstream_status_${upstreamResponse.status}`);
    }

    const data = await upstreamResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== 'string') {
      throw new Error('empty_upstream_response');
    }

    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido.' });
    return;
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    sendJson(res, 400, { error: 'Escreva uma mensagem antes de enviar.' });
    return;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    sendJson(res, 400, { error: `Sua mensagem passou do limite de ${MAX_MESSAGE_LENGTH} caracteres.` });
    return;
  }

  const history = sanitizeHistory(body.history);
  const contents = [
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const reply = await callGemini(contents);
    sendJson(res, 200, { reply });
  } catch (error) {
    // Nunca vazar detalhes técnicos ao cliente — apenas log no servidor.
    console.error('chat_api_error', error?.message || error);
    sendJson(res, 200, { reply: FALLBACK_REPLY });
  }
};
