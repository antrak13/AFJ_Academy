// Cada aprendín tiene su propio personaje y estado de clase en este navegador.
const ANTERIOR = 'aprendines.actual', ACTUAL = 'aprendines.actualId';
const APRENDIN = 'aprendines.personaje.', CLASE = 'aprendines.clase.';

function leerAprendin(clave) {
  try {
    const a = JSON.parse(localStorage.getItem(clave) || 'null');
    return a?.id && a.fases?.length ? a : null;
  } catch { return null; }
}

export function guardarAprendin(a, { activar = true } = {}) {
  a.id ||= globalThis.crypto?.randomUUID?.() || `a${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  try {
    localStorage.setItem(APRENDIN + a.id, JSON.stringify(a));
    if (activar) localStorage.setItem(ACTUAL, a.id);
    return true;
  } catch { return false; }
}

export function cargarAprendin(id) {
  if (id === undefined) {
    try { id = localStorage.getItem(ACTUAL); } catch { return null; }
  }
  const anterior = leerAprendin(ANTERIOR);
  if (!id) return anterior;
  return leerAprendin(APRENDIN + id) || (anterior?.id === id ? anterior : null);
}

export function listarAprendines() {
  const anterior = leerAprendin(ANTERIOR);
  const aprendines = new Map(anterior ? [[anterior.id, anterior]] : []);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (!clave?.startsWith(APRENDIN)) continue;
      const a = leerAprendin(clave);
      if (a) aprendines.set(a.id, a);
    }
  } catch { /* almacenamiento no disponible */ }
  return [...aprendines.values()];
}

export const enlaceClase = a => `clase.html?aprendin=${encodeURIComponent(a.id)}`;

export function guardarClase(id, estado) { try { localStorage.setItem(CLASE + id, JSON.stringify(estado)); } catch { /* nada */ } }
export function cargarClase(id) { try { return JSON.parse(localStorage.getItem(CLASE + id) || 'null'); } catch { return null; } }
export function borrarClase(id) { try { localStorage.removeItem(CLASE + id); } catch { /* nada */ } }
