import "server-only";
import { sinError, datos } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nuevoDominio, resultadoVoto, type Ronda, type Voto } from "./control";
import { perfiles, type CheckpointFila, type Sala } from "./repositorio";

/**
 * Puente con el estudio individual (sección 2.3 y regla 23). Se llama una sola vez
 * por ronda, cuando se cierra:
 * - cada voto genera un learning_event (acierto, cambió o no de voto);
 * - se actualiza el `mastery` de quien votó en el concepto del punto de control;
 * - si hubo votos divididos, el concepto queda marcado "para debatir en grupo".
 * Regla 35: si la persona no aceptó la telemetría, no se registra nada suyo.
 */
export async function registrarResultados(sala: Sala, cp: CheckpointFila, ronda: Ronda, votos: Voto[]) {
  const db = supabaseAdmin();

  if (ronda.votos_divididos && cp.concept_id) {
    sinError(
      await db
        .from("debate_flags")
        .upsert(
          { room_id: sala.id, concept_id: cp.concept_id, checkpoint_id: cp.id },
          { onConflict: "room_id,checkpoint_id", ignoreDuplicates: true },
        ),
    );
  }

  const conPermiso = new Set(
    (await perfiles(votos.map((v) => v.user_id))).filter((p) => p.telemetria).map((p) => p.id),
  );
  const votosRegistrables = votos.filter((v) => conPermiso.has(v.user_id));
  if (votosRegistrables.length === 0) return;

  const eventos = votosRegistrables.map((v) => {
    const r = resultadoVoto(v, cp.correcta);
    return {
      user_id: v.user_id,
      concept_id: cp.concept_id,
      origen: "grupal",
      tipo: "voto_punto_control",
      valor: {
        room_id: sala.id,
        checkpoint_id: cp.id,
        round_id: ronda.id,
        voto_inicial: v.voto_inicial,
        voto_final: r.final,
        acierto: r.acierto,
        acierto_inicial: r.aciertoInicial,
        cambio: r.cambio,
        votos_divididos: ronda.votos_divididos,
      },
    };
  });
  sinError(await db.from("learning_events").insert(eventos));

  if (!cp.concept_id) return;

  const previos = datos(
    await db
      .from("mastery")
      .select("user_id, valor")
      .eq("concept_id", cp.concept_id)
      .in("user_id", votosRegistrables.map((v) => v.user_id))
      .returns<{ user_id: string; valor: number }[]>(),
  );
  const previoDe = new Map(previos.map((p) => [p.user_id, p.valor]));
  const ahora = new Date().toISOString();
  const filas = votosRegistrables.map((v) => ({
    user_id: v.user_id,
    concept_id: cp.concept_id,
    valor: nuevoDominio(previoDe.get(v.user_id) ?? null, resultadoVoto(v, cp.correcta).acierto),
    actualizado: ahora,
  }));
  sinError(await db.from("mastery").upsert(filas, { onConflict: "user_id,concept_id" }));
}
