// Sincronía elástica (reglas 5 a 9). Funciones puras: las usa el cliente con los datos
// de Presence, y el servidor si alguna vez necesita el mismo cálculo.

import type { EstadoIntegrante } from "@/lib/realtime/sala";

/** Regla 6 (*): umbral de desfase respecto a la mediana del resto. */
export const UMBRAL_DESFASE_S = 30;

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export type PosicionIntegrante = { userId: string; posicion: number };

export type SincroniaIntegrante = {
  userId: string;
  posicion: number;
  medianaResto: number | null;
  /** Positivo: va adelantado. Negativo: va atrasado. */
  diferencia: number;
  desfasado: boolean;
};

/** Reglas 6 y 9: desfase de cada integrante contra la mediana del resto. */
export function calcularSincronia(integrantes: PosicionIntegrante[]): {
  integrantes: SincroniaIntegrante[];
  sincronizados: number;
  total: number;
} {
  const resultado = integrantes.map((yo) => {
    const resto = integrantes.filter((o) => o.userId !== yo.userId).map((o) => o.posicion);
    const med = mediana(resto);
    const diferencia = med === null ? 0 : yo.posicion - med;
    return {
      userId: yo.userId,
      posicion: yo.posicion,
      medianaResto: med,
      diferencia,
      desfasado: Math.abs(diferencia) > UMBRAL_DESFASE_S,
    };
  });
  return {
    integrantes: resultado,
    sincronizados: resultado.filter((r) => !r.desfasado).length,
    total: resultado.length,
  };
}

export type CausaDesfase = "tomando_notas" | "en_pausa" | "repasando" | "conversando" | null;

/** Regla 7 (*): causa que se muestra en el aviso ámbar, derivada del estado del cliente. */
export function causaDesfase(estado: Pick<EstadoIntegrante, "estado" | "cuadernoActivo" | "pausaPorVoz" | "retrocedio">): CausaDesfase {
  if (estado.pausaPorVoz || estado.estado === "hablando") return "conversando";
  if (estado.cuadernoActivo || estado.estado === "escribiendo") return "tomando_notas";
  if (estado.retrocedio) return "repasando";
  if (estado.estado === "pausado") return "en_pausa";
  return null;
}

/**
 * Regla 8 (*): "Esperarlo" pausa solo mi video. Se reanuda cuando la persona esperada
 * alcanza mi posición (o yo reanudo a mano, que lo maneja el reproductor).
 */
export function esperaCumplida(miPosicion: number, posicionEsperada: number): boolean {
  return posicionEsperada >= miPosicion;
}
