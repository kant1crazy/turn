/* ==========================================================================
   Présentation plein écran : transitions de page et animations d'entrée.
   ========================================================================== */
const PR = { i: 0, root: null, stage: null, cur: null, hideT: null, bar: null };

function startPresent(i = 0) {
  if (S.editing) exitEdit();
  if (S.crop) exitCrop();
  const root = $('#present');
  root.hidden = false;
  root.innerHTML = '';
  PR.root = root;
  PR.stage = h('div', { class: 'pr-stage' });
  const prev = h('button', { class: 'pr-btn', 'aria-label': 'Page précédente', html: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', onclick: e => { e.stopPropagation(); prGo(PR.i - 1); } });
  const next = h('button', { class: 'pr-btn', 'aria-label': 'Page suivante', html: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', onclick: e => { e.stopPropagation(); prGo(PR.i + 1); } });
  const close = h('button', { class: 'pr-btn', 'aria-label': 'Quitter la présentation', html: ic('close', 18), onclick: e => { e.stopPropagation(); stopPresent(); } });
  PR.count = h('span', { class: 'pr-count' });
  PR.bar = h('div', { class: 'pr-bar' }, prev, PR.count, next, h('span', { class: 'pr-sep' }), h('span', { class: 'pr-hint' }, '← → pour naviguer · Échap pour quitter'), close);
  PR.prog = h('div', { class: 'pr-prog' }, h('i'));
  root.append(PR.stage, PR.bar, PR.prog);
  try { const r = root.requestFullscreen && root.requestFullscreen(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  document.addEventListener('keydown', prKey, true);
  root.addEventListener('click', prClick);
  root.addEventListener('pointermove', prWake);
  window.addEventListener('resize', prFit);
  document.addEventListener('fullscreenchange', prFit);
  prShow(clamp(i, 0, S.meta.order.length - 1), 0);
  prWake();
}
function stopPresent() {
  const root = PR.root;
  if (!root) return;
  document.removeEventListener('keydown', prKey, true);
  root.removeEventListener('click', prClick);
  root.removeEventListener('pointermove', prWake);
  window.removeEventListener('resize', prFit);
  document.removeEventListener('fullscreenchange', prFit);
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  root.querySelectorAll('video').forEach(v => v.pause());
  root.hidden = true;
  root.innerHTML = '';
  PR.root = null;
  const pid = S.meta.order[PR.i];
  if (pid && pid !== S.cur) goPage(pid);
}
function prKey(e) {
  if (!PR.root) return;
  const k = e.key;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); e.stopPropagation(); prGo(PR.i + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); e.stopPropagation(); prGo(PR.i - 1); }
  else if (k === 'Home') { e.preventDefault(); prGo(0); }
  else if (k === 'End') { e.preventDefault(); prGo(S.meta.order.length - 1); }
  else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); stopPresent(); }
  else if (k.toLowerCase() === 'f') { e.preventDefault(); try { document.fullscreenElement ? document.exitFullscreen() : PR.root.requestFullscreen(); } catch (er) {} }
}
function prClick(e) {
  if (e.target.closest('.pr-bar')) return;
  const third = window.innerWidth / 3;
  prGo(e.clientX < third ? PR.i - 1 : PR.i + 1);
}
function prWake() {
  if (!PR.root) return;
  PR.root.classList.add('awake');
  clearTimeout(PR.hideT);
  PR.hideT = setTimeout(() => PR.root && PR.root.classList.remove('awake'), 2200);
}
function prGo(i) {
  const n = S.meta.order.length;
  if (i < 0 || i >= n || i === PR.i) return;
  prShow(i, i > PR.i ? 1 : -1);
}
function prShow(i, dir) {
  PR.i = i;
  const page = S.pages.get(S.meta.order[i]);
  const wrap = h('div', { class: 'pr-page' });
  const dom = renderPage(page, 'present', i);
  // décalage automatique des apparitions, dans l'ordre des calques
  let k = 0;
  for (const el of page.els) {
    if (!el.anim || !el.anim.type || el.anim.type === 'none') continue;
    const n = dom.querySelector(`.el[data-id="${el.id}"]`);
    if (n && el.anim.delay == null) n.style.setProperty('--d', Math.min(k * 140, 1400) + 'ms');
    k++;
  }
  wrap.append(dom);
  const tr = page.transition || 'fade';
  wrap.classList.add('tr-' + tr, dir < 0 ? 'back' : 'fwd', 'enter');
  PR.stage.append(wrap);
  prFit();
  const old = PR.cur;
  PR.cur = wrap;
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('enter')));
  if (old) {
    old.classList.remove('fwd', 'back');
    old.classList.add('leave', dir < 0 ? 'back' : 'fwd');
    old.querySelectorAll('video').forEach(v => v.pause());
    setTimeout(() => old.remove(), 750);
  }
  wrap.querySelectorAll('video').forEach(v => { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); });
  PR.count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(S.meta.order.length).padStart(2, '0')}`;
  PR.prog.firstChild.style.width = ((i + 1) / S.meta.order.length * 100) + '%';
  // précharge les images de la page suivante
  const nx = S.pages.get(S.meta.order[i + 1]);
  if (nx) for (const el of nx.els) if ((el.t === 'image' || el.t === 'video') && (el.src || el.poster)) { const im = new Image(); im.src = imgURL(el.t === 'video' ? el.poster : el.src); }
}
function prFit() {
  if (!PR.stage) return;
  const s = Math.min(window.innerWidth / PW, window.innerHeight / PH);
  PR.stage.style.setProperty('--s', s);
}
