/* ═══════════════════════════════════════════════
   SINAPSI — interazioni
   ═══════════════════════════════════════════════ */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── loader → entrata hero ── */
  window.addEventListener('load', () => {
    setTimeout(() => document.body.classList.add('is-loaded'), reduceMotion ? 0 : 850);
  });
  // fallback se load tarda (font lenti ecc.)
  setTimeout(() => document.body.classList.add('is-loaded'), 2600);

  /* ── nav: stato scrolled ── */
  const nav = document.getElementById('nav');
  const onScrollNav = () => nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ── scroll fluido verso le ancore (senza scroll-behavior CSS) ── */
  const easeScroll = (t) => 1 - Math.pow(1 - t, 4); // ease-out quart
  const smoothScrollTo = (targetY) => {
    if (reduceMotion) { window.scrollTo(0, targetY); return; }
    const startY = window.scrollY;
    const dist = targetY - startY;
    const dur = Math.min(1100, 420 + Math.abs(dist) * 0.12);
    let t0 = null;
    let started = false;
    const step = (ts) => {
      started = true;
      if (t0 === null) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      window.scrollTo(0, startY + dist * easeScroll(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // ambienti con rAF sospeso (webview in background ecc.): salto diretto
    setTimeout(() => { if (!started) window.scrollTo(0, targetY); }, 160);
  };
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target && id !== 'top') return;
      e.preventDefault();
      const navH = nav.offsetHeight;
      const y = id === 'top' || !target ? 0 : target.getBoundingClientRect().top + window.scrollY - navH + 2;
      smoothScrollTo(Math.max(0, y));
      history.pushState(null, '', '#' + id);
    });
  });

  /* ── menu mobile ── */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const toggleMenu = (open) => {
    const isOpen = open ?? !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', isOpen);
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu());
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ── cursore custom ── */
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  } else {
    cursor.remove();
    ring.remove();
  }

  /* ── parallax quadrati hero ── */
  const squares = document.getElementById('heroSquares');
  if (squares && finePointer && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -28;
      ty = (e.clientY / window.innerHeight - 0.5) * -20;
    }, { passive: true });
    const drift = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      squares.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(drift);
    };
    drift();
  }

  /* ── reveal on scroll (con stagger per fratelli) ── */
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [el];
      const idx = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--rd', `${(idx % 4) * 0.09}s`);
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => io.observe(el));

  /* ── manifesto: reveal parola per parola allo scroll ── */
  const manifesto = document.getElementById('manifestoText');
  if (manifesto) {
    const ACCENT = ['decisioni,', 'misurabile.', 'automatizzano,'];
    const words = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = words
      .map(w => `<span class="w${ACCENT.includes(w) ? ' w--accent' : ''}">${w}</span>`)
      .join(' ');
    const spans = manifesto.querySelectorAll('.w');

    const updateManifesto = () => {
      const rect = manifesto.getBoundingClientRect();
      const vh = window.innerHeight;
      // progresso: da quando il testo entra (75% vh) a quando il suo fondo è al 45% vh
      const total = rect.height + vh * 0.32;
      const progress = Math.min(1, Math.max(0, (vh * 0.78 - rect.top) / total));
      const on = Math.floor(progress * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-on', i < on));
    };
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      setTimeout(() => { updateManifesto(); ticking = false; }, 16);
    }, { passive: true });
    updateManifesto();
    if (reduceMotion) spans.forEach(s => s.classList.add('is-on'));
  }

  /* ── slider testimonianze ── */
  const quotes = document.querySelectorAll('.quote');
  const idxLabel = document.getElementById('quoteIndex');
  const prev = document.getElementById('quotePrev');
  const next = document.getElementById('quoteNext');
  if (quotes.length && prev && next) {
    let current = 0;
    let timer = null;
    const show = (i) => {
      current = (i + quotes.length) % quotes.length;
      quotes.forEach((q, k) => q.classList.toggle('is-active', k === current));
      idxLabel.textContent = String(current + 1).padStart(2, '0');
    };
    const restart = () => {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), 6500);
    };
    prev.addEventListener('click', () => { show(current - 1); restart(); });
    next.addEventListener('click', () => { show(current + 1); restart(); });
    restart();
  }

  /* ── anno footer ── */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
