// Conecta Aprendines con la plataforma (Supabase a través de la app de Next):
// guarda el avance de la clase para el panel docente y lee el aula del alumno.
// Si la página no se sirve desde Next (p. ej. `node servidor.mjs` en el 8080) o no hay sesión, no hace nada.
import { ESTADOS, PASOS, resumenAprendin } from './turno.js';

let modulo = null;   // null: sin probar · false: no hay plataforma · objeto: /comun/sesion.js
async function sesionPlataforma() {
  if (modulo === null) {
    try { modulo = await import('/comun/sesion.js'); } catch { modulo = false; }
  }
  return modulo || null;
}

/** Token de la sesión de Supabase, o null si no hay plataforma o no hay sesión. */
async function token() {
  const m = await sesionPlataforma();
  if (!m) return null;
  try {
    const sb = await m.cliente();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token || null;
  } catch { return null; }
}

/** Llama a una ruta /api de la plataforma con la sesión. Devuelve null si no hay sesión. */
export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const t = await token();
  if (!t) return null;
  const r = await fetch(ruta, {
    method: metodo,
    headers: { authorization: 'Bearer ' + t, ...(cuerpo ? { 'content-type': 'application/json' } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.mensaje || `Error ${r.status}`);
  return j;
}

/** El módulo de sesión (para irAlLogin, usuarioActual…), o null fuera de la plataforma. */
export const plataforma = sesionPlataforma;

/** Resumen compacto del avance de una clase: lo que midió la IA por paso y el resultado de la prueba. */
export function resumenAvance(A, C) {
  const medicion = {};
  for (let p = 1; p <= PASOS; p++) {
    const ts = C.medicion?.[p]?.turnos;
    if (!ts?.length) continue;
    medicion[p] = ts.slice(-60).map(t => ({ estado: t.estado in ESTADOS ? t.estado : 'parcial', nota: String(t.nota || '').slice(0, 240) }));
  }
  let prueba = null;
  const pr = C.prueba, qs = pr?.examen?.preguntas;
  if (pr?.respuestas?.length && qs) {
    const rs = pr.respuestas.map((r, k) => ({ r, q: qs[k] })).filter(x => x.r && x.r.eleccion != null);
    const fallosPorPaso = {};
    for (const { r, q } of rs) if (!r.bien && q?.paso >= 1 && q.paso <= PASOS) fallosPorPaso[q.paso] = (fallosPorPaso[q.paso] || 0) + 1;
    prueba = {
      intento: Math.max(1, pr.intento || 1), puntaje: rs.filter(x => x.r.bien).length, n: rs.length,
      aprobado: !!pr.aprobado, salvadas: rs.filter(x => x.r.bien && !x.r.aprBien).length, fallosPorPaso,
    };
  }
  return {
    aprendinId: String(A.id).slice(0, 80),
    nombre: String(A.nombre || '').slice(0, 40),
    tema: String(A.tema || '').slice(0, 80),
    conceptos: resumenAprendin(A).conceptos,
    paso: Math.min(PASOS + 1, Math.max(1, C.paso || 1)),
    mensajes: (C.chat || []).filter(m => m.de === 'yo').length,
    medicion, prueba,
  };
}

let reloj = null;
/** Guarda el avance en la plataforma 1,5 s después del último cambio (sin bloquear la clase). */
export function sincronizarAvance(A, C) {
  if (!A?.id || !C) return;
  clearTimeout(reloj);
  reloj = setTimeout(async () => {
    try { await api('/api/avance', { metodo: 'PUT', cuerpo: resumenAvance(A, C) }); }
    catch (e) { console.warn('No pude guardar el avance en la plataforma:', e.message); }
  }, 1500);
}

/** Aulas del usuario: { comoDocente: [...], comoAlumno: [...] }, o null sin sesión. */
export const misAulas = () => api('/api/aulas');
export const unirseAula = codigo => api('/api/aulas/unirse', { metodo: 'POST', cuerpo: { codigo } });
