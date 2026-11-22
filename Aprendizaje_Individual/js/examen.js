// La prueba de la misión: un examen que el estudiante y su aprendín responden juntos.
// En cada pregunta el aprendín propone una respuesta y dice cómo lo pensó; el estudiante decide.
// El aprendín se equivoca (cae en la trampa) en los pasos que le enseñaste con menos claridad,
// así que lo que mediste en la clase se nota en la prueba. Sirve en el navegador y en Node.
import { esquemaFicha, limpiarFicha } from './fichas.js';
import { PASOS } from './turno.js';

export const PREGUNTAS = 5;
export const APRUEBA = 3;          // respuestas correctas del equipo para aprobar
const txt = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Los nombres van en orden alfabético a propósito: así la IA piensa la solución antes de marcar la respuesta.
export function esquemaExamen() {
  const s = d => ({ type: 'string', description: d });
  const visual = { ...esquemaFicha().properties.visual, description: 'Solo si la pregunta necesita un dibujo (por ejemplo, «¿qué fracción está pintada?» o leer un gráfico). Nunca muestra la respuesta.' };
  return {
    type: 'object',
    properties: {
      titulo: s('Nombre del desafío de su misión, máximo 6 palabras'),
      intro: s('Lo que dice el aprendín al empezar: la prueba de su misión, que la hagan juntos, máximo 30 palabras'),
      preguntas: {
        type: 'array', minItems: PREGUNTAS, maxItems: PREGUNTAS,
        items: {
          type: 'object',
          properties: {
            enunciado: s('La pregunta, dentro de una situación de su misión, máximo 40 palabras'),
            opciones: { type: 'array', minItems: 4, maxItems: 4, items: s('Opción corta, máximo 12 palabras') },
            paso: { type: 'integer', description: 'Qué paso del tema evalúa (1 a 4)' },
            por_que: s('Por qué la respuesta correcta es la correcta, máximo 35 palabras'),
            resolucion: s('La solución paso a paso, máximo 40 palabras'),
            respuesta: { type: 'integer', description: 'Índice de la opción correcta (0 a 3), igual a lo que da la resolución' },
            trampa: { type: 'integer', description: 'Índice de la opción a la que se llega con el error típico de ese paso (distinto de respuesta)' },
            visual,
            voz_acierto: s('Cómo razona el aprendín para llegar a la respuesta correcta, en primera persona, máximo 30 palabras'),
            voz_trampa: s('Cómo razona el aprendín cuando cae en la trampa, en primera persona y convencido, máximo 30 palabras')
          },
          required: ['enunciado', 'opciones', 'paso', 'por_que', 'resolucion', 'respuesta', 'trampa', 'voz_acierto', 'voz_trampa']
        }
      }
    },
    required: ['titulo', 'intro', 'preguntas']
  };
}

// Mezcla las opciones (la IA tiende a poner la correcta siempre en el mismo lugar) y valida los índices.
function azar(semilla) { let h = 2166136261; for (const c of semilla) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; }; }
export function limpiarExamen(r = {}) {
  const preguntas = (Array.isArray(r.preguntas) ? r.preguntas : []).slice(0, PREGUNTAS).map((q, k) => {
    const ops = (Array.isArray(q?.opciones) ? q.opciones : []).map(o => txt(o, 90)).filter(Boolean).slice(0, 4);
    if (ops.length < 2) return null;
    let resp = Number.isInteger(q.respuesta) && q.respuesta >= 0 && q.respuesta < ops.length ? q.respuesta : 0;
    let trampa = Number.isInteger(q.trampa) && q.trampa >= 0 && q.trampa < ops.length && q.trampa !== resp ? q.trampa : (resp + 1) % ops.length;
    const rnd = azar(`${q.enunciado}|${k}`), orden = ops.map((_, i) => i).sort(() => rnd() - .5);
    let visual = null;
    if (q.visual?.tipo) { visual = limpiarFicha({ visual: q.visual }).visual; if (visual.tipo === 'fraccion') visual.ocultarNumeros = true; }
    return {
      paso: Math.max(1, Math.min(PASOS, parseInt(q.paso, 10) || 1)), enunciado: txt(q.enunciado, 280),
      opciones: orden.map(i => ops[i]), respuesta: orden.indexOf(resp), trampa: orden.indexOf(trampa),
      por_que: txt(q.por_que, 260), resolucion: txt(q.resolucion, 300), visual,
      voz_acierto: txt(q.voz_acierto, 220), voz_trampa: txt(q.voz_trampa, 220)
    };
  }).filter(Boolean);
  return { titulo: txt(r.titulo, 60) || 'La prueba de la misión', intro: txt(r.intro, 240), preguntas };
}

// ¿En qué pasos quedó floja la enseñanza? Errores, explicaciones vagas o muchos intentos.
export function pasosDebiles(medicion = {}) {
  const fuerza = {};
  for (let p = 1; p <= PASOS; p++) {
    const ts = medicion[p]?.turnos || [];
    const errores = ts.filter(t => t.estado === 'error').length, vagos = ts.filter(t => t.estado === 'vago').length;
    fuerza[p] = ts.length ? Math.max(0, 1 - errores * .45 - vagos * .25 - Math.max(0, ts.length - 3) * .15) : .5;
  }
  return fuerza;
}
// Decide en qué preguntas cae el aprendín: donde la enseñanza fue más floja. Siempre al menos 1 y como mucho 3,
// para que haya momentos en que el estudiante tenga que salvarlo.
export function decidirFallas(examen, medicion) {
  const f = pasosDebiles(medicion), qs = examen.preguntas;
  const orden = qs.map((q, i) => ({ i, f: f[q.paso] ?? .5 })).sort((a, b) => a.f - b.f || b.i - a.i);
  const fallas = new Set(orden.filter(x => x.f < .6).slice(0, 3).map(x => x.i));
  if (!fallas.size && orden.length) fallas.add(orden[0].i);
  return qs.map((_, i) => fallas.has(i));
}

// Examen sin IA, armado con sus fichas: la idea de cada paso y el resultado de sus ejemplos.
export function examenLocal(a, fichas = {}) {
  const fs = Object.entries(fichas).filter(([, f]) => f?.datos).map(([p, f]) => ({ paso: Number(p), ...f.datos }));
  const preguntas = [];
  const relleno = ['Depende del día', 'No tiene nada que ver con el tema', 'Siempre da cero'];
  const otras = (lista, correcta) => [...new Set([...lista, ...relleno])].filter(x => x !== correcta).slice(0, 3);
  const ideas = fs.map(f => f.idea).filter(Boolean), res = fs.map(f => f.ejemplo?.resultado).filter(Boolean);
  // primero una pregunta de idea por paso (así cubre los 4) y después los ejemplos
  fs.forEach(f => {
    if (f.idea) preguntas.push({ paso: f.paso, enunciado: `¿Qué es lo más importante de «${f.titulo}»?`, opciones: [f.idea, ...otras(ideas, f.idea)], respuesta: 0, trampa: 1, por_que: f.idea, resolucion: '', voz_acierto: 'Creo que es esta: es justo lo que anoté en mi ficha.', voz_trampa: 'Creo que es esta… me suena de mi cuaderno, aunque no sé si de este paso.' });
  });
  fs.forEach(f => {
    if (f.ejemplo?.situacion && f.ejemplo?.resultado) preguntas.push({ paso: f.paso, enunciado: f.ejemplo.situacion, opciones: [f.ejemplo.resultado, ...otras(res, f.ejemplo.resultado)], respuesta: 0, trampa: 1, por_que: (f.ejemplo.pasos || []).join(' · ') || f.idea, resolucion: '', voz_acierto: 'Este lo resolví en mi ficha, creo que da esto.', voz_trampa: 'Mmm, creo que da esto… lo hice rápido.' });
  });
  return limpiarExamen({ titulo: 'La prueba de la misión', intro: `¡Llegó la prueba de mi misión! ¿La respondemos juntos? Yo te digo lo que pienso y tú decides.`, preguntas: preguntas.slice(0, PREGUNTAS) });
}
