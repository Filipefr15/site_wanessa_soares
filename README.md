CLÍNICA WANESSA SOARES — SITE INSTITUCIONAL

Arquivos principais:
- index.html
- styles.css
- script.js
- assets/

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
