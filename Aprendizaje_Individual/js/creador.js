// Crear aprendines a partir de los gustos del estudiante y del tema que le va a enseñar.
//   esquemaAprendin()  → el JSON Schema que se le pide a la IA (las piezas solo pueden salir del catálogo)
//   armarAprendin(r)   → valida la respuesta y arma las 5 fases (cada fase suma piezas a la anterior)
//   crearLocal(g, t)   → un aprendín armado sin IA, buscando en las descripciones del catálogo
//   fasesDesdeLook(l)  → fases para un look ya armado (mundos de ejemplo, editor)
// Sirve en el navegador y en el servidor (Node), por eso no toca el DOM.
import { FORMAS, OJOS, BOCAS, MARCAS, normalizarLook } from './aprendin.js';
import { PIEZAS, NIVELES, NOMBRES_NIVEL } from './piezas.js';
import { PALETA } from './color.js';
import { NOMBRES } from './mundos.js';

export const FASES = 5;
export const ZONAS = ['cabeza', 'pelo', 'cara', 'cuello', 'cuerpo', 'brazos', 'espalda', 'mano', 'aura'];
const COLORES = Object.keys(PALETA);
const txt = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function esquemaAprendin() {
  const colorPieza = { type: 'string', enum: [...COLORES, 'cuerpo'] };
  const pieza = z => ({ type: 'object', properties: { id: { type: 'string', enum: Object.keys(PIEZAS[z]) }, color1: colorPieza, color2: colorPieza }, required: ['id'] });
  const fase = {
    type: 'object',
    properties: {
      titulo: { type: 'string', description: 'Nombre de la fase, 1 a 3 palabras, con el lenguaje de su mundo' },
      concepto: { type: 'string', description: 'Lo que aprendió para llegar a esta fase (vacío en la fase 0), máximo 7 palabras' },
      agrega: { type: 'object', description: 'Piezas que gana en esta fase (o que cambia)', properties: Object.fromEntries(ZONAS.map(z => [z, pieza(z)])) },
      color: { type: 'string', enum: COLORES, description: 'Solo en la última fase y solo si su transformación cambia el color del cuerpo' }
    },
    required: ['titulo', 'concepto', 'agrega']
  };
  return {
    type: 'object',
    properties: {
      inspiracion: { type: 'string', description: 'En qué se inspira su look (un estilo, un personaje o un equipo que nombró el estudiante), máximo 6 palabras' },
      nombre: { type: 'string' }, mundo: { type: 'string' }, de: { type: 'string' },
      personalidad: { type: 'string' }, mision: { type: 'string' }, saludo: { type: 'string' },
      forma: { type: 'string', enum: Object.keys(FORMAS) }, color: { type: 'string', enum: COLORES }, numero: { type: 'integer' },
      ojos: { type: 'string', enum: Object.keys(OJOS) }, boca: { type: 'string', enum: Object.keys(BOCAS) },
      marcas: { type: 'string', enum: Object.keys(MARCAS) }, panza: { type: 'boolean' }, pies: { type: 'string', enum: COLORES, description: 'Color de los pies (zapatos o botas de su disfraz)' },
      fases: { type: 'array', minItems: FASES, maxItems: FASES, items: fase }
    },
    required: ['inspiracion', 'nombre', 'mundo', 'de', 'personalidad', 'mision', 'saludo', 'forma', 'color', 'ojos', 'boca', 'marcas', 'panza', 'pies', 'fases']
  };
}

// Respuesta de la IA (ya con la forma del esquema, pero sin confiar en ella) → aprendín listo para dibujar.
export function armarAprendin(r = {}, { gustos = '', tema = '', detalles = [] } = {}) {
  const nombre = txt(r.nombre, 14) || 'Aprendín';
  const base = { nombre, forma: r.forma, color: r.color, numero: r.numero, rasgos: { ojos: r.ojos, boca: r.boca, marcas: r.marcas, panza: r.panza, pies: r.pies } };
  const entrada = Array.isArray(r.fases) ? r.fases.slice(0, FASES) : [];
  const piezas = {}, fases = [];
  let colorCuerpo = base.color;
  for (let i = 0; i < FASES; i++) {
    const f = entrada[i] || {};
    for (const z of ZONAS) {
      const a = f.agrega?.[z];
      if (a && PIEZAS[z][a.id]) piezas[z] = { id: a.id, colores: [a.color1 || undefined, a.color2 || undefined] };
    }
    if (i === FASES - 1 && f.color && PALETA[f.color]) colorCuerpo = f.color;
    fases.push({ titulo: txt(f.titulo, 32) || NOMBRES_NIVEL[i], concepto: i ? txt(f.concepto, 70) : '', look: normalizarLook({ ...base, color: colorCuerpo, piezas: { ...piezas } }) });
  }
  return {
    nombre, inspiracion: txt(r.inspiracion, 60), mundo: txt(r.mundo, 40), de: txt(r.de, 50) || 'de muy lejos',
    personalidad: txt(r.personalidad, 160), mision: txt(r.mision, 240), saludo: txt(r.saludo, 200) || `¡Hola! Soy ${nombre}. ¿Me enseñas?`,
    gustos: txt(gustos, 160), tema: txt(tema, 80), detalles: limpiarDetalles(detalles), fases
  };
}

// Respuestas a las preguntas previas: [{ pregunta, respuesta }] (cortas y sin vacíos)
export function limpiarDetalles(ds) {
  return (Array.isArray(ds) ? ds : []).slice(0, 4).map(d => ({ pregunta: txt(d?.pregunta, 120), respuesta: txt(d?.respuesta, 100) })).filter(d => d.pregunta && d.respuesta);
}

/* ---------- Preguntas antes de crear ---------- */
export function esquemaPreguntas() {
  return {
    type: 'object',
    properties: {
      entendi: { type: 'string', description: 'Una oración corta que resume lo que entendiste de sus gustos y del tema' },
      preguntas: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'object', properties: {
        pregunta: { type: 'string' }, opciones: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } }
      }, required: ['pregunta', 'opciones'] } }
    },
    required: ['entendi', 'preguntas']
  };
}
export function limpiarPreguntas(r = {}) {
  const preguntas = (Array.isArray(r.preguntas) ? r.preguntas : []).slice(0, 3)
    .map(q => ({ pregunta: txt(q?.pregunta, 120), opciones: (Array.isArray(q?.opciones) ? q.opciones : []).map(o => txt(o, 40)).filter(Boolean).slice(0, 5) }))
    .filter(q => q.pregunta && q.opciones.length >= 2);
  return { entendi: txt(r.entendi, 200), preguntas };
}
// Preguntas sin IA: algo concreto de sus gustos, qué parte del tema y cómo quiere que sea.
export function preguntasLocales(gustos = '', tema = '') {
  const g = norm(gustos), t = txt(tema, 60) || 'el tema';
  const ideas = [
    [/anime|manga|otaku/, ['Dragon Ball', 'Naruto', 'One Piece', 'Demon Slayer']],
    [/futbol|soccer/, ['La selección de Bolivia', 'Argentina', 'Real Madrid', 'Barcelona']],
    [/basquet|baloncesto|nba/, ['Lakers', 'Golden State', 'Chicago Bulls', 'Miami Heat']],
    [/videojuego|gamer|juego|minecraft|roblox/, ['Minecraft', 'Fortnite', 'Pokémon', 'Mario']],
    [/heroe|marvel|dc|comic/, ['Spider-Man', 'Batman', 'Iron Man', 'Wonder Woman']],
    [/musica|cantar|banda|rap|kpop/, ['K-pop', 'Reguetón', 'Rock', 'Folklore boliviano']],
    [/animal|gato|perro|mascota|dinosaurio/, ['Gatos', 'Perros', 'Dinosaurios', 'Dragones']],
    [/cocin|comida|reposter/, ['Repostería', 'Comida de la abuela', 'Comida rápida', 'Chef de televisión']]
  ];
  const op = (ideas.find(([re]) => re.test(g)) || [null, ['Ninguno en especial']])[1];
  return {
    entendi: `Te gusta ${txt(gustos, 80) || 'algo especial'} y le vas a enseñar ${t}.`,
    preguntas: [
      { pregunta: '¿Hay algún personaje, equipo o estilo que te guste mucho?', opciones: op },
      { pregunta: `¿Qué parte de ${t} te cuesta más?`, opciones: ['Entender qué es', 'Hacer los ejercicios', 'Usarlo en problemas', 'Todo un poco'] },
      { pregunta: '¿Cómo quieres que sea tu aprendín?', opciones: ['Travieso', 'Tímido', 'Competitivo', 'Muy curioso', 'Dormilón'] }
    ]
  };
}

// Fases para un look completo: cada nivel muestra las zonas de NIVELES.
export function fasesDesdeLook(look, titulos = NOMBRES_NIVEL) {
  const l = normalizarLook(look);
  return NIVELES.map((zs, i) => ({ titulo: titulos[i], concepto: '', look: { ...l, piezas: Object.fromEntries(Object.entries(l.piezas).filter(([z]) => zs.includes(z))) } }));
}

/* ---------- Creador local (sin IA) ---------- */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const palabrasDe = s => norm(s).split(/[^a-z0-9ñ]+/).filter(w => w.length > 2 && !['para', 'con', 'los', 'las', 'del', 'que', 'una', 'uno', 'mis', 'muy', 'mucho', 'gusta', 'gustan', 'jugar', 'ver'].includes(w));
const parecidas = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b.slice(0, 5)) || b.startsWith(a.slice(0, 5))));
function azarCon(semilla) {
  let h = 2166136261; for (const c of semilla) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

export function crearLocal(gustos = '', tema = '', detalles = []) {
  const extra = limpiarDetalles(detalles).map(d => d.respuesta).join(' ');
  const pal = palabrasDe(`${gustos} ${extra}`), azar = azarCon(norm(gustos) + '|' + norm(tema));
  const elegir = xs => xs[Math.floor(azar() * xs.length)];
  // mejor pieza de cada zona según cuántas palabras de los gustos aparecen en su descripción
  const mejor = {};
  for (const z of ZONAS) {
    let top = null, topS = 0;
    for (const [id, p] of Object.entries(PIEZAS[z])) {
      const desc = palabrasDe(`${p.desc} ${p.nombre}`);
      const s = pal.reduce((acc, w) => acc + (desc.some(d => parecidas(w, d)) ? 1 : 0), 0) + azar() * .1;
      if (s > topS) { top = id; topS = s; }
    }
    if (topS >= 1) mejor[z] = top;
  }
  if (!mejor.mano) mejor.mano = elegir(Object.keys(PIEZAS.mano));
  if (!mejor.aura) mejor.aura = 'chispas';
  if (mejor.cabeza && mejor.pelo) delete mejor.pelo;
  const orden = [[], ['cabeza', 'pelo'], ['mano'], ['cara', 'cuello', 'cuerpo', 'brazos'], ['espalda', 'aura']];
  const gusto = txt(gustos.split(/,|;| y /)[0], 30) || 'su mundo';
  const nombre = elegir(NOMBRES), t = txt(tema, 80) || 'algo nuevo';
  const conceptos = ['', `Qué es ${t}`, 'Cómo se hace, paso a paso', 'Un ejemplo de su mundo', 'Resolverlo sin ayuda'];
  const r = {
    nombre, mundo: gusto, de: `del mundo de ${gusto.toLowerCase()}`,
    personalidad: 'Curioso, distraído y con muchas ganas de aprender.',
    mision: `${nombre} quiere entender ${t} para usarlo en el mundo de ${gusto.toLowerCase()}, pero todavía no sabe nada.`,
    saludo: `¡Hola! Soy ${nombre}. Me encanta ${gusto.toLowerCase()}… pero de ${t} no sé nada. ¿Me enseñas?`,
    forma: elegir(Object.keys(FORMAS)), color: elegir(COLORES.filter(c => c !== 'carbon' && c !== 'nieve')), numero: 1 + Math.floor(azar() * 30),
    ojos: elegir(Object.keys(OJOS)), boca: elegir(Object.keys(BOCAS)), marcas: elegir(Object.keys(MARCAS)), panza: azar() < .5,
    fases: orden.map((zs, i) => ({ titulo: NOMBRES_NIVEL[i], concepto: conceptos[i], agrega: Object.fromEntries(zs.filter(z => mejor[z]).map(z => [z, { id: mejor[z] }])) }))
  };
  return armarAprendin(r, { gustos, tema, detalles });
}
