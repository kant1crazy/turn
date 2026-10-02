/* ==========================================================================
   Modèle « SARMENTS » : dossier pré-rempli + galerie de mises en page.
   Toutes les positions sont en px de page (A3 paysage 1680 × 1188).
   ========================================================================== */
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

function defaultAnim(st, html) {
  if (st === 'keep') return 'select';
  if ((st === 'h1' || st === 'h2' || st === 'cover' || st === 'lead' || st === 'quote') && /<mark/.test(html || '')) return 'select';
  if (st === 'h1' || st === 'h2' || st === 'cover' || st === 'num') return 'rise';
  if (st === 'lead' || st === 'quote' || st === 'body' || st === 'small' || st === 'h3') return 'fade';
  return 'none';
}
function T(html, x, y, w, st = 'body', o = {}) {
  const el = { id: uid(), t: 'text', x, y, w, h: o.h || 40, r: 0, o: 1, st, html: typo(html), autoH: !o.h };
  Object.assign(el, o);
  if (o.h) el.autoH = false;
  if (!el.anim) el.anim = { type: defaultAnim(st, el.html) };
  return el;
}
function I(img, x, y, w, hh, o = {}) {
  const base = typeof img === 'string' ? (IMG[img] || { src: '' }) : (img || { src: '' });
  return {
    id: uid(), t: 'image', x, y, w, h: hh, r: 0, o: 1, src: base.src || '', nw: base.nw || 0, nh: base.nh || 0,
    fit: 'cover', zoom: 1, fx: 0.5, fy: 0.5, gray: false, ph: '', anim: { type: 'fade' }, ...o
  };
}
const FRAME = (text, x, y, w, hh, o = {}) => I(null, x, y, w, hh, { ph: typo(text), ...o });
function R(x, y, w, hh, fill, o = {}) {
  return { id: uid(), t: 'shape', shape: 'rect', x, y, w, h: hh, r: 0, o: 1, fill, stroke: null, sw: 0, rad: 0, anim: { type: 'none' }, ...o };
}
const ELL = (x, y, w, hh, fill, o = {}) => R(x, y, w, hh, fill, { shape: 'ellipse', ...o });
const LINE = (x, y, w, thick = 1.5, color = C.ink, o = {}) => R(x, y, w, thick, color, o);
function DONUT(x, y, size, data, o = {}) {
  return { id: uid(), t: 'chart', kind: 'donut', x, y, w: size, h: size, r: 0, o: 1, hole: 0, start: -90, data, anim: { type: 'zoom' }, ...o };
}
const KEEP = (text, x, y, w, o = {}) => T(text, x, y, w, 'keep', o);
function PAGE(chapter, beat, name, els, o = {}) {
  return {
    id: uid('p'), chapter, beat, name: typo(name), bg: o.bg || '#FFFFFF',
    chrome: { header: o.header !== false, folio: o.folio !== false },
    notes: typo(o.notes || ''), els
  };
}
const TITLE = (a, b, x = 72, y = 96, w = 760, st = 'h2', o = {}) =>
  T(`<p>${a}</p><p class="ind"><mark class="sel">${b}</mark></p>`, x, y, w, st, o);
const LI = arr => arr.map(s => `<p class="li">${s}</p>`).join('');

/* ---------------------------------------------------------------- blocs réutilisés */
function opener(chapter, beat, num, a, b, list, bgEls = [], o = {}) {
  const dark = o.bg ? isDark(o.bg) : false;
  return PAGE(chapter, beat, 'Ouverture · ' + chapterOf(chapter).name, [
    ...bgEls,
    T(num, 72, 540, 300, 'num', { fs: 96, col: o.numCol || C.handle }),
    TITLE(a, b, 72, 680, o.tw || 1400, 'h1'),
    T(list, 80, 1010, 1300, 'label', dark ? { col: '#D9D6D0' } : {})
  ], { header: false, bg: o.bg, notes: o.notes });
}
function fiche(d) {
  const els = [
    T(d.type, 72, 96, 500, 'label'),
    T(d.name, 72, 124, 760, 'h2', { fs: 70 }),
    T(d.place, 72, 222, 760, 'small', { col: C.muted }),
    d.photo ? I(d.photo, 72, 300, 470, 640) : FRAME('Photo produit principale', 72, 300, 470, 640),
    FRAME('Photo produit', 566, 300, 262, 308),
    FRAME('Photo d\'ambiance ou de communication', 566, 632, 262, 308),
    FRAME('Logo', 1448, 96, 160, 90),
    T('Positionnement', 852, 300, 756, 'label'),
    T(d.pos, 852, 326, 756, 'body'),
    T('Cible', 852, 450, 366, 'label'), T(d.cible, 852, 476, 366, 'body'),
    T('Prix', 1242, 450, 366, 'label'), T(d.prix, 1242, 476, 366, 'body'),
    T('Canaux & communication', 852, 580, 756, 'label'), T(d.canaux, 852, 606, 756, 'body'),
    T('Force', 852, 700, 366, 'h3', { box: 'rule', fs: 18 }), T(d.force, 852, 752, 366, 'body'),
    T('Faiblesse', 1242, 700, 366, 'h3', { box: 'rule', fs: 18 }), T(d.faiblesse, 1242, 752, 366, 'body'),
    KEEP(d.retenir, 852, 960, 756),
    T('Identité visuelle : palette, typographie, ton (à compléter)', 72, 966, 756, 'caption')
  ];
  return PAGE('c4', '5 · Debate', 'Fiche · ' + d.short, els, { notes: d.notes });
}
function persona(d) {
  const fields = d.fields;
  const els = [
    FRAME('Portrait libre de droits (Unsplash, Pexels…)', 72, 72, 520, 1044),
    T(d.tag, 652, 96, 900, 'label'),
    T(d.name, 652, 124, 956, 'h2', { fs: 72 }),
    T(d.meta, 652, 222, 956, 'small', { col: C.muted }),
    T('« ' + d.quote + ' »', 652, 290, 956, 'quote', { fs: 32 })
  ];
  fields.forEach((f, i) => {
    const col = i < 3 ? 0 : 1, row = i % 3;
    const x = col ? 1144 : 652, w = col ? 464 : 452, y = 450 + row * 150;
    els.push(T(f[0], x, y, w, 'label'), T(f[1], x, y + 26, w, 'small'));
  });
  els.push(KEEP(d.brings, 652, 960, 956));
  return PAGE('c5', '7 · B Story', 'Persona · ' + d.name, els, { notes: 'Persona : ajoute un portrait libre de droits. Un persona ne garde qu\'une option par champ.' });
}
function axePages(n, name, a, b, mb, intent, kw, marche, manque, keep, beat, two) {
  const pages = [];
  pages.push(PAGE('c6', beat, `Axe ${n} · Intention`, [
    I(mb, 852, 0, 828, 1188, { lock: true, anim: { type: 'reveal' } }),
    T(`Axe ${n}`, 72, 96, 300, 'label'),
    TITLE(a, b, 72, 540, 760, 'h1'),
    T(intent, 80, 840, 640, 'lead', { fs: 26 }),
    T(kw, 80, 1030, 680, 'label')
  ], { notes: 'Remplace le moodboard par l\'image la plus forte de l\'axe.' }));
  if (two) {
    // version compacte (axe 2.5) : recherches à gauche, bilan à droite
    pages.push(PAGE('c6', beat, `Axe ${n} · Recherches & bilan`, [
      T(`Axe ${n} · Recherches & bilan`, 72, 96, 600, 'label'),
      T(name, 72, 124, 900, 'h2', { fs: 56 }),
      FRAME('Croquis de logo', 72, 260, 450, 360), FRAME('Essais typographiques', 546, 260, 450, 360),
      FRAME('Motifs & textures', 72, 644, 450, 400), FRAME('Mise en situation', 546, 644, 450, 400),
      T('Ce qui marche', 1056, 260, 552, 'h3', { box: 'rule' }), T(marche, 1056, 316, 552, 'body'),
      T('Ce qui manque', 1056, 520, 552, 'h3', { box: 'rule' }), T(manque, 1056, 576, 552, 'body'),
      KEEP(keep, 1056, 900, 552)
    ]));
    return pages;
  }
  pages.push(PAGE('c6', beat, `Axe ${n} · Recherches`, [
    T(`Axe ${n} · Recherches`, 72, 96, 600, 'label'),
    T(name, 72, 124, 1000, 'h2', { fs: 56 }),
    FRAME('Croquis de logo', 72, 260, 496, 380), FRAME('Essais typographiques', 592, 260, 496, 380), FRAME('Motifs & textures', 1112, 260, 496, 380),
    FRAME('Palette & essais couleur', 72, 664, 496, 300), FRAME('Déclinaison test', 592, 664, 1016, 300),
    T('Notes de recherche : à compléter.', 72, 1000, 900, 'small')
  ]));
  pages.push(PAGE('c6', beat, `Axe ${n} · Bilan`, [
    FRAME('Mise en situation : étiquette, post Instagram, packaging…', 72, 72, 900, 1044),
    T(`Axe ${n} · Bilan`, 1032, 96, 576, 'label'),
    T('Ce qui marche', 1032, 150, 576, 'h3', { box: 'rule' }), T(marche, 1032, 206, 576, 'body'),
    T('Ce qui manque', 1032, 420, 576, 'h3', { box: 'rule' }), T(manque, 1032, 476, 576, 'body'),
    KEEP(keep, 1032, 900, 576)
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
const pestelHTML = items => items.map(([k, kw, t]) => `<p><span class="tag ${k}">${TAGN[k]}</span><b>${kw}</b> ${t}</p>`).join('');

/* ---------------------------------------------------------------- le dossier */
function buildDossier() {
  const P = [];
  const C4 = [cx(1), cx(4), cx(7), cx(10)];

  // 00 · Couverture
  P.push(PAGE('ouv', '—', 'Couverture', [
    T('Dossier de projet', 72, 72, 500, 'label'),
    T('Antoine<br>Quentin Lambert<br>2026', 1208, 72, 400, 'lead', { fs: 26, al: 'right' }),
    I('sarment', 860, 420, 760, 262, { fit: 'contain', r: -4, anim: { type: 'zoom' } }),
    T('<mark class="sel">Sarments</mark>', 84, 790, 1100, 'cover'),
    T('Matière première, seconde vie : création d\'une marque produit', 96, 975, 1000, 'lead', { fs: 30 })
  ], { header: false, folio: false, notes: 'Couverture : remplace le sarment détouré par la photo de votre lampe quand elle existe.' }));

  // 01 · Sommaire
  P.push(PAGE('ouv', '—', 'Sommaire', [
    I('pile', 0, 0, 760, 1188, { fx: 0.4, lock: true, anim: { type: 'reveal' } }),
    T('Sommaire', 852, 96, 756, 'h2'),
    T('', 852, 300, 756, 'lead', { toc: true, fs: 36, lh: 1.25, anim: { type: 'fade' } })
  ], { header: false, notes: 'Le sommaire se met à jour tout seul à partir des chapitres et des numéros de page.' }));

  // 1 · Opening Image : Brief
  P.push(PAGE('c1', '1 · Opening Image', 'Brief', [
    T('Brief', 72, 110, 400, 'label'),
    T('Demande : créer une marque à partir d\'une matière première en seconde vie.', 72, 150, 700, 'lead', { fs: 48, lh: 1.14 }),
    T('Le projet', 72, 560, 366, 'h3', { box: 'rule' }),
    T('SARMENTS transforme le sarment de vigne, coproduit brûlé ou broyé chaque hiver, en luminaires artisanaux. Le sarment est conservé entier et tracé jusqu\'à son domaine d\'origine, en Nouvelle-Aquitaine.', 72, 616, 366, 'body'),
    T('Les attentes', 462, 560, 366, 'h3', { box: 'rule' }),
    T('Une plateforme de marque, une identité visuelle (logo, charte graphique) et ses déclinaisons : étiquette de traçabilité, packaging, réseaux sociaux, site.', 462, 616, 366, 'body'),
    FRAME('Photo pleine hauteur : vigne taillée en hiver, sarments au sol (à faire pendant la taille, de novembre à mars)', 852, 0, 828, 1188, { lock: true })
  ], { notes: 'Opening Image : une page d\'image. La photo de vigne en hiver sera la plus forte si vous la faites vous-mêmes.' }));

  // 2 · Theme Stated : Problématique
  P.push(PAGE('c1', '2 · Theme Stated', 'Problématique', [
    T('Problématique', 72, 150, 400, 'label'),
    T('Comment le design peut-il transformer les <mark class="sel">irrégularités naturelles</mark> du sarment de vigne, aujourd\'hui brûlé ou broyé, en qualités esthétiques et fonctionnelles pour créer un <mark class="sel">luminaire artisanal contemporain</mark> ?', 72, 220, 1320, 'lead', { fs: 62, lh: 1.17 }),
    LINE(72, 820, 1536, 1.5, '#4A4A4A'),
    T('01 · Matière', 72, 856, 496, 'h3'), T('Les nœuds, l\'écorce et les courbes du sarment deviennent une signature visuelle.', 72, 906, 440, 'small'),
    T('02 · Geste', 592, 856, 496, 'h3'), T('La main qui récolte, cintre et assemble reste visible dans l\'objet.', 592, 906, 440, 'small'),
    T('03 · Lumière', 1112, 856, 496, 'h3'), T('La lumière révèle le sarment et projette son dessin dans la pièce.', 1112, 906, 440, 'small')
  ], { bg: C.dark, notes: 'Theme Stated : la problématique seule, en grand. Les trois mots annoncent vos trois axes.' }));

  // 3 · Set-Up : Analyse stratégique
  P.push(opener('c2', '3 · Set-Up', '02', 'Analyse', 'stratégique', 'Contexte · Ressource · Usages · Secteur · PESTELÉ · Marché',
    [I('pile', 840, 0, 840, 1188, { fx: 0.55, lock: true, anim: { type: 'reveal' } })], { tw: 740 }));

  P.push(PAGE('c2', '3 · Set-Up', 'Analyse contextuelle', [
    TITLE('Analyse', 'contextuelle'),
    T('La viticulture française produit plus de <b>2 tonnes de sarments par hectare et par an</b>, générés lors de la taille et de l\'épamprage. Cette biomasse est aujourd\'hui majoritairement <b>brûlée, broyée ou compostée</b> et rarement valorisée comme matière noble. À l\'échelle nationale, la filière génère plus de 1,6 million de tonnes de coproduits agricoles par an, dont 93 % de sarments.', 72, 330, 626, 'body'),
    LINE(72, 560, 756, 1, C.line),
    T('2\u00A0t', 72, 590, 236, 'num', { fs: 72 }), T('de sarments par hectare et par an', 72, 670, 220, 'small'),
    T('1,6\u00A0Mt', 332, 590, 236, 'num', { fs: 68 }), T('de coproduits viticoles chaque année', 332, 670, 220, 'small'),
    T('93 %', 592, 590, 236, 'num', { fs: 72 }), T('de ces coproduits sont des sarments', 592, 670, 220, 'small'),
    KEEP('Une ressource massive (2 t/ha/an, 93 % des coproduits viticoles) encore traitée comme un déchet.', 72, 900, 626),
    T('Source : F.G.V.B. (Fédération des Grands Vins de Bordeaux)', 72, 1080, 626, 'caption'),
    I('pile', 852, 96, 756, 500, { fx: 0.5 }),
    T('Tas de sarments après la taille', 852, 606, 756, 'caption'),
    DONUT(880, 700, 290, [{ v: 93, c: C.green, l: 'Sarments' }, { v: 7, c: '#D9D3C7', l: 'Autres' }]),
    T('93 %<br>sarments', 1210, 740, 380, 'lead', { fs: 44, lh: 1.02 }),
    T('Coproduits viticoles en France : 1,6 million de tonnes par an', 1210, 860, 380, 'small'),
    T('7 % : autres coproduits (marcs, lies…)', 1210, 930, 380, 'caption')
  ], { notes: 'Source à vérifier : F.G.V.B. La circulaire de 2011 a été déplacée dans « Pourquoi maintenant ».' }));

  const months = ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct'];
  P.push(PAGE('c2', '3 · Set-Up', 'La ressource', [
    I('mains', 0, 0, 780, 1188, { fx: 0.5, fy: 0.45, lock: true, anim: { type: 'reveal' } }),
    T('Sarment broyé : l\'usage d\'aujourd\'hui', 40, 1128, 600, 'caption', { col: '#FFFFFF' }),
    T('Une ressource disponible, gratuite et en quête de débouchés', 852, 110, 660, 'h3'),
    T('<p>Les alternatives officiellement recommandées sont le broyage, le compostage, le paillage ou l\'apport en déchèterie. Aucune de ces solutions ne valorise économiquement la matière. La collecte se fait traditionnellement de novembre à mars, période de taille.</p><p>La ressource est abondante, récurrente, disponible gratuitement ou à très faible coût, et les producteurs sont en recherche active de débouchés depuis le durcissement des règles anti-brûlage. Le rapport de force à l\'approvisionnement est favorable à un porteur de projet.</p>', 852, 220, 660, 'body'),
    T('Le calendrier de la matière', 852, 610, 660, 'label'),
    ...months.map((m, i) => T(m, 852 + i * 63, 648, 60, 'label', { fs: 11, ls: 0.08, anim: { type: 'none' } })),
    R(852, 676, 313, 14, C.brown), R(1167, 676, 313, 14, C.sand), R(1482, 676, 126, 14, C.sel),
    T('Taille & collecte', 852, 702, 300, 'caption'), T('Séchage (3 à 6 mois)', 1167, 702, 300, 'caption'), T('Façonnage', 1482, 702, 126, 'caption'),
    KEEP('Abondante, récurrente et gratuite : la matière est là, et les vignerons cherchent à s\'en défaire proprement.', 852, 900, 660)
  ], { notes: 'La photo montre du sarment broyé : c\'est voulu (légende). Séchage : choisis entre « 3 à 6 mois » et « 6 mois minimum ».' }));

  const usages = [
    ['sol', 'Retour au sol', 0.9, 'C\'est l\'usage majoritaire : le sarment est broyé et laissé dans les rangs. Certains experts jugent ces 2 tonnes restituées comme un minimum pour la vie du sol.'],
    ['brulage', 'Brûlage', 0.35, 'Encore souvent pratiqué à l\'air libre, il génère une fumée polluante. La réglementation se durcit là où il était traditionnel.'],
    ['compost', 'Énergie & compost', 0.3, 'Transformation en pellets, en biogaz ou en compost.'],
    ['materiaux', 'Matériaux', 0.1, 'Vitis Valorem collecte 300 hectares de sarments et de ceps par an pour fabriquer tuteurs, piquets et agrafes. Les Princes Sarments en font un composite.']
  ];
  P.push(PAGE('c2', '3 · Set-Up', 'Usages actuels', [
    T('Usages actuels', 72, 110, 600, 'h3'),
    T('Avec environ deux tonnes par hectare et par an, la ressource est massive et récurrente. Elle part aujourd\'hui dans quatre directions.', 72, 156, 1020, 'lead'),
    LINE(0, 474, 1680, 1.5, C.ink),
    ...usages.flatMap(([img, t, share, d], i) => [
      I(img, C4[i], 330, 366, 290),
      T(t, C4[i], 648, 366, 'h3', { fs: 20 }),
      R(C4[i], 688, 366, 3, '#DCD7CE'), R(C4[i], 688, Math.round(366 * share), 3, C.handle),
      T(d, C4[i], 712, 366, 'small')
    ]),
    KEEP('Aucun usage actuel ne conserve le sarment dans sa forme d\'origine : il est broyé, brûlé ou composté.', 72, 960, 700),
    T('Source : toutlevin.com, « La surprenante seconde vie de la vigne et du raisin ». Jauges qualitatives.', 852, 1010, 756, 'caption')
  ], { notes: 'Les photos d\'usage sont petites (basse définition) : remplace-les par des versions plus grandes si possible.' }));

  P.push(PAGE('c2', '3 · Set-Up', 'Analyse du secteur', [
    TITLE('Analyse', 'du secteur'),
    T('« Un secteur sous pression réglementaire, pas sous tension économique. »', 72, 540, 640, 'quote', { fs: 46 }),
    T('Le secteur du sarment de vigne se caractérise avant tout par un déséquilibre entre l\'abondance de la ressource et la faiblesse de sa valorisation : une ressource massive et récurrente, mais sous-exploitée. L\'écrasante majorité de cette biomasse reste traitée comme un déchet agricole plutôt que comme une matière première : broyage-épandage direct dans les rangs de vigne, un peu de compostage et, historiquement, beaucoup de brûlage.', 852, 110, 366, 'body'),
    T('Ce qui fait bouger les lignes n\'est pas la demande (peu de filières viennent chercher la matière), mais la contrainte : interdictions progressives de brûlage, plans de protection de l\'atmosphère locaux, pression citoyenne. Les vignerons ne cherchent donc pas à vendre leurs sarments : ils cherchent surtout à s\'en débarrasser proprement.', 1242, 110, 366, 'body'),
    T('Ressource', 852, 600, 300, 'label'), R(852, 628, 756, 16, C.brown),
    T('Massive : environ 1,5 million de tonnes de sarments par an', 852, 652, 756, 'small'),
    T('Valorisation', 852, 716, 300, 'label'), R(852, 744, 76, 16, C.handle),
    T('Faible : quelques niches (énergie, composites, mobilier)', 852, 768, 756, 'small'),
    KEEP('Pas de marché organisé : le sarment est géré comme un déchet en quête de débouchés.', 852, 900, 756)
  ]));

  P.push(PAGE('c2', '3 · Set-Up', 'Petite et grande échelle', [
    I('fagots', 1000, 0, 680, 1188, { lock: true, anim: { type: 'reveal' } }),
    T('Les voies de valorisation « nobles »', 72, 110, 860, 'h3'),
    T('<p>Les voies de valorisation « nobles » (énergie, matériaux composites, mobilier, cosmétique) existent et sont documentées depuis les années 2010-2015 par les instituts techniques de la filière, mais restent à l\'état de niches.</p><p>Le gisement mobilisable est qualifié de faible par les organismes du secteur eux-mêmes, non pas parce que la matière manque, mais parce que les filières de collecte, de transport et de transformation ne sont pas structurées à grande échelle : chaque tentative reste artisanale ou expérimentale.</p>', 72, 160, 860, 'body'),
    T('Petite échelle', 72, 480, 418, 'h3', { box: 'rule' }),
    T(LI(['+ Peu de concurrence', '+ Matière accessible', '+ Pas de barrière financière à l\'approvisionnement']), 72, 540, 418, 'body'),
    T('Grande échelle', 514, 480, 418, 'h3', { box: 'rule' }),
    T(LI(['− Pas de logistique de collecte organisée', '− Matière hétérogène', '− Faible valeur économique au kilo']), 514, 540, 418, 'body'),
    KEEP('Facile d\'entrer à petite échelle, difficile d\'industrialiser : le modèle artisanal est le bon point de départ.', 72, 900, 860)
  ]));

  const pestCol = (name, x, y = 300) => [
    T(name, x, y, 366, 'h3', { box: 'rule', fs: 21 }),
    T(pestelHTML(PESTEL[name]), x, y + 62, 366, 'small')
  ];
  P.push(PAGE('c2', '3 · Set-Up', 'PESTELÉ 1/2', [
    T('<mark class="sel">PESTELÉ</mark>', 72, 96, 760, 'h2'),
    T('1 / 2', 852, 116, 200, 'label'),
    T('Sept facteurs pour lire l\'environnement du projet, classés en atouts, freins, effets mixtes et points de vigilance.', 852, 150, 756, 'lead', { fs: 24 }),
    ...pestCol('Politique', C4[0]), ...pestCol('Économique', C4[1]), ...pestCol('Socioculturel', C4[2]), ...pestCol('Technologique', C4[3]),
    T('<span class="tag up">Atout</span> <span class="tag down">Frein</span> <span class="tag mix">Mixte</span> <span class="tag warn">Vigilance</span>', 72, 1060, 900, 'small', { anim: { type: 'none' } })
  ]));
  P.push(PAGE('c2', '3 · Set-Up', 'PESTELÉ 2/2', [
    T('<mark class="sel">PESTELÉ</mark>', 72, 96, 760, 'h2'),
    T('2 / 2', 852, 116, 200, 'label'),
    ...pestCol('Écologique', C4[0]), ...pestCol('Légal', C4[1]), ...pestCol('Éthique', C4[2]),
    KEEP('Un contexte porteur (réglementation, envie de sens, image de la vigne), à condition de rester honnête : pas de greenwashing, équité avec les vignerons, traçabilité réelle.', C4[3], 362, 366, { fs: 21 })
  ], { notes: 'RIPFCI : règlement interdépartemental de protection de la forêt contre l\'incendie (à vérifier).' }));

  P.push(PAGE('c2', '3 · Set-Up', 'Marché de vente', [
    TITLE('Marché', 'de vente'),
    T('−1,7 %', 72, 380, 380, 'num', { fs: 88 }),
    T('Lampes et luminaires en France : 4,165 Md€ en 2022, 4,094 Md€ en 2023 (Syndicat du luminaire).', 72, 476, 350, 'small'),
    T('+7,7 %', 462, 380, 380, 'num', { fs: 88, col: C.handle }),
    T('par an : croissance attendue du luminaire haut de gamme dans le monde jusqu\'en 2034 (20,26 Md$ en 2024).', 462, 476, 350, 'small'),
    T('Tendance : les acteurs misent sur les matériaux durables pour se repositionner. La part grand public est plus petite : la consommation des ménages en appareils d\'éclairage était de 790 M€ en 2021.', 72, 650, 740, 'body'),
    KEEP('Le haut de gamme progresse (+7,7 %/an) pendant que le grand public recule (−1,7 %) : la place est du côté du luminaire durable et premium.', 72, 900, 740),
    I('lampes', 922, 96, 686, 860),
    T('Le naturel standardisé de la grande distribution : notre contre-modèle.', 922, 968, 686, 'caption')
  ]));

  // 4 · Catalyst
  P.push(PAGE('c3', '4 · Catalyst', 'Le brûlage n\'est plus une option', [
    TITLE('Pourquoi', 'maintenant ?'),
    T('130 000', 72, 390, 760, 'num', { fs: 168 }),
    T('voitures par jour', 80, 560, 600, 'lead', { fs: 34 }),
    T('C\'est la pollution équivalente aux 4 300 à 5 500 tonnes de bois de vigne brûlées en trois mois en Gironde, selon une association environnementale.', 80, 620, 560, 'small'),
    KEEP('Brûler n\'est plus possible, broyer ne rapporte rien : les vignerons ont besoin d\'un débouché.', 72, 900, 700),
    T('Le brûlage n\'est plus une option', 852, 110, 756, 'h3'),
    T('<p>En Gironde, premier vignoble de Nouvelle-Aquitaine, le brûlage à l\'air libre des déchets verts viticoles est interdit ou fortement encadré dans les zones à dominante forestière. Le cadre de référence est la circulaire du 18 novembre 2011, qui interdit le brûlage à l\'air libre des déchets verts à l\'échelle nationale.</p><p>Les alternatives recommandées (broyage, compostage, paillage, déchèterie) ne valorisent pas économiquement la matière. Les vignerons cherchent donc surtout à se débarrasser proprement de leurs sarments.</p>', 852, 160, 756, 'body'),
    FRAME('Photo : fumée de brûlage dans les vignes', 852, 600, 756, 440),
    T('Sources : circulaire du 18 novembre 2011 ; [nom de l\'association environnementale] ; F.G.V.B.', 852, 1056, 756, 'caption')
  ], { notes: 'Remplace [nom de l\'association] par la source exacte du chiffre « 130 000 voitures ».' }));
  P.push(PAGE('c3', '4 · Catalyst', 'Le luminaire cherche d\'autres matières', [
    T('Le luminaire aujourd\'hui', 72, 110, 760, 'h3'),
    T('Le luminaire d\'aujourd\'hui repose surtout sur des matériaux énergivores ou d\'origine fossile.', 72, 156, 1100, 'lead'),
    ...[['Métal', 'Acier, aluminium, laiton : très courants pour les pieds et les structures. L\'aluminium neuf est particulièrement énergivore à produire.', 'Photo : pied de lampe en métal'],
      ['Plastiques', 'ABS, polycarbonate, polypropylène : dominants dans l\'entrée de gamme, d\'origine fossile et peu recyclés.', 'Photo : lampe en plastique'],
      ['Verre & céramique', 'Cuits à haute température, donc énergivores.', 'Photo : lampe en verre ou céramique'],
      ['Fibres naturelles', 'Bois, rotin, osier, papier, tissu : surtout pour les abat-jour et les modèles « naturels ».', 'Photo : abat-jour en fibres naturelles']]
      .flatMap(([t, d, ph], i) => [FRAME(ph, C4[i], 270, 366, 290), T(t, C4[i], 590, 366, 'h3', { fs: 20 }), T(d, C4[i], 632, 366, 'small')]),
    T('<p><b>Recycler le sarment, c\'est :</b></p>' + LI(['• du temps gagné pour les vignerons ;', '• un engagement fort pour l\'environnement ;', '• moins de CO₂ ;', '• pas de fumée toxique ;', '• moins de risques d\'incendie.']), 72, 800, 600, 'body', { box: 'fill', bg: C.warm }),
    T('Et la demande suit : le luminaire haut de gamme progresse de plus de 7,7 % par an dans le monde, et les fabricants misent sur les matériaux durables pour se repositionner.', 852, 800, 756, 'lead', { fs: 26 }),
    KEEP('La contrainte crée le besoin (le brûlage recule), la tendance crée la demande (matériaux durables) : c\'est le bon moment.', 852, 980, 756)
  ], { notes: 'Les 4 photos sont à trouver : dans la version InDesign, les photos des usages avaient été réutilisées par erreur.' }));

  // 5 · Debate : Concurrence
  P.push(opener('c4', '5 · Debate', '04', 'Paysage', 'concurrentiel', 'Niko & Co · Les Princes Sarments · Vitis Valorem · fibres naturelles premium · grande distribution · artisans du bois brut',
    [I('sarment', 900, 150, 700, 242, { fit: 'contain', r: -8, anim: { type: 'zoom' } })], { bg: C.dark }));
  P.push(PAGE('c4', '5 · Debate', 'Typologie des concurrents', [
    TITLE('Trois familles', 'de concurrents', 72, 96, 1000),
    ...[['Directs', 'Même matière, même usage.', 'Niko & Co (Charente) : mobilier design en piquets de vigne, pièces uniques.'],
      ['Indirects', 'Même matière, autre usage.', 'Les Princes Sarments : composite de sarment broyé pour l\'architecture de luxe. Vitis Valorem : filière de collecte et matière Sarmine®.'],
      ['Substituts', 'Autre matière, même besoin, même cible.', 'Luminaires en fibres naturelles d\'éditeurs, « naturel » de la grande distribution, lampes en bois flotté d\'artisans.']]
      .flatMap(([t, s, d], i) => {
        const x = [cx(1), cx(5), cx(9)][i];
        return [T(t, x, 400, 496, 'h3', { box: 'rule' }), T(s, x, 460, 496, 'lead', { fs: 24 }), T(d, x, 530, 496, 'body')];
      }),
    KEEP('Un seul concurrent direct, et aucun acteur qui conserve le sarment entier, tracé jusqu\'à son domaine d\'origine.', 72, 900, 900)
  ]));
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

  const cols = ['Acteur', 'Site / e-shop', 'Instagram', 'Ton', 'Packaging', 'Traçabilité', 'Prix'];
  const actors = ['Niko & Co', 'Les Princes Sarments', 'Vitis Valorem', 'Fibres naturelles premium', 'Grande distribution', 'Artisans du bois brut'];
  const colX = i => i === 0 ? 72 : 72 + 280 + (i - 1) * 209;
  const colW = i => i === 0 ? 256 : 190;
  const table = [];
  cols.forEach((c, i) => table.push(T(c, colX(i), 340, colW(i), 'label', { anim: { type: 'none' } })));
  table.push(LINE(72, 376, 1536, 1.5, C.ink));
  actors.forEach((a, r) => {
    const y = 396 + r * 84;
    table.push(T('<b>' + a + '</b>', colX(0), y, colW(0), 'small', { anim: { type: 'none' } }));
    for (let i = 1; i < cols.length; i++) table.push(T('—', colX(i), y, colW(i), 'small', { col: C.muted, anim: { type: 'none' } }));
    table.push(LINE(72, y + 64, 1536, 1, C.line));
  });
  P.push(PAGE('c4', '5 · Debate', 'Outils de communication', [
    TITLE('Outils de', 'communication', 72, 96, 1000),
    ...table,
    KEEP('À compléter avec le tableau : si aucun acteur n\'affiche l\'origine précise de sa matière, c\'est notre territoire.', 72, 960, 900)
  ], { notes: 'Remplis chaque case (un mot ou deux). Ajoute une page « tendances » si besoin : ce que tous font, ce que personne ne fait.' }));

  const pt = (x, y) => [552 + 460 * x, 610 - 450 * y];
  const dots = [['Grande distribution', -0.8, -0.8], ['Fibres naturelles premium', -0.7, -0.05], ['Artisans bois flotté', -0.55, 0.75],
    ['Vitis Valorem', 0.45, -0.8], ['Les Princes Sarments', 0.5, -0.12], ['Niko & Co', 0.2, 0.62]];
  const [sx, sy] = pt(0.85, 0.8);
  P.push(PAGE('c4', '5 · Debate', 'Croix de positionnement', [
    R(553, 140, 479, 469, C.sel, { o: 0.55 }),
    R(72, 609, 960, 2, C.ink), R(551, 140, 2, 940, C.ink),
    T('Lien faible à la vigne', 72, 572, 330, 'label'), T('Sarment tracé jusqu\'au domaine', 700, 572, 330, 'label', { al: 'right' }),
    T('Artisanal · pièce unique', 566, 146, 330, 'label'), T('Industriel · série', 566, 1046, 330, 'label'),
    ...dots.flatMap(([n, x, y]) => { const [px, py] = pt(x, y); return [ELL(px - 9, py - 9, 18, 18, C.ink), T(n, px + 16, py - 13, 260, 'small', { fs: 16, anim: { type: 'none' } })]; }),
    ELL(sx - 15, sy - 15, 30, 30, C.handle, { anim: { type: 'zoom' } }), T('<b>SARMENTS</b>', sx - 268, sy - 15, 244, 'body', { al: 'right', fs: 20 }),
    TITLE('Croix de', 'positionnement', 1112, 110, 496, 'h2', { fs: 62 }),
    T('Deux axes : le lien avec la vigne (de la matière anonyme au sarment tracé jusqu\'à son domaine) et le mode de production (de la série industrielle à la pièce unique). Les points se déplacent : ajuste-les avec vos fiches.', 1112, 330, 496, 'body'),
    KEEP('Seul acteur à relier un sarment conservé entier à son domaine d\'origine, en production artisanale.', 1112, 860, 496)
  ]));
  P.push(PAGE('c4', '5 · Debate', 'Synthèse de l\'analyse', [
    TITLE('Synthèse', 'de l\'analyse'),
    T('<p>La viticulture française génère plus de 2 tonnes de sarments par hectare et par an, une biomasse aujourd\'hui très peu valorisée (broyage-épandage majoritaire, brûlage en recul sous la pression réglementaire). En Gironde, l\'encadrement croissant du brûlage pousse les domaines à chercher des débouchés, ce qui rend la matière accessible gratuitement ou à faible coût.</p><p>Le secteur reste peu structuré : ce n\'est pas un marché organisé, mais une gestion de déchet agricole en quête de valorisation. Niko & Co travaille les piquets de vigne, Les Princes Sarments un composite de luxe, Vitis Valorem une filière B2B. Aucun n\'occupe le luminaire en sarment brut tracé jusqu\'au domaine d\'origine : c\'est l\'espace de différenciation du projet.</p><p>L\'analyse PESTELÉ confirme un contexte favorable, avec des points de vigilance éthiques : risque de greenwashing, équité de valeur avec les vignerons fournisseurs, transparence sur la traçabilité annoncée.</p>', 72, 330, 660, 'body'),
    KEEP('Aucun acteur n\'occupe le luminaire en sarment brut, tracé jusqu\'au domaine, en Nouvelle-Aquitaine.', 72, 930, 660),
    FRAME('Photo de respiration : sarments en lumière rasante', 852, 0, 828, 1188, { lock: true })
  ], { notes: 'Quand les 6 fiches seront faites, ajoute les trois nouveaux acteurs au 2e paragraphe.' }));

  // 6 · Break into Two : Concept
  P.push(opener('c5', '6 · Break into Two', '05', 'Concept &', 'plateforme de marque', 'Concept · Process · Mission & valeurs · Cibles · Personas · SWOT · Mix marketing · Nom',
    [I('mains', 0, 0, 1680, 1188, { gray: true, fy: 0.4, lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.5, lock: true })],
    { bg: C.dark, numCol: '#FFFFFF' }));
  P.push(PAGE('c5', '6 · Break into Two', 'Le sarment reste sarment', [
    I('mains', 0, 0, 840, 1188, { fy: 0.5, lock: true, anim: { type: 'fade' } }),
    R(840, 0, 840, 1188, C.warm, { lock: true }),
    I('sarment', 900, 470, 720, 248, { fit: 'contain', r: -6, anim: { type: 'zoom' } }),
    T('<mark class="sel">Le sarment reste sarment</mark>', 340, 140, 1000, 'h2', { al: 'center', fs: 78 }),
    T('Ce que font les autres : le sarment broyé, réduit en brisures.', 40, 1120, 700, 'caption', { col: '#FFFFFF' }),
    T('Ce que nous faisons : le sarment entier, cintré, reconnaissable.', 900, 1120, 700, 'caption'),
    T('On ne dénature pas le sarment. Là où les autres entreprises le broient pour l\'utiliser en brisures, nous le conservons dans sa structure naturelle, en y ajoutant des courbes organiques pour le sublimer. Nous mettons en valeur ce qui est habituellement broyé ou brûlé.', 900, 790, 660, 'lead', { fs: 24 })
  ], { notes: 'Break into Two : le concept en une image. Remplace le sarment détouré par une photo de votre pied de lampe cintré.' }));
  const steps = [
    ['Récolter', 'Choisir des sarments encore souples (récolte hivernale, juste après la taille) et épais, pour la structure.'],
    ['Nettoyer et traiter', 'Brosser pour enlever la terre et l\'écorce abîmée. Trempage ou autoclave anti-insectes, puis léger ponçage des nœuds.'],
    ['Cintrer et sécher', 'Cintrer les sarments encore verts sur un gabarit et laisser sécher plusieurs semaines : le bois garde la forme.'],
    ['Façonner le pied', 'À compléter : assemblage, fixation de la douille, passage du câble, socle, abat-jour.'],
    ['Tracer', 'Chaque pied reçoit une étiquette : domaine, cépage, saison de taille.']];
  P.push(PAGE('c5', '6 · Break into Two', 'De la vigne à la lampe', [
    TITLE('De la vigne', 'à la lampe', 72, 96, 1000),
    ...steps.flatMap(([t, d], i) => {
      const x = 72 + i * 312;
      return [FRAME(`Photo : étape ${i + 1}`, x, 330, 288, 300), T(String(i + 1).padStart(2, '0'), x, 652, 120, 'num', { fs: 44, col: C.handle }),
        T(t, x, 712, 288, 'h3', { fs: 19 }), T(d, x, 754, 288, 'small')];
    }),
    T('Partenaire', 72, 950, 480, 'label'),
    T('Un vannier ou un sculpteur sur bois apporte la technique d\'exécution et montre une vraie réflexion sur le mode de production.', 72, 976, 480, 'small'),
    T('Faisabilité', 600, 950, 460, 'label'),
    T('Niko & Co, jeune entreprise charentaise, transforme déjà des piquets de vigne en mobilier design vendu aux particuliers et aux professionnels.', 600, 976, 460, 'small'),
    KEEP('Un procédé simple et sans broyage : récolter, nettoyer, cintrer, sécher, assembler.', 1112, 950, 496)
  ], { notes: 'Photos des étapes : idéalement les vôtres. L\'étape 4 reste à écrire.' }));

  // 7 · B Story : plateforme
  P.push(PAGE('c5', '7 · B Story', 'Mission, vision, valeurs', [
    T('Mission', 72, 110, 400, 'label'),
    T('Donner une seconde vie au sarment de vigne en le transformant, <mark class="sel">sans le broyer ni le brûler</mark>, en luminaires artisanaux qui racontent le domaine d\'où ils viennent.', 72, 146, 1340, 'lead', { fs: 46, lh: 1.18 }),
    T('Vision', 72, 420, 400, 'label'),
    T('Faire du sarment une matière reconnue du design d\'intérieur.', 72, 454, 1000, 'lead', { fs: 28 }),
    LINE(72, 580, 1536, 1.5, C.ink),
    ...[['Authenticité de la matière', 'La technique de fabrication reste visible et assumée plutôt que dissimulée derrière un fini industriel.'],
      ['Traçabilité', 'Chaque pièce est reliée à un domaine, un cépage et une période de récolte identifiables.'],
      ['Ancrage territorial', 'La marque s\'inscrit dans l\'économie viticole réelle de la Nouvelle-Aquitaine.'],
      ['Équité', 'La matière des vignerons partenaires est reconnue et valorisée, pas traitée comme une ressource gratuite et invisible.']]
      .flatMap(([t, d], i) => [T(String(i + 1).padStart(2, '0'), C4[i], 612, 100, 'label', { col: C.handle }), T(t, C4[i], 640, 366, 'h3'), T(d, C4[i], 700, 366, 'body')]),
    T('Objectifs : à court terme, se concentrer sur le pied de lampe (une typologie, un savoir-faire, un cycle de production) ; à long terme, étendre la marque au petit mobilier et aux accessoires de décoration.', 72, 1000, 1100, 'small')
  ], { notes: 'Mission et vision sont des propositions : à valider en groupe.' }));
  P.push(PAGE('c5', '7 · B Story', 'Positionnement & cibles', [
    TITLE('Positionnement', '& cibles', 72, 96, 760, 'h2', { fs: 72 }),
    T('Pour les amateurs de design local en Nouvelle-Aquitaine et, à terme, les domaines viticoles, SARMENTS est l\'artisan qui transforme le sarment de vigne brut, tracé jusqu\'au domaine d\'origine, en luminaires utilitaires et décoratifs. Contrairement aux acteurs existants, qui travaillent soit d\'autres bois du vignoble (Niko & Co), soit un matériau composite coupé du geste artisanal (Les Princes Sarments, Vitis Valorem), SARMENTS conserve le sarment dans sa forme naturelle.', 72, 300, 660, 'body', { fs: 19 }),
    KEEP('Cœur de cible : les 25-45 ans qui achètent une histoire plus qu\'une lampe.', 72, 900, 660),
    ELL(820, 280, 720, 720, '#F4EFE6'), ELL(910, 370, 540, 540, '#E9E0D2'), ELL(1000, 460, 360, 360, '#DCCDB8'), ELL(1090, 550, 180, 180, C.sel),
    T('<b>Périphérique</b><br>prescripteurs & relais', 980, 300, 400, 'small', { al: 'center', anim: { type: 'none' } }),
    T('<b>Secondaire</b><br>domaines & œnotourisme (B2B)', 980, 390, 400, 'small', { al: 'center', anim: { type: 'none' } }),
    T('<b>Principale</b><br>œnophiles & œnotouristes', 980, 478, 400, 'small', { al: 'center', anim: { type: 'none' } }),
    T('<b>Cœur</b><br>éco-design lovers', 1080, 612, 200, 'small', { al: 'center', anim: { type: 'none' } }),
    T('Personas : Camille (cœur), Laurent (principale), Sophie (secondaire)', 852, 1040, 756, 'caption', { al: 'center' })
  ]));
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
  const sw = (t, col, items, x, y) => [T(t, x, y, 500, 'h3', { col, fs: 26 }), T(LI(items.map(s => '• ' + s)), x, y + 52, 700, 'body')];
  P.push(PAGE('c5', '7 · B Story', 'SWOT', [
    T('<mark class="sel">SWOT</mark>', 72, 96, 500, 'h2'),
    KEEP('Une matière gratuite et un récit fort ; les défis sont la technique et l\'approvisionnement.', 852, 110, 756),
    R(839, 320, 2, 780, C.ink), R(72, 709, 1536, 2, C.ink),
    ...sw('Forces', C.green, ['Matière gratuite ou peu coûteuse', 'Ancrage territorial fort', 'Technique accessible en autodidacte (vannerie)', 'Storytelling puissant autour du patrimoine viticole', 'Sarment conservé entier : une matière reconnaissable'], 72, 340),
    ...sw('Faiblesses', C.brown, ['Difficile à standardiser et à industrialiser', 'Traitement du bois exigeant', 'Savoir-faire à acquérir ou à externaliser', 'Production lente (3 à 6 mois de séchage)', 'Marque inconnue au lancement'], 880, 340),
    ...sw('Opportunités', C.green, ['Peu de concurrence directe sur le luminaire en sarment brut en Nouvelle-Aquitaine', 'Dynamique réglementaire favorable à l\'économie circulaire viticole', 'Marché de l\'upcycling en croissance', 'Luminaire haut de gamme : +7,7 % par an'], 72, 736),
    ...sw('Menaces', C.brown, ['Acteurs mieux financés (Les Princes Sarments) qui pourraient élargir leur gamme', 'Dépendance à la bonne volonté des domaines', 'Récolte saisonnière (novembre à mars)', 'Arrachages liés à la crise viticole'], 880, 736)
  ]));
  P.push(PAGE('c5', '7 · B Story', 'Mix marketing', [
    TITLE('Mix', 'marketing'),
    ...[['Produit', 'Lampe à poser, pied en sarment entier cintré, abat-jour en lin ou en papier. Pièces numérotées avec étiquette de traçabilité. Gamme de lancement courte : 2 ou 3 modèles.'],
      ['Prix', '120 à 250 € (Camille se méfie sous 80 € et hésite au-delà de 250 €). Pièce signature au-delà de 300 €. B2B sur devis.'],
      ['Distribution', 'Boutique en ligne, concept-stores bordelais, boutiques des domaines partenaires, marchés de créateurs, salons.'],
      ['Communication', 'Instagram (du rang de vigne à la lampe), QR code de traçabilité, portes ouvertes pendant la taille, presse déco, co-branding avec les domaines.']]
      .flatMap(([t, d], i) => [T(t, C4[i], 380, 366, 'h3', { box: 'rule' }), T(d, C4[i], 440, 366, 'body')]),
    KEEP('Une lampe unique à 120-250 €, vendue là où Camille et Sophie achètent déjà.', 72, 940, 900)
  ], { notes: 'Proposition cohérente avec vos notes : à valider en groupe.' }));
  P.push(PAGE('c5', '7 · B Story', 'Le nom', [
    TITLE('Le nom', 'Sarments', 72, 96, 900),
    T('Pourquoi ce nom : à compléter (la matière nommée telle quelle, le pluriel, la sonorité…).', 72, 400, 700, 'lead', { fs: 28 }),
    T('Pistes écartées', 852, 400, 756, 'h3', { box: 'rule' }),
    T('À compléter : 3 à 5 noms testés et la raison de leur abandon.', 852, 460, 756, 'body'),
    KEEP('Un nom qui nomme la matière telle qu\'elle est : à affiner.', 72, 900, 700)
  ], { notes: 'Page naming : à remplir quand le naming sera finalisé.' }));

  // 8 · Fun and Games : recherches
  P.push(opener('c6', '8 · Fun and Games', '06', 'Recherches', 'graphiques', 'Trois pistes · Moodboards · Typographie · Couleurs · Axes 1 à 3 · Axe final',
    [I('mb3', 0, 0, 1680, 1188, { lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.58, lock: true })],
    { bg: C.dark, numCol: '#FFFFFF' }));
  const axes = [
    ['Géométrie', 'vivante', 'mb1', 'Prendre l\'irrégularité du sarment comme une signature visuelle : nœuds, écorce, courbes, veinures, strates.', 'nœuds · écorce · courbes · veinures · strates'],
    ['La main', 'à l\'œuvre', 'mb2', 'Le design devient la traduction de la main qui fabrique : outils, assemblages, textures, imperfections, répétitions.', 'outils · assemblages · textures · imperfections · répétitions'],
    ['Ombre', '& lumière', 'mb3', 'Ce n\'est plus seulement le sarment qui est montré : c\'est la lumière qui révèle sa présence, par les ombres projetées et les motifs.', 'projection · révélation · contraste · chaleur · motif']];
  P.push(PAGE('c6', '8 · Fun and Games', 'Trois pistes', [
    TITLE('Trois', 'pistes'),
    ...axes.flatMap(([a, b, mb, intent], i) => {
      const x = [cx(1), cx(5), cx(9)][i];
      return [I(mb, x, 330, 496, 351), T(`Axe ${i + 1}`, x, 704, 200, 'label'), T(`${a} ${b}`, x, 730, 496, 'h3', { fs: 28, up: false }), T(intent, x, 782, 496, 'body')];
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
    P.push(PAGE('c6', '8 · Fun and Games', `Moodboard ${i + 1}`, [
      I(mb, 72, 96, 1040, 736),
      T(`Moodboard ${i + 1} · Axe ${i + 1}`, 1172, 96, 436, 'label'),
      T(`${a} ${b}`, 1172, 124, 436, 'h2', { fs: 54 }),
      T(kw, 1172, 290, 436, 'label', { fs: 12 }),
      ...pal.flatMap(([hex, n], j) => [R(1172 + j * 74, 360, 64, 64, hex, { anim: { type: 'none' } }), T(n, 1172 + j * 74, 432, 70, 'caption', { fs: 10, anim: { type: 'none' } })]),
      T(txt, 1172, 520, 436, 'body'),
      KEEP(keep, 1172, 900, 436),
      T('Références réunies pour l\'axe ' + (i + 1) + '. Palette extraite des images.', 72, 852, 1040, 'caption')
    ]));
  });
  P.push(PAGE('c6', '8 · Fun and Games', 'Recherches typographiques', [
    TITLE('Recherches', 'typographiques', 72, 96, 1000),
    ...[['Piste 1 · Serif organique', { it: true }, 'Inspiration : « SAGE GLOW » (moodboard 1). À tester : une serif aux formes végétales.'],
      ['Piste 2 · Serif contrastée', { fw: 600 }, 'Inspirations : « Angle Violin », « Die Jelk » (moodboard 2) : contraste fort et ligatures.'],
      ['Piste 3 · Linéale', { ff: 'sans' }, 'Inspiration : les ombres typographiques du moodboard 3.']]
      .flatMap(([t, o, d], i) => {
        const x = [cx(1), cx(5), cx(9)][i];
        return [T(t, x, 360, 496, 'label'), T('Aa', x, 392, 496, 'num', { fs: 170, ...o }), T('Sarments · matière, geste, lumière', x, 600, 496, 'lead', o), T(d, x, 680, 440, 'small')];
      }),
    KEEP('À compléter : la piste retenue et pourquoi.', 72, 960, 700)
  ], { notes: 'Remplace les « Aa » par vos vrais essais (captures ou textes dans la police choisie).' }));
  P.push(PAGE('c6', '8 · Fun and Games', 'Recherches chromatiques', [
    TITLE('Recherches', 'chromatiques', 72, 96, 1000),
    ...mbData.flatMap(([, pal], r) => {
      const y = 330 + r * 250;
      return [T(`Axe ${r + 1} · ${axes[r][0]} ${axes[r][1]}`, 72, y + 20, 300, 'h3', { fs: 20, up: false }),
        ...pal.flatMap(([hex, n], j) => [R(400 + j * 200, y, 180, 150, hex), T(`${n} · ${hex}`, 400 + j * 200, y + 162, 190, 'caption', { anim: { type: 'none' } })])];
    })
  ]));
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
    T('Axe final', 72, 96, 300, 'label'),
    FRAME('Logo final', 72, 150, 1000, 800),
    T('<p>La ligne du sarment,</p><p><mark class="sel">révélée par la lumière</mark></p>', 1112, 150, 496, 'h2', { fs: 46 }),
    T('La ligne vivante du sarment (axe 1) révélée par la lumière (axe 3), avec la trace de la main (axe 2) dans les textures et l\'étiquette. Proposition à valider.', 1112, 360, 496, 'body'),
    KEEP('La réponse graphique à la problématique, en une image.', 1112, 900, 496)
  ], { notes: 'Ce n\'est qu\'une proposition de synthèse : c\'est à vous de décider quel axe l\'emporte.' }));

  // 13 · Break into Three : charte
  P.push(opener('c7', '13 · Break into Three', '07', 'Charte', 'graphique', 'Logo · Typographies · Couleurs · Motifs & photographie · Règles d\'usage',
    [I('sarment', 760, 180, 860, 296, { fit: 'contain', r: -10, anim: { type: 'zoom' } })], { bg: C.dark }));
  P.push(PAGE('c7', '13 · Break into Three', 'Le logo', [
    TITLE('Le', 'logo'),
    FRAME('Logo principal', 72, 330, 980, 620), FRAME('Version réduite', 1112, 330, 496, 290), FRAME('Zone de protection', 1112, 660, 496, 290),
    T('Construction, version monochrome, taille minimale : à compléter.', 72, 990, 900, 'small')
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Typographies', [
    TITLE('Les', 'typographies'),
    T('Aa', 72, 300, 420, 'num', { fs: 240 }),
    T('Crimson Pro : titres et texte courant', 540, 330, 1000, 'lead'),
    T('ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 € % « » ’ — …', 540, 400, 1068, 'lead', { fs: 26 }),
    LINE(72, 650, 1536, 1, C.line),
    T('Titre de page', 72, 690, 760, 'h2', { fs: 56 }),
    T('Intertitre', 72, 780, 500, 'h3'),
    T('Texte courant : la hiérarchie du dossier, du titre à la légende, en six niveaux.', 72, 820, 700, 'body'),
    T('Légende · source · folio', 72, 900, 500, 'caption'),
    T('À remplacer par la typographie de l\'axe final.', 852, 690, 756, 'small', { col: C.muted })
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Couleurs', [
    TITLE('Les', 'couleurs'),
    ...[[C.ink, 'Encre', 'Texte, logo'], [C.sel, 'Sélection', 'Surlignage, À retenir'], [C.handle, 'Poignée', 'Accent, détails'], [C.green, 'Vigne', 'Graphiques, nature'], [C.kraft, 'Kraft', 'Packaging, étiquette']]
      .flatMap(([hex, n, u], i) => [R(72 + i * 312, 330, 288, 420, hex), T(n, 72 + i * 312, 770, 288, 'h3', { fs: 20 }), T(`${hex}<br>${u}`, 72 + i * 312, 810, 288, 'small')]),
    T('Palette provisoire, à remplacer par celle de l\'axe final.', 72, 1000, 900, 'small', { col: C.muted })
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Motifs & photographie', [
    TITLE('Motifs &', 'photographie'),
    FRAME('Motif 1', 72, 330, 366, 366), FRAME('Motif 2', 462, 330, 366, 366),
    FRAME('Direction photo : lumière rasante, matière en gros plan', 852, 330, 756, 740),
    T('Les motifs viennent de la matière (cernes, nœuds, vrilles) ; la photographie montre le sarment dans la lumière.', 72, 730, 756, 'body')
  ]));
  P.push(PAGE('c7', '13 · Break into Three', 'Règles d\'usage', [
    TITLE('Règles', 'd\'usage'),
    T('À faire', 72, 330, 756, 'h3', { box: 'rule', col: C.green }), FRAME('Bon usage 1', 72, 400, 366, 300), FRAME('Bon usage 2', 462, 400, 366, 300),
    T('À éviter', 852, 330, 756, 'h3', { box: 'rule', col: C.brown }), FRAME('Mauvais usage 1', 852, 400, 366, 300), FRAME('Mauvais usage 2', 1242, 400, 366, 300),
    T('Une ligne d\'explication sous chaque exemple.', 72, 740, 900, 'small')
  ]));

  // 14 · Finale : déclinaisons
  P.push(opener('c8', '14 · Finale', '08', 'Les', 'déclinaisons', 'Étiquette de traçabilité · Packaging · Site & réseaux · Boutique & salon',
    [I('fagots', 0, 0, 1680, 1188, { gray: true, lock: true, anim: { type: 'zoom' } }), R(0, 0, 1680, 1188, '#000000', { o: 0.55, lock: true })],
    { bg: C.dark, numCol: '#FFFFFF' }));
  const decl = (name, title, a, b, phs, text, keep) => PAGE('c8', '14 · Finale', name, [
    TITLE(a, b), ...phs, T(title, 1112, 330, 496, 'h3', { box: 'rule' }), T(text, 1112, 390, 496, 'body'), KEEP(keep, 1112, 900, 496)]);
  P.push(decl('Étiquette de traçabilité', 'L\'étiquette', 'L\'étiquette de', 'traçabilité',
    [FRAME('Mockup étiquette : domaine, cépage, saison de taille, QR code', 72, 330, 1000, 760)],
    'Chaque pied de lampe porte le nom de son domaine, son cépage et sa saison de taille. Un QR code renvoie à l\'histoire de la pièce.', 'La traçabilité, rendue visible et tangible.'));
  P.push(decl('Packaging', 'Le packaging', 'Le', 'packaging',
    [FRAME('Mockup packaging fermé', 72, 330, 490, 760), FRAME('Mockup packaging ouvert', 586, 330, 486, 760)],
    'À compléter : matériaux, format, ouverture, message à l\'intérieur.', 'À compléter : ce que le packaging raconte.'));
  P.push(decl('Site & réseaux', 'Site & réseaux', 'Site &', 'réseaux',
    [FRAME('Maquette du site (ordinateur)', 72, 330, 640, 760), FRAME('Post Instagram', 736, 330, 336, 336), FRAME('Vidéo making-of : insère un MP4 avec l\'outil Vidéo', 736, 690, 336, 400)],
    'Instagram raconte le parcours du rang de vigne à la lampe ; le site relie chaque pièce à son domaine.', 'Du rang de vigne à la lampe, en images.'));
  P.push(decl('Boutique & salon', 'En situation', 'Boutique', '& salon',
    [FRAME('Mise en situation : boutique de domaine', 72, 330, 1000, 360), FRAME('Stand de salon', 72, 714, 488, 376), FRAME('Chambre d\'hôtes', 584, 714, 488, 376)],
    'La lampe dans les lieux où Camille, Laurent et Sophie la rencontrent.', 'À compléter : l\'objet dans son contexte.'));

  // 15 · Final Image : conclusion & sources
  P.push(PAGE('c9', '15 · Final Image', 'Conclusion', [
    T('Conclusion', 72, 110, 400, 'label'),
    T('Comment le design peut-il transformer les <mark class="sel">irrégularités naturelles</mark> du sarment de vigne, aujourd\'hui brûlé ou broyé, en qualités esthétiques et fonctionnelles pour créer un <mark class="sel">luminaire artisanal contemporain</mark> ?', 72, 150, 700, 'lead', { fs: 30 }),
    T('Notre réponse : à rédiger (3 à 5 lignes qui reprennent la problématique et montrent comment l\'identité y répond).', 72, 520, 700, 'lead', { fs: 26 }),
    KEEP('Bilan et ouverture : à compléter.', 72, 900, 700),
    FRAME('Image finale : la lampe allumée, son ombre au mur', 852, 0, 828, 1188, { lock: true })
  ], { notes: 'Final Image : reprends la problématique mot pour mot et réponds-y.' }));
  P.push(PAGE('c9', '15 · Final Image', 'Sources', [
    T('Sources', 72, 96, 760, 'h2'),
    T('Chiffres & études', 72, 300, 756, 'h3', { box: 'rule' }),
    T(LI(['• F.G.V.B. (Fédération des Grands Vins de Bordeaux) : chiffres de la ressource.', '• Syndicat du luminaire, via Lightzoomlumière : marché français.', '• Étude du marché mondial du luminaire haut de gamme (20,26 Md$, 2024) : nommer l\'éditeur.', '• Circulaire du 18 novembre 2011 relative au brûlage des déchets verts.', '• ADEME, appel à projets Agr\'air.', '• Association environnementale à l\'origine du calcul « 130 000 voitures » : à nommer.']), 72, 360, 756, 'body'),
    T('Sites & entreprises', 852, 300, 756, 'h3', { box: 'rule' }),
    T(LI(['• Toutlevin.com, « La surprenante seconde vie de la vigne et du raisin ».', '• Les Princes Sarments, lesprincessarments.fr.', '• Vitis Valorem.', '• Niko & Co.', '• Market Set (à vérifier).']), 852, 360, 756, 'body'),
    T('Format : organisme ou auteur, titre, date, lien.', 72, 1060, 900, 'caption')
  ]));

  const pages = P;
  return {
    meta: { title: 'Dossier SARMENTS', brand: 'Sarments', order: pages.map(p => p.id), v: 1, createdAt: Date.now() },
    pages
  };
}

/* ---------------------------------------------------------------- galerie « Nouvelle page » */
const LAYOUTS = [
  { key: 'vierge', name: 'Page vierge', build: () => [] },
  { key: 'titre-texte', name: 'Titre + texte', build: () => [
    TITLE('Titre de', 'la page'), T('Chapeau : deux ou trois lignes qui résument la page.', 852, 120, 756, 'lead'),
    T('Texte courant. Double-clique pour écrire.', 72, 380, 626, 'body'), T('Deuxième colonne de texte.', 852, 380, 626, 'body'),
    KEEP('À retenir : une phrase qui résume la page.', 72, 920, 700)] },
  { key: 'texte-image', name: 'Texte + image', build: () => [
    TITLE('Titre de', 'la page'), T('Texte courant. Double-clique pour écrire.', 72, 380, 626, 'body'),
    KEEP('À retenir : une phrase qui résume la page.', 72, 920, 700), FRAME('Glisse une photo ici', 852, 0, 828, 1188)] },
  { key: 'image-texte', name: 'Image + texte', build: () => [
    FRAME('Glisse une photo ici', 0, 0, 780, 1188), T('Intertitre', 852, 110, 660, 'h3'), T('Texte courant. Double-clique pour écrire.', 852, 170, 660, 'body'),
    KEEP('À retenir : une phrase qui résume la page.', 852, 920, 660)] },
  { key: 'pleine', name: 'Image pleine page', bg: C.dark, build: () => [
    FRAME('Glisse une photo ici', 0, 0, 1680, 1188, { lock: true }), R(0, 640, 1680, 548, '#000000', { o: 0.35, lock: true }),
    TITLE('Grand', 'titre', 72, 760, 1200, 'h1')] },
  { key: 'deux-images', name: 'Deux images', build: () => [
    TITLE('Titre de', 'la page'), FRAME('Photo 1', 72, 330, 756, 640), FRAME('Photo 2', 852, 330, 756, 640),
    T('Légende de la photo 1', 72, 984, 756, 'caption'), T('Légende de la photo 2', 852, 984, 756, 'caption')] },
  { key: 'quatre', name: 'Quatre colonnes', build: () => [
    T('Intertitre', 72, 110, 900, 'h3'), T('Chapeau : ce que montrent les quatre colonnes.', 72, 156, 1000, 'lead'),
    ...[0, 1, 2, 3].flatMap(i => [FRAME('Photo', cx(1 + 3 * i), 330, 366, 290), T('Titre ' + (i + 1), cx(1 + 3 * i), 648, 366, 'h3', { fs: 20 }), T('Texte court.', cx(1 + 3 * i), 692, 366, 'small')]),
    KEEP('À retenir : une phrase qui résume la page.', 72, 960, 700)] },
  { key: 'citation', name: 'Grande citation', bg: C.dark, build: () => [
    T('« Une phrase forte, en grand. »', 72, 380, 1400, 'quote', { fs: 84 }), T('Auteur ou source', 80, 780, 600, 'label')] },
  { key: 'chiffres', name: 'Chiffres clés', build: () => [
    TITLE('Chiffres', 'clés'), ...[0, 1, 2].flatMap(i => [T('00 %', [cx(1), cx(5), cx(9)][i], 420, 496, 'num'), T('Ce que mesure ce chiffre, et sa source.', [cx(1), cx(5), cx(9)][i], 560, 440, 'small')]),
    KEEP('À retenir : ce que disent ces chiffres.', 72, 920, 700)] },
  { key: 'intercalaire', name: 'Ouverture de partie', build: () => [
    FRAME('Photo de la partie', 840, 0, 840, 1188, { lock: true }), T('00', 72, 540, 300, 'num', { fs: 96, col: C.handle }),
    TITLE('Titre', 'de la partie', 72, 680, 740, 'h1'), T('Sous-partie · Sous-partie · Sous-partie', 80, 1010, 700, 'label')] },
  { key: 'moodboard', name: 'Moodboard', build: () => [
    FRAME('Image', 72, 96, 620, 470), FRAME('Image', 716, 96, 400, 470), FRAME('Image', 1140, 96, 468, 700), FRAME('Image', 72, 590, 300, 502),
    FRAME('Image', 396, 590, 720, 502), FRAME('Image', 1140, 820, 468, 272)] },
  { key: 'persona', name: 'Persona', build: () => persona({ tag: 'Cible', name: 'Prénom Nom', meta: 'Âge · métier · lieu', quote: 'Sa phrase qui résume tout.',
    fields: [['Situation', '…'], ['Style de vie', '…'], ['Motivations', '…'], ['Freins', '…'], ['Parcours', '…'], ['Canaux', '…']], brings: 'Ce que la marque lui apporte.' }).els },
  { key: 'fiche', name: 'Fiche concurrent', build: () => fiche({ short: 'Concurrent', type: 'Type de concurrent', name: 'Nom', place: 'Lieu', pos: '…', cible: '…', prix: '…', canaux: '…', force: '…', faiblesse: '…', retenir: 'Ce qu\'on en retient.' }).els },
  { key: 'process', name: 'Process en 5 étapes', build: () => [
    TITLE('Titre du', 'process', 72, 96, 1000),
    ...[0, 1, 2, 3, 4].flatMap(i => { const x = 72 + i * 312; return [FRAME('Photo', x, 330, 288, 300), T(String(i + 1).padStart(2, '0'), x, 652, 120, 'num', { fs: 44, col: C.handle }), T('Étape', x, 712, 288, 'h3', { fs: 19 }), T('Description courte.', x, 754, 288, 'small')]; })] },
  { key: 'galerie', name: 'Recherches (6 cadres)', build: () => [
    T('Recherches', 72, 96, 600, 'label'), T('Titre', 72, 124, 1000, 'h2', { fs: 56 }),
    ...[0, 1, 2, 3, 4, 5].map(i => FRAME('Croquis ' + (i + 1), [cx(1), cx(5), cx(9)][i % 3], i < 3 ? 260 : 680, 496, 396))] },
  { key: 'mockup', name: 'Mise en situation', build: () => [
    FRAME('Mockup', 72, 72, 980, 1044), T('Intertitre', 1112, 110, 496, 'h3', { box: 'rule' }), T('Ce que montre la mise en situation.', 1112, 170, 496, 'body'),
    KEEP('À retenir : une phrase.', 1112, 920, 496)] }
];
