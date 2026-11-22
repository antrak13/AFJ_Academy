// Un turno de la clase: el estudiante le explica algo al aprendín y la IA responde en su papel.
// Además, sin que el aprendín lo diga, evalúa la explicación (estado, nota y pista).
// Sirve en el navegador y en Node.
import { EMO_IDS } from './aprendin.js';

export const ESTADOS = {
  empezando: 'Recién empieza',
  vago: 'Explicación vaga',
  parcial: 'Va bien, falta algo',
  error: 'Enseñó algo incorrecto',
  entendio: '¡Lo entendió!'
};
export const PASOS = 4;        // conceptos del tema (fases 1 a 4)
export const MIN_TURNOS = 2;   // mensajes del estudiante antes de poder pasar de paso

const txt = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function esquemaTurno() {
  const s = d => ({ type: 'string', description: d });
  return {
    type: 'object',
    properties: {
      dice: s('Lo que responde el aprendín, en su papel, máximo 45 palabras'),
      emocion: { type: 'string', enum: EMO_IDS },
      intento: s('Si intenta aplicar lo aprendido: su cuenta o su respuesta, corta, como la escribiría en su cuaderno (vacío si no)'),
      estado: { type: 'string', enum: Object.keys(ESTADOS) },
      nota: s('Para el profesor: qué explicó bien, qué falta o qué está mal, máximo 25 palabras'),
      pista: s('Consejo para el estudiante sobre cómo enseñar mejor este paso, máximo 18 palabras'),
      siguiente: s('Solo si el estado es entendio y hay otro paso: la pregunta con la que el aprendín abre el siguiente paso, máximo 35 palabras')
    },
    required: ['dice', 'emocion', 'estado', 'nota', 'pista']
  };
}

export function limpiarTurno(r = {}, { turnos = 1, hayOtro = true } = {}) {
  let estado = ESTADOS[r.estado] ? r.estado : 'parcial';
  if (estado === 'entendio' && turnos < MIN_TURNOS) estado = 'parcial';
  return {
    dice: txt(r.dice, 400) || 'Mmm… ¿me lo explicas con un ejemplo?',
    emocion: EMO_IDS.includes(r.emocion) ? r.emocion : (estado === 'entendio' ? 'eureka' : 'curioso'),
    intento: txt(r.intento, 120), estado, nota: txt(r.nota, 220), pista: txt(r.pista, 160),
    siguiente: estado === 'entendio' && hayOtro ? txt(r.siguiente, 300) : ''
  };
}

// Lo que el servidor necesita saber del aprendín (sin el dibujo).
export function resumenAprendin(a = {}) {
  return { nombre: txt(a.nombre, 20), mundo: txt(a.mundo, 50), de: txt(a.de, 60), personalidad: txt(a.personalidad, 200), mision: txt(a.mision, 260), tema: txt(a.tema, 80), inspiracion: txt(a.inspiracion, 60), conceptos: (Array.isArray(a.conceptos) ? a.conceptos : (a.fases || []).slice(1).map(f => f.concepto)).slice(0, PASOS).map(c => txt(c, 80)) };
}
export function limpiarHistorial(h) {
  return (Array.isArray(h) ? h : []).slice(-12).map(m => ({ de: m?.de === 'yo' ? 'yo' : 'apr', texto: txt(m?.texto, 600) })).filter(m => m.texto);
}

// Primera pregunta de un paso, sin IA.
export function preguntaInicial(a, paso) {
  const c = a.fases?.[paso]?.concepto || 'lo primero';
  const minus = c.charAt(0).toLowerCase() + c.slice(1);
  return paso === 1
    ? `Para mi misión primero necesito entender esto: ${minus}. ¿Me lo explicas como si no supiera nada?`
    : `Siguiente paso: ${minus}. ¿Cómo funciona? Explícamelo con algo de mi mundo.`;
}

// Sin evaluación de IA, el docente del aprendín decide cuándo dio una explicación y un ejemplo.
export function turnoLocal(a, paso, mensajes) {
  const m = txt(mensajes.at(-1), 600);
  const completa = texto => texto.match(/[\p{L}\p{N}]+/gu)?.length >= 6;
  const anteriores = new Set(mensajes.slice(0, -1).map(s => txt(s, 600).toLowerCase()).filter(completa));
  const primera = (m.split(/(?<=[.!?])\s+/)[0] || m).slice(0, 140);
  const concepto = a.fases?.[paso]?.concepto || a.tema;
  if (!completa(m)) return { dice: `Mmm… ¿me explicas «${concepto}» con un poco más de detalle?`, emocion: 'curioso', estado: 'vago', nota: 'Respuesta muy corta.', pista: 'Cuéntale la idea y di por qué funciona.' };
  if (!anteriores.size || anteriores.has(m.toLowerCase())) return { dice: `Anoté «${primera}». ¿Me das un ejemplo distinto que pueda usar en mi misión?`, emocion: 'pensando', estado: 'parcial', nota: 'Modo práctica. Falta confirmar un ejemplo.', pista: 'Dale un caso concreto de su mundo.' };
  return { dice: 'Ya tengo tus dos explicaciones. Si la segunda muestra cómo aplicar la idea, ¿guardamos la ficha y seguimos?', emocion: 'curioso', estado: 'parcial', nota: 'Modo práctica. Tú decides cuándo guardar la ficha.', pista: 'Comprueba que tu ejemplo muestre por qué funciona la idea.', puedeConfirmar: true };
}
