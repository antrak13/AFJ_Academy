// Fichas: lo que el aprendín anota cuando entiende un paso del tema que le enseñaste.
// La IA no dibuja la ficha: elige qué tipo de visual explica mejor la idea y le da los datos;
// este archivo la dibuja (HTML + SVG) y la anima. Sirve en el navegador y en Node (no toca el DOM).
//   esquemaFicha()  → JSON Schema que se le pide a la IA
//   limpiarFicha(r) → valida y corrige (por ejemplo, las cuentas de fracciones)
//   htmlFicha(f, ctx) → la tarjeta completa · htmlVisual(v) → solo el visual
//   fichaLocal(...)  → una ficha sencilla sin IA

export const TIPOS = {
  pasos: 'Pasos de un proceso o procedimiento, en orden',
  ciclo: 'Un ciclo que se repite (ciclo del agua, de la vida, de una rutina)',
  partes: 'Una idea central y sus partes o características (mapa de conceptos, partes de la célula)',
  comparar: 'Dos cosas lado a lado: antes y después, error y acierto, A contra B',
  barras: 'Comparar cantidades con barras',
  torta: 'Partes de un total en porcentajes o proporciones',
  fraccion: 'Fracciones dibujadas como pizzas o barras, con suma, resta o equivalencia',
  recta: 'Recta numérica con puntos y saltos (enteros, sumas, desigualdades, decimales)',
  linea_tiempo: 'Hechos en orden en el tiempo (historia, etapas)',
  ecuacion: 'Una cuenta o ecuación resuelta paso a paso, con lo que se hizo en cada línea',
  tabla: 'Una tabla de datos o de clasificación',
  grafico: 'Puntos en un plano x-y unidos por una línea (funciones, algo que cambia con el tiempo)',
  iconos: 'Cantidades dibujadas con íconos repetidos (contar, multiplicar, repartir)'
};
export const NOMBRES_VISUAL = {
  pasos: 'Paso a paso', ciclo: 'Ciclo', partes: 'Mapa de partes', comparar: 'Comparación',
  barras: 'Barras', torta: 'Torta', fraccion: 'Fracciones', recta: 'Recta numérica',
  linea_tiempo: 'Línea de tiempo', ecuacion: 'Ecuación', tabla: 'Tabla', grafico: 'Gráfico', iconos: 'Íconos'
};
const OPERACIONES = ['ninguna', 'suma', 'resta', 'igual', 'compara'];

/* ================= Esquema para la IA ================= */
export function esquemaFicha() {
  const s = d => ({ type: 'string', description: d });
  const icoDesc = 'Nombre corto de ícono sin emoji (uno de: libro, chispa, pasos, ciclo, mapa, balanza, reloj, grafico, tabla, recta, pelota, cocina, agua, hoja, energia, escudo, meta, moneda, bloque, cohete, musica, lupa, check, cruz, alerta, diamante, idea)';
  const item = { type: 'object', properties: { texto: s('Texto corto (máximo 6 palabras)'), detalle: s('Detalle opcional (máximo 12 palabras)'), icono: s(icoDesc), valor: { type: 'number', description: 'Número, si el visual lo usa (barras, torta, iconos)' }, fecha: s('Fecha o año (solo línea de tiempo)') }, required: ['texto'] };
  const lado = { type: 'object', properties: { titulo: s('Título corto'), icono: s(icoDesc), puntos: { type: 'array', maxItems: 4, items: s('Máximo 8 palabras') } }, required: ['titulo', 'puntos'] };
  return {
    type: 'object',
    properties: {
      titulo: s('Título de la ficha, máximo 6 palabras'),
      icono: s(icoDesc + ' que represente la idea'),
      idea: s('Una sola regla o idea en términos del tema, sin personajes ni metáforas, máximo 35 palabras'),
      visual: {
        type: 'object', description: 'El visual que mejor muestra la idea. Llena solo los campos de su tipo.',
        properties: {
          tipo: { type: 'string', enum: Object.keys(TIPOS) },
          titulo: s('Lo que muestra el visual, máximo 8 palabras'),
          items: { type: 'array', maxItems: 8, items: item, description: 'pasos, ciclo, partes, barras, torta, linea_tiempo, iconos' },
          centro: s('Idea central (partes) o lo que gira (ciclo)'),
          izquierda: lado, derecha: lado,
          fracciones: { type: 'array', maxItems: 4, items: { type: 'object', properties: { num: { type: 'integer' }, den: { type: 'integer' }, etiqueta: s('Qué representa, máximo 4 palabras') }, required: ['num', 'den'] } },
          operacion: { type: 'string', enum: OPERACIONES, description: 'Entre las fracciones: suma (a + b = resultado), resta, igual (equivalentes), compara (cuál es mayor) o ninguna' },
          forma: { type: 'string', enum: ['pizza', 'barra'] },
          min: { type: 'number' }, max: { type: 'number' },
          marcas: { type: 'array', maxItems: 6, items: { type: 'object', properties: { valor: { type: 'number' }, texto: s('Etiqueta corta') }, required: ['valor'] }, description: 'Puntos etiquetados del eje, independientes del recorrido' },
          saltos: { type: 'boolean', description: 'Dibujar saltos entre marcas seguidas (para sumas y restas en la recta)' },
          recorrido: { type: 'array', maxItems: 6, items: { type: 'number' }, description: 'Con saltos, coordenadas que visita el personaje en orden de ejecución, incluyendo origen y destino. Para −3 − 2 es [-3, -5]. No ordenar de menor a mayor ni incluir marcas del eje que no visite.' },
          lineas: { type: 'array', maxItems: 6, items: { type: 'object', properties: { expresion: s('Una línea de la cuenta, por ejemplo 2x + 3 = 11'), nota: s('Qué se hizo, máximo 6 palabras') }, required: ['expresion'] } },
          columnas: { type: 'array', maxItems: 4, items: s('Encabezado') },
          filas: { type: 'array', maxItems: 6, items: { type: 'array', maxItems: 4, items: { type: 'string' } } },
          ejeX: s('Nombre del eje x'), ejeY: s('Nombre del eje y'),
          puntos: { type: 'array', maxItems: 10, items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, texto: s('Etiqueta opcional') }, required: ['x', 'y'] } },
          unidad: s('Unidad de los valores (Bs, %, goles…)')
        },
        required: ['tipo', 'titulo']
      },
      ejemplo: {
        type: 'object', description: 'Un solo caso concreto, coherente con el visual y con la idea clave',
        properties: {
          situacion: s('Contexto y datos del caso, máximo 30 palabras. Si hay pregunta aparte, no la repitas aquí.'),
          pregunta: s('Pregunta breve y sin respuesta. En un reto es obligatoria.'),
          puente: s('Opcional. Si hay analogía o cambio de representación, indica qué representa cada elemento relevante. Máximo 24 palabras.'),
          pasos: { type: 'array', minItems: 1, maxItems: 4, items: s('Una acción o deducción, máximo 14 palabras. No repitas los datos de partida.') },
          resultado: s('La respuesta, con su unidad si aplica, máximo 12 palabras')
        },
        required: ['situacion', 'pasos', 'resultado']
      },
      cuidado: s('Opcional. Aclara un error concreto sin repetir la idea clave, máximo 25 palabras'),
      de_ti: s('Opcional. Una frase correcta que el estudiante sí dijo, citada o resumida, máximo 20 palabras')
    },
    required: ['titulo', 'icono', 'idea', 'visual', 'ejemplo']
  };
}

export function esquemaFichaInicio({ reto = false } = {}) {
  const base = esquemaFicha();
  const { de_ti, ...propiedades } = base.properties;
  const s = d => ({ type: 'string', description: d });
  return {
    type: 'object',
    properties: {
      ...propiedades,
      ...(reto ? { ejemplo: { ...base.properties.ejemplo, required: [...base.properties.ejemplo.required, 'pregunta'] } } : {}),
      subtema: s('Qué parte específica del tema cubre esta ficha, máximo 5 palabras'),
      adaptacion: s('Una oración corta explicando por qué elegiste este enfoque y visual para el estudiante')
    },
    required: [...base.required, 'subtema', 'adaptacion']
  };
}

/* ================= Limpieza ================= */
const txt = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const num = (v, def = 0) => {
  const x = typeof v === 'number' || (typeof v === 'string' && v.trim()) ? Number(v) : NaN;
  return Number.isFinite(x) ? x : def;
};
const emoji = v => txt(v, 28);
const mcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const esCuentaFraccion = op => op === 'suma' || op === 'resta';
const mismoValor = (a, b) => a.num * b.den === b.num * a.den;
const fraccionValida = f => Number.isInteger(f?.num) && Math.abs(f.num) <= 1_000_000 &&
  Number.isInteger(f?.den) && f.den >= 1 && f.den <= 10_000;
const OPERACION_ENTERA = /(?<![\d.,/])(-?\d+)\s*([+-])\s*\(?\s*(-?\d+)\s*\)?(?![\d.,/])/;
const IGUALDAD_ENTERA = new RegExp(`${OPERACION_ENTERA.source}\\s*=\\s*(-?\\d+)(?![\\d.,/])`);

function estudiarOperacionEntera(op) {
  if (!op) return null;
  const [, a, signo, b, r] = op;
  const inicio = Number(a), cambio = Number(b) * (signo === '-' ? -1 : 1), final = inicio + cambio;
  if (![inicio, cambio, final].every(n => Number.isSafeInteger(n) && Math.abs(n) <= 1_000_000)) return null;
  return { inicio, cambio, final, correcto: r === undefined || Number(r) === final, operacion: `${inicio} ${signo === '-' ? '−' : '+'} ${Number(b) < 0 ? `(${b})` : b}` };
}
const direccionEntera = cambio => cambio < 0 ? 'hacia la izquierda' : cambio > 0 ? 'hacia la derecha' : 'sin cambiar de posición';

function calcularFracciones(a, b, resta) {
  const den = a.den * b.den / mcd(a.den, b.den);
  const num = a.num * (den / a.den) + b.num * (den / b.den) * (resta ? -1 : 1);
  return { num, den };
}

export function limpiarFicha(r = {}) {
  const v = r.visual || {};
  const tipo = Object.hasOwn(TIPOS, v.tipo) ? v.tipo : 'pasos';
  const e = r.ejemplo || {};
  const operacion = tipo === 'recta' && v.saltos ? estudiarOperacionEntera(txt(e.resultado, 180).replaceAll('−', '-').match(IGUALDAD_ENTERA)) : null;
  const items = (Array.isArray(v.items) ? v.items : []).slice(0, 8).map(i => ({ texto: txt(i?.texto, 60), detalle: txt(i?.detalle, 100), icono: emoji(i?.icono), valor: num(i?.valor, NaN), fecha: txt(i?.fecha, 24) })).filter(i => i.texto);
  const lado = l => ({ titulo: txt(l?.titulo, 40), icono: emoji(l?.icono), puntos: (Array.isArray(l?.puntos) ? l.puntos : []).map(p => txt(p, 70)).filter(Boolean).slice(0, 4) });
  const vis = { tipo, titulo: txt(v.titulo, 70), items, centro: txt(v.centro, 50), unidad: txt(v.unidad, 12) };
  if (tipo === 'comparar') { vis.izquierda = lado(v.izquierda); vis.derecha = lado(v.derecha); }
  if (tipo === 'fraccion') {
    vis.fracciones = (Array.isArray(v.fracciones) ? v.fracciones : []).slice(0, 4).filter(fraccionValida)
      .map(f => ({ num: f.num, den: f.den, etiqueta: txt(f.etiqueta, 30) }));
    vis.operacion = OPERACIONES.includes(v.operacion) ? v.operacion : 'ninguna';
    vis.forma = v.forma === 'barra' ? 'barra' : 'pizza';
    corregirFracciones(vis);
  }
  if (tipo === 'recta') {
    const marcas = (Array.isArray(v.marcas) ? v.marcas : []).slice(0, 6).map(m => ({ valor: num(m?.valor, NaN), texto: txt(m?.texto, 24) })).filter(m => Number.isFinite(m.valor));
    let min = num(v.min, NaN), max = num(v.max, NaN);
    const recorrido = (Array.isArray(v.recorrido) ? v.recorrido : []).slice(0, 6).map(x => num(x, NaN)).filter(Number.isFinite);
    if (!recorrido.length && operacion?.correcto && operacion.cambio) recorrido.push(operacion.inicio, operacion.final);
    const vals = [...marcas.map(m => m.valor), ...recorrido];
    if (!Number.isFinite(min) || (vals.length && min > Math.min(...vals))) min = Math.floor(Math.min(0, ...vals) - 1);
    if (!Number.isFinite(max) || (vals.length && max < Math.max(...vals))) max = Math.ceil(Math.max(...vals, min + 5) + 1);
    if (max <= min) max = min + 10;
    Object.assign(vis, { marcas, min, max, saltos: !!v.saltos || recorrido.length >= 2, ...(recorrido.length >= 2 ? { recorrido } : {}) });
  }
  if (tipo === 'ecuacion') vis.lineas = (Array.isArray(v.lineas) ? v.lineas : []).slice(0, 6).map(l => ({ expresion: txt(l?.expresion, 60), nota: txt(l?.nota, 50) })).filter(l => l.expresion);
  if (tipo === 'tabla') {
    vis.columnas = (Array.isArray(v.columnas) ? v.columnas : []).slice(0, 4).map(c => txt(c, 30));
    vis.filas = (Array.isArray(v.filas) ? v.filas : []).slice(0, 6).map(f => (Array.isArray(f) ? f : []).slice(0, 4).map(c => txt(c, 40)));
  }
  if (tipo === 'grafico') {
    vis.puntos = (Array.isArray(v.puntos) ? v.puntos : []).slice(0, 10).map(p => ({ x: num(p?.x, NaN), y: num(p?.y, NaN), texto: txt(p?.texto, 20) })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((a, b) => a.x - b.x);
    vis.ejeX = txt(v.ejeX, 24); vis.ejeY = txt(v.ejeY, 24);
  }
  // si el tipo pedido quedó vacío, se convierte en pasos con lo que haya
  if (!visualTieneDatos(vis)) { vis.tipo = 'pasos'; if (!vis.items.length) vis.items = []; }
  const idea = operacion?.correcto && operacion.cambio
    ? `Para resolver ${operacion.operacion}, parte de ${operacion.inicio} y avanza ${Math.abs(operacion.cambio)} unidades ${direccionEntera(operacion.cambio)}. Llegas a ${operacion.final}.`
    : txt(r.idea, 260);
  return {
    titulo: txt(r.titulo, 60) || 'Lo que aprendí', icono: emoji(r.icono) || 'chispa', idea, visual: vis,
    ejemplo: {
      situacion: txt(e.situacion, 220), ...(e.pregunta ? { pregunta: txt(e.pregunta, 150) } : {}),
      ...(e.puente ? { puente: txt(e.puente, 170) } : {}),
      pasos: (Array.isArray(e.pasos) ? e.pasos : []).map(p => txt(p, 110)).filter(Boolean).slice(0, 4), resultado: txt(e.resultado, 100)
    },
    cuidado: txt(r.cuidado, 200), de_ti: txt(r.de_ti, 160).replace(/^[«"“']+|[»"”']+$/g, '').trim()
  };
}
export function limpiarFichaInicio(r = {}) {
  return {
    ...limpiarFicha(r),
    subtema: txt(r.subtema, 60) || txt(r.titulo, 60) || 'Concepto clave',
    adaptacion: txt(r.adaptacion, 180)
  };
}
function visualTieneDatos(v) {
  switch (v.tipo) {
    case 'comparar': return v.izquierda?.puntos.length && v.derecha?.puntos.length;
    case 'fraccion': return v.fracciones?.length;
    case 'recta': return v.marcas?.length || v.recorrido?.length;
    case 'ecuacion': return v.lineas?.length;
    case 'tabla': return v.filas?.length;
    case 'grafico': return v.puntos?.length >= 2;
    case 'barras': case 'torta': case 'iconos': return v.items.filter(i => Number.isFinite(i.valor)).length >= 1;
    default: return v.items.length >= 2;
  }
}
// La cuenta la hace el código: si la IA se equivocó en el resultado, se corrige.
function corregirFracciones(v) {
  const fs = v.fracciones;
  if (esCuentaFraccion(v.operacion) && fs.length >= 2) {
    const ok = { ...calcularFracciones(fs[0], fs[1], v.operacion === 'resta'), etiqueta: fs[2]?.etiqueta || 'Resultado' };
    if (fs.length < 3 || !mismoValor(fs[2], ok)) fs.splice(2, fs.length - 2, ok);
    else fs.length = 3;
  }
  if (v.operacion === 'igual' && fs.length >= 2 && fs.some(f => !mismoValor(f, fs[0]))) v.operacion = 'compara';
  if (v.operacion === 'compara') fs.length = Math.min(fs.length, 2);
}

// Comprueba lo que se puede verificar antes de servir una ficha generada.
export function revisarFichaGenerada(original = {}, { reto = false, ejemploAnterior = '' } = {}) {
  const errores = [];
  const ficha = limpiarFicha(original), v = ficha.visual;
  const crudo = original.visual || {}, e = ficha.ejemplo;
  if (!txt(original.titulo, 60) || !ficha.idea || !e.situacion || !e.resultado || !e.pasos.length) {
    errores.push('Completa la idea y un caso concreto con procedimiento y resultado.');
  }
  if (reto && !e.pregunta?.endsWith('?')) errores.push('Escribe una pregunta explícita en ejemplo.pregunta.');
  if (ejemploAnterior && normTxt(txt(e.situacion, 220)) === normTxt(txt(ejemploAnterior, 220))) {
    errores.push('Cambia la situación del ejemplo anterior y usa otros datos o un objeto distinto del mismo mundo.');
  }
  if (v.tipo !== crudo.tipo || !visualTieneDatos(v)) errores.push('Completa los datos del visual elegido.');
  if (crudo.tipo === 'fraccion') {
    const fs = Array.isArray(crudo.fracciones) ? crudo.fracciones : [];
    if (v.fracciones?.length !== fs.length || (crudo.operacion && v.operacion !== crudo.operacion)) {
      errores.push('Revisa la cantidad de fracciones, los denominadores y la operación del dibujo.');
    }
    if (['igual', 'compara'].includes(crudo.operacion) && fs.length < 2) errores.push('Incluye las dos fracciones que se comparan.');
    if (esCuentaFraccion(crudo.operacion) && fs.length >= 2 && fs.slice(0, 2).every(fraccionValida)) {
      const calculada = calcularFracciones(fs[0], fs[1], crudo.operacion === 'resta');
      if (!fraccionValida(fs[2]) || !mismoValor(fs[2], calculada)) errores.push('La tercera fracción del dibujo debe ser el resultado exacto de la operación.');
      const escrito = [...e.resultado.replaceAll('−', '-').matchAll(/(?:(-?\d+)\s+)?(-?\d+)\s*\/\s*(\d+)/g)].at(-1);
      if (escrito) {
        const entero = Number(escrito[1] || 0), den = Number(escrito[3]);
        const num = entero * den + Number(escrito[2]) * (entero < 0 ? -1 : 1);
        if (!den || !mismoValor({ num, den }, calculada)) errores.push('La fracción del resultado escrito debe coincidir con la del dibujo.');
      }
    }
  }
  if (v.tipo === 'recta' && v.saltos) {
    if (!Array.isArray(crudo.recorrido) || crudo.recorrido.length < 2 || !v.recorrido?.length) errores.push('Incluye el recorrido explícito en visual.recorrido, con origen y destino en orden de ejecución.');
    const op = estudiarOperacionEntera(e.resultado.replaceAll('−', '-').match(IGUALDAD_ENTERA));
    if (op && v.recorrido) {
      const inverso = v.recorrido.slice(1).some((x, i) => Math.sign(x - v.recorrido[i]) !== Math.sign(op.cambio));
      if (!op.correcto || v.recorrido[0] !== op.inicio || v.recorrido.at(-1) !== op.final || inverso) {
        errores.push(`La animación de ${op.operacion} debe empezar en ${op.inicio} y terminar en ${op.final}, siguiendo el sentido correcto.`);
      }
    }
  }
  if (v.tipo === 'torta' && v.unidad === '%' && Math.abs(v.items.reduce((s, i) => s + (i.valor || 0), 0) - 100) > .05) {
    errores.push('Los porcentajes de un gráfico de torta deben sumar 100.');
  }
  if (v.tipo === 'barras' && v.items.some(i => i.valor < 0)) errores.push('Para cantidades negativas usa una recta o un gráfico x-y.');
  if (v.tipo === 'iconos' && v.items.some(i => !Number.isInteger(i.valor) || i.valor < 0 || i.valor > 24)) {
    errores.push('Cada grupo de íconos debe representar entre 0 y 24 elementos enteros.');
  }
  return errores;
}

/* ================= Dibujo ================= */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = v => Math.round(v * 10) / 10;
const SERIE = ['#E86A4A', '#2F5EA8', '#229F74', '#E59D18', '#0D9488', '#D94862', '#5A8D26', '#4668B8'];
const fmt = x => String(Number(x.toPrecision(12))).replace('.', ',');
let cuenta = 0; // ids únicos para las flechas de cada visual

const ICONOS_SVG = {
  libro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  chispa: '<path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  pasos: '<path d="M4 18h5v-4h5v-4h6M4 18v-2M9 14v-2M14 10V8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  ciclo: '<path d="M17 7a7 7 0 0 0-11 2M7 17a7 7 0 0 0 11-2M17 3v4h-4M7 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  mapa: '<path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5zM9 4v13M15 6.5v13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  balanza: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6h5zM19 8l-2.5 6h5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  reloj: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7.5V12l3.2 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  grafico: '<path d="M4 4v16h16M7 15l4-4 3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  tabla: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  recta: '<path d="M3 13h18M7 10v6M12 10v6M17 10v6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M7 10c2.5-4 7.5-4 10 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  pelota: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7l4.2 3-1.6 4.8H9.4L7.8 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  cocina: '<path d="M5 13h14v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM8 10c0-1 1-1.5 1-2.5M12 10c0-1 1-1.5 1-2.5M16 10c0-1 1-1.5 1-2.5M3 13h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  agua: '<path d="M12 3.5c3.8 5 6 8.2 6 11a6 6 0 1 1-12 0c0-2.8 2.2-6 6-11z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  hoja: '<path d="M19 5C10 5 5 10 5 18c8 0 14-4 14-13zM5 19c3.5-3.5 7-6.5 11-9.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  energia: '<path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  escudo: '<path d="M12 3.5l7 3v5c0 4.8-3 8.2-7 9.5-4-1.3-7-4.7-7-9.5v-5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  meta: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  moneda: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M14.5 9.2c-.6-.7-1.5-1-2.5-1-1.5 0-2.5.8-2.5 1.9 0 1.2 1 1.6 2.6 2 1.6.4 2.6.9 2.6 2.1 0 1.2-1.1 2-2.7 2-1.2 0-2.2-.4-2.8-1.1M12 6.5v11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  bloque: '<path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7zM4.5 7.7L12 12l7.5-4.3M12 12v8.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  cohete: '<path d="M13.5 4.5c3 0 5.5 2.5 5.5 5.5 0 4-3.8 7.6-8.5 9.5L8.5 17 5.5 14c1.9-4.7 5.5-9.5 8-9.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="14" cy="10" r="1.5" fill="currentColor"/>',
  musica: '<path d="M9 17.5a2.5 2.5 0 1 1-2-2.45V6.5l10-2v9.55a2.5 2.5 0 1 1-2-2.45V8.1l-6 1.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  lupa: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M15 15l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  cruz: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  alerta: '<path d="M12 4L3.5 19h17zM12 10v4.5M12 17.2v.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  diamante: '<path d="M6.5 5h11l3 4.5L12 19.5 3.5 9.5zM3.5 9.5h17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  idea: '<path d="M9 17.5h6M10 20.5h4M12 3.5a5.5 5.5 0 0 0-3 10.1c.6.4 1 1.1 1 1.9h4c0-.8.4-1.5 1-1.9a5.5 5.5 0 0 0-3-10.1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  mas: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  sol: '<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  nube: '<path d="M7.5 18h9.5a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 9.2 4 4 0 0 0 7.5 18z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  laboratorio: '<path d="M9 4h6M10 4v5.5L5.2 17.2A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.6-2.8L14 9.5V4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  repetir: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.2L19.5 8.8M19.5 4.5v4.3h-4.3M19.5 12a7.5 7.5 0 0 1-13 5.2L4.5 15.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  play: '<path d="M7.5 5.5L18.5 12l-11 6.5z" fill="currentColor"/>',
  pausa: '<path d="M7 5.5h3.5v13H7zM13.5 5.5H17v13h-3.5z" fill="currentColor"/>',
  izq: '<path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
  der: '<path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>'
};

const EMOJI_A_CLAVE = new Map([
  ['\u{2728}', 'chispa'], ['\u{1F4DD}', 'libro'], ['\u{1F4D6}', 'libro'], ['\u{1F4D2}', 'libro'],
  ['\u{1F355}', 'cocina'], ['\u{1F370}', 'cocina'], ['\u{1F356}', 'cocina'], ['\u{1F96A}', 'cocina'], ['\u{1F36C}', 'cocina'], ['\u{1FAD8}', 'hoja'],
  ['\u{26BD}', 'pelota'], ['\u{1F3C0}', 'pelota'],
  ['\u{2696}', 'balanza'], ['\u{2795}', 'mas'], ['\u{2797}', 'mas'], ['\u{1F504}', 'ciclo'], ['\u{1F448}', 'pasos'],
  ['\u{1FA9C}', 'pasos'], ['\u{1F4CB}', 'tabla'], ['\u{1F50D}', 'lupa'], ['\u{1F440}', 'lupa'],
  ['\u{274C}', 'cruz'], ['\u{2705}', 'check'], ['\u{2713}', 'check'],
  ['\u{1F4CA}', 'grafico'], ['\u{1F4C8}', 'grafico'], ['\u{1F525}', 'energia'], ['\u{26A1}', 'energia'],
  ['\u{1F9E0}', 'idea'], ['\u{1F4A1}', 'idea'], ['\u{1F4A7}', 'agua'], ['\u{1F327}', 'agua'], ['\u{1F30A}', 'agua'],
  ['\u{2600}', 'sol'], ['\u{2601}', 'nube'], ['\u{1F32C}', 'nube'],
  ['\u{1F331}', 'hoja'], ['\u{1F343}', 'hoja'], ['\u{1F52C}', 'laboratorio'], ['\u{1F9EA}', 'laboratorio'],
  ['\u{1F977}', 'meta'], ['\u{1F94B}', 'meta'], ['\u{1F3AF}', 'meta'], ['\u{1F5DD}', 'meta'], ['\u{1F511}', 'meta'],
  ['\u{1F6D2}', 'moneda'], ['\u{1F4B0}', 'moneda'], ['\u{1F437}', 'moneda'], ['\u{1F68C}', 'pasos'], ['\u{1F4F1}', 'chispa'],
  ['\u{1F9ED}', 'mapa'], ['\u{1F3D4}', 'mapa'], ['\u{2693}', 'mapa'], ['\u{2694}', 'escudo'],
  ['\u{1F6E1}', 'escudo'], ['\u{1F4DC}', 'libro'],
  ['\u{1F9F1}', 'bloque'], ['\u{1F48E}', 'diamante'], ['\u{1F680}', 'cohete'],
  ['\u{1F3B5}', 'musica'], ['\u{1F3A4}', 'musica'], ['\u{23F1}', 'reloj'],
  ['\u{26A0}', 'alerta'], ['\u{2699}', 'ciclo'], ['\u{1F4AA}', 'energia'], ['\u{1F634}', 'reloj']
]);

export function claveIcono(v, def = 'chispa') {
  const s = String(v ?? '').trim();
  if (!s) return def;
  const k = s.toLowerCase();
  if (ICONOS_SVG[k]) return k;
  const sinVs = s.replace(/\uFE0F/g, '');
  if (EMOJI_A_CLAVE.has(s)) return EMOJI_A_CLAVE.get(s);
  if (EMOJI_A_CLAVE.has(sinVs)) return EMOJI_A_CLAVE.get(sinVs);
  if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(s)) return def;
  return def;
}

export function svgIcono(v, { def = 'chispa', size = 20, cls = 'fi-svg-ico' } = {}) {
  const k = claveIcono(v, def);
  const path = ICONOS_SVG[k] || ICONOS_SVG[def] || ICONOS_SVG.chispa;
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${path}</svg>`;
}

const ico = (i, cls = 'v-ico') => i ? `<span class="${cls}" aria-hidden="true">${svgIcono(i, { size: 17 })}</span>` : '';

const recorridoRecta = v => v.recorrido?.map(valor => ({ valor, texto: v.marcas.find(m => m.valor === valor)?.texto })) || v.marcas;

function graduarRecta(min, max) {
  const intervalo = (max - min) / 8;
  if (!Number.isFinite(intervalo) || intervalo <= 0) return [min, max];
  const escala = 10 ** Math.floor(Math.log10(intervalo));
  const paso = ([1, 2, 5, 10].find(n => n * escala >= intervalo) || 10) * escala;
  const primero = Math.ceil(min / paso);
  const ultimo = Math.floor(max / paso);
  return Array.from({ length: Math.min(12, Math.max(0, ultimo - primero + 1)) }, (_, i) => Number(((primero + i) * paso).toPrecision(12)));
}

const VISUALES = {
  pasos(v) {
    return `<ol class="v-pasos"><span class="v-pasos-fill" aria-hidden="true"></span>${v.items.map((it, i) => `<li class="v-step" data-step="${i}" style="--i:${i}"><span class="v-num">${i + 1}</span><div>${ico(it.icono)}<b>${esc(it.texto)}</b>${it.detalle ? `<small>${esc(it.detalle)}</small>` : ''}</div></li>`).join('')}</ol>`;
  },
  ciclo(v) {
    const N = Math.max(2, v.items.length), R = 36, cx = 50, cy = 50, del = N > 4 ? 16 : 20, mid = `vf${++cuenta}`;
    const pos = i => { const a = (-90 + i * 360 / N) * Math.PI / 180; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; };
    const arco = i => {
      const a0 = (-90 + i * 360 / N + del) * Math.PI / 180, a1 = (-90 + (i + 1) * 360 / N - del) * Math.PI / 180;
      return `<path class="v-trazo v-step" data-step="${i}" style="--i:${i}" d="M${r1(cx + Math.cos(a0) * R)} ${r1(cy + Math.sin(a0) * R)}A${R} ${R} 0 0 1 ${r1(cx + Math.cos(a1) * R)} ${r1(cy + Math.sin(a1) * R)}" pathLength="1" marker-end="url(#${mid})"/>`;
    };
    return `<div class="v-ciclo"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--c)"/></marker></defs><circle cx="50" cy="50" r="${R}" class="v-ciclo-ring"/><g class="v-giro">${v.items.map((_, i) => arco(i)).join('')}</g><g class="v-ciclo-orb"><circle cx="50" cy="${cx - R}" r="3.2"/></g></svg>
${v.centro ? `<div class="v-centro">${esc(v.centro)}</div>` : ''}
${v.items.map((it, i) => { const [x, y] = pos(i); return `<div class="v-nodo v-step" data-step="${i}" style="--i:${i};left:${r1(x)}%;top:${r1(y)}%">${ico(it.icono, 'v-burbuja')}<b>${esc(it.texto)}</b></div>`; }).join('')}</div>`;
  },
  partes(v) {
    const N = v.items.length, pos = i => { const a = (-90 + i * 360 / N + (N % 2 ? 0 : 180 / N)) * Math.PI / 180; return [50 + Math.cos(a) * 37, 50 + Math.sin(a) * 38]; };
    return `<div class="v-partes"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${v.items.map((_, i) => { const [x, y] = pos(i); return `<line class="v-trazo v-step" data-step="${i + 1}" style="--i:${i + 1}" x1="50" y1="50" x2="${r1(x)}" y2="${r1(y)}" pathLength="1"/>`; }).join('')}</svg>
<div class="v-centro v-step" data-step="0">${esc(v.centro || v.titulo)}</div>
${v.items.map((it, i) => { const [x, y] = pos(i); return `<div class="v-nodo v-step" data-step="${i + 1}" style="--i:${i + 1};left:${r1(x)}%;top:${r1(y)}%">${ico(it.icono)}<b>${esc(it.texto)}</b>${it.detalle ? `<small>${esc(it.detalle)}</small>` : ''}</div>`; }).join('')}</div>`;
  },
  comparar(v) {
    const col = (l, k) => `<div class="v-col v-col-${k}" style="--i:${k === 'izq' ? 0 : 1}"><h5 class="v-step" data-step="0">${ico(l.icono)}${esc(l.titulo)}</h5><ul>${(l.puntos || []).map((p, i) => `<li class="v-step" data-step="${i + 1}" style="--i:${i + 1}">${esc(p)}</li>`).join('')}</ul></div>`;
    return `<div class="v-comparar">${col(v.izquierda, 'izq')}<span class="v-vs">vs</span>${col(v.derecha, 'der')}</div>`;
  },
  barras(v) {
    const its = v.items.filter(i => Number.isFinite(i.valor)), max = Math.max(...its.map(i => i.valor), 0) || 1;
    return `<div class="v-barras">${its.map((it, i) => `<div class="v-barra v-step" data-step="${i}" style="--i:${i};--h:${r1(Math.max(0, it.valor) / max * 100)}%;--b:${SERIE[i % SERIE.length]}"><span class="v-val">${fmt(it.valor)}${esc(v.unidad && v.unidad !== '%' ? ' ' + v.unidad : v.unidad)}</span><span class="v-col-b"><i></i></span>${ico(it.icono)}<span class="v-lab">${esc(it.texto)}</span></div>`).join('')}</div>`;
  },
  torta(v) {
    const its = v.items.filter(i => Number.isFinite(i.valor) && i.valor > 0), tot = its.reduce((a, i) => a + i.valor, 0) || 1;
    let acc = 0;
    const segs = its.map((it, i) => { const p = it.valor / tot, s = `<circle class="v-seg v-step" data-step="${i}" style="--i:${i};--p:${r1(p * 100)};--o:${r1(-acc * 100)}" cx="50" cy="50" r="36" pathLength="100" stroke="${SERIE[i % SERIE.length]}"/>`; acc += p; return s; }).join('');
    return `<div class="v-torta"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="36" fill="none" stroke="#EAE2D2" stroke-width="20"/>${segs}</svg>
<ul>${its.map((it, i) => `<li class="v-step" data-step="${i}" style="--i:${i}"><i style="background:${SERIE[i % SERIE.length]}"></i>${ico(it.icono)}<span>${esc(it.texto)}</span><b>${v.unidad === '%' || !v.unidad ? Math.round(it.valor / tot * 100) + '%' : fmt(it.valor) + ' ' + esc(v.unidad)}</b></li>`).join('')}</ul></div>`;
  },
  fraccion(v) {
    const fs = v.fracciones, val = f => f.num / f.den;
    const simbolo = i => {
      if (v.operacion === 'suma') return i === 0 ? '+' : '=';
      if (v.operacion === 'resta') return i === 0 ? '−' : '=';
      if (v.operacion === 'igual') return '=';
      if (v.operacion === 'compara') { const a = val(fs[i]), b = val(fs[i + 1]); return Math.abs(a - b) < 1e-9 ? '=' : a > b ? '>' : '<'; }
      return '';
    };
    const dibujo = (f, extraClass = '') => {
      const cantidad = Math.abs(f.num), completos = Math.floor(cantidad / f.den);
      const enteros = Math.max(1, Math.ceil(cantidad / f.den)), barra = v.forma === 'barra' || f.den > 12;
      const compacto = enteros > 3, resto = cantidad % f.den;
      let k = 0;
      let s = '';
      if (compacto) s += `<span class="v-fr-entero">${completos} enteros${resto ? ' +' : ''}</span>`;
      for (let w = 0; w < (compacto ? Number(resto > 0) : enteros); w++) {
        const llenas = compacto ? resto : Math.max(0, Math.min(f.den, cantidad - w * f.den));
        if (barra) {
          const W = 100 / f.den;
          const bloques = f.den > 24
            ? `<rect x="1" y="1" width="100" height="20" class="v-vacia"/><rect x="1" y="1" width="${r1(llenas * W)}" height="20" class="v-llena" style="--i:0"/>`
            : Array.from({ length: f.den }, (_, j) => `<rect x="${r1(1 + j * W)}" y="1" width="${r1(W)}" height="20" class="${j < llenas ? 'v-llena' : 'v-vacia'}" style="--i:${j < llenas ? k++ : 0}"/>`).join('');
          s += `<svg class="v-fr-barra" viewBox="0 0 102 22" aria-hidden="true">${bloques}</svg>`;
        } else {
          const porc = j => { if (f.den === 1) return `<circle cx="22" cy="22" r="20" class="${llenas ? 'v-llena' : 'v-vacia'}" style="--i:${llenas ? k++ : 0}"/>`; const a0 = (-90 + j * 360 / f.den) * Math.PI / 180, a1 = (-90 + (j + 1) * 360 / f.den) * Math.PI / 180; return `<path d="M22 22L${r1(22 + Math.cos(a0) * 20)} ${r1(22 + Math.sin(a0) * 20)}A20 20 0 0 1 ${r1(22 + Math.cos(a1) * 20)} ${r1(22 + Math.sin(a1) * 20)}Z" class="${j < llenas ? 'v-llena' : 'v-vacia'}" style="--i:${j < llenas ? k++ : 0}"/>`; };
          s += `<svg class="v-fr-pizza" viewBox="0 0 44 44" aria-hidden="true">${Array.from({ length: f.den }, (_, j) => porc(j)).join('')}</svg>`;
        }
      }
      return `<div class="v-fr-dib ${extraClass}">${s}</div>${f.num < 0 ? '<small>Magnitud de la fracción negativa</small>' : ''}`;
    };
    // Si es suma/resta con distinto denominador, agrega transformación visual de equivalencia (cómo igualar)
    let bridgeHtml = '', stepShift = 0;
    if (esCuentaFraccion(v.operacion) && fs.length >= 2 && fs[0].den !== fs[1].den) {
      const a = fs[0], b = fs[1], denComun = (a.den * b.den) / mcd(a.den, b.den);
      if (denComun <= 24) {
        const ea = { num: Math.round(a.num * denComun / a.den), den: denComun };
        const eb = { num: Math.round(b.num * denComun / b.den), den: denComun };
        stepShift = 1;
        bridgeHtml = `<div class="v-fr-eq v-step" data-step="2">
          <span class="v-fr-eq-tit">Cómo igualar tamaños (denominador común ${denComun}):</span>
          <div class="v-fr-eq-fila">
            <span class="v-fr-mini">${a.num}/${a.den} = <b>${ea.num}/${ea.den}</b></span>
            ${dibujo(ea, 'v-fr-mini-dib')}
            <span class="v-fr-eq-op">${v.operacion === 'suma' ? '+' : '−'}</span>
            <span class="v-fr-mini">${b.num}/${b.den} = <b>${eb.num}/${eb.den}</b></span>
            ${dibujo(eb, 'v-fr-mini-dib')}
          </div>
        </div>`;
      }
    }
    const itemsHtml = fs.map((f, i) => {
      const stepIdx = i < 2 ? i : i + stepShift;
      return `<div class="v-fr v-step" data-step="${stepIdx}">${v.ocultarNumeros ? '' : `<div class="v-fr-num"><span>${f.num}</span><span>${f.den}</span></div>`}${dibujo(f)}${f.etiqueta ? `<small>${esc(f.etiqueta)}</small>` : ''}</div>${i < fs.length - 1 && simbolo(i) ? `<span class="v-op v-step" data-step="${i + 1 + (i ? stepShift : 0)}">${simbolo(i)}</span>` : ''}`;
    }).join('');
    return `<div class="v-fracciones${fs.length === 1 ? ' v-fr-sola' : ''}">${itemsHtml}</div>${bridgeHtml}`;
  },
  recta(v) {
    const mid = `vf${++cuenta}`, W = 320, x0 = 16, x1 = W - 16, X = val => x0 + (val - v.min) / (v.max - v.min) * (x1 - x0), Y = 70;
    const ticks = graduarRecta(v.min, v.max).map(t => `<line x1="${r1(X(t))}" y1="${Y - 5}" x2="${r1(X(t))}" y2="${Y + 5}"/><text x="${r1(X(t))}" y="${Y + 20}" class="v-tnum">${fmt(t)}</text>`).join('');
    const m = recorridoRecta(v);
    const saltos = v.saltos ? m.slice(1).map((b, i) => { const a = m[i], xa = X(a.valor), xb = X(b.valor), h = Math.min(40, 12 + Math.abs(xb - xa) * .25), d = b.valor - a.valor; return `<path class="v-trazo v-step" data-step="${i + 1}" style="--i:${i + 1}" d="M${r1(xa)} ${Y - 6}Q${r1((xa + xb) / 2)} ${r1(Y - 6 - h * 2)} ${r1(xb)} ${Y - 6}" pathLength="1" marker-end="url(#${mid})"/><text class="v-salto v-step" data-step="${i + 1}" style="--i:${i + 1}" x="${r1((xa + xb) / 2)}" y="${r1(Y - 10 - h)}">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}</text>`; }).join('') : '';
    const puntos = m.map((p, i) => `<g class="v-punto v-step" data-step="${i}" style="--i:${i}"><circle cx="${r1(X(p.valor))}" cy="${Y}" r="6"/>${p.texto ? `<text x="${r1(X(p.valor))}" y="${v.saltos ? Y + 36 : Y - 14}" class="v-etq">${esc(p.texto)}</text>` : ''}</g>`).join('');
    const referencias = v.recorrido ? v.marcas.filter(p => p.texto && !v.recorrido.includes(p.valor))
      .map(p => `<text x="${r1(X(p.valor))}" y="${Y + 36}" class="v-tnum">${esc(p.texto)}</text>`).join('') : '';
    return `<svg class="v-recta" viewBox="0 0 ${W} ${v.saltos ? 112 : 100}" aria-hidden="true"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--c)"/></marker></defs><line class="v-eje" x1="${x0 - 8}" y1="${Y}" x2="${x1 + 8}" y2="${Y}"/><g class="v-ticks">${ticks}</g>${saltos}${puntos}${referencias}</svg>`;
  },
  linea_tiempo(v) {
    return `<ol class="v-tiempo"><span class="v-tiempo-fill" aria-hidden="true"></span>${v.items.map((it, i) => `<li class="v-step" data-step="${i}" style="--i:${i}"><span class="v-fecha">${esc(it.fecha || it.detalle || '')}</span><span class="v-hito"></span><div>${ico(it.icono)}<b>${esc(it.texto)}</b>${it.fecha && it.detalle ? `<small>${esc(it.detalle)}</small>` : ''}</div></li>`).join('')}</ol>`;
  },
  ecuacion(v) {
    const n = v.lineas.length;
    return `<ol class="v-ecuacion">${v.lineas.map((l, i) => `<li class="v-step${i === n - 1 ? ' v-final' : ''}" data-step="${i}" style="--i:${i}"><code>${esc(l.expresion)}</code>${l.nota ? `<span>${esc(l.nota)}</span>` : ''}</li>`).join('')}</ol>`;
  },
  tabla(v) {
    return `<div class="v-tabla"><table>${v.columnas.length ? `<thead><tr>${v.columnas.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>` : ''}<tbody>${v.filas.map((f, i) => `<tr class="v-step" data-step="${i}" style="--i:${i}">${f.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  },
  grafico(v) {
    const P = v.puntos, W = 320, H = 190, L = 40, R = 14, T = 14, B = 34;
    const xs = P.map(p => p.x), ys = P.map(p => p.y);
    let xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(0, ...ys), yb = Math.max(...ys);
    if (xb === xa) xb = xa + 1; if (yb === ya) yb = ya + 1;
    const X = x => L + (x - xa) / (xb - xa) * (W - L - R), Y = y => H - B - (y - ya) / (yb - ya) * (H - T - B);
    const segmentos = P.slice(1).map((p, i) => {
      const anterior = P[i];
      return `<path class="v-linea v-trazo v-step" data-step="${i + 1}" d="M${r1(X(anterior.x))} ${r1(Y(anterior.y))}L${r1(X(p.x))} ${r1(Y(p.y))}" pathLength="1"/>`;
    }).join('');
    const marcasY = [ya, (ya + yb) / 2, yb].map(y => `<line class="v-guia" x1="${L}" y1="${r1(Y(y))}" x2="${W - R}" y2="${r1(Y(y))}"/><text class="v-tnum" x="${L - 6}" y="${r1(Y(y) + 4)}" text-anchor="end">${fmt(Math.round(y * 100) / 100)}</text>`).join('');
    const marcasX = P.map(p => `<text class="v-tnum" x="${r1(X(p.x))}" y="${H - B + 16}">${fmt(p.x)}</text>`).join('');
    return `<svg class="v-grafico" viewBox="0 0 ${W} ${H}" aria-hidden="true">${marcasY}<line class="v-eje" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/><line class="v-eje" x1="${L}" y1="${T}" x2="${L}" y2="${H - B}"/>${marcasX}
${segmentos}${P.map((p, i) => `<g class="v-punto v-step" data-step="${i}" style="--i:${i}"><circle cx="${r1(X(p.x))}" cy="${r1(Y(p.y))}" r="5"/>${p.texto ? `<text class="v-etq" x="${r1(X(p.x))}" y="${r1(Y(p.y) - 10)}">${esc(p.texto)}</text>` : ''}</g>`).join('')}
${v.ejeX ? `<text class="v-ejeT" x="${(L + W - R) / 2}" y="${H - 4}">${esc(v.ejeX)}</text>` : ''}${v.ejeY ? `<text class="v-ejeT" x="12" y="${(T + H - B) / 2}" transform="rotate(-90 12 ${(T + H - B) / 2})">${esc(v.ejeY)}</text>` : ''}</svg>`;
  },
  iconos(v) {
    let k = 0;
    return `<div class="v-iconos">${v.items.filter(i => Number.isFinite(i.valor)).map((it, rIdx) => { const n = Math.max(0, Math.min(24, Math.round(it.valor))); const colorIt = SERIE[rIdx % SERIE.length]; return `<div class="v-ifila v-step" data-step="${rIdx}"><span class="v-lab">${esc(it.texto)}</span><span class="v-ilista" style="color:${colorIt}">${Array.from({ length: n }, () => `<i style="--i:${k++}">${svgIcono(it.icono, { def: 'diamante', size: 18 })}</i>`).join('')}</span><b>${fmt(it.valor)}</b></div>`; }).join('')}</div>`;
  }
};

function secuenciaDeVisual(v) {
  switch (v.tipo) {
    case 'pasos':
      return v.items.map((it, i) => `Paso ${i + 1}: ${it.texto}${it.detalle ? ` — ${it.detalle}` : ''}`);
    case 'ciclo':
      return v.items.map((it, i) => `Etapa ${i + 1}: ${it.texto} pasa a ${v.items[(i + 1) % v.items.length]?.texto || 'inicio'}`);
    case 'partes':
      return [`Centro: ${v.centro || v.titulo}`, ...v.items.map(it => `${it.texto}${it.detalle ? `: ${it.detalle}` : ''}`)];
    case 'comparar': {
      const maxP = Math.max(v.izquierda.puntos.length, v.derecha.puntos.length);
      return [
        `${v.izquierda.titulo} frente a ${v.derecha.titulo}`,
        ...Array.from({ length: maxP }, (_, i) => [v.izquierda.puntos[i], v.derecha.puntos[i]].filter(Boolean).join(' · '))
      ];
    }
    case 'barras': {
      const its = v.items.filter(i => Number.isFinite(i.valor));
      return its.map(it => `${it.texto}: ${fmt(it.valor)}${v.unidad ? ' ' + v.unidad : ''}`);
    }
    case 'torta': {
      const its = v.items.filter(i => Number.isFinite(i.valor) && i.valor > 0);
      const tot = its.reduce((a, i) => a + i.valor, 0) || 1;
      return its.map(it => `${it.texto}: ${v.unidad === '%' || !v.unidad ? Math.round(it.valor / tot * 100) + '%' : fmt(it.valor) + ' ' + v.unidad}`);
    }
    case 'fraccion': {
      const fs = v.fracciones || [];
      if (fs.length <= 1) return fs.map(f => `${f.num}/${f.den}${f.etiqueta ? `: ${f.etiqueta}` : ''}`);
      const steps = [`Primero: ${fs[0].num}/${fs[0].den}${fs[0].etiqueta ? ` (${fs[0].etiqueta})` : ''}`];
      steps.push(`${esCuentaFraccion(v.operacion) ? 'Segunda cantidad' : 'Compara con'}: ${fs[1].num}/${fs[1].den}${fs[1].etiqueta ? ` (${fs[1].etiqueta})` : ''}`);
      if (esCuentaFraccion(v.operacion) && fs[0].den !== fs[1].den) {
        const d = (fs[0].den * fs[1].den) / mcd(fs[0].den, fs[1].den);
        if (d <= 24) steps.push(`Igualamos tamaños a /${d}: ${Math.round(fs[0].num * d / fs[0].den)}/${d} ${v.operacion === 'suma' ? '+' : '−'} ${Math.round(fs[1].num * d / fs[1].den)}/${d}`);
      }
      fs.slice(2).forEach(f => {
        steps.push(`${esCuentaFraccion(v.operacion) ? 'Resultado' : 'Compara con'}: ${f.num}/${f.den}${f.etiqueta ? ` (${f.etiqueta})` : ''}`);
      });
      return steps;
    }
    case 'recta': {
      const marcas = recorridoRecta(v);
      return marcas.map((m, i) => {
        if (i === 0 || !v.saltos) return `${v.saltos ? 'Punto inicial' : 'Punto'}: ${fmt(m.valor)}${m.texto ? ` (${m.texto})` : ''}`;
        const d = m.valor - marcas[i - 1].valor;
        return `Salto de ${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))} hasta ${fmt(m.valor)}${m.texto ? ` (${m.texto})` : ''}`;
      });
    }
    case 'linea_tiempo':
      return v.items.map(it => `${it.fecha || ''}${it.fecha ? ': ' : ''}${it.texto}`);
    case 'ecuacion':
      return v.lineas.map((l, i) => i === 0 ? `Inicio: ${l.expresion}` : l.nota ? `${l.nota} → ${l.expresion}` : `Queda: ${l.expresion}`);
    case 'tabla':
      return v.filas.map(f => f.join(' · '));
    case 'grafico':
      return v.puntos.map((p, i) => `${i === 0 ? 'Inicio' : `Paso ${i}`}: (${fmt(p.x)}, ${fmt(p.y)})${p.texto ? ` — ${p.texto}` : ''}`);
    case 'iconos': {
      let acum = 0;
      return v.items.filter(i => Number.isFinite(i.valor)).map(it => {
        acum += it.valor;
        return `${it.texto}: +${fmt(it.valor)} (llevamos ${fmt(acum)})`;
      });
    }
    default: return [];
  }
}

export function htmlVisual(v) {
  const dib = (VISUALES[v.tipo] || VISUALES.pasos)(v);
  const pasos = secuenciaDeVisual(v);
  const playHtml = pasos.length > 1
    ? `<div class="vis-playbar" data-total="${pasos.length}">
        <div class="vis-play-btns">
          <button type="button" class="vis-btn-step vis-play" aria-label="Reproducir cómo se hace paso a paso" title="Reproducir / pausar">${svgIcono('play', { size: 13 })}</button>
          <button type="button" class="vis-btn-step vis-prev" aria-label="Paso anterior" title="Paso anterior">${svgIcono('izq', { size: 13 })}</button>
          <div class="vis-dots" aria-hidden="true">${pasos.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
          <button type="button" class="vis-btn-step vis-next" aria-label="Paso siguiente" title="Paso siguiente">${svgIcono('der', { size: 13 })}</button>
        </div>
        <p class="vis-cap" aria-live="polite">${esc(pasos[pasos.length - 1] || '')}</p>
        <script type="application/json" class="vis-seq">${JSON.stringify(pasos).replace(/</g, '\\u003c')}</script>
      </div>`
    : '';
  return `<figure class="vis vis-${v.tipo}" data-tipo="${esc(v.tipo)}">${v.titulo ? `<figcaption>${esc(v.titulo)}</figcaption>` : ''}${dib}<button class="vis-otra" type="button" aria-label="Ver la animación otra vez" title="Ver otra vez">${svgIcono('repetir', { size: 15 })}</button>${playHtml}</figure>`;
}

// ctx: { numero, fase, avatar, tono, reto, citaDe, rotuloAdaptacion, pieHtml }
export function htmlFicha(f, ctx = {}) {
  const t = ctx.tono || { base: '#2F5EA8', claro: '#E6EEF8', oscuro: '#214580' };
  const e = f.ejemplo || {};
  const adap = ctx.adaptacion || f.adaptacion;
  const pasos = e.pasos?.length ? `<ol class="fi-pasos-escritos">${e.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>` : '';
  const resultado = e.resultado ? `<p class="fi-res">${esc(e.resultado)}</p>` : '';
  const idea = f.idea ? `<section class="fi-concepto"><h4>Idea clave</h4><p class="fi-idea">${esc(f.idea)}</p></section>` : '';
  const visual = visualTieneDatos(f.visual) ? htmlVisual(f.visual) : '';
  const cuidado = f.cuidado ? `<p class="fi-cuidado"><b>¡Ojo!</b> ${esc(f.cuidado)}</p>` : '';
  const recordar = f.de_ti ? `<blockquote class="fi-deti"><p>«${esc(f.de_ti)}»</p><cite>${esc(ctx.citaDe || 'Lo que me enseñaste')}</cite></blockquote>` : '';
  const adaptacion = adap ? `<p class="fi-adapta"><b>${esc(ctx.rotuloAdaptacion || 'Adaptación')}</b> ${esc(adap)}</p>` : '';
  const guia = ctx.rotuloAdaptacion === 'Guía de práctica';
  const notas = cuidado || recordar || (adaptacion && !guia)
    ? `<details class="fi-notas"><summary>Notas para repasar</summary><div class="fi-notas-cuerpo">${cuidado}${recordar}${guia ? '' : adaptacion}</div></details>` : '';
  const enunciado = e.situacion || e.pregunta ? `<div class="fi-ejemplo">
    <h4>${ctx.reto ? 'Reto' : 'Ejemplo'}</h4>
    ${e.situacion && e.situacion !== e.pregunta ? `<p>${esc(e.situacion)}</p>` : ''}
    ${e.pregunta ? `<p><strong>${esc(e.pregunta)}</strong></p>` : ''}
    ${e.puente ? `<p class="fi-puente">${esc(e.puente)}</p>` : ''}
  </div>` : '';
  const respuesta = pasos || resultado ? `<div class="fi-respuesta">${visual && pasos ? `<details class="fi-procedimiento"><summary>Ver pasos escritos</summary>${pasos}</details>` : pasos}${resultado}</div>` : '';
  const caso = enunciado && ctx.reto && (pasos || resultado)
    ? `<section class="fi-reto">${enunciado}<details class="fi-solucion"><summary>Ver solución</summary>${idea}${visual}${pasos}${resultado}${notas}</details></section>`
    : `${idea}${guia ? adaptacion : ''}<div class="fi-caso${enunciado && visual ? ' fi-caso--visual' : ''}">${enunciado}${visual}${respuesta}</div>${notas}`;
  return `<article class="ficha-ap" style="--c:${t.base};--c-claro:${t.claro};--c-osc:${t.oscuro}">
<header class="fi-cab"><span class="fi-ico" aria-hidden="true">${svgIcono(f.icono, { def: 'chispa', size: 22 })}</span><div class="fi-tit"><small>Ficha ${ctx.numero || ''}${ctx.fase ? ` · ${esc(ctx.fase)}` : ''}</small><h3>${esc(f.titulo)}</h3></div>${ctx.avatar ? `<span class="fi-av">${ctx.avatar}</span>` : ''}</header>
${caso}
${ctx.pieHtml || ''}
</article>`;
}

/* ================= Ficha en modo práctica ================= */
// Arma una ficha con las propias palabras del estudiante: sus oraciones se vuelven los pasos.
export function fichaLocal(concepto, mensajes = []) {
  const mejor = mensajes.findLast(s => s.match(/[\p{L}\p{N}]+/gu)?.length >= 6) || '';
  const frases = mejor.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 8);
  const items = frases.slice(0, 4).map(f => ({ texto: f.split(' ').slice(0, 6).join(' ') + (f.split(' ').length > 6 ? '…' : ''), detalle: f.split(' ').length > 6 ? f.slice(0, 100) : '' }));
  if (items.length === 1) items.push({ texto: 'Prueba con otro caso', detalle: 'Explica qué se conserva al cambiar el ejemplo.', icono: 'idea' });
  return limpiarFicha({
    titulo: concepto, icono: 'libro', idea: frases[0] || mejor,
    visual: { tipo: 'pasos', titulo: 'Cómo me lo explicaste', items },
    ejemplo: {}, cuidado: '', de_ti: mejor.slice(0, 150)
  });
}

// Ficha adaptativa sin IA: elige un diseño visual distinto según el tema, el nivel, la calibración y la reacción anterior.
const normTxt = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const CONTEXTOS_EQUIVALENCIA = [
  { coincide: /pizza|cocin|horno|receta/, contexto: 'En el horno preparas dos pizzas del mismo tamaño.', entero: 'Pizza', parte: 'porciones', forma: 'pizza', icono: 'cocina' },
  { coincide: /espaci|cohete|nave|robot|marte/, contexto: 'Dos naves cargan combustible en depósitos de la misma capacidad.', entero: 'Depósito', parte: 'marcas', forma: 'barra', icono: 'cohete' },
  { coincide: /bloque|minecraft|juego/, contexto: 'En dos tramos de un mapa idéntico señalas cuánto del recorrido completaste.', entero: 'Recorrido', parte: 'tramos', forma: 'barra', icono: 'bloque' },
  { coincide: /futbol|pelota|cancha/, contexto: 'En la cancha comparas el tiempo de entrenamiento de dos equipos con sesiones de igual duración.', entero: 'Sesión', parte: 'intervalos', forma: 'barra', icono: 'pelota' }
];
function elegirPorCalibracion(candidatos, { ultimoTipo = '', calibracion = null } = {}) {
  const pref = new Map((calibracion?.preferidos || []).map((p, i) => [p.tipo, 36 - i * 6]));
  const evitar = new Set((calibracion?.evitar || []).map(p => p.tipo));
  const explorar = new Set((calibracion?.explorar || []).map(p => p.tipo || p));
  const pin = calibracion?.pinTipo || '';
  const est = calibracion?.estrategia || 'aprovechar';
  const fijo = pin && candidatos.find(c => c.visual.tipo === pin);
  if (fijo) return fijo;

  let mejor = candidatos[0], mejorPt = -Infinity;
  candidatos.forEach((c, idx) => {
    const tipo = c.visual.tipo;
    let pt = (candidatos.length - idx) * 2;
    if (tipo === ultimoTipo && candidatos.length > 1) pt -= 120;
    if (est === 'explorar' && explorar.has(tipo)) pt += 48;
    else if (pref.has(tipo)) pt += pref.get(tipo);
    if (evitar.has(tipo) && tipo !== pin) pt -= 45;
    if (pt > mejorPt) { mejorPt = pt; mejor = c; }
  });
  return mejor;
}

function fichaEnterosLocal(objetivo, gustos) {
  const op = estudiarOperacionEntera(objetivo.replaceAll('−', '-').match(OPERACION_ENTERA) || ['', '-3', '-', '2']);
  if (!op) return null;
  const { inicio, cambio, final, operacion } = op;
  const sentido = direccionEntera(cambio);
  const mina = /minecraft|mina|bloque|ascensor/.test(normTxt(gustos));
  const situacion = mina ? `El ascensor de la mina está en el nivel ${inicio} y ${cambio < 0 ? 'baja' : 'sube'} ${Math.abs(cambio)} pisos.`
    : `Un contador se encuentra en ${inicio} y su valor cambia en ${cambio} unidades.`;
  return {
    titulo: 'Moverse en la recta', subtema: 'Sentido y distancia', icono: mina ? 'bloque' : 'recta',
    idea: 'Sumar un número positivo desplaza a la derecha. Restarlo desplaza a la izquierda. Si el número que sumas o restas es negativo, el sentido se invierte.',
    visual: {
      tipo: 'recta', titulo: operacion, saltos: cambio !== 0,
      marcas: [{ valor: inicio, texto: cambio ? 'Inicio' : 'Inicio y llegada' }, ...(cambio ? [{ valor: final, texto: 'Llegada' }] : [])],
      ...(cambio ? { recorrido: [inicio, final] } : {})
    },
    ejemplo: { situacion, pregunta: '¿En qué posición termina?', pasos: [`Empieza en ${inicio}.`, `Muévete ${Math.abs(cambio)} unidades ${sentido}.`], resultado: `${operacion} = ${final}` },
    cuidado: 'El signo del número que se suma o resta importa para decidir en qué dirección moverse.'
  };
}

export function fichaInicioLocal({ tema = '', gustos = '', nivel = 'algo', reaccion = 'inicio', nota = '', objetivo = '', historial = [], calibracion = null } = {}) {
  const t = txt(tema || objetivo, 80) || 'el tema', g = txt(gustos, 120) || 'tu día a día';
  const nt = normTxt(`${tema} ${objetivo}`), no = normTxt(objetivo), ng = normTxt(g), paso = historial.filter(x => x.reaccion === 'entendio').length + (reaccion === 'entendio' ? 2 : 1);
  const ultimoTipo = historial.at(-1)?.tipo;
  const mundo = g.split(/,|;| y /)[0]?.trim() || 'tu mundo';
  const esFrac = /fracci/.test(nt), esPorc = /porcent/.test(nt), esEcu = /ecuacion(?:es)? lineal|ecuacion simple|despej/.test(nt), esFoto = /fotosint/.test(nt);
  const esNeg = /numeros enteros|numeros negativos|recta numerica/.test(nt), esLin = /funcion(?:es)? lineal|pendiente de una recta/.test(nt);

  const objMundo = /futbol|messi|gol/.test(ng) ? 'cancha' : /anime|dragon|goku|naruto|luffy/.test(ng) ? 'entrenamiento' : /cocin|abuela|comida/.test(ng) ? 'cocina' : /minecraft|bloque|juego/.test(ng) ? 'partida' : mundo;
  const elegir = (cand) => elegirPorCalibracion(cand, { ultimoTipo, calibracion });
  if (esNeg) {
    const ficha = fichaEnterosLocal(objetivo, gustos);
    if (ficha) return limpiarFichaInicio({ ...ficha, adaptacion: motivoLocal(reaccion, nivel, 'recta', nota, calibracion) });
  }

  if (esFrac) {
    const base = [
      { titulo: 'Qué es una fracción', subtema: 'Partes iguales', icono: 'cocina', idea: 'Abajo va en cuántas partes iguales se divide el total; arriba cuántas partes tomas.', visual: { tipo: 'fraccion', titulo: `Reparto en ${objMundo}`, fracciones: [{ num: 1, den: 4, etiqueta: 'Tu parte' }, { num: 3, den: 4, etiqueta: 'Lo que queda' }], operacion: 'compara', forma: 'pizza' }, ejemplo: { situacion: `En ${objMundo}, divides algo en 4 partes iguales y usas 1.`, pasos: ['Total de partes iguales: 4 (abajo)', 'Partes que tomas: 1 (arriba)'], resultado: '1/4 del total' }, cuidado: 'Si las partes no son del mismo tamaño, no es una fracción justa.', de_ti: 'Abajo dice en cuánto cortas; arriba cuánto agarras.' },
      { titulo: 'Fracciones equivalentes', subtema: 'Misma cantidad', icono: 'balanza', idea: 'Multiplicar o dividir el numerador y el denominador por el mismo número positivo conserva el valor de la fracción.', visual: { tipo: 'fraccion', titulo: '1/2 es igual que 2/4', fracciones: [{ num: 1, den: 2, etiqueta: 'Mitad' }, { num: 2, den: 4, etiqueta: 'Dos cuartos' }], operacion: 'igual', forma: 'barra' }, ejemplo: { situacion: `En ${objMundo}, comparas 1/2 con 2/4.`, pasos: ['1 × 2 = 2 y 2 × 2 = 4', 'Ocupan exactamente el mismo espacio'], resultado: 'Son iguales: 1/2 = 2/4' }, cuidado: 'Números más grandes no hacen mayor la fracción: 2/4 no es mayor que 1/2.', de_ti: 'Multiplicar arriba y abajo por el mismo número positivo conserva la proporción.' },
      { titulo: 'Sumar fracciones', subtema: 'Mismo denominador', icono: 'mas', idea: 'Solo puedes sumar pedazos del mismo tamaño: primero iguala el denominador y suma solo arriba.', visual: { tipo: 'fraccion', titulo: 'Un medio más un cuarto', fracciones: [{ num: 1, den: 2, etiqueta: 'Primero' }, { num: 1, den: 4, etiqueta: 'Después' }, { num: 3, den: 4 }], operacion: 'suma', forma: 'pizza' }, ejemplo: { situacion: `Usas 1/2 en la mañana y 1/4 en la tarde en ${objMundo}.`, pasos: ['Convierte 1/2 en 2/4', 'Suma arriba: 2/4 + 1/4'], resultado: '3/4 en total' }, cuidado: 'No sumes abajo con abajo (1/2 + 1/4 no es 2/6).', de_ti: 'Primero iguala los pedazos; luego suma arriba.' },
      { titulo: 'Pasos para sumar fracciones', subtema: 'Método ordenado', icono: 'pasos', idea: 'Sigue tres pasos claros para sumar cualquier par de fracciones sin confundirte.', visual: { tipo: 'pasos', titulo: 'Ruta sin errores', items: [{ texto: 'Mira el de abajo', detalle: 'Si los denominadores son distintos, búscales un tamaño común', icono: 'lupa' }, { texto: 'Iguala las partes', detalle: 'Multiplica arriba y abajo por el mismo número (ej. 1/2 = 2/4)', icono: 'balanza' }, { texto: 'Suma solo arriba', detalle: '2/4 + 1/4 = 3/4; el denominador no se suma', icono: 'mas' }] }, ejemplo: { situacion: `En ${objMundo}, juntas 1/2 y 1/4 del total.`, pasos: ['Convierte 1/2 en 2/4', 'Suma los numeradores: 2 + 1 = 3'], resultado: '3/4' }, cuidado: 'Nunca sumes los denominadores entre sí.', de_ti: 'Iguala abajo, suma arriba y deja el de abajo quieto.' },
      { titulo: 'Tabla rápida de fracciones', subtema: 'Referencia visual', icono: 'tabla', idea: 'Ver cómo se leen y cuánto valen las fracciones más usadas ayuda a comparar rápido.', visual: { tipo: 'tabla', titulo: 'Equivalencias clave', columnas: ['Fracción', 'Significa', 'Equivalente'], filas: [['1/2', 'La mitad', '2/4'], ['1/4', 'Un cuarto', '2/8'], ['3/4', 'Tres cuartos', '6/8']] }, ejemplo: { situacion: `Comparas cuánto avanza un reto en ${objMundo}.`, pasos: ['1/2 equivale a 2/4', '2/4 es más chico que 3/4'], resultado: '3/4 > 1/2' }, cuidado: 'Un denominador más grande (1/8) significa pedazos más pequeños, no más grandes.', de_ti: 'Más cortes abajo hacen pedazos más chicos.' }
    ];
    const simple = { titulo: 'Error vs acierto en fracciones', subtema: 'Aclarando la base', icono: 'lupa', idea: 'El denominador no se suma y las partes siempre deben ser iguales.', visual: { tipo: 'comparar', titulo: 'Cómo pensarlo bien', izquierda: { titulo: 'Confusión común', icono: 'cruz', puntos: ['Sumar arriba y abajo: 1/2 + 1/4 = 2/6', 'Cortar pedazos desiguales'] }, derecha: { titulo: 'Regla real', icono: 'check', puntos: ['Igualar tamaños: 2/4 + 1/4 = 3/4', 'Todas las partes miden igual'] } }, ejemplo: { situacion: `Piensa en barras iguales dentro de ${objMundo}.`, pasos: ['Corta ambas barras en 4', 'Cuenta los cuartos pintados'], resultado: '3 cuartos = 3/4' }, cuidado: 'El número de abajo solo nombra el tamaño del pedazo.', de_ti: 'Mismo tamaño primero, suma arriba después.' };
    const fracRecta = { titulo: 'Fracciones en la recta', subtema: 'Saltos de tamaño igual', icono: 'recta', idea: 'Cada cuarto avanza 0.25 del total; sumar 1/2 y 1/4 es dar un salto de 2 cuartos más 1 cuarto.', visual: { tipo: 'recta', titulo: 'De 0 a 3/4 paso a paso', min: 0, max: 1, marcas: [{ valor: 0, texto: '0' }, { valor: 0.5, texto: '1/2 (2/4)' }, { valor: 0.75, texto: '3/4' }], saltos: true }, ejemplo: { situacion: `En ${objMundo}, recorres medio tramo y luego un cuarto más.`, pasos: ['1/2 te deja en 0.50 (dos cuartos)', '1/4 más avanza 0.25 hasta 0.75'], resultado: 'Llegas a 3/4 del camino' }, cuidado: 'No confundas la mitad (0.5) con 0.2 — cuenta en partes iguales de la unidad.', de_ti: 'Una fracción también marca un punto exacto del camino.' };
    const fracPartes = { titulo: 'Anatomía de una fracción', subtema: 'Mapa de partes', icono: 'idea', idea: 'Cada número de la fracción cumple un papel distinto para describir cuántas partes iguales tienes.', visual: { tipo: 'partes', titulo: 'Qué dice cada pieza', centro: 'Fracción a/b', items: [{ texto: 'Numerador (arriba)', detalle: 'Cuántas partes tomas', icono: 'meta' }, { texto: 'Denominador (abajo)', detalle: 'En cuánto divides 1 entero', icono: 'bloque' }, { texto: 'Raya fraccionaria', detalle: 'Indica división exacta', icono: 'balanza' }, { texto: 'Equivalencia', detalle: '1/2 ocupa lo mismo que 2/4', icono: 'ciclo' }] }, ejemplo: { situacion: `En 3/4 aplicados a ${objMundo}, el 4 parte y el 3 elige.`, pasos: ['El 4 divide el entero en cuartos', 'El 3 toma tres de esos cuartos'], resultado: '3/4 del total' }, cuidado: 'Si el número de abajo crece, cada pedazo se vuelve más pequeño.', de_ti: 'Arriba cuánto tomas; abajo en cuánto partes.' };
    if (/equival/.test(nt) && !/sum|rest/.test(no)) {
      const contexto = CONTEXTOS_EQUIVALENCIA.find(c => c.coincide.test(ng)) || {
        contexto: 'Compara dos barras del mismo largo con divisiones diferentes.', entero: 'Barra', parte: 'partes', forma: 'barra', icono: 'balanza'
      };
      const distintos = historial.filter(f => f.reaccion === 'ejemplo').length % 2;
      const [n, d] = reaccion === 'reto' ? [3, 4] : reaccion === 'ejemplo' ? (distintos ? [1, 3] : [2, 5]) : [1, 2];
      const inicial = `${n}/${d}`, final = `${n * 2}/${d * 2}`;
      const ejemplo = {
        situacion: `${contexto.contexto} En la primera unidad señalas ${n} de ${d} ${contexto.parte} iguales.`,
        pregunta: `Si divides la segunda unidad en ${d * 2} ${contexto.parte} iguales, ¿cuántas cubren la misma cantidad?`,
        pasos: [`Cada parte original se convierte en dos partes más pequeñas.`, `Multiplica ${n} y ${d} por 2, así obtienes ${final}.`],
        resultado: `${inicial} = ${final}. Es la misma proporción del entero.`
      };
      const equivalencia = { ...base[1], icono: contexto.icono, ejemplo, visual: {
        tipo: 'fraccion', titulo: `${contexto.entero}: ${inicial} y ${final}`, operacion: 'igual', forma: contexto.forma,
        fracciones: [{ num: n, den: d, etiqueta: `${n} de ${d} ${contexto.parte}` }, { num: n * 2, den: d * 2, etiqueta: `${n * 2} de ${d * 2} ${contexto.parte}` }]
      } };
      const comparar = { ...equivalencia, titulo: 'La misma cantidad con más divisiones', visual: {
        tipo: 'comparar', titulo: `${inicial} y ${final}`,
        izquierda: { titulo: inicial, puntos: [`Divide la unidad en ${d} partes iguales`, `Señala ${n}`] },
        derecha: { titulo: final, puntos: [`Divide cada parte por la mitad`, `Señala ${n * 2} para ocupar la misma cantidad`] }
      } };
      const recta = { ...equivalencia, titulo: 'Dos nombres en el mismo punto', visual: { tipo: 'recta', titulo: 'La misma posición', min: 0, max: 1, marcas: [{ valor: 0, texto: '0' }, { valor: n / d, texto: `${inicial} = ${final}` }, { valor: 1, texto: '1' }] } };
      const candidatos = reaccion === 'duda' ? [comparar, equivalencia] : [equivalencia, comparar, recta];
      const f = elegir(candidatos);
      return limpiarFichaInicio({ ...f, adaptacion: motivoLocal(reaccion, nivel, f.visual.tipo, nota, calibracion) });
    }
    const idxObj = /equival/.test(no) ? 1 : /sum|rest|mixt/.test(no) ? 2 : (nivel === 'bastante' ? 2 : nivel === 'algo' ? 1 : 0);
    const ordered = [...base.slice((idxObj + Math.max(0, paso - 1)) % base.length), ...base];
    const unique = ordered.filter((v, i, a) => a.indexOf(v) === i);
    const extrasEnfoque = (reaccion === 'enfoque' || calibracion?.pinTipo) ? [simple, fracRecta, fracPartes] : [];
    const f = reaccion === 'duda' ? elegir([simple, ...unique.filter(x => x.visual.tipo !== 'fraccion')]) : elegir([...unique, ...extrasEnfoque]);
    return limpiarFichaInicio({ ...f, adaptacion: motivoLocal(reaccion, nivel, f.visual.tipo, nota, calibracion) });
  }
  if (esPorc) {
    const f = elegir([
      { titulo: 'Qué es un porcentaje', subtema: 'Por cada cien', icono: 'grafico', idea: 'Un porcentaje compara una parte contra un total de 100. 50 % es la mitad; 25 % es un cuarto.', visual: { tipo: 'torta', titulo: `Reparto de tiempo en ${objMundo}`, unidad: '%', items: [{ texto: 'Práctica', valor: 50, icono: 'energia' }, { texto: 'Táctica', valor: 25, icono: 'idea' }, { texto: 'Descanso', valor: 25, icono: 'agua' }] }, ejemplo: { situacion: `Si dedicas el 25 % de 100 minutos a táctica en ${objMundo}, ¿cuánto es?`, pasos: ['25 % = 25 de cada 100', '1/4 de 100 = 25'], resultado: '25 minutos' }, cuidado: 'El 25 % no siempre es 25: depende de cuánto sea el total.', de_ti: 'Por ciento significa de cada cien.' },
      { titulo: 'Comparar porcentajes', subtema: 'Aplicado a totales', icono: 'grafico', idea: 'Para sacar un porcentaje de cualquier cantidad, multiplica por el porcentaje y divide entre 100.', visual: { tipo: 'barras', titulo: 'Descuentos comparados', unidad: '%', items: [{ texto: '10 %', valor: 10, icono: 'moneda' }, { texto: '25 %', valor: 25, icono: 'chispa' }, { texto: '50 %', valor: 50, icono: 'energia' }] }, ejemplo: { situacion: `Algo de ${objMundo} cuesta 80 y tiene 25 % de descuento.`, pasos: ['80 × 25 = 2000', '2000 ÷ 100 = 20'], resultado: 'Rebaja de 20 (pagas 60)' }, cuidado: 'No restes 25 directo al precio: primero calcula el 25 % del precio.', de_ti: 'Multiplica por el porcentaje y divide entre 100.' },
      { titulo: 'Cómo sacar cualquier %', subtema: 'Método paso a paso', icono: 'pasos', idea: 'Sigue tres pasos fijos para convertir cualquier porcentaje en una cantidad real.', visual: { tipo: 'pasos', titulo: 'Cálculo en 3 pasos', items: [{ texto: 'Identifica el 100 %', detalle: 'Cuál es tu total completo', icono: 'meta' }, { texto: 'Multiplica arriba', detalle: 'Total × porcentaje buscado', icono: 'mas' }, { texto: 'Divide entre 100', detalle: 'Mueve dos lugares decimales', icono: 'balanza' }] }, ejemplo: { situacion: `25 % de 80 en ${objMundo}.`, pasos: ['Total 80 × 25 = 2000', '2000 ÷ 100 = 20'], resultado: '20' }, cuidado: 'Nunca restes el % como si fuera una cantidad fija.', de_ti: 'Multiplica por el % y parte en 100.' },
      { titulo: 'Atajos de porcentaje', subtema: 'Tabla rápida', icono: 'tabla', idea: 'Memorizar los porcentajes clave en fracción te permite calcular casi todo de cabeza.', visual: { tipo: 'tabla', titulo: 'De porcentaje a atajo', columnas: ['Porcentaje', 'Fracción', 'En 80 sería'], filas: [['50 %', 'La mitad (÷ 2)', '40'], ['25 %', 'Un cuarto (÷ 4)', '20'], ['10 %', 'Entre 10', '8']] }, ejemplo: { situacion: `Calcula rápido el 25 % de 80 en ${objMundo}.`, pasos: ['25 % es dividir entre 4', '80 ÷ 4 = 20'], resultado: '20' }, cuidado: 'El 10 % se saca dividiendo entre 10, no restando 10.', de_ti: '50 % es mitad, 25 % cuarto, 10 % décima parte.' }
    ]);
    return limpiarFichaInicio({ ...f, adaptacion: motivoLocal(reaccion, nivel, f.visual.tipo, nota, calibracion) });
  }
  if (esEcu || esLin || esFoto) {
    const f = esEcu
      ? elegir([
        { titulo: 'Despejar paso a paso', subtema: 'Orden inverso', icono: 'balanza', idea: 'Para hallar x, deshaces las operaciones desde la más lejana hacia x, aplicando lo mismo a ambos lados.', visual: { tipo: 'ecuacion', titulo: 'Resolver 2x + 4 = 14', lineas: [{ expresion: '2x + 4 = 14' }, { expresion: '2x = 14 − 4', nota: 'Resto 4 a ambos lados' }, { expresion: '2x = 10' }, { expresion: 'x = 10 ÷ 2', nota: 'Divido entre 2' }, { expresion: 'x = 5' }] }, ejemplo: { situacion: `En ${objMundo}, 2 rondas iguales más 4 puntos extras suman 14.`, pasos: ['Quita los 4 extras: quedan 10', 'Divide en 2 rondas iguales'], resultado: '5 puntos por ronda' }, cuidado: 'No dividas antes de quitar lo que suma o resta suelto.', de_ti: 'Lo último que entró sale primero.' },
        { titulo: 'Orden para despejar la x', subtema: 'Balanza justa', icono: 'pasos', idea: 'Una ecuación es una balanza equilibrada: lo que haces de un lado lo haces del otro.', visual: { tipo: 'pasos', titulo: 'Cómo liberar x', items: [{ texto: 'Separa los términos', detalle: 'Deja lo que tiene x de un lado', icono: 'pasos' }, { texto: 'Pasa lo que suma o resta', detalle: 'Cambia al signo contrario al otro lado', icono: 'ciclo' }, { texto: 'Pasa lo que multiplica', detalle: 'Dividiendo ambos lados', icono: 'balanza' }] }, ejemplo: { situacion: `En 2x + 4 = 14 dentro de ${objMundo}.`, pasos: ['Resta 4 → 2x = 10', 'Divide entre 2 → x = 5'], resultado: 'x = 5' }, cuidado: 'Cada lado de la igualdad debe recibir exactamente la misma operación.', de_ti: 'Cuida la balanza: igual a ambos lados.' }
      ])
      : esLin ? { titulo: 'Cómo crece una recta', subtema: 'Pendiente e inicio', icono: 'grafico', idea: 'La recta y = mx + b pasa por b cuando x vale cero. Por cada unidad que aumenta x, y cambia en m.', visual: { tipo: 'grafico', titulo: `Avance en ${objMundo}`, ejeX: 'Pasos', ejeY: 'Total', puntos: [{ x: 0, y: 2, texto: 'Inicio' }, { x: 1, y: 5 }, { x: 2, y: 8 }, { x: 3, y: 11 }, { x: 4, y: 14 }] }, ejemplo: { situacion: `Empiezas con 2 puntos y ganas 3 por ronda.`, pasos: ['Ronda 0: 2', 'Ronda 4: 3 × 4 + 2 = 14'], resultado: '14 puntos' }, cuidado: 'No olvides sumar el punto de inicio cuando x vale 0.', de_ti: 'Inicio más cambio constante.' }
      : {
        titulo: 'Cómo se alimenta una planta', subtema: 'Fotosíntesis', icono: 'hoja',
        idea: 'La planta usa la energía de la luz para fabricar azúcares a partir de agua y dióxido de carbono. Durante el proceso libera oxígeno.',
        visual: { tipo: 'pasos', titulo: 'De la luz a los azúcares', items: [
          { texto: 'Llegan agua y CO₂', detalle: 'El agua llega desde las raíces y el dióxido de carbono entra por la hoja.', icono: 'agua' },
          { texto: 'La hoja capta luz', detalle: 'La energía de la luz impulsa reacciones que producen azúcares.', icono: 'sol' },
          { texto: 'La planta libera oxígeno', detalle: 'El oxígeno pasa al ambiente y la planta usa o almacena los azúcares.', icono: 'hoja' }
        ] },
        ejemplo: { situacion: 'Una planta recibe agua y CO₂, pero pasa todo un día en oscuridad.', pregunta: '¿Puede seguir realizando fotosíntesis durante ese tiempo?', pasos: ['El agua y el CO₂ aportan materiales.', 'Sin luz, faltaría la fuente de energía del proceso.'], resultado: 'La oscuridad impide la fotosíntesis.' },
        cuidado: 'La luz aporta energía. El agua y el dióxido de carbono aportan materiales.'
      };
    return limpiarFichaInicio({ ...f, adaptacion: motivoLocal(reaccion, nivel, f.visual.tipo, nota, calibracion) });
  }

  return limpiarFichaInicio({
    titulo: 'Prepara tu explicación', subtema: t,
    adaptacion: 'El modo práctica no tiene una ficha de contenido para este tema.',
    idea: nota ? `Anota qué quieres aclarar: «${txt(nota, 130)}».` : `Usa apuntes o una fuente de clase para preparar cómo explicarías ${t}.`,
    visual: { tipo: 'pasos', titulo: 'Antes de enseñarle', items: [
      { texto: 'Encuentra la idea central', detalle: 'Comprueba qué significa en tus apuntes.', icono: 'libro' },
      { texto: 'Busca un caso concreto', detalle: `¿Dónde aparece esta idea en ${objMundo}?`, icono: 'meta' },
      { texto: 'Prepara una pregunta', detalle: '¿Puedes justificar el resultado con tus palabras?', icono: 'lupa' }
    ] }
  });
}

function motivoLocal(reaccion, nivel, tipo, nota, calibracion) {
  if (reaccion === 'enfoque') return `Cambiamos el enfoque${nota ? ` («${nota.slice(0, 60)}»)` : ''} usando el formato animado «${tipo}».`;
  if (calibracion?.pinTipo === tipo) return `Usamos el formato «${tipo}» que fijaste manualmente en tu calibración.`;
  const esPref = calibracion?.preferidos?.some(p => p.tipo === tipo);
  const esExp = calibracion?.estrategia === 'explorar' && calibracion?.explorar?.some(p => (p.tipo || p) === tipo);
  if (reaccion === 'duda') return `Repasa la idea con un ejemplo de práctica en formato «${tipo}».`;
  if (reaccion === 'ejemplo') return `Ejemplo de práctica en formato «${tipo}».`;
  if (reaccion === 'reto') return `Subimos la exigencia a un reto práctico con visual «${tipo}».`;
  if (esPref && calibracion?.estrategia === 'aprovechar') return `Elegimos «${tipo}» porque es de los formatos que mejor te han funcionado.`;
  if (esExp) return `Probamos «${tipo}» en modo exploración para medir si este formato te ayuda más.`;
  if (reaccion === 'entendio') return `Avanzamos al siguiente paso y variamos el diseño a «${tipo}».`;
  return `Ficha inicial ajustada a nivel «${nivel}» con visual «${tipo}».`;
}
