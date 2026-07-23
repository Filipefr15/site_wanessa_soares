(() => {
  const widget = document.querySelector('[data-ai-chat]');
  if (!widget) return;

  const toggleButton = widget.querySelector('[data-ai-chat-toggle]');
  const panel = widget.querySelector('[data-ai-chat-panel]');
  const closeButton = widget.querySelector('[data-ai-chat-close]');
  const messagesEl = widget.querySelector('[data-ai-chat-messages]');
  const form = widget.querySelector('[data-ai-chat-form]');
  const input = widget.querySelector('[data-ai-chat-input]');
  const sendButton = form.querySelector('.ai-chat-send');

  const MIN_THINKING_MS = 1800;
  const WELCOME_MESSAGE =
    'Olá! Sou o assistente virtual da Clínica Wanessa Soares. Posso tirar dúvidas sobre serviços, horários e localização. Como posso ajudar?';

  const history = [];
  let hasOpenedOnce = false;
  let isSending = false;

  const escapeHtml = (text) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // Handles conhecidos da clínica — se o LLM citar um @handle fora deste mapa, fica como texto puro.
  const SOCIAL_HANDLES = {
    '@clinicawanessasoares': 'https://www.instagram.com/clinicawanessasoares/'
  };

  // Ordem de prioridade: link markdown, depois URL crua, depois @handle de rede social.
  const LINKIFY_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s()]+)\)|(https?:\/\/[^\s<>()]+)|(@[a-zA-Z0-9_.]+)/g;

  const linkify = (escapedText) =>
    escapedText.replace(LINKIFY_PATTERN, (fullMatch, mdText, mdUrl, rawUrl, handle) => {
      if (mdUrl) {
        return `<a href="${mdUrl}" target="_blank" rel="noopener noreferrer">${mdText}</a>`;
      }

      if (rawUrl) {
        // A URL já passou pelo escape acima; remove pontuação de borda comum antes de fechar a tag.
        const trailingPunctuation = /[.,;:!?)\]]+$/;
        const match = rawUrl.match(trailingPunctuation);
        const cleanUrl = match ? rawUrl.slice(0, -match[0].length) : rawUrl;
        const suffix = match ? match[0] : '';
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${suffix}`;
      }

      if (handle) {
        // O "." está no conjunto de caracteres do handle, então ponto final de frase (ex: "@handle.")
        // seria capturado junto. Separa esse trecho antes de buscar no mapa e recoloca fora do link.
        const trailingMatch = handle.match(/\.+$/);
        const trailing = trailingMatch ? trailingMatch[0] : '';
        const cleanHandle = trailing ? handle.slice(0, -trailing.length) : handle;
        const url = SOCIAL_HANDLES[cleanHandle.toLowerCase()];
        return url
          ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${cleanHandle}</a>${trailing}`
          : handle;
      }

      return fullMatch;
    });

  const scrollToBottom = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const addUserBubble = (text) => {
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble ai-chat-bubble-user';
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToBottom();
  };

  const addBotBubble = (text) => {
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble ai-chat-bubble-bot';
    bubble.innerHTML = linkify(escapeHtml(text));
    messagesEl.appendChild(bubble);
    scrollToBottom();
  };

  const addTypingBubble = () => {
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble ai-chat-bubble-bot ai-chat-bubble-typing';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(bubble);
    scrollToBottom();
    return bubble;
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const openPanel = () => {
    panel.hidden = false;
    widget.dataset.open = 'true';
    toggleButton.setAttribute('aria-expanded', 'true');
    if (!hasOpenedOnce) {
      hasOpenedOnce = true;
      addBotBubble(WELCOME_MESSAGE);
    }
    window.requestAnimationFrame(() => input.focus());
  };

  const closePanel = ({ returnFocus = false } = {}) => {
    panel.hidden = true;
    widget.dataset.open = 'false';
    toggleButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggleButton.focus();
  };

  toggleButton.addEventListener('click', () => {
    const isOpen = !panel.hidden;
    if (isOpen) {
      closePanel({ returnFocus: true });
    } else {
      openPanel();
    }
  });

  closeButton.addEventListener('click', () => closePanel({ returnFocus: true }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      closePanel({ returnFocus: true });
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });

  async function sendMessage(message) {
    const typingBubble = addTypingBubble();
    const startedAt = Date.now();

    let replyText;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      const data = await response.json().catch(() => ({}));
      replyText =
        data && typeof data.reply === 'string'
          ? data.reply
          : data && typeof data.error === 'string'
          ? data.error
          : 'No momento não consigo responder por aqui. Fale com a nossa equipe pelo WhatsApp (66) 99682-7697.';
    } catch (_networkError) {
      replyText =
        'Não consegui me conectar agora. Fale com a nossa equipe pelo WhatsApp (66) 99682-7697 para continuar o atendimento.';
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_THINKING_MS) {
      await wait(MIN_THINKING_MS - elapsed);
    }

    typingBubble.remove();
    addBotBubble(replyText);
    history.push({ role: 'model', text: replyText });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSending) return;

    const message = input.value.trim();
    if (!message) return;

    isSending = true;
    sendButton.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    addUserBubble(message);
    history.push({ role: 'user', text: message });

    await sendMessage(message);

    isSending = false;
    sendButton.disabled = false;
    input.focus();
  });
})();
