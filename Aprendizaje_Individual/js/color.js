// Colores de los aprendines: una paleta con nombre y tonos derivados (claro, base, oscuro, tinta) calculados en HSL.
// La IA puede pedir un color por nombre de la paleta o con un hex (#RRGGBB).

export const PALETA = {
  coral: '#FF6B5B', mandarina: '#FF9A3D', sol: '#FFC83D', lima: '#8BCB4A', menta: '#2CC4A8', cielo: '#4BA3FF',
  indigo: '#6C63FF', uva: '#A66BFF', chicle: '#FF6FB1', cacao: '#B57B52', nieve: '#F4F5FA', carbon: '#3D4060'
};

const HEX = /^#[0-9a-f]{6}$/i;
const cerrar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const esColor = c => typeof c === 'string' && (HEX.test(c) || Object.hasOwn(PALETA, c));
export const color = (c, def = PALETA.coral) => (typeof c === 'string' && HEX.test(c)) ? c.toUpperCase() : (Object.hasOwn(PALETA, c) ? PALETA[c] : def);

function aRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function aHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(cerrar(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase(); }

export function aHsl(hex) {
  const [r, g, b] = aRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

export function deHsl(h, s, l) {
  if (!s) return aHex(l * 255, l * 255, l * 255);
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const canal = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return aHex(canal(h + 1 / 3) * 255, canal(h) * 255, canal(h - 1 / 3) * 255);
}

// Mueve la luminosidad (dl) y la saturación (ds) de un color.
export function mover(hex, dl = 0, ds = 0) { const [h, s, l] = aHsl(hex); return deHsl(h, cerrar(s + ds), cerrar(l + dl)); }

// claro: luces · base: relleno · oscuro: contornos · tinta: detalles muy oscuros del mismo tono
export function tonos(c) {
  const base = color(c);
  const [, , l] = aHsl(base);
  return {
    claro: mover(base, Math.min(.15, (.97 - l) * .7), -.03),
    base,
    oscuro: mover(base, -Math.min(.2, l * .32), .05),
    tinta: mover(base, -Math.min(.45, l * .68), -.05)
  };
}

// Luminancia relativa: sirve para elegir texto claro u oscuro encima de un color.
export function luminancia(hex) {
  const [r, g, b] = aRgb(color(hex)).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b;
}
