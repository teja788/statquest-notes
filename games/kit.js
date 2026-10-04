/* Arcade kit: progress, stars, modal cards, level bar, canvas helpers, confetti */
const Kit = {
  load(game) {
    try { return JSON.parse(localStorage.getItem('arcade:' + game)) || { stars: {} }; }
    catch (e) { return { stars: {} }; }
  },
  save(game, level, stars) {
    const s = Kit.load(game);
    s.stars[level] = Math.max(stars, s.stars[level] || 0);
    try { localStorage.setItem('arcade:' + game, JSON.stringify(s)); } catch (e) {}
    return s;
  },
  starsHTML(n, of = 3) {
    const star = on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${on ? 'var(--amber)' : 'var(--card-2)'}" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    let h = '';
    for (let i = 0; i < of; i++) h += star(i < n);
    return `<div class="stars" role="img" aria-label="${n} of ${of} stars">${h}</div>`;
  },
  /* card({title, html, stars, buttons:[{label, cls, onClick}]}) -> close() */
  card({ title, html = '', stars = null, buttons = [{ label: 'OK' }] }) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2>${stars === null ? '' : Kit.starsHTML(stars)}${html}<div class="actions"></div></div>`;
    const close = () => o.remove();
    const act = o.querySelector('.actions');
    buttons.forEach((b, i) => {
      const el = document.createElement(b.href ? 'a' : 'button');
      el.className = 'btn ' + (b.cls || (i === buttons.length - 1 ? 'primary' : ''));
      el.textContent = b.label;
      if (b.href) el.href = b.href;
      else el.onclick = () => { close(); b.onClick && b.onClick(); };
      act.appendChild(el);
    });
    document.body.appendChild(o);
    const last = act.lastElementChild;
    if (last) last.focus();
    return close;
  },
  /* levelBar(el, {count, current, game, onPick}); level i unlocks once level i-1 has a star */
  levelBar(el, { count, current, game, onPick }) {
    const s = Kit.load(game).stars;
    el.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const b = document.createElement('button');
      const got = s[i] || 0;
      b.innerHTML = `${i + 1}<small>${'★'.repeat(got)}</small>`;
      b.setAttribute('aria-label', `Level ${i + 1}, ${got} stars`);
      if (i === current) b.className = 'on';
      b.disabled = i > 0 && !s[i - 1] && i !== current;
      b.onclick = () => onPick(i);
      el.appendChild(b);
    }
  },
  /* Crisp canvas with a fixed logical size; returns ctx drawing in logical units */
  canvas(cv, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv._w = w; cv._h = h;
    return ctx;
  },
  /* Pointer position in the canvas's logical units */
  pointer(cv, e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * cv._w / r.width, y: (e.clientY - r.top) * cv._h / r.height };
  },
  /* Seeded random numbers (mulberry32) so each level is fair and repeatable */
  rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60';
    document.body.appendChild(cv);
    const W = cv.width = innerWidth, H = cv.height = innerHeight, ctx = cv.getContext('2d');
    const cols = ['#D85A30', '#1D9E75', '#7F77DD', '#EF9F27', '#378ADD'];
    const ps = Array.from({ length: 120 }, () => ({ x: W / 2, y: H / 3, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 4, r: Math.random() * 6, c: cols[Math.random() * 5 | 0], s: Math.random() * 6 + 4 }));
    let t = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.r += .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++t < 140) requestAnimationFrame(tick); else cv.remove();
    })();
  }
};
