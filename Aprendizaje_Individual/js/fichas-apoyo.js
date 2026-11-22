// Helpers compartidos para generar, calibrar por aceptación y mostrar fichas de estudio (en fichas.html y dentro de clase.html).
import { TIPOS, NOMBRES_VISUAL, limpiarFichaInicio, fichaInicioLocal, htmlFicha, svgIcono } from './fichas.js';
import { resumenAprendin } from './turno.js';

export const CLAVE_ESTUDIO = 'aprendines.fichas.estudio';
export const CLAVE_EFICACIA = 'aprendines.fichas.eficacia';
export const MODOS_CAL = ['auto', 'preferidos', 'explorar'];
export const ETIQUETAS_REACCION = {
  entendio: 'Lo entendí',
  duda: 'Más simple',
  ejemplo: 'Otro ejemplo de mi mundo',
  reto: 'Reto práctico',
  enfoque: 'Otro enfoque'
};
export const ENFOQUES_RAPIDOS = [
  { id: 'pasos', titulo: 'Paso a paso animado', pin: 'pasos', nota: 'Explica cómo se hace paso a paso con animación' },
  { id: 'comparar', titulo: 'Error vs acierto', pin: 'comparar', nota: 'Compara el error común frente a la forma correcta' },
  { id: 'partes', titulo: 'Mapa de partes', pin: 'partes', nota: 'Muéstralo como mapa con los nombres reales de sus partes' },
  { id: 'recta', titulo: 'Con recta o gráfico', pin: 'recta', nota: 'Explícalo visualmente con recta o gráfico' }
];
const EVENTO_CAMPO = {
  vista: 'vistas',
  entendio: 'entendio',
  reto: 'reto',
  ejemplo: 'ejemplo',
  duda: 'duda',
  exito_clase: 'exitosClase'
};
const MODO_TXT = {
  auto: 'Adaptativo (75 % favoritos · 25 % explorar)',
  preferidos: 'Solo tus formatos más aceptados',
  explorar: 'Explorar formatos poco probados'
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const alm = () => { try { return globalThis.localStorage || null; } catch { return null; } };

export function cargarEstudio() {
  try { const x = JSON.parse(alm()?.getItem(CLAVE_ESTUDIO) || 'null'); return x?.fichas ? x : null; } catch { return null; }
}
export function guardarEstudio(s) {
  try { alm()?.setItem(CLAVE_ESTUDIO, JSON.stringify(s)); } catch { /* sin espacio */ }
}

/* ---------- Calibración por aceptación de formatos ---------- */
const vacioEficacia = () => ({ version: 1, modo: 'auto', pinTipo: '', tipos: {} });
export function cargarEficacia() {
  try {
    const x = JSON.parse(alm()?.getItem(CLAVE_EFICACIA) || 'null');
    if (!x || typeof x !== 'object') return vacioEficacia();
    return {
      version: 1,
      modo: MODOS_CAL.includes(x.modo) ? x.modo : 'auto',
      pinTipo: Object.hasOwn(TIPOS, x.pinTipo) ? x.pinTipo : '',
      tipos: x.tipos && typeof x.tipos === 'object' ? x.tipos : {}
    };
  } catch { return vacioEficacia(); }
}
export function guardarEficacia(ef) {
  try { alm()?.setItem(CLAVE_EFICACIA, JSON.stringify(ef)); } catch { /* sin espacio */ }
}
export function reiniciarEficacia() {
  const ef = vacioEficacia();
  guardarEficacia(ef);
  return ef;
}
export function configurarCalibracion({ modo, pinTipo } = {}) {
  const ef = cargarEficacia();
  if (modo && MODOS_CAL.includes(modo)) ef.modo = modo;
  if (pinTipo !== undefined) ef.pinTipo = Object.hasOwn(TIPOS, pinTipo) ? pinTipo : '';
  guardarEficacia(ef);
  return ef;
}
export function registrarEventoVisual(tipo, evento) {
  const campo = EVENTO_CAMPO[evento];
  if (!Object.hasOwn(TIPOS, tipo) || !campo) return null;
  const ef = cargarEficacia();
  const r = (ef.tipos[tipo] ||= { vistas: 0, entendio: 0, reto: 0, ejemplo: 0, duda: 0, exitosClase: 0, ultimoUso: 0 });
  r[campo] = (r[campo] || 0) + 1;
  if (evento !== 'vista' && (r.vistas || 0) < 1) r.vistas = 1;
  r.ultimoUso = Date.now();
  guardarEficacia(ef);
  return ef;
}

export function puntuarTipo(r = {}) {
  const entendio = r.entendio || 0, reto = r.reto || 0, ejemplo = r.ejemplo || 0, duda = r.duda || 0, exitosClase = r.exitosClase || 0;
  const vistas = Math.max(r.vistas || 0, entendio + reto + ejemplo + duda);
  const pos = entendio + 0.9 * reto + 1.2 * exitosClase + 0.25 * ejemplo;
  const neg = duda;
  const muestras = entendio + reto + ejemplo + duda + exitosClase;
  const tasa = (pos + 1.5) / (pos + neg + 2.5);
  return { tipo: r.tipo || '', vistas, muestras, entendio, reto, ejemplo, duda, exitosClase, tasa, porcentaje: Math.round(tasa * 100) };
}

export function calcularCalibracion(historial = [], ef = cargarEficacia()) {
  const todos = Object.keys(TIPOS).map(tipo => puntuarTipo({ ...ef.tipos[tipo], tipo }));
  const medidos = todos.filter(x => x.muestras > 0 || x.vistas > 0).sort((a, b) => b.tasa - a.tasa || b.muestras - a.muestras);
  const preferidos = todos.filter(x => x.muestras >= 1 && x.tasa >= 0.62).sort((a, b) => b.tasa - a.tasa || b.muestras - a.muestras).slice(0, 4);
  const evitar = todos.filter(x => x.duda >= 1 && x.tasa <= 0.48).sort((a, b) => a.tasa - b.tasa || b.duda - a.duda).slice(0, 3);
  const evitarSet = new Set(evitar.map(x => x.tipo));
  const explorar = [...todos]
    .filter(x => !evitarSet.has(x.tipo) && x.tipo !== ef.pinTipo)
    .sort((a, b) => a.vistas - b.vistas || a.muestras - b.muestras)
    .slice(0, 4);

  let estrategia = 'aprovechar';
  if (ef.pinTipo && Object.hasOwn(TIPOS, ef.pinTipo)) estrategia = 'fijo';
  else if (ef.modo === 'explorar') estrategia = 'explorar';
  else if (ef.modo === 'preferidos') estrategia = preferidos.length ? 'aprovechar' : 'explorar';
  else estrategia = ((historial.length + 1) % 4 === 0 || !preferidos.length) ? 'explorar' : 'aprovechar';

  return {
    modo: ef.modo,
    pinTipo: ef.pinTipo,
    estrategia,
    preferidos,
    evitar,
    explorar: explorar.map(x => ({ tipo: x.tipo, vistas: x.vistas })),
    ranking: medidos
  };
}

export async function solicitarFichaInicio({ ia, tema, gustos, nivel = 'algo', reaccion = 'inicio', nota = '', objetivo = '', dificultad = '', aprendin = null, historial = [], calibracion = null, fichaBase = null, pinTipo = '' }) {
  let cal = calibracion || calcularCalibracion(historial);
  if (pinTipo) cal = { ...cal, pinTipo, estrategia: 'fijo' };
  else if (reaccion === 'enfoque' && cal.pinTipo) cal = { ...cal, pinTipo: '', estrategia: 'explorar' };
  const aprendinResumen = aprendin?.nombre ? resumenAprendin(aprendin) : null;
  const referencia = fichaBase ? resumenFichaEstudio(fichaBase) : undefined;
  let datos = null, fuente = 'ia';
  try {
    if (!ia) throw new Error('sin IA');
    const r = await fetch('/api/ficha-inicio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tema, gustos, nivel, reaccion, nota, objetivo, dificultad, aprendin: aprendinResumen, historial: historial.slice(-6), referencia, calibracion: cal })
    });
    const j = await r.json();
    if (!j.ok || !j.ficha) throw new Error(j.error || r.status);
    datos = limpiarFichaInicio(j.ficha);
  } catch {
    fuente = 'local';
    await new Promise(ok => setTimeout(ok, 250));
    datos = fichaInicioLocal({ tema, gustos, nivel, reaccion, nota, objetivo, historial, calibracion: cal, fichaBase });
  }
  if (datos?.visual?.tipo && datos.ejemplo.resultado) registrarEventoVisual(datos.visual.tipo, 'vista');
  return { datos, fuente, calibracion: cal };
}

function htmlBarraEnfoque(idx, tipoActual = 'pasos') {
  const opts = Object.entries(TIPOS).map(([k, desc]) => {
    const corto = desc.split('(')[0].trim();
    return `<option value="${esc(k)}">${esc(NOMBRES_VISUAL[k])}${k === tipoActual ? ' (actual)' : ''} — ${esc(corto)}</option>`;
  }).join('');
  return `<div class="fi-enfoque-bar" hidden>
    <p class="fi-enfoque-ayuda">Elige otro enfoque visual (la nueva ficha aparecerá justo debajo):</p>
    <div class="fi-enfoque-chips">
      ${ENFOQUES_RAPIDOS.map(e => `<button type="button" class="btn btn-chico fi-enfoque-chip" data-pin="${esc(e.pin)}" data-nota="${esc(e.nota)}">${esc(e.titulo)}</button>`).join('')}
    </div>
    <div class="fi-enfoque-row">
      <label class="solo-lector" for="selEnfoque-${idx}">Formato visual</label>
      <select class="otra fi-enfoque-sel" id="selEnfoque-${idx}"><option value="">Elegir otro formato automáticamente</option>${opts}</select>
      <button type="button" class="btn btn-fuerte btn-chico fi-enfoque-send">Generar debajo</button>
    </div>
  </div>`;
}

export function renderizarFichaEstudio(item, idx, { esUltima, permitirEnfoque = false, gustos, avatar = '', tono, placeholder = 'Opcional: escribe qué parte no entendiste o qué ejemplo quieres…' }) {
  const tipoActual = item?.datos?.visual?.tipo || 'pasos';
  const guia = item.fuente === 'local' && !item.datos.ejemplo?.resultado;
  const barraEnfoque = htmlBarraEnfoque(idx, tipoActual);
  let pieHtml = '';

  if (esUltima && !guia) {
    pieHtml = `<div class="fi-adapta-acc" data-idx="${idx}">
        <label class="solo-lector" for="notaDuda-${idx}">¿Qué duda tienes?</label>
        <input class="otra fi-nota-duda" id="notaDuda-${idx}" type="text" maxlength="160" placeholder="${esc(placeholder)}">
        <div class="fi-reacciones">
          <button type="button" class="btn btn-fuerte fi-reaccion-btn" data-reaccion="entendio">${svgIcono('check', { size: 15 })}<span>Lo entendí</span></button>
          <button type="button" class="btn fi-reaccion-btn" data-reaccion="duda">${svgIcono('idea', { size: 15 })}<span>Más simple</span></button>
          <button type="button" class="btn fi-reaccion-btn" data-reaccion="ejemplo">${svgIcono('mapa', { size: 15 })}<span>Otro ejemplo de mi mundo</span></button>
          <button type="button" class="btn fi-reaccion-btn" data-reaccion="reto">${svgIcono('energia', { size: 15 })}<span>Dame un reto</span></button>
          <button type="button" class="btn fi-btn-enfoque" aria-expanded="false">${svgIcono('ciclo', { size: 15 })}<span>Cambiar enfoque</span></button>
        </div>
        ${barraEnfoque}
      </div>`;
  } else {
    const resHtml = item.reaccion
      ? `<p class="fi-reaccion-res">${svgIcono(item.reaccion === 'entendio' ? 'check' : 'chispa', { size: 14 })}<span>Tu respuesta: <b>${esc(ETIQUETAS_REACCION[item.reaccion] || item.reaccion)}</b>${item.nota ? ` — «${esc(item.nota)}»` : ''}</span></p>`
      : '';
    if (permitirEnfoque && !guia) {
      pieHtml = `${resHtml}
        <div class="fi-adapta-acc" data-idx="${idx}">
          <div class="cl-apoyo-otra-wrap">
            <button type="button" class="btn btn-chico cl-apoyo-otra">${svgIcono('mas', { size: 14 })}<span>Otra ficha debajo</span></button>
            <button type="button" class="btn btn-chico fi-btn-enfoque" aria-expanded="false">${svgIcono('ciclo', { size: 14 })}<span>Cambiar enfoque</span></button>
          </div>
          ${barraEnfoque}
        </div>`;
    } else {
      pieHtml = resHtml;
    }
  }

  return htmlFicha(item.datos, {
    numero: idx + 1,
    fase: `${item.datos.subtema || 'Adaptada'} · ${NOMBRES_VISUAL[tipoActual] || tipoActual}${item.fuente === 'local' ? ' · Práctica' : ''}`,
    rotuloAdaptacion: guia ? 'Guía de práctica' : undefined,
    mundo: gustos,
    avatar,
    tono,
    reto: item.reaccionOrigen === 'reto' && !item.datos.aviso,
    citaDe: 'Para recordar',
    pieHtml
  });
}

export function enlazarAccionesFicha(raiz, { alReaccionar, alEnfoque, alOtra, ocupado = () => false } = {}) {
  if (!raiz) return;
  raiz.querySelectorAll('.fi-reaccion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (ocupado()) return;
      const box = btn.closest('.fi-adapta-acc') || raiz;
      const nota = box.querySelector('.fi-nota-duda')?.value.trim() || '';
      alReaccionar?.(btn.dataset.reaccion, nota);
    });
  });
  raiz.querySelectorAll('.fi-btn-enfoque').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = btn.closest('.fi-adapta-acc') || raiz;
      const bar = box.querySelector('.fi-enfoque-bar');
      if (!bar) return;
      bar.hidden = !bar.hidden;
      btn.setAttribute('aria-expanded', String(!bar.hidden));
      if (!bar.hidden) bar.querySelector('.fi-enfoque-sel')?.focus();
    });
  });
  raiz.querySelectorAll('.fi-enfoque-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (ocupado()) return;
      const box = chip.closest('.fi-adapta-acc') || raiz;
      const notaInput = box.querySelector('.fi-nota-duda')?.value.trim() || '';
      alEnfoque?.({ pinTipo: chip.dataset.pin || '', nota: notaInput || chip.dataset.nota || chip.textContent.trim() });
    });
  });
  raiz.querySelectorAll('.fi-enfoque-send').forEach(send => {
    send.addEventListener('click', () => {
      if (ocupado()) return;
      const box = send.closest('.fi-adapta-acc') || raiz;
      const pinTipo = box.querySelector('.fi-enfoque-sel')?.value || '';
      const notaInput = box.querySelector('.fi-nota-duda')?.value.trim() || '';
      alEnfoque?.({ pinTipo, nota: notaInput || (pinTipo ? `Formato ${pinTipo}` : 'Nuevo enfoque visual') });
    });
  });
  raiz.querySelectorAll('.cl-apoyo-otra').forEach(btn => {
    btn.addEventListener('click', () => { if (!ocupado()) alOtra?.(); });
  });
}

const resumenFichaEstudio = f => ({
  titulo: f.titulo, subtema: f.subtema, tipo: f.visual.tipo, idea: f.idea,
  situacion: f.ejemplo?.situacion, pregunta: f.ejemplo?.pregunta
});

export function historialDe(fichas = []) {
  return fichas.map(f => ({ ...resumenFichaEstudio(f.datos), reaccion: f.reaccion || 'vista', nota: f.reaccion ? f.nota : '' }));
}

const SVG_AJUSTE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h8M16 7h4M12 4.5v5M4 17h4M12 17h8M8 14.5v5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
const SVG_PIN = '<svg class="fi-pin-ico" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>';

export function renderizarPanelCalibracion(cont, { historial = [], compacto = false, alCambiar } = {}) {
  if (!cont) return;
  const cal = calcularCalibracion(historial);
  const estrategiaTxt = cal.estrategia === 'fijo'
    ? `Fijado por ti: ${cal.pinTipo}`
    : cal.estrategia === 'explorar' ? 'Próxima ficha: probar formato poco usado' : 'Próxima ficha: priorizar tus más claros';

  const top = cal.ranking.slice(0, compacto ? 5 : 8);
  const barrasHtml = top.length
    ? `<div class="fi-cal-lista">${top.map(r => {
        const fijado = cal.pinTipo === r.tipo;
        const estado = r.muestras >= 1 && r.tasa >= 0.62 ? 'alto' : (r.duda >= 1 && r.tasa <= 0.48 ? 'bajo' : 'medio');
        return `<button type="button" class="fi-cal-item est-${estado}${fijado ? ' fijado' : ''}" data-pin="${esc(r.tipo)}" title="${esc(TIPOS[r.tipo] || r.tipo)} · Clic para fijar o soltar">
          <span class="fi-cal-nom">${fijado ? SVG_PIN : ''}${esc(NOMBRES_VISUAL[r.tipo] || r.tipo)}</span>
          <span class="fi-cal-bar"><i style="width:${r.porcentaje}%"></i></span>
          <span class="fi-cal-pct">${r.porcentaje}%${r.exitosClase ? ` · ${r.exitosClase} en clase` : ''}</span>
        </button>`;
      }).join('')}</div>`
    : `<p class="fi-cal-vacio">Todavía estamos midiendo qué visuales te resultan más claros. Usa «Lo entendí» o «Más simple» para calibrar.</p>`;

  cont.innerHTML = `<details class="fi-cal"${compacto ? '' : ' open'}>
    <summary><span class="fi-cal-tit">${SVG_AJUSTE}<span>Calibración de formatos</span></span><small>${esc(estrategiaTxt)}</small></summary>
    <div class="fi-cal-cuerpo">
      <div class="fi-cal-modos" role="group" aria-label="Modo de calibración">
        <button type="button" class="btn btn-chico${cal.modo === 'auto' ? ' activo' : ''}" data-modo="auto" title="${esc(MODO_TXT.auto)}">Auto 75/25</button>
        <button type="button" class="btn btn-chico${cal.modo === 'preferidos' ? ' activo' : ''}" data-modo="preferidos" title="${esc(MODO_TXT.preferidos)}">Favoritos</button>
        <button type="button" class="btn btn-chico${cal.modo === 'explorar' ? ' activo' : ''}" data-modo="explorar" title="${esc(MODO_TXT.explorar)}">Explorar</button>
        ${cal.ranking.length || cal.pinTipo ? '<button type="button" class="btn btn-chico fi-cal-reset" data-reset="1">Reiniciar</button>' : ''}
      </div>
      ${barrasHtml}
      ${top.length ? '<p class="fi-cal-ayuda">Toca un formato para fijarlo o soltarlo. Los formatos marcados «en clase» te ayudaron a explicar mejor un paso.</p>' : ''}
    </div>
  </details>`;

  cont.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => {
    configurarCalibracion({ modo: b.dataset.modo });
    renderizarPanelCalibracion(cont, { historial, compacto, alCambiar });
    alCambiar?.();
  }));
  cont.querySelectorAll('[data-pin]').forEach(b => b.addEventListener('click', () => {
    const actual = cargarEficacia().pinTipo;
    configurarCalibracion({ pinTipo: actual === b.dataset.pin ? '' : b.dataset.pin });
    renderizarPanelCalibracion(cont, { historial, compacto, alCambiar });
    alCambiar?.();
  }));
  cont.querySelector('[data-reset]')?.addEventListener('click', () => {
    reiniciarEficacia();
    renderizarPanelCalibracion(cont, { historial, compacto, alCambiar });
    alCambiar?.();
  });
}
