// Dibujo libre: la IA dibuja el pelo, la ropa y los accesorios con trazos SVG propios (no elige de una lista).
// Dibuja sobre la «bolita» (forma bollo) con coordenadas fijas; si el aprendín tiene otra forma, se escala.
// Antes de usarlo, el SVG pasa por limpiarSVG: solo figuras simples y atributos de dibujo, nada de scripts, enlaces ni texto.
import { PALETA } from './color.js';

// Capas que puede dibujar la IA
export const CAPAS_DIBUJO = ['pelo_atras', 'pelo_frente', 'ropa', 'extra', 'final_atras', 'final_frente'];
// Medidas de la bolita sobre la que dibuja (ver geometria('bollo') en aprendin.js)
export const LIENZO = { cx: 130, top: 90, W: 158, H: 146 };

const ETIQUETAS = new Set(['path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'g']);
const NUM = /^-?\d*\.?\d+(e-?\d+)?$/i;
const VALIDOS = {
  d: v => /^[MmLlHhVvCcSsQqTtAaZz0-9eE\s,.+-]+$/.test(v),
  points: v => /^[\d\s,.eE+-]+$/.test(v),
  transform: v => /^(\s*(translate|rotate|scale|matrix|skewX|skewY)\(\s*[-\d.eE\s,]+\)\s*)+$/.test(v),
  fill: v => colorOk(v), stroke: v => colorOk(v),
  'stroke-linejoin': v => /^(round|miter|bevel)$/.test(v), 'stroke-linecap': v => /^(round|butt|square)$/.test(v),
  'fill-rule': v => /^(nonzero|evenodd)$/.test(v)
};
for (const k of ['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity']) VALIDOS[k] = v => NUM.test(v);
function colorOk(v) { return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v) || v === 'none' || Object.hasOwn(PALETA, v) || /^[a-z]{3,20}$/.test(v); }

// Deja pasar solo figuras y atributos de dibujo. Devuelve '' si no queda nada.
export function limpiarSVG(s, max = 9000) {
  s = String(s ?? '').slice(0, max * 2);
  let out = '', abiertos = 0, figuras = 0;
  for (const m of s.matchAll(/<\s*(\/?)\s*([a-zA-Z]+)([^<>]*?)(\/?)\s*>/g)) {
    const [, cierre, et0, attrs, auto] = m, et = et0.toLowerCase();
    if (!ETIQUETAS.has(et)) continue;
    if (cierre) { if (et === 'g' && abiertos > 0) { out += '</g>'; abiertos--; } continue; }
    const limpio = [];
    for (const a of attrs.matchAll(/([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      const k = a[1].toLowerCase(); let v = (a[2] ?? a[3]).trim();
      if (!VALIDOS[k] || !VALIDOS[k](v)) continue;
      if ((k === 'fill' || k === 'stroke') && Object.hasOwn(PALETA, v)) v = PALETA[v];
      limpio.push(`${k}="${v}"`);
    }
    if (et === 'g') { if (auto) continue; out += `<g ${limpio.join(' ')}>`; abiertos++; continue; }
    if (et === 'path' && !limpio.some(x => x.startsWith('d='))) continue;
    out += `<${et} ${limpio.join(' ')}/>`;
    if (++figuras >= 140) break;
  }
  out += '</g>'.repeat(abiertos);
  return figuras && out.length <= max ? out : '';
}

const limpios = new WeakSet();   // dibujos ya limpiados (normalizarLook se llama muchas veces)
export function limpiarDibujo(d) {
  if (!d || typeof d !== 'object') return null;
  if (limpios.has(d)) return d;
  const out = {};
  for (const k of CAPAS_DIBUJO) { const s = limpiarSVG(d[k]); if (s) out[k] = s; }
  if (!Object.keys(out).length) return null;
  limpios.add(out);
  return out;
}

// Coloca un dibujo hecho para la bolita sobre el cuerpo g (escala si la forma es otra).
export function encajar(g, svg) {
  if (!svg) return '';
  if (g.forma === 'bollo') return svg;
  const sx = g.W / LIENZO.W, sy = g.H / LIENZO.H;
  return `<g transform="translate(${g.cx} ${g.top}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-LIENZO.cx} ${-LIENZO.top})">${svg}</g>`;
}
