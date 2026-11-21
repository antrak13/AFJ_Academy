// Vestuario de los aprendines: piezas por zona, dibujadas con las medidas del cuerpo (geometria() en aprendin.js).
// La IA no dibuja: elige ids de este catálogo y colores; el código dibuja.
// Cada pieza: { nombre, c: [color1, color2] por defecto ('cuerpo' = color del aprendín), desc: para qué mundos sirve, pinta(g, A, B, o) }
// A y B son los tonos de los dos colores ({ claro, base, oscuro, tinta }); o = { numero, cuerpo }.
// pinta() devuelve un texto SVG (va a la capa de su zona) o un objeto con capas:
//   atras (detrás del cuerpo) · dentro (sobre el cuerpo, recortado a su forma) · fuera (delante) · cara · cuello · espalda · aura · mano
import { tonos } from './color.js';
import { n, P, lim, curvaCerrada, curvaAbierta, estrella, poligono, ruido } from './trazos.js';

export const SLOTS = ['aura', 'espalda', 'cuerpo', 'cuello', 'pelo', 'cara', 'cabeza', 'brazos', 'mano'];
export const NOMBRES_SLOT = { cabeza: 'Cabeza', pelo: 'Pelo', cara: 'Cara', cuello: 'Cuello', cuerpo: 'Cuerpo', brazos: 'Brazos', espalda: 'Espalda', mano: 'En la mano', aura: 'Aura' };
// Qué zonas se ven en cada nivel de aprendizaje: cuanto más le enseñas, más se transforma.
export const NIVELES = [[], ['cabeza', 'pelo'], ['cabeza', 'pelo', 'mano'], ['cabeza', 'pelo', 'mano', 'cara', 'cuello', 'cuerpo', 'brazos'], ['cabeza', 'pelo', 'mano', 'cara', 'cuello', 'cuerpo', 'brazos', 'espalda', 'aura']];
export const NOMBRES_NIVEL = ['Recién llegado', 'Aprendiz', 'Practicante', 'Experto', 'Maestro'];

const CAPA = { cabeza: 'fuera', pelo: 'fuera', cara: 'cara', cuello: 'cuello', cuerpo: 'dentro', brazos: 'brazo', espalda: 'espalda', mano: 'mano', aura: 'aura' };
const SW = 2.4;

// Línea de la frente: hasta dónde baja el pelo o un pañuelo.
const frente = g => Math.max(g.top + 12, g.ojo.y - g.ojo.r * 2.7);
// Altura del sombrero que cubre la punta de la cabeza.
const altoSombrero = (g, base) => Math.max(base, (g.sombrero.cubre + 8) / .97);

// Casquete: cubre la parte de arriba de la cabeza hasta yf, con borde de ondas o de picos. Va en la capa «dentro».
function casquete(g, yf, { k = 4, prof = 8, picos = false } = {}) {
  const half = g.hw((yf - g.top) / g.H) + 6, x0 = g.cx + half, paso = half * 2 / k;
  let d = `M${P(g.cx - g.W, g.top - 60)}H${n(g.cx + g.W)}V${n(yf)}H${n(x0)}`;
  for (let i = 0; i < k; i++) {
    const a = x0 - i * paso, b = a - paso, m = (a + b) / 2;
    d += picos ? `L${P(m, yf + prof)}L${P(b, yf)}` : `Q${P(m, yf + prof * 2)} ${P(b, yf)}`;
  }
  return d + `H${n(g.cx - g.W)}Z`;
}
// Volumen de pelo: una franja que sobresale `off` px del borde de la cabeza, de s0 a -s0.
function volumen(g, s0, off) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const b = g.borde(-s0 + 2 * s0 * i / 14, off); pts.push([b.x, b.y]); }
  for (let i = 14; i >= 0; i--) { const b = g.borde(-s0 + 2 * s0 * i / 14, -14); pts.push([b.x, b.y]); }
  return curvaCerrada(pts);
}
const domo = (cx, yb, w, h) => `M${P(cx - w / 2, yb)}C${P(cx - w / 2, yb - h * 1.33)} ${P(cx + w / 2, yb - h * 1.33)} ${P(cx + w / 2, yb)}Z`;
const elipseHueco = (x, y, rx, ry) => `M${P(x - rx, y)}a${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0Z`;

/* ======================= CABEZA ======================= */
const cabeza = {
  gorro_chef: {
    nombre: 'Gorro de chef', c: ['#FFFFFF', '#E3E0EE'], desc: 'cocina, chef, repostería, comida', pinta(g, A) {
      const yb = g.sombrero.y + 3, w = Math.max(g.sombrero.w, 74) * .86, bh = 16, cx = g.cx;
      const nubes = [[cx - w * .3, yb - bh - 8, w * .26], [cx + w * .3, yb - bh - 8, w * .26], [cx, yb - bh - 19, w * .33]]
        .map(([x, y, r]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`).join('');
      return `<g fill="${A.base}" stroke="#C9C5DB" stroke-width="5">${nubes}</g><g fill="${A.base}">${nubes}</g>
<rect x="${n(cx - w / 2)}" y="${n(yb - bh)}" width="${n(w)}" height="${bh}" rx="5" fill="${A.base}" stroke="#C9C5DB" stroke-width="2.5"/>
<path d="M${P(cx - w * .18, yb - bh + 4)}v${bh - 8}M${P(cx + w * .18, yb - bh + 4)}v${bh - 8}" stroke="#DAD7E8" stroke-width="2.2" stroke-linecap="round"/>`;
    }
  },
  gorra: {
    nombre: 'Gorra', c: ['#4BA3FF', '#FFFFFF'], desc: 'deporte, béisbol, calle, skate', pinta(g, A, B) {
      const yb = g.sombrero.y + 4, w = g.sombrero.w * 1.02, h = altoSombrero(g, w * .42) - 4, cx = g.cx;
      return `<path d="${domo(cx, yb, w, h)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/>
<path d="M${P(cx + w * .02, yb - 3)}C${P(cx + w * .45, yb - 7)} ${P(cx + w * .86, yb - 3)} ${P(cx + w * .8, yb + 7)}C${P(cx + w * .5, yb + 10)} ${P(cx + w * .15, yb + 6)} ${P(cx - w * .12, yb + 2)}Z" fill="${A.oscuro}" stroke="${A.tinta}" stroke-width="2" stroke-linejoin="round"/>
<path d="M${P(cx, yb - h * .97)}V${n(yb - 2)}" stroke="${A.oscuro}" stroke-width="1.6" opacity=".45"/>
<circle cx="${n(cx)}" cy="${n(yb - h * .97)}" r="3.4" fill="${A.oscuro}"/>
<circle cx="${n(cx - w * .17)}" cy="${n(yb - h * .42)}" r="${n(w * .1)}" fill="${B.base}" stroke="${A.oscuro}" stroke-width="1.4"/>`;
    }
  },
  chullo: {
    nombre: 'Chullo', c: ['#E2483D', '#FFC83D'], desc: 'Andes, Bolivia, montaña, frío, tejido', pinta(g, A, B) {
      const yb = g.sombrero.y + 7, w = g.sombrero.w * 1.08, h = altoSombrero(g, w * .5), cx = g.cx;
      const oreja = s => `M${P(cx + s * w * .5, yb - 4)}Q${P(cx + s * w * .54, yb + 20)} ${P(cx + s * w * .38, yb + 26)}Q${P(cx + s * w * .3, yb + 10)} ${P(cx + s * w * .26, yb - 2)}Z`;
      const zz = []; for (let i = 0; i <= 8; i++) zz.push([cx - w * .4 + i * w * .1, yb - 10 - (i % 2 ? 7 : 0)]);
      const borla = s => `<path d="M${P(cx + s * w * .38, yb + 26)}v9" stroke="${B.oscuro}" stroke-width="2"/><circle cx="${n(cx + s * w * .38)}" cy="${n(yb + 38)}" r="4" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.5"/>`;
      return `${borla(-1)}${borla(1)}<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"><path d="${oreja(-1)}"/><path d="${oreja(1)}"/><path d="${domo(cx, yb, w, h)}"/></g>
<path d="M${zz.map(([x, y]) => P(x, y)).join('L')}" fill="none" stroke="${B.base}" stroke-width="3.4" stroke-linejoin="round"/>
<path d="M${P(cx - w * .45, yb - 3)}H${n(cx + w * .45)}" stroke="${B.base}" stroke-width="3"/>
<path d="M${P(cx - w * .3, yb - h * .62)}H${n(cx + w * .3)}" stroke="#FFF3E0" stroke-width="2.4" stroke-dasharray="3 4"/>
<circle cx="${n(cx)}" cy="${n(yb - h - 5)}" r="7.5" fill="${B.base}" stroke="${B.oscuro}" stroke-width="2"/>`;
    }
  },
  casco: {
    nombre: 'Casco de obra', c: ['#FFC83D', '#FFFFFF'], desc: 'construcción, ingeniería, arquitectura, puentes', pinta(g, A) {
      const yb = g.sombrero.y + 2, w = g.sombrero.w * .98, h = altoSombrero(g, w * .48), cx = g.cx;
      return `<path d="${domo(cx, yb, w, h)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>
<path d="M${P(cx - 7, yb - h * .99)}Q${P(cx, yb - h * 1.04)} ${P(cx + 7, yb - h * .99)}L${P(cx + 6, yb - 2)}H${n(cx - 6)}Z" fill="${A.claro}" stroke="${A.oscuro}" stroke-width="1.8"/>
<rect x="${n(cx - w * .66)}" y="${n(yb - 5)}" width="${n(w * 1.32)}" height="9" rx="4.5" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`;
    }
  },
  corona: {
    nombre: 'Corona', c: ['#FFC83D', '#FF4D6D'], desc: 'reyes, historia, ajedrez, cuentos', pinta(g, A, B) {
      const yb = g.sombrero.y + 3, w = Math.max(56, g.sombrero.w * .78), h = 26, cx = g.cx;
      const pts = [[-.5, 0], [-.5, -.72], [-.36, -.36], [-.25, -1], [-.12, -.36], [0, -1.12], [.12, -.36], [.25, -1], [.36, -.36], [.5, -.72], [.5, 0]];
      const d = 'M' + pts.map(([x, y]) => P(cx + x * w, yb + y * h)).join('L') + 'Z';
      const bolas = [[-.5, -.72], [-.25, -1], [0, -1.12], [.25, -1], [.5, -.72]].map(([x, y]) => `<circle cx="${n(cx + x * w)}" cy="${n(yb + y * h - 2)}" r="3.4"/>`).join('');
      return `<path d="${d}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><g fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.6">${bolas}</g>
<rect x="${n(cx - w / 2)}" y="${n(yb - 7)}" width="${n(w)}" height="7" fill="${A.oscuro}" opacity=".35"/>
<circle cx="${n(cx)}" cy="${n(yb - 12)}" r="4.5" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.5"/><circle cx="${n(cx - w * .25)}" cy="${n(yb - 10)}" r="3" fill="#4BA3FF"/><circle cx="${n(cx + w * .25)}" cy="${n(yb - 10)}" r="3" fill="#4BA3FF"/>`;
    }
  },
  mago: {
    nombre: 'Sombrero de mago', c: ['#6C63FF', '#FFC83D'], desc: 'magia, fantasía, cuentos, hechizos', pinta(g, A, B) {
      const yb = g.sombrero.y + 5, w = g.sombrero.w * .92, h = Math.max(w * 1.05, 72, g.sombrero.cubre + 40), cx = g.cx;
      return `<ellipse cx="${n(cx)}" cy="${n(yb)}" rx="${n(w * .74)}" ry="9" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>
<path d="M${P(cx - w * .45, yb)}C${P(cx - w * .28, yb - h * .45)} ${P(cx - w * .05, yb - h * .82)} ${P(cx + w * .34, yb - h)}C${P(cx + w * .14, yb - h * .7)} ${P(cx + w * .3, yb - h * .38)} ${P(cx + w * .45, yb)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/>
<path d="M${P(cx - w * .43, yb - 6)}Q${P(cx, yb - 1)} ${P(cx + w * .43, yb - 6)}" stroke="${B.base}" stroke-width="6" fill="none"/>
<path d="${estrella(cx - w * .08, yb - h * .38, 7)}" fill="${B.base}"/><path d="${estrella(cx + w * .14, yb - h * .62, 4.5)}" fill="${B.base}"/><path d="${estrella(cx + w * .34, yb - h - 2, 6, 4, .4)}" fill="${B.claro}"/>`;
    }
  },
  audifonos: {
    nombre: 'Audífonos', c: ['#3D4060', '#FF6FB1'], desc: 'música, DJ, podcasts, videojuegos', pinta(g, A, B) {
      const se = lim(g.sDe(g.F.ojos), .5, 1.1), pts = [];
      for (let i = 0; i <= 18; i++) { const b = g.borde(-se + 2 * se * i / 18, 6); pts.push([b.x, b.y]); }
      const copa = s => { const b = g.borde(s * se, 1); return `<g transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot - 90 * s)})"><rect x="-8" y="-14" width="16" height="28" rx="7" fill="${A.base}" stroke="${A.tinta}" stroke-width="2"/><rect x="${s > 0 ? 2 : -7}" y="-9" width="5" height="18" rx="2.5" fill="${B.base}"/></g>`; };
      return `<path d="${curvaAbierta(pts)}" fill="none" stroke="${A.tinta}" stroke-width="8.5" stroke-linecap="round"/><path d="${curvaAbierta(pts)}" fill="none" stroke="${A.base}" stroke-width="5" stroke-linecap="round"/>${copa(-1)}${copa(1)}`;
    }
  },
  vincha: {
    nombre: 'Vincha deportiva', c: ['#FF6B5B', '#FFFFFF'], desc: 'deporte, tenis, atletismo, básquet', pinta(g, A, B) {
      const y0 = Math.max(g.top + 9, g.ojo.y - g.ojo.r * 3.3), x = g.cx + g.hw((y0 - g.top) / g.H);
      return {
        dentro: `<rect x="${n(g.cx - g.W)}" y="${n(y0 - 6)}" width="${n(g.W * 2)}" height="12" fill="${A.base}"/><rect x="${n(g.cx - g.W)}" y="${n(y0 - 1.3)}" width="${n(g.W * 2)}" height="2.6" fill="${B.base}"/><path d="M${P(g.cx - g.W, y0 - 6)}H${n(g.cx + g.W)}M${P(g.cx - g.W, y0 + 6)}H${n(g.cx + g.W)}" stroke="${A.oscuro}" stroke-width="1.6"/>`,
        fuera: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="2" stroke-linejoin="round"><path d="M${P(x - 3, y0 - 3)}q13 -4 19 6q-7 3 -12 0z"/><path d="M${P(x - 3, y0 + 1)}q10 5 11 17q-7 -1 -10 -9z"/></g>`
      };
    }
  },
  boina: {
    nombre: 'Boina', c: ['#2B2D42', '#FF6B5B'], desc: 'arte, pintura, poesía, Francia', pinta(g, A) {
      const yb = g.sombrero.y + 3, w = g.sombrero.w, cx = g.cx, h = altoSombrero(g, w * .34) * 1.33;
      return `<g transform="rotate(-9 ${n(cx)} ${n(yb)})"><path d="M${P(cx - w * .62, yb - 2)}C${P(cx - w * .72, yb - h)} ${P(cx + w * .66, yb - h * 1.1)} ${P(cx + w * .64, yb - 4)}C${P(cx + w * .3, yb + 6)} ${P(cx - w * .3, yb + 6)} ${P(cx - w * .62, yb - 2)}Z" fill="${A.base}" stroke="${A.tinta}" stroke-width="${SW}"/>
<path d="M${P(cx - w * .45, yb - h * .45)}Q${P(cx - w * .1, yb - h * .75)} ${P(cx + w * .3, yb - h * .62)}" stroke="#fff" stroke-width="2.5" opacity=".18" fill="none" stroke-linecap="round"/>
<path d="M${P(cx + w * .04, yb - h * .8)}q2 -9 8 -10" stroke="${A.tinta}" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>`;
    }
  },
  orejas: {
    nombre: 'Orejas de gato', c: ['cuerpo', '#FF9FC2'], desc: 'gatos, animales, mascotas', pinta(g, A, B) {
      const oreja = s => { const b = g.borde(s, -5); return `<g transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot + s * 10)}) scale(1.25)"><path d="M-14 7L-3 -22Q0 -26 3 -22L14 7Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M-6 3L-1 -12Q0 -14 1 -12L6 3Z" fill="${B.base}"/></g>`; };
      return { atras: oreja(-.42) + oreja(.42) };
    }
  },
  antena: {
    nombre: 'Antena', c: ['#3D4060', '#FFC83D'], desc: 'robots, tecnología, extraterrestres, programación', pinta(g, A, B) {
      const { cx, top } = g;
      return `<path d="M${P(cx, top + 6)}Q${P(cx + 10, top - 14)} ${P(cx + 5, top - 30)}" fill="none" stroke="${A.base}" stroke-width="3.6" stroke-linecap="round"/>
<g transform="translate(${n(cx + 5)} ${n(top - 35)})"><circle class="apr-brilla" r="7" fill="${B.base}" stroke="${B.oscuro}" stroke-width="2"/><circle cx="-2" cy="-2" r="2.2" fill="#fff" opacity=".85"/></g>`;
    }
  },
  visera: {
    nombre: 'Casco espacial', c: ['#FFFFFF', '#4BA3FF'], desc: 'espacio, astronautas, planetas, cohetes', pinta(g, A, B) {
      const R = g.ojo.r, cy = (g.ojo.y + g.boca.y) / 2 - R * .2, rx = g.ojo.dx + R * 3, ry = (g.boca.y - g.ojo.y) / 2 + R * 3.1;
      const a1 = 3.75, a2 = 4.35, rr = [rx - 9, ry - 9];
      return {
        fuera: `<ellipse cx="${n(g.cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${B.claro}" fill-opacity=".3" stroke="${A.base}" stroke-width="7"/>
<ellipse cx="${n(g.cx)}" cy="${n(cy)}" rx="${n(rx + 3.5)}" ry="${n(ry + 3.5)}" fill="none" stroke="#9EA3BA" stroke-width="1.8"/><ellipse cx="${n(g.cx)}" cy="${n(cy)}" rx="${n(rx - 3.5)}" ry="${n(ry - 3.5)}" fill="none" stroke="#9EA3BA" stroke-width="1.2"/>
<path d="M${P(g.cx + rr[0] * Math.cos(a1), cy + rr[1] * Math.sin(a1))}A${n(rr[0])} ${n(rr[1])} 0 0 1 ${P(g.cx + rr[0] * Math.cos(a2), cy + rr[1] * Math.sin(a2))}" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"/>
<circle cx="${n(g.cx + rx * .72)}" cy="${n(cy + ry * .66)}" r="3" fill="${B.base}"/>`
      };
    }
  },
  brote: {
    nombre: 'Brote', c: ['#8BCB4A', '#5E9E2C'], desc: 'plantas, naturaleza, biología, ecología', pinta(g, A) {
      const { cx, top } = g;
      return `<path d="M${P(cx, top + 4)}C${P(cx - 2, top - 8)} ${P(cx + 2, top - 14)} ${P(cx, top - 20)}" stroke="${A.oscuro}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M${P(cx, top - 16)}C${P(cx - 6, top - 30)} ${P(cx - 22, top - 30)} ${P(cx - 25, top - 21)}C${P(cx - 16, top - 12)} ${P(cx - 6, top - 12)} ${P(cx, top - 16)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/>
<path d="M${P(cx, top - 19)}C${P(cx + 5, top - 30)} ${P(cx + 17, top - 30)} ${P(cx + 19, top - 23)}C${P(cx + 12, top - 16)} ${P(cx + 5, top - 16)} ${P(cx, top - 19)}Z" fill="${A.claro}" stroke="${A.oscuro}" stroke-width="2"/>`;
    }
  },
  fiesta: {
    nombre: 'Gorro de fiesta', c: ['#FF6FB1', '#FFC83D'], desc: 'fiestas, cumpleaños, celebración', pinta(g, A, B) {
      const yb = Math.max(g.sombrero.y, g.top + 6) + 2, x0 = g.cx + Math.min(14, g.sombrero.w * .12), w = 36, h = 46;
      return `<g transform="rotate(14 ${n(x0)} ${n(yb)})"><path d="M${P(x0 - w / 2, yb)}L${P(x0, yb - h)}L${P(x0 + w / 2, yb)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/>
<path d="M${P(x0 - w * .32, yb - h * .3)}L${P(x0 + w * .2, yb - h * .2)}M${P(x0 - w * .18, yb - h * .6)}L${P(x0 + w * .1, yb - h * .55)}" stroke="${B.base}" stroke-width="4" stroke-linecap="round"/>
<circle cx="${n(x0)}" cy="${n(yb - h - 3)}" r="6" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.8"/></g>`;
    }
  },
  bandana: {
    nombre: 'Pañuelo pirata', c: ['#E2483D', '#FFFFFF'], desc: 'piratas, mar, aventuras, barcos', pinta(g, A, B) {
      const yf = Math.max(g.top + 14, g.ojo.y - g.ojo.r * 2.6), x = g.cx + g.hw((yf - g.top) / g.H), pts = [];
      for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
        const px = g.cx - g.W * .5 + i * g.W * .14 + (j % 2) * g.W * .07, py = yf - 9 - j * 12;
        if (py > g.top + 3) pts.push(`<circle cx="${n(px)}" cy="${n(py)}" r="2.6"/>`);
      }
      return {
        dentro: `<path d="M${P(g.cx - g.W, g.top - 40)}H${n(g.cx + g.W)}V${n(yf)}Q${P(g.cx, yf + 7)} ${P(g.cx - g.W, yf)}Z" fill="${A.base}"/><g fill="${B.base}" opacity=".9">${pts.join('')}</g><path d="M${P(g.cx + g.W, yf)}Q${P(g.cx, yf + 7)} ${P(g.cx - g.W, yf)}" stroke="${A.oscuro}" stroke-width="2.4" fill="none"/>`,
        fuera: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="2.2" stroke-linejoin="round"><path d="M${P(x - 4, yf - 6)}q15 -3 21 9q-9 2 -15 -2z"/><path d="M${P(x - 4, yf - 3)}q12 6 12 21q-8 -2 -12 -12z"/><circle cx="${n(x - 2)}" cy="${n(yf - 4)}" r="5"/></g>`
      };
    }
  }
};

/* ======================= PELO ======================= */
const pelo = {
  mechon: {
    nombre: 'Mechón', c: ['#3D4060', '#3D4060'], desc: 'cualquiera, travieso', pinta(g, A) {
      const { cx, top } = g;
      return `<path d="M${P(cx - 4, top + 6)}C${P(cx - 9, top - 12)} ${P(cx + 11, top - 24)} ${P(cx + 16, top - 12)}C${P(cx + 7, top - 15)} ${P(cx + 2, top - 6)} ${P(cx + 6, top + 6)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/>`;
    }
  },
  puntas: {
    nombre: 'Pelo en puntas', c: ['#3D4060', '#3D4060'], desc: 'anime, rebelde, energía, superhéroes', pinta(g, A) {
      const ss = [-.92, -.64, -.34, 0, .34, .64, .92];
      const picos = ss.map((s, i) => {
        const b = g.borde(s, -8), L = 32 - Math.abs(s) * 10 + (i % 2 ? 0 : 5);
        return `<path transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot + s * 16)})" d="M-12 6Q-6 ${n(-L * .45)} 3 ${n(-L)}Q5 ${n(-L * .4)} 12 6Z"/>`;
      }).join('');
      return { atras: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round">${picos}</g>`, dentro: `<path d="${casquete(g, frente(g), { k: 5, prof: 12, picos: true })}" fill="${A.base}"/>` };
    }
  },
  flequillo: {
    nombre: 'Flequillo', c: ['#6B4226', '#6B4226'], desc: 'cualquiera, estudiante, tranquilo', pinta(g, A) {
      return { atras: `<path d="${volumen(g, .8, 4)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`, dentro: `<path d="${casquete(g, frente(g), { k: 4, prof: 8 })}" fill="${A.base}"/>` };
    }
  },
  coletas: {
    nombre: 'Coletas', c: ['#FF9A3D', '#FF6FB1'], desc: 'alegre, deporte, escuela', pinta(g, A, B) {
      const cola = s => { const b = g.borde(s * .8, 4); return `<g transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot + s * 35)})"><ellipse cx="0" cy="-13" rx="12" ry="17" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/><rect x="-7" y="-3" width="14" height="6" rx="3" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.4"/></g>`; };
      return { atras: cola(-1) + cola(1) + `<path d="${volumen(g, .75, 3)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`, dentro: `<path d="${casquete(g, frente(g), { k: 4, prof: 7 })}" fill="${A.base}"/>` };
    }
  },
  mono: {
    nombre: 'Moño', c: ['#2B2D42', '#FF6B5B'], desc: 'danza, ballet, artes marciales, elegante', pinta(g, A, B) {
      const { cx, top } = g;
      return {
        atras: `<circle cx="${n(cx)}" cy="${n(top - 7)}" r="14" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`,
        dentro: `<path d="${casquete(g, frente(g), { k: 3, prof: 6 })}" fill="${A.base}"/>`,
        fuera: `<rect x="${n(cx - 11)}" y="${n(top - 1)}" width="22" height="6" rx="3" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.5"/>`
      };
    }
  },
  cresta: {
    nombre: 'Cresta', c: ['#FF4D6D', '#FF4D6D'], desc: 'rock, punk, videojuegos, rebelde', pinta(g, A) {
      const picos = [-.26, -.13, 0, .13, .26].map((s, i) => { const b = g.borde(s, -6), L = 26 - Math.abs(s) * 20 + (i % 2 ? 0 : 4); return `<path transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot)})" d="M-8 5Q-4 ${n(-L * .5)} 1 ${n(-L)}Q4 ${n(-L * .4)} 8 5Z"/>`; }).join('');
      return { atras: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round">${picos}</g>`, dentro: `<rect x="${n(g.cx - 12)}" y="${n(g.top - 20)}" width="24" height="${n(frente(g) - g.top + 24)}" rx="10" fill="${A.base}"/>` };
    }
  },
  rulos: {
    nombre: 'Rulos', c: ['#4A2E1F', '#4A2E1F'], desc: 'ciencia, música, alegre', pinta(g, A) {
      const bolas = []; for (let i = 0; i <= 8; i++) { const b = g.borde(-.86 + 1.72 * i / 8, 1); bolas.push(`<circle cx="${n(b.x)}" cy="${n(b.y)}" r="${i % 2 ? 9 : 11}"/>`); }
      return { atras: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}">${bolas.join('')}</g>`, dentro: `<path d="${casquete(g, frente(g), { k: 5, prof: 7 })}" fill="${A.base}"/>` };
    }
  },
  melena: {
    nombre: 'Melena larga', c: ['#2B2D42', '#2B2D42'], desc: 'música, fantasía, rock, princesas', pinta(g, A) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const b = g.borde(-1 + 2 * i / 16, 7); pts.push([b.x, b.y]); }
      const yb = g.hombro.y + 18, xr = g.cx + g.hw(lim((yb - g.top) / g.H, 0, 1)) + 10;
      pts.push([xr, yb], [g.cx, yb - 8], [2 * g.cx - xr, yb]);
      return { atras: `<path d="${curvaCerrada(pts)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`, dentro: `<path d="${casquete(g, frente(g), { k: 3, prof: 10 })}" fill="${A.base}"/>` };
    }
  }
};

/* ======================= CARA ======================= */
const cara = {
  lentes: {
    nombre: 'Lentes redondos', c: ['#3D4060', '#FFFFFF'], desc: 'ciencia, lectura, matemática, estudio', pinta(g, A) {
      const { y, dx, r: R } = g.ojo, cx = g.cx, rr = Math.min(R * 1.7, dx - 2.5), hw = g.hw(g.F.ojos);
      return `<g fill="#fff" fill-opacity=".16" stroke="${A.base}" stroke-width="2.8"><circle cx="${n(cx - dx)}" cy="${n(y)}" r="${n(rr)}"/><circle cx="${n(cx + dx)}" cy="${n(y)}" r="${n(rr)}"/></g>
<path d="M${P(cx - dx + rr, y - 1)}Q${P(cx, y - 6)} ${P(cx + dx - rr, y - 1)}M${P(cx - dx - rr, y - 2)}L${P(cx - hw + 1, y - 5)}M${P(cx + dx + rr, y - 2)}L${P(cx + hw - 1, y - 5)}" fill="none" stroke="${A.base}" stroke-width="2.8" stroke-linecap="round"/>`;
    }
  },
  lentes_sol: {
    nombre: 'Lentes de sol', c: ['#1E1B3A', '#FFFFFF'], desc: 'música, playa, verano, estrellas', pinta(g, A) {
      const { y, dx, r: R } = g.ojo, cx = g.cx, w = Math.min(R * 3.4, dx * 2 - 5), h = R * 2.5, hw = g.hw(g.F.ojos);
      const lente = x => `<path d="M${P(x - w / 2, y - h * .45)}H${n(x + w / 2)}Q${P(x + w / 2, y + h * .6)} ${P(x, y + h * .55)}Q${P(x - w / 2, y + h * .6)} ${P(x - w / 2, y - h * .45)}Z"/>`;
      return `<g fill="${A.base}" stroke="${A.tinta}" stroke-width="2.4" stroke-linejoin="round">${lente(cx - dx)}${lente(cx + dx)}</g>
<path d="M${P(cx - dx + w / 2, y - h * .3)}Q${P(cx, y - h * .55)} ${P(cx + dx - w / 2, y - h * .3)}M${P(cx - dx - w / 2, y - h * .4)}L${P(cx - hw + 1, y - h * .6)}M${P(cx + dx + w / 2, y - h * .4)}L${P(cx + hw - 1, y - h * .6)}" stroke="${A.base}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M${P(cx - dx - w * .3, y - h * .2)}l${n(w * .25)} ${n(-h * .12)}M${P(cx + dx - w * .3, y - h * .2)}l${n(w * .25)} ${n(-h * .12)}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`;
    }
  },
  antifaz: {
    nombre: 'Antifaz', c: ['#2B2D42', '#FF6B5B'], desc: 'superhéroes, misterio, detectives, carnaval', pinta(g, A) {
      const { y, dx, r: R } = g.ojo, cx = g.cx;
      const borde = `M${P(cx - dx - R * 2.4, y - R * .4)}C${P(cx - dx - R * 2, y - R * 2.4)} ${P(cx - R, y - R * 2)} ${P(cx, y - R * 1.2)}C${P(cx + R, y - R * 2)} ${P(cx + dx + R * 2, y - R * 2.4)} ${P(cx + dx + R * 2.4, y - R * .4)}C${P(cx + dx + R * 2.2, y + R * 1.6)} ${P(cx + R, y + R * 1.9)} ${P(cx, y + R * .9)}C${P(cx - R, y + R * 1.9)} ${P(cx - dx - R * 2.2, y + R * 1.6)} ${P(cx - dx - R * 2.4, y - R * .4)}Z`;
      return `<path fill-rule="evenodd" d="${borde}${elipseHueco(cx - dx, y, R * 1.2, R * 1.45)}${elipseHueco(cx + dx, y, R * 1.2, R * 1.45)}" fill="${A.base}" stroke="${A.tinta}" stroke-width="2"/>
<path d="M${P(cx - dx - R * 2.3, y - R * .2)}q-8 -2 -12 4M${P(cx + dx + R * 2.3, y - R * .2)}q8 -2 12 4" stroke="${A.base}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    }
  },
  visor: {
    nombre: 'Visor', c: ['#2CE0FF', '#FFFFFF'], desc: 'videojuegos, robots, futuro, ciencia ficción', pinta(g, A) {
      const { y, dx, r: R } = g.ojo, cx = g.cx, x0 = cx - dx - R * 2.3, w = dx * 2 + R * 4.6, h = R * 2.8;
      return `<rect x="${n(x0)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" fill="${A.base}" fill-opacity=".45" stroke="${A.oscuro}" stroke-width="2.4"/>
<path d="M${P(x0 + h * .5, y - h * .25)}H${n(x0 + w * .45)}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
<path d="M${P(x0 + w * .55, y + h * .25)}H${n(x0 + w - h * .5)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/>`;
    }
  },
  bigote: {
    nombre: 'Bigote', c: ['#5A3A2A', '#5A3A2A'], desc: 'chef, abuelo, detective, señor elegante', pinta(g, A) {
      const R = g.ojo.r, s = R / 10, x = g.cx, y = g.boca.y - R * .85;
      const lado = k => `M${P(x, y - 1 * s)}C${P(x - 4 * k * s, y - 6 * s)} ${P(x - 13 * k * s, y - 7 * s)} ${P(x - 18 * k * s, y - 1 * s)}C${P(x - 21 * k * s, y + 2 * s)} ${P(x - 24 * k * s, y - 3 * s)} ${P(x - 21 * k * s, y - 7 * s)}C${P(x - 25 * k * s, y + 4 * s)} ${P(x - 14 * k * s, y + 8 * s)} ${P(x, y + 3 * s)}Z`;
      return `<path d="${lado(1)}${lado(-1)}" fill="${A.base}" stroke="${A.tinta}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
  },
  pintura: {
    nombre: 'Pintura de hincha', c: ['#4BA3FF', '#FFFFFF'], desc: 'fútbol, hinchas, deporte, guerreros', pinta(g, A, B) {
      const { y, dx, r: R } = g.ojo;
      return [-1, 1].map(l => { const ex = g.cx + l * dx; return `<g transform="rotate(${-8 * l} ${n(ex)} ${n(y + R * 2)})"><rect x="${n(ex - R * .9)}" y="${n(y + R * 1.55)}" width="${n(R * 1.8)}" height="${n(R * .42)}" rx="${n(R * .2)}" fill="${A.base}"/><rect x="${n(ex - R * .9)}" y="${n(y + R * 2.15)}" width="${n(R * 1.8)}" height="${n(R * .42)}" rx="${n(R * .2)}" fill="${B.base}"/></g>`; }).join('');
    }
  },
  pecas: {
    nombre: 'Pecas', c: ['#B5714A', '#B5714A'], desc: 'campo, naturaleza, alegre, cualquiera', pinta(g, A) {
      const { y, dx, r: R } = g.ojo;
      return `<g fill="${A.base}" opacity=".6">${[-1, 1].map(l => { const ex = g.cx + l * (dx + R * .6); return [[0, 0], [R * .7, R * .3], [-R * .5, R * .5]].map(([a, b]) => `<circle cx="${n(ex + a * l)}" cy="${n(y + R * 1.5 + b)}" r="1.5"/>`).join(''); }).join('')}</g>`;
    }
  },
  parche: {
    nombre: 'Parche de pirata', c: ['#1E1B3A', '#1E1B3A'], desc: 'piratas, aventuras, mar', pinta(g, A) {
      const { y, dx, r: R } = g.ojo, ex = g.cx - dx, i = g.borde(-.85, -1), d = g.borde(.5, -1);
      return `<path d="M${P(i.x, i.y)}L${P(ex - R * 1.2, y - R * .8)}M${P(ex + R * 1.1, y - R * 1.1)}L${P(d.x, d.y)}" stroke="${A.base}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="${n(ex)}" cy="${n(y)}" rx="${n(R * 1.55)}" ry="${n(R * 1.45)}" fill="${A.base}" stroke="${A.tinta}" stroke-width="1.5"/><path d="M${P(ex - R * .6, y - R * .6)}q${n(R * .5)} ${n(-R * .3)} ${n(R)} 0" stroke="#fff" stroke-width="1.6" opacity=".3" fill="none" stroke-linecap="round"/>`;
    }
  }
};

/* ======================= CUELLO ======================= */
const cuello = {
  bufanda: {
    nombre: 'Bufanda', c: ['#FF6B5B', '#FFF3E0'], desc: 'frío, invierno, montaña, abrigo', pinta(g, A, B) {
      const yc = g.cuello.y, h = g.cuello.w / 2 + 4, cx = g.cx;
      return `<path d="M${P(cx - h, yc - 7)}Q${P(cx, yc + 3)} ${P(cx + h, yc - 7)}L${P(cx + h, yc + 6)}Q${P(cx, yc + 16)} ${P(cx - h, yc + 6)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/>
<path d="M${P(cx - h + 3, yc - 3)}Q${P(cx, yc + 7)} ${P(cx + h - 3, yc - 3)}M${P(cx - h + 3, yc + 2)}Q${P(cx, yc + 12)} ${P(cx + h - 3, yc + 2)}" stroke="${B.base}" stroke-width="2.2" fill="none" opacity=".9"/>
<path d="M${P(cx + h * .3, yc + 6)}l-3 30l15 2l2 -31z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/>
<path d="M${P(cx + h * .3 - 2, yc + 20)}l14 1.6M${P(cx + h * .3 - 2.6, yc + 27)}l14.4 1.8" stroke="${B.base}" stroke-width="2.4"/>
<path d="M${P(cx + h * .3 - 2, yc + 36)}v5m4 -4.5v5m4 -4.5v5m4 -4.5v5" stroke="${A.oscuro}" stroke-width="2" stroke-linecap="round"/>`;
    }
  },
  corbata: {
    nombre: 'Corbata', c: ['#E2483D', '#FFFFFF'], desc: 'oficina, profesor, negocios, economía', pinta(g, A) {
      const yc = g.cuello.y - 2, cx = g.cx;
      return `<path d="M${P(cx - 4, yc)}L${P(cx - 17, yc - 6)}L${P(cx - 12, yc + 7)}ZM${P(cx + 4, yc)}L${P(cx + 17, yc - 6)}L${P(cx + 12, yc + 7)}Z" fill="#fff" stroke="#C9C5DB" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M${P(cx - 5, yc + 7)}L${P(cx - 9, yc + 34)}L${P(cx, yc + 43)}L${P(cx + 9, yc + 34)}L${P(cx + 5, yc + 7)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2" stroke-linejoin="round"/>
<path d="M${P(cx - 6, yc - 1)}H${n(cx + 6)}L${P(cx + 4, yc + 8)}H${n(cx - 4)}Z" fill="${A.oscuro}" stroke="${A.tinta}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M${P(cx - 7, yc + 18)}l12 -6M${P(cx - 8, yc + 27)}l16 -8" stroke="#fff" stroke-width="2" opacity=".5"/>`;
    }
  },
  lazo: {
    nombre: 'Corbatín', c: ['#6C63FF', '#FFFFFF'], desc: 'elegante, música clásica, magia, fiesta', pinta(g, A) {
      const yc = g.cuello.y, cx = g.cx;
      return `<path d="M${P(cx, yc)}L${P(cx - 17, yc - 10)}Q${P(cx - 21, yc)} ${P(cx - 17, yc + 10)}ZM${P(cx, yc)}L${P(cx + 17, yc - 10)}Q${P(cx + 21, yc)} ${P(cx + 17, yc + 10)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2" stroke-linejoin="round"/><rect x="${n(cx - 5)}" y="${n(yc - 5.5)}" width="10" height="11" rx="3" fill="${A.oscuro}"/>`;
    }
  },
  silbato: {
    nombre: 'Silbato', c: ['#C9CCD8', '#FF6B5B'], desc: 'árbitro, entrenador, deporte, educación física', pinta(g, A, B) {
      const yc = g.cuello.y - 4, cx = g.cx, w = g.cuello.w * .33;
      return `<path d="M${P(cx - w, yc - 6)}Q${P(cx - 6, yc + 12)} ${P(cx, yc + 15)}Q${P(cx + 6, yc + 12)} ${P(cx + w, yc - 6)}" stroke="${B.base}" stroke-width="2.4" fill="none"/>
<g transform="translate(${n(cx)} ${n(yc + 19)}) rotate(-12)"><rect x="-4" y="-4" width="17" height="8" rx="2.5" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8"/><circle cx="-3" cy="2" r="6" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8"/><circle cx="-3" cy="2" r="2" fill="${A.oscuro}"/></g>`;
    }
  },
  medalla: {
    nombre: 'Medalla', c: ['#FFC83D', '#4BA3FF'], desc: 'campeón, olimpiadas, logro, competencia', pinta(g, A, B) {
      const yc = g.cuello.y - 4, cx = g.cx;
      return `<path d="M${P(cx - 14, yc - 6)}L${P(cx - 3, yc + 16)}H${n(cx + 3)}L${P(cx + 14, yc - 6)}H${n(cx + 7)}L${P(cx, yc + 9)}L${P(cx - 7, yc - 6)}Z" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.6" stroke-linejoin="round"/>
<circle cx="${n(cx)}" cy="${n(yc + 24)}" r="10" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/><path d="${estrella(cx, yc + 24, 5.5)}" fill="${A.claro}" stroke="${A.oscuro}" stroke-width="1"/>`;
    }
  },
  panuelo: {
    nombre: 'Pañuelo', c: ['#FF6B5B', '#FFFFFF'], desc: 'vaqueros, cocina, exploradores, campo', pinta(g, A, B) {
      const yc = g.cuello.y - 2, cx = g.cx, w = g.cuello.w * .42;
      return `<path d="M${P(cx - w, yc - 5)}Q${P(cx, yc + 3)} ${P(cx + w, yc - 5)}L${P(cx + 2, yc + 26)}Q${P(cx, yc + 28)} ${P(cx - 2, yc + 26)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2" stroke-linejoin="round"/>
<g fill="${B.base}"><circle cx="${n(cx - w * .45)}" cy="${n(yc + 2)}" r="2"/><circle cx="${n(cx + w * .4)}" cy="${n(yc + 3)}" r="2"/><circle cx="${n(cx - 2)}" cy="${n(yc + 12)}" r="2"/><circle cx="${n(cx + 3)}" cy="${n(yc + 20)}" r="1.6"/></g>`;
    }
  }
};

/* ======================= CUERPO (va recortado a la forma) ======================= */
const cuerpo = {
  delantal: {
    nombre: 'Delantal', c: ['#FFFFFF', '#FF6B5B'], desc: 'cocina, panadería, taller, laboratorio', pinta(g, A, B) {
      const y0 = g.cuello.y + 6, aw = Math.max(26, g.hw((y0 - g.top) / g.H) * .6), cx = g.cx;
      return `<path d="M${P(cx - aw, y0 + 3)}L${P(cx - g.W, y0 - 6)}M${P(cx + aw, y0 + 3)}L${P(cx + g.W, y0 - 6)}" stroke="#DAD7E8" stroke-width="3"/>
<path d="M${P(cx - aw, g.piso + 20)}V${n(y0 + 7)}Q${P(cx - aw, y0)} ${P(cx - aw + 7, y0)}H${n(cx + aw - 7)}Q${P(cx + aw, y0)} ${P(cx + aw, y0 + 7)}V${n(g.piso + 20)}Z" fill="${A.base}" stroke="#CFCBDF" stroke-width="2"/>
<rect x="${n(cx - 11)}" y="${n(y0 + 20)}" width="22" height="14" rx="3" fill="none" stroke="${B.base}" stroke-width="2"/>`;
    }
  },
  camiseta: {
    nombre: 'Camiseta de equipo', c: ['#FFFFFF', '#4BA3FF'], desc: 'fútbol, básquet, vóley, equipo', pinta(g, A, B, o) {
      const y0 = g.cuello.y + 2, cx = g.cx, alto = g.piso - y0, tm = (y0 + alto * .45 - g.top) / g.H, xs = g.hw(tm) - 9;
      return `<path d="M${P(cx - g.W, y0 - 8)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 8)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/>
<path d="M${P(cx - g.W, y0 - 8)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 8)}" stroke="${B.base}" stroke-width="3.5" fill="none"/>
<path d="M${P(cx - 12, y0 - 1)}L${P(cx, y0 + 12)}L${P(cx + 12, y0 - 1)}" fill="none" stroke="${B.base}" stroke-width="4" stroke-linejoin="round"/>
<rect x="${n(cx - xs - 2.5)}" y="${n(y0)}" width="5" height="${n(alto + 20)}" fill="${B.base}"/><rect x="${n(cx + xs - 2.5)}" y="${n(y0)}" width="5" height="${n(alto + 20)}" fill="${B.base}"/>
<text x="${n(cx)}" y="${n(y0 + alto * .62)}" font-size="${n(lim(alto * .4, 16, 30))}" font-weight="800" font-family="'Bricolage Grotesque', 'Nunito', sans-serif" text-anchor="middle" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1">${o.numero || 10}</text>`;
    }
  },
  rayas: {
    nombre: 'Rayas', c: ['#3D4060', '#FFFFFF'], desc: 'marineros, piratas, mimos, playa', pinta(g, A, B) {
      const y0 = g.cuello.y + 2; let s = `<path d="M${P(g.cx - g.W, y0 - 6)}Q${P(g.cx, y0 + 6)} ${P(g.cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(g.cx - g.W)}Z" fill="${B.base}"/>`;
      for (let y = y0 + 6; y < g.piso + 10; y += 13) s += `<rect x="${n(g.cx - g.W)}" y="${n(y)}" width="${n(g.W * 2)}" height="6.5" fill="${A.base}"/>`;
      return s;
    }
  },
  puntos: {
    nombre: 'Lunares', c: ['#FFFFFF', '#FFFFFF'], desc: 'payasos, fiesta, mariquitas, alegre', pinta(g, A) {
      let s = ''; const y0 = g.cuello.y + 6;
      for (let j = 0, y = y0; y < g.piso + 8; j++, y += 17) for (let x = g.cx - g.W / 2 + (j % 2 ? 8 : 0); x < g.cx + g.W / 2 + 8; x += 17) s += `<circle cx="${n(x)}" cy="${n(y)}" r="4.3"/>`;
      return `<g fill="${A.base}" opacity=".7">${s}</g>`;
    }
  },
  overol: {
    nombre: 'Overol', c: ['#4B6BD1', '#FFC83D'], desc: 'granja, taller, mecánica, construcción', pinta(g, A, B) {
      const y0 = g.cuello.y + 4, yw = y0 + (g.piso - y0) * .45, cx = g.cx, bw = 18;
      return `<path d="M${P(cx - bw, y0 + 2)}L${P(cx - g.W * .62, y0 - 16)}M${P(cx + bw, y0 + 2)}L${P(cx + g.W * .62, y0 - 16)}" stroke="${A.base}" stroke-width="6"/>
<rect x="${n(cx - g.W)}" y="${n(yw)}" width="${n(g.W * 2)}" height="${n(g.piso - yw + 20)}" fill="${A.base}"/><rect x="${n(cx - bw)}" y="${n(y0)}" width="${bw * 2}" height="${n(yw - y0 + 4)}" rx="4" fill="${A.base}"/>
<path d="M${P(cx - bw + 5, y0 + 10)}h${bw * 2 - 10}v10a4 4 0 0 1 -4 4h${-(bw * 2 - 18)}a4 4 0 0 1 -4 -4z" fill="none" stroke="${A.oscuro}" stroke-width="1.8"/>
<circle cx="${n(cx - bw + 5)}" cy="${n(y0 + 4)}" r="3.2" fill="${B.base}"/><circle cx="${n(cx + bw - 5)}" cy="${n(y0 + 4)}" r="3.2" fill="${B.base}"/>
<path d="M${P(cx, yw + 6)}V${n(g.piso + 10)}" stroke="${A.oscuro}" stroke-width="1.6" stroke-dasharray="3 3"/>`;
    }
  },
  chaleco: {
    nombre: 'Chaleco', c: ['#B57B52', '#FFC83D'], desc: 'exploradores, vaqueros, detectives, viajes', pinta(g, A, B) {
      const y0 = g.cuello.y - 8, cx = g.cx;
      const panel = k => `<path d="M${P(cx - k * g.W, y0)}H${n(cx - k * 8)}L${P(cx - k * 16, y0 + 26)}L${P(cx - k * 7, g.piso + 20)}H${n(cx - k * g.W)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/>`;
      return `${panel(1)}${panel(-1)}<g fill="${B.base}" stroke="${B.oscuro}" stroke-width="1"><circle cx="${n(cx + 11)}" cy="${n(y0 + 38)}" r="2.6"/><circle cx="${n(cx + 10)}" cy="${n(y0 + 52)}" r="2.6"/></g><rect x="${n(cx - 34)}" y="${n(y0 + 36)}" width="14" height="10" rx="2" fill="none" stroke="${A.oscuro}" stroke-width="1.8"/>`;
    }
  },
  armadura: {
    nombre: 'Armadura', c: ['#C9CCD8', '#FFC83D'], desc: 'caballeros, medieval, guerreros, historia', pinta(g, A, B) {
      const y0 = g.cuello.y + 4; let s = `<rect x="${n(g.cx - g.W)}" y="${n(y0)}" width="${n(g.W * 2)}" height="${n(g.piso - y0 + 20)}" fill="${A.base}"/>`;
      for (let y = y0 + 16; y < g.piso; y += 16) s += `<path d="M${P(g.cx - g.W, y)}Q${P(g.cx, y + 6)} ${P(g.cx + g.W, y)}" stroke="${A.oscuro}" stroke-width="2" fill="none"/>`;
      s += `<path d="M${P(g.cx - g.W, y0)}Q${P(g.cx, y0 + 8)} ${P(g.cx + g.W, y0)}" stroke="${B.base}" stroke-width="4" fill="none"/><rect x="${n(g.cx - g.W * .3)}" y="${n(y0 + 6)}" width="9" height="${n(g.piso - y0)}" fill="#fff" opacity=".35"/>`;
      return s + `<g fill="${A.oscuro}"><circle cx="${n(g.cx - 18)}" cy="${n(y0 + 9)}" r="2"/><circle cx="${n(g.cx + 18)}" cy="${n(y0 + 9)}" r="2"/></g>`;
    }
  },
  aguayo: {
    nombre: 'Aguayo', c: ['#E2483D', '#2E9E5B'], desc: 'Andes, Bolivia, tejido, cultura, feria', pinta(g, A, B) {
      const y0 = g.cuello.y + 10, x0 = g.cx - g.W, w = g.W * 2;
      const franjas = [[A.base, 7], ['#FFC83D', 3], [B.base, 5], ['#D81B60', 13], [B.base, 5], ['#FFC83D', 3], [A.base, 7]];
      let y = y0, s = '';
      for (const [c, h] of franjas) { s += `<rect x="${n(x0)}" y="${n(y)}" width="${n(w)}" height="${h}" fill="${c}"/>`; y += h; }
      const ym = y0 + 7 + 3 + 5 + 6.5;
      for (let x = g.cx - g.W * .6; x < g.cx + g.W * .6; x += 13) s += `<path d="M${P(x, ym - 5)}l5 5l-5 5l-5 -5z" fill="#FFF3E0"/><circle cx="${n(x + 6.5)}" cy="${n(ym)}" r="1.4" fill="#FFC83D"/>`;
      return s;
    }
  },
  pixeles: {
    nombre: 'Textura de bloques', c: ['cuerpo', '#000000'], desc: 'bloques, construir, mundos cúbicos, pixel art', pinta(g) {
      const tam = 14; let s = '';
      for (let y = g.top - 2; y < g.piso + 4; y += tam) for (let x = g.cx - g.W / 2 - 4; x < g.cx + g.W / 2 + 4; x += tam) {
        const h = ruido(x, y); if (h < .35) continue;
        s += `<rect x="${n(x)}" y="${n(y)}" width="${tam}" height="${tam}" fill="${h > .7 ? '#fff' : '#000'}" opacity="${h > .7 ? .14 : .09}"/>`;
      }
      return s;
    }
  },
  bata: {
    nombre: 'Bata de laboratorio', c: ['#FFFFFF', '#4BA3FF'], desc: 'ciencia, química, medicina, laboratorio', pinta(g, A, B) {
      const y0 = g.cuello.y - 4, cx = g.cx;
      const panel = k => `<path d="M${P(cx - k * g.W, y0 - 6)}H${n(cx - k * 6)}L${P(cx - k * 15, y0 + 18)}L${P(cx - k * 8, g.piso + 20)}H${n(cx - k * g.W)}Z" fill="${A.base}" stroke="#D3D0E2" stroke-width="2"/>`;
      return `${panel(1)}${panel(-1)}<path d="M${P(cx - 6, y0 - 6)}L${P(cx - 15, y0 + 18)}L${P(cx - 24, y0 + 4)}ZM${P(cx + 6, y0 - 6)}L${P(cx + 15, y0 + 18)}L${P(cx + 24, y0 + 4)}Z" fill="#ECEAF4" stroke="#D3D0E2" stroke-width="1.6"/>
<path d="M${P(cx - 36, y0 + 26)}v-9M${P(cx - 31, y0 + 26)}v-7" stroke-width="3" stroke-linecap="round" stroke="${B.base}"/><path d="M${P(cx - 31, y0 + 26)}v-7" stroke-width="3" stroke-linecap="round" stroke="#FF6B5B"/>
<rect x="${n(cx - 40)}" y="${n(y0 + 24)}" width="16" height="11" rx="2" fill="${A.base}" stroke="#D3D0E2" stroke-width="1.6"/>`;
    }
  },
  traje: {
    nombre: 'Traje espacial', c: ['#FFFFFF', '#FF6B5B'], desc: 'espacio, astronautas, cohetes, planetas', pinta(g, A, B) {
      const y0 = g.cuello.y + 2, cx = g.cx;
      return `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/>
<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 6)}" stroke="#B9BDD0" stroke-width="5" fill="none"/>
<rect x="${n(cx - 17)}" y="${n(y0 + 10)}" width="34" height="20" rx="4" fill="#E4E6F0" stroke="#B9BDD0" stroke-width="1.8"/>
<circle cx="${n(cx - 9)}" cy="${n(y0 + 20)}" r="3.2" fill="${B.base}"/><circle cx="${n(cx)}" cy="${n(y0 + 20)}" r="3.2" fill="#FFC83D"/><circle cx="${n(cx + 9)}" cy="${n(y0 + 20)}" r="3.2" fill="#2CC4A8"/>
<path d="M${P(cx - g.W, g.piso - 26)}H${n(cx + g.W)}" stroke="#B9BDD0" stroke-width="5"/>`;
    }
  }
};

/* ======================= ESPALDA ======================= */
const espalda = {
  capa: {
    nombre: 'Capa', c: ['#E2483D', '#FFC83D'], desc: 'superhéroes, magia, reyes, vampiros', pinta(g, A, B) {
      const ys = g.hombro.y - 14, sw = g.hombro.dx + 2, cx = g.cx, ab = g.piso - ys;
      const forma = `M${P(-sw, 0)}C${P(-sw - 18, ab * .45)} ${P(-g.W * .72, ab - 20)} ${P(-g.W * .66, ab + 4)}Q${P(0, ab + 14)} ${P(g.W * .66, ab + 4)}C${P(g.W * .72, ab - 20)} ${P(sw + 18, ab * .45)} ${P(sw, 0)}Z`;
      return {
        espalda: `<g transform="translate(${n(cx)} ${n(ys)})"><g class="apr-ondea"><path d="${forma}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M${P(-g.W * .6, ab + 2)}Q${P(0, ab + 10)} ${P(g.W * .6, ab + 2)}" stroke="${B.base}" stroke-width="3" fill="none" opacity=".8"/></g></g>`,
        fuera: `<path d="M${P(cx - sw * .92, ys + 3)}Q${P(cx, g.cuello.y + 8)} ${P(cx + sw * .92, ys + 3)}" stroke="${A.oscuro}" stroke-width="3" fill="none"/><circle cx="${n(cx)}" cy="${n((ys + 3 + g.cuello.y + 8) / 2 + 2)}" r="5" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.6"/>`
      };
    }
  },
  mochila: {
    nombre: 'Mochila', c: ['#FF9A3D', '#3D4060'], desc: 'exploradores, escuela, viajes, campamento', pinta(g, A, B) {
      const x = g.cx + g.hw(g.F.tm) * .55, y = g.hombro.y - 18, sx = g.cx + g.hw((g.hombro.y - g.top) / g.H) * .55;
      return {
        espalda: `<rect x="${n(x)}" y="${n(y)}" width="40" height="54" rx="11" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/><rect x="${n(x + 14)}" y="${n(y + 24)}" width="24" height="20" rx="5" fill="${A.oscuro}" opacity=".35"/>`,
        dentro: `<path d="M${P(sx, g.hombro.y - 8)}Q${P(sx + 3, g.hombro.y + 14)} ${P(sx - 2, g.hombro.y + 40)}M${P(2 * g.cx - sx, g.hombro.y - 8)}Q${P(2 * g.cx - sx - 3, g.hombro.y + 14)} ${P(2 * g.cx - sx + 2, g.hombro.y + 40)}" stroke="${B.base}" stroke-width="6" fill="none" stroke-linecap="round"/>`
      };
    }
  },
  alas: {
    nombre: 'Alas', c: ['#FFFFFF', '#C9E4FF'], desc: 'ángeles, aves, fantasía, volar', pinta(g, A, B) {
      const y = g.hombro.y - 12, dx = g.hombro.dx * .55;
      const ala = 'M0 0C10 -30 40 -48 60 -42C53 -32 56 -24 47 -17C54 -10 51 -2 41 2C45 9 38 15 28 14C18 16 6 10 0 0Z';
      const pluma = 'M14 -6C24 -18 36 -26 48 -30M12 0C22 -4 32 -8 40 -10';
      const una = k => `<g transform="translate(${n(g.cx + k * dx)} ${n(y)}) scale(${k} 1)"><g class="apr-aletea"><path d="${ala}" fill="${A.base}" stroke="#B9BDD0" stroke-width="${SW}" stroke-linejoin="round"/><path d="${pluma}" stroke="${B.base}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g></g>`;
      return una(-1) + una(1);
    }
  },
  propulsor: {
    nombre: 'Propulsor', c: ['#C9CCD8', '#FF9A3D'], desc: 'espacio, cohetes, futuro, inventos', pinta(g, A, B) {
      const y = g.hombro.y - 14, dx = g.hombro.dx + 2;
      const tubo = k => `<g transform="translate(${n(g.cx + k * dx - 8)} ${n(y)})"><rect width="16" height="44" rx="7" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/><path d="M2 44h12l-2 6h-8z" fill="${A.oscuro}"/><g transform="translate(8 50)"><path class="apr-llama" d="M-5 0Q-6 10 0 18Q6 10 5 0Z" fill="${B.base}"/><path class="apr-llama" d="M-2.5 0Q-3 6 0 11Q3 6 2.5 0Z" fill="#FFE066"/></g></g>`;
      return tubo(-1) + tubo(1);
    }
  },
  cola: {
    nombre: 'Cola', c: ['cuerpo', '#FFFFFF'], desc: 'animales, gatos, perros, zorros, dinosaurios', pinta(g, A, B) {
      const t = .8, x = g.cx + g.hw(t) * .7, y = g.y(t), d = 'M0 0C24 4 34 -10 30 -28C28 -38 40 -44 45 -33';
      return `<g transform="translate(${n(x)} ${n(y)})"><g class="apr-menea"><path d="${d}" fill="none" stroke="${A.oscuro}" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${A.base}" stroke-width="9" stroke-linecap="round"/><circle cx="45" cy="-33" r="6.5" fill="${B.base}" stroke="${A.oscuro}" stroke-width="2"/></g></g>`;
    }
  }
};

/* ======================= EN LA MANO (origen = la mano, el objeto apunta hacia arriba) ======================= */
const mano = {
  cuchara: { nombre: 'Cuchara de palo', c: ['#C98A4B', '#E0A869'], desc: 'cocina, recetas, química de la comida', pinta: (g, A) => `<rect x="-2.3" y="-24" width="4.6" height="31" rx="2.3" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.6"/><ellipse cx="0" cy="-31" rx="7.5" ry="10" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8"/><ellipse cx="0" cy="-32" rx="4.5" ry="6.5" fill="${A.claro}"/>` },
  sarten: { nombre: 'Sartén', c: ['#3D4060', '#FFC83D'], desc: 'cocina, desayuno, recetas', pinta: (g, A, B) => `<rect x="-2.6" y="-16" width="5.2" height="22" rx="2.6" fill="${A.tinta}"/><ellipse cx="0" cy="-29" rx="16" ry="14" fill="${A.base}" stroke="${A.tinta}" stroke-width="2"/><ellipse cx="0" cy="-30" rx="12" ry="10.5" fill="${A.oscuro}"/><path d="M-7 -32c0 -6 9 -8 12 -3c4 2 2 9 -3 8c-4 2 -10 0 -9 -5z" fill="#fff"/><circle cx="0" cy="-31" r="3.6" fill="${B.base}"/>` },
  pelota: { nombre: 'Pelota de fútbol', c: ['#FFFFFF', '#1E1B3A'], desc: 'fútbol, deporte, física del movimiento', pinta: (g, A, B) => `<circle cx="0" cy="-11" r="12.5" fill="${A.base}" stroke="${B.base}" stroke-width="1.8"/><path d="${poligono(0, -11, 4.6, 5)}" fill="${B.base}"/>${[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `<path d="M${P(Math.cos(a) * 4.6, -11 + Math.sin(a) * 4.6)}L${P(Math.cos(a) * 12, -11 + Math.sin(a) * 12)}" stroke="${B.base}" stroke-width="1.5"/>`; }).join('')}` },
  balon: { nombre: 'Balón de básquet', c: ['#FF8A3D', '#5A2A10'], desc: 'básquet, deporte, parábolas', pinta: (g, A, B) => `<circle cx="0" cy="-11" r="12.5" fill="${A.base}" stroke="${B.base}" stroke-width="1.8"/><path d="M0 -23.5V1.5M-12.5 -11H12.5M-8.5 -20Q-3 -11 -8.5 -2M8.5 -20Q3 -11 8.5 -2" stroke="${B.base}" stroke-width="1.5" fill="none"/>` },
  microfono: { nombre: 'Micrófono', c: ['#C9CCD8', '#FF6FB1'], desc: 'música, canto, radio, debate, podcasts', pinta: (g, A, B) => `<path d="M-3 7L-4.5 -14H4.5L3 7Z" fill="#3D4060"/><rect x="-5.5" y="-17" width="11" height="4" rx="1.5" fill="${B.base}"/><circle cx="0" cy="-24" r="8.5" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8"/><path d="M-6 -27H6M-7 -23H7M-5 -19H5M-3 -31V-17M3 -31V-17" stroke="${A.oscuro}" stroke-width="1" opacity=".7"/>` },
  lapiz: { nombre: 'Lápiz', c: ['#FFC83D', '#FF8FB1'], desc: 'escuela, escritura, dibujo, matemática', pinta: (g, A, B) => `<rect x="-4" y="-30" width="8" height="34" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.6"/><path d="M-1.3 -30V4" stroke="${A.oscuro}" stroke-width="1" opacity=".5"/><path d="M-4 -30L0 -41L4 -30Z" fill="#F2C48D" stroke="${A.oscuro}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-1.4 -37L0 -41L1.4 -37Z" fill="#3D4060"/><rect x="-4" y="4" width="8" height="4" fill="#C9CCD8"/><rect x="-4" y="8" width="8" height="5" rx="2" fill="${B.base}"/>` },
  libro: { nombre: 'Libro', c: ['#6C63FF', '#FFC83D'], desc: 'lectura, historia, literatura, estudio', pinta: (g, A, B) => `<rect x="-12" y="-28" width="24" height="30" rx="2.5" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8"/><rect x="9" y="-26" width="3" height="26" fill="#fff"/><rect x="-12" y="-28" width="4.5" height="30" fill="${A.oscuro}"/><path d="M-4 -20H6M-4 -15H4" stroke="${B.base}" stroke-width="2.2" stroke-linecap="round"/>` },
  varita: { nombre: 'Varita', c: ['#3D4060', '#FFC83D'], desc: 'magia, fantasía, cuentos', pinta: (g, A, B) => `<path d="M0 6V-26" stroke="${A.base}" stroke-width="3.6" stroke-linecap="round"/><path d="M0 -4V-10" stroke="#fff" stroke-width="3.6" opacity=".35"/><path d="${estrella(0, -31, 8.5)}" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.4" stroke-linejoin="round"/><path d="${estrella(10, -40, 3.5, 4, .35)}" fill="${B.claro}"/>` },
  pico: { nombre: 'Pico', c: ['#9AA3B5', '#B07A4A'], desc: 'minería, bloques, geología, construir', pinta: (g, A, B) => `<rect x="-2.3" y="-31" width="4.6" height="38" rx="2" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.5"/><path d="M-19 -26Q0 -42 19 -26L16 -23Q0 -33 -16 -23Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8" stroke-linejoin="round"/>` },
  espada: { nombre: 'Espada', c: ['#DDE3EE', '#FFC83D'], desc: 'caballeros, piratas, aventuras, historia', pinta: (g, A, B) => `<path d="M-3 -7V-38L0 -45L3 -38V-7Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -10V-40" stroke="#fff" stroke-width="1.2" opacity=".7"/><rect x="-11" y="-9" width="22" height="4.5" rx="2" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.2"/><rect x="-2.3" y="-5" width="4.6" height="10" fill="#7A4B2A"/><circle cx="0" cy="6.5" r="3" fill="${B.base}"/>` },
  raqueta: { nombre: 'Raqueta', c: ['#FF6B5B', '#FFFFFF'], desc: 'tenis, deporte, física', pinta: (g, A) => `<rect x="-2.4" y="-12" width="4.8" height="19" rx="2" fill="#3D4060"/><ellipse cx="0" cy="-26" rx="11" ry="14" fill="#fff" fill-opacity=".5" stroke="${A.base}" stroke-width="3.6"/><path d="M-5 -38V-14M0 -40V-12M5 -38V-14M-9 -31H9M-10 -26H10M-9 -21H9" stroke="${A.oscuro}" stroke-width=".9" opacity=".6"/>` },
  pincel: { nombre: 'Pincel', c: ['#E2483D', '#4BA3FF'], desc: 'arte, pintura, colores, diseño', pinta: (g, A, B) => `<rect x="-2.5" y="-11" width="5" height="19" rx="2.5" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.4"/><rect x="-3" y="-19" width="6" height="8" fill="#C9CCD8" stroke="#8E95B0" stroke-width="1"/><path d="M-3 -19Q-4.5 -29 0 -36Q4.5 -29 3 -19Z" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.3"/>` },
  probeta: { nombre: 'Probeta', c: ['#2CC4A8', '#FFFFFF'], desc: 'ciencia, química, experimentos', pinta: (g, A) => `<path d="M-5.5 -36V-3A5.5 5.5 0 0 0 5.5 -3V-36Z" fill="#fff" fill-opacity=".55" stroke="#8E95B0" stroke-width="1.8"/><path d="M-5.5 -18V-3A5.5 5.5 0 0 0 5.5 -3V-18Z" fill="${A.base}"/><circle cx="-1.5" cy="-10" r="1.6" fill="#fff" opacity=".8"/><circle cx="2" cy="-14" r="1.1" fill="#fff" opacity=".8"/><rect x="-7.5" y="-39" width="15" height="4" rx="2" fill="#8E95B0"/>` },
  lupa: { nombre: 'Lupa', c: ['#3D4060', '#BFE3FF'], desc: 'detectives, investigación, biología, ciencia', pinta: (g, A, B) => `<rect x="-2.6" y="-14" width="5.2" height="20" rx="2.6" fill="${A.base}"/><circle cx="0" cy="-25" r="11" fill="${B.base}" fill-opacity=".45" stroke="${A.base}" stroke-width="4"/><path d="M-6 -29a7 7 0 0 1 6 -4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>` },
  calculadora: { nombre: 'Calculadora', c: ['#3D4060', '#B8F2C9'], desc: 'matemática, economía, finanzas, contabilidad', pinta: (g, A, B) => `<rect x="-11" y="-32" width="22" height="31" rx="3.5" fill="${A.base}" stroke="${A.tinta}" stroke-width="1.6"/><rect x="-7.5" y="-28.5" width="15" height="7" rx="1.5" fill="${B.base}"/>${[0, 1, 2].map(i => [0, 1, 2].map(j => `<rect x="${-7.5 + j * 5.6}" y="${-18.5 + i * 5.4}" width="3.6" height="3.4" rx="1" fill="${i === 2 && j === 2 ? '#FF9A3D' : '#C9CCD8'}"/>`).join('')).join('')}` },
  control: { nombre: 'Control de videojuego', c: ['#3D4060', '#FF6B5B'], desc: 'videojuegos, gamers, programación', pinta: (g, A, B) => `<path d="M-17 -16Q-17 -24 -9 -24H9Q17 -24 17 -16L19 -5Q19 1 13 0L8 -5H-8L-13 0Q-19 1 -19 -5Z" fill="${A.base}" stroke="${A.tinta}" stroke-width="1.8" stroke-linejoin="round"/><path d="M-10 -18v6M-13 -15h6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="9" cy="-17" r="2.2" fill="${B.base}"/><circle cx="13" cy="-13" r="2.2" fill="#FFC83D"/>` },
  flor: { nombre: 'Flor', c: ['#FF6FB1', '#FFC83D'], desc: 'naturaleza, primavera, biología, regalos', pinta: (g, A, B) => `<path d="M0 6V-20" stroke="#5E9E2C" stroke-width="3" stroke-linecap="round"/><path d="M0 -8q-10 -2 -11 -9q8 0 11 6z" fill="#8BCB4A"/>${[0, 1, 2, 3, 4].map(i => { const a = i * 72 * Math.PI / 180; return `<circle cx="${n(Math.cos(a) * 6.5)}" cy="${n(-27 + Math.sin(a) * 6.5)}" r="5.5" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.2"/>`; }).join('')}<circle cx="0" cy="-27" r="4.2" fill="${B.base}"/>` }
};

/* ======================= AURA ======================= */
const aura = {
  chispas: {
    nombre: 'Chispas', c: ['#FFC83D', '#FFFFFF'], desc: 'magia, logro, brillo, cualquiera', pinta(g, A) {
      const pos = [[-.62, .25, 7], [.64, .3, 6], [-.56, .72, 5], [.58, .78, 7], [-.25, -.12, 5], [.32, -.08, 6]];
      return pos.map(([x, y, r], i) => `<g transform="translate(${n(g.cx + x * g.W)} ${n(g.top + y * g.H)})"><path class="apr-titila" style="animation-delay:${(i * .37).toFixed(2)}s" d="${estrella(0, 0, r, 4, .38)}" fill="${A.base}"/></g>`).join('');
    }
  },
  fuego: {
    nombre: 'Aura de energía', c: ['#FFB000', '#FFE066'], desc: 'poder, energía, deporte, superhéroes, anime', pinta(g, A, B) {
      const capa = (base, amp, fase) => curvaCerrada(g.contorno.map(([x, y], i) => {
        const [nx, ny] = g.normales[i], arriba = Math.max(0, -ny), ola = .5 + .5 * Math.cos(i * .9 + fase);
        return [x + nx * base - g.cx, y + ny * base - arriba * amp * ola - g.piso];
      }));
      return `<g transform="translate(${g.cx} ${g.piso})"><g class="apr-llamea"><path d="${capa(14, 18, 0)}" fill="${A.base}" opacity=".42"/><path d="${capa(7, 10, 1.4)}" fill="${B.base}" opacity=".5"/></g></g>`;
    }
  },
  halo: {
    nombre: 'Halo', c: ['#FFC83D', '#FFFFFF'], desc: 'ángeles, bondad, logro', pinta(g, A) {
      const y = g.top - 26;
      return `<ellipse cx="${g.cx}" cy="${n(y)}" rx="23" ry="6.5" fill="none" stroke="${A.base}" stroke-width="11" opacity=".25"/><ellipse cx="${g.cx}" cy="${n(y)}" rx="23" ry="6.5" fill="none" stroke="${A.base}" stroke-width="4.5"/>`;
    }
  },
  burbujas: {
    nombre: 'Burbujas', c: ['#9AD4FF', '#FFFFFF'], desc: 'ciencia, química, mar, jabón', pinta(g, A) {
      const pos = [[-.6, .55, 6], [.62, .45, 8], [-.5, .1, 4.5], [.5, .05, 5], [.7, .85, 4], [-.68, .85, 5.5]];
      return pos.map(([x, y, r], i) => `<g transform="translate(${n(g.cx + x * g.W)} ${n(g.top + y * g.H)})"><circle class="apr-sube" style="animation-delay:${(i * .55).toFixed(2)}s" r="${r}" fill="${A.claro}" fill-opacity=".35" stroke="${A.base}" stroke-width="1.6"/></g>`).join('');
    }
  },
  notas: {
    nombre: 'Notas musicales', c: ['#6C63FF', '#FF6FB1'], desc: 'música, canto, baile, ritmo', pinta(g, A, B) {
      const nota = c => `<path d="M2 -16V0" stroke="${c}" stroke-width="2.4"/><path d="M2 -16q7 2 8 8q-3 -3 -8 -3z" fill="${c}"/><ellipse cx="-2" cy="1" rx="5" ry="3.8" transform="rotate(-20 -2 1)" fill="${c}"/>`;
      const pos = [[-.62, .3], [.66, .2], [-.58, .75], [.6, .7]];
      return pos.map(([x, y], i) => `<g transform="translate(${n(g.cx + x * g.W)} ${n(g.top + y * g.H)})"><g class="apr-sube" style="animation-delay:${(i * .7).toFixed(2)}s">${nota(i % 2 ? B.base : A.base)}</g></g>`).join('');
    }
  },
  rayos: {
    nombre: 'Rayos', c: ['#FFE066', '#FFB000'], desc: 'electricidad, energía, videojuegos, tormentas', pinta(g, A, B) {
      const pos = [[-.62, .25, -15], [.64, .2, 15], [-.6, .7, -10], [.62, .72, 12]];
      return pos.map(([x, y, r], i) => `<g transform="translate(${n(g.cx + x * g.W)} ${n(g.top + y * g.H)}) rotate(${r})"><path class="apr-titila" style="animation-delay:${(i * .3).toFixed(2)}s" d="M2 -12L-5 1H0L-3 12L6 -2H1L4 -12Z" fill="${A.base}" stroke="${B.base}" stroke-width="1.3" stroke-linejoin="round"/></g>`).join('');
    }
  }
};


/* ======================= PIEZAS ICÓNICAS ======================= */
// Sirven para que el aprendín se parezca a lo que le gusta al estudiante (un estilo de anime, un equipo, un héroe)
// combinando peinado, ropa y colores, sin copiar personajes ni logos.
const picosPelo = (g, ss, largo, inclina, gruesa = 15) => ss.map((s, i) => {
  const b = g.borde(s, -10), L = largo - Math.abs(s) * 15 + (i % 2 ? -4 : 4);
  return `<path transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot * inclina + s * 20)})" d="M${-gruesa} 8Q-8 ${n(-L * .42)} 2 ${n(-L)}Q7 ${n(-L * .46)} ${gruesa} 8Z"/>`;
}).join('');
const mechonesFrente = (g, yf) => [-.52, -.18, .16, .5].map((u, i) => { const x = g.cx + u * g.W * .5, L = 16 + (i % 2) * 7; return `<path d="M${P(x - 10, yf - 16)}L${P(x + (u < 0 ? -3 : 3), yf - 16 + L)}L${P(x + 10, yf - 16)}Z"/>`; }).join('');

Object.assign(pelo, {
  puntas_grande: {
    nombre: 'Puntas grandes', c: ['#1E1B3A', '#1E1B3A'], desc: 'anime de peleas, héroes shonen, guerreros, energía', pinta(g, A) {
      const yf = frente(g) + 4;
      return { atras: `<g fill="${A.base}" stroke="${A.tinta}" stroke-width="${SW}" stroke-linejoin="round">${picosPelo(g, [-1.1, -.82, -.55, -.27, 0, .27, .55, .82, 1.1], 52, 1)}</g>`,
        dentro: `<path d="${casquete(g, yf - 12, { k: 1, prof: 0 })}" fill="${A.base}"/><g fill="${A.base}">${mechonesFrente(g, yf)}</g>` };
    }
  },
  super: {
    nombre: 'Pelo de transformación', c: ['#FFD83D', '#FFF3A0'], desc: 'transformación, poder máximo, anime de peleas, pelo dorado', pinta(g, A, B) {
      const yf = frente(g) + 4;
      return { atras: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round">${picosPelo(g, [-1, -.72, -.44, -.16, .12, .4, .68, .96], 64, .5, 16)}</g>`,
        dentro: `<path d="${casquete(g, yf - 12, { k: 1, prof: 0 })}" fill="${A.base}"/><g fill="${A.base}">${mechonesFrente(g, yf)}</g><path d="M${P(g.cx - g.W * .3, g.top + 10)}q${n(g.W * .12)} -6 ${n(g.W * .22)} -2" stroke="${B.base}" stroke-width="3" fill="none" stroke-linecap="round"/>` };
    }
  },
  cola_caballo: {
    nombre: 'Cola de caballo', c: ['#6B4226', '#FF6B5B'], desc: 'deporte, danza, aventura, cualquiera', pinta(g, A, B) {
      const b = g.borde(.62, -2), tr = `translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot + 75)})`;
      return { atras: `<path transform="${tr}" d="M-7 2C-12 -16 -4 -38 9 -48C18 -32 19 -12 7 2Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><path d="${volumen(g, .8, 4)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`,
        dentro: `<path d="${casquete(g, frente(g), { k: 3, prof: 7 })}" fill="${A.base}"/>`,
        fuera: `<rect transform="${tr}" x="-7" y="-5" width="14" height="7" rx="3" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.4"/>` };
    }
  },
  afro: {
    nombre: 'Afro', c: ['#2B1D14', '#2B1D14'], desc: 'música, baile, funk, alegría', pinta(g, A) {
      const bolas = []; for (let i = 0; i <= 12; i++) { const b = g.borde(-1.08 + 2.16 * i / 12, 9); bolas.push(`<circle cx="${n(b.x)}" cy="${n(b.y)}" r="${i % 2 ? 15 : 19}"/>`); }
      return { atras: `<g fill="${A.base}" stroke="${A.oscuro}" stroke-width="5">${bolas.join('')}</g><g fill="${A.base}">${bolas.join('')}</g>`, dentro: `<path d="${casquete(g, frente(g), { k: 5, prof: 6 })}" fill="${A.base}"/>` };
    }
  },
  tupe: {
    nombre: 'Tupé', c: ['#2B2D42', '#2B2D42'], desc: 'rock and roll, cantantes, elegante, rebelde', pinta(g, A) {
      const { cx, top } = g, w = Math.max(48, g.sombrero.w * .85);
      return { fuera: `<path d="M${P(cx - w * .5, top + 14)}C${P(cx - w * .62, top - 14)} ${P(cx + w * .1, top - 32)} ${P(cx + w * .64, top - 10)}C${P(cx + w * .42, top - 12)} ${P(cx + w * .3, top - 2)} ${P(cx + w * .44, top + 12)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M${P(cx - w * .28, top)}Q${P(cx, top - 18)} ${P(cx + w * .45, top - 10)}" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        dentro: `<path d="${casquete(g, frente(g) - 4, { k: 2, prof: 5 })}" fill="${A.base}"/>` };
    }
  },
  flequillo_lado: {
    nombre: 'Flequillo de lado', c: ['#3D2A1E', '#3D2A1E'], desc: 'anime, música, estudiante, misterioso', pinta(g, A) {
      const yf = frente(g) + 2, { cx, W } = g;
      return { atras: `<path d="${volumen(g, .85, 4)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>`,
        dentro: `<path d="M${P(cx - W, g.top - 60)}H${n(cx + W)}V${n(yf - 16)}Q${P(cx + W * .1, yf - 8)} ${P(cx - W * .28, yf + 16)}L${P(cx - W * .34, yf + 2)}Q${P(cx - W * .5, yf + 8)} ${P(cx - W, yf + 6)}Z" fill="${A.base}"/>` };
    }
  }
});

Object.assign(cabeza, {
  paja: {
    nombre: 'Sombrero de paja', c: ['#F2C14E', '#E2483D'], desc: 'piratas, aventura, campo, verano, playa', pinta(g, A, B) {
      const yb = g.sombrero.y + 6, w = g.sombrero.w * 1.05, h = altoSombrero(g, w * .36), cx = g.cx;
      return `<ellipse cx="${n(cx)}" cy="${n(yb)}" rx="${n(w * .98)}" ry="${n(w * .17)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>
<path d="${domo(cx, yb - 2, w * .8, h)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/>
<path d="M${P(cx - w * .4, yb - 5)}Q${P(cx, yb + 1)} ${P(cx + w * .4, yb - 5)}L${P(cx + w * .39, yb - 13)}Q${P(cx, yb - 7)} ${P(cx - w * .39, yb - 13)}Z" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.4"/>
<path d="M${P(cx - w * .7, yb + 2)}Q${P(cx, yb + 12)} ${P(cx + w * .7, yb + 2)}M${P(cx - w * .3, yb - h * .55)}Q${P(cx, yb - h * .66)} ${P(cx + w * .3, yb - h * .55)}" stroke="${A.oscuro}" stroke-width="1.4" fill="none" opacity=".6"/>`;
    }
  },
  placa: {
    nombre: 'Vincha con placa', c: ['#2B3A67', '#C9CCD8'], desc: 'ninjas, anime, artes marciales, aldeas ocultas', pinta(g, A, B) {
      const y0 = Math.max(g.top + 11, g.ojo.y - g.ojo.r * 2.9), half = g.hw((y0 - g.top) / g.H), x = g.cx + half, w = Math.min(50, half * 1.15);
      return {
        dentro: `<rect x="${n(g.cx - g.W)}" y="${n(y0 - 7)}" width="${n(g.W * 2)}" height="14" fill="${A.base}"/>`,
        fuera: `<rect x="${n(g.cx - w / 2)}" y="${n(y0 - 9)}" width="${n(w)}" height="18" rx="3.5" fill="${B.base}" stroke="${B.oscuro}" stroke-width="2"/><circle cx="${n(g.cx)}" cy="${n(y0)}" r="4.6" fill="none" stroke="${B.oscuro}" stroke-width="2"/><path d="M${P(g.cx - w / 2 + 4, y0 - 5)}h${n(w * .28)}" stroke="#fff" stroke-width="1.8" opacity=".7" stroke-linecap="round"/><g fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.8" stroke-linejoin="round"><path d="M${P(x - 4, y0 - 4)}q16 0 24 12q-9 1 -16 -4z"/><path d="M${P(x - 4, y0 + 1)}q12 8 14 22q-8 -2 -13 -12z"/></g>`
      };
    }
  },
  orejas_largas: {
    nombre: 'Orejas largas', c: ['cuerpo', '#1E1B3A'], desc: 'conejos, zorros, criaturas eléctricas, animales', pinta(g, A, B) {
      const oreja = s => { const b = g.borde(s, -6); return `<g transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot + s * 16)})"><path d="M-11 8C-14 -16 -6 -40 0 -52C6 -40 14 -16 11 8Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M-5.4 -33C-3 -42 -1 -48 0 -52C1 -48 3 -42 5.4 -33Q0 -36 -5.4 -33Z" fill="${B.base}"/></g>`; };
      return { atras: oreja(-.4) + oreja(.4) };
    }
  },
  cuernos: {
    nombre: 'Cuernos', c: ['#F4EBDD', '#C9B8A0'], desc: 'dragones, monstruos, vikingos, criaturas', pinta(g, A, B) {
      const cuerno = s => { const b = g.borde(s, -4); return `<g transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(b.rot)}) scale(${s < 0 ? -1 : 1} 1)"><path d="M-7 5Q-9 -12 8 -26Q3 -10 7 5Z" fill="${A.base}" stroke="${B.oscuro}" stroke-width="2" stroke-linejoin="round"/><path d="M-6 -2Q-1 -4 4 -3M-5 -9Q0 -11 4 -10" stroke="${B.base}" stroke-width="1.6" fill="none"/></g>`; };
      return { atras: cuerno(-.38) + cuerno(.38) };
    }
  },
  gorro_lana: {
    nombre: 'Gorro de lana', c: ['#4BA3FF', '#FFFFFF'], desc: 'invierno, calle, skate, música', pinta(g, A, B) {
      const yb = g.sombrero.y + 8, w = g.sombrero.w * 1.06, h = altoSombrero(g, w * .5), cx = g.cx;
      return `<path d="${domo(cx, yb, w, h)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/><path d="M${P(cx - w * .18, yb - h * .8)}V${n(yb - 10)}M${P(cx + w * .18, yb - h * .8)}V${n(yb - 10)}" stroke="${A.oscuro}" stroke-width="1.6" opacity=".4"/>
<rect x="${n(cx - w * .52)}" y="${n(yb - 12)}" width="${n(w * 1.04)}" height="13" rx="5" fill="${A.oscuro}" stroke="${A.tinta}" stroke-width="2"/><circle cx="${n(cx)}" cy="${n(yb - h - 5)}" r="8" fill="${B.base}" stroke="${B.oscuro}" stroke-width="2"/>`;
    }
  }
});

Object.assign(cara, {
  bigotes: {
    nombre: 'Marcas de bigotes', c: ['#3D2A1E', '#3D2A1E'], desc: 'ninjas, zorros, gatos, criaturas', pinta(g, A) {
      const { y, dx, r: R } = g.ojo;
      return `<g stroke="${A.base}" stroke-width="2.2" stroke-linecap="round" opacity=".8">${[-1, 1].map(l => [0, 1, 2].map(k => { const x0 = g.cx + l * (dx + R * .55), y0 = y + R * (1.15 + k * .45); return `<path d="M${P(x0, y0)}l${n(l * R * 1.2)} ${n((k - 1) * R * .25)}"/>`; }).join('')).join('')}</g>`;
    }
  },
  cicatriz: {
    nombre: 'Cicatriz', c: ['#B5503C', '#B5503C'], desc: 'aventureros, piratas, guerreros, valientes', pinta(g, A) {
      const { y, dx, r: R } = g.ojo, x = g.cx - dx;
      return `<g stroke="${A.base}" stroke-width="2" stroke-linecap="round" opacity=".85"><path d="M${P(x - R * .9, y + R * 1.6)}l${n(R * 1.6)} ${n(R * .55)}"/><path d="M${P(x - R * .5, y + R * 1.45)}l${n(-R * .2)} ${n(R * .45)}M${P(x, y + R * 1.62)}l${n(-R * .2)} ${n(R * .45)}M${P(x + R * .45, y + R * 1.78)}l${n(-R * .2)} ${n(R * .45)}"/></g>`;
    }
  },
  mejillas: {
    nombre: 'Mejillas de color', c: ['#FF4D4D', '#FF4D4D'], desc: 'criaturas eléctricas, mascotas, payasos', pinta(g, A) {
      const { y, dx, r: R } = g.ojo;
      return [-1, 1].map(l => `<circle cx="${n(g.cx + l * (dx + R * 1.3))}" cy="${n(y + R * 1.15)}" r="${n(R * .85)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.5"/>`).join('');
    }
  }
});

Object.assign(cuerpo, {
  gi: {
    nombre: 'Traje de artes marciales', c: ['#FF8A1E', '#2E5BD9'], desc: 'anime de peleas, karate, kung fu, guerreros', pinta(g, A, B) {
      const y0 = g.cuello.y - 2, cx = g.cx, yc = y0 + (g.piso - y0) * .52;
      return `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/>
<path d="M${P(cx - 17, y0 - 3)}L${P(cx + 3, yc - 3)}L${P(cx + 19, y0 - 4)}Z" fill="${B.base}"/>
<path d="M${P(cx - 19, y0 - 4)}L${P(cx + 6, yc - 1)}M${P(cx + 19, y0 - 4)}L${P(cx - 1, yc - 9)}" stroke="${A.oscuro}" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="${n(cx - g.W)}" y="${n(yc)}" width="${n(g.W * 2)}" height="10" fill="${B.base}"/><path d="M${P(cx - g.W, yc)}H${n(cx + g.W)}M${P(cx - g.W, yc + 10)}H${n(cx + g.W)}" stroke="${B.oscuro}" stroke-width="1.6"/>
<path d="M${P(cx + 3, yc + 8)}l-5 16l7 1.5l3 -16zM${P(cx + 9, yc + 8)}l5 14l6 -2.5l-6 -12z" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.4" stroke-linejoin="round"/>
<circle cx="${n(cx - g.W * .24)}" cy="${n(y0 + 13)}" r="7" fill="#fff" stroke="${A.oscuro}" stroke-width="1.5"/><circle cx="${n(cx - g.W * .24)}" cy="${n(y0 + 13)}" r="2.8" fill="${A.oscuro}"/>`;
    }
  },
  chaqueta: {
    nombre: 'Chaqueta abierta', c: ['#FF8A1E', '#1E1B3A'], desc: 'anime, ninjas, piratas, calle, aventura', pinta(g, A, B) {
      const y0 = g.cuello.y - 4, cx = g.cx;
      const panel = k => `<path d="M${P(cx - k * g.W, y0 - 6)}H${n(cx - k * 7)}L${P(cx - k * 12, g.piso + 20)}H${n(cx - k * g.W)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/>`;
      return `<rect x="${n(cx - g.W)}" y="${n(y0 - 6)}" width="${n(g.W * 2)}" height="${n(g.piso - y0 + 30)}" fill="${B.base}"/>${panel(1)}${panel(-1)}<path d="M${P(cx - 7, y0 - 6)}L${P(cx - 20, y0 + 10)}M${P(cx + 7, y0 - 6)}L${P(cx + 20, y0 + 10)}" stroke="${A.oscuro}" stroke-width="3" stroke-linecap="round"/>`;
    }
  },
  camiseta_rayas: {
    nombre: 'Camiseta a rayas', c: ['#75AADB', '#FFFFFF'], desc: 'fútbol, selección, hinchas, equipos con rayas', pinta(g, A, B, o) {
      const y0 = g.cuello.y + 2, cx = g.cx, alto = g.piso - y0; let s = `<path d="M${P(cx - g.W, y0 - 8)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 8)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${B.base}"/>`;
      for (let x = cx - 6.5 - 26 * 3; x < cx + g.W; x += 26) s += `<rect x="${n(x)}" y="${n(y0 - 12)}" width="13" height="${n(alto + 34)}" fill="${A.base}"/>`;
      return `<clipPath id="cr${Math.round(y0)}"><path d="M${P(cx - g.W, y0 - 8)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 8)}V${n(g.piso + 20)}H${n(cx - g.W)}Z"/></clipPath><g clip-path="url(#cr${Math.round(y0)})">${s}</g>
<path d="M${P(cx - g.W, y0 - 8)}Q${P(cx, y0 + 6)} ${P(cx + g.W, y0 - 8)}" stroke="#1E1B3A" stroke-width="2.5" fill="none" opacity=".5"/>
<text x="${n(cx)}" y="${n(y0 + alto * .62)}" font-size="${n(lim(alto * .4, 16, 30))}" font-weight="800" font-family="'Bricolage Grotesque', 'Nunito', sans-serif" text-anchor="middle" fill="#1E1B3A" stroke="#fff" stroke-width="3" paint-order="stroke">${o.numero || 10}</text>`;
    }
  },
  heroe: {
    nombre: 'Traje de superhéroe', c: ['#E2483D', '#FFC83D'], desc: 'superhéroes, cómics, poderes, salvar el mundo', pinta(g, A, B) {
      const y0 = g.cuello.y - 2, cx = g.cx, yc = y0 + (g.piso - y0) * .62;
      return `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/>
<rect x="${n(cx - g.W)}" y="${n(yc)}" width="${n(g.W * 2)}" height="8" fill="${B.base}"/><rect x="${n(cx - 6)}" y="${n(yc - 1.5)}" width="12" height="11" rx="2" fill="${B.oscuro}"/>
<path d="M${P(cx - 14, y0 + 4)}H${n(cx + 14)}L${P(cx + 10, y0 + 18)}L${P(cx, y0 + 27)}L${P(cx - 10, y0 + 18)}Z" fill="${B.base}" stroke="${B.oscuro}" stroke-width="1.8" stroke-linejoin="round"/><path d="${estrella(cx, y0 + 14, 6)}" fill="${A.base}"/>`;
    }
  },
  kimono: {
    nombre: 'Kimono a cuadros', c: ['#2E9E5B', '#1E1B3A'], desc: 'Japón, samuráis, cazadores de demonios, espadachines', pinta(g, A, B) {
      const y0 = g.cuello.y - 2, cx = g.cx, yc = y0 + (g.piso - y0) * .55, tam = 11; let s = '';
      for (let y = y0 - 8, j = 0; y < g.piso + 14; y += tam, j++) for (let x = cx - g.W, i = 0; x < cx + g.W; x += tam, i++) if ((i + j) % 2) s += `<rect x="${n(x)}" y="${n(y)}" width="${tam}" height="${tam}"/>`;
      return `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/><clipPath id="km${Math.round(y0)}"><path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z"/></clipPath><g clip-path="url(#km${Math.round(y0)})" fill="${B.base}">${s}</g>
<path d="M${P(cx - 16, y0 - 3)}L${P(cx + 4, yc)}M${P(cx + 16, y0 - 3)}L${P(cx - 2, yc - 6)}" stroke="#F4F5FA" stroke-width="6" stroke-linecap="round" fill="none"/>
<rect x="${n(cx - g.W)}" y="${n(yc)}" width="${n(g.W * 2)}" height="11" fill="#F4F5FA"/><path d="M${P(cx - g.W, yc + 5.5)}H${n(cx + g.W)}" stroke="${A.oscuro}" stroke-width="1.5" opacity=".5"/>`;
    }
  },
  sudadera: {
    nombre: 'Sudadera con capucha', c: ['#6C63FF', '#FFFFFF'], desc: 'calle, gamers, programación, skate, música', pinta(g, A, B) {
      const y0 = g.cuello.y - 2, cx = g.cx, yb = y0 + (g.piso - y0) * .5;
      return { dentro: `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/>
<path d="M${P(cx - 22, yb)}H${n(cx + 22)}L${P(cx + 27, yb + 22)}H${n(cx - 27)}Z" fill="none" stroke="${A.oscuro}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M${P(cx - 7, y0 - 1)}v18M${P(cx + 7, y0 - 1)}v14" stroke="${B.base}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${n(cx - 7)}" cy="${n(y0 + 18)}" r="2.2" fill="${B.base}"/><circle cx="${n(cx + 7)}" cy="${n(y0 + 14)}" r="2.2" fill="${B.base}"/>`,
        atras: `<path d="${volumen(g, .95, 9)}" fill="${A.oscuro}" stroke="${A.tinta}" stroke-width="${SW}"/>` };
    }
  },
  vestido: {
    nombre: 'Vestido', c: ['#FF6FB1', '#FFFFFF'], desc: 'princesas, baile, fiesta, cuentos', pinta(g, A, B) {
      const y0 = g.cuello.y + 2, cx = g.cx, tw = (y0 + 16 - g.top) / g.H, yw = y0 + 16, hw = g.hw(tw);
      return { dentro: `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/><path d="M${P(cx - 12, y0 - 2)}Q${P(cx, y0 + 6)} ${P(cx + 12, y0 - 2)}" stroke="${B.base}" stroke-width="3" fill="none"/>`,
        fuera: `<path d="M${P(cx - hw + 2, yw)}C${P(cx - hw - 6, yw + 20)} ${P(cx - g.W * .66, g.piso - 14)} ${P(cx - g.W * .64, g.piso - 2)}Q${P(cx, g.piso + 10)} ${P(cx + g.W * .64, g.piso - 2)}C${P(cx + g.W * .66, g.piso - 14)} ${P(cx + hw + 6, yw + 20)} ${P(cx + hw - 2, yw)}Q${P(cx, yw + 6)} ${P(cx - hw + 2, yw)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/>
<path d="M${P(cx - g.W * .62, g.piso - 4)}Q${P(cx, g.piso + 7)} ${P(cx + g.W * .62, g.piso - 4)}" stroke="${B.base}" stroke-width="3.5" fill="none" stroke-dasharray="2 5" stroke-linecap="round"/>` };
    }
  },
  uniforme: {
    nombre: 'Uniforme marinero', c: ['#FFFFFF', '#2B3A67'], desc: 'escuela, anime escolar, marinos', pinta(g, A, B) {
      const y0 = g.cuello.y - 2, cx = g.cx;
      return `<path d="M${P(cx - g.W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + g.W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - g.W)}Z" fill="${A.base}"/>
<path d="M${P(cx - g.W, y0 - 7)}H${n(cx + g.W)}V${n(y0 + 6)}H${n(cx + 22)}L${P(cx, y0 + 22)}L${P(cx - 22, y0 + 6)}H${n(cx - g.W)}Z" fill="${B.base}"/><path d="M${P(cx - g.W, y0 + 2)}H${n(cx - 19)}L${P(cx, y0 + 17)}L${P(cx + 19, y0 + 2)}H${n(cx + g.W)}" stroke="#fff" stroke-width="1.8" fill="none"/>
<path d="M${P(cx, y0 + 20)}l-9 -6l-2 9zM${P(cx, y0 + 20)}l9 -6l2 9z" fill="#E2483D" stroke="#B5323A" stroke-width="1.2" stroke-linejoin="round"/><path d="M${P(cx - 2, y0 + 21)}l-4 13M${P(cx + 2, y0 + 21)}l4 13" stroke="#E2483D" stroke-width="4" stroke-linecap="round"/>`;
    }
  }
});

const brazos = {
  munequeras: { nombre: 'Muñequeras', c: ['#2E5BD9', '#FFFFFF'], desc: 'anime de peleas, deporte, tenis, básquet', pinta(g, A) { const { L, w } = g.brazo; return `<rect x="${n(-w / 2 - 1.5)}" y="${n(L * .56)}" width="${n(w + 3)}" height="${n(L * .2)}" rx="3" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/>`; } },
  guantes: { nombre: 'Guantes de box', c: ['#E2483D', '#FFFFFF'], desc: 'boxeo, peleas, deporte, fuerza', pinta(g, A, B) { const { L, w } = g.brazo; return `<rect x="${n(-w * .55)}" y="${n(L * .48)}" width="${n(w * 1.1)}" height="${n(L * .16)}" rx="2" fill="${B.base}" stroke="${A.oscuro}" stroke-width="1.6"/><ellipse cx="0" cy="${n(L * .82)}" rx="${n(w * .68)}" ry="${n(L * .3)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2.4"/><path d="M${P(-w * .25, L * .72)}q${n(w * .25)} -3 ${n(w * .42)} 2" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/>`; } },
  garras: { nombre: 'Garras', c: ['#FFFFFF', '#C9CCD8'], desc: 'animales, dragones, monstruos, felinos', pinta(g, A) { const { L, w } = g.brazo; return [-1, 0, 1].map(k => `<path d="M${P(k * w * .26 - 2.6, L * .88)}L${P(k * w * .3, L * 1.07)}L${P(k * w * .26 + 2.6, L * .88)}Z" fill="${A.base}" stroke="#9EA3BA" stroke-width="1.2" stroke-linejoin="round"/>`).join(''); } },
  mangas: { nombre: 'Mangas', c: ['#2E5BD9', '#FFFFFF'], desc: 'chaquetas, uniformes, trajes, ropa de invierno', pinta(g, A, B) { const { L, w } = g.brazo; return `<path d="M${P(-w / 2 - .5, L * .02)}V${n(L * .58)}H${n(w / 2 + .5)}V${n(L * .02)}Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="2"/><rect x="${n(-w / 2 - 1)}" y="${n(L * .56)}" width="${n(w + 2)}" height="4" rx="2" fill="${B.base}"/>`; } }
};

Object.assign(espalda, {
  cola_rayo: {
    nombre: 'Cola de rayo', c: ['cuerpo', '#8B5A2B'], desc: 'criaturas eléctricas, rayos, energía, mascotas', pinta(g, A, B) {
      const x = g.cx + g.hw(.78) * .72, y = g.y(.78);
      return `<g transform="translate(${n(x)} ${n(y)})"><g class="apr-menea"><path d="M0 0L14 -6L8 -18L26 -26L20 -40L46 -54L35 -31L42 -26L22 -13L28 -7L6 7Z" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M0 0L14 -6L11 -12L3 1Z" fill="${B.base}"/></g></g>`;
    }
  },
  caparazon: {
    nombre: 'Caparazón', c: ['#5E9E2C', '#E9D7A8'], desc: 'tortugas, dragones, armadura natural, mar', pinta(g, A, B) {
      const cy = g.y(.58), rx = g.W * .6, ry = g.H * .42;
      return `<ellipse cx="${g.cx}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${A.base}" stroke="${A.oscuro}" stroke-width="${SW}"/><ellipse cx="${g.cx}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="${B.base}" stroke-width="5" stroke-dasharray="14 8"/>`;
    }
  },
  espada_espalda: {
    nombre: 'Espada en la espalda', c: ['#DDE3EE', '#1E1B3A'], desc: 'samuráis, cazadores, espadachines, aventuras', pinta(g, A, B) {
      const x0 = g.cx - g.W * .44, y0 = g.piso - 16, x1 = g.cx + g.W * .5, y1 = g.top + 4, ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, L = Math.hypot(x1 - x0, y1 - y0);
      return `<g transform="translate(${n(x0)} ${n(y0)}) rotate(${n(ang)})"><rect x="0" y="-4" width="${n(L - 22)}" height="8" rx="2" fill="${A.base}" stroke="${A.oscuro}" stroke-width="1.6"/><rect x="${n(L - 25)}" y="-9" width="5" height="18" rx="2" fill="#FFC83D" stroke="#C99A1E" stroke-width="1"/><rect x="${n(L - 20)}" y="-4.5" width="24" height="9" rx="3" fill="${B.base}"/><path d="M${n(L - 18)} -4l4 8m4 -8l4 8m4 -8l4 8" stroke="#fff" stroke-width="1.2" opacity=".7"/></g>`;
    }
  }
});

// Peinado a medida: la IA describe la silueta (mechones y flequillo) y este código la dibuja.
const PEINADO_BASE = { tapa: .9, mechones: [{ pos: -.95, largo: 30, ancho: 20, dir: -105 }, { pos: -.65, largo: 46, ancho: 24, dir: -68 }, { pos: -.3, largo: 58, ancho: 26, dir: -32 }, { pos: .05, largo: 50, ancho: 22, dir: -4 }, { pos: .4, largo: 60, ancho: 26, dir: 28 }, { pos: .75, largo: 46, ancho: 24, dir: 62 }, { pos: 1, largo: 30, ancho: 20, dir: 100 }], flequillo: [{ x: -.5, largo: 20, ancho: 16, giro: -12 }, { x: -.1, largo: 14, ancho: 14, giro: 4 }, { x: .32, largo: 24, ancho: 16, giro: 14 }] };
function pintarPeinado(g, A, B, pe) {
  const p = pe || PEINADO_BASE, tapa = lim(p.tapa ?? .8, 0, 1), yf = g.top + (frente(g) + 6 - g.top) * tapa;
  const grosor = 4 + tapa * 9;
  // masa de pelo: sobresale del borde de la cabeza y de ella salen las puntas
  const masa = `<path d="${volumen(g, .55 + tapa * .5, grosor)}"/>`;
  const puntas = p.mechones.map(m => {
    const b = g.borde(m.pos, grosor - 6), L = m.largo * 1.08, w = m.ancho * .72, c = m.curva || 0;
    return `<path transform="translate(${n(b.x)} ${n(b.y)}) rotate(${n(m.dir)})" d="M${n(-w)} 12Q${n(-w * .3 + c * w)} ${n(-L * .45)} ${n(c * L * .32)} ${n(-L)}Q${n(w * .3 + c * w)} ${n(-L * .45)} ${n(w)} 12Z"/>`;
  }).join('');
  const half = g.hw((yf - g.top) / g.H), y0 = yf - 14, tope = g.ojo.y - g.ojo.r * 1.9;
  const mechones = p.flequillo.map(f => {
    const X = g.cx + f.x * half * .85, w = f.ancho * .62, L = Math.max(6, Math.min(f.largo + 12, tope - y0)), tx = X + Math.tan(f.giro * Math.PI / 180) * L * .7;
    return `<path d="M${P(X - w, y0)}Q${P(X - w * .45, y0 + L * .55)} ${P(tx, y0 + L)}Q${P(X + w * .45, y0 + L * .55)} ${P(X + w, y0)}Z"/>`;
  }).join('');
  // tapa el contorno del cuerpo donde lo cubre el pelo
  const mitad = Math.floor(g.contorno.length / 2), arriba = (a, b) => g.contorno.slice(a, b).filter(([, y]) => y < yf - 3);
  const borde = [...arriba(mitad, g.contorno.length), ...arriba(0, mitad)];
  const tapaBorde = borde.length > 2 ? `<path d="${curvaAbierta(borde)}" fill="none" stroke="${A.base}" stroke-width="5" stroke-linecap="round"/>` : '';
  return {
    fuera: tapaBorde,
    atras: `<g fill="${A.base}" stroke="${A.tinta}" stroke-width="${SW}" stroke-linejoin="round">${puntas}${masa}</g><g fill="${A.base}">${puntas}</g>`,
    dentro: `<path d="${casquete(g, yf - 4, { k: 1, prof: 0 })}" fill="${A.base}"/><g fill="${A.base}">${mechones}</g><path d="M${P(g.cx - half * .55, g.top + (yf - g.top) * .35)}q${n(half * .25)} -5 ${n(half * .5)} -2" stroke="#fff" stroke-opacity=".22" stroke-width="3" fill="none" stroke-linecap="round"/>`
  };
}
Object.assign(pelo, {
  peinado: { nombre: 'Peinado a medida', c: ['#1E1B3A', '#1E1B3A'], desc: 'el peinado que diseñaste en el campo peinado (copia la silueta del personaje)', pinta(g, A, B, o) { return pintarPeinado(g, A, B, o.look?.peinado); } },
  peinado_final: { nombre: 'Peinado transformado', c: ['#FFD83D', '#FFF3A0'], desc: 'el peinado de transformación que diseñaste en peinado_final', pinta(g, A, B, o) { return pintarPeinado(g, A, B, o.look?.peinado_final || o.look?.peinado); } }
});

// Traje a medida: la IA describe la ropa del personaje (colores, cuello, cinturón, estampado, emblema) y este código la dibuja.
export const CUELLOS = ['redondo', 'v', 'cruzado', 'alto', 'abierto', 'marinero', 'ninguno'];
export const ESTAMPADOS = ['ninguno', 'horizontales', 'verticales', 'cuadros', 'diagonal'];
export const EMBLEMAS = ['ninguno', 'circulo', 'estrella', 'rayo', 'escudo', 'corazon', 'luna', 'gota'];
function emblema(tipo, x, y, r, c, borde) {
  const st = `fill="${c}" stroke="${borde}" stroke-width="1.4" stroke-linejoin="round"`;
  if (tipo === 'circulo') return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${st}/>`;
  if (tipo === 'estrella') return `<path d="${estrella(x, y, r * 1.15)}" ${st}/>`;
  if (tipo === 'rayo') return `<path d="M${P(x + r * .3, y - r * 1.2)}L${P(x - r * .7, y + r * .15)}H${n(x)}L${P(x - r * .3, y + r * 1.2)}L${P(x + r * .7, y - r * .15)}H${n(x)}Z" ${st}/>`;
  if (tipo === 'escudo') return `<path d="M${P(x - r, y - r)}H${n(x + r)}V${n(y)}Q${P(x + r, y + r * .8)} ${P(x, y + r * 1.2)}Q${P(x - r, y + r * .8)} ${P(x - r, y)}Z" ${st}/>`;
  if (tipo === 'corazon') return `<path d="M${P(x, y + r)}C${P(x - r * 1.6, y)} ${P(x - r * .9, y - r * 1.3)} ${P(x, y - r * .4)}C${P(x + r * .9, y - r * 1.3)} ${P(x + r * 1.6, y)} ${P(x, y + r)}Z" ${st}/>`;
  if (tipo === 'luna') return `<path d="M${P(x + r * .4, y - r)}A${n(r)} ${n(r)} 0 1 0 ${P(x + r * .4, y + r)}A${n(r * .75)} ${n(r * .75)} 0 1 1 ${P(x + r * .4, y - r)}Z" ${st}/>`;
  if (tipo === 'gota') return `<path d="M${P(x, y - r * 1.2)}C${P(x + r, y)} ${P(x + r, y + r)} ${P(x, y + r)}C${P(x - r, y + r)} ${P(x - r, y)} ${P(x, y - r * 1.2)}Z" ${st}/>`;
  return '';
}
function pintarTraje(g, A, B, o) {
  const tr = o.look?.traje || {}, cx = g.cx, W = g.W, y0 = g.cuello.y - 2, alto = g.piso - y0;
  const arriba = tonos(tr.arriba || A.base), interior = tr.interior ? tonos(tr.interior) : o.cuerpo, cint = tr.cinturon ? tonos(tr.cinturon) : null;
  const yCint = y0 + alto * .58, yAbajo = cint ? yCint + 9 : y0 + alto * .62;
  const region = `M${P(cx - W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + W, y0 - 6)}V${n(g.piso + 20)}H${n(cx - W)}Z`, id = `tr${Math.round(y0)}${tr.cuello || ''}`;
  let s = `<path d="${region}" fill="${arriba.base}"/>`;
  // estampado
  const ec = tr.estampadoColor ? tonos(tr.estampadoColor).base : arriba.oscuro; let est = '';
  if (tr.estampado === 'horizontales') for (let y = y0 + 4; y < g.piso + 10; y += 13) est += `<rect x="${n(cx - W)}" y="${n(y)}" width="${n(W * 2)}" height="6.5"/>`;
  if (tr.estampado === 'verticales') for (let x = cx - 6.5 - 26 * 3; x < cx + W; x += 26) est += `<rect x="${n(x)}" y="${n(y0 - 12)}" width="13" height="${n(alto + 34)}"/>`;
  if (tr.estampado === 'cuadros') for (let y = y0 - 8, j = 0; y < g.piso + 14; y += 11, j++) for (let x = cx - W, i = 0; x < cx + W; x += 11, i++) if ((i + j) % 2) est += `<rect x="${n(x)}" y="${n(y)}" width="11" height="11"/>`;
  if (tr.estampado === 'diagonal') est += `<path d="M${P(cx - W * .5, y0 - 8)}L${P(cx + W * .3, g.piso + 20)}" stroke="${ec}" stroke-width="12"/>`;
  if (est) s += `<clipPath id="${id}"><path d="${region}"/></clipPath><g clip-path="url(#${id})" fill="${ec}">${est}</g>`;
  // parte de abajo (pantalón, falda)
  if (tr.abajo) s += `<rect x="${n(cx - W)}" y="${n(yAbajo)}" width="${n(W * 2)}" height="${n(g.piso - yAbajo + 20)}" fill="${tonos(tr.abajo).base}"/><path d="M${P(cx, yAbajo + 4)}V${n(g.piso + 10)}" stroke="${tonos(tr.abajo).oscuro}" stroke-width="1.6"/>`;
  // cuello
  const ci = interior.base, linea = arriba.oscuro;
  if (tr.cuello === 'redondo') s += `<path d="M${P(cx - W, y0 - 6)}Q${P(cx, y0 + 4)} ${P(cx + W, y0 - 6)}" stroke="${linea}" stroke-width="4" fill="none"/>`;
  if (tr.cuello === 'v') s += `<path d="M${P(cx - 15, y0 - 3)}L${P(cx, y0 + 17)}L${P(cx + 15, y0 - 3)}Z" fill="${ci}" stroke="${linea}" stroke-width="2.4" stroke-linejoin="round"/>`;
  if (tr.cuello === 'cruzado') s += `<path d="M${P(cx - 17, y0 - 3)}L${P(cx + 3, y0 + alto * .5)}L${P(cx + 19, y0 - 4)}Z" fill="${ci}"/><path d="M${P(cx - 19, y0 - 4)}L${P(cx + 6, y0 + alto * .52)}M${P(cx + 19, y0 - 4)}L${P(cx - 1, y0 + alto * .45)}" stroke="${linea}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (tr.cuello === 'alto') s += `<path d="M${P(cx - W, y0 - 7)}Q${P(cx, y0 + 3)} ${P(cx + W, y0 - 7)}V${n(y0 + 5)}Q${P(cx, y0 + 15)} ${P(cx - W, y0 + 5)}Z" fill="${ci}"/>`;
  if (tr.cuello === 'abierto') s += `<path d="M${P(cx - 9, y0 - 6)}L${P(cx - 13, g.piso + 20)}H${n(cx + 13)}L${P(cx + 9, y0 - 6)}Z" fill="${ci}"/><path d="M${P(cx - 9, y0 - 6)}L${P(cx - 13, g.piso + 20)}M${P(cx + 9, y0 - 6)}L${P(cx + 13, g.piso + 20)}M${P(cx - 9, y0 - 6)}L${P(cx - 21, y0 + 10)}M${P(cx + 9, y0 - 6)}L${P(cx + 21, y0 + 10)}" stroke="${linea}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (tr.cuello === 'marinero') s += `<path d="M${P(cx - W, y0 - 7)}H${n(cx + W)}V${n(y0 + 6)}H${n(cx + 22)}L${P(cx, y0 + 22)}L${P(cx - 22, y0 + 6)}H${n(cx - W)}Z" fill="${ci}"/><path d="M${P(cx - W, y0 + 2)}H${n(cx - 19)}L${P(cx, y0 + 17)}L${P(cx + 19, y0 + 2)}H${n(cx + W)}" stroke="#fff" stroke-width="1.8" fill="none"/>`;
  // cinturón
  if (cint) s += `<rect x="${n(cx - W)}" y="${n(yCint)}" width="${n(W * 2)}" height="9" fill="${cint.base}"/><path d="M${P(cx - W, yCint)}H${n(cx + W)}M${P(cx - W, yCint + 9)}H${n(cx + W)}" stroke="${cint.oscuro}" stroke-width="1.4"/><path d="M${P(cx + 4, yCint + 7)}l-4 13l7 1l3 -13zM${P(cx + 9, yCint + 7)}l5 11l6 -2l-6 -10z" fill="${cint.base}" stroke="${cint.oscuro}" stroke-width="1.2" stroke-linejoin="round"/>`;
  // emblema y número
  if (tr.emblema && tr.emblema !== 'ninguno') { const izq = tr.emblemaPos === 'izquierda'; s += emblema(tr.emblema, izq ? cx - W * .24 : cx, y0 + (izq ? 13 : alto * .3), izq ? 6.5 : 9, tonos(tr.emblemaColor || '#FFFFFF').base, '#1E1B3A'); }
  if (o.numero) s += `<text x="${n(cx)}" y="${n(y0 + alto * .66)}" font-size="${n(lim(alto * .38, 16, 28))}" font-weight="800" font-family="'Bricolage Grotesque', 'Nunito', sans-serif" text-anchor="middle" fill="${tonos(tr.emblemaColor || '#1E1B3A').base}" stroke="#fff" stroke-width="3" paint-order="stroke">${o.numero}</text>`;
  return s;
}
cuerpo.traje = { nombre: 'Traje a medida', c: ['#FF8A1E', '#2E5BD9'], desc: 'la ropa que diseñaste en el campo traje (copia la ropa del personaje)', pinta: (g, A, B, o) => pintarTraje(g, A, B, o) };

aura.super = { nombre: 'Aura dorada', c: ['#FFD83D', '#FFF7C2'], desc: 'transformación, poder máximo, anime de peleas', pinta(g, A, B) { return aura.fuego.pinta(g, A, B) + aura.rayos.pinta(g, tonos('#FFFFFF'), tonos('#FFB000')); } };

export const PIEZAS = { cabeza, pelo, cara, cuello, cuerpo, brazos, espalda, mano, aura };

// Lista compacta para la IA: zona → [{ id, nombre, para }]
export const CATALOGO = Object.fromEntries(Object.entries(PIEZAS).map(([slot, ps]) => [slot, Object.entries(ps).map(([id, p]) => ({ id, nombre: p.nombre, para: p.desc }))]));

// Dibuja una pieza y devuelve sus capas: { atras, dentro, fuera, cara, cuello, espalda, aura, mano }
export function pintarPieza(slot, pz, g, tCuerpo, look) {
  // las piezas «a medida» leen sus formas del look
  const def = PIEZAS[slot]?.[pz.id]; if (!def) return {};
  const [c1, c2] = pz.colores.map(c => c === 'cuerpo' ? tCuerpo : tonos(c));
  let r;
  try { r = def.pinta(g, c1, c2, { numero: look.numero, cuerpo: tCuerpo, look }); } catch (e) { console.warn('pieza', slot, pz.id, e); return {}; }
  return typeof r === 'string' ? { [CAPA[slot]]: r } : r;
}
