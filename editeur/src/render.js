/* ==========================================================================
   Rendu d'une page (édition, vignette, présentation, export).
   ========================================================================== */
function imgURL(ref) {
  if (!ref) return '';
  return S.backend ? S.backend.url(ref) : ref;
}

/* Recadrage : « remplir » (cover) ou « contenir », zoom et point de cadrage. */
function imgLayout(el, w = el.w, hh = el.h) {
  const nw = el.nw || 1000, nh = el.nh || 1000;
  const base = el.fit === 'contain' ? Math.min(w / nw, hh / nh) : Math.max(w / nw, hh / nh);
  const s = base * (el.zoom || 1);
  const bw = nw * s, bh = nh * s;
  const fx = el.fx == null ? 0.5 : el.fx, fy = el.fy == null ? 0.5 : el.fy;
  return { s, bw, bh, bx: (w - bw) * fx, by: (hh - bh) * fy };
}

function pageIndex(pid) { return S.meta ? S.meta.order.indexOf(pid) : 0; }

function renderPage(page, mode = 'edit', index = pageIndex(page.id)) {
  const dark = isDark(page.bg || '#FFFFFF');
  const pg = h('div', { class: `pg mode-${mode}${dark ? ' is-dark' : ''}`, 'data-pid': page.id });
  pg.style.background = page.bg || '#FFFFFF';
  for (const el of page.els) pg.append(renderEl(el, mode, page, index));
  pg.append(renderChrome(page, index, mode));
  return pg;
}

/* Limites horizontales de l'en-tête et du pied de page : ils s'arrêtent avant une
   photo pleine hauteur, et disparaissent sur une photo pleine page. */
function chromeBounds(page) {
  let x0 = ML, x1 = PW - MR, full = false;
  for (const el of page.els) {
    if (!(el.t === 'image' || el.t === 'video' || el.t === 'shape') || el.r) continue;
    if (el.y > 0 || el.y + el.h < PH) continue;
    if (el.x <= 0 && el.x + el.w >= PW) { full = true; continue; }
    if (el.x <= 0) x0 = Math.max(x0, el.x + el.w + ML);
    else if (el.x + el.w >= PW) x1 = Math.min(x1, el.x - MR);
  }
  return { x0, x1, full: full || x1 - x0 < 240 };
}
function renderChrome(page, index, mode) {
  const box = h('div', { class: 'chrome' });
  const ch = page.chrome || {};
  if (index <= 0) return box;
  const dark = isDark(page.bg || '#FFFFFF');
  const b = chromeBounds(page);
  const total = S.meta ? S.meta.order.length : 0;
  const ink = dark ? '#F5F5F7' : C.ink, sub = dark ? '#A1A1A6' : C.sub, hair = dark ? C.darkHair : C.hair;
  if (ch.header !== false && !b.full) {
    const chap = chapterOf(page.chapter);
    const label = chap.id === 'ouv' ? (page.name || '') : chap.name;
    box.append(h('div', { class: 'ch-head', style: { left: b.x0 + 'px', width: (b.x1 - b.x0) + 'px', color: sub } },
      h('i', { class: 'tri', style: { borderLeftColor: ink } }),
      h('b', { style: { color: ink } }, (S.meta && S.meta.brand) || 'Sarments'),
      h('span', null, label),
      chap.num ? h('em', null, chap.num) : null));
    box.append(h('div', { class: 'ch-rule', style: { left: b.x0 + 'px', top: '62px', width: (b.x1 - b.x0) + 'px', background: hair } }));
  }
  if (ch.folio !== false && !b.full) {
    box.append(h('div', { class: 'ch-rule', style: { left: b.x0 + 'px', top: '1118px', width: (b.x1 - b.x0) + 'px', background: hair } }));
    box.append(h('div', { class: 'ch-foot', style: { left: b.x0 + 'px', width: (b.x1 - b.x0) + 'px', color: sub } },
      h('span', null, 'Dossier de projet'),
      h('span', null, h('b', { style: { color: ink } }, String(index + 1).padStart(2, '0')), total ? ' / ' + String(total).padStart(2, '0') : '')));
  }
  return box;
}

function renderEl(el, mode, page, index) {
  const d = document.createElement('div');
  d.className = `el t-${el.t}`;
  d.dataset.id = el.id;
  const st = d.style;
  st.left = el.x + 'px';
  st.top = el.y + 'px';
  st.width = el.w + 'px';
  if (!(el.t === 'text' && el.autoH !== false)) st.height = el.h + 'px';
  if (el.r && mode !== 'export') st.transform = `rotate(${el.r}deg)`;
  if (el.o != null && el.o < 1) st.opacity = el.o;
  if (el.lock) d.classList.add('locked');
  const inn = document.createElement('div');
  inn.className = 'in';
  d.append(inn);
  switch (el.t) {
    case 'text': renderText(d, inn, el, page, index); break;
    case 'image': renderImage(d, inn, el, mode); break;
    case 'shape': renderShape(d, inn, el); break;
    case 'chart': inn.innerHTML = donutSVG(el); break;
    case 'draw': inn.innerHTML = drawSVG(el); break;
    case 'video': renderVideo(d, inn, el, mode); break;
  }
  if (mode === 'present' && el.anim && el.anim.type && el.anim.type !== 'none') {
    d.classList.add('anim', 'a-' + el.anim.type);
    d.style.setProperty('--d', (el.anim.delay || 0) + 'ms');
  }
  return d;
}

function renderText(d, inn, el, page, index) {
  const s = textStyle(el);
  const st = d.style;
  const dark = isDark(page.bg || '#FFFFFF');
  d.classList.add('st-' + (el.st || 'body'));
  st.fontFamily = STACK[s.ff] || STACK.serif;
  st.fontSize = s.fs + 'px';
  st.lineHeight = s.lh;
  st.letterSpacing = s.ls ? s.ls + 'em' : '0';
  st.fontWeight = s.fw >= 500 ? 600 : 400;
  st.fontStyle = s.it ? 'italic' : 'normal';
  st.textTransform = s.up ? 'uppercase' : 'none';
  st.textAlign = s.al || 'left';
  const filled = s.box === 'sel' || s.box === 'fill';
  const surface = filled ? (s.bg || (s.box === 'sel' ? C.sel : C.card)) : (page.bg || '#FFFFFF');
  const sd = isDark(surface);
  const tone = s.tone === 'sub' ? (sd ? '#A1A1A6' : C.sub) : s.tone === 'blue' ? (sd ? '#5AAEFF' : C.blue) : null;
  st.color = s.col || tone || (sd ? '#F5F5F7' : C.ink);
  if (sd) d.classList.add('on-dark');
  if (filled) {
    d.classList.add('box-' + s.box);
    st.backgroundColor = surface;
    st.padding = `${s.pad[0]}px ${s.pad[1]}px`;
    if (s.rad) st.borderRadius = s.rad + 'px';
  } else if (s.box === 'rule') {
    d.classList.add('box-rule');
    st.borderTop = `1.5px solid ${s.col || (sd ? '#F5F5F7' : C.ink)}`;
    st.paddingTop = '16px';
  }
  if (el.autoH === false) {
    d.classList.add('fixed-h');
    st.justifyContent = el.va === 'middle' ? 'center' : el.va === 'bottom' ? 'flex-end' : 'flex-start';
  }
  inn.className = 'in tx';
  inn.innerHTML = el.toc ? tocHTML(el) : (el.html || '');
}

function tocHTML() {
  if (!S.meta) return '';
  const seen = new Map();
  S.meta.order.forEach((pid, i) => {
    const p = S.pages.get(pid);
    if (!p) return;
    const ch = chapterOf(p.chapter);
    if (ch.toc === false || seen.has(ch.id)) return;
    seen.set(ch.id, i + 1);
  });
  return CHAPTERS.filter(c => seen.has(c.id)).map(c =>
    `<p class="toc-row"><span class="toc-n">${c.num || ''}</span><span class="toc-t">${esc(c.name)}</span><span class="toc-p">${String(seen.get(c.id)).padStart(2, '0')}</span></p>`
  ).join('');
}

function renderImage(d, inn, el, mode) {
  const url = imgURL(el.src);
  if (el.rad) inn.style.borderRadius = el.rad + 'px';
  if (!url) {
    d.classList.add('empty');
    inn.className = 'in ph';
    inn.append(h('div', { class: 'ph-in' },
      h('span', { class: 'ph-ico', html: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 16l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="9" r="1.6" fill="currentColor"/></svg>' }),
      h('span', { class: 'ph-t' }, el.ph || 'Glisse une photo ici')));
    return;
  }
  inn.className = 'in im';
  if (mode === 'export') return;
  const L = imgLayout(el);
  const st = inn.style;
  st.backgroundImage = `url("${url}")`;
  st.backgroundSize = `${L.bw}px ${L.bh}px`;
  st.backgroundPosition = `${L.bx}px ${L.by}px`;
  if (el.gray) st.filter = 'grayscale(1)';
}

function renderShape(d, inn, el) {
  inn.className = 'in shp sh-' + (el.shape || 'rect');
  const st = inn.style;
  if (el.shape === 'tri') {
    st.background = el.fill || C.ink;
    return;
  }
  if (el.fill) st.background = el.fill;
  if (el.stroke && el.sw) st.border = `${el.sw}px solid ${el.stroke}`;
  if (el.shape === 'ellipse') st.borderRadius = '50%';
  else if (el.rad) st.borderRadius = el.rad + 'px';
}

function renderVideo(d, inn, el, mode) {
  inn.className = 'in vid';
  if (el.rad) inn.style.borderRadius = el.rad + 'px';
  const src = imgURL(el.src), poster = imgURL(el.poster);
  if (mode === 'export' || !src) {
    if (!src) { d.classList.add('empty'); inn.className = 'in ph'; inn.append(h('div', { class: 'ph-in' }, h('span', { class: 'ph-t' }, 'Vidéo'))); }
    return;
  }
  const v = h('video', { muted: true, playsinline: true, preload: 'metadata', loop: el.loop !== false });
  v.muted = true;
  if (poster) v.poster = poster;
  v.src = src;
  v.style.objectPosition = `${(el.fx == null ? 0.5 : el.fx) * 100}% ${(el.fy == null ? 0.5 : el.fy) * 100}%`;
  v.style.objectFit = el.fit === 'contain' ? 'contain' : 'cover';
  if (mode === 'present') { v.autoplay = true; v.setAttribute('autoplay', ''); }
  inn.append(v);
  if (mode === 'edit' || mode === 'thumb') inn.append(h('span', { class: 'vid-badge', html: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.55)"/><path d="M10 8l6 4-6 4z" fill="#fff"/></svg>' }));
}

/* Graphique en anneau / camembert : mêmes rayons à l'écran et dans le PDF. */
function donutGeom(el) {
  const total = (el.data || []).reduce((a, d) => a + Math.max(0, +d.v || 0), 0) || 1;
  const hole = clamp(el.hole == null ? 0 : el.hole, 0, 0.9);
  const R = 50, ri = R * hole, mid = (R + ri) / 2, th = R - ri;
  let a = el.start == null ? -90 : el.start;
  const segs = (el.data || []).map(d => {
    const sweep = 360 * Math.max(0, +d.v || 0) / total;
    const seg = { a0: a, a1: a + sweep, c: d.c || C.ink };
    a += sweep;
    return seg;
  });
  return { R, mid, th, segs };
}
function donutSVG(el) {
  const g = donutGeom(el);
  const circ = 2 * Math.PI * g.mid;
  const parts = g.segs.map(s => {
    const len = circ * (s.a1 - s.a0) / 360;
    return `<circle cx="50" cy="50" r="${g.mid}" fill="none" stroke="${s.c}" stroke-width="${g.th}" stroke-dasharray="${len} ${circ}" transform="rotate(${s.a0} 50 50)"/>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" aria-hidden="true">${parts}</svg>`;
}

/* Dessin à main levée : points normalisés (0 à 1) dans la boîte de l'élément. */
function drawPathD(el, w = el.w, hh = el.h) {
  const p = el.pts || [];
  let d = '';
  for (let i = 0; i < p.length; i += 2) d += (i ? 'L' : 'M') + round(p[i] * w, 1) + ' ' + round(p[i + 1] * hh, 1);
  return d;
}
function drawSVG(el) {
  return `<svg viewBox="0 0 ${el.w} ${el.h}" width="100%" height="100%" preserveAspectRatio="none" style="overflow:visible" aria-hidden="true"><path d="${drawPathD(el)}" fill="none" stroke="${el.stroke || C.ink}" stroke-width="${el.sw || 4}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
