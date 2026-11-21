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
const OPERACIONES = ['ninguna', 'suma', 'resta', 'igual', 'compara'];

/* ================= Esquema para la IA ================= */
export function esquemaFicha() {
  const s = d => ({ type: 'string', description: d });
  const item = { type: 'object', properties: { texto: s('Texto corto (máximo 6 palabras)'), detalle: s('Detalle opcional (máximo 12 palabras)'), icono: s('Un emoji'), valor: { type: 'number', description: 'Número, si el visual lo usa (barras, torta, iconos)' }, fecha: s('Fecha o año (solo línea de tiempo)') }, required: ['texto'] };
  const lado = { type: 'object', properties: { titulo: s('Título corto'), icono: s('Un emoji'), puntos: { type: 'array', maxItems: 4, items: s('Máximo 8 palabras') } }, required: ['titulo', 'puntos'] };
  return {
    type: 'object',
    properties: {
      titulo: s('Título de la ficha, máximo 6 palabras'),
      icono: s('Un emoji que represente la idea'),
      idea: s('La idea clave en 1 o 2 oraciones simples y correctas, máximo 35 palabras'),
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
          marcas: { type: 'array', maxItems: 6, items: { type: 'object', properties: { valor: { type: 'number' }, texto: s('Etiqueta corta') }, required: ['valor'] }, description: 'Puntos de la recta numérica, en orden' },
          saltos: { type: 'boolean', description: 'Dibujar saltos entre marcas seguidas (para sumas y restas en la recta)' },
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
        type: 'object', description: 'Un ejemplo resuelto de su mundo',
        properties: { situacion: s('El problema en su mundo, máximo 30 palabras'), pasos: { type: 'array', maxItems: 4, items: s('Un paso, máximo 14 palabras') }, resultado: s('La respuesta, máximo 12 palabras') },
        required: ['situacion', 'resultado']
      },
      cuidado: s('El error en que cayó el aprendín (o el más común) y cómo evitarlo, máximo 25 palabras'),
      de_ti: s('Lo mejor que dijo el estudiante al enseñarle, citado o resumido, máximo 20 palabras')
    },
    required: ['titulo', 'icono', 'idea', 'visual', 'ejemplo', 'cuidado', 'de_ti']
  };
}

/* ================= Limpieza ================= */
const txt = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const num = (v, def = 0) => { const x = Number(v); return Number.isFinite(x) ? x : def; };
const ent = (v, a, b, def) => Math.max(a, Math.min(b, Math.round(num(v, def))));
const emoji = v => { const s = txt(v, 16); return [...s].slice(0, 4).join(''); };
const mcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

export function limpiarFicha(r = {}) {
  const v = r.visual || {};
  const tipo = TIPOS[v.tipo] ? v.tipo : 'pasos';
  const items = (Array.isArray(v.items) ? v.items : []).slice(0, 8).map(i => ({ texto: txt(i?.texto, 60), detalle: txt(i?.detalle, 100), icono: emoji(i?.icono), valor: num(i?.valor, NaN), fecha: txt(i?.fecha, 24) })).filter(i => i.texto);
  const lado = l => ({ titulo: txt(l?.titulo, 40), icono: emoji(l?.icono), puntos: (Array.isArray(l?.puntos) ? l.puntos : []).map(p => txt(p, 70)).filter(Boolean).slice(0, 4) });
  const vis = { tipo, titulo: txt(v.titulo, 70), items, centro: txt(v.centro, 50), unidad: txt(v.unidad, 12) };
  if (tipo === 'comparar') { vis.izquierda = lado(v.izquierda); vis.derecha = lado(v.derecha); }
  if (tipo === 'fraccion') {
    vis.fracciones = (Array.isArray(v.fracciones) ? v.fracciones : []).slice(0, 4).map(f => ({ num: ent(f?.num, 0, 60, 1), den: ent(f?.den, 1, 24, 2), etiqueta: txt(f?.etiqueta, 30) }));
    vis.operacion = OPERACIONES.includes(v.operacion) ? v.operacion : 'ninguna';
    vis.forma = v.forma === 'barra' ? 'barra' : 'pizza';
    corregirFracciones(vis);
  }
  if (tipo === 'recta') {
    const marcas = (Array.isArray(v.marcas) ? v.marcas : []).slice(0, 6).map(m => ({ valor: num(m?.valor, NaN), texto: txt(m?.texto, 24) })).filter(m => Number.isFinite(m.valor));
    let min = num(v.min, NaN), max = num(v.max, NaN);
    const vals = marcas.map(m => m.valor);
    if (!Number.isFinite(min) || (vals.length && min > Math.min(...vals))) min = Math.floor(Math.min(0, ...vals) - 1);
    if (!Number.isFinite(max) || (vals.length && max < Math.max(...vals))) max = Math.ceil(Math.max(...vals, min + 5) + 1);
    if (max - min > 200) max = min + 200;
    if (max <= min) max = min + 10;
    Object.assign(vis, { marcas, min, max, saltos: !!v.saltos });
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
  const e = r.ejemplo || {};
  return {
    titulo: txt(r.titulo, 60) || 'Lo que aprendí', icono: emoji(r.icono) || '✨', idea: txt(r.idea, 260), visual: vis,
    ejemplo: { situacion: txt(e.situacion, 220), pasos: (Array.isArray(e.pasos) ? e.pasos : []).map(p => txt(p, 110)).filter(Boolean).slice(0, 4), resultado: txt(e.resultado, 100) },
    cuidado: txt(r.cuidado, 200), de_ti: txt(r.de_ti, 160).replace(/^[«"“']+|[»"”']+$/g, '').trim()
  };
}
function visualTieneDatos(v) {
  switch (v.tipo) {
    case 'comparar': return v.izquierda?.puntos.length && v.derecha?.puntos.length;
    case 'fraccion': return v.fracciones?.length;
    case 'recta': return v.marcas?.length;
    case 'ecuacion': return v.lineas?.length;
    case 'tabla': return v.filas?.length;
    case 'grafico': return v.puntos?.length >= 2;
    case 'barras': case 'torta': case 'iconos': return v.items.filter(i => Number.isFinite(i.valor)).length >= 1;
    default: return v.items.length >= 2;
  }
}
// La cuenta la hace el código: si la IA se equivocó en el resultado, se corrige.
function corregirFracciones(v) {
  const fs = v.fracciones, val = f => f.num / f.den;
  if ((v.operacion === 'suma' || v.operacion === 'resta') && fs.length >= 2) {
    const [a, b] = fs, d = a.den * b.den / mcd(a.den, b.den), n = v.operacion === 'suma' ? a.num * d / a.den + b.num * d / b.den : a.num * d / a.den - b.num * d / b.den;
    const ok = { num: Math.max(0, n), den: d, etiqueta: fs[2]?.etiqueta || 'Resultado' };
    if (fs.length < 3 || Math.abs(val(fs[2]) - ok.num / ok.den) > 1e-9) fs.splice(2, fs.length - 2, ok);
    else fs.length = 3;
  }
  if (v.operacion === 'igual' && fs.length >= 2 && fs.some(f => Math.abs(val(f) - val(fs[0])) > 1e-9)) v.operacion = 'compara';
  if (v.operacion === 'compara') fs.length = Math.min(fs.length, 2);
}

/* ================= Dibujo ================= */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = v => Math.round(v * 10) / 10;
const SERIE = ['#6C63FF', '#FF6B5B', '#2CC4A8', '#FFB020', '#4BA3FF', '#FF6FB1', '#7BBF3A', '#A66BFF'];
const fmt = x => Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100).replace('.', ',');
let cuenta = 0; // ids únicos para las flechas de cada visual
const ico = (i, cls = 'v-ico') => i ? `<span class="${cls}" aria-hidden="true">${esc(i)}</span>` : '';

const VISUALES = {
  pasos(v) {
    return `<ol class="v-pasos">${v.items.map((it, i) => `<li style="--i:${i}"><span class="v-num">${i + 1}</span><div>${ico(it.icono)}<b>${esc(it.texto)}</b>${it.detalle ? `<small>${esc(it.detalle)}</small>` : ''}</div></li>`).join('')}</ol>`;
  },
  ciclo(v) {
    const N = Math.max(2, v.items.length), R = 36, cx = 50, cy = 50, del = N > 4 ? 16 : 20, mid = `vf${++cuenta}`;
    const pos = i => { const a = (-90 + i * 360 / N) * Math.PI / 180; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; };
    const arco = i => {
      const a0 = (-90 + i * 360 / N + del) * Math.PI / 180, a1 = (-90 + (i + 1) * 360 / N - del) * Math.PI / 180;
      return `<path class="v-trazo" style="--i:${i}" d="M${r1(cx + Math.cos(a0) * R)} ${r1(cy + Math.sin(a0) * R)}A${R} ${R} 0 0 1 ${r1(cx + Math.cos(a1) * R)} ${r1(cy + Math.sin(a1) * R)}" pathLength="1" marker-end="url(#${mid})"/>`;
    };
    return `<div class="v-ciclo"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--c)"/></marker></defs><g class="v-giro">${v.items.map((_, i) => arco(i)).join('')}</g></svg>
${v.centro ? `<div class="v-centro">${esc(v.centro)}</div>` : ''}
${v.items.map((it, i) => { const [x, y] = pos(i); return `<div class="v-nodo" style="--i:${i};left:${r1(x)}%;top:${r1(y)}%">${ico(it.icono, 'v-burbuja')}<b>${esc(it.texto)}</b></div>`; }).join('')}</div>`;
  },
  partes(v) {
    const N = v.items.length, pos = i => { const a = (-90 + i * 360 / N + (N % 2 ? 0 : 180 / N)) * Math.PI / 180; return [50 + Math.cos(a) * 36, 50 + Math.sin(a) * 37]; };
    return `<div class="v-partes"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${v.items.map((_, i) => { const [x, y] = pos(i); return `<line class="v-trazo" style="--i:${i}" x1="50" y1="50" x2="${r1(x)}" y2="${r1(y)}" pathLength="1"/>`; }).join('')}</svg>
<div class="v-centro">${esc(v.centro || v.titulo)}</div>
${v.items.map((it, i) => { const [x, y] = pos(i); return `<div class="v-nodo" style="--i:${i};left:${r1(x)}%;top:${r1(y)}%">${ico(it.icono)}<b>${esc(it.texto)}</b>${it.detalle ? `<small>${esc(it.detalle)}</small>` : ''}</div>`; }).join('')}</div>`;
  },
  comparar(v) {
    const col = (l, k, c) => `<div class="v-col v-col-${k}" style="--i:${k === 'izq' ? 0 : 1}"><h5>${ico(l.icono)}${esc(l.titulo)}</h5><ul>${l.puntos.map((p, i) => `<li style="--i:${i + 1}">${esc(p)}</li>`).join('')}</ul></div>`;
    return `<div class="v-comparar">${col(v.izquierda, 'izq')}<span class="v-vs">vs</span>${col(v.derecha, 'der')}</div>`;
  },
  barras(v) {
    const its = v.items.filter(i => Number.isFinite(i.valor)), max = Math.max(...its.map(i => i.valor), 0) || 1;
    return `<div class="v-barras">${its.map((it, i) => `<div class="v-barra" style="--i:${i};--h:${r1(Math.max(0, it.valor) / max * 100)}%;--b:${SERIE[i % SERIE.length]}"><span class="v-val">${fmt(it.valor)}${esc(v.unidad && v.unidad !== '%' ? ' ' + v.unidad : v.unidad)}</span><span class="v-col-b"><i></i></span>${ico(it.icono)}<span class="v-lab">${esc(it.texto)}</span></div>`).join('')}</div>`;
  },
  torta(v) {
    const its = v.items.filter(i => Number.isFinite(i.valor) && i.valor > 0), tot = its.reduce((a, i) => a + i.valor, 0) || 1;
    let acc = 0;
    const segs = its.map((it, i) => { const p = it.valor / tot, s = `<circle class="v-seg" style="--i:${i};--p:${r1(p * 100)};--o:${r1(-acc * 100)}" cx="50" cy="50" r="36" pathLength="100" stroke="${SERIE[i % SERIE.length]}"/>`; acc += p; return s; }).join('');
    return `<div class="v-torta"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="36" fill="none" stroke="#EEEAFB" stroke-width="20"/>${segs}</svg>
<ul>${its.map((it, i) => `<li style="--i:${i}"><i style="background:${SERIE[i % SERIE.length]}"></i>${ico(it.icono)}<span>${esc(it.texto)}</span><b>${v.unidad === '%' || !v.unidad ? Math.round(it.valor / tot * 100) + '%' : fmt(it.valor) + ' ' + esc(v.unidad)}</b></li>`).join('')}</ul></div>`;
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
    let k = 0; // contador de porciones para animar en orden
    const dibujo = f => {
      const enteros = Math.max(1, Math.min(3, Math.ceil(f.num / f.den) || 1)), barra = v.forma === 'barra' || f.den > 12;
      let s = '';
      for (let w = 0; w < enteros; w++) {
        const llenas = Math.max(0, Math.min(f.den, f.num - w * f.den));
        if (barra) {
          const W = 100 / f.den;
          s += `<svg class="v-fr-barra" viewBox="0 0 102 22" aria-hidden="true">${Array.from({ length: f.den }, (_, j) => `<rect x="${r1(1 + j * W)}" y="1" width="${r1(W)}" height="20" class="${j < llenas ? 'v-llena' : 'v-vacia'}" style="--i:${j < llenas ? k++ : 0}"/>`).join('')}</svg>`;
        } else {
          const porc = j => { if (f.den === 1) return `<circle cx="22" cy="22" r="20" class="${llenas ? 'v-llena' : 'v-vacia'}" style="--i:${llenas ? k++ : 0}"/>`; const a0 = (-90 + j * 360 / f.den) * Math.PI / 180, a1 = (-90 + (j + 1) * 360 / f.den) * Math.PI / 180; return `<path d="M22 22L${r1(22 + Math.cos(a0) * 20)} ${r1(22 + Math.sin(a0) * 20)}A20 20 0 0 1 ${r1(22 + Math.cos(a1) * 20)} ${r1(22 + Math.sin(a1) * 20)}Z" class="${j < llenas ? 'v-llena' : 'v-vacia'}" style="--i:${j < llenas ? k++ : 0}"/>`; };
          s += `<svg class="v-fr-pizza" viewBox="0 0 44 44" aria-hidden="true">${Array.from({ length: f.den }, (_, j) => porc(j)).join('')}</svg>`;
        }
      }
      return `<div class="v-fr-dib">${s}</div>`;
    };
    return `<div class="v-fracciones${fs.length === 1 ? ' v-fr-sola' : ''}">${fs.map((f, i) => `<div class="v-fr">${v.ocultarNumeros ? '' : `<div class="v-fr-num"><span>${f.num}</span><span>${f.den}</span></div>`}${dibujo(f)}${f.etiqueta ? `<small>${esc(f.etiqueta)}</small>` : ''}</div>${i < fs.length - 1 && simbolo(i) ? `<span class="v-op">${simbolo(i)}</span>` : ''}`).join('')}</div>`;
  },
  recta(v) {
    const mid = `vf${++cuenta}`, W = 320, x0 = 16, x1 = W - 16, X = val => x0 + (val - v.min) / (v.max - v.min) * (x1 - x0), Y = 70;
    const rango = v.max - v.min, paso = rango <= 20 ? 1 : rango <= 50 ? 5 : rango <= 100 ? 10 : 20;
    let ticks = '';
    for (let t = Math.ceil(v.min / paso) * paso; t <= v.max + 1e-9; t += paso) ticks += `<line x1="${r1(X(t))}" y1="${Y - 5}" x2="${r1(X(t))}" y2="${Y + 5}"/><text x="${r1(X(t))}" y="${Y + 20}" class="v-tnum">${fmt(t)}</text>`;
    const m = v.marcas;
    const saltos = v.saltos ? m.slice(1).map((b, i) => { const a = m[i], xa = X(a.valor), xb = X(b.valor), h = Math.min(40, 12 + Math.abs(xb - xa) * .25), d = b.valor - a.valor; return `<path class="v-trazo" style="--i:${i + 1}" d="M${r1(xa)} ${Y - 6}Q${r1((xa + xb) / 2)} ${r1(Y - 6 - h * 2)} ${r1(xb)} ${Y - 6}" pathLength="1" marker-end="url(#${mid})"/><text class="v-salto" style="--i:${i + 1}" x="${r1((xa + xb) / 2)}" y="${r1(Y - 10 - h)}">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}</text>`; }).join('') : '';
    const puntos = m.map((p, i) => `<g class="v-punto" style="--i:${i}"><circle cx="${r1(X(p.valor))}" cy="${Y}" r="6"/>${p.texto ? `<text x="${r1(X(p.valor))}" y="${v.saltos ? Y + 36 : Y - 14}" class="v-etq">${esc(p.texto)}</text>` : ''}</g>`).join('');
    return `<svg class="v-recta" viewBox="0 0 ${W} ${v.saltos ? 112 : 100}" aria-hidden="true"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--c)"/></marker></defs><line class="v-eje" x1="${x0 - 8}" y1="${Y}" x2="${x1 + 8}" y2="${Y}"/><g class="v-ticks">${ticks}</g>${saltos}${puntos}</svg>`;
  },
  linea_tiempo(v) {
    return `<ol class="v-tiempo">${v.items.map((it, i) => `<li style="--i:${i}"><span class="v-fecha">${esc(it.fecha || it.detalle || '')}</span><span class="v-hito"></span><div>${ico(it.icono)}<b>${esc(it.texto)}</b>${it.fecha && it.detalle ? `<small>${esc(it.detalle)}</small>` : ''}</div></li>`).join('')}</ol>`;
  },
  ecuacion(v) {
    const n = v.lineas.length;
    return `<ol class="v-ecuacion">${v.lineas.map((l, i) => `<li style="--i:${i}"${i === n - 1 ? ' class="v-final"' : ''}><code>${esc(l.expresion)}</code>${l.nota ? `<span>${esc(l.nota)}</span>` : ''}</li>`).join('')}</ol>`;
  },
  tabla(v) {
    return `<div class="v-tabla"><table>${v.columnas.length ? `<thead><tr>${v.columnas.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>` : ''}<tbody>${v.filas.map((f, i) => `<tr style="--i:${i}">${f.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  },
  grafico(v) {
    const P = v.puntos, W = 320, H = 190, L = 40, R = 14, T = 14, B = 34;
    const xs = P.map(p => p.x), ys = P.map(p => p.y);
    let xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(0, ...ys), yb = Math.max(...ys);
    if (xb === xa) xb = xa + 1; if (yb === ya) yb = ya + 1;
    const X = x => L + (x - xa) / (xb - xa) * (W - L - R), Y = y => H - B - (y - ya) / (yb - ya) * (H - T - B);
    const d = P.map((p, i) => `${i ? 'L' : 'M'}${r1(X(p.x))} ${r1(Y(p.y))}`).join('');
    const marcasY = [ya, (ya + yb) / 2, yb].map(y => `<line class="v-guia" x1="${L}" y1="${r1(Y(y))}" x2="${W - R}" y2="${r1(Y(y))}"/><text class="v-tnum" x="${L - 6}" y="${r1(Y(y) + 4)}" text-anchor="end">${fmt(Math.round(y * 100) / 100)}</text>`).join('');
    const marcasX = P.map(p => `<text class="v-tnum" x="${r1(X(p.x))}" y="${H - B + 16}">${fmt(p.x)}</text>`).join('');
    return `<svg class="v-grafico" viewBox="0 0 ${W} ${H}" aria-hidden="true">${marcasY}<line class="v-eje" x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}"/><line class="v-eje" x1="${L}" y1="${T}" x2="${L}" y2="${H - B}"/>${marcasX}
<path class="v-linea v-trazo" d="${d}" pathLength="1"/>${P.map((p, i) => `<g class="v-punto" style="--i:${i}"><circle cx="${r1(X(p.x))}" cy="${r1(Y(p.y))}" r="5"/>${p.texto ? `<text class="v-etq" x="${r1(X(p.x))}" y="${r1(Y(p.y) - 10)}">${esc(p.texto)}</text>` : ''}</g>`).join('')}
${v.ejeX ? `<text class="v-ejeT" x="${(L + W - R) / 2}" y="${H - 4}">${esc(v.ejeX)}</text>` : ''}${v.ejeY ? `<text class="v-ejeT" x="12" y="${(T + H - B) / 2}" transform="rotate(-90 12 ${(T + H - B) / 2})">${esc(v.ejeY)}</text>` : ''}</svg>`;
  },
  iconos(v) {
    let k = 0;
    return `<div class="v-iconos">${v.items.filter(i => Number.isFinite(i.valor)).map(it => { const n = Math.max(0, Math.min(24, Math.round(it.valor))); return `<div class="v-ifila"><span class="v-lab">${esc(it.texto)}</span><span class="v-ilista">${Array.from({ length: n }, () => `<i style="--i:${k++}">${esc(it.icono || '●')}</i>`).join('')}</span><b>${fmt(it.valor)}</b></div>`; }).join('')}</div>`;
  }
};

export function htmlVisual(v) {
  const dib = (VISUALES[v.tipo] || VISUALES.pasos)(v);
  return `<figure class="vis vis-${v.tipo}">${v.titulo ? `<figcaption>${esc(v.titulo)}</figcaption>` : ''}${dib}<button class="vis-otra" type="button" aria-label="Ver la animación otra vez" title="Ver otra vez">↻</button></figure>`;
}

// ctx: { numero, fase, mundo, avatar (HTML del aprendín), tono: { base, claro, oscuro } }
export function htmlFicha(f, ctx = {}) {
  const t = ctx.tono || { base: '#6C63FF', claro: '#EFEDFF', oscuro: '#4B43D1' };
  const e = f.ejemplo || {};
  return `<article class="ficha-ap" style="--c:${t.base};--c-claro:${t.claro};--c-osc:${t.oscuro}">
<header class="fi-cab"><span class="fi-ico" aria-hidden="true">${esc(f.icono)}</span><div class="fi-tit"><small>Ficha ${ctx.numero || ''}${ctx.fase ? ` · ${esc(ctx.fase)}` : ''}</small><h3>${esc(f.titulo)}</h3></div>${ctx.avatar ? `<span class="fi-av">${ctx.avatar}</span>` : ''}</header>
${f.idea ? `<p class="fi-idea">${esc(f.idea)}</p>` : ''}
${htmlVisual(f.visual)}
${e.situacion ? `<section class="fi-ejemplo"><h4>Ejemplo${ctx.mundo ? ` en ${esc(ctx.mundo.charAt(0).toLowerCase() + ctx.mundo.slice(1))}` : ''}</h4><p>${esc(e.situacion)}</p>${e.pasos?.length ? `<ol>${e.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>` : ''}${e.resultado ? `<p class="fi-res">${esc(e.resultado)}</p>` : ''}</section>` : ''}
${f.cuidado ? `<aside class="fi-cuidado"><b>¡Ojo!</b> ${esc(f.cuidado)}</aside>` : ''}
${f.de_ti ? `<blockquote class="fi-deti"><p>«${esc(f.de_ti)}»</p><cite>Lo que me enseñaste</cite></blockquote>` : ''}
</article>`;
}

/* ================= Ficha sin IA ================= */
// Arma una ficha con las propias palabras del estudiante: sus oraciones se vuelven los pasos.
export function fichaLocal(concepto, mensajes = []) {
  const frases = mensajes.join(' ').split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 8);
  const mejor = [...mensajes].sort((a, b) => b.length - a.length)[0] || '';
  return limpiarFicha({
    titulo: concepto, icono: '📝', idea: frases[0] || mejor,
    visual: { tipo: 'pasos', titulo: 'Cómo me lo explicaste', items: frases.slice(0, 4).map(f => ({ texto: f.split(' ').slice(0, 6).join(' ') + (f.split(' ').length > 6 ? '…' : ''), detalle: f.split(' ').length > 6 ? f.slice(0, 100) : '' })) },
    ejemplo: {}, cuidado: '', de_ti: mejor.slice(0, 150)
  });
}
