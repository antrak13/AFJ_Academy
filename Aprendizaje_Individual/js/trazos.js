// Trazos compartidos por el personaje y el vestuario: redondeo, curvas suaves y figuras.

export const n = v => Math.round(v * 10) / 10;
export const P = (x, y) => `${n(x)} ${n(y)}`;
export const lim = (v, a, b) => Math.min(b, Math.max(a, v));

// Curva suave cerrada que pasa por todos los puntos (Catmull-Rom convertida a Bézier).
export function curvaCerrada(pts) {
  const k = pts.length; let d = `M${P(pts[0][0], pts[0][1])}`;
  for (let i = 0; i < k; i++) {
    const p0 = pts[(i - 1 + k) % k], p1 = pts[i], p2 = pts[(i + 1) % k], p3 = pts[(i + 2) % k];
    d += `C${P(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${P(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${P(p2[0], p2[1])}`;
  }
  return d + 'Z';
}

// Curva suave abierta (cuadráticas por los puntos medios). conM=false la continúa con una línea.
export function curvaAbierta(pts, conM = true) {
  let d = `${conM ? 'M' : 'L'}${P(pts[0][0], pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [x2, y2] = pts[i + 1];
    d += `Q${P(x, y)} ${P((x + x2) / 2, (y + y2) / 2)}`;
  }
  const u = pts[pts.length - 1];
  return d + `L${P(u[0], u[1])}`;
}

// Estrella de `puntas` puntas centrada en (x, y); int = radio interior relativo.
export function estrella(x, y, r, puntas = 5, int = .45) {
  let d = '';
  for (let i = 0; i < puntas * 2; i++) {
    const a = Math.PI * i / puntas - Math.PI / 2, rr = i % 2 ? r * int : r;
    d += `${i ? 'L' : 'M'}${P(x + Math.cos(a) * rr, y + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

// Polígono regular.
export function poligono(x, y, r, lados, giro = -Math.PI / 2) {
  let d = '';
  for (let i = 0; i < lados; i++) { const a = giro + 2 * Math.PI * i / lados; d += `${i ? 'L' : 'M'}${P(x + Math.cos(a) * r, y + Math.sin(a) * r)}`; }
  return d + 'Z';
}

// Ruido determinista en [0, 1): el mismo punto siempre da el mismo valor.
export const ruido = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
