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
export const ZONAS = ['cabeza', 'pelo', 'cara', 'cuello', 'cuerpo', 'espalda', 'mano', 'aura'];
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
      nombre: { type: 'string' }, mundo: { type: 'string' }, de: { type: 'string' },
      personalidad: { type: 'string' }, mision: { type: 'string' }, saludo: { type: 'string' },
      forma: { type: 'string', enum: Object.keys(FORMAS) }, color: { type: 'string', enum: COLORES }, numero: { type: 'integer' },
      ojos: { type: 'string', enum: Object.keys(OJOS) }, boca: { type: 'string', enum: Object.keys(BOCAS) },
      marcas: { type: 'string', enum: Object.keys(MARCAS) }, panza: { type: 'boolean' },
      fases: { type: 'array', minItems: FASES, maxItems: FASES, items: fase }
    },
    required: ['nombre', 'mundo', 'de', 'personalidad', 'mision', 'saludo', 'forma', 'color', 'ojos', 'boca', 'marcas', 'panza', 'fases']
  };
}

// Respuesta de la IA (ya con la forma del esquema, pero sin confiar en ella) → aprendín listo para dibujar.
export function armarAprendin(r = {}, { gustos = '', tema = '' } = {}) {
  const nombre = txt(r.nombre, 14) || 'Aprendín';
  const base = { nombre, forma: r.forma, color: r.color, numero: r.numero, rasgos: { ojos: r.ojos, boca: r.boca, marcas: r.marcas, panza: r.panza } };
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
    fases.push({ titulo: txt(f.titulo, 24) || NOMBRES_NIVEL[i], concepto: i ? txt(f.concepto, 70) : '', look: normalizarLook({ ...base, color: colorCuerpo, piezas: { ...piezas } }) });
  }
  return {
    nombre, mundo: txt(r.mundo, 40), de: txt(r.de, 50) || 'de muy lejos',
    personalidad: txt(r.personalidad, 160), mision: txt(r.mision, 240), saludo: txt(r.saludo, 200) || `¡Hola! Soy ${nombre}. ¿Me enseñas?`,
    gustos: txt(gustos, 160), tema: txt(tema, 80), fases
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

export function crearLocal(gustos = '', tema = '') {
  const pal = palabrasDe(gustos), azar = azarCon(norm(gustos) + '|' + norm(tema));
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
  const orden = [[], ['cabeza', 'pelo'], ['mano'], ['cara', 'cuello', 'cuerpo'], ['espalda', 'aura']];
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
  return armarAprendin(r, { gustos, tema });
}
