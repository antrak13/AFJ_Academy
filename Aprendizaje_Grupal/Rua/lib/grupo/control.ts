// Puntos de control y debate (reglas 17 a 23). Funciones puras; la persistencia está
// en rondas.ts. El servidor es la autoridad sobre fases y tiempos.

import { z } from "zod";

/** Regla 20 (*): se revela a los 120 s del primer voto aunque falten votos. */
export const REVELAR_TRAS_MS = 120_000;
/** Regla 21: duración del debate. */
export const DEBATE_MS = 90_000;
/** Regla 23: peso de la observación más reciente en el dominio (regla 28, *). */
export const ALFA_DOMINIO = 0.3;
export const DOMINIO_INICIAL = 0.5;

/** Regla 17: un punto de control tiene segundo, pregunta, 2 a 4 opciones, correcta y explicación. */
export const esquemaCheckpoint = z
  .object({
    segundo: z.number().int().min(0),
    pregunta: z.string().trim().min(3).max(500),
    opciones: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
    correcta: z.number().int().min(0).max(3),
    explicacion: z.string().trim().min(1).max(1000),
    concept_id: z.string().uuid().nullable().optional(),
  })
  .refine((c) => c.correcta < c.opciones.length, {
    message: "correcta debe ser un índice de opciones",
    path: ["correcta"],
  });
export type CheckpointEntrada = z.infer<typeof esquemaCheckpoint>;

export type Fase = "votacion" | "debate" | "cerrada";
export type Resultado = "combo_perfecto" | "unanime_incorrecta" | "debate" | "sin_votos";

export type Ronda = {
  id: string;
  fase: Fase;
  primer_voto_en: string | null;
  debate_hasta: string | null;
  cerrada_en: string | null;
  resultado: Resultado | null;
  votos_divididos: boolean;
};

export type Voto = { user_id: string; voto_inicial: number; voto_final: number | null };

export const momentoRevelar = (r: Pick<Ronda, "primer_voto_en">): Date | null =>
  r.primer_voto_en ? new Date(new Date(r.primer_voto_en).getTime() + REVELAR_TRAS_MS) : null;

/** Regla 20: todos los integrantes votaron, o pasaron 120 s desde el primer voto. */
export function debeRevelar(r: Ronda, votos: number, integrantes: number, ahora: Date): boolean {
  if (r.fase !== "votacion" || votos === 0) return false;
  if (votos >= integrantes) return true;
  const limite = momentoRevelar(r);
  return limite !== null && ahora >= limite;
}

/** Regla 21: una sola opción elegida cierra sin debate; dos o más abren 90 s de debate. */
export function resolverRevelacion(
  votos: Voto[],
  correcta: number,
  ahora: Date,
): Pick<Ronda, "fase" | "resultado" | "votos_divididos" | "debate_hasta" | "cerrada_en"> {
  if (votos.length === 0) {
    return { fase: "cerrada", resultado: "sin_votos", votos_divididos: false, debate_hasta: null, cerrada_en: ahora.toISOString() };
  }
  const distintas = new Set(votos.map((v) => v.voto_inicial));
  if (distintas.size === 1) {
    const unica = votos[0].voto_inicial;
    return {
      fase: "cerrada",
      resultado: unica === correcta ? "combo_perfecto" : "unanime_incorrecta",
      votos_divididos: false,
      debate_hasta: null,
      cerrada_en: ahora.toISOString(),
    };
  }
  return {
    fase: "debate",
    resultado: "debate",
    votos_divididos: true,
    debate_hasta: new Date(ahora.getTime() + DEBATE_MS).toISOString(),
    cerrada_en: null,
  };
}

export function debeCerrarDebate(r: Ronda, ahora: Date): boolean {
  return r.fase === "debate" && r.debate_hasta !== null && ahora >= new Date(r.debate_hasta);
}

/** Regla 23: lo que se registra de cada voto al cerrar. */
export function resultadoVoto(v: Voto, correcta: number) {
  const final = v.voto_final ?? v.voto_inicial;
  return {
    final,
    acierto: final === correcta,
    aciertoInicial: v.voto_inicial === correcta,
    cambio: final !== v.voto_inicial,
  };
}

/** Promedio exponencial: pondera más las respuestas recientes (regla 28, *). */
export function nuevoDominio(previo: number | null, acierto: boolean, alfa = ALFA_DOMINIO): number {
  const base = previo ?? DOMINIO_INICIAL;
  const v = base + alfa * ((acierto ? 1 : 0) - base);
  return Math.min(1, Math.max(0, v));
}

export type CheckpointCompleto = {
  id: string;
  segundo: number;
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
};

/**
 * Regla 19: lo que puede ver `userId` según la fase.
 * - votación: quiénes votaron (sin opción) y mi propio voto.
 * - debate: todos los votos, sin la respuesta correcta.
 * - cerrada: votos finales, respuesta correcta y explicación (regla 22).
 */
export function vistaRonda(r: Ronda | null, votos: Voto[], cp: CheckpointCompleto, userId: string, integrantes: number) {
  const mio = votos.find((v) => v.user_id === userId) ?? null;
  const base = {
    checkpoint: { id: cp.id, segundo: cp.segundo, pregunta: cp.pregunta, opciones: cp.opciones },
    fase: (r?.fase ?? "votacion") as Fase,
    integrantes,
    votantes: votos.map((v) => v.user_id),
    miVoto: mio ? { inicial: mio.voto_inicial, final: mio.voto_final } : null,
    revelarEn: r ? momentoRevelar(r)?.toISOString() ?? null : null,
    debateHasta: r?.debate_hasta ?? null,
  };
  if (!r || r.fase === "votacion") return { ...base, votos: null, resultado: null, correcta: null, explicacion: null };
  const visibles = votos.map((v) => ({ userId: v.user_id, inicial: v.voto_inicial, final: v.voto_final }));
  if (r.fase === "debate") return { ...base, votos: visibles, resultado: null, correcta: null, explicacion: null };
  return { ...base, votos: visibles, resultado: r.resultado, correcta: cp.correcta, explicacion: cp.explicacion };
}
