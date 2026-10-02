/* ==========================================================================
   Éditeur : état, coquille, pages, scène, sélection, interactions.
   ========================================================================== */
const S = {
  backend: null, meta: null, pages: new Map(), cur: null, sel: [], zoom: 0.5, fit: true,
  editing: null, crop: null, tool: 'select', grid: false, snap: true, clip: null, busy: false
};
const UI = {};

/* ---------------------------------------------------------------- utilitaires d'état */
const curPage = () => S.pages.get(S.cur);
const getEl = id => { const p = curPage(); return p ? p.els.find(e => e.id === id) : null; };
const elNode = id => UI.phost.querySelector(`.el[data-id="${id}"]`);
const canEdit = () => S.backend && S.backend.canWrite;
function elH(el) {
  if (el.t === 'text' && el.autoH !== false) {
    const n = elNode(el.id);
    if (n) { el.h = n.offsetHeight; }
  }
  return el.h;
}

/* ---------------------------------------------------------------- historique */
const HIST = { undo: [], redo: [], open: null };
function begin(pid = S.cur) {
  if (HIST.open && HIST.open.pid === pid) return;
  endHist();
  const p = S.pages.get(pid);
  if (p) HIST.open = { kind: 'page', pid, before: clone(p) };
}
function endHist() {
  const o = HIST.open;
  if (!o) return;
  HIST.open = null;
  const p = S.pages.get(o.pid);
  if (!p) return;
  const after = clone(p);
  if (same(after, o.before)) return;
  HIST.undo.push({ kind: 'page', pid: o.pid, before: o.before, after });
  HIST.redo.length = 0;
  if (HIST.undo.length > 120) HIST.undo.shift();
  refreshUndoButtons();
}
function snapStruct() {
  return { order: [...S.meta.order], pages: Object.fromEntries([...S.pages].map(([id, p]) => [id, clone(p)])) };
}
function structChange(fn) {
  endHist();
  const before = snapStruct();
  const r = fn();
  const after = snapStruct();
  HIST.undo.push({ kind: 'struct', before, after });
  HIST.redo.length = 0;
  refreshUndoButtons();
  return r;
}
function applyPageState(pid, state) {
  if (state) { S.pages.set(pid, clone(state)); markDirty(pid); }
  if (pid === S.cur) { S.sel = S.sel.filter(id => getEl(id)); renderStage(); }
  refreshThumb(pid);
}
function applyStruct(st) {
  for (const [id, p] of Object.entries(st.pages)) {
    const cur = S.pages.get(id);
    if (!cur || !same(cur, p)) { S.pages.set(id, clone(p)); markDirty(id); }
  }
  for (const id of [...S.pages.keys()]) if (!st.pages[id]) { S.pages.delete(id); deletePageNow(id); }
  S.meta.order = [...st.order];
  markMeta();
  if (!S.pages.has(S.cur)) S.cur = S.meta.order[0];
  S.sel = [];
  renderSidebar();
  renderStage();
}
function undo() {
  if (S.editing) exitEdit();
  endHist();
  const e = HIST.undo.pop();
  if (!e) return;
  if (e.kind === 'page') { if (S.cur !== e.pid && S.pages.has(e.pid)) goPage(e.pid); applyPageState(e.pid, e.before); }
  else applyStruct(e.before);
  HIST.redo.push(e);
  refreshUndoButtons();
  renderInspector();
}
function redo() {
  if (S.editing) exitEdit();
  endHist();
  const e = HIST.redo.pop();
  if (!e) return;
  if (e.kind === 'page') { if (S.cur !== e.pid && S.pages.has(e.pid)) goPage(e.pid); applyPageState(e.pid, e.after); }
  else applyStruct(e.after);
  HIST.undo.push(e);
  refreshUndoButtons();
  renderInspector();
}
function refreshUndoButtons() {
  if (!UI.undo) return;
  UI.undo.disabled = !HIST.undo.length && !HIST.open;
  UI.redo.disabled = !HIST.redo.length;
}
/* Modifie la page courante en une étape d'historique. */
function mutate(fn, opts = {}) {
  const p = curPage();
  if (!p || !canEdit()) return;
  begin(p.id);
  fn(p);
  endHist();
  markDirty(p.id);
  if (opts.render !== false) renderStage();
  refreshThumb(p.id);
  if (opts.inspector !== false) renderInspector();
}

/* ---------------------------------------------------------------- icônes */
const ICON = {
  undo: '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)"/>',
  redo: '<path d="M15 7l5 5-5 5M20 12H9a5 5 0 000 10h2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)"/>',
  select: '<path d="M6 3l12 9-6 1.2L9.5 20z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  title: '<path d="M5 6h14M12 6v13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  text: '<path d="M5 6h14M5 11h14M5 16h9" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  keep: '<rect x="4" y="7" width="16" height="10" fill="currentColor" opacity=".35"/><path d="M4 5v12M20 7v12" stroke="currentColor" stroke-width="1.6"/><circle cx="4" cy="5" r="2" fill="currentColor"/><circle cx="20" cy="19" r="2" fill="currentColor"/>',
  num: '<text x="12" y="17" text-anchor="middle" font-size="13" font-family="Georgia,serif" fill="currentColor">93</text>',
  quote: '<path d="M6 10c0-2 1-3 3-3M6 10v4h3v-4H6zM14 10c0-2 1-3 3-3M14 10v4h3v-4h-3z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  image: '<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 16l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="15.5" cy="9" r="1.5" fill="currentColor"/>',
  frame: '<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2"/><path d="M12 9v6M9 12h6" stroke="currentColor" stroke-width="1.6"/>',
  video: '<rect x="3" y="6" width="13" height="12" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 10l5-3v10l-5-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  rect: '<rect x="5" y="6" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  ellipse: '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  line: '<path d="M4 19L20 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  chart: '<path d="M12 4a8 8 0 108 8h-8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2.5A8 8 0 0121.5 10H14z" fill="currentColor" opacity=".5"/>',
  pen: '<path d="M4 20c3-1 4-4 6-7s5-7 8-8c1 2-1 5-3 7s-6 5-11 8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  toc: '<path d="M5 7h2M10 7h9M5 12h2M10 12h9M5 17h2M10 17h9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  grid: '<path d="M4 4h16v16H4zM9.3 4v16M14.6 4v16" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  magnet: '<path d="M6 4v8a6 6 0 0012 0V4h-4v8a2 2 0 01-4 0V4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  more: '<circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/>',
  dup: '<rect x="8" y="8" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 15V5h10" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  lock: '<rect x="6" y="11" width="12" height="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 11V8a3.5 3.5 0 017 0v3" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  unlock: '<rect x="6" y="11" width="12" height="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 11V8a3.5 3.5 0 016.8-1.2" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  italic: '<path d="M10 5h8M6 19h8M14 5l-4 14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  mark: '<rect x="4" y="8" width="16" height="9" fill="#BCDBEF"/><path d="M4 6v11M20 8v11" stroke="#0087F0" stroke-width="1.6"/><circle cx="4" cy="6" r="1.8" fill="#0087F0"/><circle cx="20" cy="19" r="1.8" fill="#0087F0"/>',
  list: '<circle cx="5.5" cy="7" r="1.4" fill="currentColor"/><circle cx="5.5" cy="12" r="1.4" fill="currentColor"/><circle cx="5.5" cy="17" r="1.4" fill="currentColor"/><path d="M10 7h10M10 12h10M10 17h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  clear: '<path d="M6 5h12M12 5l-3 14M4 20L20 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  crop: '<path d="M7 3v14h14M3 7h14v14" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.6"/>'
};
const ic = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICON[k] || ''}</svg>`;

/* ---------------------------------------------------------------- coquille */
function buildShell() {
  const app = $('#app');
  app.innerHTML = `
  <header id="top">
    <div class="t-left">
      <span class="logo" aria-hidden="true"><i></i>S</span>
      <div class="t-title"><input id="ptitle" aria-label="Nom du projet" spellcheck="false"><span id="savest" class="savest"></span></div>
    </div>
    <div class="t-mid">
      <button id="b-undo" class="ib" title="Annuler (Ctrl+Z)" aria-label="Annuler">${ic('undo')}</button>
      <button id="b-redo" class="ib" title="Rétablir (Ctrl+Maj+Z)" aria-label="Rétablir">${ic('redo')}</button>
      <span class="sep"></span>
      <button id="b-zout" class="ib" title="Dézoomer (−)" aria-label="Dézoomer">−</button>
      <button id="b-zlab" class="zlab" title="Ajuster à l'écran (0)">Ajuster</button>
      <button id="b-zin" class="ib" title="Zoomer (+)" aria-label="Zoomer">+</button>
      <span class="sep"></span>
      <button id="b-grid" class="ib tog" title="Grille (G)" aria-label="Grille">${ic('grid')}</button>
      <button id="b-snap" class="ib tog on" title="Magnétisme (repères)" aria-label="Magnétisme">${ic('magnet')}</button>
    </div>
    <div class="t-right">
      <button id="b-present" class="btn ghost" title="Présenter en plein écran (P)">${ic('play', 14)}<span>Présenter</span></button>
      <button id="b-export" class="btn primary">Exporter en PDF</button>
      <button id="b-more" class="ib" title="Plus" aria-label="Plus d'options">${ic('more')}</button>
    </div>
  </header>
  <aside id="left">
    <div class="l-head"><span>Pages</span><span id="pcount"></span></div>
    <div id="plist" role="listbox" aria-label="Pages du dossier"></div>
    <div class="l-foot"><button id="b-addpage" class="btn primary wide">+ Nouvelle page</button></div>
  </aside>
  <main id="stage">
    <div id="viewport"><div id="board"><div id="pframe"><div id="phost"></div><div id="ov"></div></div></div></div>
    <div id="toolbar" role="toolbar" aria-label="Insérer"></div>
    <div id="ttb" class="floatbar" hidden></div>
    <div id="cropbar" class="floatbar" hidden></div>
    <div id="pinfo"></div>
  </main>
  <aside id="right"><div id="insp"></div></aside>`;
  Object.assign(UI, {
    app, ptitle: $('#ptitle'), savest: $('#savest'), undo: $('#b-undo'), redo: $('#b-redo'), zlab: $('#b-zlab'),
    plist: $('#plist'), pcount: $('#pcount'), viewport: $('#viewport'), board: $('#board'), pframe: $('#pframe'),
    phost: $('#phost'), ov: $('#ov'), toolbar: $('#toolbar'), ttb: $('#ttb'), cropbar: $('#cropbar'), insp: $('#insp'), pinfo: $('#pinfo')
  });
  UI.undo.onclick = undo;
  UI.redo.onclick = redo;
  $('#b-zout').onclick = () => zoomStep(-1);
  $('#b-zin').onclick = () => zoomStep(1);
  UI.zlab.onclick = () => { S.fit = true; layoutBoard(); };
  $('#b-grid').onclick = e => { S.grid = !S.grid; e.currentTarget.classList.toggle('on', S.grid); drawOverlay(); };
  $('#b-snap').onclick = e => { S.snap = !S.snap; e.currentTarget.classList.toggle('on', S.snap); };
  $('#b-present').onclick = () => startPresent(S.meta.order.indexOf(S.cur));
  $('#b-export').onclick = openExport;
  $('#b-more').onclick = e => openMoreMenu(e.currentTarget);
  $('#b-addpage').onclick = () => openGallery();
  UI.ptitle.addEventListener('change', () => { S.meta.title = UI.ptitle.value.trim() || 'Dossier'; markMeta(); });
  buildToolbar();
  bindStage();
  bindKeys();
  window.addEventListener('resize', () => { if (S.fit) layoutBoard(); else drawOverlay(); });
  window.addEventListener('beforeunload', e => {
    if (SAVE.pages.size || SAVE.meta || SAVE.busy) { flushSave(); e.preventDefault(); e.returnValue = ''; }
  });
}

function setSaveState(state, extra) {
  if (!UI.savest) return;
  const be = S.backend;
  const map = {
    saved: be && be.kind === 'cloud' ? 'Enregistré' : be && be.kind === 'local' ? 'Enregistré dans ce navigateur' : 'Non enregistré',
    dirty: 'Modifications…', saving: 'Enregistrement…', error: extra || 'Erreur d’enregistrement', readonly: 'Lecture seule'
  };
  UI.savest.textContent = map[state] || '';
  UI.savest.className = 'savest s-' + state + (be && be.kind === 'memory' ? ' s-mem' : '');
}

let toastTimer = null;
function toast(msg, kind = '', ms = 3200) {
  const box = $('#toasts');
  const t = h('div', { class: 'toast ' + kind, role: 'status' }, msg);
  box.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms);
}

/* ---------------------------------------------------------------- barre d'outils (insertion) */
function buildToolbar() {
  const tools = [
    ['select', 'Sélection (V)', 'select'], '|',
    ['title', 'Titre', 'title'], ['text', 'Texte (T)', 'text'], ['keep', 'À retenir', 'keep'], ['num', 'Chiffre clé', 'num'], ['quote', 'Citation', 'quote'], '|',
    ['image', 'Importer une image (I)', 'image'], ['frame', 'Cadre photo vide', 'frame'], ['video', 'Vidéo (MP4, WebM)', 'video'], '|',
    ['rect', 'Rectangle (R)', 'rect'], ['ellipse', 'Cercle', 'ellipse'], ['line', 'Ligne (L)', 'line'], ['chart', 'Graphique en anneau', 'chart'], ['pen', 'Dessin à main levée (D)', 'pen'], ['toc', 'Sommaire automatique', 'toc']
  ];
  UI.toolbar.innerHTML = '';
  for (const t of tools) {
    if (t === '|') { UI.toolbar.append(h('span', { class: 'tsep' })); continue; }
    const [k, label, icon] = t;
    const b = h('button', { class: 'tb', 'data-tool': k, title: label, 'aria-label': label, html: ic(icon, 20) });
    b.onclick = () => toolAction(k);
    UI.toolbar.append(b);
  }
  setTool('select');
}
function setTool(t) {
  S.tool = t;
  $$('#toolbar .tb').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  UI.viewport && UI.viewport.classList.toggle('pen', t === 'pen');
}
function viewCenter() {
  const vr = UI.viewport.getBoundingClientRect(), pr = UI.phost.getBoundingClientRect();
  const x = ((vr.left + vr.width / 2) - pr.left) / S.zoom, y = ((vr.top + vr.height / 2) - pr.top) / S.zoom;
  return { x: clamp(x, 120, PW - 120), y: clamp(y, 120, PH - 120) };
}
function insertEl(el, opts = {}) {
  if (!canEdit()) { toast('Lecture seule.', 'warn'); return null; }
  if (S.editing) exitEdit();
  const c = viewCenter();
  if (opts.center !== false) { el.x = Math.round(c.x - el.w / 2); el.y = Math.round(c.y - (el.h || 60) / 2); }
  mutate(p => p.els.push(el), { inspector: false });
  S.sel = [el.id];
  drawOverlay();
  renderInspector();
  if (el.t === 'text' && opts.edit !== false) requestAnimationFrame(() => enterEdit(el.id, null, null, true));
  return el;
}
function toolAction(k) {
  if (!canEdit() && k !== 'select') { toast('Lecture seule.', 'warn'); return; }
  const presets = {
    title: () => T('<p>Titre</p><p class="ind"><mark class="sel">de la page</mark></p>', 0, 0, 760, 'h2', { anim: { type: 'select' } }),
    text: () => T('Double-clique pour écrire.', 0, 0, 626, 'body'),
    keep: () => KEEP('À retenir : une phrase qui résume la page.', 0, 0, 626),
    num: () => T('00 %', 0, 0, 360, 'num'),
    quote: () => T('« Une phrase forte. »', 0, 0, 900, 'quote')
  };
  if (presets[k]) { setTool('select'); insertEl(presets[k]()); return; }
  switch (k) {
    case 'select': setTool('select'); break;
    case 'pen': setTool(S.tool === 'pen' ? 'select' : 'pen'); if (S.tool === 'pen') toast('Dessine sur la page. Échap pour revenir à la sélection.'); break;
    case 'image': pickFile('image/*', files => addFiles(files)); break;
    case 'video': pickFile('video/mp4,video/webm', files => addFiles(files)); break;
    case 'frame': setTool('select'); insertEl(FRAME('Glisse une photo ici', 0, 0, 600, 420), { edit: false }); break;
    case 'rect': setTool('select'); insertEl(R(0, 0, 360, 240, C.sel), { edit: false }); break;
    case 'ellipse': setTool('select'); insertEl(ELL(0, 0, 220, 220, C.green), { edit: false }); break;
    case 'line': setTool('select'); insertEl(LINE(0, 0, 500, 2, C.ink), { edit: false }); break;
    case 'chart': setTool('select'); insertEl(DONUT(0, 0, 300, [{ v: 60, c: C.green, l: 'Part A' }, { v: 40, c: '#D9D3C7', l: 'Part B' }]), { edit: false }); break;
    case 'toc': setTool('select'); insertEl(T('', 0, 0, 756, 'lead', { toc: true, fs: 36, lh: 1.25 }), { edit: false }); break;
  }
}
function pickFile(accept, cb) {
  const inp = $('#filein');
  inp.accept = accept;
  inp.multiple = true;
  inp.value = '';
  inp.onchange = () => { if (inp.files && inp.files.length) cb([...inp.files]); };
  inp.click();
}
async function addFiles(files, at, target) {
  for (const [i, f] of files.entries()) {
    const tk = toastProgress('Import de « ' + (f.name || 'fichier') + ' »…');
    try {
      const r = await ingestFile(f);
      tk();
      if (target && i === 0 && (target.t === 'image' || target.t === 'video')) { replaceMedia(target.id, r); continue; }
      const maxW = 640, maxH = 640;
      const k = Math.min(maxW / r.w, maxH / r.h, 1);
      const w = Math.round(r.w * k), hh = Math.round(r.h * k);
      let el;
      if (r.kind === 'image') el = I({ src: r.ref, nw: r.w, nh: r.h }, 0, 0, w, hh);
      else el = { id: uid(), t: 'video', x: 0, y: 0, w, h: hh, r: 0, o: 1, src: r.ref, poster: r.poster, nw: r.w, nh: r.h, fit: 'cover', fx: 0.5, fy: 0.5, loop: true, anim: { type: 'fade' } };
      if (at) { el.x = Math.round(at.x - w / 2 + i * 24); el.y = Math.round(at.y - hh / 2 + i * 24); insertEl(el, { center: false }); }
      else insertEl(el);
    } catch (e) { tk(); toast(errText(e), 'warn', 5000); }
  }
}
function toastProgress(msg) {
  const box = $('#toasts');
  const t = h('div', { class: 'toast in busy' }, msg);
  box.append(t);
  return () => { t.classList.remove('in'); setTimeout(() => t.remove(), 250); };
}
function replaceMedia(id, r) {
  mutate(p => {
    const el = p.els.find(e => e.id === id);
    if (!el) return;
    if (r.kind === 'video') {
      Object.assign(el, { t: 'video', src: r.ref, poster: r.poster, nw: r.w, nh: r.h, fit: 'cover', fx: 0.5, fy: 0.5, zoom: 1, loop: true });
    } else {
      Object.assign(el, { t: 'image', src: r.ref, nw: r.w, nh: r.h, zoom: 1, fx: 0.5, fy: 0.5 });
      if (el.fit !== 'contain') el.fit = 'cover';
    }
  });
  toast('Image remplacée.');
}

/* ---------------------------------------------------------------- liste des pages */
const THUMB_W = 196;
function renderSidebar() {
  const list = UI.plist;
  list.innerHTML = '';
  let last = null;
  S.meta.order.forEach((pid, i) => {
    const p = S.pages.get(pid);
    if (!p) return;
    if (p.chapter !== last) {
      const ch = chapterOf(p.chapter);
      list.append(h('div', { class: 'chap' }, h('span', { class: 'chap-n' }, ch.num || '·'), h('span', null, ch.name)));
      last = p.chapter;
    }
    list.append(pageItem(p, i));
  });
  UI.pcount.textContent = S.meta.order.length;
  markCurrentInList();
}
function pageItem(p, i) {
  const it = h('div', { class: 'pitem', 'data-pid': p.id, role: 'option', tabindex: '-1' });
  const th = h('div', { class: 'pthumb' });
  const sc = h('div', { class: 'tscale' });
  sc.append(renderPage(p, 'thumb', i));
  th.append(sc);
  const acts = h('div', { class: 'pacts' },
    h('button', { class: 'mini', title: 'Dupliquer la page', 'aria-label': 'Dupliquer la page', html: ic('dup', 14), onclick: e => { e.stopPropagation(); duplicatePage(p.id); } }),
    h('button', { class: 'mini danger', title: 'Supprimer la page', 'aria-label': 'Supprimer la page', html: ic('trash', 14), onclick: e => { e.stopPropagation(); askDeletePage(p.id); } }));
  it.append(h('div', { class: 'pnum' }, String(i + 1).padStart(2, '0')), th,
    h('div', { class: 'pname' }, h('span', { class: 'pn-t' }, p.name || 'Page'), p.beat && p.beat !== '—' ? h('span', { class: 'pn-b' }, p.beat) : null), acts);
  it.addEventListener('pointerdown', e => pageItemDown(e, p.id));
  return it;
}
function refreshThumb(pid) {
  clearTimeout(refreshThumb.t && refreshThumb.t[pid]);
  refreshThumb.t = refreshThumb.t || {};
  refreshThumb.t[pid] = setTimeout(() => {
    const it = UI.plist.querySelector(`.pitem[data-pid="${pid}"]`);
    const p = S.pages.get(pid);
    if (!it || !p) return;
    const sc = it.querySelector('.tscale');
    sc.replaceChildren(renderPage(p, 'thumb', S.meta.order.indexOf(pid)));
    it.querySelector('.pn-t').textContent = p.name || 'Page';
  }, 250);
}
function markCurrentInList() {
  $$('.pitem', UI.plist).forEach(n => n.classList.toggle('cur', n.dataset.pid === S.cur));
  const cur = UI.plist.querySelector('.pitem.cur');
  if (cur) {
    const lr = UI.plist.getBoundingClientRect(), r = cur.getBoundingClientRect();
    if (r.top < lr.top || r.bottom > lr.bottom) cur.scrollIntoView({ block: 'nearest' });
  }
}
function pageItemDown(e, pid) {
  if (e.button !== 0 || e.target.closest('button')) return;
  const y0 = e.clientY;
  let dragging = false, line = null, target = null;
  const move = ev => {
    if (!dragging && Math.abs(ev.clientY - y0) > 6 && canEdit()) {
      dragging = true;
      line = h('div', { class: 'dropline' });
      UI.plist.append(line);
      document.body.classList.add('dragging-page');
    }
    if (!dragging) return;
    const items = $$('.pitem', UI.plist);
    let idx = items.length;
    for (let k = 0; k < items.length; k++) {
      const r = items[k].getBoundingClientRect();
      if (ev.clientY < r.top + r.height / 2) { idx = k; break; }
    }
    target = idx;
    const ref = items[Math.min(idx, items.length - 1)];
    const lr = UI.plist.getBoundingClientRect(), rr = ref.getBoundingClientRect();
    line.style.top = ((idx < items.length ? rr.top : rr.bottom) - lr.top + UI.plist.scrollTop - 2) + 'px';
    const lb = UI.plist.getBoundingClientRect();
    if (ev.clientY < lb.top + 40) UI.plist.scrollTop -= 12;
    if (ev.clientY > lb.bottom - 40) UI.plist.scrollTop += 12;
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.classList.remove('dragging-page');
    if (line) line.remove();
    if (!dragging) { goPage(pid); return; }
    if (target != null) movePage(pid, target);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}
function goPage(pid) {
  if (!S.pages.has(pid)) return;
  if (S.editing) exitEdit();
  if (S.crop) exitCrop();
  endHist();
  S.cur = pid;
  S.sel = [];
  renderStage();
  markCurrentInList();
  renderInspector();
}
function goRel(d) {
  const i = S.meta.order.indexOf(S.cur);
  const j = clamp(i + d, 0, S.meta.order.length - 1);
  if (j !== i) goPage(S.meta.order[j]);
}

/* ---------------------------------------------------------------- opérations sur les pages */
function addPage(layout) {
  if (!canEdit()) return;
  const cur = curPage();
  const idx = S.meta.order.indexOf(S.cur);
  const page = PAGE(cur ? cur.chapter : 'c1', cur ? cur.beat : '—', layout.name, layout.build(), { bg: layout.bg });
  structChange(() => {
    S.pages.set(page.id, page);
    S.meta.order.splice(idx + 1, 0, page.id);
    markDirty(page.id);
    markMeta();
  });
  renderSidebar();
  goPage(page.id);
  toast('Page ajoutée : « ' + page.name + ' ».');
}
function duplicatePage(pid) {
  if (!canEdit()) return;
  const src = S.pages.get(pid);
  const copy = clone(src);
  copy.id = uid('p');
  copy.name = (src.name || 'Page') + ' (copie)';
  copy.els.forEach(e => { e.id = uid(); });
  structChange(() => {
    S.pages.set(copy.id, copy);
    S.meta.order.splice(S.meta.order.indexOf(pid) + 1, 0, copy.id);
    markDirty(copy.id);
    markMeta();
  });
  renderSidebar();
  goPage(copy.id);
}
function askDeletePage(pid) {
  const p = S.pages.get(pid);
  confirmBox(`Supprimer la page « ${p.name || 'Page'} » ?`, 'Tu pourras l’annuler avec Ctrl+Z.', 'Supprimer', () => deletePage(pid));
}
function deletePage(pid) {
  if (!canEdit() || S.meta.order.length <= 1) { toast('Le dossier doit garder au moins une page.', 'warn'); return; }
  const idx = S.meta.order.indexOf(pid);
  structChange(() => {
    S.meta.order.splice(idx, 1);
    S.pages.delete(pid);
    markMeta();
  });
  deletePageNow(pid);
  if (S.cur === pid) S.cur = S.meta.order[Math.min(idx, S.meta.order.length - 1)];
  renderSidebar();
  goPage(S.cur);
  toast('Page supprimée. Ctrl+Z pour annuler.');
}
function movePage(pid, toIdx) {
  const from = S.meta.order.indexOf(pid);
  if (from < 0) return;
  let to = toIdx > from ? toIdx - 1 : toIdx;
  if (to === from) return;
  structChange(() => {
    S.meta.order.splice(from, 1);
    S.meta.order.splice(to, 0, pid);
    // la page prend le chapitre de sa nouvelle voisine précédente
    const prev = S.pages.get(S.meta.order[to - 1]);
    const p = S.pages.get(pid);
    if (prev && p && prev.chapter !== p.chapter) {
      const next = S.pages.get(S.meta.order[to + 1]);
      if (!next || next.chapter === prev.chapter) { p.chapter = prev.chapter; markDirty(pid); }
    }
    markMeta();
  });
  renderSidebar();
  S.meta.order.forEach(id => refreshThumb(id));
}

/* ---------------------------------------------------------------- scène */
function layoutBoard() {
  const vp = UI.viewport;
  if (S.fit) S.zoom = Math.max(0.12, Math.min((vp.clientWidth - 96) / PW, (vp.clientHeight - 150) / PH));
  const z = S.zoom, pw = PW * z, ph = PH * z, pad = 70;
  const bw = Math.max(vp.clientWidth, pw + pad * 2), bh = Math.max(vp.clientHeight, ph + pad * 2 + 60);
  UI.board.style.width = bw + 'px';
  UI.board.style.height = bh + 'px';
  Object.assign(UI.pframe.style, { left: (bw - pw) / 2 + 'px', top: Math.max(pad - 20, (bh - ph) / 2 - 30) + 'px', width: pw + 'px', height: ph + 'px' });
  UI.phost.style.transform = `scale(${z})`;
  UI.zlab.textContent = S.fit ? 'Ajuster' : Math.round(z * 100) + ' %';
  drawOverlay();
}
const ZSTEPS = [0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5, 2, 3];
function zoomStep(d) {
  const z = S.zoom;
  let nz = d > 0 ? ZSTEPS.find(s => s > z + 0.001) : [...ZSTEPS].reverse().find(s => s < z - 0.001);
  if (!nz) return;
  setZoom(nz);
}
function setZoom(nz, cxs, cys) {
  const vp = UI.viewport;
  const r = vp.getBoundingClientRect();
  const ax = cxs == null ? r.left + r.width / 2 : cxs, ay = cys == null ? r.top + r.height / 2 : cys;
  const pr = UI.phost.getBoundingClientRect();
  const px = (ax - pr.left) / S.zoom, py = (ay - pr.top) / S.zoom;
  S.fit = false;
  S.zoom = clamp(nz, 0.1, 4);
  layoutBoard();
  const pr2 = UI.phost.getBoundingClientRect();
  vp.scrollLeft += (pr2.left + px * S.zoom) - ax;
  vp.scrollTop += (pr2.top + py * S.zoom) - ay;
  drawOverlay();
}
function renderStage() {
  const p = curPage();
  if (!p || !UI.phost) return;
  if (S.editing) return;
  UI.phost.replaceChildren(renderPage(p, 'edit', S.meta.order.indexOf(p.id)));
  UI.phost.firstChild.addEventListener('dblclick', onDblClick);
  S.sel = S.sel.filter(id => p.els.some(e => e.id === id));
  layoutBoard();
  const i = S.meta.order.indexOf(p.id);
  UI.pinfo.textContent = `Page ${i + 1} / ${S.meta.order.length} · ${p.name || ''}`;
}
function toPage(e) {
  const r = UI.phost.getBoundingClientRect();
  return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom };
}
function hitTest(pt, includeLocked = false) {
  const p = curPage();
  for (let i = p.els.length - 1; i >= 0; i--) {
    const el = p.els[i];
    if (el.lock && !includeLocked) continue;
    const hh = elH(el);
    // test dans le repère de l'élément (rotation)
    const cxe = el.x + el.w / 2, cye = el.y + hh / 2;
    const a = -(el.r || 0) * Math.PI / 180;
    const dx = pt.x - cxe, dy = pt.y - cye;
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= el.w / 2 && Math.abs(ly) <= hh / 2) return el;
  }
  return null;
}

/* ---------------------------------------------------------------- calque de sélection */
function drawOverlay(guides) {
  const ov = UI.ov;
  if (!ov) return;
  const z = S.zoom;
  ov.innerHTML = '';
  ov.style.width = PW * z + 'px';
  ov.style.height = PH * z + 'px';
  const p = curPage();
  if (!p) return;
  if (S.grid) {
    const g = h('div', { class: 'gridov' });
    for (let c = 1; c <= COLS; c++) g.append(h('i', { style: { left: cx(c) * z + 'px', width: COLW * z + 'px' } }));
    g.append(h('b', { style: { left: ML * z + 'px', top: MT * z + 'px', width: (PW - ML - MR) * z + 'px', height: (PH - MT - MB) * z + 'px' } }));
    ov.append(g);
  }
  if (guides) {
    for (const gx of guides.x || []) ov.append(h('div', { class: 'guide v', style: { left: gx * z + 'px' } }));
    for (const gy of guides.y || []) ov.append(h('div', { class: 'guide h', style: { top: gy * z + 'px' } }));
  }
  if (S.crop) { drawCropOverlay(); return; }
  const single = S.sel.length === 1 ? getEl(S.sel[0]) : null;
  for (const id of S.sel) {
    const el = getEl(id);
    if (!el) continue;
    const hh = elH(el);
    const box = h('div', { class: 'selbox' + (el.lock ? ' locked' : '') + (S.editing === id ? ' editing' : ''), style: {
      left: el.x * z + 'px', top: el.y * z + 'px', width: el.w * z + 'px', height: hh * z + 'px', transform: el.r ? `rotate(${el.r}deg)` : ''
    } });
    if (single && !el.lock && S.editing !== id) {
      const autoH = el.t === 'text' && el.autoH !== false;
      const dirs = autoH ? ['e', 'w'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      for (const d of dirs) box.append(h('span', { class: 'hd hd-' + d, 'data-h': d }));
      box.append(h('span', { class: 'rot', 'data-h': 'rot', title: 'Rotation (Maj : par 15°)' }));
      const dim = h('span', { class: 'dim' }, `${round(el.w / PXMM, 1)} × ${round(hh / PXMM, 1)} mm`);
      box.append(dim);
    }
    if (el.lock) box.append(h('span', { class: 'lockb', html: ic('lock', 12) }));
    ov.append(box);
  }
  if (S.editing) positionTextBar();
}

/* ---------------------------------------------------------------- interactions sur la scène */
let DRAG = null;
function bindStage() {
  UI.viewport.addEventListener('pointerdown', onStageDown);
  UI.viewport.addEventListener('pointermove', onStageHover);
  UI.viewport.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(S.zoom * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY);
    }
  }, { passive: false });
  // glisser-déposer de fichiers
  UI.viewport.addEventListener('dragover', e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); UI.viewport.classList.add('dropping'); } });
  UI.viewport.addEventListener('dragleave', () => UI.viewport.classList.remove('dropping'));
  UI.viewport.addEventListener('drop', e => {
    UI.viewport.classList.remove('dropping');
    const files = [...(e.dataTransfer.files || [])].filter(f => /^(image|video)\//.test(f.type) || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return;
    e.preventDefault();
    const pt = toPage(e);
    const target = hitTest(pt, true);
    addFiles(files, pt, target && (target.t === 'image' || target.t === 'video') ? target : null);
  });
  document.addEventListener('paste', e => {
    if (S.editing || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
    const files = [...(e.clipboardData ? e.clipboardData.files : [])].filter(f => /^image\//.test(f.type));
    if (files.length) { e.preventDefault(); const sel = S.sel.length === 1 ? getEl(S.sel[0]) : null; addFiles(files, null, sel && sel.t === 'image' ? sel : null); return; }
    if (S.clip) { e.preventDefault(); pasteEls(); }
  });
}
function onStageHover(e) {
  if (DRAG || S.editing || S.crop || S.tool !== 'select') return;
  const pt = toPage(e);
  const el = pt.x >= 0 && pt.y >= 0 && pt.x <= PW && pt.y <= PH ? hitTest(pt) : null;
  const prev = UI.ov.querySelector('.hoverbox');
  if (prev) prev.remove();
  if (el && !S.sel.includes(el.id)) {
    const z = S.zoom;
    UI.ov.append(h('div', { class: 'hoverbox', style: { left: el.x * z + 'px', top: el.y * z + 'px', width: el.w * z + 'px', height: elH(el) * z + 'px', transform: el.r ? `rotate(${el.r}deg)` : '' } }));
  }
}
function onStageDown(e) {
  if (e.button !== 0) return;
  if (e.target.closest('#ttb, #cropbar, #toolbar')) return;
  const pt = toPage(e);
  if (S.crop) { cropDown(e); return; }
  const handle = e.target.closest('[data-h]');
  if (S.editing) {
    const n = elNode(S.editing);
    if (n && n.contains(e.target)) return; // clic dans le texte en cours d'édition
    exitEdit();
  }
  if (S.tool === 'pen' && canEdit()) { penDown(e, pt); return; }
  if (handle && S.sel.length === 1) { startHandle(e, handle.dataset.h); return; }
  const el = (pt.x >= 0 && pt.y >= 0 && pt.x <= PW && pt.y <= PH) ? hitTest(pt) : null;
  if (el) {
    if (e.shiftKey) {
      S.sel = S.sel.includes(el.id) ? S.sel.filter(i => i !== el.id) : [...S.sel, el.id];
      drawOverlay(); renderInspector();
      return;
    }
    if (!S.sel.includes(el.id)) { S.sel = [el.id]; drawOverlay(); renderInspector(); }
    if (canEdit()) startMove(e, pt);
    return;
  }
  // zone vide : sélection par cadre
  if (!e.shiftKey) { S.sel = []; renderInspector(); }
  startMarquee(e, pt);
}
function onDblClick(e) {
  const pt = toPage(e);
  let el = hitTest(pt);
  if (!el) {
    el = hitTest(pt, true);
    if (el) { S.sel = [el.id]; drawOverlay(); renderInspector(); toast('Élément verrouillé : déverrouille-le dans le panneau de droite pour le déplacer.'); return; }
    return;
  }
  if (!canEdit()) return;
  if (el.t === 'text') { if (el.toc) { toast('Le sommaire se remplit tout seul à partir des chapitres.'); return; } enterEdit(el.id, e.clientX, e.clientY); }
  else if (el.t === 'image') { if (el.src) enterCrop(el.id); else pickFile('image/*', files => addFiles(files, null, el)); }
  else if (el.t === 'video') pickFile('video/mp4,video/webm', files => addFiles(files, null, el));
}

function selectionBox(ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of ids) {
    const el = getEl(id);
    if (!el) continue;
    const hh = elH(el);
    x0 = Math.min(x0, el.x); y0 = Math.min(y0, el.y); x1 = Math.max(x1, el.x + el.w); y1 = Math.max(y1, el.y + hh);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function snapTargets(exclude) {
  const xs = [0, ML, PW / 2, PW - MR, PW], ys = [0, MT, PH / 2, PH - MB, PH];
  for (let c = 1; c <= COLS; c++) xs.push(cx(c), cx(c) + COLW);
  for (const el of curPage().els) {
    if (exclude.includes(el.id)) continue;
    const hh = elH(el);
    if (el.r) continue;
    xs.push(el.x, el.x + el.w / 2, el.x + el.w);
    ys.push(el.y, el.y + hh / 2, el.y + hh);
  }
  return { xs, ys };
}
function bestSnap(vals, targets, thr) {
  let best = null;
  for (const v of vals) for (const t of targets) {
    const d = t - v;
    if (Math.abs(d) <= thr && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, t };
  }
  return best;
}
function startMove(e, pt) {
  const ids = S.sel.filter(id => { const el = getEl(id); return el && !el.lock; });
  if (!ids.length) return;
  let moved = false, dup = e.altKey;
  const origin = new Map();
  let box0, targets;
  const thr = 7 / S.zoom;
  const move = ev => {
    const cp = toPage(ev);
    let dx = cp.x - pt.x, dy = cp.y - pt.y;
    if (!moved) {
      if (Math.hypot(dx, dy) * S.zoom < 3) return;
      moved = true;
      begin();
      if (dup) duplicateSelection(false);
      for (const id of S.sel) { const el = getEl(id); if (el && !el.lock) origin.set(id, { x: el.x, y: el.y }); }
      box0 = selectionBox([...origin.keys()]);
      targets = snapTargets([...origin.keys()]);
    }
    if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    const guides = { x: [], y: [] };
    if (S.snap && !(ev.ctrlKey || ev.metaKey)) {
      const bx = box0.x + dx, by = box0.y + dy;
      const sx = bestSnap([bx, bx + box0.w / 2, bx + box0.w], targets.xs, thr);
      const sy = bestSnap([by, by + box0.h / 2, by + box0.h], targets.ys, thr);
      if (sx) { dx += sx.d; guides.x.push(sx.t); }
      if (sy) { dy += sy.d; guides.y.push(sy.t); }
    }
    for (const [id, o] of origin) {
      const el = getEl(id);
      el.x = Math.round(o.x + dx);
      el.y = Math.round(o.y + dy);
      const n = elNode(id);
      if (n) { n.style.left = el.x + 'px'; n.style.top = el.y + 'px'; }
    }
    drawOverlay(guides);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    DRAG = null;
    if (moved) { endHist(); markDirty(S.cur); refreshThumb(S.cur); drawOverlay(); syncInspector(); }
  };
  DRAG = 'move';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}
function startHandle(e, dir) {
  const el = getEl(S.sel[0]);
  if (!el || el.lock) return;
  e.stopPropagation();
  begin();
  const node = elNode(el.id);
  const hh0 = elH(el);
  const o = { x: el.x, y: el.y, w: el.w, h: hh0, r: el.r || 0 };
  const c0 = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
  const p0 = toPage(e);
  const thr = 7 / S.zoom;
  const targets = snapTargets([el.id]);
  const ratio = o.w / Math.max(1, o.h);
  const keepRatio = el.t === 'image' || el.t === 'video' || el.t === 'chart';
  const move = ev => {
    const cp = toPage(ev);
    if (dir === 'rot') {
      let a = Math.atan2(cp.y - c0.y, cp.x - c0.x) * 180 / Math.PI + 90;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      else for (const s of [0, 90, 180, 270, 360, -90]) if (Math.abs(a - s) < 3) a = s;
      el.r = Math.round(((a % 360) + 360) % 360 * 10) / 10;
      if (el.r === 360) el.r = 0;
      node.style.transform = el.r ? `rotate(${el.r}deg)` : '';
      drawOverlay();
      return;
    }
    const rad = o.r * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    let dx = cp.x - p0.x, dy = cp.y - p0.y;
    let lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
    const guides = { x: [], y: [] };
    if (!o.r && S.snap && !(ev.ctrlKey || ev.metaKey)) {
      if (dir.includes('e')) { const s = bestSnap([o.x + o.w + lx], targets.xs, thr); if (s) { lx += s.d; guides.x.push(s.t); } }
      if (dir.includes('w')) { const s = bestSnap([o.x + lx], targets.xs, thr); if (s) { lx += s.d; guides.x.push(s.t); } }
      if (dir.includes('s')) { const s = bestSnap([o.y + o.h + ly], targets.ys, thr); if (s) { ly += s.d; guides.y.push(s.t); } }
      if (dir.includes('n')) { const s = bestSnap([o.y + ly], targets.ys, thr); if (s) { ly += s.d; guides.y.push(s.t); } }
    }
    let w = o.w + (dir.includes('e') ? lx : dir.includes('w') ? -lx : 0);
    let hh = o.h + (dir.includes('s') ? ly : dir.includes('n') ? -ly : 0);
    w = Math.max(12, w); hh = Math.max(4, hh);
    const corner = dir.length === 2;
    if ((keepRatio && corner) !== !!ev.shiftKey && corner) {
      if (w / hh > ratio) hh = w / ratio; else w = hh * ratio;
    }
    const autoH = el.t === 'text' && el.autoH !== false;
    if (autoH) hh = o.h;
    const dw = w - o.w, dh = hh - o.h;
    const cxl = dir.includes('e') ? dw / 2 : dir.includes('w') ? -dw / 2 : 0;
    const cyl = dir.includes('s') ? dh / 2 : dir.includes('n') ? -dh / 2 : 0;
    const ncx = c0.x + cxl * cos - cyl * sin, ncy = c0.y + cxl * sin + cyl * cos;
    el.w = Math.round(w);
    el.x = Math.round(ncx - w / 2);
    if (!autoH) { el.h = Math.round(hh); el.y = Math.round(ncy - hh / 2); }
    else el.y = Math.round(o.y);
    node.style.left = el.x + 'px'; node.style.top = el.y + 'px'; node.style.width = el.w + 'px';
    if (!autoH) node.style.height = el.h + 'px';
    if (el.t === 'image' && el.src) updateImageNode(el, node);
    if (el.t === 'draw') node.querySelector('.in').innerHTML = drawSVG(el);
    drawOverlay(guides);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    DRAG = null;
    endHist(); markDirty(S.cur); refreshThumb(S.cur);
    renderStage(); syncInspector();
  };
  DRAG = 'handle';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}
function updateImageNode(el, node) {
  const inn = node.querySelector('.in.im');
  if (!inn) return;
  const L = imgLayout(el);
  inn.style.backgroundSize = `${L.bw}px ${L.bh}px`;
  inn.style.backgroundPosition = `${L.bx}px ${L.by}px`;
}
function startMarquee(e, pt) {
  const z = S.zoom;
  const add = e.shiftKey ? [...S.sel] : [];
  let box = null;
  const move = ev => {
    const cp = toPage(ev);
    const x = Math.min(pt.x, cp.x), y = Math.min(pt.y, cp.y), w = Math.abs(cp.x - pt.x), hh = Math.abs(cp.y - pt.y);
    if (!box && w * z + hh * z < 4) return;
    if (!box) { box = h('div', { class: 'marquee' }); UI.ov.append(box); }
    Object.assign(box.style, { left: x * z + 'px', top: y * z + 'px', width: w * z + 'px', height: hh * z + 'px' });
    const hits = curPage().els.filter(el => !el.lock && el.x < x + w && el.x + el.w > x && el.y < y + hh && el.y + elH(el) > y).map(el => el.id);
    S.sel = [...new Set([...add, ...hits])];
    drawOverlay();
    UI.ov.append(box);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    DRAG = null;
    if (box) box.remove();
    drawOverlay();
    renderInspector();
  };
  DRAG = 'marquee';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

/* ---------------------------------------------------------------- dessin à main levée */
function penDown(e, pt) {
  const pts = [pt];
  const z = S.zoom;
  const svg = h('div', { class: 'penlive' });
  UI.ov.append(svg);
  const draw = () => {
    svg.innerHTML = `<svg width="${PW * z}" height="${PH * z}"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p.x * z + ' ' + p.y * z).join('')}" fill="none" stroke="${C.ink}" stroke-width="${4 * z}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const move = ev => { const cp = toPage(ev); const l = pts[pts.length - 1]; if (Math.hypot(cp.x - l.x, cp.y - l.y) > 1.5) { pts.push(cp); draw(); } };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    DRAG = null;
    svg.remove();
    if (pts.length < 2) return;
    const simp = simplify(pts, 1.2);
    const sw = 4, pad = sw;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of simp) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const w = Math.max(8, x1 - x0), hh = Math.max(8, y1 - y0);
    const flat = [];
    for (const p of simp) flat.push(round((p.x - x0) / w, 4), round((p.y - y0) / hh, 4));
    const el = { id: uid(), t: 'draw', x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(hh), r: 0, o: 1, pts: flat, stroke: C.ink, sw, anim: { type: 'reveal' } };
    mutate(p => p.els.push(el), { inspector: false });
    S.sel = [el.id];
    drawOverlay(); renderInspector();
  };
  DRAG = 'pen';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0, mi = -1;
    const A = pts[a], B = pts[b];
    const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((B.x - A.x) * (A.y - pts[i].y) - (A.x - pts[i].x) * (B.y - A.y)) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps && mi > 0) { keep[mi] = true; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((p, i) => keep[i]);
}

/* ---------------------------------------------------------------- recadrage des images */
function enterCrop(id) {
  const el = getEl(id);
  if (!el || !el.src || !canEdit()) return;
  if (S.editing) exitEdit();
  begin();
  S.crop = id;
  S.sel = [id];
  drawOverlay();
  const bar = UI.cropbar;
  bar.hidden = false;
  bar.innerHTML = '';
  const zr = h('input', { type: 'range', min: '1', max: '4', step: '0.01', value: el.zoom || 1, 'aria-label': 'Zoom de l’image', id: 'crop-zoom' });
  zr.oninput = () => { el.zoom = +zr.value; refreshCrop(); };
  const fit = h('button', { class: 'seg' + (el.fit === 'contain' ? ' on' : '') }, el.fit === 'contain' ? 'Contenir' : 'Remplir');
  fit.onclick = () => { el.fit = el.fit === 'contain' ? 'cover' : 'contain'; fit.textContent = el.fit === 'contain' ? 'Contenir' : 'Remplir'; refreshCrop(); };
  bar.append(h('span', { class: 'fb-l', html: ic('crop', 16) + ' Recadrage' }), h('label', { class: 'fb-r' }, 'Zoom', zr), fit,
    h('button', { class: 'btn primary small', onclick: exitCrop }, 'Terminer'));
}
function refreshCrop() {
  const el = getEl(S.crop);
  const n = elNode(S.crop);
  if (el && n) updateImageNode(el, n);
  drawOverlay();
}
function drawCropOverlay() {
  const el = getEl(S.crop);
  if (!el) return;
  const z = S.zoom;
  const L = imgLayout(el);
  const wrap = h('div', { class: 'cropwrap', style: { left: el.x * z + 'px', top: el.y * z + 'px', width: el.w * z + 'px', height: el.h * z + 'px', transform: el.r ? `rotate(${el.r}deg)` : '' } });
  const ghost = h('div', { class: 'cropghost', style: {
    left: L.bx * z + 'px', top: L.by * z + 'px', width: L.bw * z + 'px', height: L.bh * z + 'px', backgroundImage: `url("${imgURL(el.src)}")`
  } });
  wrap.append(ghost, h('div', { class: 'cropframe' }));
  UI.ov.append(wrap);
}
function cropDown(e) {
  const el = getEl(S.crop);
  const p0 = toPage(e);
  const pt = hitTest(p0, true);
  if (!pt || pt.id !== el.id) {
    // un clic hors de l'image termine le recadrage, sauf sur la barre
    if (!e.target.closest('.cropwrap')) { exitCrop(); return; }
  }
  const L0 = imgLayout(el);
  const move = ev => {
    const cp = toPage(ev);
    const dx = cp.x - p0.x, dy = cp.y - p0.y;
    const spanX = el.w - L0.bw, spanY = el.h - L0.bh;
    if (Math.abs(spanX) > 0.5) el.fx = clamp((L0.bx + dx) / spanX, 0, 1);
    if (Math.abs(spanY) > 0.5) el.fy = clamp((L0.by + dy) / spanY, 0, 1);
    refreshCrop();
  };
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); DRAG = null; };
  DRAG = 'crop';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}
function exitCrop() {
  if (!S.crop) return;
  S.crop = null;
  UI.cropbar.hidden = true;
  endHist();
  markDirty(S.cur);
  refreshThumb(S.cur);
  renderStage();
  renderInspector();
}

/* ---------------------------------------------------------------- édition de texte */
const ALLOWED = { P: ['li', 'ind', 'tight'], BR: [], B: [], STRONG: [], I: [], EM: [], MARK: ['sel'], SPAN: ['tag', 'up', 'down', 'mix', 'warn'] };
function sanitizeHTML(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  box.querySelectorAll('span[style*="background"]').forEach(sp => {
    const m = document.createElement('mark');
    m.className = 'sel';
    while (sp.firstChild) m.append(sp.firstChild);
    sp.replaceWith(m);
  });
  const walk = node => {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) continue;
      if (ch.nodeType !== 1) { ch.remove(); continue; }
      let tag = ch.tagName;
      if (tag === 'DIV') {
        const p = document.createElement('p');
        while (ch.firstChild) p.append(ch.firstChild);
        ch.replaceWith(p);
        walk(p);
        continue;
      }
      if (!(tag in ALLOWED)) {
        walk(ch);
        const frag = document.createDocumentFragment();
        while (ch.firstChild) frag.append(ch.firstChild);
        ch.replaceWith(frag);
        continue;
      }
      const cls = (ch.getAttribute('class') || '').split(/\s+/).filter(c => ALLOWED[tag].includes(c));
      for (const a of [...ch.attributes]) ch.removeAttribute(a.name);
      if (cls.length) ch.setAttribute('class', cls.join(' '));
      if (tag === 'MARK' && !cls.includes('sel')) ch.className = 'sel';
      walk(ch);
    }
  };
  walk(box);
  box.querySelectorAll('mark mark').forEach(m => { const f = document.createDocumentFragment(); while (m.firstChild) f.append(m.firstChild); m.replaceWith(f); });
  box.querySelectorAll('mark, b, i').forEach(m => { if (!m.textContent) m.remove(); });
  return box.innerHTML.replace(/&nbsp;/g, ' ');
}
const isEmptyHTML = html => !html || !html.replace(/<[^>]+>/g, '').replace(/[\s  ]/g, '');

function enterEdit(id, clientX, clientY, selectAll) {
  const el = getEl(id);
  if (!el || el.t !== 'text' || el.toc || !canEdit()) return;
  if (S.crop) exitCrop();
  begin();
  S.editing = id;
  S.sel = [id];
  const node = elNode(id);
  const tx = node.querySelector('.tx');
  node.classList.add('editing');
  tx.contentEditable = 'true';
  tx.spellcheck = true;
  tx.setAttribute('lang', 'fr');
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
  tx.focus({ preventScroll: true });
  const s = getSelection();
  let r = null;
  if (!selectAll && clientX != null && document.caretRangeFromPoint) r = document.caretRangeFromPoint(clientX, clientY);
  if (!r || !tx.contains(r.startContainer)) { r = document.createRange(); r.selectNodeContents(tx); if (!selectAll) r.collapse(false); }
  s.removeAllRanges();
  s.addRange(r);
  tx.addEventListener('input', onEditInput);
  tx.addEventListener('beforeinput', onBeforeInput);
  tx.addEventListener('paste', onEditPaste);
  showTextBar();
  drawOverlay();
  renderInspector();
}
function onEditInput() {
  const el = getEl(S.editing);
  const node = elNode(S.editing);
  if (!el || !node) return;
  el.html = node.querySelector('.tx').innerHTML;
  markDirty(S.cur);
  drawOverlay();
}
function onBeforeInput(e) {
  if (e.inputType !== 'insertText' || !e.data) return;
  const s = getSelection();
  if (!s.rangeCount) return;
  const r = s.getRangeAt(0);
  const prevChar = r.collapsed && r.startContainer.nodeType === 3 && r.startOffset > 0 ? r.startContainer.data[r.startOffset - 1] : '';
  if (e.data === "'") { e.preventDefault(); document.execCommand('insertText', false, '’'); return; }
  if (e.data === '"') {
    e.preventDefault();
    const open = !prevChar || /[\s  (\[]/.test(prevChar);
    document.execCommand('insertText', false, open ? '«' + NB : NB + '»');
    return;
  }
  if (/^[:;?!»]$/.test(e.data) && prevChar === ' ') {
    e.preventDefault();
    r.setStart(r.startContainer, r.startOffset - 1);
    s.removeAllRanges(); s.addRange(r);
    document.execCommand('insertText', false, NB + e.data);
  }
}
function onEditPaste(e) {
  e.preventDefault();
  const t = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
  if (!t) return;
  const paras = t.replace(/\r/g, '').split(/\n{2,}/);
  paras.forEach((para, i) => {
    if (i) document.execCommand('insertParagraph');
    para.split('\n').forEach((line, j) => {
      if (j) document.execCommand('insertLineBreak');
      if (line) document.execCommand('insertText', false, line);
    });
  });
}
function exitEdit() {
  const id = S.editing;
  if (!id) return;
  const el = getEl(id);
  const node = elNode(id);
  if (node) {
    const tx = node.querySelector('.tx');
    tx.removeEventListener('input', onEditInput);
    tx.removeEventListener('beforeinput', onBeforeInput);
    tx.removeEventListener('paste', onEditPaste);
    tx.contentEditable = 'false';
    if (el) el.html = sanitizeHTML(tx.innerHTML);
  }
  S.editing = null;
  UI.ttb.hidden = true;
  const sel = getSelection();
  if (sel) sel.removeAllRanges();
  const p = curPage();
  if (el && isEmptyHTML(el.html)) { p.els = p.els.filter(e => e.id !== id); S.sel = []; }
  endHist();
  markDirty(S.cur);
  renderStage();
  refreshThumb(S.cur);
  renderInspector();
}
function showTextBar() {
  const bar = UI.ttb;
  bar.innerHTML = '';
  const b = (icon, label, fn) => { const x = h('button', { class: 'ib', title: label, 'aria-label': label, html: ic(icon) }); x.addEventListener('mousedown', ev => { ev.preventDefault(); fn(); }); return x; };
  bar.append(
    b('bold', 'Gras (Ctrl+B)', () => { document.execCommand('bold'); onEditInput(); }),
    b('italic', 'Italique (Ctrl+I)', () => { document.execCommand('italic'); onEditInput(); }),
    b('mark', 'Surligner : sélection bleue (Ctrl+E)', toggleMark),
    b('list', 'Liste à puces', toggleBullet),
    b('clear', 'Effacer la mise en forme', () => { document.execCommand('removeFormat'); unmarkSelection(); onEditInput(); }),
    h('span', { class: 'tsep' }),
    h('span', { class: 'fb-hint' }, 'Échap pour terminer')
  );
  bar.hidden = false;
  positionTextBar();
}
function positionTextBar() {
  const el = getEl(S.editing);
  if (!el || UI.ttb.hidden) return;
  const fr = UI.pframe.getBoundingClientRect(), st = $('#stage').getBoundingClientRect();
  const x = fr.left - st.left + el.x * S.zoom, y = fr.top - st.top + el.y * S.zoom - 52;
  UI.ttb.style.left = Math.max(8, x) + 'px';
  UI.ttb.style.top = Math.max(8, y) + 'px';
}
function activeTx() { const n = elNode(S.editing); return n && n.querySelector('.tx'); }
function unwrap(n) { const f = document.createDocumentFragment(); while (n.firstChild) f.append(n.firstChild); n.replaceWith(f); }
function unmarkSelection() {
  const tx = activeTx();
  const s = getSelection();
  if (!tx || !s.rangeCount) return;
  const r = s.getRangeAt(0);
  tx.querySelectorAll('mark').forEach(m => { if (r.intersectsNode(m)) unwrap(m); });
}
function toggleMark() {
  const tx = activeTx();
  const s = getSelection();
  if (!tx || !s.rangeCount) return;
  const r = s.getRangeAt(0);
  const anc = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
  const m = anc && anc.closest('mark');
  if (m && tx.contains(m)) { unwrap(m); onEditInput(); return; }
  if (r.collapsed) { toast('Sélectionne d’abord les mots à surligner.'); return; }
  try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
  document.execCommand('hiliteColor', false, 'rgb(188, 219, 239)');
  try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
  tx.querySelectorAll('span[style*="background"]').forEach(sp => {
    const mk = document.createElement('mark');
    mk.className = 'sel';
    while (sp.firstChild) mk.append(sp.firstChild);
    sp.replaceWith(mk);
  });
  onEditInput();
}
function toggleBullet() {
  const tx = activeTx();
  const s = getSelection();
  if (!tx || !s.rangeCount) return;
  const r = s.getRangeAt(0);
  let ps = [...tx.querySelectorAll('p')].filter(p => r.intersectsNode(p));
  if (!ps.length) {
    const p = document.createElement('p');
    while (tx.firstChild) p.append(tx.firstChild);
    tx.append(p);
    ps = [p];
  }
  const on = !ps.every(p => p.classList.contains('li'));
  for (const p of ps) {
    p.classList.toggle('li', on);
    const first = p.firstChild;
    if (on && !(first && first.nodeType === 3 && /^[•\-–—+−]\s/.test(first.data))) p.prepend(document.createTextNode('• '));
    if (!on && first && first.nodeType === 3) first.data = first.data.replace(/^•[\s ]/, '');
  }
  onEditInput();
}

/* ---------------------------------------------------------------- copier, coller, dupliquer, supprimer */
function duplicateSelection(offset = true) {
  const p = curPage();
  const copies = [];
  for (const id of S.sel) {
    const el = getEl(id);
    if (!el) continue;
    const c = clone(el);
    c.id = uid();
    c.lock = false;
    if (offset) { c.x += 24; c.y += 24; }
    copies.push(c);
  }
  p.els.push(...copies);
  S.sel = copies.map(c => c.id);
  if (offset) { renderStage(); renderInspector(); }
  else {
    for (const c of copies) UI.phost.firstChild.append(renderEl(c, 'edit', p, S.meta.order.indexOf(p.id)));
  }
}
function copyEls() {
  if (!S.sel.length) return;
  S.clip = S.sel.map(id => clone(getEl(id))).filter(Boolean);
  toast(S.clip.length > 1 ? `${S.clip.length} éléments copiés.` : 'Élément copié.');
}
function pasteEls() {
  if (!S.clip || !canEdit()) return;
  const copies = S.clip.map(e => ({ ...clone(e), id: uid(), x: e.x + 24, y: e.y + 24, lock: false }));
  mutate(p => p.els.push(...copies), { inspector: false });
  S.clip = copies.map(clone);
  S.sel = copies.map(c => c.id);
  drawOverlay(); renderInspector();
}
function deleteSelection() {
  if (!S.sel.length || !canEdit()) return;
  const ids = new Set(S.sel);
  mutate(p => { p.els = p.els.filter(e => !ids.has(e.id)); });
  S.sel = [];
  drawOverlay(); renderInspector();
}
function arrange(where) {
  if (!S.sel.length) return;
  mutate(p => {
    const ids = new Set(S.sel);
    const picked = p.els.filter(e => ids.has(e.id)), rest = p.els.filter(e => !ids.has(e.id));
    if (where === 'front') p.els = [...rest, ...picked];
    else if (where === 'back') p.els = [...picked, ...rest];
    else {
      const arr = p.els;
      const idxs = arr.map((e, i) => ids.has(e.id) ? i : -1).filter(i => i >= 0);
      if (where === 'forward') for (const i of idxs.reverse()) { if (i < arr.length - 1 && !ids.has(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; }
      if (where === 'backward') for (const i of idxs) { if (i > 0 && !ids.has(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; }
    }
  });
}
function alignSel(how) {
  const ids = S.sel.filter(id => getEl(id));
  if (!ids.length) return;
  const box = ids.length > 1 ? selectionBox(ids) : { x: 0, y: 0, w: PW, h: PH };
  const mm = ids.length === 1 && (how.endsWith('m')) ? { x: ML, y: MT, w: PW - ML - MR, h: PH - MT - MB } : box;
  mutate(() => {
    for (const id of ids) {
      const el = getEl(id), hh = elH(el), b = how.endsWith('m') ? mm : box;
      switch (how.replace(/m$/, '')) {
        case 'l': el.x = Math.round(b.x); break;
        case 'c': el.x = Math.round(b.x + (b.w - el.w) / 2); break;
        case 'r': el.x = Math.round(b.x + b.w - el.w); break;
        case 't': el.y = Math.round(b.y); break;
        case 'v': el.y = Math.round(b.y + (b.h - hh) / 2); break;
        case 'b': el.y = Math.round(b.y + b.h - hh); break;
      }
    }
  });
}
function nudge(dx, dy) {
  const ids = S.sel.filter(id => { const el = getEl(id); return el && !el.lock; });
  if (!ids.length || !canEdit()) return;
  begin();
  for (const id of ids) {
    const el = getEl(id);
    el.x += dx; el.y += dy;
    const n = elNode(id);
    if (n) { n.style.left = el.x + 'px'; n.style.top = el.y + 'px'; }
  }
  drawOverlay();
  clearTimeout(nudge.t);
  nudge.t = setTimeout(() => { endHist(); markDirty(S.cur); refreshThumb(S.cur); syncInspector(); }, 450);
}

/* ---------------------------------------------------------------- clavier */
function bindKeys() {
  document.addEventListener('keydown', e => {
    if (!$('#present').hidden) return;
    if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    const mod = e.ctrlKey || e.metaKey;
    const tag = (document.activeElement || {}).tagName || '';
    const inField = /INPUT|TEXTAREA|SELECT/.test(tag);
    if (S.editing) {
      if (e.key === 'Escape') { e.preventDefault(); exitEdit(); }
      else if (mod && e.key.toLowerCase() === 'e') { e.preventDefault(); toggleMark(); }
      else if (mod && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'i')) { setTimeout(onEditInput, 0); }
      return;
    }
    if (inField) { if (e.key === 'Escape') document.activeElement.blur(); return; }
    if (S.crop) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); exitCrop(); } return; }
    const k = e.key;
    if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k.toLowerCase() === 'd') { e.preventDefault(); if (S.sel.length && canEdit()) { begin(); duplicateSelection(true); endHist(); markDirty(S.cur); refreshThumb(S.cur); } return; }
    if (mod && k.toLowerCase() === 'c') { if (S.sel.length) { e.preventDefault(); copyEls(); } return; }
    if (mod && k.toLowerCase() === 'a') { e.preventDefault(); S.sel = curPage().els.filter(x => !x.lock).map(x => x.id); drawOverlay(); renderInspector(); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomStep(1); return; }
    if (mod && k === '-') { e.preventDefault(); zoomStep(-1); return; }
    if (mod && k === '0') { e.preventDefault(); S.fit = true; layoutBoard(); return; }
    if (mod) return;
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); deleteSelection(); return; }
    if (k === 'Escape') { if (S.tool !== 'select') setTool('select'); else { S.sel = []; drawOverlay(); renderInspector(); } return; }
    if (k.startsWith('Arrow') && S.sel.length) {
      e.preventDefault();
      const st = e.shiftKey ? 10 : 1;
      nudge(k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0, k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0);
      return;
    }
    if (k === 'Enter' && S.sel.length === 1) {
      const el = getEl(S.sel[0]);
      if (el && el.t === 'text') { e.preventDefault(); enterEdit(el.id, null, null, true); }
      else if (el && el.t === 'image' && el.src) { e.preventDefault(); enterCrop(el.id); }
      return;
    }
    if (k === 'PageDown' || (k === 'ArrowDown' && !S.sel.length)) { e.preventDefault(); goRel(1); return; }
    if (k === 'PageUp' || (k === 'ArrowUp' && !S.sel.length)) { e.preventDefault(); goRel(-1); return; }
    const map = { v: () => setTool('select'), t: () => toolAction('text'), i: () => toolAction('image'), r: () => toolAction('rect'), l: () => toolAction('line'), d: () => toolAction('pen'),
      g: () => $('#b-grid').click(), p: () => startPresent(S.meta.order.indexOf(S.cur)), ']': () => arrange('forward'), '[': () => arrange('backward'), '?': openHelp };
    const f = map[k.toLowerCase()] || map[k];
    if (f) { e.preventDefault(); f(); }
  });
}
