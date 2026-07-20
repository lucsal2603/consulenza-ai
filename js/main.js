/* ═══════════════════════════════════════════════
   SINAPSI — interazioni + scroll animations
   (vanilla: solo transform/opacity, throttle 16ms,
   letture e scritture in batch, reduced-motion ok)
   ═══════════════════════════════════════════════ */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ── loader → entrata hero ── */
  window.addEventListener('load', () => {
    setTimeout(() => document.body.classList.add('is-loaded'), reduceMotion ? 0 : 850);
  });
  // fallback se load tarda (font lenti ecc.)
  setTimeout(() => document.body.classList.add('is-loaded'), 2600);

  /* ── nav: stato scrolled ── */
  const nav = document.getElementById('nav');

  /* ── titoli sezione: wrap per il mask reveal ── */
  document.querySelectorAll('.section-title, .cta__title').forEach(t => {
    t.innerHTML = `<span class="st">${t.innerHTML}</span>`;
  });

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

  /* ── parallax quadrati hero (mouse + scroll) ── */
  const squares = document.getElementById('heroSquares');
  let sqScrollY = 0; // offset verticale legato allo scroll, letto dal loop mouse
  if (squares && finePointer && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -28;
      ty = (e.clientY / window.innerHeight - 0.5) * -20;
    }, { passive: true });
    const drift = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      squares.style.transform = `translate3d(${cx}px, ${cy + sqScrollY}px, 0)`;
      requestAnimationFrame(drift);
    };
    drift();
  }

  /* ── contatori statistiche ── */
  let countersDone = false;
  const startCounters = () => {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('.stat__value .n').forEach(n => {
      const to = parseInt(n.dataset.to, 10) || 0;
      if (reduceMotion || to === 0) { n.textContent = String(to); return; }
      const dur = 1300;
      const t0 = performance.now();
      const iv = setInterval(() => {
        const p = clamp((performance.now() - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        n.textContent = String(Math.round(to * eased));
        if (p >= 1) clearInterval(iv);
      }, 28);
    });
  };

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
      if (el.classList.contains('why__stats')) startCounters();
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => io.observe(el));

  /* ── manifesto: reveal parola per parola allo scroll ── */
  const manifesto = document.getElementById('manifestoText');
  let updateManifesto = () => {};
  if (manifesto) {
    const ACCENT = ['decisioni,', 'misurabile.', 'automatizzano,'];
    const words = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = words
      .map(w => `<span class="w${ACCENT.includes(w) ? ' w--accent' : ''}">${w}</span>`)
      .join(' ');
    const spans = manifesto.querySelectorAll('.w');

    const manifestoSection = document.getElementById('manifesto');
    updateManifesto = () => {
      const rect = manifestoSection.getBoundingClientRect();
      const vh = window.innerHeight;
      // progresso dentro la pista pinnata (0 = appena bloccato, 1 = fine corsa);
      // il fattore 1.15 completa il testo poco prima dello sblocco, per una pausa piena
      const scrollable = Math.max(1, rect.height - vh);
      const progress = clamp((-rect.top / scrollable) * 1.15, 0, 1);
      const on = Math.round(progress * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-on', i < on));
    };
    if (reduceMotion) spans.forEach(s => s.classList.add('is-on'));
  }

  /* ═══════════ SCROLL FX — motore unico (scrub) ═══════════
     Un solo listener throttlato: prima tutte le letture di layout,
     poi tutte le scritture (solo transform/opacity).             */
  const progressBar = document.getElementById('progress');
  const hero = document.querySelector('.hero');
  const heroFluid = document.querySelector('.hero__fluid');
  const heroTitle = document.querySelector('.hero__title');
  const heroCtas = document.querySelector('.hero__ctas');
  const heroCenter = document.querySelector('.hero__center');
  const heroCorners = document.querySelectorAll('.hero__corner');
  const panels = [...document.querySelectorAll('.service-panel')];
  const sectors = document.getElementById('settori');
  const marqueeOffs = [...document.querySelectorAll('.marquee__off')];
  const ctaSection = document.getElementById('contatti');
  const ctaFluid = document.querySelector('.cta__fluid');

  let lastY = window.scrollY;
  let skewResetTimer = null;

  const scrollFX = () => {
    /* ---- letture ---- */
    const y = window.scrollY;
    const vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const velocity = y - lastY;
    lastY = y;

    const heroH = hero ? hero.offsetHeight : vh;
    const heroP = clamp(y / heroH, 0, 1);
    const panelRects = panels.map(p => p.getBoundingClientRect());
    const sectorsRect = sectors ? sectors.getBoundingClientRect() : null;
    const ctaRect = ctaSection ? ctaSection.getBoundingClientRect() : null;

    /* ---- scritture ---- */
    // barra progresso
    if (progressBar) {
      progressBar.style.transform = `scaleX(${docH > vh ? clamp(y / (docH - vh), 0, 1) : 0})`;
    }

    if (!reduceMotion) {
      // hero: dissolvenza e parallax in uscita
      if (heroTitle) {
        heroTitle.style.transform = `translateY(${heroP * -70}px)`;
        heroTitle.style.opacity = String(1 - heroP * 0.95);
      }
      if (heroFluid) heroFluid.style.opacity = String(1 - heroP * 0.4);
      sqScrollY = heroP * 60;
      if (squares && !finePointer) squares.style.transform = `translate3d(0, ${sqScrollY}px, 0)`;
      if (heroP > 0.02) {
        if (heroCtas) {
          heroCtas.style.transform = `translateY(${heroP * -36}px)`;
          heroCtas.style.opacity = String(1 - heroP * 1.1);
        }
        if (heroCenter) heroCenter.style.opacity = String(1 - heroP * 1.4);
        heroCorners.forEach(c => { c.style.opacity = String(clamp(0.55 - heroP * 1.2, 0, 1)); });
      }

      // pannelli servizi — mazzo di carte: ogni carta che arriva si mette davanti
      // e spinge TUTTE le precedenti (la terza sposta la seconda e la prima)
      const covers = panels.map((p, i) => {
        if (i === 0) return 0;
        return clamp((panelRects[i - 1].bottom - panelRects[i].top) / panelRects[i - 1].height, 0, 1);
      });
      for (let i = 0; i < panels.length; i++) {
        let push = 0;
        for (let j = i + 1; j < panels.length; j++) push += covers[j];
        push = Math.min(push, 2);
        panels[i].style.setProperty('--pscale', String(1 - push * 0.04));
        panels[i].style.setProperty('--pty', `${push * -11}px`);
      }

      // marquee: offset orizzontale legato allo scroll + skew da velocità
      if (sectorsRect && marqueeOffs.length === 2) {
        const p = clamp((vh - sectorsRect.top) / (vh + sectorsRect.height), 0, 1);
        const off = (p - 0.5) * 140;
        const skew = clamp(velocity * 0.05, -4, 4);
        marqueeOffs[0].style.setProperty('--mx', `${off}px`);
        marqueeOffs[1].style.setProperty('--mx', `${-off}px`);
        marqueeOffs.forEach(m => m.style.setProperty('--msk', `${skew}deg`));
        clearTimeout(skewResetTimer);
        skewResetTimer = setTimeout(() => {
          marqueeOffs.forEach(m => m.style.setProperty('--msk', '0deg'));
        }, 140);
      }

      // CTA finale: parallax dei blob
      if (ctaRect && ctaFluid) {
        const p = clamp((vh - ctaRect.top) / (vh + ctaRect.height), 0, 1);
        ctaFluid.style.setProperty('--cy', `${(p - 0.5) * 70}px`);
      }
    }

    // manifesto (ha già il suo clamp interno)
    updateManifesto();

    // nav
    nav.classList.toggle('nav--scrolled', y > 40);
  };

  let fxTicking = false;
  window.addEventListener('scroll', () => {
    if (fxTicking) return;
    fxTicking = true;
    setTimeout(() => { scrollFX(); fxTicking = false; }, 16);
  }, { passive: true });
  window.addEventListener('resize', () => scrollFX(), { passive: true });
  scrollFX();

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
