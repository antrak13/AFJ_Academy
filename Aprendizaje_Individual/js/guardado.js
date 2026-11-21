// Guardado en el navegador: el aprendín que creaste y el avance de su clase.
const CLAVE = 'aprendines.actual', CLASE = 'aprendines.clase.';

export function guardarAprendin(a) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ ...a, id: a.id || `a${Date.now().toString(36)}` })); } catch { /* sin espacio o modo privado */ }
}
export function cargarAprendin() {
  try { const a = JSON.parse(localStorage.getItem(CLAVE) || 'null'); return a?.fases?.length ? a : null; } catch { return null; }
}
export function guardarClase(id, estado) { try { localStorage.setItem(CLASE + id, JSON.stringify(estado)); } catch { /* nada */ } }
export function cargarClase(id) { try { return JSON.parse(localStorage.getItem(CLASE + id) || 'null'); } catch { return null; } }
export function borrarClase(id) { try { localStorage.removeItem(CLASE + id); } catch { /* nada */ } }
