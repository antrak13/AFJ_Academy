// Aprendín: el personaje al que el estudiante le enseña.
// Todo es SVG generado por código:
//   · el cuerpo sale de un perfil matemático (FORMAS), así cualquier pieza sabe dónde está la cabeza o los hombros;
//   · la cara tiene parámetros continuos (apertura de ojos, curva de la boca, ángulo de cejas…);
//   · cada emoción es una mezcla de esos parámetros, y el personaje pasa de una a otra sin saltos.
// El vestuario (piezas.js) se dibuja encima con las mismas medidas.
import { PALETA, color, tonos, mover } from './color.js';
import { PIEZAS, SLOTS, NIVELES, pintarPieza, CUELLOS, ESTAMPADOS, EMBLEMAS } from './piezas.js';
import { n, lim, curvaCerrada, curvaAbierta, estrella } from './trazos.js';
import { limpiarDibujo } from './dibujo.js';

const TINTA = '#1E1B3A', BOCA = '#5B1A32', LENGUA = '#FF8A9A', RUBOR = '#FF6F8E';
const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= Formas del cuerpo ================= */
// W, H: ancho y alto · tm: altura del punto más ancho (0 arriba, 1 abajo)
// nArr / nAba: redondez de la mitad de arriba y de abajo (2 = elipse, más alto = más cuadrado, menos de 2 = en punta)
// ojos: altura de los ojos
export const FORMAS = {
  bollo: { nombre: 'Bolita', W: 158, H: 146, tm: .54, nArr: 2, nAba: 2.5, ojos: .39 },
  gota: { nombre: 'Gota', W: 146, H: 156, tm: .62, nArr: 1.55, nAba: 2.6, ojos: .46 },
  pera: { nombre: 'Pera', W: 158, H: 148, tm: .66, nArr: 1.85, nAba: 2.7, ojos: .41 },
  huevo: { nombre: 'Huevo', W: 140, H: 156, tm: .58, nArr: 1.85, nAba: 2.4, ojos: .4 },
  torre: { nombre: 'Torre', W: 124, H: 160, tm: .52, nArr: 2.8, nAba: 3.3, ojos: .37 },
  cubo: { nombre: 'Cubo', W: 146, H: 138, tm: .5, nArr: 5.5, nAba: 5.5, ojos: .39 }
};

const cacheGeo = new Map();
export function geometria(forma) {
  const id = FORMAS[forma] ? forma : 'bollo';
  if (cacheGeo.has(id)) return cacheGeo.get(id);
  const F = FORMAS[id];
  const cx = 130, piso = 236, top = piso - F.H;
  const frac = t => {
    t = lim(t, 0, 1);
    if (t < F.tm) { const u = 1 - t / F.tm; return Math.pow(Math.max(0, 1 - Math.pow(u, F.nArr)), 1 / F.nArr); }
    const u = (t - F.tm) / (1 - F.tm); return Math.pow(Math.max(0, 1 - Math.pow(u, F.nAba)), 1 / F.nAba);
  };
  const hw = t => F.W / 2 * frac(t);
  const y = t => top + lim(t, 0, 1) * F.H;

  // contorno en sentido horario: lado derecho de arriba abajo y lado izquierdo de abajo arriba
  const N = 44, der = [];
  for (let i = 0; i <= N; i++) { const t = (1 - Math.cos(Math.PI * i / N)) / 2; der.push([cx + hw(t), y(t)]); }
  const contorno = der.concat(der.slice(1, N).reverse().map(([x, yy]) => [2 * cx - x, yy]));
  const path = curvaCerrada(contorno);
  // normales hacia afuera de cada punto del contorno
  const normales = contorno.map((p, i) => {
    const a = contorno[(i - 1 + contorno.length) % contorno.length], b = contorno[(i + 1) % contorno.length];
    const tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1;
    return [ty / L, -tx / L];
  });

  let tS = 0; while (tS < .3 && hw(tS) * 2 < F.W * .6) tS += .005;
  const R = lim(F.W * .088, 10.5, 13.5);
  const ojoY = y(F.ojos), ojoDx = lim(hw(F.ojos) * .3, 15, 22);
  const bocaY = ojoY + R * 1.95;
  const tC = lim((bocaY + R * 1.05 - top) / F.H, 0, .8);
  const tH = lim(F.ojos + .15, 0, .75);

  const centro = [cx, top + F.H * .5];
  const g = {
    forma: id, F, cx, piso, top, W: F.W, H: F.H, hw, y, path, contorno, normales,
    sombrero: { y: y(tS), w: hw(tS) * 2, t: tS, cubre: y(tS) - top },
    ojo: { y: ojoY, dx: ojoDx, r: R },
    boca: { y: bocaY },
    cuello: { y: y(tC), w: hw(tC) * 2, t: tC },
    hombro: { y: y(tH), dx: hw(tH) - 6 },
    brazo: { L: R * 2.3, w: R * 1.7 },
    pies: { rx: F.W * .17, ry: F.W * .095, dx: F.W * .19 },
    // punto del borde por ángulo desde el centro del cuerpo: s=0 arriba, s=±1 a los costados (a media altura).
    // off lo separa hacia afuera. rot = giro para que una pieza dibujada «hacia arriba» apunte hacia afuera.
    borde(s, off = 0) {
      const th = lim(s, -1.2, 1.2) * Math.PI / 2, dx = Math.sin(th), dy = -Math.cos(th);
      let mejor = null;
      for (let i = 0; i < contorno.length; i++) {
        const a = contorno[i], b = contorno[(i + 1) % contorno.length], ex = b[0] - a[0], ey = b[1] - a[1];
        const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
        const ax = a[0] - centro[0], ay = a[1] - centro[1], t = (ax * ey - ay * ex) / den, u = (ax * dy - ay * dx) / den;
        if (t > 0 && u >= 0 && u <= 1 && (!mejor || t > mejor.t)) mejor = { t, i, u };
      }
      const { t, i, u } = mejor, n0 = normales[i], n1 = normales[(i + 1) % normales.length];
      let nx = n0[0] + (n1[0] - n0[0]) * u, ny = n0[1] + (n1[1] - n0[1]) * u; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      return { x: centro[0] + dx * t + nx * off, y: centro[1] + dy * t + ny * off, nx, ny, rot: Math.atan2(nx, -ny) * 180 / Math.PI };
    },
    // valor de s que cae a la altura t (por ejemplo, la de los ojos)
    sDe(t) { return Math.atan2(hw(t), centro[1] - y(t)) / (Math.PI / 2); }
  };
  cacheGeo.set(id, g);
  return g;
}

/* ================= Cara y brazos ================= */
// Parámetros de la cara (todos numéricos, así se pueden mezclar):
// ojoA apertura · ojoS sonrisa de ojos (^ ^) · ojoT inclinación (+ triste, − enojado)
// cejaY altura · cejaA ángulo (+ preocupado, − enojado) · cejaAsim una ceja más alta
// bocaW ancho · bocaC curva (+ sonrisa, − tristeza) · bocaA apertura · bocaX hacia un lado · bocaOnda temblorosa
// rubor · incl inclinación del cuerpo · mirX/mirY hacia dónde mira · rebote · temblor
export const BASE = { ojoA: 1, ojoS: 0, ojoT: 0, cejaY: 0, cejaA: 0, cejaAsim: 0, bocaW: .75, bocaC: .3, bocaA: 0, bocaX: 0, bocaOnda: 0, rubor: .4, incl: 0, mirX: 0, mirY: 0, rebote: 0, temblor: 0 };

// Brazos: bracitos redondos que giran desde el hombro.
// ang: 0 = colgando, 90 = hacia afuera, 180 = hacia arriba, negativo = hacia adentro (sobre la cara o la panza).
// obj: ángulo del objeto que lleva en la mano derecha.
const POSES = {
  abajo: { ang: 22, obj: 150 }, cadera: { ang: -8, obj: 190 }, arriba: { ang: 160, obj: 0 }, saludo: { ang: 125, obj: 15 },
  celebrar: { ang: 140, obj: 10 }, encoger: { ang: 95, obj: 50 }, adelante: { ang: -42, obj: -50 }, sostener: { ang: 65, obj: 15 },
  menton: { ang: -145, obj: -20 }, tapar: { ang: -158, obj: -10 }
};
function resolverPose(g, nombre) { const P = POSES[nombre] || POSES.abajo; return { ang: P.ang, obj: P.obj }; }

/* ================= Rasgos ================= */
// Rasgos fijos de cada aprendín (además de la forma y el color): tipo de ojos, boca, panza y marcas.
export const OJOS = {
  redondos: { nombre: 'Redondos', rx: .78, ry: 1.05, br: 1, iris: .62 },
  grandes: { nombre: 'Grandes', rx: .96, ry: 1.26, br: 1.25, iris: .34 },
  puntitos: { nombre: 'Puntitos', rx: .44, ry: .54, br: .6, iris: 1 },
  ovalados: { nombre: 'Ovalados', rx: .62, ry: 1.34, br: 1.15, iris: .46 },
  pestanas: { nombre: 'Con pestañas', rx: .8, ry: 1.06, br: 1, iris: .55, pestanas: true }
};
export const BOCAS = { normal: 'Normal', colmillo: 'Colmillo', dientes: 'Dientes' };
export const MARCAS = { ninguna: 'Ninguna', manchas: 'Manchas', rayas: 'Rayas', punta: 'Punta', estrella: 'Estrella' };
const EST0 = OJOS.ovalados;

function caminoOjo(g, p, lado, parp, est = EST0) {
  const R = g.ojo.r, a = Math.max(0, p.ojoA * parp), s = lim(p.ojoS, 0, 1);
  const ex = g.cx + lado * g.ojo.dx, ey = g.ojo.y;
  const rx = R * est.rx, ry = R * est.ry * a, ryb = ry * (1 - 1.5 * s), k = R * .18 * s;
  const ang = p.ojoT * 14 * lado * Math.PI / 180, co = Math.cos(ang), si = Math.sin(ang);
  const P = (x, y) => `${n(ex + x * co - y * si)} ${n(ey + x * si + y * co)}`;
  return `M${P(-rx, k)}C${P(-rx, k - ry * 1.33)} ${P(rx, k - ry * 1.33)} ${P(rx, k)}C${P(rx, k + ryb * 1.33)} ${P(-rx, k + ryb * 1.33)} ${P(-rx, k)}Z`;
}
function brillosOjo(g, p, lado, parp, est = EST0) {
  const R = g.ojo.r, a = Math.max(0, p.ojoA * parp), s = lim(p.ojoS, 0, 1);
  const ex = g.cx + lado * g.ojo.dx, ey = g.ojo.y, ry = R * est.ry * a, rx = R * est.rx;
  return {
    x1: ex - rx * .3 + p.mirX * R * .16, y1: ey - ry * .4 + p.mirY * R * .1, r1: R * .3 * est.br,
    x2: ex + rx * .33 + p.mirX * R * .1, y2: ey + ry * .28, r2: R * .14 * est.br,
    op: lim((a * (1 - s * 1.3) - .35) * 2.6, 0, 1)
  };
}
function caminoPestanas(g, p, lado, parp, est = EST0) {
  if (!est.pestanas) return '';
  const R = g.ojo.r, a = Math.max(0, p.ojoA * parp), s = lim(p.ojoS, 0, 1);
  const ex = g.cx + lado * g.ojo.dx, ey = g.ojo.y, rx = R * est.rx, ry = R * est.ry * a, k = R * .18 * s;
  const x0 = ex + lado * rx * .92, y0 = ey + k - ry * .35, x1 = ex + lado * rx * .55, y1 = ey + k - ry * .9;
  return `M${n(x0)} ${n(y0)}l${n(lado * R * .55)} ${n(-R * .35)}M${n(x1)} ${n(y1)}l${n(lado * R * .4)} ${n(-R * .5)}`;
}
function caminoCeja(g, p, lado) {
  const R = g.ojo.r, ex = g.cx + lado * g.ojo.dx;
  const base = g.ojo.y - R * 1.05 * lim(p.ojoA, .8, 1.15) - R * .78;
  const yy = base - p.cejaY * R * .55 - (lado > 0 ? p.cejaAsim : -p.cejaAsim * .5) * R * .45;
  const L = R * .9, ang = p.cejaA * 22 * lado * Math.PI / 180, co = Math.cos(ang), si = Math.sin(ang);
  const P = (x, y) => `${n(ex + x * co - y * si)} ${n(yy + x * si + y * co)}`;
  return `M${P(-L, 0)}Q${P(0, -R * .32)} ${P(L, 0)}`;
}
function caminoBoca(g, p, fase = 0, tipo = 'normal') {
  const R = g.ojo.r, w = R * 2.3 * p.bocaW, cx = g.cx + p.bocaX * R * .5, cy = g.boca.y;
  const c = p.bocaC, o = Math.max(0, p.bocaA);
  const esq = -c * R * .55, cSup = c * R * .25, cInf = cSup + o * R * 1.5 + Math.max(0, c) * o * R * .5;
  const sesgo = p.bocaX * R * .35, sup = [], inf = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 5 - 1, x = cx + u * w / 2, par = 1 - u * u, ye = esq - u * sesgo;
    const onda = p.bocaOnda * R * .22 * Math.sin(u * Math.PI * 2.5 + fase);
    sup.push([x, cy + ye + (cSup - esq) * par + onda]);
    inf.push([x, cy + ye + (cInf - esq) * par + onda * (1 - lim(o, 0, 1))]);
  }
  const lengua = { cx, cy: cy + cInf - R * .2, rx: w * .3, ry: R * .55, op: lim((o - .25) * 3, 0, 1) };
  let diente = '';
  if (tipo === 'colmillo') { const [x, y] = sup[7], d = R * .28; diente = `M${n(x - d)} ${n(y - .5)}L${n(x + d)} ${n(y - .5)}L${n(x)} ${n(y + R * .5)}Z`; }
  if (tipo === 'dientes') { const [x, y] = sup[5], d = R * .25, hh = R * .45; diente = `M${n(x - d * 2)} ${n(y - .5)}h${n(d * 2 - .6)}v${n(hh)}h${n(-(d * 2 - .6))}zM${n(x + .6)} ${n(y - .5)}h${n(d * 2 - .6)}v${n(hh)}h${n(-(d * 2 - .6))}z`; }
  return { d: curvaAbierta(sup) + curvaAbierta(inf.reverse(), false) + 'Z', lengua, diente };
}
function caminoBrazo(g, pose, lado) {
  const sx = g.cx + lado * g.hombro.dx, sy = g.hombro.y, a = pose.ang * Math.PI / 180, L = g.brazo.L * .82;
  return { t: `translate(${n(sx)} ${n(sy)}) rotate(${n(-pose.ang * lado)})`, hx: sx + Math.sin(a) * lado * L, hy: sy + Math.cos(a) * L };
}

/* ================= Emociones ================= */
// Cada emoción: parámetros de la cara, pose de los brazos [izquierdo, derecho], un sticker y una frase de ejemplo.
// mirar:false = la mirada es parte de la emoción y no sigue al puntero.
export const EMOCIONES = {
  neutral: { nombre: 'Calma', p: {}, brazos: ['abajo', 'abajo'], frase: 'Aquí estoy. ¿Qué me vas a enseñar hoy?' },
  feliz: { nombre: 'Alegría', p: { ojoS: .15, cejaY: .2, bocaW: 1, bocaC: .9, bocaA: .35, rubor: .55 }, brazos: ['abajo', 'abajo'], frase: '¡Qué bueno! Me gusta cómo lo explicas.' },
  emocionado: { nombre: 'Emoción', p: { ojoS: 1, cejaY: .4, bocaW: 1.1, bocaC: 1, bocaA: .7, rubor: .75, rebote: 1 }, brazos: ['celebrar', 'celebrar'], sticker: 'brillos', frase: '¡Sííí! ¡Quiero aprender más!' },
  curioso: { nombre: 'Curiosidad', p: { ojoA: 1.12, cejaY: .3, cejaAsim: .8, bocaW: .42, bocaC: .1, bocaA: .3, incl: 6 }, brazos: ['abajo', 'abajo'], sticker: 'duda', frase: 'Mmm… ¿y eso por qué pasa?' },
  pensando: { nombre: 'Pensando', p: { ojoA: .9, mirX: .6, mirY: -.75, cejaAsim: .5, bocaW: .5, bocaC: -.1, bocaX: .6, incl: -3 }, brazos: ['abajo', 'menton'], sticker: 'puntos', mirar: false, frase: 'Déjame pensarlo un momento…' },
  confundido: { nombre: 'Confusión', p: { ojoT: .2, cejaAsim: -.9, cejaA: .3, bocaW: .7, bocaC: -.2, bocaOnda: .9, incl: -7 }, brazos: ['encoger', 'encoger'], sticker: 'duda', frase: 'Espera, me perdí. ¿Me lo dices de otra forma?' },
  sorprendido: { nombre: 'Sorpresa', p: { ojoA: 1.3, cejaY: 1, bocaW: .45, bocaC: 0, bocaA: 1, rubor: .3 }, brazos: ['arriba', 'arriba'], sticker: 'exclama', frase: '¡¿En serio?! ¡No lo sabía!' },
  triste: { nombre: 'Tristeza', p: { ojoA: .82, ojoT: .5, cejaA: .9, cejaY: .1, bocaW: .7, bocaC: -.75, mirY: .5, rubor: .1 }, brazos: ['abajo', 'abajo'], sticker: 'lagrima', mirar: false, frase: 'No me salió… creo que lo entendí mal.' },
  nervioso: { nombre: 'Nervios', p: { ojoA: 1.05, cejaA: .7, cejaY: .3, bocaW: .9, bocaC: .1, bocaOnda: 1, rubor: .4, temblor: 1 }, brazos: ['adelante', 'adelante'], sticker: 'sudor', frase: 'Uy… ¿y si me toca la prueba ahora?' },
  avergonzado: { nombre: 'Vergüenza', p: { ojoS: .6, mirX: -.6, mirY: .45, cejaA: .6, bocaW: .55, bocaC: .3, bocaX: -.4, rubor: 1 }, brazos: ['abajo', 'tapar'], sticker: 'sudor', mirar: false, frase: 'Ups… me equivoqué, ¿verdad?' },
  orgulloso: { nombre: 'Orgullo', p: { ojoS: 1, ojoA: .9, cejaY: .2, bocaW: 1, bocaC: .9, bocaA: .1, mirY: -.3, incl: -4, rubor: .5 }, brazos: ['cadera', 'cadera'], sticker: 'brillos', frase: '¡Lo logré! Y fue gracias a ti.' },
  eureka: { nombre: '¡Entendió!', p: { ojoA: 1.25, cejaY: .9, bocaW: 1.2, bocaC: 1, bocaA: .8, rubor: .6, rebote: .5 }, brazos: ['abajo', 'arriba'], sticker: 'idea', frase: '¡Ahhh, ya entendí! ¡Tiene sentido!' },
  aburrido: { nombre: 'Aburrimiento', p: { ojoA: .45, cejaY: -.3, bocaW: .6, bocaC: -.1, mirX: -.3, incl: 5 }, brazos: ['abajo', 'abajo'], sticker: 'zzz', mirar: false, frase: 'Mmm… ¿y si me lo cuentas con un ejemplo?' },
  decidido: { nombre: 'Decisión', p: { ojoA: .92, ojoT: -.25, cejaA: -.7, cejaY: -.2, bocaW: .8, bocaC: .5, bocaX: .35 }, brazos: ['cadera', 'arriba'], frase: '¡Listo! Ahora sí voy a la prueba.' },
  frustrado: { nombre: 'Frustración', p: { ojoT: -.3, ojoA: .9, cejaA: -1, bocaW: .7, bocaC: -.6, bocaOnda: .4, rubor: .35 }, brazos: ['abajo', 'abajo'], sticker: 'garabato', frase: '¡Argh! No me sale. Explícamelo otra vez.' },
  agradecido: { nombre: 'Gratitud', p: { ojoS: 1, cejaA: .3, cejaY: .2, bocaW: .9, bocaC: .8, bocaA: .2, rubor: .9, incl: 4 }, brazos: ['tapar', 'abajo'], sticker: 'corazon', frase: 'Gracias por tenerme paciencia.' }
};
export const EMO_IDS = Object.keys(EMOCIONES);

function paramsDe(emo) { return { ...BASE, ...(EMOCIONES[emo] || EMOCIONES.neutral).p }; }

/* ================= Stickers ================= */
function pintarSticker(g, id) {
  if (!id) return '';
  const R = g.ojo.r, hx = g.cx + g.W * .44, hy = g.top + 4;
  const gota = (x, y, s, c) => `<path d="M${n(x)} ${n(y - 9 * s)}C${n(x + 6 * s)} ${n(y - 2 * s)} ${n(x + 6 * s)} ${n(y + 5 * s)} ${n(x)} ${n(y + 5 * s)}C${n(x - 6 * s)} ${n(y + 5 * s)} ${n(x - 6 * s)} ${n(y - 2 * s)} ${n(x)} ${n(y - 9 * s)}Z" fill="${c}" stroke="#2E7DD1" stroke-width="1.5"/>`;
  const texto = (t, x, y, tam, c) => `<text x="${n(x)}" y="${n(y)}" font-size="${tam}" font-weight="800" font-family="'Bricolage Grotesque', 'Nunito', sans-serif" fill="${c}" stroke="#fff" stroke-width="4" paint-order="stroke" text-anchor="middle">${t}</text>`;
  switch (id) {
    case 'brillos': return [[hx + 4, hy - 4, 10], [g.cx - g.W * .5, g.top + 18, 7], [hx + 14, hy + 22, 6]].map(([x, y, r]) => `<path d="${estrella(x, y, r, 4, .42)}" fill="#FFC83D" stroke="#E0A100" stroke-width="1.2"/>`).join('');
    case 'duda': return texto('?', hx + 2, hy + 6, 34, '#6C63FF');
    case 'exclama': return texto('!', hx, hy + 6, 36, '#FF6B5B');
    case 'idea': { const x = hx - 2, y = hy - 10; return `<g><path d="M${n(x - 16)} ${n(y - 6)}l-7 -3M${n(x + 16)} ${n(y - 6)}l7 -3M${n(x)} ${n(y - 22)}v-7M${n(x - 12)} ${n(y - 17)}l-5 -5M${n(x + 12)} ${n(y - 17)}l5 -5" stroke="#FFB800" stroke-width="2.5" stroke-linecap="round"/><path d="M${n(x - 10)} ${n(y - 2)}a11 11 0 1 1 20 0c-2 4 -4 5 -4 9h-12c0 -4 -2 -5 -4 -9z" fill="#FFE066" stroke="#E0A100" stroke-width="2"/><rect x="${n(x - 6)}" y="${n(y + 8)}" width="12" height="6" rx="2" fill="#8E95B0"/></g>`; }
    case 'sudor': return gota(g.cx + g.hw(g.F.ojos) * .82, g.ojo.y - R * 1.6, 1, '#9AD4FF');
    case 'lagrima': return gota(g.cx + g.ojo.dx + R * .3, g.ojo.y + R * 1.9, .75, '#9AD4FF');
    case 'zzz': return texto('z', hx - 4, hy + 10, 16, '#6C63FF') + texto('Z', hx + 10, hy - 6, 24, '#6C63FF');
    case 'puntos': { const x = hx + 2, y = hy - 4; return `<g fill="#fff" stroke="#C9C6DC" stroke-width="1.8"><circle cx="${n(x - 18)}" cy="${n(y + 22)}" r="3"/><circle cx="${n(x - 11)}" cy="${n(y + 13)}" r="4.5"/><ellipse cx="${n(x + 4)}" cy="${n(y - 2)}" rx="17" ry="12"/></g><g fill="#6C63FF"><circle cx="${n(x - 3)}" cy="${n(y - 2)}" r="2"/><circle cx="${n(x + 4)}" cy="${n(y - 2)}" r="2"/><circle cx="${n(x + 11)}" cy="${n(y - 2)}" r="2"/></g>`; }
    case 'garabato': { const x = hx, y = hy; return `<path d="M${n(x - 14)} ${n(y)}c4 -10 10 2 14 -6s8 8 14 0 2 10 -6 8 -12 6 -16 0 -10 -6 -6 -2" fill="none" stroke="#3D4060" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`; }
    case 'corazon': { const x = hx, y = hy; return `<path d="M${n(x)} ${n(y + 10)}C${n(x - 16)} ${n(y)} ${n(x - 12)} ${n(y - 12)} ${n(x)} ${n(y - 5)}C${n(x + 12)} ${n(y - 12)} ${n(x + 16)} ${n(y)} ${n(x)} ${n(y + 10)}Z" fill="#FF6F8E" stroke="#D9446A" stroke-width="2"/>`; }
    default: return '';
  }
}

function pintarMarcas(g, t, r) {
  let s = '';
  if (r.panza) s += `<ellipse cx="${g.cx}" cy="${n(g.y(.8))}" rx="${n(g.W * .3)}" ry="${n(g.H * .22)}" fill="${t.claro}" opacity=".9"/>`;
  const W = g.W, H = g.H, cx = g.cx, top = g.top;
  if (r.marcas === 'manchas') s += `<g fill="${t.oscuro}" opacity=".42">${[[-.36, .22, 9], [.3, .12, 6], [.38, .55, 10], [-.42, .62, 7], [-.1, .06, 5]].map(([x, y, rr]) => `<ellipse cx="${n(cx + x * W)}" cy="${n(top + y * H)}" rx="${rr}" ry="${n(rr * .8)}" transform="rotate(${n(x * 60)} ${n(cx + x * W)} ${n(top + y * H)})"/>`).join('')}</g>`;
  if (r.marcas === 'rayas') s += `<g stroke="${t.oscuro}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45">${[.3, .45, .6].map(tt => { const yy = g.y(tt), xx = g.hw(tt); return `<path d="M${n(cx + xx + 3)} ${n(yy)}q-10 3 -18 0M${n(cx - xx - 3)} ${n(yy)}q10 3 18 0"/>`; }).join('')}</g>`;
  if (r.marcas === 'punta') { const yf = g.y(.17); s += `<path d="M${n(cx - W)} ${n(top - 30)}H${n(cx + W)}V${n(yf)}Q${n(cx + W * .25)} ${n(yf + 9)} ${n(cx)} ${n(yf)}T${n(cx - W)} ${n(yf)}Z" fill="${t.tinta}" opacity=".35"/>`; }
  if (r.marcas === 'estrella') s += `<path d="${estrella(cx, g.ojo.y - g.ojo.r * 2.6, g.ojo.r * .62, 4, .42)}" fill="#FFF3B0" opacity=".95"/>`;
  return s;
}

/* ================= Look ================= */
// Peinado a medida: mechones (puntas que salen del borde de la cabeza) y flequillo (mechones sobre la frente).
const num = (v, a, b, def) => { const x = Number(v); return Number.isFinite(x) ? lim(x, a, b) : def; };
export function limpiarTraje(t) {
  if (!t || typeof t !== 'object') return null;
  const c = v => (v ? color(v, '') : '') || undefined, de = (v, xs, def) => xs.includes(v) ? v : def;
  return { arriba: c(t.arriba), abajo: c(t.abajo), interior: c(t.interior), cinturon: c(t.cinturon), cuello: de(t.cuello, CUELLOS, 'redondo'), estampado: de(t.estampado, ESTAMPADOS, 'ninguno'), estampadoColor: c(t.estampadoColor), emblema: de(t.emblema, EMBLEMAS, 'ninguno'), emblemaColor: c(t.emblemaColor), emblemaPos: t.emblemaPos === 'izquierda' ? 'izquierda' : 'centro' };
}
export function limpiarPeinado(p) {
  if (!p || typeof p !== 'object') return null;
  const mechones = (Array.isArray(p.mechones) ? p.mechones : []).slice(0, 14).map(m => ({ pos: num(m?.pos, -1.2, 1.2, 0), largo: num(m?.largo, 6, 75, 30), ancho: num(m?.ancho, 6, 30, 18), dir: num(m?.dir, -180, 180, num(m?.pos, -1.2, 1.2, 0) * 60), curva: num(m?.curva, -1, 1, 0) }));
  const flequillo = (Array.isArray(p.flequillo) ? p.flequillo : []).slice(0, 7).map(f => ({ x: num(f?.x, -1, 1, 0), largo: num(f?.largo, 2, 34, 14), ancho: num(f?.ancho, 6, 28, 14), giro: num(f?.giro, -45, 45, 0) }));
  if (!mechones.length && !flequillo.length) return null;
  return { mechones, flequillo, tapa: num(p.tapa, 0, 1, .8) };
}

// Un look: { nombre, forma, color, numero, piezas: { slot: { id, colores: [c1, c2] } } }
export function normalizarLook(l = {}) {
  const forma = FORMAS[l.forma] ? l.forma : 'bollo';
  const r = l.rasgos || {};
  const rasgos = { ojos: OJOS[r.ojos] ? r.ojos : 'ovalados', boca: BOCAS[r.boca] ? r.boca : 'normal', panza: !!r.panza, marcas: MARCAS[r.marcas] ? r.marcas : 'ninguna', pies: r.pies ? color(r.pies, '') : '' };
  const out = { nombre: String(l.nombre || '').slice(0, 24), forma, color: color(l.color, PALETA.coral), numero: lim(parseInt(l.numero, 10) || 0, 0, 99), rasgos, piezas: {} };
  const pe = limpiarPeinado(l.peinado), pf = limpiarPeinado(l.peinado_final);
  if (pe) out.peinado = pe;
  if (pf) out.peinado_final = pf;
  const tj = limpiarTraje(l.traje);
  if (tj) out.traje = tj;
  const dj = limpiarDibujo(l.dibujo);
  if (dj) out.dibujo = dj;
  for (const slot of SLOTS) {
    const x = l.piezas?.[slot];
    const id = typeof x === 'string' ? x : x?.id;
    const def = id && PIEZAS[slot]?.[id];
    if (!def) continue;
    const cs = (x && Array.isArray(x.colores)) ? x.colores : [];
    out.piezas[slot] = { id, colores: [0, 1].map(i => cs[i] === 'cuerpo' || (!cs[i] && def.c[i] === 'cuerpo') ? 'cuerpo' : color(cs[i], color(def.c[i], PALETA.nieve))) };
  }
  return out;
}
// Deja solo las piezas que corresponden al nivel de aprendizaje (0 a 4).
export function lookConNivel(look, nivel = 4) {
  const ok = NIVELES[lim(nivel | 0, 0, NIVELES.length - 1)];
  const piezas = {};
  for (const [slot, v] of Object.entries(look.piezas)) if (ok.includes(slot)) piezas[slot] = v;
  return { ...look, piezas };
}

/* ================= Dibujo ================= */
let contador = 0;

// Construye el SVG completo con los parámetros dados. El modo vivo reutiliza esta misma marca y luego solo mueve atributos.
export function svgAprendin(lookIn, opciones = {}) {
  const look = normalizarLook(lookIn);
  const g = geometria(look.forma), t = tonos(look.color), id = opciones.id || `apr${++contador}`;
  const p = { ...paramsDe(opciones.emocion), ...(opciones.p || {}) };
  const emo = EMOCIONES[opciones.emocion] || EMOCIONES.neutral;
  const capas = { atras: '', dentro: '', fuera: '', cara: '', espalda: '', aura: '', cuello: '', mano: '', brazo: '' };
  const tieneObjeto = !!look.piezas.mano;
  for (const slot of SLOTS) {
    const pz = look.piezas[slot]; if (!pz) continue;
    const r = pintarPieza(slot, pz, g, t, look);
    for (const k of Object.keys(r)) capas[k] += r[k];
  }
  const [pl, pr] = brazosDe(g, emo.brazos, tieneObjeto);
  const bl = caminoBrazo(g, pl, -1), br = caminoBrazo(g, pr, 1);
  const est = OJOS[look.rasgos.ojos], boca = caminoBoca(g, p, 0, look.rasgos.boca);
  const ojos = [-1, 1].map(lado => ({ d: caminoOjo(g, p, lado, 1, est), b: brillosOjo(g, p, lado, 1, est), pe: caminoPestanas(g, p, lado, 1, est) }));
  const iris = mover(t.oscuro, -.08, .12);
  const R = g.ojo.r, tr = n(p.incl);
  const B = g.brazo, PI = g.pies, pies = look.rasgos.pies ? tonos(look.rasgos.pies) : { base: mover(t.oscuro, -.04), oscuro: t.tinta };
  const bracito = (cls, b) => `<g class="${cls}" transform="${b.t}"><ellipse cx="0" cy="${n(B.L * .42)}" rx="${n(B.w / 2)}" ry="${n(B.L / 2)}" fill="url(#${id}-g)" stroke="${t.oscuro}" stroke-width="3"/>${capas.brazo}</g>`;
  const etiqueta = opciones.etiqueta || `${look.nombre || 'Aprendín'} (${emo.nombre.toLowerCase()})`;
  return `<svg class="apr-svg" viewBox="-20 -14 300 272" role="img" aria-label="${esc(etiqueta)}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="${id}-g" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${t.claro}"/><stop offset=".75" stop-color="${t.base}"/></linearGradient>
  <linearGradient id="${id}-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TINTA}"/><stop offset="${est.iris}" stop-color="${TINTA}"/><stop offset="1" stop-color="${iris}"/></linearGradient>
  <clipPath id="${id}-c"><path d="${g.path}"/></clipPath>
  <clipPath id="${id}-b"><path class="apr-boca-clip" d="${boca.d}"/></clipPath>
</defs>
<ellipse class="apr-sombra" cx="${g.cx}" cy="${g.piso + 5}" rx="${n(g.W * .42)}" ry="7" fill="${TINTA}" opacity=".16"/>
<g class="apr-todo" transform="rotate(${tr} ${g.cx} ${g.piso})">
  <g class="apr-aura">${capas.aura}</g>
  <g class="apr-espalda">${capas.espalda}</g>
  <g class="apr-atras">${capas.atras}</g>
  <path class="apr-cuerpo" d="${g.path}" fill="url(#${id}-g)" stroke="${t.oscuro}" stroke-width="3.2" stroke-linejoin="round"/>
  <g clip-path="url(#${id}-c)">
    <ellipse cx="${n(g.cx + g.W * .12)}" cy="${n(g.piso + 8)}" rx="${n(g.W * .62)}" ry="${n(g.H * .3)}" fill="${t.oscuro}" opacity=".22"/>
    ${pintarMarcas(g, t, look.rasgos)}
    <path d="${g.path}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="7" transform="translate(3 3.5)"/>
    <ellipse cx="${n(g.cx - g.W * .2)}" cy="${n(g.top + g.H * .2)}" rx="${n(g.W * .16)}" ry="${n(g.H * .09)}" fill="#fff" opacity=".35" transform="rotate(-24 ${n(g.cx - g.W * .2)} ${n(g.top + g.H * .2)})"/>
    ${capas.dentro}
  </g>
  <g class="apr-pies" fill="${pies.base}" stroke="${pies.oscuro}" stroke-width="3"><ellipse cx="${n(g.cx - PI.dx)}" cy="${n(g.piso - PI.ry * .35)}" rx="${n(PI.rx)}" ry="${n(PI.ry)}" transform="rotate(-6 ${n(g.cx - PI.dx)} ${n(g.piso)})"/><ellipse cx="${n(g.cx + PI.dx)}" cy="${n(g.piso - PI.ry * .35)}" rx="${n(PI.rx)}" ry="${n(PI.ry)}" transform="rotate(6 ${n(g.cx + PI.dx)} ${n(g.piso)})"/></g>
  <g class="apr-cuello">${capas.cuello}</g>
  <g class="apr-cara" transform="translate(${n(p.mirX * R * .45)} ${n(p.mirY * R * .35)})">
    <ellipse class="apr-rubor" cx="${n(g.cx - g.ojo.dx - R * 1.3)}" cy="${n(g.ojo.y + R * 1.15)}" rx="${n(R * .95)}" ry="${n(R * .52)}" fill="${RUBOR}" opacity="${n(p.rubor * .75)}"/>
    <ellipse class="apr-rubor" cx="${n(g.cx + g.ojo.dx + R * 1.3)}" cy="${n(g.ojo.y + R * 1.15)}" rx="${n(R * .95)}" ry="${n(R * .52)}" fill="${RUBOR}" opacity="${n(p.rubor * .75)}"/>
    ${ojos.map(o => `<path class="apr-ojo" d="${o.d}" fill="url(#${id}-i)" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/><path class="apr-pestanas" d="${o.pe}" stroke="${TINTA}" stroke-width="${n(R * .22)}" stroke-linecap="round" fill="none"/><circle class="apr-brillo1" cx="${n(o.b.x1)}" cy="${n(o.b.y1)}" r="${n(o.b.r1)}" fill="#fff" opacity="${n(o.b.op)}"/><circle class="apr-brillo2" cx="${n(o.b.x2)}" cy="${n(o.b.y2)}" r="${n(o.b.r2)}" fill="#fff" opacity="${n(o.b.op)}"/>`).join('')}
    ${[-1, 1].map(lado => `<path class="apr-ceja" d="${caminoCeja(g, p, lado)}" fill="none" stroke="${TINTA}" stroke-width="${n(R * .3)}" stroke-linecap="round" opacity=".9"/>`).join('')}
    <path class="apr-boca" d="${boca.d}" fill="${BOCA}" stroke="${BOCA}" stroke-width="${n(R * .3)}" stroke-linejoin="round" stroke-linecap="round"/>
    <path class="apr-diente" d="${boca.diente}" fill="#fff" stroke="${BOCA}" stroke-width="1" stroke-linejoin="round"/>
    <ellipse class="apr-lengua" clip-path="url(#${id}-b)" cx="${n(boca.lengua.cx)}" cy="${n(boca.lengua.cy)}" rx="${n(boca.lengua.rx)}" ry="${n(boca.lengua.ry)}" fill="${LENGUA}" opacity="${n(boca.lengua.op)}"/>
    ${capas.cara}
  </g>
  <g class="apr-fuera">${capas.fuera}</g>
  ${bracito('apr-brazo apr-brazo-i', bl)}
  <g class="apr-objeto" transform="translate(${n(br.hx)} ${n(br.hy)}) rotate(${n(pr.obj)}) scale(1.15)">${capas.mano}</g>
  ${bracito('apr-brazo apr-brazo-d', br)}
  <g class="apr-sticker">${pintarSticker(g, emo.sticker)}</g>
</g>
</svg>`;
}

function brazosDe(g, poses, tieneObjeto) {
  let [i, d] = poses;
  if (tieneObjeto && ['abajo', 'cadera', 'encoger', 'tapar', 'adelante'].includes(d)) d = 'sostener';
  return [resolverPose(g, i), resolverPose(g, d)];
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ================= Modo vivo ================= */
// Un solo bucle de animación para todos los aprendines de la página.
const vivos = new Set();
let raf = 0, tAnterior = 0, puntero = null;
if (typeof window !== 'undefined') {
  addEventListener('pointermove', e => { puntero = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && vivos.size && !raf) { tAnterior = 0; raf = requestAnimationFrame(bucle); } });
}
function bucle(ts) {
  raf = 0;
  if (document.hidden) return;
  const dt = tAnterior ? Math.min(.05, (ts - tAnterior) / 1000) : .016; tAnterior = ts;
  for (const a of vivos) if (a.visible) animar(a, ts / 1000, dt);
  if (vivos.size) raf = requestAnimationFrame(bucle);
}
const iniciarBucle = () => { if (!raf && vivos.size) { tAnterior = 0; raf = requestAnimationFrame(bucle); } };

// crearAprendin({ look, emocion, seguir, nivel }) → { el, sentir, vestir, hablar, saltar, saludar, entender, equivocarse, evolucionar, … }
export function crearAprendin(opciones = {}) {
  const a = {
    id: `apr${++contador}`, look: normalizarLook(opciones.look), nivel: opciones.nivel ?? 4,
    emocion: EMOCIONES[opciones.emocion] ? opciones.emocion : 'neutral', seguir: opciones.seguir !== false,
    hablando: false, acciones: [], visible: true, parp: { prox: 1 + Math.random() * 3, t0: -1 },
    cur: null, brazos: null, rect: null, rectT: 0
  };
  a.el = document.createElement('div');
  a.el.className = 'aprendin' + (opciones.clase ? ' ' + opciones.clase : '');
  a.cur = paramsDe(a.emocion);
  montar(a);
  if (opciones.animar !== false) {
    vivos.add(a);
    if ('IntersectionObserver' in window) {
      a.io = new IntersectionObserver(es => { a.visible = es[0].isIntersecting; if (a.visible) iniciarBucle(); });
      a.io.observe(a.el);
    }
    iniciarBucle();
  }
  const api = {
    el: a.el,
    get look() { return a.look; },
    get emocion() { return a.emocion; },
    sentir(emo) {
      if (!EMOCIONES[emo] || emo === a.emocion) return api;
      a.emocion = emo;
      const s = a.dom.sticker; s.innerHTML = pintarSticker(geometria(a.look.forma), EMOCIONES[emo].sticker);
      s.classList.remove('apr-pop'); requestAnimationFrame(() => s.classList.add('apr-pop'));
      a.el.querySelector('svg').setAttribute('aria-label', `${a.look.nombre || 'Aprendín'} (${EMOCIONES[emo].nombre.toLowerCase()})`);
      if (!vivos.has(a)) { a.cur = paramsDe(emo); a.brazos = null; montar(a); }
      return api;
    },
    vestir(look, nivel = a.nivel) { a.look = normalizarLook(look); a.nivel = nivel; montar(a); return api; },
    nivel(nv) { a.nivel = nv; montar(a); return api; },
    hablar(si = true) { a.hablando = !!si; return api; },
    saltar() { accion(a, 'salto', .55); return api; },
    saludar() { accion(a, 'saludo', 1.8); return api; },
    equivocarse() { api.sentir('avergonzado'); accion(a, 'sacudir', .5); return api; },
    entender() { api.sentir('eureka'); accion(a, 'salto', .6); destello(a); return api; },
    // gira como una carta y, a mitad del giro (cuando no se ve), cambia al look nuevo
    evolucionar(look, nivel = a.nivel) {
      accion(a, 'giro', 1.1, () => { if (look) a.look = normalizarLook(look); a.nivel = nivel; montar(a); });
      destello(a); return api;
    },
    destruir() { vivos.delete(a); a.io?.disconnect(); a.el.remove(); }
  };
  return api;
}

function montar(a) {
  const look = lookConNivel(a.look, a.nivel);
  a.el.innerHTML = svgAprendin(look, { id: a.id, emocion: a.emocion, p: a.cur });
  const q = s => a.el.querySelector(s), qa = s => [...a.el.querySelectorAll(s)];
  a.dom = {
    todo: q('.apr-todo'), sombra: q('.apr-sombra'), cara: q('.apr-cara'), ojos: qa('.apr-ojo'), b1: qa('.apr-brillo1'), b2: qa('.apr-brillo2'),
    cejas: qa('.apr-ceja'), pestanas: qa('.apr-pestanas'), diente: q('.apr-diente'), boca: q('.apr-boca'), bocaClip: q('.apr-boca-clip'), lengua: q('.apr-lengua'), rubor: qa('.apr-rubor'),
    brazoI: q('.apr-brazo-i'), brazoD: q('.apr-brazo-d'), objeto: q('.apr-objeto'), sticker: q('.apr-sticker')
  };
  a.g = geometria(look.forma);
  a.rasgos = normalizarLook(look).rasgos; a.est = OJOS[a.rasgos.ojos];
  a.tieneObjeto = !!look.piezas.mano;
  if (!a.brazos) a.brazos = brazosDe(a.g, (EMOCIONES[a.emocion] || EMOCIONES.neutral).brazos, a.tieneObjeto).map(p => ({ ...p }));
}

function accion(a, tipo, dur, alMedio) {
  if (RM) { alMedio?.(); return; }
  a.acciones = a.acciones.filter(x => x.tipo !== tipo);
  a.acciones.push({ tipo, t0: null, dur, alMedio, hecho: false });
  iniciarBucle();
}
function destello(a) {
  if (RM) return;
  const d = document.createElement('span'); d.className = 'apr-destello';
  const ancho = a.el.clientWidth || 200;
  for (let i = 0; i < 12; i++) { const c = document.createElement('i'); c.style.setProperty('--ang', `${i * 30 + Math.random() * 14}deg`); c.style.setProperty('--dist', `${Math.round(ancho * (.32 + Math.random() * .22))}px`); d.appendChild(c); }
  a.el.appendChild(d); setTimeout(() => d.remove(), 1100);
}

function animar(a, t, dt) {
  const g = a.g, emo = EMOCIONES[a.emocion] || EMOCIONES.neutral, R = g.ojo.r;
  // 1) mezcla suave hacia la emoción
  const meta = paramsDe(a.emocion), k = 1 - Math.exp(-dt * 9);
  for (const key in meta) a.cur[key] += (meta[key] - a.cur[key]) * k;
  const poses = brazosDe(g, emo.brazos, a.tieneObjeto);
  a.brazos.forEach((b, i) => { for (const key of ['ang', 'obj']) b[key] += (poses[i][key] - b[key]) * k; });

  const p = { ...a.cur };
  // 2) mirar al puntero
  if (a.seguir && emo.mirar !== false && puntero && performance.now() - puntero.t < 6000) {
    if (!a.rect || t - a.rectT > .4) { a.rect = a.el.getBoundingClientRect(); a.rectT = t; }
    const r = a.rect, mx = (puntero.x - (r.left + r.width / 2)) / Math.max(200, r.width * 1.4), my = (puntero.y - (r.top + r.height * .4)) / Math.max(200, r.height * 1.4);
    a.mir = a.mir || { x: 0, y: 0 };
    a.mir.x += (lim(mx, -1, 1) - a.mir.x) * k; a.mir.y += (lim(my, -1, 1) - a.mir.y) * k;
    p.mirX = lim(p.mirX + a.mir.x, -1, 1); p.mirY = lim(p.mirY + a.mir.y, -1, 1);
  }
  // 3) parpadeo
  let parp = 1;
  if (t > a.parp.prox && a.parp.t0 < 0) a.parp.t0 = t;
  if (a.parp.t0 >= 0) {
    const u = (t - a.parp.t0) / .16;
    if (u >= 1) { a.parp.t0 = -1; a.parp.prox = t + (Math.random() < .2 ? .25 : 2.2 + Math.random() * 3.5); }
    else parp = 1 - Math.sin(Math.PI * u) * .95;
  }
  // 4) hablar
  let fase = t * 3;
  if (a.hablando) {
    p.bocaA = Math.max(p.bocaA, 0) + .18 + .42 * Math.abs(Math.sin(t * 13) * Math.sin(t * 4.7 + 1));
    p.bocaW *= .92 + .12 * Math.sin(t * 9);
  }
  // 5) cuerpo: respiración, rebote, temblor y acciones
  let sx = 1, sy = 1, ox = 0, oy = 0, rot = p.incl + (RM ? 0 : Math.sin(t * .9) * 1.2), giro = 1;
  if (!RM) {
    const resp = Math.sin(t * 2.3); sy += resp * .018; sx -= resp * .01;
    if (p.rebote > .05) { const s = Math.abs(Math.sin(t * 6)); oy -= s * 9 * p.rebote; sy += (s - .5) * .04 * p.rebote; }
    if (p.temblor > .05) ox += Math.sin(t * 47) * 1.3 * p.temblor;
  }
  let saludo = 0;
  for (const ac of a.acciones) {
    if (ac.t0 === null) ac.t0 = t;
    const u = (t - ac.t0) / ac.dur;
    if (u >= 1) { if (ac.alMedio && !ac.hecho) { ac.hecho = true; ac.alMedio(); } ac.fin = true; continue; }
    if (ac.tipo === 'salto') { const s = Math.sin(Math.PI * u); oy -= s * 30; sy += s * .07 - (u > .85 ? (1 - u) * .5 : 0); sx -= s * .05; }
    if (ac.tipo === 'sacudir') ox += Math.sin(u * Math.PI * 9) * 5 * (1 - u);
    if (ac.tipo === 'saludo') saludo = Math.sin(Math.min(1, u * 6) * Math.PI / 2) * Math.min(1, (1 - u) * 6);
    if (ac.tipo === 'giro') {
      giro = Math.cos(u * Math.PI * 2); oy -= Math.sin(Math.PI * u) * 22;
      if (u > .25 && !ac.hecho) { ac.hecho = true; ac.alMedio?.(); return; }
    }
  }
  a.acciones = a.acciones.filter(x => !x.fin);
  const pivX = g.cx, pivY = g.piso;
  a.dom.todo.setAttribute('transform', `translate(${n(ox)} ${n(oy)}) rotate(${n(rot)} ${pivX} ${pivY}) translate(${pivX} ${pivY}) scale(${n(sx * giro * 1000) / 1000} ${n(sy * 1000) / 1000}) translate(${-pivX} ${-pivY})`);
  const alto = Math.max(0, -oy);
  a.dom.sombra.setAttribute('rx', n(g.W * .42 * (1 - alto / 90)));
  a.dom.sombra.setAttribute('opacity', n(.16 * (1 - alto / 80) * 100) / 100);

  // 6) cara
  a.dom.cara.setAttribute('transform', `translate(${n(p.mirX * R * .45)} ${n(p.mirY * R * .35)})`);
  [-1, 1].forEach((lado, i) => {
    a.dom.ojos[i].setAttribute('d', caminoOjo(g, p, lado, parp, a.est));
    if (a.est.pestanas) a.dom.pestanas[i].setAttribute('d', caminoPestanas(g, p, lado, parp, a.est));
    const b = brillosOjo(g, p, lado, parp, a.est);
    a.dom.b1[i].setAttribute('cx', n(b.x1)); a.dom.b1[i].setAttribute('cy', n(b.y1)); a.dom.b1[i].setAttribute('opacity', n(b.op));
    a.dom.b2[i].setAttribute('cx', n(b.x2)); a.dom.b2[i].setAttribute('cy', n(b.y2)); a.dom.b2[i].setAttribute('opacity', n(b.op));
    a.dom.cejas[i].setAttribute('d', caminoCeja(g, p, lado));
    a.dom.rubor[i].setAttribute('opacity', n(p.rubor * .75));
  });
  const boca = caminoBoca(g, p, fase, a.rasgos.boca);
  a.dom.boca.setAttribute('d', boca.d); if (boca.diente) a.dom.diente.setAttribute('d', boca.diente); a.dom.bocaClip.setAttribute('d', boca.d);
  const L = boca.lengua;
  a.dom.lengua.setAttribute('cx', n(L.cx)); a.dom.lengua.setAttribute('cy', n(L.cy)); a.dom.lengua.setAttribute('rx', n(L.rx)); a.dom.lengua.setAttribute('opacity', n(L.op));

  // 7) brazos (el derecho saluda si toca)
  const pd = { ...a.brazos[1] };
  if (saludo > 0) { const w = POSES.saludo; pd.ang += (w.ang + Math.sin(t * 15) * 20 - pd.ang) * saludo; pd.obj += (w.obj - pd.obj) * saludo; }
  const pi = { ...a.brazos[0] };
  if (!RM) { const vaiven = Math.sin(t * 2.3) * 3; pi.ang += vaiven; pd.ang -= vaiven; }
  const bi = caminoBrazo(g, pi, -1), bd = caminoBrazo(g, pd, 1);
  a.dom.brazoI.setAttribute('transform', bi.t); a.dom.brazoD.setAttribute('transform', bd.t);
  a.dom.objeto.setAttribute('transform', `translate(${n(bd.hx)} ${n(bd.hy)}) rotate(${n(pd.obj)}) scale(1.15)`);
}
