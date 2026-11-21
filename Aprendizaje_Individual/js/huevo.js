// El huevo del aprendín: se diseña con los gustos del estudiante (colores, patrón, forma y brillo).
// La IA lo elige junto con las preguntas; sin IA, huevoLocal() lo deduce de palabras clave.
// svgHuevo() devuelve el SVG con dos mitades (para que se rompa) y la grieta.
import { PALETA, color, tonos, mover } from './color.js';
import { n, P, estrella, poligono } from './trazos.js';

export const PATRONES = {
  lunares: 'Lunares', estrellas: 'Estrellas', rayas: 'Rayas', zigzag: 'Zigzag', pixeles: 'Píxeles', escamas: 'Escamas',
  manchas: 'Manchas', rombos: 'Rombos andinos', ondas: 'Ondas', llamas: 'Llamas', notas: 'Notas musicales', corazones: 'Corazones',
  rayos: 'Rayos', hexagonos: 'Hexágonos', costuras: 'Costuras de balón de básquet', balon: 'Parches de balón de fútbol',
  galaxia: 'Galaxia', circuitos: 'Circuitos', grietas_lava: 'Grietas de lava', hojas: 'Hojas', burbujas: 'Burbujas', liso: 'Liso'
};
export const FORMAS_HUEVO = { clasico: 'Clásico', redondo: 'Redondo', alto: 'Alto', bloque: 'De bloques' };
export const TAMANOS = ['chico', 'mediano', 'grande'];
export const BRILLOS = ['mate', 'brillante', 'perlado'];
const COLORES = Object.keys(PALETA);

const txt = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function esquemaHuevo() {
  const c = d => ({ type: 'string', enum: COLORES, description: d });
  return {
    type: 'object', description: 'El huevo de donde nacerá, diseñado con sus gustos',
    properties: {
      nombre: { type: 'string', description: 'Nombre del huevo, 2 a 5 palabras («Huevo de cuatro estrellas», «Huevo creeper»)' },
      base: c('Color principal de la cáscara'),
      color2: c('Color del patrón'),
      color3: c('Color de detalle o del brillo del aura'),
      patron: { type: 'string', enum: Object.keys(PATRONES) },
      cantidad: { type: 'integer', description: 'Cuántas figuras del patrón (1 a 12). Con «estrellas» y tamaño grande, el número de estrellas' },
      tamano: { type: 'string', enum: TAMANOS },
      forma: { type: 'string', enum: Object.keys(FORMAS_HUEVO) },
      brillo: { type: 'string', enum: BRILLOS }
    },
    required: ['nombre', 'base', 'color2', 'patron', 'forma', 'brillo']
  };
}

export function limpiarHuevo(h = {}) {
  if (!h || typeof h !== 'object') h = {};
  const de = (v, xs, def) => (Array.isArray(xs) ? xs : Object.keys(xs)).includes(v) ? v : def;
  return {
    nombre: txt(h.nombre, 40),
    base: color(h.base, PALETA.nieve), color2: color(h.color2, PALETA.uva), color3: color(h.color3, PALETA.sol),
    patron: de(h.patron, PATRONES, 'lunares'), cantidad: Math.max(1, Math.min(12, parseInt(h.cantidad, 10) || 6)),
    tamano: de(h.tamano, TAMANOS, 'mediano'), forma: de(h.forma, FORMAS_HUEVO, 'clasico'), brillo: de(h.brillo, BRILLOS, 'brillante')
  };
}

/* ---------- Huevo sin IA: palabras clave de los gustos ---------- */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const RECETAS = [
  [/dragon ?ball|goku|vegeta|esfera/, { nombre: 'Huevo de cuatro estrellas', base: 'mandarina', color2: 'coral', color3: 'sol', patron: 'estrellas', cantidad: 4, tamano: 'grande', forma: 'redondo', brillo: 'brillante' }],
  [/minecraft|creeper|bloque|roblox|pixel/, { nombre: 'Huevo de bloques', base: 'lima', color2: 'menta', color3: 'carbon', patron: 'pixeles', forma: 'bloque', brillo: 'mate' }],
  [/basquet|baloncesto|nba|lebron|curry|jordan/, { nombre: 'Huevo de cancha', base: 'mandarina', color2: 'carbon', color3: 'sol', patron: 'costuras', forma: 'redondo', brillo: 'mate' }],
  [/futbol|messi|cristiano|seleccion|gol/, { nombre: 'Huevo goleador', base: 'nieve', color2: 'carbon', color3: 'cielo', patron: 'balon', forma: 'redondo', brillo: 'brillante' }],
  [/naruto|ninja|ramen/, { nombre: 'Huevo ninja', base: 'mandarina', color2: 'carbon', color3: 'cielo', patron: 'zigzag', forma: 'clasico', brillo: 'brillante' }],
  [/one piece|luffy|pirata|barco|mar\b|oceano/, { nombre: 'Huevo pirata', base: 'cielo', color2: 'nieve', color3: 'sol', patron: 'ondas', forma: 'clasico', brillo: 'brillante' }],
  [/anime|manga|pelea/, { nombre: 'Huevo de poder', base: 'sol', color2: 'mandarina', color3: 'coral', patron: 'llamas', forma: 'clasico', brillo: 'brillante' }],
  [/espacio|planeta|estrella|galaxia|astronaut/, { nombre: 'Huevo galáctico', base: 'indigo', color2: 'nieve', color3: 'uva', patron: 'galaxia', forma: 'clasico', brillo: 'perlado' }],
  [/musica|cantar|banda|rap|rock|kpop|k-pop/, { nombre: 'Huevo musical', base: 'uva', color2: 'nieve', color3: 'chicle', patron: 'notas', forma: 'clasico', brillo: 'perlado' }],
  [/dinosaurio|dino|reptil/, { nombre: 'Huevo jurásico', base: 'lima', color2: 'cacao', color3: 'sol', patron: 'manchas', forma: 'alto', brillo: 'mate' }],
  [/dragon|fuego|volcan/, { nombre: 'Huevo de dragón', base: 'coral', color2: 'carbon', color3: 'sol', patron: 'escamas', forma: 'alto', brillo: 'brillante' }],
  [/andes|aguayo|llama|bolivia|folklore|caporal|morenada/, { nombre: 'Huevo andino', base: 'nieve', color2: 'coral', color3: 'menta', patron: 'rombos', forma: 'clasico', brillo: 'mate' }],
  [/robot|program|tecnolog|compu|codigo/, { nombre: 'Huevo digital', base: 'carbon', color2: 'menta', color3: 'cielo', patron: 'circuitos', forma: 'clasico', brillo: 'brillante' }],
  [/cocin|comida|reposter|pastel|abuela/, { nombre: 'Huevo de la cocina', base: 'durazno', color2: 'coral', color3: 'sol', patron: 'lunares', forma: 'redondo', brillo: 'brillante' }],
  [/gato|perro|animal|mascota/, { nombre: 'Huevo peludo', base: 'durazno', color2: 'cacao', color3: 'chicle', patron: 'manchas', forma: 'redondo', brillo: 'mate' }],
  [/planta|jardin|naturaleza|bosque|flor/, { nombre: 'Huevo del bosque', base: 'menta', color2: 'lima', color3: 'sol', patron: 'hojas', forma: 'clasico', brillo: 'mate' }],
  [/electric|rayo|pokemon|pikachu/, { nombre: 'Huevo eléctrico', base: 'sol', color2: 'carbon', color3: 'coral', patron: 'rayos', forma: 'redondo', brillo: 'brillante' }],
  [/heroe|marvel|spider|batman|comic/, { nombre: 'Huevo heroico', base: 'coral', color2: 'cielo', color3: 'sol', patron: 'hexagonos', forma: 'clasico', brillo: 'brillante' }],
  [/amor|corazon|romance|novela/, { nombre: 'Huevo de corazones', base: 'rosado', color2: 'chicle', color3: 'nieve', patron: 'corazones', forma: 'clasico', brillo: 'perlado' }]
];
export function huevoLocal(gustos = '') {
  const g = norm(gustos);
  const r = RECETAS.find(([re]) => re.test(g));
  if (r) return limpiarHuevo(r[1]);
  // sin pistas: colores y patrón a partir del texto (siempre el mismo para los mismos gustos)
  let h = 7; for (const c of g) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const claros = ['sol', 'menta', 'cielo', 'chicle', 'lima', 'mandarina', 'uva'];
  const pats = ['lunares', 'zigzag', 'rayas', 'estrellas', 'corazones', 'ondas'];
  return limpiarHuevo({ nombre: 'Huevo misterioso', base: claros[h % claros.length], color2: claros[(h >> 3) % claros.length] === claros[h % claros.length] ? 'nieve' : claros[(h >> 3) % claros.length], color3: 'nieve', patron: pats[(h >> 6) % pats.length], forma: 'clasico', brillo: 'brillante' });
}

/* ---------- Dibujo ---------- */
// Formas: todas caben en 0..120 × 0..150 con la base en y=144.
const CONTORNOS = {
  clasico: 'M60 6C88 6 112 52 112 88C112 122 90 144 60 144C30 144 8 122 8 88C8 52 32 6 60 6Z',
  redondo: 'M60 14C92 14 114 46 114 84C114 120 90 144 60 144C30 144 6 120 6 84C6 46 28 14 60 14Z',
  alto: 'M60 0C84 0 104 50 104 90C104 124 86 144 60 144C34 144 16 124 16 90C16 50 36 0 60 0Z',
  bloque: 'M44 8H76V20H92V36H104V60H112V112H104V128H88V140H32V128H16V112H8V60H16V36H28V20H44Z'
};
const CORTE = 'M-10 -10H130V82L108 74L96 84L84 72L72 84L60 72L48 84L36 72L24 84L12 74L-10 82Z';
const CORTE_ABAJO = 'M-10 82L12 74L24 84L36 72L48 84L60 72L72 84L84 72L96 84L108 74L130 82V160H-10Z';
const GRIETA = 'M9 80L12 74L24 84L36 72L48 84L60 72L72 84L84 72L96 84L108 74L111 80';

// Puntos repartidos sobre el huevo, siempre los mismos (para que el patrón no salte al redibujar).
function puntos(k, semilla = 1) {
  const out = []; const ang = 2.39996;
  for (let i = 0; i < k; i++) { const r = Math.sqrt((i + .5) / k), a = i * ang + semilla; out.push([60 + Math.cos(a) * r * 46, 80 + Math.sin(a) * r * 58]); }
  return out;
}
const TAM = { chico: .7, mediano: 1, grande: 1.5 };

function patron(h, T2, T3) {
  const c2 = T2.base, c3 = T3.base, s = TAM[h.tamano], k = h.cantidad;
  const borde = `stroke="${T2.oscuro}" stroke-width="1.6" stroke-linejoin="round"`;
  switch (h.patron) {
    case 'lunares': return puntos(Math.max(5, k), .7).map(([x, y], i) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n((4 + (i % 3) * 2.5) * s)}" fill="${i % 4 === 3 ? c3 : c2}"/>`).join('');
    case 'estrellas': {
      if (h.tamano === 'grande') { // como una esfera: k estrellas grandes en el centro
        const m = Math.min(k, 7);
        const pos = m === 1 ? [[60, 84]] : m <= 4
          ? Array.from({ length: m }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / m + (m === 2 ? Math.PI / 2 : m === 4 ? Math.PI / 4 : 0); return [60 + Math.cos(a) * 17, 86 + Math.sin(a) * 17]; })
          : [[60, 86], ...Array.from({ length: m - 1 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / (m - 1); return [60 + Math.cos(a) * 23, 86 + Math.sin(a) * 23]; })];
        const r = m === 1 ? 22 : m <= 4 ? 12 : 9.5;
        return pos.map(([x, y]) => `<path d="${estrella(x, y, r, 5, .45)}" fill="${c2}" ${borde}/>`).join('');
      }
      return puntos(Math.max(5, k), .3).map(([x, y], i) => `<path d="${estrella(x, y, (5 + (i % 3) * 2) * s, 5, .45)}" fill="${i % 3 === 2 ? c3 : c2}"/>`).join('');
    }
    case 'rayas': return [32, 58, 104, 126].map((y, i) => `<rect x="-5" y="${y}" width="130" height="${n(9 * s)}" fill="${i % 2 ? c3 : c2}"/>`).join('');
    case 'zigzag': return [44, 92, 122].map((y, j) => { let d = `M-5 ${y}`; for (let x = -5, i = 0; x < 130; x += 12, i++) d += `L${x + 12} ${i % 2 ? y : y - 10}`; return `<path d="${d}" fill="none" stroke="${j === 1 ? c3 : c2}" stroke-width="${n(6 * s)}" stroke-linejoin="round"/>`; }).join('');
    case 'pixeles': {
      let r = ''; const q = 10;
      for (let y = 0; y < 150; y += q) for (let x = 0; x < 120; x += q) { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1; const a = Math.abs(v); if (a > .55) r += `<rect x="${x}" y="${y}" width="${q}" height="${q}" fill="${a > .85 ? c3 : c2}"/>`; else if (a < .12) r += `<rect x="${x}" y="${y}" width="${q}" height="${q}" fill="${mover(c2, -.12)}"/>`; }
      return r;
    }
    case 'escamas': { let r = ''; for (let y = 10, j = 0; y < 150; y += 14, j++) for (let x = j % 2 ? 0 : 9; x < 125; x += 18) r += `<path d="M${x - 9} ${y}a9 9 0 0 0 18 0" fill="none" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`; return r; }
    case 'manchas': return puntos(Math.max(4, Math.min(k, 8)), 1.4).map(([x, y], i) => { const r = (7 + (i % 3) * 4) * s; return `<path d="M${n(x - r)} ${n(y)}C${n(x - r)} ${n(y - r * 1.1)} ${n(x + r * .6)} ${n(y - r * 1.2)} ${n(x + r)} ${n(y - r * .2)}C${n(x + r * 1.2)} ${n(y + r * .8)} ${n(x - r * .2)} ${n(y + r * 1.1)} ${n(x - r)} ${n(y)}Z" fill="${i % 3 === 2 ? c3 : c2}" opacity=".9"/>`; }).join('');
    case 'rombos': return [40, 80, 118].map((y, j) => { let r = `<rect x="-5" y="${y - 12}" width="130" height="24" fill="${j === 1 ? c2 : c3}" opacity=".9"/>`; for (let x = 0; x < 125; x += 20) r += `<path d="M${x} ${y}l10 -10l10 10l-10 10z" fill="${j === 1 ? c3 : c2}"/><path d="M${x + 7} ${y}l3 -3l3 3l-3 3z" fill="#fff"/>`; return r; }).join('');
    case 'ondas': return [38, 64, 90, 116].map((y, j) => { let d = `M-5 ${y}`; for (let x = -5; x < 130; x += 20) d += `q5 -${n(7 * s)} 10 0t10 0`; return `<path d="${d}" fill="none" stroke="${j % 2 ? c3 : c2}" stroke-width="4" stroke-linecap="round"/>`; }).join('');
    case 'llamas': return [10, 32, 54, 76, 98, 118].map((x, i) => { const h2 = (38 + (i % 3) * 16) * s; return `<path d="M${x - 14} 150C${x - 16} ${150 - h2 * .5} ${x - 4} ${150 - h2 * .6} ${x} ${150 - h2}C${x + 6} ${150 - h2 * .6} ${x + 16} ${150 - h2 * .5} ${x + 14} 150Z" fill="${c2}"/><path d="M${x - 7} 150C${x - 8} ${150 - h2 * .35} ${x - 2} ${150 - h2 * .4} ${x} ${150 - h2 * .62}C${x + 3} ${150 - h2 * .4} ${x + 8} ${150 - h2 * .35} ${x + 7} 150Z" fill="${c3}"/>`; }).join('');
    case 'notas': return puntos(Math.max(4, Math.min(k, 8)), .9).map(([x, y], i) => `<g fill="${i % 3 === 2 ? c3 : c2}" transform="translate(${n(x)} ${n(y)}) scale(${n(s)}) rotate(${(i % 3 - 1) * 12})"><ellipse cx="-3" cy="6" rx="5" ry="3.8" transform="rotate(-20 -3 6)"/><rect x="1" y="-10" width="2.4" height="16"/>${i % 2 ? '<path d="M1 -10q8 2 8 9q-3 -4 -8 -4z"/>' : ''}</g>`).join('');
    case 'corazones': return puntos(Math.max(5, k), 1.1).map(([x, y], i) => { const r = (5 + (i % 3) * 2) * s; return `<path d="M${n(x)} ${n(y + r)}C${n(x - r * 1.6)} ${n(y)} ${n(x - r * .9)} ${n(y - r * 1.3)} ${n(x)} ${n(y - r * .4)}C${n(x + r * .9)} ${n(y - r * 1.3)} ${n(x + r * 1.6)} ${n(y)} ${n(x)} ${n(y + r)}Z" fill="${i % 3 === 2 ? c3 : c2}"/>`; }).join('');
    case 'rayos': return puntos(Math.max(3, Math.min(k, 7)), .5).map(([x, y], i) => { const r = 9 * s; return `<path d="M${n(x + r * .3)} ${n(y - r * 1.3)}L${n(x - r * .7)} ${n(y + r * .15)}H${n(x)}L${n(x - r * .3)} ${n(y + r * 1.3)}L${n(x + r * .7)} ${n(y - r * .15)}H${n(x)}Z" fill="${i % 3 === 2 ? c3 : c2}" ${borde}/>`; }).join('');
    case 'hexagonos': { let r = ''; for (let y = 8, j = 0; y < 150; y += 17, j++) for (let x = j % 2 ? 10 : 0; x < 125; x += 20) r += `<path d="${poligono(x, y, 9, 6, 0)}" fill="none" stroke="${(x + y) % 3 ? c2 : c3}" stroke-width="2.2"/>`; return r; }
    case 'costuras': return `<g fill="none" stroke="${c2}" stroke-width="3.2" stroke-linecap="round"><path d="M60 -5V155"/><path d="M-5 84H125"/><path d="M22 10C46 40 46 120 22 150"/><path d="M98 10C74 40 74 120 98 150"/></g>`;
    case 'balon': return [[60, 76, 15], [26, 50, 10], [94, 50, 10], [24, 112, 11], [96, 112, 11], [60, 134, 9], [60, 22, 9]].map(([x, y, r]) => `<path d="${poligono(x, y, r * s, 5)}" fill="${c2}"/>`).join('') + `<g stroke="${c2}" stroke-width="1.6" opacity=".5" fill="none"><path d="M60 61V31M46 71L34 55M74 71L86 55M51 89L32 104M69 89L88 104M60 91V125"/></g>`;
    case 'galaxia': return `<ellipse cx="44" cy="62" rx="40" ry="22" fill="${c3}" opacity=".45" transform="rotate(-24 44 62)"/><ellipse cx="78" cy="108" rx="34" ry="16" fill="${c3}" opacity=".35" transform="rotate(-24 78 108)"/>` + puntos(22, 3.1).map(([x, y], i) => i % 5 === 0 ? `<path d="${estrella(x, y, 4.5, 4, .35)}" fill="${c2}"/>` : `<circle cx="${n(x)}" cy="${n(y)}" r="${i % 3 ? 1.1 : 1.8}" fill="${c2}"/>`).join('');
    case 'circuitos': return [[20, 30, 1], [70, 22, -1], [30, 70, 1], [86, 64, -1], [18, 108, 1], [64, 104, 1], [92, 126, -1]].map(([x, y, d]) => `<path d="M${x} ${y}h${16 * d}l8 8v14" fill="none" stroke="${c2}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="3.4" fill="${c3}"/><circle cx="${x + 16 * d + 8}" cy="${y + 22}" r="3" fill="none" stroke="${c2}" stroke-width="2"/>`).join('');
    case 'grietas_lava': return `<g fill="none" stroke="${c2}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M30 20l8 14l-6 10l12 12M84 28l-6 14l10 8l-4 16M20 84l14 6l4 14l14 4M100 84l-12 10l2 14l-10 10M50 120l10 -10l12 6"/></g><g fill="none" stroke="${c3}" stroke-width="1.2" stroke-linecap="round"><path d="M30 20l8 14l-6 10l12 12M84 28l-6 14l10 8l-4 16M20 84l14 6l4 14l14 4M100 84l-12 10l2 14l-10 10M50 120l10 -10l12 6"/></g>`;
    case 'hojas': return puntos(Math.max(5, Math.min(k, 9)), 2.6).map(([x, y], i) => { const r = (8 + (i % 3) * 2) * s; return `<g transform="translate(${n(x)} ${n(y)}) rotate(${i * 47 % 360})"><path d="M0 ${n(-r)}C${n(r * .8)} ${n(-r * .4)} ${n(r * .8)} ${n(r * .5)} 0 ${n(r)}C${n(-r * .8)} ${n(r * .5)} ${n(-r * .8)} ${n(-r * .4)} 0 ${n(-r)}Z" fill="${i % 3 === 2 ? c3 : c2}"/><path d="M0 ${n(-r * .8)}V${n(r * .8)}" stroke="${T2.oscuro}" stroke-width="1"/></g>`; }).join('');
    case 'burbujas': return puntos(Math.max(6, k), .4).map(([x, y], i) => { const r = (4 + (i % 4) * 2.5) * s; return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${c2}" fill-opacity=".25" stroke="${c2}" stroke-width="1.6"/><circle cx="${n(x - r * .35)}" cy="${n(y - r * .35)}" r="${n(r * .22)}" fill="#fff"/>`; }).join('');
    default: return '';
  }
}

let cont = 0;
// svgHuevo(h, { clase }) → <svg> con .huevo-abajo, .huevo-arriba y la grieta (.huevo-grieta o la que pidas)
export function svgHuevo(hIn, { grieta = 'huevo-grieta', grietaD = GRIETA } = {}) {
  const h = limpiarHuevo(hIn), id = `hv${++cont}`;
  const T1 = tonos(h.base), T2 = tonos(h.color2), T3 = tonos(h.color3);
  const cont0 = CONTORNOS[h.forma];
  const brillo = h.brillo === 'mate' ? '' : h.brillo === 'perlado'
    ? `<ellipse cx="40" cy="44" rx="20" ry="30" fill="#fff" opacity=".35" transform="rotate(24 40 44)"/><ellipse cx="86" cy="104" rx="10" ry="18" fill="#fff" opacity=".18" transform="rotate(24 86 104)"/>`
    : `<ellipse cx="38" cy="42" rx="12" ry="22" fill="#fff" opacity=".55" transform="rotate(24 38 42)"/><circle cx="52" cy="22" r="4" fill="#fff" opacity=".7"/>`;
  const forma = `<path d="${cont0}" fill="url(#${id}-l)"/><g clip-path="url(#${id}-c)">${patron(h, T2, T3)}<path d="${cont0}" fill="url(#${id}-s)"/>${brillo}</g><path d="${cont0}" fill="none" stroke="${T1.oscuro}" stroke-width="3" stroke-linejoin="round"/>`;
  return `<svg class="huevo-svg" viewBox="0 0 120 150" overflow="visible" aria-hidden="true" style="--aura:${T3.base}">
<defs>
  <radialGradient id="${id}-l" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${T1.claro}"/><stop offset=".55" stop-color="${T1.base}"/><stop offset="1" stop-color="${T1.oscuro}"/></radialGradient>
  <radialGradient id="${id}-s" cx=".35" cy=".28" r=".9"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
  <clipPath id="${id}-c"><path d="${cont0}"/></clipPath>
  <clipPath id="${id}-a"><path d="${CORTE}"/></clipPath>
  <clipPath id="${id}-b"><path d="${CORTE_ABAJO}"/></clipPath>
  <g id="${id}-f">${forma}</g>
</defs>
<g class="huevo-abajo" clip-path="url(#${id}-b)"><use href="#${id}-f"/></g>
<g class="huevo-arriba" clip-path="url(#${id}-a)"><use href="#${id}-f"/></g>
<path class="${grieta}" d="${grietaD}" fill="none" stroke="${T1.tinta}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="100"/>
</svg>`;
}
// Grieta del nacimiento: nace en el centro y se abre hacia los lados.
export const GRIETA_CENTRO = 'M60 72L48 84L36 72L24 84L12 74L9 80M60 72L72 84L84 72L96 84L108 74L111 80';
