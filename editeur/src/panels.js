/* ==========================================================================
   Inspecteur, fenêtres, menus, accueil.
   ========================================================================== */
function sec(title, ...kids) { return h('section', { class: 'isec' }, title ? h('h3', null, title) : null, ...kids); }
function row(label, ...ctrls) { return h('div', { class: 'irow' }, h('span', { class: 'ilab' }, label), h('div', { class: 'ictl' }, ...ctrls)); }
function numIn(value, onChange, o = {}) {
  const wrap = h('label', { class: 'num' + (o.disabled ? ' dis' : '') });
  const inp = h('input', { type: 'number', value: value == null ? '' : round(value, o.dec == null ? 1 : o.dec), step: o.step || 1, 'data-k': o.k || null, 'aria-label': o.aria || o.unit || 'valeur' });
  if (o.min != null) inp.min = o.min;
  if (o.max != null) inp.max = o.max;
  inp.disabled = !!o.disabled || !canEdit();
  inp.addEventListener('change', () => { const v = parseFloat(String(inp.value).replace(',', '.')); if (!isNaN(v)) onChange(v); });
  wrap.append(inp);
  if (o.unit) wrap.append(h('span', { class: 'u' }, o.unit));
  return wrap;
}
function selIn(value, options, onChange, aria) {
  const s = h('select', { 'aria-label': aria || 'choix' });
  for (const [v, l] of options) { const opt = h('option', { value: v }, l); if (String(v) === String(value)) opt.selected = true; s.append(opt); }
  s.disabled = !canEdit();
  s.addEventListener('change', () => onChange(s.value));
  return s;
}
function segIn(value, options, onChange) {
  const g = h('div', { class: 'segs', role: 'group' });
  for (const [v, l, icon] of options) {
    const b = h('button', { class: 'seg' + (String(v) === String(value) ? ' on' : ''), title: l, 'aria-label': l, html: icon ? ic(icon, 16) : esc(l) });
    b.disabled = !canEdit();
    b.onclick = () => onChange(v);
    g.append(b);
  }
  return g;
}
function togIn(value, onChange, label) {
  const b = h('button', { class: 'switch' + (value ? ' on' : ''), role: 'switch', 'aria-checked': value ? 'true' : 'false', 'aria-label': label || '' }, h('i'));
  b.disabled = !canEdit();
  b.onclick = () => onChange(!value);
  return b;
}
function swIn(value, onChange, allowNone, extra = []) {
  const g = h('div', { class: 'sws' });
  if (allowNone) {
    const b = h('button', { class: 'sw none' + (!value ? ' on' : ''), title: allowNone === true ? 'Aucune' : allowNone, 'aria-label': allowNone === true ? 'Aucune' : allowNone });
    b.onclick = () => onChange(null);
    g.append(b);
  }
  for (const c of [...extra, ...SWATCHES]) {
    const b = h('button', { class: 'sw' + (value && value.toLowerCase() === c.toLowerCase() ? ' on' : ''), title: c, 'aria-label': c, style: { background: c } });
    b.disabled = !canEdit();
    b.onclick = () => onChange(c);
    g.append(b);
  }
  const pick = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#888888', title: 'Autre couleur', 'aria-label': 'Autre couleur' });
  pick.disabled = !canEdit();
  pick.addEventListener('change', () => onChange(pick.value.toUpperCase()));
  g.append(pick);
  return g;
}
function btn(label, onClick, cls = '', icon) {
  const b = h('button', { class: 'btn ' + cls, html: (icon ? ic(icon, 15) : '') + `<span>${esc(label)}</span>` });
  b.onclick = onClick;
  return b;
}
/* applique une propriété à tous les éléments sélectionnés */
function setProp(fn) {
  if (S.editing) exitEdit();
  mutate(() => { for (const id of S.sel) { const el = getEl(id); if (el) fn(el); } });
}

function renderInspector() {
  const box = UI.insp;
  if (!box || !S.meta) return;
  box.innerHTML = '';
  const p = curPage();
  if (!p) return;
  const els = S.sel.map(getEl).filter(Boolean);
  if (!canEdit()) box.append(h('p', { class: 'ro' }, 'Lecture seule : tu peux feuilleter, présenter et exporter.'));
  if (!els.length) pagePanel(box, p);
  else if (els.length > 1) multiPanel(box, els);
  else elPanel(box, els[0]);
}
function syncInspector() {
  if (S.sel.length !== 1) return;
  const el = getEl(S.sel[0]);
  if (!el) return;
  const vals = { x: el.x / PXMM, y: el.y / PXMM, w: el.w / PXMM, h: elH(el) / PXMM, r: el.r || 0 };
  for (const [k, v] of Object.entries(vals)) {
    const inp = UI.insp.querySelector(`input[data-k="${k}"]`);
    if (inp && document.activeElement !== inp) inp.value = round(v, 1);
  }
}

const TYPE_NAMES = { text: 'Texte', image: 'Image', shape: 'Forme', chart: 'Graphique', draw: 'Dessin', video: 'Vidéo' };
function elLabel(el) {
  if (el.t === 'text') {
    if (el.toc) return 'Sommaire automatique';
    const t = (el.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return (STYLES[el.st] ? STYLES[el.st].label : 'Texte') + ' · ' + (t.slice(0, 26) || '…');
  }
  if (el.t === 'image') return el.src ? 'Image' : 'Cadre photo · ' + (el.ph || '').slice(0, 22);
  if (el.t === 'shape') return { rect: 'Rectangle', ellipse: 'Cercle', tri: 'Triangle' }[el.shape] || 'Forme';
  return TYPE_NAMES[el.t] || el.t;
}

function pagePanel(box, p) {
  const i = S.meta.order.indexOf(p.id);
  box.append(h('div', { class: 'ihead' }, h('span', { class: 'ikind' }, 'Page ' + String(i + 1).padStart(2, '0')), h('span', { class: 'ititle' }, p.name || 'Page')));
  const name = h('input', { type: 'text', value: p.name || '', 'aria-label': 'Nom de la page', class: 'txtin' });
  name.disabled = !canEdit();
  name.addEventListener('change', () => mutate(pp => { pp.name = name.value.trim(); }, { render: false }));
  box.append(sec('Page',
    row('Nom', name),
    row('Chapitre', selIn(p.chapter, CHAPTERS.map(c => [c.id, (c.num ? c.num + ' · ' : '') + c.name]), v => { mutate(pp => { pp.chapter = v; }); renderSidebar(); }, 'Chapitre')),
    row('Récit', selIn(p.beat || '—', BEATS.map(b => [b, b]), v => { mutate(pp => { pp.beat = v; }); renderSidebar(); }, 'Temps du récit Save the Cat')),
    row('Fond', swIn(p.bg || '#FFFFFF', v => mutate(pp => { pp.bg = v || '#FFFFFF'; }))),
    row('En-tête', togIn(p.chrome.header !== false, v => mutate(pp => { pp.chrome.header = v; }), 'En-tête courant')),
    row('Folio', togIn(p.chrome.folio !== false, v => mutate(pp => { pp.chrome.folio = v; }), 'Numéro de page')),
    row('Transition', segIn(p.transition || 'fade', [['fade', 'Fondu'], ['slide', 'Glissé'], ['none', 'Aucune']], v => mutate(pp => { pp.transition = v; }, { render: false })))
  ));
  const notes = h('textarea', { rows: 5, 'aria-label': 'Notes et conseils', placeholder: 'Notes, choses à faire… (non exportées)' }, p.notes || '');
  notes.disabled = !canEdit();
  notes.addEventListener('change', () => mutate(pp => { pp.notes = notes.value; }, { render: false }));
  box.append(sec('Notes & conseils', notes));
  const layers = h('div', { class: 'layers' });
  [...p.els].reverse().forEach(el => {
    const it = h('div', { class: 'layer' + (el.lock ? ' locked' : '') },
      h('span', { class: 'lt' }, elLabel(el)),
      h('button', { class: 'mini', title: el.lock ? 'Déverrouiller' : 'Verrouiller', 'aria-label': el.lock ? 'Déverrouiller' : 'Verrouiller', html: ic(el.lock ? 'lock' : 'unlock', 13),
        onclick: ev => { ev.stopPropagation(); mutate(() => { el.lock = !el.lock; }); } }));
    it.onclick = () => { S.sel = [el.id]; drawOverlay(); renderInspector(); };
    layers.append(it);
  });
  box.append(sec('Calques (du premier plan au fond)', layers));
  box.append(sec('', h('div', { class: 'ibtns' },
    btn('Dupliquer la page', () => duplicatePage(p.id), 'ghost', 'dup'),
    btn('Supprimer la page', () => askDeletePage(p.id), 'ghost danger', 'trash'))));
}

function geomSection(el) {
  const autoH = el.t === 'text' && el.autoH !== false;
  const set = (k, v) => setProp(e => { e[k] = Math.round(v * PXMM); });
  return sec('Position & taille',
    h('div', { class: 'grid2' },
      row('X', numIn(el.x / PXMM, v => set('x', v), { unit: 'mm', k: 'x', aria: 'Position horizontale en mm' })),
      row('Y', numIn(el.y / PXMM, v => set('y', v), { unit: 'mm', k: 'y', aria: 'Position verticale en mm' })),
      row('L', numIn(el.w / PXMM, v => setProp(e => { e.w = Math.max(12, Math.round(v * PXMM)); }), { unit: 'mm', k: 'w', aria: 'Largeur en mm' })),
      row('H', numIn(elH(el) / PXMM, v => setProp(e => { e.h = Math.max(4, Math.round(v * PXMM)); if (e.t === 'text') e.autoH = false; }), { unit: 'mm', k: 'h', disabled: autoH, aria: 'Hauteur en mm' })),
      row('Rot.', numIn(el.r || 0, v => setProp(e => { e.r = ((v % 360) + 360) % 360; }), { unit: '°', k: 'r', aria: 'Rotation en degrés' })),
      row('Opac.', numIn(Math.round((el.o == null ? 1 : el.o) * 100), v => setProp(e => { e.o = clamp(v, 5, 100) / 100; }), { unit: '%', min: 5, max: 100, dec: 0, aria: 'Opacité en %' }))),
    row('Aligner', segIn('', [['lm', 'Aligner à gauche (marge)', 'al'], ['cm', 'Centrer horizontalement', 'ac'], ['rm', 'Aligner à droite (marge)', 'ar'], ['tm', 'Aligner en haut (marge)', 'at'], ['vm', 'Centrer verticalement', 'av'], ['bm', 'Aligner en bas (marge)', 'ab']], v => alignSel(v))),
    row('Ordre', segIn('', [['front', 'Premier plan', 'up'], ['forward', 'Avancer ( ] )', 'fw'], ['backward', 'Reculer ( [ )', 'bw'], ['back', 'Arrière-plan', 'down']], v => arrange(v))),
    h('div', { class: 'ibtns' },
      btn(el.lock ? 'Déverrouiller' : 'Verrouiller', () => setProp(e => { e.lock = !e.lock; }), 'ghost', el.lock ? 'unlock' : 'lock'),
      btn('Dupliquer', () => { begin(); duplicateSelection(true); endHist(); markDirty(S.cur); refreshThumb(S.cur); }, 'ghost', 'dup'),
      btn('Supprimer', deleteSelection, 'ghost danger', 'trash')));
}
Object.assign(ICON, {
  al: '<path d="M4 4v16M8 8h10M8 16h6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  ac: '<path d="M12 4v16M6 8h12M8 16h8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  ar: '<path d="M20 4v16M6 8h10M10 16h6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  at: '<path d="M4 4h16M8 8v10M16 8v6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  av: '<path d="M4 12h16M8 6v12M16 8v8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  ab: '<path d="M4 20h16M8 6v10M16 10v6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  fw: '<rect x="8" y="8" width="11" height="11" fill="currentColor" opacity=".5"/><rect x="4" y="4" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  bw: '<rect x="4" y="4" width="11" height="11" fill="currentColor" opacity=".5"/><rect x="8" y="8" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  tl: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  tc: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  tr: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  tj: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
});

function animSection(els) {
  const el = els[0];
  const types = [['none', 'Aucune'], ['fade', 'Fondu'], ['rise', 'Montée'], ['reveal', 'Révélation (volet)'], ['zoom', 'Zoom'], ['select', 'Sélection (surlignage qui se tire)']];
  return sec('Animation en présentation',
    row('Entrée', selIn((el.anim && el.anim.type) || 'none', types, v => setProp(e => { e.anim = { ...(e.anim || {}), type: v }; }), 'Animation d’entrée')),
    row('Délai', numIn(el.anim && el.anim.delay != null ? el.anim.delay : '', v => setProp(e => { e.anim = { ...(e.anim || { type: 'fade' }), delay: clamp(Math.round(v), 0, 8000) }; }), { unit: 'ms', step: 100, dec: 0, aria: 'Délai en millisecondes' })),
    h('p', { class: 'hint' }, 'Sans délai, les éléments apparaissent l’un après l’autre, dans l’ordre des calques.'));
}

function elPanel(box, el) {
  box.append(h('div', { class: 'ihead' }, h('span', { class: 'ikind' }, TYPE_NAMES[el.t] || el.t), h('span', { class: 'ititle' }, elLabel(el))));
  if (el.t === 'text') textPanel(box, el);
  if (el.t === 'image') imagePanel(box, el);
  if (el.t === 'video') videoPanel(box, el);
  if (el.t === 'shape') shapePanel(box, el);
  if (el.t === 'chart') chartPanel(box, el);
  if (el.t === 'draw') box.append(sec('Trait',
    row('Couleur', swIn(el.stroke || C.ink, v => setProp(e => { e.stroke = v || C.ink; }))),
    row('Épaisseur', numIn(el.sw || 4, v => setProp(e => { e.sw = clamp(v, 1, 60); }), { unit: 'px', dec: 0 }))));
  box.append(geomSection(el));
  box.append(animSection([el]));
}
function textPanel(box, el) {
  const s = textStyle(el);
  const styleOpts = Object.entries(STYLES).map(([k, v]) => [k, v.label]);
  box.append(sec('Texte',
    !el.toc ? h('div', { class: 'ibtns' }, btn('Modifier le texte', () => enterEdit(el.id, null, null, false), 'primary small', 'text')) : h('p', { class: 'hint' }, 'Sommaire automatique : il se met à jour avec les chapitres et les numéros de page.'),
    row('Style', selIn(el.st, styleOpts, v => setProp(e => { e.st = v; for (const k of TEXT_KEYS) delete e[k]; }), 'Style de texte')),
    row('Police', segIn(s.ff, [['serif', 'Serif'], ['sans', 'Linéale']], v => setProp(e => { e.ff = v; }))),
    h('div', { class: 'grid2' },
      row('Corps', numIn(s.fs * PT_PER_PX, v => setProp(e => { e.fs = Math.max(4, round(v / PT_PER_PX, 2)); }), { unit: 'pt', step: 0.5, aria: 'Taille en points' })),
      row('Interl.', numIn(s.lh, v => setProp(e => { e.lh = clamp(v, 0.7, 3); }), { step: 0.05, dec: 2, aria: 'Interlignage' })),
      row('Appr.', numIn(Math.round(s.ls * 1000), v => setProp(e => { e.ls = clamp(v, -100, 400) / 1000; }), { step: 10, dec: 0, aria: 'Approche en millièmes de cadratin' }))),
    row('Graisse', segIn(s.fw >= 500 ? 600 : 400, [[400, 'Normal'], [600, 'Semi-gras']], v => setProp(e => { e.fw = +v; }))),
    row('Forme', h('div', { class: 'flexrow' },
      h('span', { class: 'mini-l' }, 'Italique'), togIn(!!s.it, v => setProp(e => { e.it = v; }), 'Italique'),
      h('span', { class: 'mini-l' }, 'Capitales'), togIn(!!s.up, v => setProp(e => { e.up = v; }), 'Capitales'))),
    row('Alignement', segIn(s.al || 'left', [['left', 'Gauche', 'tl'], ['center', 'Centré', 'tc'], ['right', 'Droite', 'tr'], ['justify', 'Justifié', 'tj']], v => setProp(e => { e.al = v; }))),
    row('Couleur', swIn(el.col || null, v => setProp(e => { e.col = v; }), 'Automatique')),
    row('Cadre', segIn(s.box || 'none', [['none', 'Aucun'], ['sel', 'Sélection'], ['fill', 'Fond'], ['rule', 'Filet']], v => setProp(e => { e.box = v; if (v !== 'sel' && v !== 'fill') e.pad = null; }))),
    s.box === 'fill' || s.box === 'sel' ? row('Fond', swIn(el.bg || null, v => setProp(e => { e.bg = v; }), 'Par défaut')) : null,
    row('Hauteur', segIn(el.autoH === false ? 'fixed' : 'auto', [['auto', 'Automatique'], ['fixed', 'Fixe']], v => setProp(e => { if (v === 'auto') e.autoH = true; else { e.h = elH(e); e.autoH = false; } }))),
    el.autoH === false ? row('Vertical', segIn(el.va || 'top', [['top', 'Haut'], ['middle', 'Milieu'], ['bottom', 'Bas']], v => setProp(e => { e.va = v; }))) : null
  ));
}
function imagePanel(box, el) {
  const ph = h('input', { type: 'text', class: 'txtin', value: el.ph || '', 'aria-label': 'Texte du cadre vide' });
  ph.disabled = !canEdit();
  ph.addEventListener('change', () => setProp(e => { e.ph = ph.value; }));
  box.append(sec('Image',
    h('div', { class: 'ibtns' },
      btn(el.src ? 'Remplacer…' : 'Importer…', () => pickFile('image/*', f => addFiles(f, null, el)), 'primary small', 'image'),
      el.src ? btn('Recadrer', () => enterCrop(el.id), 'ghost small', 'crop') : null,
      el.src ? btn('Vider le cadre', () => setProp(e => { e.src = ''; }), 'ghost small') : null),
    el.src ? row('Ajustement', segIn(el.fit || 'cover', [['cover', 'Remplir'], ['contain', 'Contenir']], v => setProp(e => { e.fit = v; }))) : null,
    el.src ? row('Zoom', numIn(Math.round((el.zoom || 1) * 100), v => setProp(e => { e.zoom = clamp(v, 100, 400) / 100; }), { unit: '%', step: 5, dec: 0 })) : null,
    el.src ? row('Noir & blanc', togIn(!!el.gray, v => setProp(e => { e.gray = v; }), 'Noir et blanc')) : null,
    !el.src ? row('Consigne', ph) : null,
    h('p', { class: 'hint' }, el.src ? 'Double-clique sur l’image pour la recadrer. Glisse une photo dessus pour la remplacer.' : 'Glisse une photo depuis ton ordinateur sur le cadre, ou colle-la (Ctrl+V).')));
}
function videoPanel(box, el) {
  box.append(sec('Vidéo',
    h('div', { class: 'ibtns' }, btn('Remplacer…', () => pickFile('video/mp4,video/webm', f => addFiles(f, null, el)), 'primary small', 'video')),
    row('Ajustement', segIn(el.fit || 'cover', [['cover', 'Remplir'], ['contain', 'Contenir']], v => setProp(e => { e.fit = v; }))),
    row('En boucle', togIn(el.loop !== false, v => setProp(e => { e.loop = v; }), 'Lecture en boucle')),
    h('p', { class: 'hint' }, 'En présentation, la vidéo se lance seule. Dans le PDF, elle est remplacée par son image de couverture.')));
}
function shapePanel(box, el) {
  box.append(sec('Forme',
    row('Type', segIn(el.shape || 'rect', [['rect', 'Rectangle', 'rect'], ['ellipse', 'Cercle', 'ellipse'], ['tri', 'Triangle', 'tri']], v => setProp(e => { e.shape = v; }))),
    row('Fond', swIn(el.fill || null, v => setProp(e => { e.fill = v; }), true)),
    el.shape !== 'tri' ? row('Contour', swIn(el.stroke || null, v => setProp(e => { e.stroke = v; if (v && !e.sw) e.sw = 2; }), true)) : null,
    el.shape !== 'tri' && el.stroke ? row('Épaisseur', numIn(el.sw || 0, v => setProp(e => { e.sw = clamp(v, 0, 60); }), { unit: 'px', dec: 1, step: 0.5 })) : null,
    el.shape === 'rect' ? row('Arrondi', numIn(el.rad || 0, v => setProp(e => { e.rad = clamp(v, 0, 600); }), { unit: 'px', dec: 0 })) : null));
}
ICON.tri = '<path d="M12 5l8 14H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>';
function chartPanel(box, el) {
  const rows = (el.data || []).map((d, i) => h('div', { class: 'segrow' },
    numIn(d.v, v => setProp(e => { e.data[i].v = Math.max(0, v); }), { dec: 1, aria: 'Valeur' }),
    (() => { const t = h('input', { type: 'text', class: 'txtin small', value: d.l || '', 'aria-label': 'Libellé' }); t.addEventListener('change', () => setProp(e => { e.data[i].l = t.value; })); return t; })(),
    (() => { const c = h('input', { type: 'color', value: d.c || '#888888', 'aria-label': 'Couleur' }); c.addEventListener('change', () => setProp(e => { e.data[i].c = c.value.toUpperCase(); })); return c; })(),
    h('button', { class: 'mini danger', title: 'Retirer', 'aria-label': 'Retirer ce segment', html: ic('close', 12), onclick: () => setProp(e => { e.data.splice(i, 1); }) })));
  box.append(sec('Graphique en anneau',
    h('div', { class: 'segrows' }, ...rows),
    h('div', { class: 'ibtns' }, btn('Ajouter un segment', () => setProp(e => { e.data.push({ v: 10, c: SWATCHES[(e.data.length + 4) % SWATCHES.length], l: 'Part' }); }), 'ghost small')),
    row('Trou central', numIn(Math.round((el.hole || 0) * 100), v => setProp(e => { e.hole = clamp(v, 0, 85) / 100; }), { unit: '%', dec: 0, step: 5 })),
    row('Départ', numIn(el.start == null ? -90 : el.start, v => setProp(e => { e.start = v; }), { unit: '°', dec: 0, step: 15 })),
    h('p', { class: 'hint' }, 'Les libellés ne sont pas dessinés : ajoute des textes à côté du graphique.')));
}
function multiPanel(box, els) {
  box.append(h('div', { class: 'ihead' }, h('span', { class: 'ikind' }, 'Sélection'), h('span', { class: 'ititle' }, els.length + ' éléments')));
  box.append(sec('Aligner entre eux',
    segIn('', [['l', 'Bords gauches', 'al'], ['c', 'Centres horizontaux', 'ac'], ['r', 'Bords droits', 'ar'], ['t', 'Hauts', 'at'], ['v', 'Centres verticaux', 'av'], ['b', 'Bas', 'ab']], v => alignSel(v)),
    h('div', { class: 'ibtns' }, btn('Répartir horizontalement', () => distribute('x'), 'ghost small'), btn('Répartir verticalement', () => distribute('y'), 'ghost small'))));
  box.append(sec('Ordre', segIn('', [['front', 'Premier plan', 'up'], ['forward', 'Avancer', 'fw'], ['backward', 'Reculer', 'bw'], ['back', 'Arrière-plan', 'down']], v => arrange(v)),
    h('div', { class: 'ibtns' },
      btn('Dupliquer', () => { begin(); duplicateSelection(true); endHist(); markDirty(S.cur); refreshThumb(S.cur); }, 'ghost', 'dup'),
      btn('Supprimer', deleteSelection, 'ghost danger', 'trash'))));
  box.append(animSection(els));
}
function distribute(axis) {
  const els = S.sel.map(getEl).filter(Boolean);
  if (els.length < 3) { toast('Sélectionne au moins trois éléments.'); return; }
  mutate(() => {
    const key = axis, size = axis === 'x' ? 'w' : 'h';
    const sorted = [...els].sort((a, b) => a[key] - b[key]);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const total = sorted.reduce((s, e) => s + (size === 'h' ? elH(e) : e.w), 0);
    const span = (last[key] + (size === 'h' ? elH(last) : last.w)) - first[key];
    const gap = (span - total) / (sorted.length - 1);
    let pos = first[key];
    for (const e of sorted) { e[key] = Math.round(pos); pos += (size === 'h' ? elH(e) : e.w) + gap; }
  });
}

/* ---------------------------------------------------------------- fenêtres */
function openModal(content, cls = '') {
  const m = $('#modal');
  m.innerHTML = '';
  const card = h('div', { class: 'mcard ' + cls, role: 'dialog', 'aria-modal': 'true' });
  card.append(h('button', { class: 'mclose ib', 'aria-label': 'Fermer', html: ic('close'), onclick: closeModal }), content);
  m.append(card);
  m.hidden = false;
  m.onclick = e => { if (e.target === m && !m.dataset.locked) closeModal(); };
  requestAnimationFrame(() => m.classList.add('in'));
  return card;
}
function closeModal() {
  const m = $('#modal');
  if (m.dataset.locked) return;
  m.classList.remove('in');
  m.hidden = true;
  m.innerHTML = '';
}
function confirmBox(title, text, okLabel, onOk, danger = true) {
  openModal(h('div', { class: 'confirm' }, h('h2', null, title), h('p', null, text),
    h('div', { class: 'mbtns' }, btn('Annuler', closeModal, 'ghost'), btn(okLabel, () => { closeModal(); onOk(); }, danger ? 'danger-solid' : 'primary'))), 'small');
}
function openGallery() {
  if (!canEdit()) { toast('Lecture seule.', 'warn'); return; }
  const grid = h('div', { class: 'lgrid' });
  for (const L of LAYOUTS) {
    const page = { id: 'preview', chapter: 'c1', bg: L.bg || '#FFFFFF', chrome: { header: false, folio: false }, els: L.build() };
    const th = h('div', { class: 'lthumb' }, h('div', { class: 'tscale' }, renderPage(page, 'thumb', 0)));
    const card = h('button', { class: 'lcard' }, th, h('span', null, L.name));
    card.onclick = () => { closeModal(); addPage(L); };
    grid.append(card);
  }
  openModal(h('div', null, h('h2', null, 'Nouvelle page'), h('p', { class: 'msub' }, 'Choisis une mise en page : tout reste modifiable ensuite. La page est ajoutée après la page courante.'), grid), 'wide');
}
function openMoreMenu(anchor) {
  const items = [
    ['Sauvegarde du projet (.json)', exportBackup],
    ['Importer une sauvegarde…', importBackup],
    ['Raccourcis clavier', openHelp],
    ['Réinitialiser à partir du modèle…', () => confirmBox('Réinitialiser tout le dossier ?', `Toutes les pages seront remplacées par le modèle d’origine (${templateCount()} pages). Fais une sauvegarde avant si besoin.`, 'Réinitialiser', () => createFromTemplate(true))]
  ];
  const menu = h('div', { class: 'menu', role: 'menu' });
  for (const [l, f] of items) menu.append(h('button', { role: 'menuitem', onclick: () => { menu.remove(); f(); } }, l));
  menu.append(h('p', { class: 'menu-note' }, S.backend.kind === 'cloud' ? 'Le dossier est enregistré en ligne, avec cette page : les personnes qui y ont accès en écriture voient les mêmes pages.' : S.backend.kind === 'local' ? 'Le dossier est enregistré dans ce navigateur uniquement : fais des sauvegardes .json régulières.' : 'Rien n’est enregistré ici : fais une sauvegarde .json avant de fermer.'));
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = r.bottom + 6 + 'px';
  menu.style.right = (window.innerWidth - r.right) + 'px';
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('pointerdown', off); } }), 0);
}
function openHelp() {
  const rows = [['Double-clic', 'Modifier un texte · recadrer une image'], ['Glisser un fichier', 'Ajouter ou remplacer une photo, une vidéo'], ['Ctrl + Z / Ctrl + Maj + Z', 'Annuler / rétablir'],
    ['Ctrl + D', 'Dupliquer'], ['Ctrl + C / Ctrl + V', 'Copier / coller (aussi d’une page à l’autre)'], ['Suppr', 'Supprimer'], ['Flèches (Maj : ×10)', 'Déplacer de 0,25 mm'],
    ['Alt + glisser', 'Dupliquer en déplaçant'], ['Maj + glisser', 'Contraindre / garder les proportions'], ['Ctrl + glisser', 'Sans magnétisme'],
    ['Ctrl + E (en écrivant)', 'Surligner avec la sélection bleue'], ['« ’ » « : » « ? » « ! »', 'Typographie française automatique en écrivant'],
    ['T · I · R · L · D', 'Texte · image · rectangle · ligne · dessin'], ['G', 'Grille'], ['P', 'Présenter'], ['Page préc. / suiv.', 'Changer de page'], ['Ctrl + molette', 'Zoomer']];
  openModal(h('div', null, h('h2', null, 'Raccourcis'), h('dl', { class: 'keys' }, ...rows.flatMap(([k, d]) => [h('dt', null, k), h('dd', null, d)]))));
}

/* ---------------------------------------------------------------- sauvegardes */
async function saveFile(filename, blob) {
  if (CAP.downloads) {
    try { await CAP.downloads.save({ filename, data: blob }); return 'saved'; }
    catch (e) {
      if (e && e.code === 'declined') return 'declined';
      if (e && (e.code === 'rate_limited')) { toast('Un enregistrement est déjà en attente.', 'warn'); return 'busy'; }
      if (e && e.code === 'too_large') { toast('Fichier trop lourd pour cette destination : choisis une qualité plus légère.', 'warn', 6000); return 'too_large'; }
    }
  }
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return 'saved';
}
async function exportBackup() {
  const pages = S.meta.order.map(id => clone(S.pages.get(id))).filter(Boolean);
  // les photos importées sont intégrées au fichier : la sauvegarde se rouvre partout
  for (const p of pages) for (const el of p.els) for (const k of ['src', 'poster']) {
    const ref = el[k];
    if (ref && /^(idb|mem|asset):/.test(ref)) {
      try { const b = await (await fetch(imgURL(ref))).blob(); el[k] = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); } catch (e) {}
    }
  }
  const data = JSON.stringify({ app: 'sarments-editeur', v: 1, savedAt: new Date().toISOString(), meta: S.meta, pages });
  const name = 'sarments-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json';
  const r = await saveFile(name, new Blob([data], { type: 'application/json' }));
  if (r === 'saved') toast('Sauvegarde enregistrée.');
}
function importBackup() {
  const inp = $('#jsonin');
  inp.value = '';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.pages) || !data.meta) throw new Error('format');
      confirmBox('Remplacer le dossier par cette sauvegarde ?', `${data.pages.length} pages, enregistrées le ${new Date(data.savedAt || Date.now()).toLocaleDateString('fr-FR')}.`, 'Remplacer', async () => {
        const tk = toastProgress('Import de la sauvegarde…');
        for (const p of data.pages) for (const el of p.els) for (const k of ['src', 'poster']) {
          if (el[k] && el[k].startsWith('data:')) {
            try { const b = await (await fetch(el[k])).blob(); el[k] = await S.backend.putBlob(b, b.type); } catch (e) { el[k] = ''; }
          }
        }
        structChange(() => {
          for (const id of [...S.pages.keys()]) { S.pages.delete(id); deletePageNow(id); }
          for (const p of data.pages) { S.pages.set(p.id, p); markDirty(p.id); }
          S.meta = { ...data.meta, order: data.pages.map(p => p.id) };
          markMeta();
        });
        tk();
        openProject();
        toast('Sauvegarde importée.');
      });
    } catch (e) { toast('Ce fichier n’est pas une sauvegarde de l’éditeur.', 'warn'); }
  };
  inp.click();
}

/* ---------------------------------------------------------------- accueil & démarrage */
function showOnboard(state) {
  const ob = $('#onboard');
  ob.hidden = false;
  ob.innerHTML = '';
  const be = S.backend;
  const note = !be ? 'Connexion à ton espace…' : be.kind === 'cloud'
    ? (be.canWrite ? 'Ton dossier sera enregistré en ligne, avec cette page.' : 'Lecture seule : demande à la personne qui a créé le dossier de te donner l’accès en écriture.')
    : be.kind === 'local' ? 'Ton dossier sera enregistré dans ce navigateur. Pense aux sauvegardes .json.' : 'Mode sans enregistrement : fais une sauvegarde .json avant de fermer.';
  const inner = h('div', { class: 'ob-in' },
    h('p', { class: 'ob-k' }, 'Éditeur de dossier · A3 paysage'),
    h('h1', { class: 'ob-t' }, h('span', { class: 'ob-mark' }, 'Sarments')),
    h('p', { class: 'ob-s' }, typo('Matière première, seconde vie : création d\'une marque produit')));
  if (state === 'empty' && be && be.canWrite) {
    const go = btn(`Ouvrir le dossier pré-rempli · ${templateCount()} pages`, () => createFromTemplate(false), 'primary big');
    const blank = btn('Commencer un dossier vierge', createBlank, 'ghost big');
    inner.append(h('div', { class: 'ob-actions' }, go, blank));
    inner.append(h('ul', { class: 'ob-list' },
      h('li', null, 'Les 15 temps du Save the Cat, du brief à la conclusion'),
      h('li', null, 'Tes textes corrigés, tes photos, des cadres pour celles qui manquent'),
      h('li', null, 'Tout se déplace, se redimensionne, se réécrit'),
      h('li', null, 'Présentation animée et export PDF page par page')));
  } else if (state === 'empty') {
    inner.append(h('p', { class: 'ob-wait' }, 'Le dossier n’a pas encore été créé.'));
  } else {
    inner.append(h('p', { class: 'ob-wait' }, h('span', { class: 'spin' }), state === 'creating' ? 'Création des pages…' : 'Chargement…'));
  }
  inner.append(h('p', { class: 'ob-note' }, note));
  ob.append(inner);
}
let _tplCount = 0;
function templateCount() { return _tplCount || (_tplCount = buildDossier().pages.length); }
async function createFromTemplate(reset) {
  if (!canEdit()) return;
  const btns = $$('#onboard button');
  btns.forEach(b => { b.disabled = true; });
  const { meta, pages } = buildDossier();
  if (reset) {
    structChange(() => {
      for (const id of [...S.pages.keys()]) { S.pages.delete(id); deletePageNow(id); }
      for (const p of pages) S.pages.set(p.id, p);
      S.meta = { ...meta, title: (S.meta && S.meta.title) || meta.title };
    });
  } else {
    S.meta = meta;
    for (const p of pages) S.pages.set(p.id, p);
  }
  showOnboard('creating');
  const lab = $('#onboard .ob-wait');
  let done = 0;
  const queue = [...pages];
  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      try { await S.backend.savePage(cleanPage(p)); } catch (e) { SAVE.pages.add(p.id); }
      done++;
      if (lab) lab.lastChild.textContent = `Création des pages… ${done} / ${pages.length}`;
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  try { await S.backend.saveMeta(clone(S.meta)); } catch (e) { SAVE.meta = true; }
  if (SAVE.pages.size || SAVE.meta) scheduleSave(500);
  openProject();
}
async function createBlank() {
  const page = PAGE('ouv', '—', 'Couverture', [T('<mark class="sel">Titre</mark>', 84, 790, 1100, 'cover')], { header: false, folio: false });
  S.meta = { title: 'Nouveau dossier', brand: 'Sarments', order: [page.id], v: 1, createdAt: Date.now() };
  S.pages = new Map([[page.id, page]]);
  try { await S.backend.savePage(cleanPage(page)); await S.backend.saveMeta(clone(S.meta)); } catch (e) { markDirty(page.id); markMeta(); }
  openProject();
}
function openProject() {
  // l'ordre ne garde que les pages présentes, puis ajoute les pages orphelines
  const order = (S.meta.order || []).filter(id => S.pages.has(id));
  for (const id of S.pages.keys()) if (!order.includes(id)) order.push(id);
  S.meta.order = order;
  if (!S.pages.has(S.cur)) S.cur = order[0];
  $('#onboard').hidden = true;
  UI.app.hidden = false;
  UI.ptitle.value = S.meta.title || 'Dossier';
  setSaveState(S.backend.canWrite ? 'saved' : 'readonly');
  renderSidebar();
  S.fit = true;
  renderStage();
  renderInspector();
  refreshUndoButtons();
}
function onRemoteMeta(meta) {
  if (SAVE.meta || SAVE.busy) return;
  if (S.meta && same(meta, S.meta)) return;
  if (S.editing || DRAG || S.crop) return;
  const keepZoom = !UI.app.hidden;
  S.meta = meta;
  if (!S.pages.size) return;
  if (keepZoom) {
    S.meta.order = (S.meta.order || []).filter(id => S.pages.has(id));
    if (!S.pages.has(S.cur)) S.cur = S.meta.order[0];
    UI.ptitle.value = S.meta.title || 'Dossier';
    renderSidebar();
    renderStage();
    renderInspector();
  } else openProject();
}
function onRemotePage(page) {
  const local = S.pages.get(page.id);
  const recent = Date.now() - (SAVE.lastLocal[page.id] || 0) < 5000;
  if (SAVE.pages.has(page.id) || recent) return;
  if (local && same({ ...local, updatedAt: 0 }, { ...page, updatedAt: 0 })) return;
  if (S.cur === page.id && (S.editing || DRAG || S.crop)) return;
  S.pages.set(page.id, page);
  if (UI.app.hidden || !S.meta) return;
  if (!S.meta.order.includes(page.id)) return;
  if (S.cur === page.id) { renderStage(); renderInspector(); }
  refreshThumb(page.id);
}
function onRemoteRemove(id) {
  if (!S.pages.has(id) || (S.meta && S.meta.order.includes(id))) return;
  S.pages.delete(id);
}

async function boot() {
  await loadFonts();
  buildShell();
  showOnboard('loading');
  S.backend = await pickBackend();
  let data = { meta: null, pages: [] };
  try { data = await S.backend.loadAll(); }
  catch (e) { toast('Chargement impossible : ' + errText(e), 'warn', 6000); }
  for (const p of data.pages) if (p && p.id && Array.isArray(p.els)) S.pages.set(p.id, p);
  if (data.meta && S.pages.size) { S.meta = data.meta; openProject(); }
  else if (!data.meta && S.pages.size) { S.meta = { title: 'Dossier', brand: 'Sarments', order: [...S.pages.keys()], v: 1 }; openProject(); }
  else showOnboard('empty');
  S.backend.subscribe(onRemoteMeta, onRemotePage, onRemoteRemove);
  if (S.backend.kind === 'memory') toast('Enregistrement indisponible dans ce navigateur : utilise « Sauvegarde du projet ».', 'warn', 7000);
}
