/* ==========================================================================
   Modèle « SARMENTS » (version 2) : grille stricte, cartes arrondies, filets.
   Toutes les positions sont en px de page (A3 paysage 1680 × 1188).
   Chaque page suit la même trame : surtitre et titre en haut (y 104),
   contenu ancré dans la zone 344 à 1084, « À retenir » posé sur le bas.
   ========================================================================== */
const TPL_VERSION = 2;
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

/* Trame verticale et colonnes */
const Y0 = 104, YT = 132, YC = 344, YB = 1084, RAD = 28, GAP = 24;
const X2 = [cx(1), cx(7)], W2 = cw(6);
const X3 = [cx(1), cx(5), cx(9)], W3 = cw(4);
const X4 = [cx(1), cx(4), cx(7), cx(10)], W4 = cw(3);

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
/* Les photos sont arrondies, sauf quand elles touchent le bord de la page. */
function I(img, x, y, w, hh, o = {}) {
  const base = typeof img === 'string' ? (IMG[img] || { src: '' }) : (img || { src: '' });
  const bleed = x <= 0 || y <= 0 || x + w >= PW || y + hh >= PH;
  return {
    id: uid(), t: 'image', x, y, w, h: hh, r: 0, o: 1, src: base.src || '', nw: base.nw || 0, nh: base.nh || 0,
    fit: 'cover', zoom: 1, fx: 0.5, fy: 0.5, gray: false, ph: '', rad: bleed ? 0 : RAD, anim: { type: 'fade' }, ...o
  };
}
const FRAME = (text, x, y, w, hh, o = {}) => I(null, x, y, w, hh, { ph: typo(text), ...o });
function R(x, y, w, hh, fill, o = {}) {
  return { id: uid(), t: 'shape', shape: 'rect', x, y, w, h: hh, r: 0, o: 1, fill, stroke: null, sw: 0, rad: 0, anim: { type: 'none' }, ...o };
}
const ELL = (x, y, w, hh, fill, o = {}) => R(x, y, w, hh, fill, { shape: 'ellipse', ...o });
const LINE = (x, y, w, thick = 1.5, color = C.hair, o = {}) => R(x, y, w, thick, color, o);
const BOX = (x, y, w, hh, fill = C.card, o = {}) => R(x, y, w, hh, fill, { rad: RAD, ...o });
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

/* Fragments de texte structuré (cartes, listes à filets, pastilles) */
const K = (label, cls = '') => `<p class="k${cls ? ' ' + cls : ''}">${label}</p>`;
const TT = s => `<p class="t">${s}</p>`;
const ROWS = (arr, cls = '') => arr.map(s => `<p class="row${cls ? ' ' + cls : ''}">${s}</p>`).join('');
const FIELDS = arr => arr.map(([l, t], i) => `<p class="k g row${i ? '' : ' first'}">${l}</p><p>${t}</p>`).join('');
const PILLS = arr => `<p>${arr.map(a => `<span class="pill">${a}</span>`).join('')}</p>`;
const LI = arr => arr.map(s => `<p class="li">${s}</p>`).join('');

function CARD(html, x, y, w, hh, o = {}) { return T(html, x, y, w, 'card', { h: hh, ...o }); }
function KEEP(text, x, y, w, o = {}) {
  const { label, ...rest } = o;
  return T(K(label || 'À retenir') + `<p>${text}</p>`, x, y, w, 'keep', rest);
}
function TITLE(a, b, x = ML, y = YT, w = 756, st = 'h2', o = {}) {
  const html = b == null ? `<p>${a}</p>` : b === '' ? `<p><mark class="sel">${a}</mark></p>` : `<p>${a}</p><p class="ind"><mark class="sel">${b}</mark></p>`;
  return T(html, x, y, w, st, o);
}
function HEAD(eb, a, b, o = {}) {
  const x = o.x == null ? ML : o.x, w = o.w || 756;
  return [T(eb, x, Y0, w, 'eyebrow'), TITLE(a, b, x, YT, w, o.st || 'h2', o.t || {})];
}

/* Mesure d'un élément dans la page (polices chargées) pour l'ancrer en bas. */
let MEAS = null;
function measureH(el, bg = '#FFFFFF') {
  const host = typeof document !== 'undefined' && document.getElementById('xhost');
  if (!host) return el.h || 40;
  if (!MEAS || !MEAS.isConnected) { MEAS = document.createElement('div'); host.append(MEAS); }
  MEAS.className = 'pg mode-export' + (isDark(bg) ? ' is-dark' : '');
  MEAS.style.background = bg;
  const node = renderEl(el, 'export', { bg, els: [] }, 1);
  MEAS.replaceChildren(node);
  const hh = Math.ceil(node.getBoundingClientRect().height);
  MEAS.replaceChildren();
  return hh || el.h || 40;
}
function atBottom(el, yb = YB, bg) { el.y = Math.round(yb - measureH(el, bg)); return el; }
const KEEPB = (text, x = ML, w = 1536, o = {}) => atBottom(KEEP(text, x, 0, w, o), o.yb || YB, o.pageBg);
/* Carte avec un bloc de texte posé en bas (titre en haut, détails en bas). */
function CARDB(topHTML, bottomHTML, x, y, w, hh, o = {}) {
  const pad = o.pad || [32, 34];
  const card = CARD(topHTML, x, y, w, hh, { ...(o.card || {}), pad });
  const foot = atBottom(T(bottomHTML, x + pad[1], 0, w - 2 * pad[1], o.st || 'body', { fs: 15, anim: { type: 'none' }, ...(o.foot || {}) }), y + hh - pad[0], o.bg);
  return [card, foot];
}

/* ---------------------------------------------------------------- blocs réutilisés */
function opener(chapter, beat, num, a, b, list, bgEls = [], o = {}) {
  const bg = o.bg || '#FFFFFF', dark = isDark(bg);
  const x = o.x == null ? ML : o.x, w = o.tw || 756;
  return PAGE(chapter, beat, 'Ouverture · ' + chapterOf(chapter).name, [
    ...bgEls,
    T(num, x, 92, 400, 'num', { fs: 150, col: o.numCol || C.handle }),
    TITLE(a, b, x, 668, w, 'h1', o.tfs ? { fs: o.tfs } : {}),
    LINE(x, 962, w, 1.5, dark ? '#3A3A3C' : C.hair, { lock: true }),
    T(PILLS(list), x, 990, w, 'body', { fs: 15, anim: { type: 'fade' } })
  ], { header: false, folio: false, bg: o.bg, notes: o.notes });
}

function fiche(d) {
  const els = [
    d.photo ? I(d.photo, 72, Y0, 496, 616) : FRAME('Photo produit principale', 72, Y0, 496, 616),
    FRAME('Photo produit', 72, 744, 236, 340),
    FRAME('Photo d\'ambiance ou de communication', 332, 744, 236, 340),
    T(d.type, 592, Y0, 700, 'eyebrow'),
    T(d.name, 592, YT, 820, 'h2', { fs: 66 }),
    T(d.place, 592, 222, 820, 'small'),
    FRAME('Logo', 1448, Y0, 160, 96),
    BOX(592, 290, 1016, 380),
    T(FIELDS([['Positionnement', d.pos], ['Canaux & communication', d.canaux]]), 626, 324, 452, 'body', { fs: 15.5 }),
    T(FIELDS([['Cible', d.cible], ['Prix', d.prix], ['Identité visuelle', d.ident || 'À compléter : palette, typographie, ton.']]), 1122, 324, 452, 'body', { fs: 15.5 })
  ];
  const keep = KEEPB(d.retenir, 592, 1016);
  const top = 694, hh = keep.y - GAP - top;
  els.push(CARD(K('Force', 'green') + `<p>${d.force}</p>`, 592, top, 496, hh, { bg: C.cardGreen, fs: 16 }),
    CARD(K('Faiblesse', 'brown') + `<p>${d.faiblesse}</p>`, 1112, top, 496, hh, { bg: C.cardBrown, fs: 16 }), keep);
  return PAGE('c4', '5 · Debate', 'Fiche · ' + d.short, els, { notes: d.notes });
}
function persona(d) {
  const f = d.fields;
  const els = [
    FRAME('Portrait libre de droits (Unsplash, Pexels…)', 72, Y0, 496, 980),
    T(d.tag, 592, Y0, 1016, 'eyebrow'),
    T(d.name, 592, YT, 1016, 'h2', { fs: 66 }),
    T(d.meta, 592, 222, 1016, 'small'),
    T('« ' + d.quote + ' »', 592, 282, 1016, 'quote', { fs: 30 }),
    T(FIELDS(f.slice(0, 3)), 592, 410, 496, 'body', { fs: 15.5 }),
    T(FIELDS(f.slice(3)), 1112, 410, 496, 'body', { fs: 15.5 }),
    KEEPB(d.brings, 592, 1016, { label: 'Ce que Sarments lui apporte' })
  ];
  return PAGE('c5', '7 · B Story', 'Persona · ' + d.name, els, { notes: 'Persona : ajoute un portrait libre de droits. Un persona ne garde qu\'une option par champ.' });
}
function axePages(n, name, a, b, mb, intent, kw, marche, manque, keep, beat, two) {
  const pages = [];
  pages.push(PAGE('c6', beat, `Axe ${n} · Intention`, [
    I(mb, 900, 0, 780, 1188, { lock: true, anim: { type: 'reveal' } }),
    T(`Axe ${n}`, 72, Y0, 600, 'eyebrow'),
    TITLE(a, b, 72, YT, 756, 'h1'),
    T(intent, 72, 430, 700, 'lead', { fs: 28 }),
    LINE(72, 962, 756, 1.5, C.hair, { lock: true }),
    T(PILLS(kw.split(' · ')), 72, 990, 756, 'body', { fs: 15 })
  ], { notes: 'Remplace le moodboard par l\'image la plus forte de l\'axe.' }));
  const right = (x, top) => {
    const k = KEEPB(keep, x, 496);
    const hh = Math.floor((k.y - GAP - top - GAP) / 2);
    return [
      CARD(K('Ce qui marche', 'green') + `<p>${marche}</p>`, x, top, 496, hh, { bg: C.cardGreen }),
      CARD(K('Ce qui manque', 'brown') + `<p>${manque}</p>`, x, top + hh + GAP, 496, hh, { bg: C.cardBrown }),
      k];
  };
  if (two) {
    // version compacte (axe 3) : recherches à gauche, bilan à droite
    pages.push(PAGE('c6', beat, `Axe ${n} · Recherches & bilan`, [
      ...HEAD(`Axe ${n} · Recherches & bilan`, name, null, { w: 1016, t: { fs: 60 } }),
      FRAME('Croquis de logo', 72, YC, 496, 340), FRAME('Essais typographiques', 592, YC, 496, 340),
      FRAME('Motifs & textures', 72, 708, 496, 376), FRAME('Mise en situation', 592, 708, 496, 376),
      ...right(1112, YC)
    ]));
    return pages;
  }
  pages.push(PAGE('c6', beat, `Axe ${n} · Recherches`, [
    ...HEAD(`Axe ${n} · Recherches`, name, null, { w: 1016, t: { fs: 60 } }),
    T('Notes de recherche : à compléter.', 852, 150, 756, 'body', { tone: 'sub' }),
    FRAME('Croquis de logo', X3[0], YC, W3, 340), FRAME('Essais typographiques', X3[1], YC, W3, 340), FRAME('Motifs & textures', X3[2], YC, W3, 340),
    FRAME('Palette & essais couleur', 72, 708, 496, 376), FRAME('Déclinaison test', 592, 708, 1016, 376)
  ]));
  pages.push(PAGE('c6', beat, `Axe ${n} · Bilan`, [
    FRAME('Mise en situation : étiquette, post Instagram, packaging…', 72, Y0, 1016, 980),
    T(`Axe ${n} · Bilan`, 1112, Y0, 496, 'eyebrow'),
    T(name, 1112, YT, 496, 'h2', { fs: 50 }),
    ...right(1112, 300)
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
const pestelHTML = items => items.map(([k, kw, t]) => `<p class="row"><span class="tag ${k}">${TAGN[k]}</span><b>${kw}</b> ${t}</p>`).join('');

/* ---------------------------------------------------------------- le dossier */
function buildDossier() {
  const P = [];

  // 00 · Couverture : le sarment posé comme un produit, sur une grande carte claire
  P.push(PAGE('ouv', '—', 'Couverture', [
    BOX(72, 72, 1536, 760, C.card, { lock: true }),
    T('Dossier de projet · 2026', 112, 112, 700, 'eyebrow'),
    I('sarment', 170, 236, 1340, 462, { fit: 'contain', r: -5, rad: 0, anim: { type: 'zoom' } }),
    T('<mark class="sel">Sarments</mark>', 80, 878, 1000, 'cover'),
    T('Matière première, seconde vie : création d\'une marque produit', 1112, 884, 496, 'lead', { fs: 27, lh: 1.25 }),
    LINE(1112, 1006, 496),
    T('<b>Antoine</b> · <b>Quentin Lambert</b>', 1112, 1026, 496, 'body', { fs: 16 })
  ], { header: false, folio: false, notes: 'Couverture : remplace le sarment détouré par la photo de votre lampe quand elle existe (fond clair ou détourée).' }));

  // 01 · Sommaire
  P.push(PAGE('ouv', '—', 'Sommaire', [
    I('pile', 72, Y0, 756, 980, { fx: 0.4, lock: true, anim: { type: 'reveal' } }),
    T('Neuf chapitres', 852, Y0, 756, 'eyebrow'),
    TITLE('Sommaire', '', 852, YT, 756),
    T('', 852, YC, 756, 'lead', { toc: true, fs: 33, lh: 1.25, anim: { type: 'fade' } })
  ], { notes: 'Le sommaire se met à jour tout seul à partir des chapitres et des numéros de page.' }));

  // 1 · Opening Image : Brief
  P.push(PAGE('c1', '1 · Opening Image', 'Brief', [
    T('Le brief', 72, Y0, 756, 'eyebrow'),
    T('Créer une marque à partir d\'une matière première en <mark class="sel">seconde vie</mark>.', 72, YT, 756, 'h2', { fs: 62, lh: 1.08 }),
    ...[['Matière', 'Le sarment de vigne'], ['Territoire', 'Nouvelle-Aquitaine'], ['Objet', 'Le luminaire']].flatMap(([k, v], i) => {
      const x = 72 + i * 260;
      return [LINE(x, 404, 236), T(K(k, 'g') + `<p>${v}</p>`, x, 424, 236, 'body', { fs: 18 })];
    }),
    ...CARDB(K('Le projet') + TT('Du rang de vigne à la lampe'), '<p>SARMENTS transforme le sarment de vigne, coproduit brûlé ou broyé chaque hiver, en luminaires artisanaux. Le sarment est conservé entier et tracé jusqu\'à son domaine d\'origine, en Nouvelle-Aquitaine.</p>', 72, 560, 366, YB - 560, { foot: { fs: 16 } }),
    ...CARDB(K('Les attentes') + TT('Une marque complète'), '<p>Une plateforme de marque, une identité visuelle (logo, charte graphique) et ses déclinaisons : étiquette de traçabilité, packaging, réseaux sociaux, site.</p>', 462, 560, 366, YB - 560, { foot: { fs: 16 } }),
    FRAME('Photo pleine hauteur : vigne taillée en hiver, sarments au sol (à faire pendant la taille, de novembre à mars)', 900, 0, 780, 1188, { lock: true })
  ], { notes: 'Opening Image : une page d\'image. La photo de vigne en hiver sera la plus forte si vous la faites vous-mêmes.' }));

  // 2 · Theme Stated : Problématique
  P.push(PAGE('c1', '2 · Theme Stated', 'Problématique', [
    T('Problématique', 72, Y0, 600, 'eyebrow'),
    T('Comment le design peut-il transformer les <mark class="sel">irrégularités naturelles</mark> du sarment de vigne, aujourd\'hui brûlé ou broyé, en qualités esthétiques et fonctionnelles pour créer un <mark class="sel">luminaire artisanal contemporain</mark> ?', 72, YT, 1450, 'lead', { fs: 66, lh: 1.15 }),
    ...[['01', 'Matière', 'Les nœuds, l\'écorce et les courbes du sarment deviennent une signature visuelle.'],
      ['02', 'Geste', 'La main qui récolte, cintre et assemble reste visible dans l\'objet.'],
      ['03', 'Lumière', 'La lumière révèle le sarment et projette son dessin dans la pièce.']]
      .map(([n, t, d], i) => CARD(K(n) + TT(t) + `<p class="s">${d}</p>`, X3[i], 804, W3, 280, { bg: C.darkCard, fs: 17 }))
  ], { bg: C.dark, notes: 'Theme Stated : la problématique seule, en grand. Les trois mots annoncent vos trois axes.' }));

  // 3 · Set-Up : Analyse stratégique
  P.push(opener('c2', '3 · Set-Up', '02', 'Analyse', 'stratégique', ['Contexte', 'Ressource', 'Usages', 'Secteur', 'PESTELÉ', 'Marché'],
    [I('pile', 900, 0, 780, 1188, { fx: 0.55, lock: true, anim: { type: 'reveal' } })]));

  {
    const keep = KEEPB('Une ressource massive (2 t/ha/an, 93 % des coproduits viticoles) encore traitée comme un déchet.', 72, 1146);
    const bot = keep.y - GAP;
    P.push(PAGE('c2', '3 · Set-Up', 'Analyse contextuelle', [
      ...HEAD('Contexte', 'Analyse', 'contextuelle'),
      T('La viticulture française produit plus de <b>2 tonnes de sarments par hectare et par an</b>, générés lors de la taille et de l\'épamprage. Cette biomasse est aujourd\'hui majoritairement <b>brûlée, broyée ou compostée</b> et rarement valorisée comme matière noble. À l\'échelle nationale, la filière génère plus de 1,6 million de tonnes de coproduits agricoles par an, dont 93 % de sarments.', 852, 140, 756, 'body', { fs: 17 }),
      I('pile', 72, YC, 756, bot - YC, { fx: 0.5 }),
      CARD('<p class="n">2 t</p><p class="s">de sarments par hectare et par an</p>', 852, YC, 366, 250, { fs: 17 }),
      CARD('<p class="n">1,6 Mt</p><p class="s">de coproduits viticoles chaque année en France</p>', 1242, YC, 366, 250, { fs: 17 }),
      BOX(852, YC + 274, 756, bot - YC - 274),
      DONUT(896, YC + 274 + (bot - YC - 274 - 250) / 2, 250, [{ v: 93, c: C.green, l: 'Sarments' }, { v: 7, c: '#D8D4CB', l: 'Autres' }], { hole: 0.62 }),
      T('<p class="n">93 %</p><p>des coproduits viticoles sont des sarments.</p><p class="s">7 % : autres coproduits (marcs, lies…)</p>', 1200, YC + 274 + 40, 370, 'body', { fs: 17 }),
      keep,
      atBottom(T('Source : F.G.V.B. (Fédération des Grands Vins de Bordeaux)', 1242, 0, 366, 'caption'))
    ], { notes: 'Source à vérifier : F.G.V.B. La circulaire de 2011 a été déplacée dans « Pourquoi maintenant ».' }));
  }

  {
    const months = ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct'];
    const u = 688 / 12, x0 = 886, cy = 640;
    P.push(PAGE('c2', '3 · Set-Up', 'La ressource', [
      I('mains', 72, Y0, 756, 980, { fx: 0.5, fy: 0.45, lock: true, anim: { type: 'reveal' } }),
      T('Sarment broyé : l\'usage d\'aujourd\'hui', 104, 1040, 600, 'caption', { col: '#FFFFFF' }),
      T('La ressource', 852, Y0, 756, 'eyebrow'),
      T('Une ressource disponible, gratuite et en quête de <mark class="sel">débouchés</mark>', 852, YT, 756, 'h2', { fs: 54 }),
      T('<p>Les alternatives officiellement recommandées sont le broyage, le compostage, le paillage ou l\'apport en déchèterie. Aucune de ces solutions ne valorise économiquement la matière. La collecte se fait traditionnellement de novembre à mars, période de taille.</p><p>La ressource est abondante, récurrente, disponible gratuitement ou à très faible coût, et les producteurs sont en recherche active de débouchés depuis le durcissement des règles anti-brûlage. Le rapport de force à l\'approvisionnement est favorable à un porteur de projet.</p>', 852, 300, 756, 'body'),
      BOX(852, cy - 40, 756, 184),
      T(K('Le calendrier de la matière'), x0, cy - 8, 600, 'body'),
      ...months.map((m, i) => T(m, x0 + i * u, cy + 34, u, 'label', { fs: 11, anim: { type: 'none' } })),
      R(x0, cy + 62, 5 * u - 4, 12, C.brown, { rad: 6 }), R(x0 + 5 * u, cy + 62, 5 * u - 4, 12, C.kraft, { rad: 6 }), R(x0 + 10 * u, cy + 62, 2 * u, 12, C.handle, { rad: 6 }),
      T('Taille & collecte', x0, cy + 88, 5 * u, 'caption'), T('Séchage (3 à 6 mois)', x0 + 5 * u, cy + 88, 5 * u, 'caption'), T('Façonnage', x0 + 10 * u, cy + 88, 2 * u, 'caption'),
      KEEPB('Abondante, récurrente et gratuite : la matière est là, et les vignerons cherchent à s\'en défaire proprement.', 852, 756)
    ], { notes: 'La photo montre du sarment broyé : c\'est voulu (légende). Séchage : choisis entre « 3 à 6 mois » et « 6 mois minimum ».' }));
  }

  {
    const usages = [
      ['sol', 'Retour au sol', 0.9, 'C\'est l\'usage majoritaire : le sarment est broyé et laissé dans les rangs. Certains experts jugent ces 2 tonnes restituées comme un minimum pour la vie du sol.'],
      ['brulage', 'Brûlage', 0.35, 'Encore souvent pratiqué à l\'air libre, il génère une fumée polluante. La réglementation se durcit là où il était traditionnel.'],
      ['compost', 'Énergie & compost', 0.3, 'Transformation en pellets, en biogaz ou en compost.'],
      ['materiaux', 'Matériaux', 0.1, 'Vitis Valorem collecte 300 hectares de sarments et de ceps par an pour fabriquer tuteurs, piquets et agrafes. Les Princes Sarments en font un composite.']
    ];
    const keep = KEEPB('Aucun usage actuel ne conserve le sarment dans sa forme d\'origine : il est broyé, brûlé ou composté.', 72, 1146);
    const hh = keep.y - GAP - YC;
    P.push(PAGE('c2', '3 · Set-Up', 'Usages actuels', [
      ...HEAD('Où va le sarment', 'Usages', 'actuels'),
      T('Avec environ deux tonnes par hectare et par an, la ressource est massive et récurrente. Elle part aujourd\'hui dans quatre directions.', 852, 142, 756, 'lead', { fs: 27 }),
      ...usages.flatMap(([img, t, share, d], i) => {
        const x = X4[i];
        return [BOX(x, YC, W4, hh), I(img, x + 14, YC + 14, W4 - 28, 236, { rad: 18 }),
          R(x + 32, YC + 272, W4 - 64, 6, C.hair, { rad: 3 }), R(x + 32, YC + 272, Math.round((W4 - 64) * share), 6, C.handle, { rad: 3 }),
          T(TT(t) + `<p class="s">${d}</p>`, x + 32, YC + 300, W4 - 64, 'body', { fs: 15 })];
      }),
      keep,
      atBottom(T('Source : toutlevin.com, « La surprenante seconde vie de la vigne et du raisin ». Jauges qualitatives.', 1242, 0, 366, 'caption'))
    ], { notes: 'Les photos d\'usage sont petites (basse définition) : remplace-les par des versions plus grandes si possible.' }));
  }

  {
    const keep = KEEPB('Pas de marché organisé : le sarment est géré comme un déchet en quête de débouchés.', 72, 1536);
    const hh = keep.y - GAP - YC, bx = X3[2] + 34, bw = W3 - 68;
    P.push(PAGE('c2', '3 · Set-Up', 'Analyse du secteur', [
      ...HEAD('Secteur', 'Analyse', 'du secteur'),
      T('« Un secteur sous pression réglementaire, pas sous tension économique. »', 852, 136, 756, 'quote', { fs: 40 }),
      CARD(K('Le constat') + '<p>Le secteur du sarment de vigne se caractérise avant tout par un déséquilibre entre l\'abondance de la ressource et la faiblesse de sa valorisation : une ressource massive et récurrente, mais sous-exploitée. L\'écrasante majorité de cette biomasse reste traitée comme un déchet agricole plutôt que comme une matière première : broyage-épandage direct dans les rangs de vigne, un peu de compostage et, historiquement, beaucoup de brûlage.</p>', X3[0], YC, W3, hh),
      CARD(K('Ce qui fait bouger les lignes') + '<p>Ce qui fait bouger les lignes n\'est pas la demande (peu de filières viennent chercher la matière), mais la contrainte : interdictions progressives de brûlage, plans de protection de l\'atmosphère locaux, pression citoyenne. Les vignerons ne cherchent donc pas à vendre leurs sarments : ils cherchent surtout à s\'en débarrasser proprement.</p>', X3[1], YC, W3, hh),
      CARD(K('Ressource et valorisation'), X3[2], YC, W3, hh),
      T('<b>Ressource</b> · massive', bx, YC + 92, bw, 'body'), R(bx, YC + 128, bw, 14, C.brown, { rad: 7 }),
      T('Environ 1,5 million de tonnes de sarments par an', bx, YC + 154, bw, 'small'),
      T('<b>Valorisation</b> · faible', bx, YC + 236, bw, 'body'), R(bx, YC + 272, bw, 14, C.hair, { rad: 7 }), R(bx, YC + 272, 46, 14, C.handle, { rad: 7 }),
      T('Quelques niches : énergie, composites, mobilier', bx, YC + 298, bw, 'small'),
      keep
    ]));
  }

  {
    const keep = KEEPB('Facile d\'entrer à petite échelle, difficile d\'industrialiser : le modèle artisanal est le bon point de départ.', 72, 1016);
    const top = 560, hh = keep.y - GAP - top;
    P.push(PAGE('c2', '3 · Set-Up', 'Petite et grande échelle', [
      ...HEAD('Valorisation', 'Les voies de valorisation', '« nobles »', { w: 1016 }),
      T('Les voies de valorisation « nobles » (énergie, matériaux composites, mobilier, cosmétique) existent et sont documentées depuis les années 2010-2015 par les instituts techniques de la filière, mais restent à l\'état de niches.', 72, YC, 496, 'body'),
      T('Le gisement mobilisable est qualifié de faible par les organismes du secteur eux-mêmes, non pas parce que la matière manque, mais parce que les filières de collecte, de transport et de transformation ne sont pas structurées à grande échelle : chaque tentative reste artisanale ou expérimentale.', 592, YC, 496, 'body'),
      CARD(K('Petite échelle', 'green') + TT('Facile d\'entrer') + ROWS(['+ Peu de concurrence', '+ Matière accessible', '+ Pas de barrière financière à l\'approvisionnement']), 72, top, 496, hh, { bg: C.cardGreen }),
      CARD(K('Grande échelle', 'brown') + TT('Difficile d\'industrialiser') + ROWS(['− Pas de logistique de collecte organisée', '− Matière hétérogène', '− Faible valeur économique au kilo']), 592, top, 496, hh, { bg: C.cardBrown }),
      keep,
      I('fagots', 1112, Y0, 496, 980, { lock: true, anim: { type: 'reveal' } })
    ]));
  }

  {
    const counts = { up: 0, down: 0, mix: 0, warn: 0 };
    for (const items of Object.values(PESTEL)) for (const [k] of items) counts[k]++;
    const pest = (name, x, hh) => CARD(K(name) + pestelHTML(PESTEL[name]), x, YC, W4, hh, { fs: 14.5 });
    P.push(PAGE('c2', '3 · Set-Up', 'PESTELÉ 1/2', [
      ...HEAD('Environnement · 1 / 2', 'PESTELÉ', ''),
      T('Sept facteurs pour lire l\'environnement du projet, classés en atouts, freins, effets mixtes et points de vigilance.', 852, 142, 756, 'lead', { fs: 27 }),
      T('<span class="tag up">Atout</span><span class="tag down">Frein</span><span class="tag mix">Mixte</span><span class="tag warn">Vigilance</span>', 852, 250, 756, 'body', { fs: 18, anim: { type: 'none' } }),
      pest('Politique', X4[0], YB - YC), pest('Économique', X4[1], YB - YC), pest('Socioculturel', X4[2], YB - YC), pest('Technologique', X4[3], YB - YC)
    ]));
    const keep = KEEPB('Un contexte porteur (réglementation, envie de sens, image de la vigne), à condition de rester honnête : pas de greenwashing, équité avec les vignerons, traçabilité réelle.', X4[3], W4);
    P.push(PAGE('c2', '3 · Set-Up', 'PESTELÉ 2/2', [
      ...HEAD('Environnement · 2 / 2', 'PESTELÉ', ''),
      T('Écologie, cadre légal et éthique : les trois facteurs qui demandent le plus de vigilance au projet.', 852, 142, 756, 'lead', { fs: 27 }),
      pest('Écologique', X4[0], YB - YC), pest('Légal', X4[1], YB - YC), pest('Éthique', X4[2], YB - YC),
      CARD(K('Le bilan des 7 facteurs') + ROWS([`<b>${counts.up}</b> atouts`, `<b>${counts.down}</b> freins`, `<b>${counts.mix}</b> effets mixtes`, `<b>${counts.warn}</b> points de vigilance`]), X4[3], YC, W4, keep.y - GAP - YC, { fs: 18 }),
      keep
    ], { notes: 'RIPFCI : règlement interdépartemental de protection de la forêt contre l\'incendie (à vérifier).' }));
  }

  {
    const keep = KEEPB('Le haut de gamme progresse (+7,7 %/an) pendant que le grand public recule (−1,7 %) : la place est du côté du luminaire durable et premium.', 72, 1016);
    P.push(PAGE('c2', '3 · Set-Up', 'Marché de vente', [
      ...HEAD('Marché', 'Marché', 'de vente', { w: 1016 }),
      CARD('<p class="n">−1,7 %</p><p class="s">Lampes et luminaires en France : 4,165 Md€ en 2022, 4,094 Md€ en 2023 (Syndicat du luminaire).</p>', 72, YC, 496, 300, { fs: 19 }),
      CARD('<p class="n acc">+7,7 %</p><p class="s">par an : croissance attendue du luminaire haut de gamme dans le monde jusqu\'en 2034 (20,26 Md$ en 2024).</p>', 592, YC, 496, 300, { fs: 19 }),
      T(K('Tendance', 'g') + '<p>Les acteurs misent sur les matériaux durables pour se repositionner. La part grand public est plus petite : la consommation des ménages en appareils d\'éclairage était de 790 M€ en 2021.</p>', 72, 680, 1016, 'body', { fs: 17 }),
      keep,
      I('lampes', 1112, Y0, 496, 900),
      atBottom(T('Le naturel standardisé de la grande distribution : notre contre-modèle.', 1112, 0, 496, 'caption'))
    ]));
  }

  // 4 · Catalyst
  P.push(PAGE('c3', '4 · Catalyst', 'Le brûlage n\'est plus une option', [
    ...HEAD('Catalyseur', 'Pourquoi', 'maintenant ?'),
    BOX(72, YC, 756, 470),
    T('130 000', 108, YC + 40, 700, 'num', { fs: 150 }),
    T('voitures par jour', 112, YC + 196, 680, 'lead', { fs: 34 }),
    T('C\'est la pollution équivalente aux 4 300 à 5 500 tonnes de bois de vigne brûlées en trois mois en Gironde, selon une association environnementale.', 112, YC + 262, 640, 'body', { tone: 'sub' }),
    KEEPB('Brûler n\'est plus possible, broyer ne rapporte rien : les vignerons ont besoin d\'un débouché.', 72, 756),
    T('Le contexte', 852, Y0, 756, 'eyebrow'),
    T('Le brûlage n\'est plus une option', 852, YT, 756, 'lead', { fs: 40 }),
    T('<p>En Gironde, premier vignoble de Nouvelle-Aquitaine, le brûlage à l\'air libre des déchets verts viticoles est interdit ou fortement encadré dans les zones à dominante forestière. Le cadre de référence est la circulaire du 18 novembre 2011, qui interdit le brûlage à l\'air libre des déchets verts à l\'échelle nationale.</p><p>Les alternatives recommandées (broyage, compostage, paillage, déchèterie) ne valorisent pas économiquement la matière. Les vignerons cherchent donc surtout à se débarrasser proprement de leurs sarments.</p>', 852, 214, 756, 'body'),
    FRAME('Photo : fumée de brûlage dans les vignes', 852, 548, 756, 470),
    atBottom(T('Sources : circulaire du 18 novembre 2011 ; [nom de l\'association environnementale] ; F.G.V.B.', 852, 0, 756, 'caption'))
  ], { notes: 'Remplace [nom de l\'association] par la source exacte du chiffre « 130 000 voitures ».' }));

  {
    const keep = KEEPB('La contrainte crée le besoin (le brûlage recule), la tendance crée la demande (matériaux durables) : c\'est le bon moment.', 852, 756);
    const top2 = 804;
    P.push(PAGE('c3', '4 · Catalyst', 'Le luminaire cherche d\'autres matières', [
      ...HEAD('Le luminaire aujourd\'hui', 'Le luminaire', 'aujourd\'hui'),
      T('Le luminaire d\'aujourd\'hui repose surtout sur des matériaux énergivores ou d\'origine fossile.', 852, 142, 756, 'lead', { fs: 27 }),
      ...[['Métal', 'Acier, aluminium, laiton : très courants pour les pieds et les structures. L\'aluminium neuf est particulièrement énergivore à produire.', 'Photo : pied de lampe en métal'],
        ['Plastiques', 'ABS, polycarbonate, polypropylène : dominants dans l\'entrée de gamme, d\'origine fossile et peu recyclés.', 'Photo : lampe en plastique'],
        ['Verre & céramique', 'Cuits à haute température, donc énergivores.', 'Photo : lampe en verre ou céramique'],
        ['Fibres naturelles', 'Bois, rotin, osier, papier, tissu : surtout pour les abat-jour et les modèles « naturels ».', 'Photo : abat-jour en fibres naturelles']]
        .flatMap(([t, d, ph], i) => [BOX(X4[i], YC, W4, top2 - GAP - YC), FRAME(ph, X4[i] + 14, YC + 14, W4 - 28, 210, { rad: 18 }),
          T(TT(t) + `<p class="s">${d}</p>`, X4[i] + 32, YC + 246, W4 - 64, 'body', { fs: 15 })]),
      CARD(K('Recycler le sarment, c\'est') + ROWS(['Du temps gagné pour les vignerons', 'Un engagement fort pour l\'environnement', 'Moins de CO₂, pas de fumée toxique', 'Moins de risques d\'incendie']), 72, top2, 756, YB - top2, { fs: 16 }),
      T('Et la demande suit : le luminaire haut de gamme progresse de plus de 7,7 % par an dans le monde, et les fabricants misent sur les matériaux durables pour se repositionner.', 852, top2, 756, 'lead', { fs: 24 }),
      keep
    ], { notes: 'Les 4 photos sont à trouver : dans la version InDesign, les photos des usages avaient été réutilisées par erreur.' }));
  }

  // 5 · Debate : Concurrence
  P.push(opener('c4', '5 · Debate', '04', 'Paysage', 'concurrentiel', ['Niko & Co', 'Les Princes Sarments', 'Vitis Valorem', 'Fibres naturelles premium', 'Grande distribution', 'Artisans du bois brut'],
    [BOX(900, 72, 708, 1044, C.darkCard, { lock: true }), I('sarment', 930, 420, 650, 224, { fit: 'contain', r: -8, rad: 0, anim: { type: 'zoom' } })], { bg: C.dark }));
  {
    const keep = KEEPB('Un seul concurrent direct, et aucun acteur qui conserve le sarment entier, tracé jusqu\'à son domaine d\'origine.', 72, 1536);
    P.push(PAGE('c4', '5 · Debate', 'Typologie des concurrents', [
      ...HEAD('Typologie', 'Trois familles', 'de concurrents', { w: 1016 }),
      ...[['Concurrents directs', 'Même matière, même usage.', 'Niko & Co (Charente) : mobilier design en piquets de vigne, pièces uniques.'],
        ['Concurrents indirects', 'Même matière, autre usage.', 'Les Princes Sarments : composite de sarment broyé pour l\'architecture de luxe. Vitis Valorem : filière de collecte et matière Sarmine®.'],
        ['Substituts', 'Autre matière, même besoin, même cible.', 'Luminaires en fibres naturelles d\'éditeurs, « naturel » de la grande distribution, lampes en bois flotté d\'artisans.']]
        .flatMap(([k, t, d], i) => CARDB(K(k) + TT(t), K('Exemples', 'g') + `<p>${d}</p>`, X3[i], YC, W3, keep.y - GAP - YC, { foot: { fs: 16 } })),
      keep
    ]));
  }
  P.push(fiche({ short: 'Niko & Co', type: 'Concurrent direct', name: 'Niko & Co', place: 'Charente', pos: 'Artisanal, pièces uniques, vendues aux particuliers et aux professionnels ; ancrage en Charente.',
    cible: 'Particuliers et professionnels.', prix: 'À compléter : relever trois prix.', canaux: 'À compléter : site, Instagram, salons, bouche-à-oreille viticole.',
    force: 'Crédibilité terrain très forte : l\'entreprise vient du monde viticole, pas d\'un studio de design.',
    faiblesse: 'Travaille plusieurs bois (acacia, pin, châtaignier) : la spécificité de la vigne se dilue.',
    retenir: 'Le plus proche de nous ; nous nous distinguons par le sarment lui-même et sa traçabilité.' }));
  P.push(fiche({ short: 'Les Princes Sarments', type: 'Concurrent indirect', name: 'Les Princes Sarments', place: 'Provence',
    pos: 'Luxe : sarments et pieds de vigne broyés en matériau composite breveté pour l\'architecture d\'intérieur et l\'hôtellerie haut de gamme.',
    cible: 'Architectes, hôtellerie de luxe (B2B).', prix: 'Sur devis, haut de gamme.', canaux: 'Réseau d\'architectes, salons professionnels, site vitrine.',
    force: 'Différenciation technique forte, clientèle premium et réseau d\'architectes déjà établi.',
    faiblesse: 'Coupé du grand public, coût d\'accès élevé, moins de proximité avec le terroir humain.',
    retenir: 'Une référence de storytelling, mais la matière y est broyée : on ne la reconnaît plus.' }));
  P.push(fiche({ short: 'Vitis Valorem', type: 'Concurrent indirect', name: 'Vitis Valorem', place: 'France',
    pos: 'Filière B2B nationale de collecte de sarments, transformés en matière première Sarmine® pour la cosmétique, l\'automobile et le bâtiment.',
    cible: 'Industriels (B2B multisecteur).', prix: 'Matière première, au volume.', canaux: 'Démarchage B2B, communication institutionnelle.',
    force: 'Échelle et diversification des débouchés, crédibilité industrielle forte.',
    faiblesse: 'Marque froide et anonyme pour le grand public, aucune présence en décoration, pas d\'incarnation humaine.',
    retenir: 'La collecte à grande échelle est possible, et personne n\'occupe le terrain de l\'émotion.' }));
  P.push(fiche({ short: 'Fibres naturelles premium', type: 'Substitut premium', name: 'Fibres naturelles premium', place: 'Exemple à vérifier : Market Set (Paris)',
    pos: 'À compléter : éditeur de luminaires en rotin, lin ou papier.', cible: 'À compléter.', prix: 'À compléter : donne le niveau de prix attendu par Camille.',
    canaux: 'À compléter.', force: 'À compléter.', faiblesse: 'À compléter.', retenir: 'À compléter : ce que cet acteur nous apprend sur le premium.',
    notes: 'Piste à vérifier : site, prix, canaux. Ce n\'est pas une fiche, c\'est une suggestion.' }));
  P.push(fiche({ short: 'Grande distribution', type: 'Substitut grand public', name: 'Grande distribution', place: 'Le « naturel » standardisé · exemples : Maisons du Monde, IKEA', photo: 'lampes',
    pos: 'Luminaires « naturels » (rotin, jute) produits en série, à petit prix.', cible: 'Grand public.', prix: 'À compléter : relever trois prix.',
    canaux: 'Magasins, sites e-commerce, catalogues.', force: 'Prix bas, disponibilité, effet de mode.', faiblesse: 'Naturel standardisé, origine invisible, aucune histoire.',
    retenir: 'Le naturel standardisé : notre contre-modèle.' }));
  P.push(fiche({ short: 'Artisans du bois brut', type: 'Substitut artisanal', name: 'Artisans du bois brut', place: 'Etsy, marchés de créateurs',
    pos: 'Lampes en bois flotté ou en bois brut, pièces uniques.', cible: 'Les mêmes acheteurs que Camille.', prix: 'À compléter.',
    canaux: 'Etsy, Instagram, marchés de créateurs.', force: 'Pièce unique, prix accessibles, proximité avec l\'acheteur.', faiblesse: 'Origine rarement tracée, qualité inégale.',
    retenir: 'Même promesse que nous, mais sans origine tracée.' }));

  {
    const cols = ['Acteur', 'Site / e-shop', 'Instagram', 'Ton', 'Packaging', 'Traçabilité', 'Prix'];
    const actors = ['Niko & Co', 'Les Princes Sarments', 'Vitis Valorem', 'Fibres naturelles premium', 'Grande distribution', 'Artisans du bois brut'];
    const keep = KEEPB('À compléter avec le tableau : si aucun acteur n\'affiche l\'origine précise de sa matière, c\'est notre territoire.', 72, 1536);
    const hh = keep.y - GAP - YC;
    const colX = i => i === 0 ? 112 : 112 + 290 + (i - 1) * 202;
    const colW = i => i === 0 ? 270 : 186;
    const rowH = Math.floor((hh - 120) / actors.length);
    const table = [BOX(72, YC, 1536, hh)];
    cols.forEach((c, i) => table.push(T(c, colX(i), YC + 40, colW(i), 'label', { anim: { type: 'none' } })));
    actors.forEach((a, r) => {
      const y = YC + 80 + r * rowH;
      table.push(LINE(112, y, 1456, 1.5, '#DCDAD4'));
      table.push(T('<b>' + a + '</b>', colX(0), y + 20, colW(0), 'body', { fs: 15.5, anim: { type: 'none' } }));
      for (let i = 1; i < cols.length; i++) table.push(T('—', colX(i), y + 20, colW(i), 'body', { fs: 15.5, tone: 'sub', anim: { type: 'none' } }));
    });
    P.push(PAGE('c4', '5 · Debate', 'Outils de communication', [
      ...HEAD('Communication', 'Outils de', 'communication', { w: 1016 }),
      T('Un mot ou deux par case : ce que chaque acteur montre, et ce qu\'il tait.', 1112, 150, 496, 'body', { tone: 'sub' }),
      ...table,
      keep
    ], { notes: 'Remplis chaque case (un mot ou deux). Ajoute une page « tendances » si besoin : ce que tous font, ce que personne ne fait.' }));
  }

  {
    const cxc = 580, cyc = 594, hw = 430, hy = 410;
    const pt = (x, y) => [cxc + hw * x, cyc - hy * y];
    const dots = [['Grande distribution', -0.8, -0.8], ['Fibres naturelles premium', -0.7, -0.05], ['Artisans bois flotté', -0.55, 0.75],
      ['Vitis Valorem', 0.45, -0.8], ['Les Princes Sarments', 0.5, -0.12], ['Niko & Co', 0.2, 0.62]];
    const [sx, sy] = pt(0.82, 0.78);
    P.push(PAGE('c4', '5 · Debate', 'Croix de positionnement', [
      BOX(72, Y0, 1016, 980, C.card, { lock: true }),
      R(cxc + 2, 136, 1056 - cxc - 2, cyc - 138, C.cardBlue, { rad: 20, lock: true }),
      R(104, cyc - 1, 952, 2, '#CFCCC5', { lock: true }), R(cxc - 1, 136, 2, 916, '#CFCCC5', { lock: true }),
      T('Lien faible à la vigne', 112, cyc - 30, 330, 'label'), T('Sarment tracé jusqu\'au domaine', 712, cyc - 30, 330, 'label', { al: 'right' }),
      T('Artisanal · pièce unique', cxc + 16, 150, 330, 'label'), T('Industriel · série', cxc + 16, 1036, 330, 'label'),
      ...dots.flatMap(([n, x, y]) => { const [px, py] = pt(x, y); return [ELL(px - 9, py - 9, 18, 18, C.ink), T(n, px + 18, py - 12, 260, 'body', { fs: 15, anim: { type: 'none' } })]; }),
      ELL(sx - 16, sy - 16, 32, 32, C.handle, { anim: { type: 'zoom' } }), T('<b>SARMENTS</b>', sx - 270, sy - 13, 244, 'body', { al: 'right', fs: 18 }),
      T('Positionnement', 1112, Y0, 496, 'eyebrow'),
      TITLE('Croix de', 'positionnement', 1112, YT, 496, 'h2', { fs: 60 }),
      T('Deux axes : le lien avec la vigne (de la matière anonyme au sarment tracé jusqu\'à son domaine) et le mode de production (de la série industrielle à la pièce unique). Les points se déplacent : ajuste-les avec vos fiches.', 1112, YC, 496, 'body'),
      KEEPB('Seul acteur à relier un sarment conservé entier à son domaine d\'origine, en production artisanale.', 1112, 496)
    ]));
  }
  P.push(PAGE('c4', '5 · Debate', 'Synthèse de l\'analyse', [
    ...HEAD('Synthèse', 'Synthèse', 'de l\'analyse'),
    T('<p>La viticulture française génère plus de 2 tonnes de sarments par hectare et par an, une biomasse aujourd\'hui très peu valorisée (broyage-épandage majoritaire, brûlage en recul sous la pression réglementaire). En Gironde, l\'encadrement croissant du brûlage pousse les domaines à chercher des débouchés, ce qui rend la matière accessible gratuitement ou à faible coût.</p><p>Le secteur reste peu structuré : ce n\'est pas un marché organisé, mais une gestion de déchet agricole en quête de valorisation. Niko & Co travaille les piquets de vigne, Les Princes Sarments un composite de luxe, Vitis Valorem une filière B2B. Aucun n\'occupe le luminaire en sarment brut tracé jusqu\'au domaine d\'origine : c\'est l\'espace de différenciation du projet.</p><p>L\'analyse PESTELÉ confirme un contexte favorable, avec des points de vigilance éthiques : risque de greenwashing, équité de valeur avec les vignerons fournisseurs, transparence sur la traçabilité annoncée.</p>', 72, YC, 756, 'body'),
    KEEPB('Aucun acteur n\'occupe le luminaire en sarment brut, tracé jusqu\'au domaine, en Nouvelle-Aquitaine.', 72, 756),
    FRAME('Photo de respiration : sarments en lumière rasante', 900, 0, 780, 1188, { lock: true })
  ], { notes: 'Quand les 6 fiches seront faites, ajoute les trois nouveaux acteurs au 2e paragraphe.' }));

  // 6 · Break into Two : Concept
  P.push(opener('c5', '6 · Break into Two', '05', 'Concept &', 'plateforme de marque', ['Concept', 'Process', 'Mission & valeurs', 'Cibles', 'Personas', 'SWOT', 'Mix marketing', 'Nom'],
    [I('mains', 0, 0, 1680, 1188, { gray: true, fy: 0.4, lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.55, lock: true })],
    { bg: C.dark, numCol: '#FFFFFF', tw: 1300, tfs: 112 }));
  P.push(PAGE('c5', '6 · Break into Two', 'Le sarment reste sarment', [
    T('Le concept', 72, Y0, 1536, 'eyebrow', { al: 'center' }),
    T('<mark class="sel">Le sarment reste sarment</mark>', 72, YT, 1536, 'h2', { al: 'center' }),
    I('mains', 72, 270, 756, 560, { fy: 0.5, lock: true, anim: { type: 'fade' } }),
    BOX(852, 270, 756, 560, C.card, { lock: true }),
    I('sarment', 890, 438, 680, 234, { fit: 'contain', r: -6, rad: 0, anim: { type: 'zoom' } }),
    T(K('Ce que font les autres', 'g') + '<p>Le sarment broyé, réduit en brisures.</p>', 72, 854, 756, 'body', { fs: 18 }),
    T(K('Ce que nous faisons') + '<p>Le sarment entier, cintré, reconnaissable.</p>', 852, 854, 756, 'body', { fs: 18 }),
    LINE(72, 952, 1536),
    atBottom(T('On ne dénature pas le sarment. Là où les autres entreprises le broient pour l\'utiliser en brisures, nous le conservons dans sa structure naturelle, en y ajoutant des courbes organiques pour le sublimer. Nous mettons en valeur ce qui est habituellement broyé ou brûlé.', 72, 0, 1536, 'lead', { fs: 25 }))
  ], { notes: 'Break into Two : le concept en une image. Remplace le sarment détouré par une photo de votre pied de lampe cintré.' }));
  {
    const steps = [
      ['Récolter', 'Choisir des sarments encore souples (récolte hivernale, juste après la taille) et épais, pour la structure.'],
      ['Nettoyer et traiter', 'Brosser pour enlever la terre et l\'écorce abîmée. Trempage ou autoclave anti-insectes, puis léger ponçage des nœuds.'],
      ['Cintrer et sécher', 'Cintrer les sarments encore verts sur un gabarit et laisser sécher plusieurs semaines : le bois garde la forme.'],
      ['Façonner le pied', 'À compléter : assemblage, fixation de la douille, passage du câble, socle, abat-jour.'],
      ['Tracer', 'Chaque pied reçoit une étiquette : domaine, cépage, saison de taille.']];
    const top2 = 860;
    P.push(PAGE('c5', '6 · Break into Two', 'De la vigne à la lampe', [
      ...HEAD('Process', 'De la vigne', 'à la lampe', { w: 1016 }),
      T('Un procédé simple, sans broyage, en cinq gestes.', 1112, 150, 496, 'body', { tone: 'sub' }),
      ...steps.flatMap(([t, d], i) => {
        const x = 72 + i * 312;
        return [BOX(x, YC, 288, top2 - GAP - YC), FRAME(`Photo : étape ${i + 1}`, x + 12, YC + 12, 264, 230, { rad: 18 }),
          T(K('Étape ' + String(i + 1).padStart(2, '0')) + `<p class="t">${t}</p><p class="s">${d}</p>`, x + 26, YC + 262, 236, 'body', { fs: 14.5 })];
      }),
      CARD(K('Partenaire', 'g') + '<p>Un vannier ou un sculpteur sur bois apporte la technique d\'exécution et montre une vraie réflexion sur le mode de production.</p>', 72, top2, 496, YB - top2, { fs: 15.5 }),
      CARD(K('Faisabilité', 'g') + '<p>Niko & Co, jeune entreprise charentaise, transforme déjà des piquets de vigne en mobilier design vendu aux particuliers et aux professionnels.</p>', 592, top2, 496, YB - top2, { fs: 15.5 }),
      KEEP('Un procédé simple et sans broyage : récolter, nettoyer, cintrer, sécher, assembler.', 1112, top2, 496, { h: YB - top2, va: 'middle' })
    ], { notes: 'Photos des étapes : idéalement les vôtres. L\'étape 4 reste à écrire.' }));
  }

  // 7 · B Story : plateforme
  {
    const top = 432, top2 = 864;
    P.push(PAGE('c5', '7 · B Story', 'Mission, vision, valeurs', [
      T('Mission', 72, Y0, 400, 'eyebrow'),
      T('Donner une seconde vie au sarment de vigne en le transformant, <mark class="sel">sans le broyer ni le brûler</mark>, en luminaires artisanaux qui racontent le domaine d\'où ils viennent.', 72, YT, 1016, 'lead', { fs: 44, lh: 1.16 }),
      T('Vision', 1112, Y0, 496, 'eyebrow'),
      T('Faire du sarment une matière reconnue du design d\'intérieur.', 1112, YT, 496, 'lead', { fs: 30 }),
      ...[['Authenticité de la matière', 'La technique de fabrication reste visible et assumée plutôt que dissimulée derrière un fini industriel.'],
        ['Traçabilité', 'Chaque pièce est reliée à un domaine, un cépage et une période de récolte identifiables.'],
        ['Ancrage territorial', 'La marque s\'inscrit dans l\'économie viticole réelle de la Nouvelle-Aquitaine.'],
        ['Équité', 'La matière des vignerons partenaires est reconnue et valorisée, pas traitée comme une ressource gratuite et invisible.']]
        .map(([t, d], i) => CARD(K('Valeur ' + String(i + 1).padStart(2, '0')) + TT(t) + `<p class="s">${d}</p>`, X4[i], top, W4, top2 - GAP - top)),
      CARD(K('Objectif · court terme', 'g') + '<p>Se concentrer sur le pied de lampe : une typologie, un savoir-faire, un cycle de production.</p>', 72, top2, 756, YB - top2, { fs: 17 }),
      CARD(K('Objectif · long terme', 'g') + '<p>Étendre la marque au petit mobilier et aux accessoires de décoration.</p>', 852, top2, 756, YB - top2, { fs: 17 })
    ], { notes: 'Mission et vision sont des propositions : à valider en groupe.' }));
  }
  {
    const ccx = 1230, ccy = 560;
    const ring = (d, fill) => ELL(ccx - d / 2, ccy - d / 2, d, d, fill, { lock: true });
    P.push(PAGE('c5', '7 · B Story', 'Positionnement & cibles', [
      ...HEAD('Plateforme de marque', 'Positionnement', '& cibles', { t: { fs: 70 } }),
      T('Pour les amateurs de design local en Nouvelle-Aquitaine et, à terme, les domaines viticoles, SARMENTS est l\'artisan qui transforme le sarment de vigne brut, tracé jusqu\'au domaine d\'origine, en luminaires utilitaires et décoratifs. Contrairement aux acteurs existants, qui travaillent soit d\'autres bois du vignoble (Niko & Co), soit un matériau composite coupé du geste artisanal (Les Princes Sarments, Vitis Valorem), SARMENTS conserve le sarment dans sa forme naturelle.', 72, YC, 756, 'body', { fs: 18 }),
      KEEPB('Cœur de cible : les 25-45 ans qui achètent une histoire plus qu\'une lampe.', 72, 756),
      BOX(852, Y0, 756, 980, C.card, { lock: true }),
      ring(680, '#EAE8E2'), ring(510, '#DEDBD3'), ring(340, '#D1CCC2'), ring(170, C.sel),
      T('<b>Périphérique</b><br>prescripteurs & relais', ccx - 200, ccy - 318, 400, 'small', { al: 'center', anim: { type: 'none' } }),
      T('<b>Secondaire</b><br>domaines & œnotourisme (B2B)', ccx - 200, ccy - 233, 400, 'small', { al: 'center', anim: { type: 'none' } }),
      T('<b>Principale</b><br>œnophiles & œnotouristes', ccx - 200, ccy - 148, 400, 'small', { al: 'center', anim: { type: 'none' } }),
      T('<b>Cœur</b><br>éco-design lovers', ccx - 100, ccy - 24, 200, 'small', { al: 'center', col: C.ink, anim: { type: 'none' } }),
      T('Personas : Camille (cœur), Laurent (principale), Sophie (secondaire)', 888, 1010, 684, 'caption', { al: 'center' })
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
    const hh = Math.floor((YB - YC - GAP) / 2);
    const sw = (t, cls, bg, items, x, y) => CARD(K(t, cls) + ROWS(items), x, y, 756, hh, { bg, fs: 16 });
    P.push(PAGE('c5', '7 · B Story', 'SWOT', [
      ...HEAD('Diagnostic', 'SWOT', ''),
      KEEP('Une matière gratuite et un récit fort ; les défis sont la technique et l\'approvisionnement.', 852, 128, 756),
      sw('Forces', 'green', C.cardGreen, ['Matière gratuite ou peu coûteuse', 'Ancrage territorial fort', 'Technique accessible en autodidacte (vannerie)', 'Storytelling puissant autour du patrimoine viticole', 'Sarment conservé entier : une matière reconnaissable'], 72, YC),
      sw('Faiblesses', 'brown', C.cardBrown, ['Difficile à standardiser et à industrialiser', 'Traitement du bois exigeant', 'Savoir-faire à acquérir ou à externaliser', 'Production lente (3 à 6 mois de séchage)', 'Marque inconnue au lancement'], 852, YC),
      sw('Opportunités', 'green', C.cardGreen, ['Peu de concurrence directe sur le luminaire en sarment brut en Nouvelle-Aquitaine', 'Dynamique réglementaire favorable à l\'économie circulaire viticole', 'Marché de l\'upcycling en croissance', 'Luminaire haut de gamme : +7,7 % par an'], 72, YC + hh + GAP),
      sw('Menaces', 'brown', C.cardBrown, ['Acteurs mieux financés (Les Princes Sarments) qui pourraient élargir leur gamme', 'Dépendance à la bonne volonté des domaines', 'Récolte saisonnière (novembre à mars)', 'Arrachages liés à la crise viticole'], 852, YC + hh + GAP)
    ]));
  }
  {
    const keep = KEEPB('Une lampe unique à 120-250 €, vendue là où Camille et Sophie achètent déjà.', 72, 1536);
    P.push(PAGE('c5', '7 · B Story', 'Mix marketing', [
      ...HEAD('Les 4P', 'Mix', 'marketing'),
      T('Produit, prix, distribution, communication : une proposition cohérente avec les personas.', 852, 150, 756, 'body', { tone: 'sub' }),
      ...[['Produit', 'Lampe à poser, pied en sarment entier cintré, abat-jour en lin ou en papier. Pièces numérotées avec étiquette de traçabilité. Gamme de lancement courte : 2 ou 3 modèles.'],
        ['Prix', '120 à 250 € (Camille se méfie sous 80 € et hésite au-delà de 250 €). Pièce signature au-delà de 300 €. B2B sur devis.'],
        ['Distribution', 'Boutique en ligne, concept-stores bordelais, boutiques des domaines partenaires, marchés de créateurs, salons.'],
        ['Communication', 'Instagram (du rang de vigne à la lampe), QR code de traçabilité, portes ouvertes pendant la taille, presse déco, co-branding avec les domaines.']]
        .map(([t, d], i) => CARD(K(String(i + 1).padStart(2, '0')) + TT(t) + `<p>${d}</p>`, X4[i], YC, W4, keep.y - GAP - YC)),
      keep
    ], { notes: 'Proposition cohérente avec vos notes : à valider en groupe.' }));
  }
  P.push(PAGE('c5', '7 · B Story', 'Le nom', [
    T('Le nom', 72, Y0, 756, 'eyebrow'),
    T('<mark class="sel">Sarments</mark>', 80, 168, 748, 'cover', { fs: 140 }),
    T('Pourquoi ce nom : à compléter (la matière nommée telle quelle, le pluriel, la sonorité…).', 72, 420, 700, 'lead', { fs: 28 }),
    KEEPB('Un nom qui nomme la matière telle qu\'elle est : à affiner.', 72, 756),
    CARD(K('Pistes écartées') + TT('Les noms testés') + ROWS(['Nom 1 · raison de l\'abandon', 'Nom 2 · raison de l\'abandon', 'Nom 3 · raison de l\'abandon', 'Nom 4 · raison de l\'abandon', 'Nom 5 · raison de l\'abandon'], 's'), 852, Y0, 756, 980, { fs: 17 })
  ], { notes: 'Page naming : à remplir quand le naming sera finalisé.' }));

  // 8 · Fun and Games : recherches
  P.push(opener('c6', '8 · Fun and Games', '06', 'Recherches', 'graphiques', ['Trois pistes', 'Moodboards', 'Typographie', 'Couleurs', 'Axes 1 à 3', 'Axe final'],
    [I('mb3', 0, 0, 1680, 1188, { lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.6, lock: true })],
    { bg: C.dark, numCol: '#FFFFFF' }));
  const axes = [
    ['Géométrie', 'vivante', 'mb1', 'Prendre l\'irrégularité du sarment comme une signature visuelle : nœuds, écorce, courbes, veinures, strates.', 'nœuds · écorce · courbes · veinures · strates'],
    ['La main', 'à l\'œuvre', 'mb2', 'Le design devient la traduction de la main qui fabrique : outils, assemblages, textures, imperfections, répétitions.', 'outils · assemblages · textures · imperfections · répétitions'],
    ['Ombre', '& lumière', 'mb3', 'Ce n\'est plus seulement le sarment qui est montré : c\'est la lumière qui révèle sa présence, par les ombres projetées et les motifs.', 'projection · révélation · contraste · chaleur · motif']];
  P.push(PAGE('c6', '8 · Fun and Games', 'Trois pistes', [
    ...HEAD('Recherches', 'Trois', 'pistes'),
    T('Trois façons de traduire le sarment en identité : par sa matière, par le geste qui le travaille, par la lumière qui le révèle.', 852, 142, 756, 'lead', { fs: 27 }),
    ...axes.flatMap(([a, b, mb, intent, kw], i) => {
      const x = X3[i];
      return [BOX(x, YC, W3, YB - YC), I(mb, x + 14, YC + 14, W3 - 28, 330, { rad: 18 }),
        T(K(`Axe ${i + 1}`) + TT(`${a} ${b}`) + `<p class="s">${intent}</p>`, x + 34, YC + 376, W3 - 68, 'body', { fs: 15.5 }),
        atBottom(T(PILLS(kw.split(' · ')), x + 34, 0, W3 - 68, 'body', { fs: 13, anim: { type: 'none' } }), YB - 26)];
    })
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
    const sw = (1016 - 5 * 16) / 6;
    P.push(PAGE('c6', '8 · Fun and Games', `Moodboard ${i + 1}`, [
      I(mb, 72, Y0, 1016, 718),
      ...pal.flatMap(([hex, n], j) => [R(72 + j * (sw + 16), 846, sw, 132, hex, { rad: 18, anim: { type: 'none' } }),
        T(`<b>${n}</b><br>${hex}`, 72 + j * (sw + 16), 992, sw, 'caption', { anim: { type: 'none' } })]),
      T(`Moodboard ${i + 1} · Axe ${i + 1}`, 1112, Y0, 496, 'eyebrow'),
      TITLE(a, b, 1112, YT, 496, 'h2', { fs: 60 }),
      T(PILLS(kw.split(' · ')), 1112, 300, 496, 'body', { fs: 13.5, anim: { type: 'none' } }),
      T(txt, 1112, 420, 496, 'body'),
      KEEPB(keep, 1112, 496)
    ], { notes: 'Références réunies pour l\'axe ' + (i + 1) + '. Palette extraite des images.' }));
  });
  {
    const keep = KEEPB('À compléter : la piste retenue et pourquoi.', 72, 1536);
    const hh = keep.y - GAP - YC;
    P.push(PAGE('c6', '8 · Fun and Games', 'Recherches typographiques', [
      ...HEAD('Typographie', 'Recherches', 'typographiques', { w: 1016 }),
      ...[['Piste 1 · Serif organique', { it: true }, 'Inspiration : « SAGE GLOW » (moodboard 1). À tester : une serif aux formes végétales.'],
        ['Piste 2 · Serif contrastée', { fw: 600 }, 'Inspirations : « Angle Violin », « Die Jelk » (moodboard 2) : contraste fort et ligatures.'],
        ['Piste 3 · Linéale', { ff: 'sans' }, 'Inspiration : les ombres typographiques du moodboard 3.']]
        .flatMap(([t, o, d], i) => {
          const x = X3[i];
          return [BOX(x, YC, W3, hh), T(t, x + 34, YC + 36, W3 - 68, 'eyebrow'),
            T('Aa', x + 34, YC + 70, W3 - 68, 'num', { ff: 'serif', fw: 400, ls: 0, fs: 170, ...o }),
            T('Sarments · matière, geste, lumière', x + 34, YC + 270, W3 - 68, 'lead', { fs: 28, ...o }),
            atBottom(T(d, x + 34, 0, W3 - 68, 'small'), YC + hh - 34)];
        }),
      keep
    ], { notes: 'Remplace les « Aa » par vos vrais essais (captures ou textes dans la police choisie).' }));
  }
  {
    const hh = Math.floor((YB - YC - 2 * GAP) / 3);
    P.push(PAGE('c6', '8 · Fun and Games', 'Recherches chromatiques', [
      ...HEAD('Couleur', 'Recherches', 'chromatiques', { w: 1016 }),
      T('Une palette par axe, extraite des moodboards.', 1112, 150, 496, 'body', { tone: 'sub' }),
      ...mbData.flatMap(([, pal], r) => {
        const y = YC + r * (hh + GAP), sw = 168;
        return [BOX(72, y, 1536, hh),
          T(K(`Axe ${r + 1}`) + TT(`${axes[r][0]} ${axes[r][1]}`), 108, y + 32, 300, 'body'),
          ...pal.flatMap(([hex, n], j) => [R(440 + j * (sw + 24), y + 24, sw, hh - 92, hex, { rad: 16 }),
            T(`<b>${n}</b> · ${hex}`, 440 + j * (sw + 24), y + hh - 56, sw + 20, 'caption', { anim: { type: 'none' } })])];
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
    FRAME('Logo final', 72, Y0, 1016, 980),
    T('Axe final', 1112, Y0, 496, 'eyebrow'),
    T('<p>La ligne du sarment,</p><p><mark class="sel">révélée par la lumière</mark></p>', 1112, YT, 496, 'h2', { fs: 50 }),
    T('La ligne vivante du sarment (axe 1) révélée par la lumière (axe 3), avec la trace de la main (axe 2) dans les textures et l\'étiquette. Proposition à valider.', 1112, YC, 496, 'body'),
    KEEPB('La réponse graphique à la problématique, en une image.', 1112, 496)
  ], { notes: 'Ce n\'est qu\'une proposition de synthèse : c\'est à vous de décider quel axe l\'emporte.' }));

  // 13 · Break into Three : charte
  P.push(opener('c7', '13 · Break into Three', '07', 'Charte', 'graphique', ['Logo', 'Typographies', 'Couleurs', 'Motifs & photographie', 'Règles d\'usage'],
    [BOX(900, 72, 708, 1044, C.darkCard, { lock: true }), I('sarment', 930, 430, 650, 224, { fit: 'contain', r: -10, rad: 0, anim: { type: 'zoom' } })], { bg: C.dark }));
  P.push(PAGE('c7', '13 · Break into Three', 'Le logo', [
    ...HEAD('Charte graphique', 'Le', 'logo'),
    T('Construction, version monochrome, taille minimale : à compléter.', 852, 150, 756, 'body', { tone: 'sub' }),
    FRAME('Logo principal', 72, YC, 1016, 740), FRAME('Version réduite', 1112, YC, 496, 358), FRAME('Zone de protection', 1112, YC + 382, 496, 358)
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Typographies', [
    ...HEAD('Charte graphique', 'Les', 'typographies'),
    T('Typographies provisoires du dossier : à remplacer par celles de l\'axe final.', 852, 150, 756, 'body', { tone: 'sub' }),
    BOX(72, YC, 756, 740), BOX(852, YC, 756, 740),
    T('Titres · Crimson Pro', 108, YC + 36, 600, 'eyebrow'),
    T('Aa', 104, YC + 70, 600, 'num', { ff: 'serif', fw: 400, ls: 0, fs: 220 }),
    T('ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 € % « » ’ — …', 108, YC + 360, 684, 'lead', { fs: 26 }),
    atBottom(T('Titres, chapeaux, citations : une serif au dessin calme, proche de la Minion.', 108, 0, 684, 'small'), YB - 36),
    T('Texte · Instrument Sans', 888, YC + 36, 600, 'eyebrow'),
    T('Aa', 884, YC + 70, 600, 'num', { fs: 220 }),
    T('ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 € % « » ’ — …', 888, YC + 360, 684, 'body', { fs: 22, lh: 1.45 }),
    atBottom(T('Texte courant, étiquettes, légendes : une linéale nette et lisible en petit.', 888, 0, 684, 'small'), YB - 36)
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Couleurs', [
    ...HEAD('Charte graphique', 'Les', 'couleurs'),
    T('Palette provisoire, à remplacer par celle de l\'axe final.', 852, 150, 756, 'body', { tone: 'sub' }),
    ...[[C.ink, 'Encre', 'Texte, logo'], [C.sel, 'Sélection', 'Surlignage, À retenir'], [C.handle, 'Poignée', 'Accent, détails'], [C.green, 'Vigne', 'Graphiques, nature'], [C.kraft, 'Kraft', 'Packaging, étiquette']]
      .flatMap(([hex, n, u], i) => [R(72 + i * 312, YC, 288, 560, hex, { rad: RAD }),
        T(TT(n) + `<p class="s">${hex}<br>${u}</p>`, 72 + i * 312, YC + 588, 288, 'body', { fs: 15.5 })])
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Motifs & photographie', [
    ...HEAD('Charte graphique', 'Motifs &', 'photographie'),
    FRAME('Motif 1', 72, YC, 366, 366), FRAME('Motif 2', 462, YC, 366, 366),
    CARD(K('Principe') + '<p>Les motifs viennent de la matière (cernes, nœuds, vrilles) ; la photographie montre le sarment dans la lumière.</p>', 72, YC + 390, 756, 350, { fs: 18 }),
    FRAME('Direction photo : lumière rasante, matière en gros plan', 852, YC, 756, 740)
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Règles d\'usage', [
    ...HEAD('Charte graphique', 'Règles', 'd\'usage'),
    BOX(72, YC, 756, 740, C.cardGreen), BOX(852, YC, 756, 740, C.cardBrown),
    T(K('À faire', 'green'), 108, YC + 34, 600, 'body'), T(K('À éviter', 'brown'), 888, YC + 34, 600, 'body'),
    FRAME('Bon usage 1', 96, YC + 80, 342, 520, { rad: 18 }), FRAME('Bon usage 2', 462, YC + 80, 342, 520, { rad: 18 }),
    FRAME('Mauvais usage 1', 876, YC + 80, 342, 520, { rad: 18 }), FRAME('Mauvais usage 2', 1242, YC + 80, 342, 520, { rad: 18 }),
    T('Une ligne d\'explication sous chaque exemple.', 96, YC + 622, 342, 'small'), T('Une ligne d\'explication.', 462, YC + 622, 342, 'small'),
    T('Une ligne d\'explication sous chaque exemple.', 876, YC + 622, 342, 'small'), T('Une ligne d\'explication.', 1242, YC + 622, 342, 'small')
  ]));

  // 14 · Finale : déclinaisons
  P.push(opener('c8', '14 · Finale', '08', 'Les', 'déclinaisons', ['Étiquette de traçabilité', 'Packaging', 'Site & réseaux', 'Boutique & salon'],
    [I('fagots', 0, 0, 1680, 1188, { gray: true, lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.55, lock: true })],
    { bg: C.dark, numCol: '#FFFFFF' }));
  const decl = (name, title, a, b, frames, text, keep) => {
    const k = KEEPB(keep, 1112, 496);
    return PAGE('c8', '14 · Finale', name, [
      ...HEAD('Déclinaisons', a, b, { w: 1016 }), ...frames,
      CARD(K(title) + `<p>${text}</p>`, 1112, YC, 496, k.y - GAP - YC, { fs: 17 }), k]);
  };
  P.push(decl('Étiquette de traçabilité', 'L\'étiquette', 'L\'étiquette de', 'traçabilité',
    [FRAME('Mockup étiquette : domaine, cépage, saison de taille, QR code', 72, YC, 1016, 740)],
    'Chaque pied de lampe porte le nom de son domaine, son cépage et sa saison de taille. Un QR code renvoie à l\'histoire de la pièce.', 'La traçabilité, rendue visible et tangible.'));
  P.push(decl('Packaging', 'Le packaging', 'Le', 'packaging',
    [FRAME('Mockup packaging fermé', 72, YC, 496, 740), FRAME('Mockup packaging ouvert', 592, YC, 496, 740)],
    'À compléter : matériaux, format, ouverture, message à l\'intérieur.', 'À compléter : ce que le packaging raconte.'));
  P.push(decl('Site & réseaux', 'Site & réseaux', 'Site &', 'réseaux',
    [FRAME('Maquette du site (ordinateur)', 72, YC, 640, 740), FRAME('Post Instagram', 736, YC, 352, 352), FRAME('Vidéo making-of : insère un MP4 avec l\'outil Vidéo', 736, YC + 376, 352, 364)],
    'Instagram raconte le parcours du rang de vigne à la lampe ; le site relie chaque pièce à son domaine.', 'Du rang de vigne à la lampe, en images.'));
  P.push(decl('Boutique & salon', 'En situation', 'Boutique', '& salon',
    [FRAME('Mise en situation : boutique de domaine', 72, YC, 1016, 358), FRAME('Stand de salon', 72, YC + 382, 496, 358), FRAME('Chambre d\'hôtes', 592, YC + 382, 496, 358)],
    'La lampe dans les lieux où Camille, Laurent et Sophie la rencontrent.', 'À compléter : l\'objet dans son contexte.'));

  // 15 · Final Image : conclusion & sources
  {
    const keep = KEEPB('Bilan et ouverture : à compléter.', 72, 756);
    P.push(PAGE('c9', '15 · Final Image', 'Conclusion', [
      T('Conclusion', 72, Y0, 756, 'eyebrow'),
      T('Comment le design peut-il transformer les <mark class="sel">irrégularités naturelles</mark> du sarment de vigne, aujourd\'hui brûlé ou broyé, en qualités esthétiques et fonctionnelles pour créer un <mark class="sel">luminaire artisanal contemporain</mark> ?', 72, YT, 756, 'lead', { fs: 30 }),
      CARD(K('Notre réponse') + '<p>À rédiger : 3 à 5 lignes qui reprennent la problématique et montrent comment l\'identité y répond.</p>', 72, 400, 756, keep.y - GAP - 400, { fs: 22, ff: 'serif' }),
      keep,
      FRAME('Image finale : la lampe allumée, son ombre au mur', 900, 0, 780, 1188, { lock: true })
    ], { notes: 'Final Image : reprends la problématique mot pour mot et réponds-y.' }));
  }
  P.push(PAGE('c9', '15 · Final Image', 'Sources', [
    ...HEAD('Bibliographie', 'Sources', ''),
    T('Format : organisme ou auteur, titre, date, lien.', 852, 150, 756, 'body', { tone: 'sub' }),
    CARD(K('Chiffres & études') + ROWS(['F.G.V.B. (Fédération des Grands Vins de Bordeaux) : chiffres de la ressource.', 'Syndicat du luminaire, via Lightzoomlumière : marché français.', 'Étude du marché mondial du luminaire haut de gamme (20,26 Md$, 2024) : nommer l\'éditeur.', 'Circulaire du 18 novembre 2011 relative au brûlage des déchets verts.', 'ADEME, appel à projets Agr\'air.', 'Association environnementale à l\'origine du calcul « 130 000 voitures » : à nommer.']), 72, YC, 756, 740, { fs: 17.5 }),
    CARD(K('Sites & entreprises') + ROWS(['Toutlevin.com, « La surprenante seconde vie de la vigne et du raisin ».', 'Les Princes Sarments, lesprincessarments.fr.', 'Vitis Valorem.', 'Niko & Co.', 'Market Set (à vérifier).']), 852, YC, 756, 740, { fs: 17.5 })
  ]));

  const pages = P;
  return {
    meta: { title: 'Dossier SARMENTS', brand: 'Sarments', order: pages.map(p => p.id), v: 1, tpl: TPL_VERSION, createdAt: Date.now() },
    pages
  };
}

/* ---------------------------------------------------------------- galerie « Nouvelle page » */
const LAYOUTS = [
  { key: 'vierge', name: 'Page vierge', build: () => [] },
  { key: 'titre-texte', name: 'Titre + texte', build: () => [
    ...HEAD('Surtitre', 'Titre de', 'la page'), T('Chapeau : deux ou trois lignes qui résument la page.', 852, 142, 756, 'lead', { fs: 27 }),
    T('Texte courant. Double-clique pour écrire.', 72, YC, 756, 'body'), T('Deuxième colonne de texte.', 852, YC, 756, 'body'),
    KEEPB('Une phrase qui résume la page.', 72, 1536)] },
  { key: 'cartes', name: 'Trois cartes', build: () => {
    const k = KEEPB('Une phrase qui résume la page.', 72, 1536);
    return [...HEAD('Surtitre', 'Titre de', 'la page'), T('Chapeau : ce que montrent les trois cartes.', 852, 142, 756, 'lead', { fs: 27 }),
      ...X3.map((x, i) => CARD(K('Carte ' + (i + 1)) + TT('Titre de la carte') + '<p>Texte de la carte. Double-clique pour écrire.</p>', x, YC, W3, k.y - GAP - YC)), k];
  } },
  { key: 'texte-image', name: 'Texte + image', build: () => [
    ...HEAD('Surtitre', 'Titre de', 'la page'), T('Texte courant. Double-clique pour écrire.', 72, YC, 756, 'body'),
    KEEPB('Une phrase qui résume la page.', 72, 756), FRAME('Glisse une photo ici', 852, Y0, 756, 980)] },
  { key: 'image-texte', name: 'Image + texte', build: () => [
    FRAME('Glisse une photo ici', 72, Y0, 756, 980), T('Surtitre', 852, Y0, 756, 'eyebrow'), TITLE('Titre de', 'la page', 852, YT, 756),
    T('Texte courant. Double-clique pour écrire.', 852, YC, 756, 'body'), KEEPB('Une phrase qui résume la page.', 852, 756)] },
  { key: 'pleine', name: 'Image pleine page', bg: C.dark, build: () => [
    FRAME('Glisse une photo ici', 0, 0, 1680, 1188, { lock: true }), R(0, 0, 1680, 1188, '#000000', { o: 0.35, lock: true }),
    TITLE('Grand', 'titre', 72, 760, 1200, 'h1')] },
  { key: 'deux-images', name: 'Deux images', build: () => [
    ...HEAD('Surtitre', 'Titre de', 'la page'), FRAME('Photo 1', 72, YC, 756, 680), FRAME('Photo 2', 852, YC, 756, 680),
    atBottom(T('Légende de la photo 1', 72, 0, 756, 'caption')), atBottom(T('Légende de la photo 2', 852, 0, 756, 'caption'))] },
  { key: 'quatre', name: 'Quatre colonnes', build: () => {
    const k = KEEPB('Une phrase qui résume la page.', 72, 1536);
    return [...HEAD('Surtitre', 'Titre de', 'la page'), T('Chapeau : ce que montrent les quatre colonnes.', 852, 142, 756, 'lead', { fs: 27 }),
      ...X4.flatMap((x, i) => [BOX(x, YC, W4, k.y - GAP - YC), FRAME('Photo', x + 14, YC + 14, W4 - 28, 236, { rad: 18 }),
        T(TT('Titre ' + (i + 1)) + '<p class="s">Texte court.</p>', x + 32, YC + 274, W4 - 64, 'body', { fs: 15 })]), k];
  } },
  { key: 'citation', name: 'Grande citation', bg: C.dark, build: () => [
    T('« Une phrase forte, en grand. »', 72, 380, 1400, 'quote', { fs: 84 }), T('Auteur ou source', 80, 780, 600, 'eyebrow')] },
  { key: 'chiffres', name: 'Chiffres clés', build: () => {
    const k = KEEPB('Ce que disent ces chiffres.', 72, 1536);
    return [...HEAD('Surtitre', 'Chiffres', 'clés'), ...X3.map(x => CARD('<p class="n">00 %</p><p class="s">Ce que mesure ce chiffre, et sa source.</p>', x, YC, W3, k.y - GAP - YC, { fs: 22 })), k];
  } },
  { key: 'intercalaire', name: 'Ouverture de partie', build: () => [
    FRAME('Photo de la partie', 900, 0, 780, 1188, { lock: true }), T('00', 72, 92, 400, 'num', { fs: 150, col: C.handle }),
    TITLE('Titre', 'de la partie', 72, 668, 756, 'h1'), LINE(72, 962, 756), T(PILLS(['Sous-partie', 'Sous-partie', 'Sous-partie']), 72, 990, 756, 'body', { fs: 15 })] },
  { key: 'moodboard', name: 'Moodboard', build: () => [
    FRAME('Image', 72, 72, 620, 494), FRAME('Image', 716, 72, 400, 494), FRAME('Image', 1140, 72, 468, 700), FRAME('Image', 72, 590, 300, 526),
    FRAME('Image', 396, 590, 720, 526), FRAME('Image', 1140, 796, 468, 320)] },
  { key: 'persona', name: 'Persona', build: () => persona({ tag: 'Cible', name: 'Prénom Nom', meta: 'Âge · métier · lieu', quote: 'Sa phrase qui résume tout.',
    fields: [['Situation', '…'], ['Style de vie', '…'], ['Motivations', '…'], ['Freins', '…'], ['Parcours', '…'], ['Canaux', '…']], brings: 'Ce que la marque lui apporte.' }).els },
  { key: 'fiche', name: 'Fiche concurrent', build: () => fiche({ short: 'Concurrent', type: 'Type de concurrent', name: 'Nom', place: 'Lieu', pos: '…', cible: '…', prix: '…', canaux: '…', force: '…', faiblesse: '…', retenir: 'Ce qu\'on en retient.' }).els },
  { key: 'process', name: 'Process en 5 étapes', build: () => [
    ...HEAD('Process', 'Titre du', 'process', { w: 1016 }),
    ...[0, 1, 2, 3, 4].flatMap(i => { const x = 72 + i * 312; return [BOX(x, YC, 288, 740), FRAME('Photo', x + 12, YC + 12, 264, 300, { rad: 18 }), T(K('Étape ' + String(i + 1).padStart(2, '0')) + TT('Étape') + '<p class="s">Description courte.</p>', x + 26, YC + 336, 236, 'body', { fs: 14.5 })]; })] },
  { key: 'galerie', name: 'Recherches (6 cadres)', build: () => [
    ...HEAD('Recherches', 'Titre', null, { w: 1016, t: { fs: 60 } }),
    ...[0, 1, 2, 3, 4, 5].map(i => FRAME('Croquis ' + (i + 1), X3[i % 3], i < 3 ? YC : YC + 382, W3, 358))] },
  { key: 'mockup', name: 'Mise en situation', build: () => {
    const k = KEEPB('Une phrase.', 1112, 496);
    return [FRAME('Mockup', 72, Y0, 1016, 980), T('Surtitre', 1112, Y0, 496, 'eyebrow'), TITLE('Titre de', 'la page', 1112, YT, 496, 'h2', { fs: 56 }),
      CARD(K('Intertitre') + '<p>Ce que montre la mise en situation.</p>', 1112, YC, 496, k.y - GAP - YC), k];
  } }
];
