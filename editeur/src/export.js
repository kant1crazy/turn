/* ==========================================================================
   Export PDF : une page A3 paysage par page du dossier.
   Le texte est vectoriel (mêmes polices, positions mesurées à l'écran),
   les images sont recadrées puis compressées à la résolution choisie.
   ========================================================================== */
const QUALITY = {
  light: { label: 'Léger', dpi: 110, q: 0.72, hint: 'Envoi par mail, dépôt en ligne' },
  standard: { label: 'Standard', dpi: 160, q: 0.8, hint: 'Lecture à l’écran, projection' },
  print: { label: 'Impression', dpi: 240, q: 0.88, hint: 'Impression A3' }
};
const JSPDF_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
];
const PDFSTYLE = { n4: 'normal', n6: 'bold', i4: 'italic', i6: 'bolditalic' };
const MM = v => v / PXMM;
const K_PT = 72 / 25.4;

function loadScript(url) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = res;
    s.onerror = () => { s.remove(); rej(new Error('load')); };
    document.head.append(s);
  });
}
async function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  for (const u of JSPDF_URLS) {
    try { await loadScript(u); if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF; } catch (e) { /* source suivante */ }
  }
  throw new Error('Le moteur PDF n’a pas pu être chargé. Vérifie ta connexion et réessaie.');
}

/* ---------------------------------------------------------------- fenêtre d'export */
const EXP = { blob: null, name: '' };
function openExport() {
  if (S.editing) exitEdit();
  if (S.crop) exitCrop();
  flushSave();
  const n = S.meta.order.length;
  const st = { range: 'all', custom: '', quality: 'standard', empty: false, name: ((S.meta.brand || 'Sarments') + '-dossier').replace(/\s+/g, '-') + '.pdf' };
  const body = h('div', { class: 'xp' });
  const render = () => {
    body.innerHTML = '';
    body.append(h('h2', null, 'Exporter en PDF'),
      h('p', { class: 'msub' }, 'Une page A3 paysage par page du dossier. Le texte reste vectoriel et net ; les photos sont compressées selon la qualité choisie.'));
    const rangeSeg = segIn(st.range, [['all', `Toutes (${n})`], ['cur', 'Page courante'], ['custom', 'Plage']], v => { st.range = v; render(); });
    rangeSeg.querySelectorAll('button').forEach(b => { b.disabled = false; });
    const custom = h('input', { type: 'text', class: 'txtin', placeholder: 'ex. 1-12, 20', value: st.custom, 'aria-label': 'Pages à exporter' });
    custom.addEventListener('input', () => { st.custom = custom.value; });
    body.append(h('div', { class: 'xrow' }, h('span', { class: 'ilab' }, 'Pages'), rangeSeg, st.range === 'custom' ? custom : null));
    const qs = h('div', { class: 'qcards' });
    for (const [k, q] of Object.entries(QUALITY)) {
      const c = h('button', { class: 'qcard' + (st.quality === k ? ' on' : '') }, h('b', null, q.label), h('span', null, q.dpi + ' dpi'), h('em', null, q.hint));
      c.onclick = () => { st.quality = k; render(); };
      qs.append(c);
    }
    body.append(h('div', { class: 'xrow top' }, h('span', { class: 'ilab' }, 'Qualité'), qs));
    const tg = togIn(st.empty, v => { st.empty = v; render(); }, 'Inclure les cadres photo vides');
    tg.disabled = false;
    body.append(h('div', { class: 'xrow' }, h('span', { class: 'ilab' }, 'Cadres vides'), h('div', { class: 'flexrow' }, tg, h('span', { class: 'mini-l' }, st.empty ? 'Dessinés en gris (version de travail)' : 'Masqués (version finale)'))));
    const name = h('input', { type: 'text', class: 'txtin', value: st.name, 'aria-label': 'Nom du fichier' });
    name.addEventListener('input', () => { st.name = name.value; });
    body.append(h('div', { class: 'xrow' }, h('span', { class: 'ilab' }, 'Fichier'), name));
    const go = btn('Générer le PDF', () => runExport(st, body), 'primary big');
    body.append(h('div', { class: 'mbtns' }, btn('Annuler', closeModal, 'ghost'), go));
  };
  render();
  openModal(body, 'export');
}
function parseRange(txt, n) {
  const out = new Set();
  for (const part of String(txt).split(/[,;\s]+/)) {
    if (!part) continue;
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) continue;
    let a = +m[1], b = m[2] ? +m[2] : a;
    if (a > b) [a, b] = [b, a];
    for (let i = Math.max(1, a); i <= Math.min(n, b); i++) out.add(i - 1);
  }
  return [...out].sort((a, b) => a - b);
}
async function runExport(st, body) {
  const order = S.meta.order;
  let idx = st.range === 'all' ? order.map((_, i) => i) : st.range === 'cur' ? [order.indexOf(S.cur)] : parseRange(st.custom, order.length);
  if (!idx.length) { toast('Indique des pages valides, par exemple 1-12, 20.', 'warn'); return; }
  const q = QUALITY[st.quality];
  const m = $('#modal');
  m.dataset.locked = '1';
  body.innerHTML = '';
  const bar = h('div', { class: 'xbar' }, h('i'));
  const lab = h('p', { class: 'xlab' }, 'Préparation…');
  body.append(h('h2', null, 'Création du PDF'), h('p', { class: 'msub' }, `${idx.length} page${idx.length > 1 ? 's' : ''} · qualité ${q.label.toLowerCase()} (${q.dpi} dpi)`), bar, lab);
  try {
    const blob = await buildPDF(idx.map(i => order[i]), { dpi: q.dpi, q: q.q, empty: st.empty }, (k, n) => {
      bar.firstChild.style.width = (k / n * 100) + '%';
      lab.textContent = `Page ${k} / ${n}`;
    });
    EXP.blob = blob;
    EXP.name = /\.pdf$/i.test(st.name) ? st.name : st.name + '.pdf';
    delete m.dataset.locked;
    const mo = (blob.size / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    body.innerHTML = '';
    body.append(h('h2', null, 'PDF prêt'),
      h('p', { class: 'msub' }, `${idx.length} page${idx.length > 1 ? 's' : ''} · ${mo} Mo · ${q.label}`),
      h('div', { class: 'mbtns' }, btn('Fermer', closeModal, 'ghost'), btn(`Enregistrer le PDF (${mo} Mo)`, async () => {
        const r = await saveFile(EXP.name, EXP.blob);
        if (r === 'saved') { toast('PDF enregistré.'); closeModal(); }
      }, 'primary big')));
  } catch (e) {
    delete m.dataset.locked;
    body.innerHTML = '';
    body.append(h('h2', null, 'L’export a échoué'), h('p', { class: 'msub' }, errText(e)), h('div', { class: 'mbtns' }, btn('Fermer', closeModal, 'ghost')));
    console.error(e);
  } finally {
    $('#xhost').innerHTML = '';
  }
}

/* ---------------------------------------------------------------- moteur */
function registerPdfFonts(pdf) {
  for (const F of Object.values(FAM)) {
    for (const [key, file] of Object.entries(F.files)) {
      if (!FONTDATA[file]) continue;
      pdf.addFileToVFS(file + '.ttf', FONTDATA[file]);
      pdf.addFont(file + '.ttf', F.pdf, PDFSTYLE[key], 'Identity-H');
    }
  }
}
function setFill(pdf, c) { const v = Array.isArray(c) ? c : hexToRgb(c); pdf.setFillColor(v[0], v[1], v[2]); }
function setStroke(pdf, c) { const v = Array.isArray(c) ? c : hexToRgb(c); pdf.setDrawColor(v[0], v[1], v[2]); }

async function buildPDF(pids, opts, progress) {
  const jsPDF = await loadJsPDF();
  const pdf = new jsPDF({ unit: 'mm', format: [420, 297], orientation: 'landscape', compress: true, putOnlyUsedFonts: true });
  registerPdfFonts(pdf);
  pdf.setProperties({ title: (S.meta.title || 'Dossier'), creator: 'Éditeur Sarments' });
  const host = $('#xhost');
  const ctx = { pdf, opts, imgs: new Map(), parts: new Map(), alias: 0 };
  for (let n = 0; n < pids.length; n++) {
    const page = S.pages.get(pids[n]);
    if (n > 0) pdf.addPage([420, 297], 'landscape');
    const dom = renderPage(page, 'export', S.meta.order.indexOf(page.id));
    host.replaceChildren(dom);
    await document.fonts.ready;
    await nextFrame();
    ctx.pr = dom.getBoundingClientRect();
    const bg = (page.bg || '#FFFFFF').toUpperCase();
    ctx.bg = bg;
    if (bg !== '#FFFFFF') { setFill(pdf, bg); pdf.rect(0, 0, 420, 297, 'F'); }
    for (const el of page.els) {
      const node = dom.querySelector(`.el[data-id="${el.id}"]`);
      if (node) { try { await drawElement(ctx, el, node); } catch (e) { console.warn('élément ignoré', el.id, e); } }
    }
    const chrome = dom.querySelector('.chrome');
    if (chrome) {
      const tri = chrome.querySelector('.tri');
      if (tri) {
        const r = tri.getBoundingClientRect(), x = r.left - ctx.pr.left, y = r.top - ctx.pr.top;
        setFill(pdf, cssColorToRgba(getComputedStyle(tri).borderLeftColor) || [20, 20, 20]);
        pdf.triangle(MM(x), MM(y), MM(x), MM(y + r.height), MM(x + r.width), MM(y + r.height / 2), 'F');
      }
      for (const rl of chrome.querySelectorAll('.ch-rule')) { // (anciens filets, plus utilisés)
        const r = rl.getBoundingClientRect();
        setFill(pdf, cssColorToRgba(getComputedStyle(rl).backgroundColor) || [225, 223, 218]);
        pdf.rect(MM(r.left - ctx.pr.left), MM(r.top - ctx.pr.top), MM(r.width), MM(r.height), 'F');
      }
      drawWords(ctx, chrome);
    }
    progress(n + 1, pids.length);
    if (n % 4 === 3) await sleep(0);
  }
  host.innerHTML = '';
  return pdf.output('blob');
}

function rotateAround(pdf, cxmm, cymm, deg) {
  const H = 297 * K_PT, X = cxmm * K_PT, Y = H - cymm * K_PT, phi = -deg * Math.PI / 180;
  const c = Math.cos(phi), s = Math.sin(phi);
  const e = X - X * c + Y * s, f = Y - X * s - Y * c;
  pdf.internal.write([c, s, -s, c, e, f].map(v => v.toFixed(6)).join(' ') + ' cm');
}

/* Chemin de rectangle arrondi écrit directement en PDF (pour découper une image). */
function roundRectPath(pdf, x, y, w, hh, r) {
  r = Math.max(0, Math.min(r, w / 2, hh / 2));
  const k = K_PT, H = 297, c = 0.5523 * r;
  const P = (X, Y) => (X * k).toFixed(3) + ' ' + ((H - Y) * k).toFixed(3);
  return [
    P(x + r, y) + ' m', P(x + w - r, y) + ' l',
    P(x + w - r + c, y) + ' ' + P(x + w, y + r - c) + ' ' + P(x + w, y + r) + ' c',
    P(x + w, y + hh - r) + ' l',
    P(x + w, y + hh - r + c) + ' ' + P(x + w - r + c, y + hh) + ' ' + P(x + w - r, y + hh) + ' c',
    P(x + r, y + hh) + ' l',
    P(x + r - c, y + hh) + ' ' + P(x, y + hh - r + c) + ' ' + P(x, y + hh - r) + ' c',
    P(x, y + r) + ' l',
    P(x, y + r - c) + ' ' + P(x + r - c, y) + ' ' + P(x + r, y) + ' c'
  ].join('\n');
}
function clipRound(pdf, x, y, w, hh, r) {
  pdf.internal.write(roundRectPath(pdf, MM(x), MM(y), MM(w), MM(hh), MM(r)) + '\nh W n');
}
function fillRound(pdf, x, y, w, hh, r) {
  const rr = Math.min(r, w / 2, hh / 2);
  if (rr > 0.5) pdf.roundedRect(MM(x), MM(y), MM(w), MM(hh), MM(rr), MM(rr), 'F');
  else pdf.rect(MM(x), MM(y), MM(w), MM(hh), 'F');
}

async function drawElement(ctx, el, node) {
  const { pdf } = ctx;
  const r = node.getBoundingClientRect();
  const x = r.left - ctx.pr.left, y = r.top - ctx.pr.top, w = r.width, hh = r.height;
  const op = el.o == null ? 1 : el.o;
  const rot = el.r || 0;
  const scoped = op < 1 || rot;
  if (scoped) pdf.saveGraphicsState();
  if (op < 1) pdf.setGState(new pdf.GState({ opacity: op, 'stroke-opacity': op }));
  if (rot) rotateAround(pdf, MM(x + w / 2), MM(y + hh / 2), rot);
  switch (el.t) {
    case 'shape': drawShape(ctx, el, x, y, w, hh); break;
    case 'image': await drawMedia(ctx, el, x, y, w, hh); break;
    case 'video': await drawMedia(ctx, { ...el, src: el.poster, zoom: 1, ph: 'Vidéo' }, x, y, w, hh); break;
    case 'chart': drawDonut(ctx, el, x, y, w, hh); break;
    case 'draw': drawPen(ctx, el, x, y, w, hh); break;
    case 'text': drawText(ctx, el, node, x, y, w, hh); break;
  }
  if (scoped) pdf.restoreGraphicsState();
}

function drawShape(ctx, el, x, y, w, hh) {
  const pdf = ctx.pdf;
  if (el.shape === 'tri') {
    if (!el.fill) return;
    setFill(pdf, el.fill);
    pdf.triangle(MM(x + w / 2), MM(y), MM(x + w), MM(y + hh), MM(x), MM(y + hh), 'F');
    return;
  }
  const sw = el.stroke && el.sw ? el.sw : 0;
  const style = el.fill && sw ? 'FD' : el.fill ? 'F' : sw ? 'S' : null;
  if (!style) return;
  if (el.fill) setFill(pdf, el.fill);
  if (sw) { setStroke(pdf, el.stroke); pdf.setLineWidth(MM(sw)); }
  const ins = sw / 2;
  const X = MM(x + ins), Y = MM(y + ins), W = MM(Math.max(0.1, w - sw)), Hh = MM(Math.max(0.1, hh - sw));
  if (el.shape === 'ellipse') pdf.ellipse(MM(x + w / 2), MM(y + hh / 2), W / 2, Hh / 2, style);
  else if (el.rad) { const rr = MM(Math.min(el.rad, w / 2, hh / 2)); pdf.roundedRect(X, Y, W, Hh, rr, rr, style); }
  else pdf.rect(X, Y, W, Hh, style);
}

async function loadImageCached(ctx, url) {
  if (ctx.imgs.has(url)) return ctx.imgs.get(url);
  const p = loadImg(url).then(async img => {
    try { await img.decode(); } catch (e) {}
    let alpha = false;
    try {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, 32, 32);
      const d = x.getImageData(0, 0, 32, 32).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { alpha = true; break; }
    } catch (e) {}
    return { img, alpha };
  });
  ctx.imgs.set(url, p);
  return p;
}
function grayscaleCanvas(c) {
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height);
  const a = d.data;
  for (let i = 0; i < a.length; i += 4) { const v = 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2]; a[i] = a[i + 1] = a[i + 2] = v; }
  x.putImageData(d, 0, 0);
}
async function drawMedia(ctx, el, x, y, w, hh) {
  const rad = el.rad ? Math.min(el.rad, w / 2, hh / 2) : 0;
  if (!rad || !el.src) return drawImage(ctx, el, x, y, w, hh);
  ctx.pdf.saveGraphicsState();
  clipRound(ctx.pdf, x, y, w, hh, rad);
  try { await drawImage(ctx, el, x, y, w, hh); } finally { ctx.pdf.restoreGraphicsState(); }
}
async function drawImage(ctx, el, x, y, w, hh) {
  const pdf = ctx.pdf;
  if (!el.src) { if (ctx.opts.empty) drawPlaceholder(ctx, el, x, y, w, hh); return; }
  let res;
  try { res = await loadImageCached(ctx, imgURL(el.src)); } catch (e) { if (ctx.opts.empty) drawPlaceholder(ctx, el, x, y, w, hh); return; }
  const { img, alpha } = res;
  const nw = img.naturalWidth || el.nw || 1000, nh = img.naturalHeight || el.nh || 1000;
  const L = imgLayout({ ...el, nw, nh }, w, hh);
  const vx0 = Math.max(0, L.bx), vy0 = Math.max(0, L.by), vx1 = Math.min(w, L.bx + L.bw), vy1 = Math.min(hh, L.by + L.bh);
  if (vx1 - vx0 < 0.5 || vy1 - vy0 < 0.5) return;
  const sx = (vx0 - L.bx) / L.s, sy = (vy0 - L.by) / L.s, sw = (vx1 - vx0) / L.s, sh = (vy1 - vy0) / L.s;
  const dw = MM(vx1 - vx0), dh = MM(vy1 - vy0);
  let cw = Math.round(dw / 25.4 * ctx.opts.dpi), ch = Math.round(dh / 25.4 * ctx.opts.dpi);
  const k = Math.min(1, sw / cw, sh / ch);
  cw = Math.max(1, Math.round(cw * k)); ch = Math.max(1, Math.round(ch * k));
  const key = [el.src, sx, sy, sw, sh, cw, ch, el.gray ? 1 : 0].map(v => typeof v === 'number' ? Math.round(v) : v).join('|');
  let part = ctx.parts.get(key);
  if (!part) {
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const x2 = c.getContext('2d');
    x2.imageSmoothingEnabled = true;
    x2.imageSmoothingQuality = 'high';
    if (!alpha) { x2.fillStyle = '#FFFFFF'; x2.fillRect(0, 0, cw, ch); }
    x2.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    if (el.gray) grayscaleCanvas(c);
    part = alpha
      ? { data: c, fmt: 'PNG', alias: 'im' + (ctx.alias++), comp: 'FAST' }
      : { data: c.toDataURL('image/jpeg', ctx.opts.q), fmt: 'JPEG', alias: 'im' + (ctx.alias++), comp: 'NONE' };
    ctx.parts.set(key, part);
  }
  pdf.addImage(part.data, part.fmt, MM(x + vx0), MM(y + vy0), dw, dh, part.alias, part.comp);
}
function drawPlaceholder(ctx, el, x, y, w, hh) {
  const pdf = ctx.pdf;
  // mêmes teintes qu'à l'écran : gris clair, gris foncé sur fond noir, bleu sur fond bleu
  const tone = isBlue(ctx.bg) ? ['#2A51DC', '#6F8BEA', [220, 227, 251]] : isDark(ctx.bg) ? ['#1A1A1A', '#3A3A3A', [142, 142, 142]] : ['#EFEFED', '#D0D0CC', [138, 138, 134]];
  setFill(pdf, tone[0]);
  setStroke(pdf, tone[1]);
  pdf.setLineWidth(0.4);
  pdf.setLineDashPattern([2, 1.5], 0);
  const rr = el.rad ? Math.min(el.rad, w / 2, hh / 2) : 0;
  if (rr > 0.5) pdf.roundedRect(MM(x), MM(y), MM(w), MM(hh), MM(rr), MM(rr), 'FD');
  else pdf.rect(MM(x), MM(y), MM(w), MM(hh), 'FD');
  pdf.setLineDashPattern([], 0);
  if (el.ph) {
    pdf.setFont(FAM.sans.pdf, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...tone[2]);
    const lines = pdf.splitTextToSize(el.ph, Math.max(20, MM(w) - 10));
    pdf.text(lines, MM(x + w / 2), MM(y + hh / 2), { align: 'center', baseline: 'middle' });
  }
}

function arcBeziers(cxm, cym, r, a0, a1) {
  const pt = deg => { const t = deg * Math.PI / 180; return { x: cxm + r * Math.cos(t), y: cym + r * Math.sin(t) }; };
  const start = pt(a0);
  const list = [];
  let a = a0, cur = start;
  while (a < a1 - 1e-6) {
    const b = Math.min(a + 90, a1);
    const kk = 4 / 3 * Math.tan((b - a) * Math.PI / 720);
    const p0 = pt(a), p3 = pt(b);
    const ra = a * Math.PI / 180, rb = b * Math.PI / 180;
    const c1 = { x: p0.x - kk * r * Math.sin(ra), y: p0.y + kk * r * Math.cos(ra) };
    const c2 = { x: p3.x + kk * r * Math.sin(rb), y: p3.y - kk * r * Math.cos(rb) };
    list.push([c1.x - cur.x, c1.y - cur.y, c2.x - cur.x, c2.y - cur.y, p3.x - cur.x, p3.y - cur.y]);
    cur = p3;
    a = b;
  }
  return { x0: start.x, y0: start.y, list };
}
function drawDonut(ctx, el, x, y, w, hh) {
  const pdf = ctx.pdf;
  const g = donutGeom(el);
  const size = Math.min(w, hh), sc = size / 100;
  const cxp = x + w / 2, cyp = y + hh / 2;
  pdf.setLineCap('butt');
  for (const s of g.segs) {
    if (s.a1 - s.a0 < 0.05) continue;
    setStroke(pdf, s.c);
    pdf.setLineWidth(MM(g.th * sc));
    const arc = arcBeziers(MM(cxp), MM(cyp), MM(g.mid * sc), s.a0, s.a1);
    pdf.lines(arc.list, arc.x0, arc.y0, [1, 1], 'S', false);
  }
}
function drawPen(ctx, el, x, y, w, hh) {
  const pdf = ctx.pdf;
  const p = el.pts || [];
  if (p.length < 4) return;
  setStroke(pdf, el.stroke || C.ink);
  pdf.setLineWidth(MM(el.sw || 4));
  pdf.setLineCap('round');
  pdf.setLineJoin('round');
  const X = i => MM(x + p[i] * w), Y = i => MM(y + p[i + 1] * hh);
  const list = [];
  let px = X(0), py = Y(0);
  for (let i = 2; i < p.length; i += 2) { const nx = X(i), ny = Y(i); list.push([nx - px, ny - py]); px = nx; py = ny; }
  pdf.lines(list, X(0), Y(0), [1, 1], 'S', false);
  pdf.setLineCap('butt');
  pdf.setLineJoin('miter');
}

/* ---------------------------------------------------------------- texte */
function handleColor(node) {
  const v = node ? getComputedStyle(node).getPropertyValue('--doc-handle').trim() : '';
  return cssColorToRgba(v) || hexToRgb(C.handle);
}
function drawHandles(pdf, x0, y0, h0, x1, y1t, y1b, hd, hb, col) {
  setFill(pdf, col || hexToRgb(C.handle));
  pdf.rect(MM(x0 - hb / 2), MM(y0), MM(hb), MM(h0), 'F');
  pdf.circle(MM(x0), MM(y0), MM(hd / 2), 'F');
  pdf.rect(MM(x1 - hb / 2), MM(y1t), MM(hb), MM(y1b - y1t), 'F');
  pdf.circle(MM(x1), MM(y1b), MM(hd / 2), 'F');
}
function drawText(ctx, el, node, x, y, w, hh) {
  const pdf = ctx.pdf;
  const s = textStyle(el);
  const cs = getComputedStyle(node);
  if (s.box === 'sel' || s.box === 'fill') {
    const bg = cssColorToRgba(cs.backgroundColor);
    if (bg && bg[3] > 0) { setFill(pdf, bg); fillRound(pdf, x, y, w, hh, parseFloat(cs.borderTopLeftRadius) || 0); }
    if (s.box === 'sel') drawHandles(pdf, x, y, hh, x + w, y, y + hh, 11, 2.5, handleColor(node));
  } else if (s.box === 'rule') {
    const bc = cssColorToRgba(cs.borderTopColor) || [20, 20, 20];
    setFill(pdf, bc);
    pdf.rect(MM(x), MM(y), MM(w), MM(parseFloat(cs.borderTopWidth) || 1.5), 'F');
  }
  drawBlockRules(ctx, node);
  drawInlineBoxes(ctx, node);
  drawWords(ctx, node);
}
/* Filets de séparation portés par les paragraphes (lignes de liste, sommaire). */
function drawBlockRules(ctx, root) {
  const pdf = ctx.pdf, pr = ctx.pr;
  for (const n of root.querySelectorAll('p')) {
    const cs = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    for (const side of ['Top', 'Bottom']) {
      const bw = parseFloat(cs['border' + side + 'Width']) || 0;
      if (bw < 0.3 || cs['border' + side + 'Style'] === 'none') continue;
      const col = cssColorToRgba(cs['border' + side + 'Color']);
      if (!col || col[3] === 0) continue;
      setFill(pdf, col);
      const yy = side === 'Top' ? r.top : r.bottom - bw;
      pdf.rect(MM(r.left - pr.left), MM(yy - pr.top), MM(r.width), MM(bw), 'F');
    }
  }
}
function drawInlineBoxes(ctx, root) {
  const pdf = ctx.pdf, pr = ctx.pr;
  for (const n of root.querySelectorAll('mark, span')) {
    const cs = getComputedStyle(n);
    const bg = cssColorToRgba(cs.backgroundColor);
    if (!bg || bg[3] === 0) continue;
    const rects = [...n.getClientRects()].filter(r => r.width > 0.5);
    if (!rects.length) continue;
    setFill(pdf, bg);
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    for (const r of rects) {
      const x = r.left - pr.left, y = r.top - pr.top;
      fillRound(pdf, x, y, r.width, r.height, rad);
    }
    if (n.tagName === 'MARK' && n.classList.contains('sel')) {
      const fs = parseFloat(cs.fontSize) || 18;
      const hd = Math.max(9, 0.145 * fs), hb = Math.max(2, 0.026 * fs);
      const a = rects[0], b = rects[rects.length - 1];
      drawHandles(pdf, a.left - pr.left, a.top - pr.top, a.height, b.right - pr.left, b.top - pr.top, b.bottom - pr.top, hd, hb, handleColor(n));
    }
  }
}
function chooseFam(famKey, bold, ital, cp) {
  const order = [famKey, 'sans', 'serif'].filter((k, i, a) => FAM[k] && a.indexOf(k) === i);
  for (const fk of order) {
    const F = FAM[fk];
    const ik = 'i' + (bold ? '6' : '4'), nk = 'n' + (bold ? '6' : '4');
    const key = ital && F.files[ik] ? ik : (F.files[nk] ? nk : 'n4');
    const file = F.files[key];
    if (file && covers(file, cp)) return { id: fk + key, fam: fk, key, pdf: F.pdf, style: PDFSTYLE[key] };
  }
  return null;
}
function drawWords(ctx, root) {
  const pr = ctx.pr;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node;
  while ((node = walker.nextNode())) {
    const text = node.data;
    if (!text || !/\S/.test(text)) continue;
    const par = node.parentElement;
    const cs = getComputedStyle(par);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const fam = famKeyFromCss(cs.fontFamily);
    const fs = parseFloat(cs.fontSize);
    const bold = (parseInt(cs.fontWeight, 10) || 400) >= 500;
    const ital = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';
    const col = cssColorToRgba(cs.color) || [20, 20, 20, 1];
    const ls = cs.letterSpacing === 'normal' ? 0 : (parseFloat(cs.letterSpacing) || 0);
    const up = cs.textTransform === 'uppercase';
    let run = null;
    const flush = () => { if (run) { emitRun(ctx, run); run = null; } };
    for (let i = 0; i < text.length; i++) {
      const cp = text.codePointAt(i);
      const len = cp > 0xFFFF ? 2 : 1;
      const ch = text.substr(i, len);
      if (/\s/.test(ch)) { flush(); i += len - 1; continue; }
      range.setStart(node, i);
      range.setEnd(node, i + len);
      i += len - 1;
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const rc = rects[0];
      if (rc.width === 0 && rc.height === 0) continue;
      const f = chooseFam(fam, bold, ital, cp);
      if (!f) { flush(); continue; }
      const top = rc.top - pr.top;
      if (run && (Math.abs(run.top - top) > 0.6 || run.f.id !== f.id)) flush();
      if (!run) run = { text: '', x: rc.left - pr.left, top, f, fs, col, ls, up, n: 0 };
      run.text += ch;
      run.n++;
      run.x1 = rc.right - pr.left;
    }
    flush();
  }
}
function emitRun(ctx, run) {
  const pdf = ctx.pdf;
  pdf.setFont(run.f.pdf, run.f.style);
  pdf.setFontSize(run.fs * PT_PER_PX);
  pdf.setTextColor(run.col[0], run.col[1], run.col[2]);
  const str = run.up ? run.text.toLocaleUpperCase('fr-FR') : run.text;
  const F = FAM[run.f.fam];
  const base = run.top + (F.ascK[run.f.key] || F.asc) * run.fs;
  // le PDF n'applique pas le crénage : on recale l'approche pour retrouver la largeur mesurée à l'écran
  let cs = run.ls ? MM(run.ls) : 0;
  const n = [...str].length;
  if (n > 1 && run.x1 > run.x) {
    const target = MM(run.x1 - run.x - (run.ls || 0));
    const fit = (target - pdf.getTextWidth(str)) / (n - 1);
    const lim = MM(run.fs) * 0.12;
    if (Math.abs(fit) < lim) cs = fit;
  }
  pdf.text(str, MM(run.x), MM(base), { baseline: 'alphabetic', charSpace: cs });
}
