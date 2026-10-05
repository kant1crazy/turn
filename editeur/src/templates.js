/* ==========================================================================
   Modèle « SARMENTS » (version 5) : grandes capitales grasses en haut à gauche,
   pages blanches, bleues et noires, photos nettes en noir et blanc, chiffres
   fins en bleu, flèches ↗ ↘ en tête des points, « À retenir » sous un court
   trait bleu. Texte courant en Minion. Positions en px de page (1680 × 1188).
   ========================================================================== */
const TPL_VERSION = 5;
const TPL_NOTE = 'Nouvelle direction artistique : grandes capitales, pages bleues et noires, photos en noir et blanc';
const IMG = {
  pile: { src: 'img/pile.jpg', nw: 1977, nh: 876 },
  mains: { src: 'img/mains.jpg', nw: 1645, nh: 2400 },
  fagots: { src: 'img/fagots.jpg', nw: 1645, nh: 2400 },
  lampes: { src: 'img/lampes.jpg', nw: 1753, nh: 1392 },
  sarment: { src: 'img/sarment-detoure.png', nw: 794, nh: 274 },
  sol: { src: 'img/usage-sol.jpg', nw: 244, nh: 248 },
  brulage: { src: 'img/usage-brulage.jpg', nw: 241, nh: 250 },
  compost: { src: 'img/usage-compost.jpg', nw: 244, nh: 249 },
  materiaux: { src: 'img/usage-materiaux.jpg', nw: 241, nh: 249 },
  mb1: { src: 'img/moodboard-1.jpg', nw: 2000, nh: 1414 },
  mb2: { src: 'img/moodboard-2.jpg', nw: 2000, nh: 1414 },
  mb3: { src: 'img/moodboard-3.jpg', nw: 2000, nh: 1414 }
};

/* Trame : titre en haut à gauche (y 96), contenu à y 300 sous un titre d'une
   ligne, à y 404 sous un titre de deux lignes, bas de page à y 1064. */
const Y0 = 96, YT = 96, YC1 = 300, YC = 404, YB = 1064, RAD = 0, GAP = 24;
const HC = YB - YC, HH2 = (HC - GAP) / 2;
const X2 = [cx(1), cx(7)], W2 = cw(6);
const X3 = [cx(1), cx(5), cx(9)], W3 = cw(4);
const X4 = [cx(1), cx(4), cx(7), cx(10)], W4 = cw(3);
const X5 = [0, 1, 2, 3, 4].map(i => ML + i * 312), W5 = 288;
const BLUE = C.blue, BLACK = C.dark;

function defaultAnim(st, html) {
  if ((st === 'h1' || st === 'h2' || st === 'cover' || st === 'lead' || st === 'quote') && /<mark/.test(html || '')) return 'select';
  if (st === 'h1' || st === 'h2' || st === 'cover' || st === 'num' || st === 'keep' || st === 'card') return 'rise';
  if (st === 'lead' || st === 'quote' || st === 'body' || st === 'small' || st === 'h3' || st === 'eyebrow') return 'fade';
  return 'none';
}
function T(html, x, y, w, st = 'body', o = {}) {
  const el = { id: uid(), t: 'text', x, y, w, h: o.h || 40, r: 0, o: 1, st, html: typo(html), autoH: !o.h };
  Object.assign(el, o);
  if (o.h) el.autoH = false;
  if (!el.anim) el.anim = { type: defaultAnim(st, el.html) };
  return el;
}
/* Photos nettes, sans arrondi ; IG les passe en noir et blanc. */
function I(img, x, y, w, hh, o = {}) {
  const base = typeof img === 'string' ? (IMG[img] || { src: '' }) : (img || { src: '' });
  return {
    id: uid(), t: 'image', x, y, w, h: hh, r: 0, o: 1, src: base.src || '', nw: base.nw || 0, nh: base.nh || 0,
    fit: 'cover', zoom: 1, fx: 0.5, fy: 0.5, gray: false, ph: '', rad: 0, anim: { type: 'fade' }, ...o
  };
}
const IG = (img, x, y, w, hh, o = {}) => I(img, x, y, w, hh, { gray: true, ...o });
const FRAME = (text, x, y, w, hh, o = {}) => I(null, x, y, w, hh, { ph: typo(text), ...o });
function R(x, y, w, hh, fill, o = {}) {
  return { id: uid(), t: 'shape', shape: 'rect', x, y, w, h: hh, r: 0, o: 1, fill, stroke: null, sw: 0, rad: 0, anim: { type: 'none' }, ...o };
}
const ELL = (x, y, w, hh, fill, o = {}) => R(x, y, w, hh, fill, { shape: 'ellipse', ...o });
const LINE = (x, y, w, thick = 1.5, color = C.hair, o = {}) => R(x, y, w, thick, color, o);
const BOX = (x, y, w, hh, fill = C.card, o = {}) => R(x, y, w, hh, fill, o);
function DONUT(x, y, size, data, o = {}) {
  return { id: uid(), t: 'chart', kind: 'donut', x, y, w: size, h: size, r: 0, o: 1, hole: 0, start: -90, data, anim: { type: 'zoom' }, ...o };
}
function PAGE(chapter, beat, name, els, o = {}) {
  return {
    id: uid('p'), chapter, beat, name: typo(name), bg: o.bg || '#FFFFFF',
    chrome: { header: o.header !== false, folio: o.folio !== false },
    notes: typo(o.notes || ''), els
  };
}

/* Fragments de texte structuré */
const K = (label, cls = '') => `<p class="k${cls ? ' ' + cls : ''}">${label}</p>`;
const TT = s => `<p class="t">${s}</p>`;
const AR = a => `<p class="ar">${a}</p>`;
const ROWS = (arr, cls = '') => arr.map((s, i) => `<p class="row${cls ? ' ' + cls : ''}${i ? '' : ' first'}">${s}</p>`).join('');
const FIELDS = arr => arr.map(([l, t], i) => `<p class="k g row${i ? '' : ' first'}">${l}</p><p>${t}</p>`).join('');
const PILLS = arr => `<p>${arr.map(a => `<span class="pill">${a}</span>`).join('')}</p>`;
const LI = arr => arr.map(s => `<p class="li">${s}</p>`).join('');
const ARROWS = (arr, a = '↘') => arr.map((s, i) => `<p class="row${i ? '' : ' first'}"><span class="acc">${a}</span>  ${s}</p>`).join('');
const N2 = i => String(i + 1).padStart(2, '0');

/* Titre en capitales : une ligne par entrée du tableau. */
function TTL(lines, x = ML, y = YT, w = 1536, o = {}) {
  const { st = 'h2', ...rest } = o;
  const arr = Array.isArray(lines) ? lines : [lines];
  const el = T(arr.map(s => `<p>${s}</p>`).join(''), x, y, w, st, rest);
  el.w = Math.min(w, natW(el) + 48);
  return el;
}
const LEAD = (html, x, y, w, o = {}) => T(html, x, y, w, 'lead', { fs: 40, lh: 1.14, ...o });
/* Un point : flèche (↗ ↘), surtitre, intertitre, texte. */
function ITEM(title, desc, x, y, w, o = {}) {
  const { ar, k, kc, sub, ...rest } = o;
  const html = (ar ? AR(ar) : '') + (k ? K(k, kc || '') : '') + (title ? TT(title) : '') + (desc ? `<p${sub ? ' class="s"' : ''}>${desc}</p>` : '');
  return T(html, x, y, w, 'body', rest);
}
/* Chiffre clé : grand chiffre fin, légende dessous. */
function STAT(n, cap, x, y, w, o = {}) {
  const num = T(n, x, y, w, 'num', { fs: o.fs || 120, ...(o.col ? { col: o.col } : {}) });
  const c = T(cap, x, y + natH(num) + (o.gap || 14), w, o.capSt || 'body', { fs: 17, tone: 'sub', ...(o.capO || {}) });
  return [num, c];
}
/* Carte : un aplat discret, rare dans cette version. */
function CARD(html, x, y, w, hh, o = {}) { return T(html, x, y, w, 'card', hh ? { h: hh, ...o } : o); }
/* « À retenir » : un court trait bleu, puis la phrase. */
function KEEP(text, x, y, w, o = {}) {
  const { label, ...rest } = o;
  return T('<p class="kb"><span class="kbar"></span></p>' + (label ? K(label) : '') + `<p>${text}</p>`, x, y, w, 'keep', rest);
}
function TITLE(a, b, x = ML, y = YT, w = 1536, st = 'h2', o = {}) {
  const html = b == null ? `<p>${a}</p>` : b === '' ? `<p><mark class="sel">${a}</mark></p>` : `<p>${a}</p><p><mark class="sel">${b}</mark></p>`;
  return T(html, x, y, w, st, o);
}
function HEAD(eb, a, b, o = {}) {
  return [TTL(b ? [a, b] : [a], o.x == null ? ML : o.x, YT, o.w || 1536, o.t || {})];
}

/* Mesures dans la page (polices chargées) : ancrer en bas, égaliser une rangée. */
let MEAS = null;
function measureH(el, bg = '#FFFFFF') {
  const host = typeof document !== 'undefined' && document.getElementById('xhost');
  if (!host) return el.h || 40;
  if (!MEAS || !MEAS.isConnected) { MEAS = document.createElement('div'); host.append(MEAS); }
  MEAS.className = 'pg mode-export' + (isDark(bg) ? ' is-dark' : '') + (isBlue(bg) ? ' is-blue' : '');
  MEAS.style.background = bg;
  const node = renderEl(el, 'export', { bg, els: [] }, 1);
  MEAS.replaceChildren(node);
  const hh = Math.ceil(node.getBoundingClientRect().height);
  MEAS.replaceChildren();
  return hh || el.h || 40;
}
const natH = (el, bg) => measureH({ ...el, autoH: true, h: 40 }, bg);
/* Largeur naturelle d'un texte (sans retour à la ligne automatique). */
function natW(el) {
  const host = typeof document !== 'undefined' && document.getElementById('xhost');
  if (!host) return el.w;
  if (!MEAS || !MEAS.isConnected) { MEAS = document.createElement('div'); host.append(MEAS); }
  MEAS.className = 'pg mode-export';
  const node = renderEl({ ...el, autoH: true }, 'export', { bg: '#FFFFFF', els: [] }, 1);
  node.style.width = 'max-content';
  MEAS.replaceChildren(node);
  const ww = Math.ceil(node.getBoundingClientRect().width);
  MEAS.replaceChildren();
  return ww || el.w;
}
function atBottom(el, yb = YB, bg) { el.y = Math.round(yb - measureH(el, bg)); return el; }
const KEEPB = (text, x = ML, w = 760, o = {}) => {
  const { yb, pageBg, ...rest } = o;
  return atBottom(KEEP(text, x, 0, w, rest), yb || YB, pageBg);
};
const below = (el, gap = 0) => el.y + natH(el) + gap;
function rowEq(els, bg) {
  const m = Math.max(...els.map(e => natH(e, bg)));
  for (const e of els) { e.h = m; e.autoH = false; }
  return els;
}
const rowBottom = (els, yb = YB, bg) => { const m = Math.max(...els.map(e => natH(e, bg))); for (const e of els) e.y = yb - m; return els; };

/* ---------------------------------------------------------------- blocs réutilisés */
/* Ouverture de chapitre : grand numéro fin, titre en capitales, sous-parties fléchées. */
function opener(chapter, beat, num, lines, list, o = {}) {
  const bg = o.bg || BLACK;
  const title = TTL(lines.map((s, i) => i === lines.length - 1 ? `<mark class="sel">${s}</mark>` : s), ML, 0, o.tw || 1536, { st: 'h1', ...(o.tfs ? { fs: o.tfs } : {}) });
  atBottom(title, o.tb || 820, bg);
  const sub = atBottom(T(ARROWS(list), ML, 0, o.lw || 720, 'body', { ff: 'sans', fs: 20, lh: 1.3, cols: 2, colGap: 40, anim: { type: 'fade' } }), YB, bg);
  return PAGE(chapter, beat, 'Ouverture · ' + chapterOf(chapter).name, [
    ...(o.els || []),
    T(num, 60, 60, 600, 'num', { fs: 220 }),
    T(chapterOf(chapter).name, 1112, 76, 496, 'label', { al: 'right' }),
    title, sub
  ], { header: false, folio: false, bg, notes: o.notes });
}

function fiche(d) {
  const W = 980;
  const name = TTL(d.lines || [d.name], ML, YT, W, d.fs ? { fs: d.fs } : {});
  const sub = T(`<span class="hl">${d.type}</span> · ${d.place}`, ML, below(name, 26), W, 'h3', { fs: 22, fw: 400 });
  const fy = below(sub, 48);
  const f1 = T(FIELDS([['Positionnement', d.pos], ['Canaux & communication', d.canaux]]), ML, fy, 466, 'body', { fs: 16.5 });
  const f2 = T(FIELDS([['Cible', d.cible], ['Prix', d.prix], ['Identité visuelle', d.ident || 'À compléter : palette, typographie, ton.']]), 586, fy, 466, 'body', { fs: 16.5 });
  const iy = Math.max(below(f1), below(f2)) + 48;
  const els = [
    d.photo ? IG(d.photo, 1112, YT, 496, 560, { fx: 0.85 }) : FRAME('Photo produit principale', 1112, YT, 496, 560),
    FRAME('Photo produit', 1112, 680, 236, 384),
    FRAME('Logo', 1372, 680, 236, 180),
    FRAME('Photo d\'ambiance ou de communication', 1372, 884, 236, 180),
    name, sub, f1, f2,
    ITEM('Force', d.force, ML, iy, 466, { ar: '↗', fs: 16.5 }),
    ITEM('Faiblesse', d.faiblesse, 586, iy, 466, { ar: '↘', fs: 16.5 }),
    KEEPB(d.retenir, ML, W)
  ];
  return PAGE('c4', '5 · Debate', 'Fiche · ' + d.short, els, { notes: d.notes });
}
function persona(d) {
  const f = d.fields, W = 980;
  const name = TTL(d.name.split(' '), ML, YT, W);
  const sub = T(`<span class="hl">${d.tag}</span> · ${d.meta}`, ML, below(name, 26), W, 'h3', { fs: 21, fw: 400, lh: 1.3 });
  const quote = LEAD('« ' + d.quote + ' »', ML, below(sub, 40), W, { fs: 32 });
  const fy = below(quote, 48);
  const els = [
    FRAME('Portrait libre de droits (Unsplash, Pexels…)', 1112, 0, 568, 1188, { lock: true }),
    name, sub, quote,
    T(FIELDS(f.slice(0, 3)), ML, fy, 466, 'body', { fs: 16 }),
    T(FIELDS(f.slice(3)), 586, fy, 466, 'body', { fs: 16 }),
    KEEPB(d.brings, ML, W, { label: 'Ce que Sarments lui apporte' })
  ];
  return PAGE('c5', '7 · B Story', 'Persona · ' + d.name, els, { notes: 'Persona : ajoute un portrait libre de droits (noir et blanc dans l\'inspecteur). Un persona ne garde qu\'une option par champ.' });
}
function axePages(n, name, a, b, mb, intent, kw, marche, manque, keep, beat, two) {
  const pages = [];
  pages.push(PAGE('c6', beat, `Axe ${n} · Intention`, [
    I(mb, 900, 0, 780, 1188, { lock: true, anim: { type: 'reveal' } }),
    TTL([a, `<mark class="sel">${b}</mark>`], ML, YT, 780, { fs: 112 }),
    LEAD(intent, ML, YC, 720, { fs: 34 }),
    T(N2(n - 1), 60, 640, 500, 'num', { fs: 220 }),
    atBottom(T(PILLS(kw.split(' · ')), ML, 0, 760, 'body', { ff: 'sans', fs: 16 }), YB, BLACK)
  ], { bg: BLACK, notes: 'Remplace le moodboard par l\'image la plus forte de l\'axe.' }));
  const right = (x, top, w = 496) => {
    const c1 = ITEM('Ce qui marche', marche, x, top, w, { ar: '↗' });
    const c2 = ITEM('Ce qui manque', manque, x, below(c1, 40), w, { ar: '↘' });
    return [c1, c2, KEEPB(keep, x, w)];
  };
  const sub = (label, x = ML) => T(`<span class="hl">Axe ${n}</span> · ${label}`, x, 234, 760, 'h3', { fs: 22, fw: 400 });
  const FY = 316, FH = 362;
  if (two) {
    pages.push(PAGE('c6', beat, `Axe ${n} · Recherches & bilan`, [
      TTL([name]), sub('Recherches & bilan'),
      FRAME('Croquis de logo', 72, FY, 496, FH), FRAME('Essais typographiques', 592, FY, 496, FH),
      FRAME('Motifs & textures', 72, FY + FH + GAP, 496, FH), FRAME('Mise en situation', 592, FY + FH + GAP, 496, FH),
      ...right(1112, FY)
    ]));
    return pages;
  }
  pages.push(PAGE('c6', beat, `Axe ${n} · Recherches`, [
    TTL([name]), sub('Recherches'),
    T('Notes de recherche : à compléter.', 852, 240, 756, 'body', { tone: 'sub' }),
    FRAME('Croquis de logo', X3[0], FY, W3, FH), FRAME('Essais typographiques', X3[1], FY, W3, FH), FRAME('Motifs & textures', X3[2], FY, W3, FH),
    FRAME('Palette & essais couleur', 72, FY + FH + GAP, 496, FH), FRAME('Déclinaison test', 592, FY + FH + GAP, 1016, FH)
  ]));
  pages.push(PAGE('c6', beat, `Axe ${n} · Bilan`, [
    FRAME('Mise en situation : étiquette, post Instagram, packaging…', 72, YT, 1016, YB - YT),
    T(`<span class="hl">Axe ${n}</span> · Bilan`, 1112, YT, 496, 'h3', { fs: 22, fw: 400 }),
    TTL([a, b], 1112, 140, 496, { fs: 64 }),
    ...right(1112, YC)
  ]));
  return pages;
}

/* ---------------------------------------------------------------- PESTELÉ */
const PESTEL = {
  'Politique': [
    ['up', 'Financements publics.', 'Politiques d\'économie circulaire et de transition écologique (ADEME, appels à projets type Agr\'air) qui orientent les financements vers la valorisation des déchets agricoles.'],
    ['down', 'Pas de politique dédiée.', 'Aucune politique agricole nationale n\'est dédiée au sarment : il reste un sous-produit générique de la filière vitivinicole.'],
    ['up', 'Poids local de la filière.', 'En Gironde, premier poste excédentaire de la balance commerciale départementale : les collectivités sont attentives au secteur.']],
  'Économique': [
    ['down', 'Bois peu cher.', 'Le coût du bois est globalement bas, ce qui réduit l\'incitation des domaines à valoriser plutôt qu\'à éliminer leurs sarments.'],
    ['mix', 'Filière non structurée.', 'Pas de marché organisé ni de prix de référence : des accords de gré à gré, souvent gratuits.'],
    ['up', 'Crise viticole.', 'Arrachages et vignes abandonnées fragilisent une partie des domaines : un argument de plus pour accepter une valorisation à coût nul.']],
  'Socioculturel': [
    ['up', 'Envie de local et d\'histoire.', 'Attentes croissantes pour le local, l\'upcycling et les objets porteurs d\'une histoire (terroir, domaine d\'origine).'],
    ['up', 'Rejet du brûlage.', 'Sensibilité grandissante à la pollution de l\'air liée au brûlage agricole : une pression sociale sur les pratiques.'],
    ['up', 'Image patrimoniale.', 'La vigne a une forte valeur symbolique en France, au-delà de la fonction du matériau.']],
  'Technologique': [
    ['mix', 'Deux niveaux de transformation.', 'L\'artisanal simple (vannerie, ligature, séchage), sans investissement lourd ; l\'industriel avancé (composites brevetés type Sarmine®), qui demande R&D et machines.'],
    ['down', 'Pas d\'outils intermédiaires.', 'Le secteur manque d\'outils standardisés pour transformer le sarment à échelle moyenne.'],
    ['up', 'Traçabilité numérique.', 'QR code et scan deviennent un argument de différenciation chez les acteurs premium.']],
  'Écologique': [
    ['up', 'Ressource renouvelable.', 'Une biomasse renouvelée chaque année, durable tant que le vignoble existe.'],
    ['up', 'Brûlage polluant.', 'Particules fines (PM2,5) et composés potentiellement cancérigènes : le principal moteur qui pousse le secteur à se réinventer.'],
    ['up', 'Bilan carbone.', 'Les émissions évitées par rapport au brûlage sont un argument déjà exploité (Vitis Valorem).'],
    ['warn', 'Retour au sol.', 'Certains experts jugent ces 2 t/ha un minimum pour la vie du sol : le projet ne prélève qu\'une faible part des sarments.']],
  'Légal': [
    ['down', 'Cadre fragmenté.', 'Réglementation du brûlage variable selon les départements (arrêtés préfectoraux, RIPFCI en Gironde et dans les Landes).'],
    ['up', 'Flou juridique souple.', 'L\'élimination des marcs et lies est encadrée depuis 2014 ; le sarment reste dans un cadre plus souple.'],
    ['mix', 'Aucune norme.', 'Aucune certification n\'encadre la transformation du sarment en objet design : un vide à la fois facilitateur et risqué.']],
  'Éthique': [
    ['warn', 'Risque de greenwashing.', 'Le discours écologique peut masquer un positionnement avant tout esthétique : l\'honnêteté sur ce que l\'objet résout doit être assumée.'],
    ['warn', 'Équité avec les vignerons.', 'La matière est récupérée gratuitement ; si le produit se vend cher, l\'asymétrie de valeur est à interroger.'],
    ['warn', 'Transparence sur l\'origine.', 'Ne pas promettre une traçabilité (domaine, cépage) qui ne peut pas être garantie à l\'échelle du projet.']]
};
const TAGN = { up: 'Atout', down: 'Frein', mix: 'Mixte', warn: 'Vigilance' };
const pestelHTML = items => items.map(([k, kw, t], i) => `<p class="row${i ? '' : ' first'}"><span class="tag ${k}">${TAGN[k]}</span>${kw} <span class="s">${t}</span></p>`).join('');

/* ---------------------------------------------------------------- le dossier */
function buildDossier() {
  const P = [];

  // 00 · Couverture : page noire, le nom en très grand, la matière en bandeau
  P.push(PAGE('ouv', '—', 'Couverture', [
    IG('pile', 0, 700, 1680, 488, { fx: 0.4, fy: 0.62, lock: true, anim: { type: 'reveal' } }),
    T('Dossier de projet · 2026', ML, 72, 700, 'label'),
    T(AR('↘'), 1530, 56, 80, 'body', { fs: 40, al: 'right', anim: { type: 'fade' } }),
    T('<mark class="sel">Sarments</mark>', 64, 170, 1540, 'cover'),
    LEAD('Matière première, seconde vie : création d\'une marque produit', ML, 470, 820, { fs: 40 }),
    T('Antoine<br>Quentin Lambert', 1112, 474, 496, 'body', { ff: 'sans', fs: 20, lh: 1.35, tone: 'sub' })
  ], { bg: BLACK, header: false, folio: false, notes: 'Couverture : remplace la photo par celle de votre lampe quand elle existe.' }));

  // 01 · Sommaire
  P.push(PAGE('ouv', '—', 'Sommaire', [
    TTL(['Sommaire']),
    T('', ML, YC, 1536, 'lead', { toc: true, fs: 46, lh: 1.2, cols: 2, colGap: 120, anim: { type: 'fade' } }),
    KEEPB('Du sarment brûlé à la lampe tracée : neuf chapitres, dans l\'ordre du récit.', ML, 620, { pageBg: BLUE })
  ], { bg: BLUE, notes: 'Le sommaire se met à jour tout seul à partir des chapitres et des numéros de page.' }));

  // 1 · Opening Image : Brief
  P.push(PAGE('c1', '1 · Opening Image', 'Brief', [
    TTL(['Le brief'], ML, YT, 980),
    LEAD('Créer une marque à partir d\'une matière première en <mark class="sel">seconde vie</mark>.', ML, YC1, 940, { fs: 64, lh: 1.08 }),
    ...rowBottom([
      ITEM('Du rang de vigne à la lampe', 'SARMENTS transforme le sarment de vigne, coproduit brûlé ou broyé chaque hiver, en luminaires artisanaux. Le sarment est conservé entier et tracé jusqu\'à son domaine d\'origine, en Nouvelle-Aquitaine.', ML, 0, 444, { ar: '↘', k: 'Le projet' }),
      ITEM('Une marque complète', 'Une plateforme de marque, une identité visuelle (logo, charte graphique) et ses déclinaisons : étiquette de traçabilité, packaging, réseaux sociaux, site.', 564, 0, 444, { ar: '↘', k: 'Les attentes' })]),
    FRAME('Photo pleine hauteur : vigne taillée en hiver, sarments au sol (à faire pendant la taille, de novembre à mars)', 1112, 0, 568, 1188, { lock: true })
  ], { notes: 'Opening Image : la photo de vigne en hiver sera la plus forte si vous la faites vous-mêmes (noir et blanc dans l\'inspecteur).' }));

  // 2 · Theme Stated : Problématique
  P.push(PAGE('c1', '2 · Theme Stated', 'Problématique', [
    TTL(['Problématique']),
    LEAD('Comment le design peut-il transformer les <mark class="sel">irrégularités naturelles</mark> du sarment de vigne, aujourd\'hui brûlé ou broyé, en qualités esthétiques et fonctionnelles pour créer un <mark class="sel">luminaire artisanal contemporain</mark> ?', ML, YC1, 1400, { fs: 50, lh: 1.16 }),
    ...[['Matière', 'Les nœuds, l\'écorce et les courbes du sarment deviennent une signature visuelle.'],
      ['Geste', 'La main qui récolte, cintre et assemble reste visible dans l\'objet.'],
      ['Lumière', 'La lumière révèle le sarment et projette son dessin dans la pièce.']]
      .flatMap(([t, d], i) => {
        const y = 650 + i * 64;
        const n = T(N2(i), X3[i] - 6, y, W3, 'num', { fs: 130 });
        return [n, ITEM(t, d, X3[i], below(n, 18), 420)];
      })
  ], { bg: BLUE, notes: 'Theme Stated : la problématique seule, en grand. Les trois mots annoncent vos trois axes.' }));

  // 3 · Set-Up : Analyse stratégique
  P.push(opener('c2', '3 · Set-Up', '02', ['Analyse', 'stratégique'], ['Contexte', 'Ressource', 'Usages', 'Secteur', 'PESTELÉ', 'Marché'],
    { els: [IG('pile', 852, 700, 828, 488, { fx: 0.35, fy: 0.6, lock: true, anim: { type: 'reveal' } })], tb: 640 }));

  {
    const stats = [['2 t', 'de sarments par hectare et par an'], ['1,6 Mt', 'de coproduits viticoles chaque année en France'], ['93 %', 'des coproduits viticoles sont des sarments (7 % : marcs, lies…)']]
      .flatMap(([n, c], i) => STAT(n, c, X3[i], 660, 340));
    P.push(PAGE('c2', '3 · Set-Up', 'Analyse contextuelle', [
      TTL(['Analyse', 'contextuelle']),
      IG('pile', 1112, YT, 496, 500, { fx: 0.3 }),
      T('La viticulture française produit plus de 2 tonnes de sarments par hectare et par an, générés lors de la taille et de l\'épamprage. Cette biomasse est aujourd\'hui majoritairement brûlée, broyée ou compostée et <b>rarement valorisée comme matière noble</b>. À l\'échelle nationale, la filière génère plus de 1,6 million de tonnes de coproduits agricoles par an, dont 93 % de sarments.', 462, YC, 600, 'body'),
      ...stats,
      KEEPB('Une ressource massive (2 t/ha/an, 93 % des coproduits viticoles) encore traitée comme un déchet.', ML, 760),
      atBottom(T('Source : F.G.V.B. (Fédération des Grands Vins de Bordeaux)', 1112, 0, 496, 'caption'))
    ], { notes: 'Source à vérifier : F.G.V.B. La circulaire de 2011 a été déplacée dans « Pourquoi maintenant ».' }));
  }

  {
    const months = ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct'];
    const x0 = 712, u = 896 / 12, cy = 790;
    P.push(PAGE('c2', '3 · Set-Up', 'La ressource', [
      IG('mains', 0, 0, 640, 1188, { fx: 0.5, fy: 0.45, lock: true, anim: { type: 'reveal' } }),
      T('Sarment broyé : l\'usage d\'aujourd\'hui', 40, 1100, 560, 'caption', { col: '#FFFFFF' }),
      TTL(['La', 'ressource'], x0, YT, 896),
      LEAD('Disponible, gratuite et en quête de <span class="hl">débouchés</span>.', x0, YC, 896, { fs: 36 }),
      T('<p>Les alternatives officiellement recommandées sont le broyage, le compostage, le paillage ou l\'apport en déchèterie. Aucune de ces solutions ne valorise économiquement la matière. La collecte se fait traditionnellement de novembre à mars, période de taille.</p><p>La ressource est abondante, récurrente, disponible gratuitement ou à très faible coût, et les producteurs sont en recherche active de débouchés depuis le durcissement des règles anti-brûlage. Le rapport de force à l\'approvisionnement est favorable à un porteur de projet.</p>', x0, 480, 896, 'body', { fs: 17, cols: 2, colGap: 40 }),
      T(K('Le calendrier de la matière'), x0, cy, 600, 'body'),
      ...months.map((m, i) => T(m, x0 + i * u, cy + 40, u, 'label', { fs: 12, anim: { type: 'none' } })),
      R(x0, cy + 68, 5 * u - 6, 14, C.ink), R(x0 + 5 * u, cy + 68, 5 * u - 6, 14, '#BDBDBD'), R(x0 + 10 * u, cy + 68, 2 * u, 14, BLUE),
      T('Taille & collecte', x0, cy + 96, 5 * u, 'caption'), T('Séchage (3 à 6 mois)', x0 + 5 * u, cy + 96, 5 * u, 'caption'), T('Façonnage', x0 + 10 * u, cy + 96, 2 * u, 'caption'),
      KEEPB('Abondante, récurrente et gratuite : la matière est là, et les vignerons cherchent à s\'en défaire proprement.', x0, 760)
    ], { notes: 'La photo montre du sarment broyé : c\'est voulu (légende). Séchage : choisis entre « 3 à 6 mois » et « 6 mois minimum ».' }));
  }

  {
    const usages = [
      ['sol', 'Retour au sol', 0.9, 'C\'est l\'usage majoritaire : le sarment est broyé et laissé dans les rangs. Certains experts jugent ces 2 tonnes restituées comme un minimum pour la vie du sol.'],
      ['brulage', 'Brûlage', 0.35, 'Encore souvent pratiqué à l\'air libre, il génère une fumée polluante. La réglementation se durcit là où il était traditionnel.'],
      ['compost', 'Énergie & compost', 0.3, 'Transformation en pellets, en biogaz ou en compost.'],
      ['materiaux', 'Matériaux', 0.1, 'Vitis Valorem collecte 300 hectares de sarments et de ceps par an pour fabriquer tuteurs, piquets et agrafes. Les Princes Sarments en font un composite.']
    ];
    P.push(PAGE('c2', '3 · Set-Up', 'Usages actuels', [
      TTL(['Usages', 'actuels']),
      LEAD('Environ deux tonnes par hectare et par an : la ressource part aujourd\'hui dans <span class="hl">quatre directions</span>.', 852, 120, 756, { fs: 30, lh: 1.2 }),
      ...usages.flatMap(([img, t, share, d], i) => {
        const x = X4[i];
        return [IG(img, x, YC, W4, 250),
          R(x, YC + 274, W4, 4, '#E2E2E2'), R(x, YC + 274, Math.round(W4 * share), 4, BLUE),
          T(TT(t) + `<p class="s">${d}</p>`, x, YC + 302, W4, 'body', { fs: 16 })];
      }),
      KEEPB('Aucun usage actuel ne conserve le sarment dans sa forme d\'origine : il est broyé, brûlé ou composté.', ML, 760),
      atBottom(T('Source : toutlevin.com, « La surprenante seconde vie de la vigne et du raisin ». Jauges qualitatives.', 1112, 0, 496, 'caption'))
    ], { notes: 'Les photos d\'usage sont petites (basse définition) : remplace-les par des versions plus grandes si possible.' }));
  }

  {
    const bw = 466;
    P.push(PAGE('c2', '3 · Set-Up', 'Analyse du secteur', [
      TTL(['Analyse', 'du secteur']),
      LEAD('« Un secteur sous <span class="hl">pression réglementaire</span>, pas sous tension économique. »', ML, YC, 1200, { fs: 46 }),
      T(K('Ressource et valorisation'), ML, 620, bw, 'body'),
      T('Ressource · massive', ML, 672, bw, 'body', { ff: 'sans', fs: 20 }), R(ML, 708, bw, 14, C.ink),
      T('Environ 1,5 million de tonnes de sarments par an', ML, 734, bw, 'small'),
      T('Valorisation · faible', ML, 806, bw, 'body', { ff: 'sans', fs: 20 }), R(ML, 842, bw, 14, '#E2E2E2'), R(ML, 842, 40, 14, BLUE),
      T('Quelques niches : énergie, composites, mobilier', ML, 868, bw, 'small'),
      T(K('Le constat', 'g') + '<p>Le secteur du sarment de vigne se caractérise avant tout par un déséquilibre entre l\'abondance de la ressource et la faiblesse de sa valorisation : une ressource massive et récurrente, mais sous-exploitée. L\'écrasante majorité de cette biomasse reste traitée comme un déchet agricole plutôt que comme une matière première : broyage-épandage direct dans les rangs de vigne, un peu de compostage et, historiquement, beaucoup de brûlage.</p>', 592, 620, bw, 'body', { fs: 17 }),
      T(K('Ce qui fait bouger les lignes', 'g') + '<p>Ce qui fait bouger les lignes n\'est pas la demande (peu de filières viennent chercher la matière), mais la contrainte : interdictions progressives de brûlage, plans de protection de l\'atmosphère locaux, pression citoyenne. Les vignerons ne cherchent donc pas à vendre leurs sarments : ils cherchent surtout à s\'en débarrasser proprement.</p>', 1112, 620, bw, 'body', { fs: 17 }),
      KEEPB('Pas de marché organisé : le sarment est géré comme un déchet en quête de débouchés.', ML, bw)
    ]));
  }

  P.push(PAGE('c2', '3 · Set-Up', 'Petite et grande échelle', [
    IG('fagots', 1112, 0, 568, 1188, { lock: true, anim: { type: 'reveal' } }),
    TTL(['Les voies', '« nobles »'], ML, YT, 980),
    T('Les voies de valorisation « nobles » (énergie, matériaux composites, mobilier, cosmétique) existent et sont documentées depuis les années 2010-2015 par les instituts techniques de la filière, mais <b>restent à l\'état de niches</b>.', ML, YC, 444, 'body', { fs: 17 }),
    T('Le gisement mobilisable est qualifié de faible par les organismes du secteur eux-mêmes, non pas parce que la matière manque, mais parce que les filières de collecte, de transport et de transformation ne sont pas structurées à grande échelle : chaque tentative reste artisanale ou expérimentale.', 564, YC, 444, 'body', { fs: 17 }),
    T(AR('↗') + K('Petite échelle') + TT('Facile d\'entrer') + ROWS(['Peu de concurrence', 'Matière accessible', 'Pas de barrière financière à l\'approvisionnement']), ML, 680, 444, 'body'),
    T(AR('↘') + K('Grande échelle') + TT('Difficile d\'industrialiser') + ROWS(['Pas de logistique de collecte organisée', 'Matière hétérogène', 'Faible valeur économique au kilo']), 564, 680, 444, 'body'),
    KEEPB('Facile d\'entrer à petite échelle, difficile d\'industrialiser : le modèle artisanal est le bon point de départ.', ML, 760)
  ]));

  {
    const counts = { up: 0, down: 0, mix: 0, warn: 0 };
    for (const items of Object.values(PESTEL)) for (const [k] of items) counts[k]++;
    const pest = (name, x) => {
      const l = T(name[0], x - 4, YC1, W4, 'num', { fs: 120 });
      return [l, T(K(name) + pestelHTML(PESTEL[name]), x, below(l, 16), W4, 'body', { fs: 15 })];
    };
    const legend = '<span class="tag up">Atout</span><span class="tag down">Frein</span><span class="tag mix">Mixte</span><span class="tag warn">Vigilance</span>';
    P.push(PAGE('c2', '3 · Set-Up', 'PESTELÉ 1/2', [
      TTL(['PESTELÉ']),
      LEAD('Sept facteurs pour lire l\'environnement du projet, classés en <span class="hl">atouts, freins, effets mixtes</span> et points de vigilance.', 852, 104, 756, { fs: 26, lh: 1.25 }),
      T(legend, 852, 206, 756, 'body', { fs: 19, anim: { type: 'none' } }),
      ...pest('Politique', X4[0]), ...pest('Économique', X4[1]), ...pest('Socioculturel', X4[2]), ...pest('Technologique', X4[3])
    ]));
    P.push(PAGE('c2', '3 · Set-Up', 'PESTELÉ 2/2', [
      TTL(['PESTELÉ']),
      LEAD('Écologie, cadre légal et éthique : les trois facteurs qui demandent <span class="hl">le plus de vigilance</span> au projet.', 852, 104, 756, { fs: 26, lh: 1.25 }),
      ...pest('Écologique', X4[0]), ...pest('Légal', X4[1]), ...pest('Éthique', X4[2]),
      T(K('Le bilan des 7 facteurs') + ROWS([`<span class="hl">${counts.up}</span> atouts`, `<span class="hl">${counts.down}</span> freins`, `<span class="hl">${counts.mix}</span> effets mixtes`, `<span class="hl">${counts.warn}</span> points de vigilance`]), X4[3], 436, W4, 'body', { ff: 'sans', fs: 22 }),
      KEEPB('Un contexte porteur (réglementation, envie de sens, image de la vigne), à condition de rester honnête : pas de greenwashing, équité avec les vignerons, traçabilité réelle.', X4[3], W4, { fs: 21 })
    ], { notes: 'RIPFCI : règlement interdépartemental de protection de la forêt contre l\'incendie (à vérifier).' }));
  }

  P.push(PAGE('c2', '3 · Set-Up', 'Marché de vente', [
    IG('lampes', 1112, YT, 496, 880, { fx: 0.82, anim: { type: 'reveal' } }),
    atBottom(T('Le naturel standardisé de la grande distribution : notre contre-modèle.', 1112, 0, 496, 'caption')),
    TTL(['Marché', 'de vente'], ML, YT, 980),
    ...STAT('−1,7 %', 'Lampes et luminaires en France : 4,165 Md€ en 2022, 4,094 Md€ en 2023 (Syndicat du luminaire).', ML, YC, 444, { fs: 150, col: C.ink }),
    ...STAT('+7,7 %', 'par an : croissance attendue du luminaire haut de gamme dans le monde jusqu\'en 2034 (20,26 Md$ en 2024).', 564, YC, 444, { fs: 150 }),
    T(K('Tendance', 'g') + '<p>Les acteurs misent sur les matériaux durables pour se repositionner. La part grand public est plus petite : la consommation des ménages en appareils d\'éclairage était de 790 M€ en 2021.</p>', ML, 720, 936, 'body'),
    KEEPB('Le haut de gamme progresse (+7,7 %/an) pendant que le grand public recule (−1,7 %) : la place est du côté du luminaire durable et premium.', ML, 936)
  ]));

  // 4 · Catalyst
  P.push(PAGE('c3', '4 · Catalyst', 'Le brûlage n\'est plus une option', [
    TTL(['Pourquoi', 'maintenant ?'], ML, YT, 1000),
    T('130 000', 56, 430, 1000, 'num', { fs: 230 }),
    LEAD('voitures par jour', ML, 650, 700, { fs: 40 }),
    T('C\'est la pollution équivalente aux 4 300 à 5 500 tonnes de bois de vigne brûlées en trois mois en Gironde, selon une association environnementale.', ML, 724, 600, 'body', { tone: 'sub' }),
    KEEPB('Brûler n\'est plus possible, broyer ne rapporte rien : les vignerons ont besoin d\'un débouché.', ML, 760, { pageBg: BLUE }),
    FRAME('Photo : fumée de brûlage dans les vignes', 1112, YT, 496, 360),
    T(K('Le contexte') + TT('Le brûlage n\'est plus une option') + '<p>En Gironde, premier vignoble de Nouvelle-Aquitaine, le brûlage à l\'air libre des déchets verts viticoles est interdit ou fortement encadré dans les zones à dominante forestière. Le cadre de référence est la circulaire du 18 novembre 2011, qui interdit le brûlage à l\'air libre des déchets verts à l\'échelle nationale.</p><p>Les alternatives recommandées (broyage, compostage, paillage, déchèterie) ne valorisent pas économiquement la matière. Les vignerons cherchent donc surtout à se débarrasser proprement de leurs sarments.</p>', 1112, 500, 496, 'body', { fs: 16.5 }),
    atBottom(T('Sources : circulaire du 18 novembre 2011 ; [nom de l\'association environnementale] ; F.G.V.B.', 1112, 0, 496, 'caption'), YB, BLUE)
  ], { bg: BLUE, notes: 'Remplace [nom de l\'association] par la source exacte du chiffre « 130 000 voitures ».' }));

  {
    const mats = [['Métal', 'Acier, aluminium, laiton : très courants pour les pieds et les structures. L\'aluminium neuf est particulièrement énergivore à produire.', 'Photo : pied de lampe en métal'],
      ['Plastiques', 'ABS, polycarbonate, polypropylène : dominants dans l\'entrée de gamme, d\'origine fossile et peu recyclés.', 'Photo : lampe en plastique'],
      ['Verre & céramique', 'Cuits à haute température, donc énergivores.', 'Photo : lampe en verre ou céramique'],
      ['Fibres naturelles', 'Bois, rotin, osier, papier, tissu : surtout pour les abat-jour et les modèles « naturels ».', 'Photo : abat-jour en fibres naturelles']];
    P.push(PAGE('c3', '4 · Catalyst', 'Le luminaire cherche d\'autres matières', [
      TTL(['Le luminaire', 'aujourd\'hui']),
      LEAD('Il repose surtout sur des matériaux <span class="hl">énergivores</span> ou <span class="hl">d\'origine fossile</span>.', 1112, 120, 496, { fs: 28, lh: 1.2 }),
      ...mats.flatMap(([t, d, ph], i) => [FRAME(ph, X4[i], YC, W4, 210),
        T(TT(t) + `<p class="s">${d}</p>`, X4[i], YC + 234, W4, 'body', { fs: 16 })]),
      atBottom(T(K('Recycler le sarment, c\'est') + ARROWS(['Du temps gagné pour les vignerons', 'Un engagement fort pour l\'environnement', 'Moins de CO₂, pas de fumée toxique', 'Moins de risques d\'incendie'], '↗'), ML, 0, 720, 'body', { ff: 'sans', fs: 18 })),
      T('Et la demande suit : le luminaire haut de gamme progresse de plus de <span class="hl">7,7 % par an</span> dans le monde, et les fabricants misent sur les matériaux durables pour se repositionner.', 852, 800, 756, 'lead', { fs: 24, lh: 1.25 }),
      KEEPB('La contrainte crée le besoin (le brûlage recule), la tendance crée la demande (matériaux durables) : c\'est le bon moment.', 852, 756)
    ], { notes: 'Les 4 photos sont à trouver : dans la version InDesign, les photos des usages avaient été réutilisées par erreur.' }));
  }

  // 5 · Debate : Concurrence
  P.push(opener('c4', '5 · Debate', '04', ['Paysage', 'concurrentiel'], ['Niko & Co', 'Les Princes Sarments', 'Vitis Valorem', 'Fibres naturelles premium', 'Grande distribution', 'Artisans du bois brut'],
    { bg: BLUE, lw: 760, els: [IG('sarment', 930, 800, 680, 236, { fit: 'contain', r: -6, lock: true, anim: { type: 'zoom' } })], tb: 700 }));
  P.push(PAGE('c4', '5 · Debate', 'Typologie des concurrents', [
    TTL(['Trois familles', 'de concurrents']),
    ...[['Concurrents directs', 'Même matière, même usage.', 'Niko & Co (Charente) : mobilier design en piquets de vigne, pièces uniques.'],
      ['Concurrents indirects', 'Même matière, autre usage.', 'Les Princes Sarments : composite de sarment broyé pour l\'architecture de luxe. Vitis Valorem : filière de collecte et matière Sarmine®.'],
      ['Substituts', 'Autre matière, même besoin, même cible.', 'Luminaires en fibres naturelles d\'éditeurs, « naturel » de la grande distribution, lampes en bois flotté d\'artisans.']]
      .flatMap(([k, t, d], i) => {
        const n = T(N2(i), X3[i] - 6, YC, W3, 'num', { fs: 130 });
        return [n, T(TT(k) + `<p class="s">${t}</p>` + K('Exemples', 'g row') + `<p>${d}</p>`, X3[i], below(n, 20), 440, 'body')];
      }),
    KEEPB('Un seul concurrent direct, et aucun acteur qui conserve le sarment entier, tracé jusqu\'à son domaine d\'origine.', ML, 760)
  ]));
  P.push(fiche({ short: 'Niko & Co', type: 'Concurrent direct', name: 'Niko & Co', place: 'Charente', pos: 'Artisanal, pièces uniques, vendues aux particuliers et aux professionnels ; ancrage en Charente.',
    cible: 'Particuliers et professionnels.', prix: 'À compléter : relever trois prix.', canaux: 'À compléter : site, Instagram, salons, bouche-à-oreille viticole.',
    force: 'Crédibilité terrain très forte : l\'entreprise vient du monde viticole, pas d\'un studio de design.',
    faiblesse: 'Travaille plusieurs bois (acacia, pin, châtaignier) : la spécificité de la vigne se dilue.',
    retenir: 'Le plus proche de nous ; nous nous distinguons par le sarment lui-même et sa traçabilité.' }));
  P.push(fiche({ short: 'Les Princes Sarments', type: 'Concurrent indirect', name: 'Les Princes Sarments', lines: ['Les Princes', 'Sarments'], place: 'Provence',
    pos: 'Luxe : sarments et pieds de vigne broyés en matériau composite breveté pour l\'architecture d\'intérieur et l\'hôtellerie haut de gamme.',
    cible: 'Architectes, hôtellerie de luxe (B2B).', prix: 'Sur devis, haut de gamme.', canaux: 'Réseau d\'architectes, salons professionnels, site vitrine.',
    force: 'Différenciation technique forte, clientèle premium et réseau d\'architectes déjà établi.',
    faiblesse: 'Coupé du grand public, coût d\'accès élevé, moins de proximité avec le terroir humain.',
    retenir: 'Une référence de storytelling, mais la matière y est broyée : on ne la reconnaît plus.' }));
  P.push(fiche({ short: 'Vitis Valorem', type: 'Concurrent indirect', name: 'Vitis Valorem', lines: ['Vitis', 'Valorem'], place: 'France',
    pos: 'Filière B2B nationale de collecte de sarments, transformés en matière première Sarmine® pour la cosmétique, l\'automobile et le bâtiment.',
    cible: 'Industriels (B2B multisecteur).', prix: 'Matière première, au volume.', canaux: 'Démarchage B2B, communication institutionnelle.',
    force: 'Échelle et diversification des débouchés, crédibilité industrielle forte.',
    faiblesse: 'Marque froide et anonyme pour le grand public, aucune présence en décoration, pas d\'incarnation humaine.',
    retenir: 'La collecte à grande échelle est possible, et personne n\'occupe le terrain de l\'émotion.' }));
  P.push(fiche({ short: 'Fibres naturelles premium', type: 'Substitut premium', name: 'Fibres naturelles premium', lines: ['Fibres', 'naturelles', 'premium'], fs: 104, place: 'Exemple à vérifier : Market Set (Paris)',
    pos: 'À compléter : éditeur de luminaires en rotin, lin ou papier.', cible: 'À compléter.', prix: 'À compléter : donne le niveau de prix attendu par Camille.',
    canaux: 'À compléter.', force: 'À compléter.', faiblesse: 'À compléter.', retenir: 'À compléter : ce que cet acteur nous apprend sur le premium.',
    notes: 'Piste à vérifier : site, prix, canaux. Ce n\'est pas une fiche, c\'est une suggestion.' }));
  P.push(fiche({ short: 'Grande distribution', type: 'Substitut grand public', name: 'Grande distribution', lines: ['Grande', 'distribution'], place: 'Le « naturel » standardisé · exemples : Maisons du Monde, IKEA', photo: 'lampes',
    pos: 'Luminaires « naturels » (rotin, jute) produits en série, à petit prix.', cible: 'Grand public.', prix: 'À compléter : relever trois prix.',
    canaux: 'Magasins, sites e-commerce, catalogues.', force: 'Prix bas, disponibilité, effet de mode.', faiblesse: 'Naturel standardisé, origine invisible, aucune histoire.',
    retenir: 'Le naturel standardisé : notre contre-modèle.' }));
  P.push(fiche({ short: 'Artisans du bois brut', type: 'Substitut artisanal', name: 'Artisans du bois brut', lines: ['Artisans du', 'bois brut'], place: 'Etsy, marchés de créateurs',
    pos: 'Lampes en bois flotté ou en bois brut, pièces uniques.', cible: 'Les mêmes acheteurs que Camille.', prix: 'À compléter.',
    canaux: 'Etsy, Instagram, marchés de créateurs.', force: 'Pièce unique, prix accessibles, proximité avec l\'acheteur.', faiblesse: 'Origine rarement tracée, qualité inégale.',
    retenir: 'Même promesse que nous, mais sans origine tracée.' }));

  {
    const cols = ['Acteur', 'Site / e-shop', 'Instagram', 'Ton', 'Packaging', 'Traçabilité', 'Prix'];
    const actors = ['Niko & Co', 'Les Princes Sarments', 'Vitis Valorem', 'Fibres naturelles premium', 'Grande distribution', 'Artisans du bois brut'];
    const colX = i => i === 0 ? 96 : 96 + 300 + (i - 1) * 200;
    const colW = i => i === 0 ? 280 : 184;
    const rowH = 68, top = YC + 44;
    const table = [];
    cols.forEach((c, i) => table.push(T(c, colX(i), YC, colW(i), 'label', { anim: { type: 'none' } })));
    actors.forEach((a, r) => {
      const y = top + r * rowH;
      if (r % 2 === 0) table.push(R(ML, y, 1536, rowH, '#F4F4F2'));
      table.push(T(a, colX(0), y + 20, colW(0), 'body', { ff: 'sans', fs: 18, anim: { type: 'none' } }));
      for (let i = 1; i < cols.length; i++) table.push(T('—', colX(i), y + 20, colW(i), 'body', { tone: 'sub', anim: { type: 'none' } }));
    });
    P.push(PAGE('c4', '5 · Debate', 'Outils de communication', [
      TTL(['Outils de', 'communication']),
      T('Un mot ou deux par case : ce que chaque acteur montre, et ce qu\'il tait.', 1242, 120, 366, 'body', { tone: 'sub' }),
      ...table,
      KEEPB('À compléter avec le tableau : si aucun acteur n\'affiche l\'origine précise de sa matière, c\'est notre territoire.', ML, 936)
    ], { notes: 'Remplis chaque case (un mot ou deux). Ajoute une page « tendances » si besoin : ce que tous font, ce que personne ne fait.' }));
  }

  {
    const cxc = 556, cyc = 724, hw = 452, hy = 300;
    const pt = (x, y) => [cxc + hw * x, cyc - hy * y];
    const dots = [['Grande distribution', -0.8, -0.8], ['Fibres naturelles premium', -0.75, -0.08], ['Artisans bois flotté', -0.6, 0.72],
      ['Vitis Valorem', 0.42, -0.8], ['Les Princes Sarments', 0.46, -0.16], ['Niko & Co', 0.18, 0.6]];
    const [sx, sy] = pt(0.8, 0.78);
    P.push(PAGE('c4', '5 · Debate', 'Croix de positionnement', [
      TTL(['Croix de', 'positionnement']),
      R(cxc, cyc - hy - 24, hw + 32, hy + 24, C.cardBlue, { lock: true }),
      R(cxc - hw - 32, cyc - 1, 2 * hw + 64, 2, C.ink, { lock: true }), R(cxc - 1, cyc - hy - 24, 2, 2 * hy + 48, C.ink, { lock: true }),
      T('Lien faible à la vigne', cxc - hw - 24, cyc - 30, 300, 'label'), T('Sarment tracé jusqu\'au domaine', cxc + hw + 24 - 320, cyc - 30, 320, 'label', { al: 'right' }),
      T('Artisanal · pièce unique', cxc + 16, cyc - hy - 10, 330, 'label'), T('Industriel · série', cxc + 16, cyc + hy + 4, 330, 'label'),
      ...dots.flatMap(([n, x, y]) => { const [px, py] = pt(x, y); return [ELL(px - 8, py - 8, 16, 16, C.ink), T(n, px + 18, py - 12, 250, 'body', { ff: 'sans', fs: 17, anim: { type: 'none' } })]; }),
      ELL(sx - 16, sy - 16, 32, 32, BLUE, { anim: { type: 'zoom' } }), T('Sarments', sx - 250, sy - 9, 224, 'eyebrow', { al: 'right', fs: 16 }),
      T('Deux axes : le lien avec la vigne (de la matière anonyme au sarment tracé jusqu\'à son domaine) et le mode de production (de la série industrielle à la pièce unique). Les points se déplacent : ajuste-les avec vos fiches.', 1112, YC, 496, 'body'),
      KEEPB('Seul acteur à relier un sarment conservé entier à son domaine d\'origine, en production artisanale.', 1112, 496)
    ]));
  }
  P.push(PAGE('c4', '5 · Debate', 'Synthèse de l\'analyse', [
    TTL(['Synthèse', 'de l\'analyse']),
    LEAD('Une ressource massive, un secteur peu structuré, un contexte favorable : <mark class="sel">la place est libre</mark>.', ML, YC, 1300, { fs: 46 }),
    ...['La viticulture française génère plus de 2 tonnes de sarments par hectare et par an, une biomasse aujourd\'hui très peu valorisée (broyage-épandage majoritaire, brûlage en recul sous la pression réglementaire). En Gironde, l\'encadrement croissant du brûlage pousse les domaines à chercher des débouchés, ce qui rend la matière accessible gratuitement ou à faible coût.',
      'Le secteur reste peu structuré : ce n\'est pas un marché organisé, mais une gestion de déchet agricole en quête de valorisation. Niko & Co travaille les piquets de vigne, Les Princes Sarments un composite de luxe, Vitis Valorem une filière B2B. Aucun n\'occupe le luminaire en sarment brut tracé jusqu\'au domaine d\'origine : c\'est l\'espace de différenciation du projet.',
      'L\'analyse PESTELÉ confirme un contexte favorable, avec des points de vigilance éthiques : risque de greenwashing, équité de valeur avec les vignerons fournisseurs, transparence sur la traçabilité annoncée.']
      .map((t, i) => T(AR('↘') + `<p>${t}</p>`, X3[i], 600, 440, 'body', { fs: 17 })),
    KEEPB('Aucun acteur n\'occupe le luminaire en sarment brut, tracé jusqu\'au domaine, en Nouvelle-Aquitaine.', ML, 760, { pageBg: BLUE })
  ], { bg: BLUE, notes: 'Quand les 6 fiches seront faites, ajoute les trois nouveaux acteurs au 2e paragraphe.' }));

  // 6 · Break into Two : Concept
  P.push(opener('c5', '6 · Break into Two', '05', ['Concept &', 'plateforme', 'de marque'], ['Concept', 'Process', 'Mission & valeurs', 'Cibles', 'Personas', 'SWOT', 'Mix marketing', 'Nom'],
    { els: [IG('mains', 0, 0, 1680, 1188, { fy: 0.4, lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.6, lock: true })], tb: 860, lw: 760 }));
  P.push(PAGE('c5', '6 · Break into Two', 'Le sarment reste sarment', [
    TTL(['Le sarment', '<mark class="sel">reste sarment</mark>']),
    LEAD('On ne dénature pas le sarment. Là où les autres le broient pour l\'utiliser en brisures, nous le conservons dans sa structure naturelle, en y ajoutant des courbes organiques pour le sublimer : nous mettons en valeur <span class="hl">ce qui est habituellement broyé ou brûlé</span>.', ML, YC + 20, 1400, { fs: 26, lh: 1.3 }),
    IG('mains', ML, 560, 756, 360, { fy: 0.5, lock: true, anim: { type: 'fade' } }),
    R(852, 560, 756, 360, C.card, { lock: true }),
    IG('sarment', 900, 640, 660, 200, { fit: 'contain', r: -6, anim: { type: 'zoom' } }),
    ITEM('Ce que font les autres', 'Le sarment broyé, réduit en brisures.', ML, 944, 756, { ar: '↘', sub: true }),
    ITEM('Ce que nous faisons', 'Le sarment entier, cintré, reconnaissable.', 852, 944, 756, { ar: '↗', sub: true })
  ], { notes: 'Break into Two : le concept en une image. Remplace le sarment détouré par une photo de votre pied de lampe cintré.' }));
  {
    const steps = [
      ['Récolter', 'Choisir des sarments encore souples (récolte hivernale, juste après la taille) et épais, pour la structure.'],
      ['Nettoyer et traiter', 'Brosser pour enlever la terre et l\'écorce abîmée. Trempage ou autoclave anti-insectes, puis léger ponçage des nœuds.'],
      ['Cintrer et sécher', 'Cintrer les sarments encore verts sur un gabarit et laisser sécher plusieurs semaines : le bois garde la forme.'],
      ['Façonner le pied', 'À compléter : assemblage, fixation de la douille, passage du câble, socle, abat-jour.'],
      ['Tracer', 'Chaque pied reçoit une étiquette : domaine, cépage, saison de taille.']];
    P.push(PAGE('c5', '6 · Break into Two', 'De la vigne à la lampe', [
      TTL(['De la vigne', 'à la lampe']),
      LEAD('Un procédé simple, <span class="hl">sans broyage</span>, en cinq gestes.', 1112, 120, 496, { fs: 28, lh: 1.2 }),
      ...steps.flatMap(([t, d], i) => [
        T(N2(i), X5[i] - 4, YC - 12, W5, 'num', { fs: 84 }),
        FRAME(`Photo : étape ${i + 1}`, X5[i], YC + 88, W5, 200),
        T(TT(t) + `<p class="s">${d}</p>`, X5[i], YC + 312, W5, 'body', { fs: 15.5 })]),
      ...rowBottom([
        ITEM('Partenaire', 'Un vannier ou un sculpteur sur bois apporte la technique d\'exécution et montre une vraie réflexion sur le mode de production.', ML, 0, 496, { ar: '↗', fs: 16.5 }),
        ITEM('Faisabilité', 'Niko & Co, jeune entreprise charentaise, transforme déjà des piquets de vigne en mobilier design vendu aux particuliers et aux professionnels.', 592, 0, 496, { ar: '↗', fs: 16.5 }),
        KEEP('Un procédé simple et sans broyage : récolter, nettoyer, cintrer, sécher, assembler.', 1112, 0, 496)])
    ], { notes: 'Photos des étapes : idéalement les vôtres. L\'étape 4 reste à écrire.' }));
  }

  // 7 · B Story : plateforme
  P.push(PAGE('c5', '7 · B Story', 'Mission, vision, valeurs', [
    TTL(['Mission']),
    T(K('Vision') + TT('Faire du sarment une matière reconnue du design d\'intérieur.'), 1112, 112, 496, 'body', { fs: 20 }),
    LEAD('Donner une seconde vie au sarment de vigne en le transformant, <mark class="sel">sans le broyer ni le brûler</mark>, en luminaires artisanaux qui racontent le domaine d\'où ils viennent.', ML, YC1, 1300, { fs: 44, lh: 1.16 }),
    ...[['Authenticité de la matière', 'La technique de fabrication reste visible et assumée plutôt que dissimulée derrière un fini industriel.'],
      ['Traçabilité', 'Chaque pièce est reliée à un domaine, un cépage et une période de récolte identifiables.'],
      ['Ancrage territorial', 'La marque s\'inscrit dans l\'économie viticole réelle de la Nouvelle-Aquitaine.'],
      ['Équité', 'La matière des vignerons partenaires est reconnue et valorisée, pas traitée comme une ressource gratuite et invisible.']]
      .map(([t, d], i) => ITEM(t, d, X4[i], 580, W4 - 10, { ar: '↗', k: 'Valeur ' + N2(i), fs: 16.5, sub: true })),
    ...rowBottom([
      ITEM('Se concentrer sur le pied de lampe', 'Une typologie, un savoir-faire, un cycle de production.', ML, 0, 720, { k: 'Objectif · court terme', kc: 'g' }),
      ITEM('Étendre la marque', 'Au petit mobilier et aux accessoires de décoration.', 852, 0, 720, { k: 'Objectif · long terme', kc: 'g' })])
  ], { notes: 'Mission et vision sont des propositions : à valider en groupe.' }));
  {
    const ccx = 1260, ccy = 724;
    const ring = (d, fill) => ELL(ccx - d / 2, ccy - d / 2, d, d, fill, { lock: true });
    const lab = (a, b, y, w = 400, col) => T(`<b>${a}</b><br><span class="s">${b}</span>`, ccx - w / 2, y, w, 'body', { ff: 'sans', fs: 15, lh: 1.35, al: 'center', anim: { type: 'none' }, ...(col ? { col } : {}) });
    P.push(PAGE('c5', '7 · B Story', 'Positionnement & cibles', [
      TTL(['Positionnement', '& cibles']),
      T('Pour les amateurs de design local en Nouvelle-Aquitaine et, à terme, les domaines viticoles, SARMENTS est l\'artisan qui transforme le sarment de vigne brut, tracé jusqu\'au domaine d\'origine, en luminaires utilitaires et décoratifs. Contrairement aux acteurs existants, qui travaillent soit d\'autres bois du vignoble (Niko & Co), soit un matériau composite coupé du geste artisanal (Les Princes Sarments, Vitis Valorem), SARMENTS conserve le sarment dans sa forme naturelle.', ML, YC, 700, 'body', { fs: 19 }),
      KEEPB('Cœur de cible : les 25-45 ans qui achètent une histoire plus qu\'une lampe.', ML, 700),
      ring(640, '#EEF2FD'), ring(480, '#DCE4FB'), ring(320, C.sel), ring(160, BLUE),
      lab('Périphérique', 'prescripteurs & relais', ccy - 300), lab('Secondaire', 'domaines & œnotourisme (B2B)', ccy - 220),
      lab('Principale', 'œnophiles & œnotouristes', ccy - 140), T('<b>Cœur</b><br>éco-design lovers', ccx - 70, ccy - 22, 140, 'body', { ff: 'sans', fs: 14, lh: 1.3, al: 'center', col: '#FFFFFF', anim: { type: 'none' } }),
      atBottom(T('Personas : Camille (cœur), Laurent (principale), Sophie (secondaire)', ccx - 320, 0, 640, 'caption', { al: 'center' }))
    ]));
  }
  P.push(persona({ tag: 'Cœur de cible · B2C', name: 'Camille Rousseau', meta: '32 ans · chargée de communication dans une agence bordelaise · Bac+5 · 2 200 à 2 800 € net par mois',
    quote: 'Je préfère une seule belle pièce qui a une histoire à trois objets sans âme.',
    fields: [['Situation', 'En couple depuis 4 ans, locataire à Bacalan (Bordeaux). Projet d\'achat immobilier d\'ici 2 à 3 ans.'],
      ['Style de vie', 'Suit des créateurs et artisans locaux sur Instagram et TikTok, achète sur les marchés d\'art et en concept-store. Écolo sans être militante.'],
      ['Motivations', 'Un objet qui raconte quelque chose, soutenir le local, une pièce unique. Un cadeau à soi-même ou pour une crémaillère.'],
      ['Freins', 'Le « naturel » de grande surface qui sonne faux, le greenwashing. Sous 80 €, elle doute ; au-delà de 250 €, elle compare et hésite.'],
      ['Parcours d\'achat', 'Découvre sur Instagram, vérifie l\'histoire sur le site, voit la lampe en concept-store ou sur un marché, achète.'],
      ['Canaux', 'Instagram, Pinterest, TikTok, concept-stores du centre de Bordeaux, marchés de créateurs.']],
    brings: 'Une lampe unique dont elle peut raconter l\'origine (domaine, cépage), dans son budget.' }));
  P.push(persona({ tag: 'Cible principale · B2C', name: 'Laurent Mercier', meta: '58 ans · cadre dirigeant dans l\'industrie · Nantes · revenus confortables',
    quote: 'Offrir encore un tire-bouchon ? Non. Je veux offrir un vrai morceau de vigne.',
    fields: [['Situation', 'Marié, deux enfants adultes, propriétaire d\'une maison. Cave d\'environ 300 bouteilles, membre d\'un club de dégustation.'],
      ['Habitudes', 'Séjourne deux fois par an dans le Bordelais (Médoc, Saint-Émilion), visite des domaines, achète en boutique de propriété.'],
      ['Motivations', 'Un cadeau original et symbolique pour un ami amateur de vin, un souvenir de visite, un objet pour son bureau ou sa cave.'],
      ['Freins', 'Les gadgets « vin » génériques (bouchons recyclés, tonneaux). Il exige une finition irréprochable.'],
      ['Déclencheurs', 'Une visite de domaine, un salon (Bordeaux Fête le Vin, Vinexpo), un caviste.'],
      ['Budget', '150 à 300 €.']],
    brings: 'Le sarment du domaine qu\'il vient de visiter, devenu lampe : un souvenir qui vient littéralement de la vigne.' }));
  P.push(persona({ tag: 'Cible secondaire · B2B', name: 'Sophie Lartigue', meta: '45 ans · co-gérante du Vignoble Lartigue · Entre-deux-Mers · domaine familial, 3e génération, 15 à 25 ha',
    quote: 'Nos visiteurs repartent avec une bouteille. J\'aimerais qu\'ils repartent aussi avec un morceau de notre vigne.',
    fields: [['Rôle', 'Responsable de l\'œnotourisme et de la boutique (visites, dégustations, chambres d\'hôtes). Son frère gère la vigne et la cave.'],
      ['Enjeux', 'Se différencier des domaines voisins, diversifier les revenus, gérer ses sarments depuis le durcissement des règles anti-brûlage.'],
      ['Point clé', 'Elle est à la fois fournisseuse (ses sarments) et cliente (lampes pour ses chambres et sa boutique) : un circuit fermé.'],
      ['Freins', 'Peu de temps, ne pas gêner la taille, rentabilité des objets en boutique.'],
      ['Besoin', 'Une petite série (10 à 30 lampes) au nom du domaine, avec une fiche histoire pour les visiteurs.'],
      ['Canaux', 'Wine Paris & Vinexpo Paris, syndicat d\'appellation, réseau de vignerons, Instagram du domaine.']],
    brings: 'Une offre qui transforme un déchet de son domaine en objet de boutique à son nom.' }));
  {
    const quad = [
      ['S', 'Forces', '↗', ['Matière gratuite ou peu coûteuse', 'Ancrage territorial fort', 'Technique accessible en autodidacte (vannerie)', 'Storytelling puissant autour du patrimoine viticole', 'Sarment conservé entier : une matière reconnaissable']],
      ['W', 'Faiblesses', '↘', ['Difficile à standardiser et à industrialiser', 'Traitement du bois exigeant', 'Savoir-faire à acquérir ou à externaliser', 'Production lente (3 à 6 mois de séchage)', 'Marque inconnue au lancement']],
      ['O', 'Opportunités', '↗', ['Peu de concurrence directe sur le luminaire en sarment brut en Nouvelle-Aquitaine', 'Dynamique réglementaire favorable à l\'économie circulaire viticole', 'Marché de l\'upcycling en croissance', 'Luminaire haut de gamme : +7,7 % par an']],
      ['T', 'Menaces', '↘', ['Acteurs mieux financés (Les Princes Sarments) qui pourraient élargir leur gamme', 'Dépendance à la bonne volonté des domaines', 'Récolte saisonnière (novembre à mars)', 'Arrachages liés à la crise viticole']]];
    P.push(PAGE('c5', '7 · B Story', 'SWOT', [
      TTL(['SWOT']),
      LEAD('Une matière gratuite et un récit fort ; les défis sont <span class="hl">la technique et l\'approvisionnement</span>.', 852, 104, 756, { fs: 30, lh: 1.2 }),
      ...quad.flatMap(([l, t, a, items], i) => {
        const n = T(l, X4[i] - 4, YC1, W4, 'num', { fs: 120, ...(a === '↘' ? { col: C.ink } : {}) });
        return [n, T(K(t, a === '↘' ? 'g' : '') + ARROWS(items, a), X4[i], below(n, 16), W4 - 10, 'body', { fs: 16.5 })];
      })
    ]));
  }
  P.push(PAGE('c5', '7 · B Story', 'Mix marketing', [
    TTL(['Mix', 'marketing']),
    T('Produit, prix, distribution, communication : une proposition cohérente avec les personas.', 1112, 120, 496, 'body', { tone: 'sub' }),
    ...[['Produit', 'Lampe à poser, pied en sarment entier cintré, abat-jour en lin ou en papier. Pièces numérotées avec étiquette de traçabilité. Gamme de lancement courte : 2 ou 3 modèles.'],
      ['Prix', '120 à 250 € (Camille se méfie sous 80 € et hésite au-delà de 250 €). Pièce signature au-delà de 300 €. B2B sur devis.'],
      ['Distribution', 'Boutique en ligne, concept-stores bordelais, boutiques des domaines partenaires, marchés de créateurs, salons.'],
      ['Communication', 'Instagram (du rang de vigne à la lampe), QR code de traçabilité, portes ouvertes pendant la taille, presse déco, co-branding avec les domaines.']]
      .flatMap(([t, d], i) => {
        const n = T(N2(i), X4[i] - 4, YC, W4, 'num', { fs: 120 });
        return [n, T(TT(t) + `<p>${d}</p>`, X4[i], below(n, 18), W4 - 10, 'body', { fs: 17 })];
      }),
    KEEPB('Une lampe unique à 120-250 €, vendue là où Camille et Sophie achètent déjà.', ML, 760)
  ], { notes: 'Proposition cohérente avec vos notes : à valider en groupe.' }));
  P.push(PAGE('c5', '7 · B Story', 'Le nom', [
    T('Le nom', ML, YT, 700, 'eyebrow'),
    T('<mark class="sel">Sarments</mark>', 64, 140, 1540, 'cover', { fs: 220 }),
    LEAD('Pourquoi ce nom : à compléter (la matière nommée telle quelle, le pluriel, la sonorité…).', ML, 480, 860, { fs: 34, lh: 1.2 }),
    T(K('Pistes écartées') + ROWS(['Nom 1 · raison de l\'abandon', 'Nom 2 · raison de l\'abandon', 'Nom 3 · raison de l\'abandon', 'Nom 4 · raison de l\'abandon', 'Nom 5 · raison de l\'abandon'], 's'), 1112, 488, 496, 'body', { ff: 'sans', fs: 19 }),
    KEEPB('Un nom qui nomme la matière telle qu\'elle est : à affiner.', ML, 760, { pageBg: BLACK })
  ], { bg: BLACK, notes: 'Page naming : à remplir quand le naming sera finalisé.' }));

  // 8 · Fun and Games : recherches
  P.push(opener('c6', '8 · Fun and Games', '06', ['Recherches', 'graphiques'], ['Trois pistes', 'Moodboards', 'Typographie', 'Couleurs', 'Axes 1 à 3', 'Axe final'],
    { bg: BLUE, els: [I('mb3', 852, 700, 828, 488, { lock: true, anim: { type: 'reveal' } })], tb: 640 }));
  const axes = [
    ['Géométrie', 'vivante', 'mb1', 'Prendre l\'irrégularité du sarment comme une signature visuelle : nœuds, écorce, courbes, veinures, strates.', 'nœuds · écorce · courbes · veinures · strates'],
    ['La main', 'à l\'œuvre', 'mb2', 'Le design devient la traduction de la main qui fabrique : outils, assemblages, textures, imperfections, répétitions.', 'outils · assemblages · textures · imperfections · répétitions'],
    ['Ombre', '& lumière', 'mb3', 'Ce n\'est plus seulement le sarment qui est montré : c\'est la lumière qui révèle sa présence, par les ombres projetées et les motifs.', 'projection · révélation · contraste · chaleur · motif']];
  P.push(PAGE('c6', '8 · Fun and Games', 'Trois pistes', [
    TTL(['Trois', 'pistes']),
    LEAD('Trois façons de traduire le sarment en identité : par sa <span class="hl">matière</span>, par le <span class="hl">geste</span> qui le travaille, par la <span class="hl">lumière</span> qui le révèle.', 852, 112, 756, { fs: 28, lh: 1.22 }),
    ...axes.flatMap(([a, b, mb, intent, kw], i) => [
      I(mb, X3[i], YC, W3, 350),
      T(K(`Axe ${i + 1}`) + TT(`${a} ${b}`) + `<p class="s">${intent}</p>` + PILLS(kw.split(' · ')).replace('<p>', '<p class="row">'), X3[i], YC + 378, W3, 'body', { fs: 16 })])
  ]));
  const mbData = [
    ['strates · courbes de niveau · cernes · vrilles · écorce', [['#224939', 'Vert forêt'], ['#643B24', 'Brun sarment'], ['#755E49', 'Écorce'], ['#BEB59C', 'Sauge'], ['#E2D4C7', 'Papier'], ['#E9A23B', 'Vrille']],
      'Très cohérent : lignes, strates et cernes. L\'image la plus spécifique est la vrille sur ciel bleu : la seule qui ne peut venir que de la vigne.', 'La vrille et les strates du sarment, plutôt que les courbes de niveau génériques.'],
    ['geste · outil · empreinte · assemblage · kraft', [['#F1EAE3', 'Crème'], ['#C5A88A', 'Kraft'], ['#9A7D65', 'Bois clair'], ['#412F22', 'Noyer'], ['#595B49', 'Olive'], ['#111910', 'Encre']],
      'Belles textures et empreintes de cernes façon tampon. Les codes de l\'artisanat (mains, atelier, kraft) sont partagés par toutes les marques artisanales.', 'Garder l\'empreinte (le tampon) plutôt que l\'image de l\'atelier.'],
    ['projection · révélation · contraste · chaleur · motif', [['#010101', 'Noir'], ['#423931', 'Ombre'], ['#674F3B', 'Bois'], ['#A28669', 'Ambre'], ['#BAAD9B', 'Pierre'], ['#E0D7C6', 'Lumière']],
      'La piste la plus liée au produit : une lampe révèle le sarment par son ombre. Les références sont surtout géométriques : à compléter par de vraies ombres de sarments.', 'La lumière révèle le sarment : la piste la plus proche du produit.']];
  axes.forEach(([a, b, mb], i) => {
    const [kw, pal, txt, keep] = mbData[i];
    const sw = (756 - 5 * 12) / 6;
    P.push(PAGE('c6', '8 · Fun and Games', `Moodboard ${i + 1}`, [
      TTL([a, b], ML, YT, 760, { fs: 120 }),
      I(mb, 852, YT, 756, 535),
      ...pal.flatMap(([hex, n], j) => [R(852 + j * (sw + 12), 655, sw, 110, hex, { anim: { type: 'none' } }),
        T(`${n}<br>${hex}`, 852 + j * (sw + 12), 781, sw, 'caption', { anim: { type: 'none' } })]),
      T(`<span class="hl">Moodboard ${i + 1}</span> · Axe ${i + 1}`, ML, YC, 700, 'h3', { fs: 22, fw: 400 }),
      T(PILLS(kw.split(' · ')), ML, YC + 56, 700, 'body', { ff: 'sans', fs: 15, anim: { type: 'none' } }),
      T(txt, ML, YC + 150, 640, 'body', { fs: 19 }),
      KEEPB(keep, ML, 700)
    ], { notes: 'Références réunies pour l\'axe ' + (i + 1) + '. Palette extraite des images.' }));
  });
  P.push(PAGE('c6', '8 · Fun and Games', 'Recherches typographiques', [
    TTL(['Recherches', 'typographiques']),
    ...[['Piste 1 · Serif organique', { it: true }, 'Inspiration : « SAGE GLOW » (moodboard 1). À tester : une serif aux formes végétales.'],
      ['Piste 2 · Serif contrastée', { fw: 600 }, 'Inspirations : « Angle Violin », « Die Jelk » (moodboard 2) : contraste fort et ligatures.'],
      ['Piste 3 · Linéale', { ff: 'sans', fw: 600 }, 'Inspiration : les ombres typographiques du moodboard 3.']]
      .flatMap(([t, o, d], i) => {
        const x = X3[i];
        return [T(t, x, YC, W3, 'eyebrow'),
          T('Aa', x - 6, YC + 30, W3, 'num', { ff: 'serif', fs: 200, col: C.ink, ...o }),
          T('Sarments · matière, geste, lumière', x, YC + 260, W3, 'lead', { ff: 'serif', fs: 28, ...o }),
          T(d, x, YC + 330, 440, 'small')];
      }),
    KEEPB('À compléter : la piste retenue et pourquoi.', ML, 760)
  ], { notes: 'Remplace les « Aa » par vos vrais essais (captures ou textes dans la police choisie).' }));
  {
    const hh = 196;
    P.push(PAGE('c6', '8 · Fun and Games', 'Recherches chromatiques', [
      TTL(['Recherches', 'chromatiques']),
      T('Une palette par axe, extraite des moodboards.', 1242, 120, 366, 'body', { tone: 'sub' }),
      ...mbData.flatMap(([, pal], r) => {
        const y = YC + r * (hh + 26), sw = 168;
        return [T(K(`Axe ${r + 1}`) + TT(`${axes[r][0]} ${axes[r][1]}`), ML, y, 320, 'body'),
          ...pal.flatMap(([hex, n], j) => [R(440 + j * (sw + 24), y, sw, hh - 66, hex),
            T(`${n} · ${hex}`, 440 + j * (sw + 24), y + hh - 50, sw + 20, 'caption', { anim: { type: 'none' } })])];
      })
    ]));
  }
  P.push(...axePages(1, 'Géométrie vivante', 'Géométrie', 'vivante', 'mb1', axes[0][3], axes[0][4],
    'Une base solide : la piste parle directement de la matière (nœuds, strates).',
    'Elle ne dit rien de la lumière, donc du produit ; les courbes de niveau sont un code très répandu.',
    'Une base solide mais incomplète : il faut relier la matière à la lumière.', '9 · Midpoint'));
  P.push(...axePages(2, 'La main à l\'œuvre', 'La main', 'à l\'œuvre', 'mb2', axes[1][3], axes[1][4],
    'Authentique : le geste, l\'outil, l\'empreinte rendent la fabrication visible.',
    'Les codes de l\'artisanat (mains, atelier, kraft) sont partagés par toutes les marques artisanales : faible différenciation.',
    'Authentique mais trop générique : il faut un signe propre au sarment.', '10 · Bad Guys Close In'));
  P.push(...axePages(3, 'Ombre & lumière', 'Ombre', '& lumière', 'mb3', axes[2][3], axes[2][4],
    'Le plus proche du produit : une lampe révèle le sarment par son ombre.',
    'Des références trop géométriques pour une matière organique : à tester avec de vraies ombres de sarments.',
    'La bonne direction : la lumière révèle la matière.', '11 · All Is Lost', true));
  P.push(PAGE('c6', '12 · Dark Night of the Soul', 'Axe final', [
    FRAME('Logo final', 72, YT, 1016, YB - YT),
    T('Axe final', 1112, YT, 496, 'eyebrow'),
    TTL(['La ligne', 'du sarment,', '<mark class="sel">révélée</mark>', '<mark class="sel">par la lumière</mark>'], 1112, 140, 496, { fs: 60 }),
    T('La ligne vivante du sarment (axe 1) révélée par la lumière (axe 3), avec la trace de la main (axe 2) dans les textures et l\'étiquette. Proposition à valider.', 1112, 500, 496, 'body'),
    KEEPB('La réponse graphique à la problématique, en une image.', 1112, 496, { pageBg: BLUE })
  ], { bg: BLUE, notes: 'Ce n\'est qu\'une proposition de synthèse : c\'est à vous de décider quel axe l\'emporte.' }));

  // 13 · Break into Three : charte
  P.push(opener('c7', '13 · Break into Three', '07', ['Charte', 'graphique'], ['Logo', 'Typographies', 'Couleurs', 'Motifs & photographie', 'Règles d\'usage'],
    { els: [IG('sarment', 900, 800, 680, 236, { fit: 'contain', r: -8, lock: true, anim: { type: 'zoom' } })], tb: 700 }));
  P.push(PAGE('c7', '13 · Break into Three', 'Le logo', [
    TTL(['Le logo']),
    T('Construction, version monochrome, taille minimale : à compléter.', 1112, 120, 496, 'body', { tone: 'sub' }),
    FRAME('Logo principal', 72, YC1, 1016, YB - YC1), FRAME('Version réduite', 1112, YC1, 496, 370), FRAME('Zone de protection', 1112, YC1 + 394, 496, 370)
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Typographies', [
    TTL(['Typographies']),
    T('Typographies provisoires du dossier : à remplacer par celles de l\'axe final.', 1112, 120, 496, 'body', { tone: 'sub' }),
    T('Titres · Inter Tight', ML, YC1, 700, 'eyebrow'),
    T('Aa', 60, YC1 + 30, 700, 'num', { ff: 'sans', fw: 600, fs: 220, col: C.ink }),
    T('ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 € % « » ’ — …', ML, YC1 + 270, 720, 'lead', { fs: 26, lh: 1.3 }),
    T('Texte · Minion Pro', 852, YC1, 700, 'eyebrow'),
    T('Aa', 846, YC1 + 30, 700, 'num', { ff: 'serif', fs: 220, col: C.ink }),
    T('ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 € % « » ’ — …', 852, YC1 + 270, 720, 'lead', { ff: 'serif', fs: 28, lh: 1.3 }),
    T('Titre', ML, 800, 366, 'h2', { fs: 72 }),
    T('Chapeau à <span class="hl">deux tons</span>, pour ouvrir une page.', 462, 800, 366, 'lead', { fs: 26, lh: 1.2 }),
    T('Texte courant : la Minion reste lisible en petit et garde de l\'élégance en grand.', 852, 800, 366, 'body'),
    T('<p class="ar">↘</p><p>Chiffres fins en bleu, flèches en tête des points.</p>', 1242, 800, 366, 'body', { ff: 'sans', fs: 17 })
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Couleurs', [
    TTL(['Couleurs']),
    T('Palette provisoire, à remplacer par celle de l\'axe final.', 1112, 120, 496, 'body', { tone: 'sub' }),
    ...[[C.ink, 'Encre', 'Texte, titres, logo'], [BLUE, 'Cobalt', 'Pages fortes, chiffres, accents'], [C.sel, 'Sélection', 'Surlignage'], [C.card, 'Papier', 'Fonds, tableaux'], [C.green, 'Vigne', 'Graphiques, nature']]
      .flatMap(([hex, n, u], i) => [R(X5[i], YC1, W5, 500, hex),
        T(TT(n) + `<p class="s">${hex}<br>${u}</p>`, X5[i], YC1 + 528, W5, 'body', { fs: 16.5 })])
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Motifs & photographie', [
    TTL(['Motifs &', 'photographie']),
    FRAME('Motif 1', 72, YC, 366, 366), FRAME('Motif 2', 462, YC, 366, 366),
    T(K('Principe', 'g') + '<p>Les motifs viennent de la matière (cernes, nœuds, vrilles) ; la photographie montre le sarment en noir et blanc, net, dans la lumière.</p>', 72, YC + 400, 700, 'body', { fs: 19 }),
    FRAME('Direction photo : noir et blanc, lumière rasante, matière en gros plan', 852, YC, 756, HC)
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Règles d\'usage', [
    TTL(['Règles', 'd\'usage']),
    T(AR('↗') + TT('À faire'), 72, YC, 700, 'body'), T(AR('↘') + TT('À éviter'), 852, YC, 700, 'body'),
    FRAME('Bon usage 1', 72, YC + 100, 366, 440), FRAME('Bon usage 2', 462, YC + 100, 366, 440),
    FRAME('Mauvais usage 1', 852, YC + 100, 366, 440), FRAME('Mauvais usage 2', 1242, YC + 100, 366, 440),
    T('Une ligne d\'explication sous chaque exemple.', 72, YC + 564, 366, 'small'), T('Une ligne d\'explication.', 462, YC + 564, 366, 'small'),
    T('Une ligne d\'explication sous chaque exemple.', 852, YC + 564, 366, 'small'), T('Une ligne d\'explication.', 1242, YC + 564, 366, 'small')
  ]));

  // 14 · Finale : déclinaisons
  P.push(opener('c8', '14 · Finale', '08', ['Les', 'déclinaisons'], ['Étiquette de traçabilité', 'Packaging', 'Site & réseaux', 'Boutique & salon'],
    { bg: BLUE, els: [IG('fagots', 852, 700, 828, 488, { fy: 0.42, lock: true, anim: { type: 'reveal' } })], tb: 640 }));
  const decl = (name, title, lines, frames, text, keep) => PAGE('c8', '14 · Finale', name, [
    TTL(lines), ...frames,
    T(K(title) + `<p>${text}</p>`, 1112, YC, 496, 'body', { fs: 19 }),
    KEEPB(keep, 1112, 496)]);
  P.push(decl('Étiquette de traçabilité', 'L\'étiquette', ['L\'étiquette de', 'traçabilité'],
    [FRAME('Mockup étiquette : domaine, cépage, saison de taille, QR code', 72, YC, 1016, HC)],
    'Chaque pied de lampe porte le nom de son domaine, son cépage et sa saison de taille. Un QR code renvoie à l\'histoire de la pièce.', 'La traçabilité, rendue visible et tangible.'));
  P.push(decl('Packaging', 'Le packaging', ['Le', 'packaging'],
    [FRAME('Mockup packaging fermé', 72, YC, 496, HC), FRAME('Mockup packaging ouvert', 592, YC, 496, HC)],
    'À compléter : matériaux, format, ouverture, message à l\'intérieur.', 'À compléter : ce que le packaging raconte.'));
  P.push(decl('Site & réseaux', 'Site & réseaux', ['Site &', 'réseaux'],
    [FRAME('Maquette du site (ordinateur)', 72, YC, 640, HC), FRAME('Post Instagram', 736, YC, 352, HH2), FRAME('Vidéo making-of : insère un MP4 avec l\'outil Vidéo', 736, YC + HH2 + GAP, 352, HH2)],
    'Instagram raconte le parcours du rang de vigne à la lampe ; le site relie chaque pièce à son domaine.', 'Du rang de vigne à la lampe, en images.'));
  P.push(decl('Boutique & salon', 'En situation', ['Boutique', '& salon'],
    [FRAME('Mise en situation : boutique de domaine', 72, YC, 1016, HH2), FRAME('Stand de salon', 72, YC + HH2 + GAP, 496, HH2), FRAME('Chambre d\'hôtes', 592, YC + HH2 + GAP, 496, HH2)],
    'La lampe dans les lieux où Camille, Laurent et Sophie la rencontrent.', 'À compléter : l\'objet dans son contexte.'));

  // 15 · Final Image : conclusion & sources
  P.push(PAGE('c9', '15 · Final Image', 'Conclusion', [
    TTL(['Conclusion'], ML, YT, 980),
    LEAD('Comment le design peut-il transformer les <mark class="sel">irrégularités naturelles</mark> du sarment de vigne, aujourd\'hui brûlé ou broyé, en qualités esthétiques et fonctionnelles pour créer un <mark class="sel">luminaire artisanal contemporain</mark> ?', ML, YC1, 920, { fs: 36, lh: 1.2 }),
    ITEM('Notre réponse', 'À rédiger : 3 à 5 lignes qui reprennent la problématique et montrent comment l\'identité y répond.', ML, 640, 760, { ar: '↘', fs: 22 }),
    KEEPB('Bilan et ouverture : à compléter.', ML, 760, { pageBg: BLACK }),
    FRAME('Image finale : la lampe allumée, son ombre au mur', 1112, 0, 568, 1188, { lock: true })
  ], { bg: BLACK, notes: 'Final Image : reprends la problématique mot pour mot et réponds-y.' }));
  P.push(PAGE('c9', '15 · Final Image', 'Sources', [
    TTL(['Sources']),
    T('Format : organisme ou auteur, titre, date, lien.', 1112, 120, 496, 'body', { tone: 'sub' }),
    T(K('Chiffres & études') + ROWS(['F.G.V.B. (Fédération des Grands Vins de Bordeaux) : chiffres de la ressource.', 'Syndicat du luminaire, via Lightzoomlumière : marché français.', 'Étude du marché mondial du luminaire haut de gamme (20,26 Md$, 2024) : nommer l\'éditeur.', 'Circulaire du 18 novembre 2011 relative au brûlage des déchets verts.', 'ADEME, appel à projets Agr\'air.', 'Association environnementale à l\'origine du calcul « 130 000 voitures » : à nommer.'].map((s, i) => `<span class="acc">${N2(i)}</span>  ${s}`)), 72, YC1, 700, 'body', { fs: 19 }),
    T(K('Sites & entreprises') + ROWS(['Toutlevin.com, « La surprenante seconde vie de la vigne et du raisin ».', 'Les Princes Sarments, lesprincessarments.fr.', 'Vitis Valorem.', 'Niko & Co.', 'Market Set (à vérifier).'].map((s, i) => `<span class="acc">${N2(i + 6)}</span>  ${s}`)), 852, YC1, 700, 'body', { fs: 19 })
  ]));

  const pages = P;
  for (const p of pages) p.tplSig = pageSig(p);
  return {
    meta: { title: 'Dossier SARMENTS', brand: 'Sarments', order: pages.map(p => p.id), v: 1, tpl: TPL_VERSION, createdAt: Date.now() },
    pages
  };
}

/* ---------------------------------------------------------------- galerie « Nouvelle page » */
const LAYOUTS = [
  { key: 'vierge', name: 'Page vierge', build: () => [] },
  { key: 'titre-texte', name: 'Titre + texte', build: () => [
    TTL(['Titre de', 'la page']), LEAD('Chapeau à <span class="hl">deux tons</span> : ce que montre la page.', 1112, 120, 496, { fs: 28, lh: 1.2 }),
    T('Texte courant. Double-clique pour écrire.', 462, YC, 600, 'body'),
    KEEPB('Une phrase qui résume la page.', ML, 760)] },
  { key: 'colonnes', name: 'Trois points numérotés', build: () => [
    TTL(['Titre de', 'la page']),
    ...X3.flatMap((x, i) => { const n = T(N2(i), x - 6, YC, W3, 'num', { fs: 130 }); return [n, ITEM('Titre du point', 'Texte du point. Double-clique pour écrire.', x, below(n, 18), 440)]; }),
    KEEPB('Une phrase qui résume la page.', ML, 760)] },
  { key: 'page-bleue', name: 'Page bleue', bg: BLUE, build: () => [
    TTL(['Titre de', 'la page']),
    LEAD('Une phrase forte, avec un <mark class="sel">mot surligné</mark>.', ML, YC, 1300, { fs: 46 }),
    ...X3.map(x => T(AR('↘') + '<p>Texte courant. Double-clique pour écrire.</p>', x, 600, 440, 'body')),
    KEEPB('Une phrase qui résume la page.', ML, 760, { pageBg: BLUE })] },
  { key: 'texte-image', name: 'Texte + image', build: () => [
    TTL(['Titre de', 'la page'], ML, YT, 980), T('Texte courant. Double-clique pour écrire.', ML, YC, 700, 'body'),
    KEEPB('Une phrase qui résume la page.', ML, 760), FRAME('Glisse une photo ici (noir et blanc dans l\'inspecteur)', 1112, 0, 568, 1188, { lock: true })] },
  { key: 'image-texte', name: 'Image + texte', build: () => [
    FRAME('Glisse une photo ici', 0, 0, 640, 1188, { lock: true }), TTL(['Titre de', 'la page'], 712, YT, 896),
    T('Texte courant. Double-clique pour écrire.', 712, YC, 700, 'body'), KEEPB('Une phrase qui résume la page.', 712, 760)] },
  { key: 'pleine', name: 'Image pleine page', bg: BLACK, build: () => [
    FRAME('Glisse une photo ici', 0, 0, 1680, 1188, { lock: true }), R(0, 0, 1680, 1188, '#000000', { o: 0.35, lock: true }),
    atBottom(TTL(['Grand', '<mark class="sel">titre</mark>'], ML, 0, 1400, { st: 'h1' }), YB, BLACK)] },
  { key: 'deux-images', name: 'Deux images', build: () => [
    TTL(['Titre de', 'la page']), FRAME('Photo 1', 72, YC, 756, HC - 44), FRAME('Photo 2', 852, YC, 756, HC - 44),
    atBottom(T('Légende de la photo 1', 72, 0, 756, 'caption')), atBottom(T('Légende de la photo 2', 852, 0, 756, 'caption'))] },
  { key: 'quatre', name: 'Quatre colonnes', build: () => [
    TTL(['Titre de', 'la page']), LEAD('Chapeau : ce que montrent les quatre colonnes.', 1112, 120, 496, { fs: 28, lh: 1.2 }),
    ...X4.flatMap((x, i) => [FRAME('Photo', x, YC, W4, 250), T(TT('Titre ' + (i + 1)) + '<p class="s">Texte court.</p>', x, YC + 274, W4, 'body', { fs: 16 })]),
    KEEPB('Une phrase qui résume la page.', ML, 760)] },
  { key: 'citation', name: 'Grande citation', bg: BLUE, build: () => [
    LEAD('« Une phrase forte, <mark class="sel">en grand</mark>. »', ML, 360, 1400, { fs: 84, lh: 1.08 }), T('Auteur ou source', ML, 760, 600, 'label')] },
  { key: 'chiffres', name: 'Chiffres clés', build: () => [
    TTL(['Chiffres', 'clés']),
    ...X3.flatMap(x => STAT('00 %', 'Ce que mesure ce chiffre, et sa source.', x, YC, 440, { fs: 150 })),
    KEEPB('Ce que disent ces chiffres.', ML, 760)] },
  { key: 'intercalaire', name: 'Ouverture de partie', bg: BLACK, build: () => [
    FRAME('Photo de la partie', 852, 700, 828, 488, { lock: true }), T('00', 60, 60, 600, 'num', { fs: 220 }),
    atBottom(TTL(['Titre', '<mark class="sel">de la partie</mark>'], ML, 0, 1536, { st: 'h1' }), 640, BLACK),
    atBottom(T(ARROWS(['Sous-partie', 'Sous-partie', 'Sous-partie', 'Sous-partie']), ML, 0, 720, 'body', { ff: 'sans', fs: 20, lh: 1.3, cols: 2, colGap: 40 }), YB, BLACK)] },
  { key: 'moodboard', name: 'Moodboard', build: () => [
    FRAME('Image', 72, 96, 620, 470), FRAME('Image', 716, 96, 400, 470), FRAME('Image', 1140, 96, 468, 676), FRAME('Image', 72, 590, 300, 474),
    FRAME('Image', 396, 590, 720, 474), FRAME('Image', 1140, 796, 468, 268)] },
  { key: 'persona', name: 'Persona', build: () => persona({ tag: 'Cible', name: 'Prénom Nom', meta: 'Âge · métier · lieu', quote: 'Sa phrase qui résume tout.',
    fields: [['Situation', '…'], ['Style de vie', '…'], ['Motivations', '…'], ['Freins', '…'], ['Parcours', '…'], ['Canaux', '…']], brings: 'Ce que la marque lui apporte.' }).els },
  { key: 'fiche', name: 'Fiche concurrent', build: () => fiche({ short: 'Concurrent', type: 'Type de concurrent', name: 'Nom', place: 'Lieu', pos: '…', cible: '…', prix: '…', canaux: '…', force: '…', faiblesse: '…', retenir: 'Ce qu\'on en retient.' }).els },
  { key: 'process', name: 'Process en 5 étapes', build: () => [
    TTL(['Titre du', 'process']),
    ...X5.flatMap((x, i) => [T(N2(i), x - 4, YC - 12, W5, 'num', { fs: 84 }), FRAME('Photo', x, YC + 88, W5, 300),
      T(TT('Étape') + '<p class="s">Description courte.</p>', x, YC + 412, W5, 'body', { fs: 15.5 })])] },
  { key: 'galerie', name: 'Recherches (6 cadres)', build: () => [
    TTL(['Recherches']),
    ...[0, 1, 2, 3, 4, 5].map(i => FRAME('Croquis ' + (i + 1), X3[i % 3], i < 3 ? YC1 : YC1 + 394, W3, 370))] },
  { key: 'mockup', name: 'Mise en situation', build: () => [
    FRAME('Mockup', 72, YT, 1016, YB - YT), TTL(['Titre de', 'la page'], 1112, YT, 496, { fs: 64 }),
    T(K('Intertitre') + '<p>Ce que montre la mise en situation.</p>', 1112, YC, 496, 'body', { fs: 19 }), KEEPB('Une phrase.', 1112, 496)] }
];
