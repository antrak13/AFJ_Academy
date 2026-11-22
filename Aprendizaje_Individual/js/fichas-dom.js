// Anima y controla paso a paso los visuales de las fichas (auto-reproducción, avance manual y repetición).
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_PLAY = '<svg class="fi-svg-ico" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7.5 5.5L18.5 12l-11 6.5z" fill="currentColor"/></svg>';
const SVG_PAUSA = '<svg class="fi-svg-ico" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 5.5h3.5v13H7zM13.5 5.5H17v13h-3.5z" fill="currentColor"/></svg>';

const estados = new WeakMap();

function obtenerEstado(vis) {
  let est = estados.get(vis);
  if (est) return est;
  let pasos = [];
  const raw = vis.querySelector('.vis-seq')?.textContent;
  if (raw) { try { pasos = JSON.parse(raw); } catch { pasos = []; } }
  const total = Math.max(pasos.length, Number(vis.querySelector('.vis-playbar')?.dataset.total || 0));
  est = { pasos, total, paso: 0, reproduciendo: false, timer: null };
  estados.set(vis, est);
  return est;
}

function pintarPlayIcon(vis, reproduciendo) {
  const b = vis.querySelector('.vis-play');
  if (!b) return;
  b.innerHTML = reproduciendo ? SVG_PAUSA : SVG_PLAY;
  b.setAttribute('aria-pressed', String(reproduciendo));
}

function aplicarPaso(vis, idx, { terminado = false } = {}) {
  const est = obtenerEstado(vis);
  if (est.total <= 1) return;
  const s = Math.max(0, Math.min(est.total - 1, idx));
  est.paso = s;

  vis.classList.toggle('vis-done', terminado);
  vis.querySelectorAll('.v-step').forEach(el => {
    const st = Number(el.dataset.step);
    el.classList.toggle('is-active', !terminado && st === s);
    el.classList.toggle('is-done', terminado || st < s);
    el.classList.toggle('is-pending', !terminado && st > s);
  });

  const prog = terminado ? 1 : (est.total > 1 ? s / (est.total - 1) : 1);
  vis.querySelectorAll('.v-pasos, .v-tiempo').forEach(c => c.style.setProperty('--prog', String(prog)));

  const orb = vis.querySelector('.v-ciclo-orb');
  if (orb) {
    const ang = terminado ? 0 : s * (360 / est.total);
    orb.style.setProperty('--orb-ang', `${ang}deg`);
    orb.style.opacity = terminado ? '0.45' : '1';
  }

  vis.querySelectorAll('.vis-dots [data-i]').forEach(d => {
    const di = Number(d.dataset.i);
    d.classList.toggle('now', !terminado && di === s);
    d.classList.toggle('done', terminado || di < s);
  });

  const cap = vis.querySelector('.vis-cap');
  if (cap && est.pasos.length) {
    const txt = est.pasos[terminado ? est.total - 1 : s] || '';
    cap.textContent = terminado ? `${est.total}/${est.total} · ${txt}` : `${s + 1}/${est.total} · ${txt}`;
  }

  const prev = vis.querySelector('.vis-prev'), next = vis.querySelector('.vis-next');
  if (prev) prev.disabled = !terminado && s <= 0;
  if (next) next.disabled = !terminado && s >= est.total - 1;
}

export function detenerAnimacion(vis) {
  const est = estados.get(vis);
  if (!est) return;
  if (est.timer) { clearTimeout(est.timer); est.timer = null; }
  est.reproduciendo = false;
  pintarPlayIcon(vis, false);
}

function programarSiguiente(vis) {
  const est = obtenerEstado(vis);
  if (!est.reproduciendo || !vis.isConnected) { detenerAnimacion(vis); return; }
  est.timer = setTimeout(() => {
    est.timer = null;
    if (!est.reproduciendo || !vis.isConnected) return;
    if (est.paso < est.total - 1) {
      aplicarPaso(vis, est.paso + 1);
      programarSiguiente(vis);
    } else {
      detenerAnimacion(vis);
      aplicarPaso(vis, est.total - 1, { terminado: true });
    }
  }, 1500);
}

export function reproducirPasos(vis, desde = 0) {
  if (!vis) return;
  const est = obtenerEstado(vis);
  detenerAnimacion(vis);
  if (RM || est.total <= 1) { aplicarPaso(vis, desde); return; }
  est.reproduciendo = true;
  pintarPlayIcon(vis, true);
  aplicarPaso(vis, desde);
  programarSiguiente(vis);
}

export function animar(vis, { autoPlay = true } = {}) {
  if (!vis || vis.closest('details:not([open])')) return;
  const est = obtenerEstado(vis);
  detenerAnimacion(vis);
  if (RM) {
    aplicarPaso(vis, Math.max(0, est.total - 1), { terminado: true });
    return;
  }
  vis.classList.remove('vis-done');
  vis.classList.remove('vis-anim');
  void vis.offsetWidth;
  vis.classList.add('vis-anim');
  if (est.total > 1 && autoPlay) {
    est.reproduciendo = true;
    pintarPlayIcon(vis, true);
    aplicarPaso(vis, 0);
    est.timer = setTimeout(() => {
      est.timer = null;
      if (est.reproduciendo) programarSiguiente(vis);
    }, 350);
  } else if (est.total > 1) {
    aplicarPaso(vis, est.total - 1, { terminado: true });
  }
}

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { animar(e.target); io.unobserve(e.target); }
  }), { threshold: .3 })
  : null;

export function activarFichas(raiz, { autoPlay = true } = {}) {
  raiz.querySelectorAll('.vis:not([data-activa])').forEach(vis => {
    vis.dataset.activa = '1';
    const cerrada = vis.closest('details:not([open])');
    if (cerrada) {
      cerrada.addEventListener('toggle', () => { if (cerrada.open) animar(vis); }, { once: true });
    } else if (!autoPlay) {
      const est = obtenerEstado(vis);
      if (est.total > 1) aplicarPaso(vis, est.total - 1, { terminado: true });
    } else if (io) {
      io.observe(vis);
    } else {
      animar(vis);
    }
  });
}

document.addEventListener('click', e => {
  const t = e.target;
  const otra = t.closest?.('.vis-otra');
  if (otra) {
    const vis = otra.closest('.vis');
    if (RM) reproducirPasos(vis, 0);
    else animar(vis);
    return;
  }

  const vis = t.closest?.('.vis');
  if (!vis) return;
  const est = obtenerEstado(vis);

  const play = t.closest?.('.vis-play');
  if (play) {
    if (est.reproduciendo) detenerAnimacion(vis);
    else {
      const desde = vis.classList.contains('vis-done') || est.paso >= est.total - 1 ? 0 : est.paso;
      reproducirPasos(vis, desde);
    }
    return;
  }

  const prev = t.closest?.('.vis-prev');
  if (prev) {
    detenerAnimacion(vis);
    const target = vis.classList.contains('vis-done') ? Math.max(0, est.total - 2) : est.paso - 1;
    aplicarPaso(vis, target);
    return;
  }

  const next = t.closest?.('.vis-next');
  if (next) {
    detenerAnimacion(vis);
    aplicarPaso(vis, est.paso + 1);
    return;
  }

  const dot = t.closest?.('.vis-dots [data-i]');
  if (dot) {
    detenerAnimacion(vis);
    aplicarPaso(vis, Number(dot.dataset.i));
  }
});
