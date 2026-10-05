'use strict';
/* ==========================================================================
   SARMENTS · éditeur de dossier — cœur
   Page A3 paysage : 420 × 297 mm, rendue à 4 px par mm (1680 × 1188 px).
   ========================================================================== */
const PW = 1680, PH = 1188, PXMM = 4;
const ML = 72, MR = 72, MT = 72, MB = 72, COLS = 12, GUT = 24;
const COLW = (PW - ML - MR - GUT * (COLS - 1)) / COLS; // 106 px
const cx = c => ML + (c - 1) * (COLW + GUT);           // x de la colonne c (1 à 12)
const cw = n => n * COLW + (n - 1) * GUT;              // largeur de n colonnes
const PT_PER_PX = 0.25 * 72 / 25.4;                    // 1 px de page = 0,7087 pt

const C = {
  ink: '#0E0E0E', paper: '#FFFFFF', sel: '#C9D5F7', handle: '#1D45D8', blue: '#1D45D8', green: '#4D5D43',
  brown: '#7A4B2A', kraft: '#C9A27E', warm: '#F4EFE6', sand: '#E7DCCB', muted: '#6B6B6B', sub: '#6B6B6B',
  line: '#DADADA', hair: '#DADADA', card: '#F2F2F0', cardBlue: '#E4EAFB', cardGreen: '#EDF1E9', cardBrown: '#F5EEE7',
  dark: '#0B0B0B', darkCard: '#1A1A1A', darkHair: '#2A2A2A', white: '#FFFFFF', grey: '#8C8C8C', warn: '#D9480F'
};
/* Fond bleu cobalt : traité comme un fond sombre, mais avec ses propres teintes secondaires. */
function isBlue(hex) {
  const [r, g, b] = hexToRgb(hex || '#ffffff');
  return b > 150 && b > r + 70 && b > g + 50;
}
const SWATCHES = ['#0E0E0E', '#FFFFFF', '#1D45D8', '#C9D5F7', '#E4EAFB', '#F2F2F0', '#6B6B6B', '#4D5D43', '#7A4B2A', '#C9A27E', '#D9480F', '#0B0B0B'];

const NB = ' ';
function typo(s) {
  if (!s) return s;
  return s.replace(/'/g, '’')
    .replace(/ ([:;?!%»])/g, NB + '$1')
    .replace(/« /g, '«' + NB)
    .replace(/(\d) (\d{3})\b/g, '$1' + NB + '$2');
}

const uid = (p = 'e') => p + Math.random().toString(36).slice(2, 8) + (Date.now() % 1679616).toString(36);
const clone = o => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return [20, 20, 20];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function cssColorToRgba(s) {
  if (!s) return null;
  if (s[0] === '#') { const [r, g, b] = hexToRgb(s); return [r, g, b, 1]; }
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}
function isDark(hex) {
  const [r, g, b] = hexToRgb(hex || '#ffffff');
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
}

/* ---------------------------------------------------------------- polices
   Crimson Pro (proche de la Minion du dossier) et Instrument Sans, embarquées
   pour que l'écran et le PDF utilisent exactement les mêmes fichiers. */
const FAM = {
  serif: {
    css: 'DocSerif', pdf: 'DocSerif', asc: 0.9, ascK: {}, chK: {},
    // la Minion (privée) si elle est embarquée ; sinon Crimson Pro, très proche. Gras et italique : Crimson Pro.
    files: { n4: FONTDATA['MinionPro-Regular'] ? 'MinionPro-Regular' : 'CrimsonPro-Regular', n6: 'CrimsonPro-SemiBold', i4: 'CrimsonPro-Italic', i6: 'CrimsonPro-SemiBoldItalic' }
  },
  sans: {
    css: 'DocSans', pdf: 'DocSans', asc: 0.97, ascK: {}, chK: {},
    files: { n4: 'InterTight-Regular', n6: 'InterTight-Bold' }
  },
  light: {
    css: 'DocLight', pdf: 'DocLight', asc: 0.97, ascK: {}, chK: {},
    files: { n4: 'InterTight-Light' }
  },
  ui: {
    css: 'Instrument Sans', pdf: 'InstrumentSans', asc: 0.97, ascK: {}, chK: {},
    files: { n4: 'InstrumentSans-Regular', n6: 'InstrumentSans-SemiBold' }
  }
};
const STACK = {
  serif: "'DocSerif', 'DocSans', Georgia, serif",
  sans: "'DocSans', 'DocSerif', system-ui, sans-serif",
  light: "'DocLight', 'DocSans', system-ui, sans-serif"
};
function b64ToBytes(b64) {
  const bin = atob(b64), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function loadFonts() {
  const jobs = [];
  for (const fam of Object.values(FAM)) {
    for (const [key, file] of Object.entries(fam.files)) {
      if (!FONTDATA[file]) continue;
      const ff = new FontFace(fam.css, b64ToBytes(FONTDATA[file]), {
        weight: key[1] === '6' ? '600' : '400', style: key[0] === 'i' ? 'italic' : 'normal', display: 'block'
      });
      document.fonts.add(ff);
      jobs.push(ff.load().catch(() => null));
    }
  }
  await Promise.all(jobs);
  measureAscents();
}
/* Hauteur d'ascendante réellement utilisée par le navigateur, pour poser
   les lignes de base du PDF exactement comme à l'écran. */
function measureAscents() {
  for (const F of Object.values(FAM)) {
    for (const key of Object.keys(F.files)) {
      if (!FONTDATA[F.files[key]]) continue;
      const box = document.createElement('div');
      box.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;line-height:1;font-size:200px;font-family:'${F.css}';font-weight:${key[1] === '6' ? 600 : 400};font-style:${key[0] === 'i' ? 'italic' : 'normal'}`;
      const t = document.createTextNode('H');
      const mk = document.createElement('span');
      mk.style.cssText = 'display:inline-block;width:1px;height:0;vertical-align:baseline';
      box.append(t, mk);
      document.body.append(box);
      const r = document.createRange();
      r.setStart(t, 0); r.setEnd(t, 1);
      const rc = r.getClientRects()[0], base = mk.getBoundingClientRect().bottom;
      if (rc && rc.height) { F.ascK[key] = (base - rc.top) / 200; F.chK[key] = rc.height / 200; }
      box.remove();
    }
    if (F.ascK.n4) F.asc = F.ascK.n4;
  }
  if (FAM.serif.chK.n4) document.documentElement.style.setProperty('--doc-ch', FAM.serif.chK.n4.toFixed(4) + 'em');
}
const COVER = {};
function covers(file, cp) {
  let set = COVER[file];
  if (!set) {
    set = COVER[file] = new Set();
    for (const [a, b] of (FONTCOV[file] || [])) for (let c = a; c <= b; c++) set.add(c);
  }
  return set.has(cp);
}
function famKeyFromCss(ff) {
  const f = (ff || '').split(',')[0];
  if (/docsans/i.test(f)) return 'sans';
  if (/doclight/i.test(f)) return 'light';
  if (/instrument/i.test(f)) return 'ui';
  return 'serif';
}

/* ---------------------------------------------------------------- styles typographiques
   Tailles en px de page (4 px = 1 mm ; 1 px ≈ 0,71 pt). */
const STYLES = {
  cover:   { label: 'Titre de couverture', ff: 'sans', fs: 236, lh: 0.86, ls: -0.04, fw: 600, up: true },
  h1:      { label: 'Titre de section', ff: 'sans', fs: 176, lh: 0.86, ls: -0.035, fw: 600, up: true },
  h2:      { label: 'Titre de page', ff: 'sans', fs: 128, lh: 0.88, ls: -0.03, fw: 600, up: true },
  h3:      { label: 'Intertitre', ff: 'sans', fs: 26, lh: 1.15, ls: -0.01, fw: 600 },
  lead:    { label: 'Accroche', ff: 'sans', fs: 46, lh: 1.1, ls: -0.015, fw: 400 },
  body:    { label: 'Texte courant', ff: 'serif', fs: 18, lh: 1.5, ls: 0, fw: 400 },
  small:   { label: 'Texte secondaire', ff: 'serif', fs: 15.5, lh: 1.45, ls: 0, fw: 400, tone: 'sub' },
  eyebrow: { label: 'Surtitre', ff: 'sans', fs: 13, lh: 1.3, ls: 0.06, fw: 600, up: true, tone: 'blue' },
  label:   { label: 'Étiquette', ff: 'sans', fs: 13, lh: 1.3, ls: 0.05, fw: 400, up: true, tone: 'sub' },
  sanslab: { label: 'Étiquette foncée', ff: 'sans', fs: 13, lh: 1.3, ls: 0.05, fw: 600, up: true },
  num:     { label: 'Chiffre clé', ff: 'light', fs: 150, lh: 0.9, ls: -0.035, fw: 400, tone: 'blue' },
  quote:   { label: 'Citation', ff: 'sans', fs: 44, lh: 1.12, ls: -0.015, fw: 400 },
  card:    { label: 'Bloc', ff: 'serif', fs: 17, lh: 1.5, ls: 0, fw: 400, box: 'fill', bg: '#F2F2F0', rad: 0, pad: [32, 34] },
  keep:    { label: 'À retenir', ff: 'sans', fs: 24, lh: 1.25, ls: -0.01, fw: 400 },
  caption: { label: 'Légende', ff: 'sans', fs: 12.5, lh: 1.4, ls: 0, fw: 400, tone: 'sub' }
};
const TEXT_KEYS = ['ff', 'fs', 'lh', 'ls', 'fw', 'it', 'up', 'col', 'al', 'box', 'bg', 'pad', 'rad', 'tone'];
function textStyle(el) {
  const base = STYLES[el.st] || STYLES.body;
  const s = { ff: 'serif', fs: 18, lh: 1.5, ls: 0, fw: 400, it: false, up: false, col: null, al: 'left', box: 'none', bg: null, pad: null, rad: 0, tone: null, ...base };
  for (const k of TEXT_KEYS) if (el[k] !== undefined && el[k] !== null) s[k] = el[k];
  if (s.box === 'sel' && !s.pad) s.pad = [18, 24];
  if (s.box === 'fill' && !s.pad) s.pad = [26, 30];
  return s;
}

/* ---------------------------------------------------------------- chapitres & Save the Cat */
const CHAPTERS = [
  { id: 'ouv', name: 'Ouverture', toc: false },
  { id: 'c1', name: 'Brief & problématique', num: '01' },
  { id: 'c2', name: 'Analyse stratégique', num: '02' },
  { id: 'c3', name: 'Pourquoi maintenant', num: '03' },
  { id: 'c4', name: 'Concurrence', num: '04' },
  { id: 'c5', name: 'Concept & plateforme de marque', num: '05' },
  { id: 'c6', name: 'Recherches graphiques', num: '06' },
  { id: 'c7', name: 'Charte graphique', num: '07' },
  { id: 'c8', name: 'Déclinaisons', num: '08' },
  { id: 'c9', name: 'Conclusion & sources', num: '09' }
];
const BEATS = ['—', '1 · Opening Image', '2 · Theme Stated', '3 · Set-Up', '4 · Catalyst', '5 · Debate', '6 · Break into Two',
  '7 · B Story', '8 · Fun and Games', '9 · Midpoint', '10 · Bad Guys Close In', '11 · All Is Lost', '12 · Dark Night of the Soul',
  '13 · Break into Three', '14 · Finale', '15 · Final Image'];
function chapterOf(id) { return CHAPTERS.find(c => c.id === id) || CHAPTERS[0]; }

/* ---------------------------------------------------------------- empreinte d'une page
   Sert à savoir si une page du modèle a été modifiée (mise à jour du modèle). */
function stableJSON(v) {
  if (Array.isArray(v)) return '[' + v.map(stableJSON).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).filter(k => v[k] != null).sort().map(k => JSON.stringify(k) + ':' + stableJSON(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}
function pageSig(p) {
  const els = (p.els || []).map(e => {
    const o = { ...e };
    delete o.id; delete o._h;
    if (o.t === 'text' && o.autoH !== false) delete o.h;
    return o;
  });
  const s = stableJSON([p.chapter, p.beat, p.name, p.bg, p.chrome, p.notes || '', els]);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + '.' + s.length.toString(36);
}
