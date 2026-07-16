(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.main-nav');
  const menuCloseButton = menu ? menu.querySelector('.menu-close') : null;
  const menuLinks = menu ? menu.querySelectorAll('a') : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  };

  const closeMenu = ({ returnFocus = false } = {}) => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu de navegação');
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (returnFocus) menuButton.focus();
  };

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(willOpen));
      menuButton.setAttribute('aria-label', willOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
      menu.classList.toggle('is-open', willOpen);
      document.body.classList.toggle('menu-open', willOpen);
      if (willOpen) window.requestAnimationFrame(() => menuCloseButton?.focus());
    });

    menuCloseButton?.addEventListener('click', () => closeMenu({ returnFocus: true }));
    menu.addEventListener('click', (event) => {
      if (event.target === menu) closeMenu({ returnFocus: true });
    });
    menuLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu({ returnFocus: true });
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
    }, { passive: true });
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const year = document.querySelector('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const track = gallery.querySelector('.gallery-track');
    const previous = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    const status = gallery.querySelector('[data-gallery-status]');
    const items = Array.from(gallery.querySelectorAll('.gallery-item'));

    if (!track || items.length === 0) return;

    const metrics = () => {
      const first = items[0];
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const step = first.getBoundingClientRect().width + gap;
      const visible = Math.max(1, Math.round((track.clientWidth + gap) / step));
      return { step, visible };
    };

    const updateGallery = () => {
      const { step, visible } = metrics();
      const startIndex = Math.min(items.length - 1, Math.max(0, Math.round(track.scrollLeft / step)));
      const endIndex = Math.min(items.length, startIndex + visible);
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;

      if (status) status.textContent = `${startIndex + 1}–${endIndex} de ${items.length} fotos`;
      if (previous) previous.disabled = atStart;
      if (next) next.disabled = atEnd;
    };

    const move = (direction) => {
      const { step } = metrics();
      track.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    previous?.addEventListener('click', () => move(-1));
    next?.addEventListener('click', () => move(1));
    track.addEventListener('scroll', updateGallery, { passive: true });
    window.addEventListener('resize', updateGallery, { passive: true });
    updateGallery();
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach((item) => observer.observe(item));
  }
})();
