CLÍNICA WANESSA SOARES — SITE INSTITUCIONAL

Arquivos principais:
- index.html
- styles.css
- script.js
- chat-widget.js (widget do assistente virtual)
- api/chat.js (backend do assistente virtual, Vercel Serverless Function)
- assets/

## Assistente virtual (chatbot com IA)

O botão flutuante com "IA" abre um chat que responde dúvidas institucionais (serviços,
horários, localização) usando o Gemini via API do Google AI Studio. A chave de API nunca
fica no frontend — o backend em `api/chat.js` é a única parte que a lê, via variável de
ambiente.

Passos manuais (não automatizáveis por aqui):
1. Gere uma chave gratuita em https://aistudio.google.com/apikey.
2. No painel da Vercel do projeto: Settings → Environment Variables → adicione
   `GEMINI_API_KEY` (Production e Preview). Opcionalmente, adicione `GEMINI_MODEL` para
   trocar o modelo padrão (`gemini-3.5-flash-lite`).
3. Para testar localmente, copie `.env.example` para `.env`, preencha `GEMINI_API_KEY` e
   rode `vercel dev` (requer `npm i -g vercel` e `vercel login`) — ele sobe o site estático
   e a function em `/api/chat` juntos em `http://localhost:3000`.

Para trocar o negócio de contexto ou os limites de escopo da IA, edite apenas o
`SYSTEM_PROMPT` em `api/chat.js` — é o único lugar que concentra fatos institucionais e
regras de recusa.

Atualizações desta versão:
- Ícones oficiais e padronizados do WhatsApp em todos os botões e contatos.
- Horários reorganizados em uma faixa horizontal integrada à seção de localização.
- Nova seção-template de equipe, preparada para receber fotos, nomes e funções reais.
- Logo anexada usada integralmente no cabeçalho, rodapé, cartão do hero e Instagram.
- Novos ícones abstratos para os quatro serviços.
- Galeria horizontal preparada para 10 ou mais fotos sem aumentar demais a página.
- Aviso visível de que a galeria está em modo de prévia e pode receber fotos definitivas.
- Seção com nota 5,0 e três avaliações reais fornecidas pela clínica.
- Horários completos de segunda-feira a domingo.
- Pergunta de localização removida do FAQ.
- Dados estruturados atualizados com horários e avaliação agregada.

Para adicionar fotos à galeria:
1. Coloque a imagem em assets/ usando um nome simples, por exemplo sala-02.webp.
2. No index.html, localize .gallery-track.
3. Duplique um bloco <figure class="gallery-item"> e altere imagem, alt, título e descrição.
O JavaScript conta os itens e atualiza a navegação automaticamente.

Antes de publicar:
- Confirme telefone, endereço, horários e textos.
- Substitua imagens temporárias pelas fotos finais aprovadas.
- Revise periodicamente a nota e o total de avaliações do Google, pois esta versão usa dados estáticos.

Para adicionar fotos da equipe:
1. Coloque a foto em assets/ com um nome simples, por exemplo profissional-wanessa.webp.
2. No index.html, localize a seção #equipe.
3. Substitua o bloco <div class="team-photo-placeholder">...</div> por:
   <img class="team-photo" src="assets/profissional-wanessa.webp" alt="Nome da profissional — especialidade">
4. Troque “Profissional 01” e “Especialidade / função” pelos dados reais.
5. Para incluir mais pessoas, duplique um <article class="team-card"> completo.
