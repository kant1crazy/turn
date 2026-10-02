/* ==========================================================================
   Stockage : en ligne (capacités db + assets de la page Claude) ou, à défaut,
   dans le navigateur (IndexedDB). Même interface pour les deux.
   ========================================================================== */
const CAP = { db: null, assets: null, downloads: null, user: null };

function withTimeout(p, ms) {
  return Promise.race([Promise.resolve(p).catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);
}

async function pickBackend() {
  const cl = window.claude;
  if (cl && typeof cl.use === 'function') {
    const [db, assets, downloads, user] = await Promise.all([
      withTimeout(cl.use('db'), 9000), withTimeout(cl.use('assets'), 9000),
      withTimeout(cl.use('downloads'), 9000), withTimeout(cl.use('user'), 9000)
    ]);
    Object.assign(CAP, { db, assets, downloads, user });
    if (db) {
      let canWrite = !!assets;
      try {
        if (user && typeof user.can === 'function') {
          const c = await user.can('data.write');
          if (c === false) canWrite = false;
        }
      } catch (e) { /* on garde la valeur par défaut */ }
      return makeCloud(db, assets, canWrite);
    }
  }
  try { return await makeLocal(); } catch (e) { return makeMemory(); }
}

/* ------------------------------------------------------------ en ligne */
function makeCloud(db, assets, canWrite) {
  const be = {
    kind: 'cloud', canWrite,
    label: canWrite ? 'Enregistré en ligne' : 'Lecture seule',
    async loadAll() {
      const m = await db.doc('meta/project').get();
      const qs = await db.collection('pages').get();
      return {
        meta: m.exists ? clone(m.data()) : null,
        pages: qs.docs.filter(d => d.exists).map(d => clone(d.data()))
      };
    },
    subscribe(onMeta, onPage, onRemove) {
      try {
        db.doc('meta/project').onSnapshot(s => {
          if (s.metadata && s.metadata.hasPendingWrites) return;
          if (s.exists) onMeta(clone(s.data()));
        }, () => {});
        db.collection('pages').onSnapshot(qs => {
          for (const ch of qs.docChanges()) {
            if (ch.doc.metadata && ch.doc.metadata.hasPendingWrites) continue;
            if (ch.type === 'removed') onRemove(ch.doc.id);
            else onPage(clone(ch.doc.data()));
          }
        }, () => {});
      } catch (e) { /* les mises à jour en direct sont un bonus */ }
    },
    savePage: p => db.doc('pages/' + p.id).set(p),
    deletePage: id => db.doc('pages/' + id).delete(),
    saveMeta: m => db.doc('meta/project').set(m),
    async putBlob(blob, type) {
      if (!assets) throw { code: 'not_granted', message: 'Ajout de fichiers indisponible dans cette vue.' };
      const r = await assets.upload(blob, type ? { type } : undefined);
      return 'asset:' + r.id;
    },
    url(ref) {
      if (!ref) return '';
      if (ref.startsWith('asset:')) return '/_blob/' + ref.slice(6);
      return ref;
    }
  };
  return be;
}

/* ------------------------------------------------------------ navigateur (IndexedDB) */
function idbReq(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function makeLocal() {
  if (!window.indexedDB) throw new Error('no idb');
  const open = indexedDB.open('sarments-editeur', 1);
  open.onupgradeneeded = () => {
    const d = open.result;
    if (!d.objectStoreNames.contains('docs')) d.createObjectStore('docs');
    if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs');
  };
  const idb = await idbReq(open);
  const tx = (store, mode = 'readonly') => idb.transaction(store, mode).objectStore(store);
  const urls = {};
  // les images sont gardées en Blob : on prépare leurs adresses locales
  await new Promise((res) => {
    const cur = tx('blobs').openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c) return res();
      urls[c.key] = URL.createObjectURL(c.value);
      c.continue();
    };
    cur.onerror = () => res();
  });
  return {
    kind: 'local', canWrite: true, label: 'Enregistré dans ce navigateur',
    async loadAll() {
      const meta = await idbReq(tx('docs').get('meta'));
      const all = await idbReq(tx('docs').getAll());
      const keys = await idbReq(tx('docs').getAllKeys());
      const pages = [];
      keys.forEach((k, i) => { if (String(k).startsWith('page:')) pages.push(all[i]); });
      return { meta: meta || null, pages };
    },
    subscribe() {},
    savePage: p => idbReq(tx('docs', 'readwrite').put(p, 'page:' + p.id)),
    deletePage: id => idbReq(tx('docs', 'readwrite').delete('page:' + id)),
    saveMeta: m => idbReq(tx('docs', 'readwrite').put(m, 'meta')),
    async putBlob(blob) {
      const key = uid('b');
      await idbReq(tx('blobs', 'readwrite').put(blob, key));
      urls[key] = URL.createObjectURL(blob);
      return 'idb:' + key;
    },
    url(ref) {
      if (!ref) return '';
      if (ref.startsWith('idb:')) return urls[ref.slice(4)] || '';
      return ref;
    }
  };
}

function makeMemory() {
  const docs = {}, urls = {};
  return {
    kind: 'memory', canWrite: true, label: 'Non enregistré',
    async loadAll() { return { meta: null, pages: [] }; },
    subscribe() {},
    async savePage(p) { docs[p.id] = p; },
    async deletePage(id) { delete docs[id]; },
    async saveMeta() {},
    async putBlob(blob) { const k = uid('m'); urls[k] = URL.createObjectURL(blob); return 'mem:' + k; },
    url(ref) { return ref && ref.startsWith('mem:') ? urls[ref.slice(4)] || '' : (ref || ''); }
  };
}

/* ------------------------------------------------------------ file d'enregistrement
   Une écriture à la fois, regroupée après une courte pause. */
const SAVE = { pages: new Set(), meta: false, timer: null, busy: false, lastLocal: {}, failures: 0 };
function markDirty(pid) {
  if (!S.backend || !S.backend.canWrite) return;
  SAVE.pages.add(pid);
  SAVE.lastLocal[pid] = Date.now();
  scheduleSave();
}
function markMeta() {
  if (!S.backend || !S.backend.canWrite) return;
  SAVE.meta = true;
  scheduleSave();
}
function scheduleSave(delay = 800) {
  setSaveState('dirty');
  clearTimeout(SAVE.timer);
  SAVE.timer = setTimeout(flushSave, delay);
}
function cleanPage(p) {
  const c = clone(p);
  for (const el of c.els) { delete el._h; }
  c.updatedAt = Date.now();
  return c;
}
async function flushSave() {
  if (SAVE.busy) { scheduleSave(400); return; }
  if (!SAVE.pages.size && !SAVE.meta) { setSaveState('saved'); return; }
  SAVE.busy = true;
  setSaveState('saving');
  const ids = [...SAVE.pages];
  SAVE.pages.clear();
  const doMeta = SAVE.meta;
  SAVE.meta = false;
  try {
    for (const id of ids) {
      const p = S.pages.get(id);
      if (p) await S.backend.savePage(cleanPage(p));
    }
    if (doMeta) await S.backend.saveMeta(clone(S.meta));
    SAVE.failures = 0;
    setSaveState(SAVE.pages.size || SAVE.meta ? 'dirty' : 'saved');
  } catch (e) {
    ids.forEach(id => SAVE.pages.add(id));
    if (doMeta) SAVE.meta = true;
    SAVE.failures++;
    const code = e && e.code;
    if (code === 'invalid_argument' && SAVE.failures > 1) {
      S.backend.canWrite = false;
      setSaveState('readonly');
      toast('Cette vue est en lecture seule : tes modifications ne sont pas enregistrées.', 'warn', 6000);
    } else if (code === 'quota_exceeded') {
      setSaveState('error', 'Espace plein');
      toast('Espace de stockage plein : supprime des pages ou des images inutilisées.', 'warn', 6000);
    } else {
      setSaveState('error', 'Nouvel essai…');
      if (SAVE.failures < 6) setTimeout(() => scheduleSave(0), 1500 * SAVE.failures);
    }
  } finally {
    SAVE.busy = false;
    if ((SAVE.pages.size || SAVE.meta) && SAVE.failures === 0) scheduleSave(300);
  }
}
async function deletePageNow(id) {
  SAVE.pages.delete(id);
  try { await S.backend.deletePage(id); } catch (e) { /* la page disparaîtra de l'ordre de toute façon */ }
}

/* ------------------------------------------------------------ fichiers importés */
const MAX_IMG = 3000;
async function imageHasAlpha(bmp) {
  const c = document.createElement('canvas');
  c.width = 48; c.height = 48;
  const x = c.getContext('2d');
  x.drawImage(bmp, 0, 0, 48, 48);
  const d = x.getImageData(0, 0, 48, 48).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}
async function prepareImage(file) {
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || '')) {
    throw { message: 'Format HEIC non pris en charge : exporte la photo en JPEG depuis ton téléphone.' };
  }
  if (file.type === 'image/svg+xml') {
    const url = URL.createObjectURL(file);
    const img = await loadImg(url);
    return { blob: file, w: img.naturalWidth || 1000, h: img.naturalHeight || 1000, type: 'image/svg+xml' };
  }
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { bmp = await createImageBitmap(file); }
  const w0 = bmp.width, h0 = bmp.height;
  const k = Math.min(1, MAX_IMG / Math.max(w0, h0));
  const alpha = /png|webp|gif/.test(file.type) ? await imageHasAlpha(bmp) : false;
  if (k === 1 && file.type === 'image/jpeg' && file.size < 2.6e6) return { blob: file, w: w0, h: h0, type: 'image/jpeg' };
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(bmp, 0, 0, c.width, c.height);
  const type = alpha ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise(r => c.toBlob(r, type, alpha ? 0.92 : 0.88));
  return { blob, w: c.width, h: c.height, type: blob.type || type };
}
function loadImg(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Image illisible'));
    i.src = url;
  });
}
async function videoPoster(file) {
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('Vidéo illisible')); setTimeout(res, 6000); });
  try { v.currentTime = Math.min(0.6, (v.duration || 1) / 3); await new Promise(r => { v.onseeked = r; setTimeout(r, 2500); }); } catch (e) {}
  const w = v.videoWidth || 1280, hh = v.videoHeight || 720;
  const k = Math.min(1, 2200 / Math.max(w, hh));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(hh * k);
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
  URL.revokeObjectURL(url);
  return { blob, w, h: hh };
}
async function ingestFile(file) {
  if (!S.backend.canWrite) throw { message: 'Lecture seule : ajout impossible.' };
  if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name || '')) {
    const p = await prepareImage(file);
    const ref = await S.backend.putBlob(p.blob, p.type);
    return { kind: 'image', ref, w: p.w, h: p.h };
  }
  if (file.type.startsWith('video/')) {
    if (!/mp4|webm/.test(file.type)) throw { message: 'Vidéo : utilise un fichier MP4 ou WebM.' };
    if (S.backend.kind === 'cloud' && file.size > 20 * 1024 * 1024) throw { message: 'Vidéo trop lourde (20 Mo maximum) : compresse-la avant de l’ajouter.' };
    const poster = await videoPoster(file);
    const ref = await S.backend.putBlob(file, file.type);
    const pref = await S.backend.putBlob(poster.blob, 'image/jpeg');
    return { kind: 'video', ref, poster: pref, w: poster.w, h: poster.h };
  }
  throw { message: 'Type de fichier non pris en charge (images JPEG, PNG, WebP, SVG ou vidéos MP4, WebM).' };
}
function errText(e) {
  if (!e) return 'Erreur inconnue';
  const map = {
    too_large: 'Fichier trop lourd.', unsupported_type: 'Type de fichier refusé.', quota_or_state: 'Espace de stockage plein.',
    rate_limited: 'Trop de fichiers d’un coup : réessaie dans un instant.', not_granted: 'Ajout de fichiers indisponible ici.',
    store_unavailable: 'Stockage momentanément indisponible : réessaie.'
  };
  return map[e.code] || e.message || String(e);
}
