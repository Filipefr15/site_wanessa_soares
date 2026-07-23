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

  const linkify = (escapedText) =>
    escapedText.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
      // A URL já passou pelo escape acima; remove pontuação de borda comum antes de fechar a tag.
      const trailingPunctuation = /[.,;:!?)\]]+$/;
      const match = url.match(trailingPunctuation);
      const cleanUrl = match ? url.slice(0, -match[0].length) : url;
      const suffix = match ? match[0] : '';
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${suffix}`;
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
