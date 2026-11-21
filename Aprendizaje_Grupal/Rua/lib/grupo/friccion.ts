// Zonas de fricción (reglas 10 a 12). Funciones puras.

/** Regla 10: un retroceso es un salto hacia atrás de 5 s o más. */
export const RETROCESO_MIN_S = 5;
/** Regla 11 (*): ventanas de 30 s. */
export const VENTANA_S = 30;
/** Regla 11: integrantes distintos que deben retroceder a una ventana para marcarla. */
export const INTEGRANTES_ZONA = 2;

export function esRetroceso(desde: number, hasta: number): boolean {
  return desde - hasta >= RETROCESO_MIN_S;
}

export function ventanaDe(segundo: number): number {
  return Math.floor(Math.max(0, segundo) / VENTANA_S) * VENTANA_S;
}

export type Retroceso = { userId: string; ventanaInicio: number };

export type Ventana = {
  ventanaInicio: number;
  ventanaFin: number;
  retrocesos: number;
  integrantes: number;
  esZona: boolean;
};

/** Agrupa retrocesos por ventana. Regla 12: la etiqueta muestra total y rango. */
export function calcularVentanas(retrocesos: Retroceso[]): Ventana[] {
  const mapa = new Map<number, { total: number; usuarios: Set<string> }>();
  for (const r of retrocesos) {
    const v = mapa.get(r.ventanaInicio) ?? { total: 0, usuarios: new Set<string>() };
    v.total += 1;
    v.usuarios.add(r.userId);
    mapa.set(r.ventanaInicio, v);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a - b)
    .map(([inicio, v]) => ({
      ventanaInicio: inicio,
      ventanaFin: inicio + VENTANA_S,
      retrocesos: v.total,
      integrantes: v.usuarios.size,
      esZona: v.usuarios.size >= INTEGRANTES_ZONA,
    }));
}
