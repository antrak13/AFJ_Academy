// Helpers compartidos para generar, adaptar y mostrar fichas de estudio (en fichas.html y dentro de clase.html).
import { limpiarFichaInicio, fichaInicioLocal, htmlFicha } from './fichas.js';

export const CLAVE_ESTUDIO = 'aprendines.fichas.estudio';
export const ETIQUETAS_REACCION = {
  entendio: '✓ Lo entendí',
  duda: '🤔 Más simple',
  ejemplo: '🌎 Otro ejemplo de mi mundo',
  reto: '⚡ Reto práctico'
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function cargarEstudio() {
  try { const x = JSON.parse(localStorage.getItem(CLAVE_ESTUDIO) || 'null'); return x?.fichas ? x : null; } catch { return null; }
}
export function guardarEstudio(s) {
  try { localStorage.setItem(CLAVE_ESTUDIO, JSON.stringify(s)); } catch { /* sin espacio */ }
}

export async function solicitarFichaInicio({ ia, tema, gustos, nivel = 'algo', reaccion = 'inicio', nota = '', objetivo = '', aprendin = null, historial = [] }) {
  let datos = null, fuente = 'ia';
  try {
    if (!ia) throw new Error('sin IA');
    const r = await fetch('/api/ficha-inicio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tema, gustos, nivel, reaccion, nota, objetivo, aprendin, historial })
    });
    const j = await r.json();
    if (!j.ok || !j.ficha) throw new Error(j.error || r.status);
    datos = limpiarFichaInicio(j.ficha);
  } catch {
    fuente = 'local';
    await new Promise(ok => setTimeout(ok, 400));
    datos = fichaInicioLocal({ tema, gustos, nivel, reaccion, nota, objetivo, historial });
  }
  return { datos, fuente };
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

export function historialDe(fichas) {
  return fichas.map(f => ({
    titulo: f.datos.titulo, subtema: f.datos.subtema, tipo: f.datos.visual.tipo, reaccion: f.reaccion || 'inicio'
  }));
}
