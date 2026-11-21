// Helpers compartidos para generar, calibrar por aceptación y mostrar fichas de estudio (en fichas.html y dentro de clase.html).
import { TIPOS, limpiarFichaInicio, fichaInicioLocal, htmlFicha } from './fichas.js';
import { resumenAprendin } from './turno.js';

export const CLAVE_ESTUDIO = 'aprendines.fichas.estudio';
export const CLAVE_EFICACIA = 'aprendines.fichas.eficacia';
export const MODOS_CAL = ['auto', 'preferidos', 'explorar'];
export const ETIQUETAS_REACCION = {
  entendio: '✓ Lo entendí',
  duda: '🤔 Más simple',
  ejemplo: '🌎 Otro ejemplo de mi mundo',
  reto: '⚡ Reto práctico'
};
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

export async function solicitarFichaInicio({ ia, tema, gustos, nivel = 'algo', reaccion = 'inicio', nota = '', objetivo = '', aprendin = null, historial = [], calibracion = null }) {
  const cal = calibracion || calcularCalibracion(historial);
  const aprendinResumen = aprendin?.nombre ? resumenAprendin(aprendin) : null;
  let datos = null, fuente = 'ia';
  try {
    if (!ia) throw new Error('sin IA');
    const r = await fetch('/api/ficha-inicio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tema, gustos, nivel, reaccion, nota, objetivo, aprendin: aprendinResumen, historial, calibracion: cal })
    });
    const j = await r.json();
    if (!j.ok || !j.ficha) throw new Error(j.error || r.status);
    datos = limpiarFichaInicio(j.ficha);
  } catch {
    fuente = 'local';
    await new Promise(ok => setTimeout(ok, 250));
    datos = fichaInicioLocal({ tema, gustos, nivel, reaccion, nota, objetivo, historial, calibracion: cal });
  }
  if (datos?.visual?.tipo) registrarEventoVisual(datos.visual.tipo, 'vista');
  return { datos, fuente, calibracion: cal };
}

export function renderizarFichaEstudio(item, idx, { esUltima, gustos, avatar = '', tono, placeholder = 'Opcional: escribe qué parte no entendiste o qué ejemplo quieres…' }) {
  const pieHtml = esUltima
    ? `<div class="fi-adapta-acc" data-idx="${idx}">
        <label class="solo-lector" for="notaDuda">¿Qué duda tienes?</label>
        <input class="otra fi-nota-duda" id="notaDuda" type="text" maxlength="160" placeholder="${esc(placeholder)}">
        <div class="fi-reacciones">
          <button type="button" class="btn btn-fuerte fi-reaccion-btn" data-reaccion="entendio">✓ Lo entendí</button>
          <button type="button" class="btn fi-reaccion-btn" data-reaccion="duda">🤔 No entendí / más simple</button>
          <button type="button" class="btn fi-reaccion-btn" data-reaccion="ejemplo">🌎 Otro ejemplo de mi mundo</button>
          <button type="button" class="btn fi-reaccion-btn" data-reaccion="reto">⚡ Dame un reto</button>
        </div>
      </div>`
    : item.reaccion
      ? `<p class="fi-reaccion-res">Tu respuesta: <b>${esc(ETIQUETAS_REACCION[item.reaccion] || item.reaccion)}</b>${item.nota ? ` — «${esc(item.nota)}»` : ''}</p>`
      : '';

  return htmlFicha(item.datos, {
    numero: idx + 1,
    fase: `${item.datos.subtema || 'Adaptada'} · ${item.datos.visual.tipo}`,
    mundo: gustos,
    avatar,
    tono,
    citaDe: 'Para recordar',
    pieHtml
  });
}

export function historialDe(fichas = []) {
  return fichas.slice(-6).map(f => ({
    titulo: f.datos.titulo, subtema: f.datos.subtema, tipo: f.datos.visual.tipo, reaccion: f.reaccion || f.reaccionOrigen || 'vista'
  }));
}

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
          <span class="fi-cal-nom">${fijado ? '📌 ' : ''}${esc(r.tipo)}</span>
          <span class="fi-cal-bar"><i style="width:${r.porcentaje}%"></i></span>
          <span class="fi-cal-pct">${r.porcentaje}%${r.exitosClase ? ` · ★${r.exitosClase}` : ''}</span>
        </button>`;
      }).join('')}</div>`
    : `<p class="fi-cal-vacio">Todavía estamos midiendo qué visuales te resultan más claros. Usa ✓ Lo entendí o 🤔 Más simple para calibrar.</p>`;

  cont.innerHTML = `<details class="fi-cal"${compacto ? '' : ' open'}>
    <summary><span>🎚️ Calibración de formatos</span><small>${esc(estrategiaTxt)}</small></summary>
    <div class="fi-cal-cuerpo">
      <div class="fi-cal-modos" role="group" aria-label="Modo de calibración">
        <button type="button" class="btn btn-chico${cal.modo === 'auto' ? ' activo' : ''}" data-modo="auto" title="${esc(MODO_TXT.auto)}">Auto 75/25</button>
        <button type="button" class="btn btn-chico${cal.modo === 'preferidos' ? ' activo' : ''}" data-modo="preferidos" title="${esc(MODO_TXT.preferidos)}">Favoritos</button>
        <button type="button" class="btn btn-chico${cal.modo === 'explorar' ? ' activo' : ''}" data-modo="explorar" title="${esc(MODO_TXT.explorar)}">Explorar</button>
        ${cal.ranking.length || cal.pinTipo ? '<button type="button" class="btn btn-chico fi-cal-reset" data-reset="1">Reiniciar</button>' : ''}
      </div>
      ${barrasHtml}
      ${top.length ? '<p class="fi-cal-ayuda">Toca un formato para fijarlo (📌) o soltarlo. ★ indica fichas que te ayudaron a enseñar el paso en clase.</p>' : ''}
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
