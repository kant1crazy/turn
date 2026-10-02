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
  ink: '#1D1D1F', paper: '#FFFFFF', sel: '#BCDBEF', handle: '#0087F0', blue: '#0B6FC7', green: '#4D5D43',
  brown: '#7A4B2A', kraft: '#C9A27E', warm: '#F4EFE6', sand: '#E7DCCB', muted: '#6E6E73', sub: '#6E6E73',
  line: '#E1DFDA', hair: '#E1DFDA', card: '#F4F4F1', cardBlue: '#E8F1FB', cardGreen: '#EDF1E9', cardBrown: '#F5EEE7',
  dark: '#121212', darkCard: '#1E1E20', darkHair: '#2F2F31', white: '#FFFFFF', grey: '#8C8780'
};
const SWATCHES = ['#1D1D1F', '#FFFFFF', '#F4F4F1', '#E8F1FB', '#BCDBEF', '#0087F0', '#4D5D43', '#EDF1E9', '#7A4B2A', '#F5EEE7', '#C9A27E', '#6E6E73', '#121212', '#1E1E20'];

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
    css: 'Crimson Pro', pdf: 'CrimsonPro', asc: 918 / 1024, desc: 220 / 1024,
    files: { n4: 'CrimsonPro-Regular', n6: 'CrimsonPro-SemiBold', i4: 'CrimsonPro-Italic', i6: 'CrimsonPro-SemiBoldItalic' }
  },
  sans: {
    css: 'Instrument Sans', pdf: 'InstrumentSans', asc: 970 / 1000, desc: 250 / 1000,
    files: { n4: 'InstrumentSans-Regular', n6: 'InstrumentSans-SemiBold' }
  }
};
const STACK = {
  serif: "'Crimson Pro', 'Instrument Sans', Georgia, serif",
  sans: "'Instrument Sans', 'Crimson Pro', system-ui, sans-serif"
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
  return /instrument/i.test((ff || '').split(',')[0]) ? 'sans' : 'serif';
}

/* ---------------------------------------------------------------- styles typographiques
   Tailles en px de page (4 px = 1 mm ; 1 px ≈ 0,71 pt). */
const STYLES = {
  cover:   { label: 'Titre de couverture', ff: 'serif', fs: 176, lh: 0.95, ls: 0.01, fw: 400, up: true },
  h1:      { label: 'Titre de section', ff: 'serif', fs: 124, lh: 0.97, ls: -0.015, fw: 400 },
  h2:      { label: 'Titre de page', ff: 'serif', fs: 76, lh: 1.03, ls: -0.01, fw: 400 },
  h3:      { label: 'Intertitre', ff: 'sans', fs: 21, lh: 1.3, ls: -0.005, fw: 600 },
  lead:    { label: 'Chapeau', ff: 'serif', fs: 30, lh: 1.3, ls: 0, fw: 400 },
  body:    { label: 'Texte courant', ff: 'sans', fs: 16.5, lh: 1.6, ls: 0, fw: 400 },
  small:   { label: 'Texte secondaire', ff: 'sans', fs: 14.5, lh: 1.55, ls: 0, fw: 400, tone: 'sub' },
  eyebrow: { label: 'Surtitre', ff: 'sans', fs: 13, lh: 1.3, ls: 0.12, fw: 600, up: true, tone: 'blue' },
  label:   { label: 'Étiquette', ff: 'sans', fs: 12.5, lh: 1.3, ls: 0.12, fw: 600, up: true, tone: 'sub' },
  sanslab: { label: 'Étiquette foncée', ff: 'sans', fs: 12.5, lh: 1.3, ls: 0.12, fw: 600, up: true },
  num:     { label: 'Chiffre clé', ff: 'sans', fs: 104, lh: 0.95, ls: -0.035, fw: 600 },
  quote:   { label: 'Citation', ff: 'serif', fs: 44, lh: 1.2, ls: 0, fw: 400, it: true },
  card:    { label: 'Carte', ff: 'sans', fs: 16, lh: 1.55, ls: 0, fw: 400, box: 'fill', bg: '#F4F4F1', rad: 28, pad: [32, 34] },
  keep:    { label: 'À retenir', ff: 'serif', fs: 22, lh: 1.32, ls: 0, fw: 600, box: 'fill', bg: '#E8F1FB', rad: 24, pad: [24, 30] },
  caption: { label: 'Légende', ff: 'sans', fs: 12.5, lh: 1.45, ls: 0, fw: 400, tone: 'sub' }
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
  const els = (p.els || []).map(e => { const o = { ...e }; delete o.id; delete o._h; return o; });
  const s = stableJSON([p.chapter, p.beat, p.name, p.bg, p.chrome, p.notes || '', els]);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + '.' + s.length.toString(36);
}
