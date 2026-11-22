import { PASOS, resumenAprendin, turnoLocal } from './turno.js';

export const RONDAS = [
  { nombre: 'La idea', objetivo: 'Explica qué significa la idea y por qué funciona.' },
  { nombre: 'Un ejemplo', objetivo: 'Muéstrales un caso concreto y explica cómo lo resolverías.' },
  { nombre: 'La corrección', objetivo: 'Muéstrales un error común y enséñales a corregirlo.' },
  { nombre: 'Otro mundo', objetivo: 'Aplica la misma idea a una situación nueva y comprueba el resultado.' }
];

export const VOCES = {
  porques: { nombre: 'Pregunta por qué', personalidad: 'Curiosidad por las causas. Pide justificación y parte de lo que ya le dijeron.', inicio: 'Quiero entender por qué funciona. ¿Qué me explicarías primero?', practica: '¿Qué parte de tu explicación me ayuda a entender por qué funciona?' },
  ejemplos: { nombre: 'Aprende con ejemplos', personalidad: 'Imaginación práctica. Prueba cada idea con objetos y situaciones de su mundo.', inicio: 'Me ayuda mucho imaginarlo con algo de mi mundo. ¿Me das un caso?', practica: '¿Qué caso de mi mundo podemos probar con esa idea?' },
  comprueba: { nombre: 'Comprueba los detalles', personalidad: 'Cuidado por los detalles. Pone la explicación a prueba con un contraste o un error distinto.', inicio: 'Me gusta comprobar las cosas. ¿Cómo sabría si lo hice bien?', practica: '¿Qué error podría cometer al intentarlo y cómo lo corrigo?' }
};

const PREFIJO = 'aprendines.sala.';
const ULTIMA = 'aprendines.ultimaSala';
export const idSala = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const pasoSala = sala => Math.min(...sala.grupo.map(a => a.notas.length)) + 1;

function leerSala(id) {
  try {
    const s = JSON.parse(localStorage.getItem(PREFIJO + id) || 'null');
    return s?.grupo?.length >= 2 && Array.isArray(s.turnos) ? s : null;
  } catch { return null; }
}

export function cargarSala() {
  try { return leerSala(localStorage.getItem(ULTIMA)); }
  catch { return null; }
}

export function guardarSala(sala, { activar = true } = {}) {
  try {
    localStorage.setItem(PREFIJO + sala.id, JSON.stringify(sala));
    if (activar) localStorage.setItem(ULTIMA, sala.id);
    return true;
  } catch { return false; }
}

export function listarSalas() {
  try {
    return Object.keys(localStorage).filter(k => k.startsWith(PREFIJO))
      .map(k => leerSala(k.slice(PREFIJO.length))).filter(Boolean)
      .sort((a, b) => b.creada - a.creada);
  } catch { return []; }
}

export function contextoSala(sala, a) {
  const voz = VOCES[a.voz];
  return resumenAprendin({
    ...a.personaje,
    tema: sala.tema,
    personalidad: `${voz.personalidad} ${a.personaje.personalidad || ''}`,
    mision: sala.meta || `Aprender ${sala.tema} para usarlo en tu mundo (${a.personaje.mundo}).`,
    conceptos: RONDAS.map(r => r.objetivo)
  });
}

export async function responderSala({ sala, a, envio, ia }) {
  const previos = sala.turnos.filter(t => t.id !== envio.id && t.paso === envio.paso && t.destinos.includes(a.id));
  const historial = previos.flatMap(t => {
    const resp = t.respuestas[a.id];
    return [{ de: 'yo', texto: t.texto }, ...(resp ? [{ de: 'apr', texto: resp.turno.dice }] : [])];
  });
  if (ia) {
    try {
      const r = await fetch('/api/turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprendin: contextoSala(sala, a), paso: envio.paso, mensaje: envio.texto,
          aprendido: a.notas.map(n => n.idea), historial: historial.slice(-12), turnos: previos.length + 1
        })
      });
      const j = await r.json();
      if (r.ok && j.ok && j.turno?.dice) return { turno: j.turno, fuente: 'ia' };
    } catch { /* se puede seguir practicando durante una interrupción */ }
  }
  const apoyo = turnoLocal({ tema: sala.tema }, envio.paso, [...previos.map(t => t.texto), envio.texto]);
  if (apoyo.estado === 'parcial' && !apoyo.puedeConfirmar) {
    const pregunta = VOCES[a.voz].practica;
    apoyo.dice = a.voz === 'ejemplos' && a.personaje.mundo ? `Me lo quiero imaginar en mi mundo, ${a.personaje.mundo}. ${pregunta}` : pregunta;
    apoyo.pista = pregunta;
  }
  return { turno: apoyo, fuente: 'local' };
}

export function anotar(a, envio, { turno, fuente }) {
  if (a.notas.length !== envio.paso - 1 || envio.paso > PASOS) return false;
  a.notas.push({ idea: envio.texto, intento: turno.intento, fuente, paso: envio.paso });
  return true;
}
