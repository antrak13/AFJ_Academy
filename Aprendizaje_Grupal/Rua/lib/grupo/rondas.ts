import "server-only";
import { after } from "next/server";
import { conflicto, ErrorApi, sinError, datos } from "@/lib/api";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  debeCerrarDebate,
  debeRevelar,
  momentoRevelar,
  resolverRevelacion,
  vistaRonda,
  type Ronda,
  type Voto,
} from "./control";
import { registrarResultados } from "./puente";
import { exigirSesionActiva, miembros, type CheckpointFila, type Sala } from "./repositorio";

// Las fases avanzan de forma perezosa: cada lectura o voto revisa si ya venció un plazo
// (120 s para revelar, 90 s de debate). El cliente, que conoce `revelarEn` y
// `debateHasta`, vuelve a pedir el estado al vencer su temporizador. Así no hace falta
// un proceso en segundo plano. Las transiciones son actualizaciones condicionadas a la
// fase anterior, de modo que si dos peticiones llegan a la vez solo una gana y los
// efectos (telemetría, broadcast) ocurren una vez.

const db = () => supabaseAdmin();

type Contexto = { sala: Sala; cp: CheckpointFila; sessionId: string };

async function obtenerOCrearRonda({ sala, cp, sessionId }: Contexto): Promise<Ronda> {
  // Casi siempre la ronda ya existe: se lee primero y solo se crea si falta.
  const existente = sinError(
    await db()
      .from("checkpoint_rounds")
      .select("*")
      .eq("session_id", sessionId)
      .eq("checkpoint_id", cp.id)
      .maybeSingle<Ronda>(),
  );
  if (existente) return existente;
  sinError(
    await db()
      .from("checkpoint_rounds")
      .upsert(
        { session_id: sessionId, room_id: sala.id, checkpoint_id: cp.id },
        { onConflict: "session_id,checkpoint_id", ignoreDuplicates: true },
      ),
  );
  return datos(
    await db()
      .from("checkpoint_rounds")
      .select("*")
      .eq("session_id", sessionId)
      .eq("checkpoint_id", cp.id)
      .single<Ronda>(),
  );
}

async function votosDe(rondaId: string): Promise<Voto[]> {
  return datos(
    await db()
      .from("votes")
      .select("user_id, voto_inicial, voto_final")
      .eq("round_id", rondaId)
      .order("creado", { ascending: true })
      .returns<Voto[]>(),
  );
}

/** Actualiza la ronda solo si sigue en `faseEsperada`. Devuelve null si otra petición ganó. */
async function transicion(ronda: Ronda, faseEsperada: Ronda["fase"], cambios: Partial<Ronda>): Promise<Ronda | null> {
  const filas = datos(
    await db()
      .from("checkpoint_rounds")
      .update(cambios)
      .eq("id", ronda.id)
      .eq("fase", faseEsperada)
      .select("*")
      .returns<Ronda[]>(),
  );
  return filas[0] ?? null;
}

async function alCerrar(ctx: Contexto, ronda: Ronda, votos: Voto[]) {
  // Regla 22: el voto final es el último registrado (o el inicial si no cambió).
  await Promise.all(
    votos
      .filter((v) => v.voto_final === null)
      .map(async (v) => {
        sinError(
          await db()
            .from("votes")
            .update({ voto_final: v.voto_inicial })
            .eq("round_id", ronda.id)
            .eq("user_id", v.user_id),
        );
        v.voto_final = v.voto_inicial;
      }),
  );
  // El puente al perfil individual no cambia lo que ve el squad: se escribe tras responder.
  const registrar = () =>
    registrarResultados(ctx.sala, ctx.cp, ronda, votos).catch((e) =>
      console.error(`No se registraron los resultados del punto de control ${ctx.cp.id}`, e),
    );
  try {
    after(registrar);
  } catch {
    await registrar();
  }
  await emitir(ctx.sala.id, "control_cerrado", { checkpointId: ctx.cp.id, resultado: ronda.resultado ?? "" });
}

/** Aplica las transiciones vencidas. Devuelve la ronda y los votos actualizados. */
async function avanzar(ctx: Contexto, ronda: Ronda, integrantes: number, ahora = new Date()) {
  let votos = await votosDe(ronda.id);

  if (debeRevelar(ronda, votos.length, integrantes, ahora)) {
    const cambios = resolverRevelacion(votos, ctx.cp.correcta, ahora);
    const nueva = await transicion(ronda, "votacion", cambios);
    if (nueva) {
      ronda = nueva;
      await emitir(ctx.sala.id, "control_revelado", {
        checkpointId: ctx.cp.id,
        fase: nueva.fase === "debate" ? "debate" : "cerrada",
        debateHasta: nueva.debate_hasta,
      });
      if (nueva.fase === "cerrada") await alCerrar(ctx, nueva, votos);
    } else {
      ronda = await obtenerOCrearRonda(ctx);
    }
    votos = await votosDe(ronda.id);
  }

  if (debeCerrarDebate(ronda, ahora)) {
    const nueva = await transicion(ronda, "debate", { fase: "cerrada", cerrada_en: ahora.toISOString() });
    if (nueva) {
      ronda = nueva;
      await alCerrar(ctx, nueva, votos);
    } else {
      ronda = await obtenerOCrearRonda(ctx);
    }
    votos = await votosDe(ronda.id);
  }

  return { ronda, votos };
}

async function contexto(sala: Sala, cp: CheckpointFila): Promise<Contexto> {
  const sesion = await exigirSesionActiva(sala.id);
  return { sala, cp, sessionId: sesion.id };
}

/** Estado visible de un punto de control para `userId` (regla 19). Abre la ronda si no existe (regla 18). */
export async function estadoRonda(sala: Sala, cp: CheckpointFila, userId: string, cantidad?: number) {
  const [ctx, integrantes] = await Promise.all([contexto(sala, cp), cantidad ?? miembros(sala.id).then((l) => l.length)]);
  const { ronda, votos } = await avanzar(ctx, await obtenerOCrearRonda(ctx), integrantes);
  return vistaRonda(ronda, votos, cp, userId, integrantes);
}

/**
 * Regla 19 a 21: en votación se registra (o corrige) el voto inicial a ciegas;
 * en debate, quien votó puede cambiar su voto. Quien no votó a tiempo queda fuera (regla 20).
 */
export async function votar(sala: Sala, cp: CheckpointFila, userId: string, opcion: number, cantidad?: number) {
  if (opcion < 0 || opcion >= cp.opciones.length) {
    throw new ErrorApi(400, "OPCION_INVALIDA", "Esa opción no existe en esta pregunta");
  }
  const [ctx, integrantes] = await Promise.all([contexto(sala, cp), cantidad ?? miembros(sala.id).then((l) => l.length)]);
  let { ronda, votos } = await avanzar(ctx, await obtenerOCrearRonda(ctx), integrantes);
  const mio = votos.find((v) => v.user_id === userId);

  if (ronda.fase === "cerrada") throw conflicto("CONTROL_CERRADO", "Esta pregunta ya se cerró");

  if (ronda.fase === "votacion") {
    const ahora = new Date().toISOString();
    sinError(
      await db().from("votes").upsert(
        {
          round_id: ronda.id,
          checkpoint_id: cp.id,
          room_id: sala.id,
          user_id: userId,
          voto_inicial: opcion,
          actualizado: ahora,
        },
        { onConflict: "round_id,user_id" },
      ),
    );
    // Marca el primer voto (solo si nadie lo hizo antes; si otro ganó, se relee la ronda).
    if (!ronda.primer_voto_en) {
      const marcada = datos(
        await db()
          .from("checkpoint_rounds")
          .update({ primer_voto_en: ahora })
          .eq("id", ronda.id)
          .is("primer_voto_en", null)
          .select("*")
          .returns<Ronda[]>(),
      );
      ronda = marcada[0] ?? (await obtenerOCrearRonda(ctx));
    }
    const enVotacion = ronda;
    ({ ronda, votos } = await avanzar(ctx, ronda, integrantes));
    await emitir(sala.id, "voto_registrado", {
      checkpointId: cp.id,
      userId,
      votantes: votos.length,
      integrantes,
      revelarEn: momentoRevelar(enVotacion)?.toISOString() ?? null,
    });
    return vistaRonda(ronda, votos, cp, userId, integrantes);
  }

  // Debate
  if (!mio) throw conflicto("NO_VOTASTE", "No respondiste a tiempo esta pregunta");
  sinError(
    await db()
      .from("votes")
      .update({ voto_final: opcion, actualizado: new Date().toISOString() })
      .eq("round_id", ronda.id)
      .eq("user_id", userId),
  );
  await emitir(sala.id, "voto_cambiado", { checkpointId: cp.id, userId });
  ({ ronda, votos } = await avanzar(ctx, ronda, integrantes));
  return vistaRonda(ronda, votos, cp, userId, integrantes);
}

/** El anfitrión puede cerrar el debate antes de los 90 s (supuesto: no lo define el diseño). */
export async function cerrarDebate(sala: Sala, cp: CheckpointFila, userId: string, cantidad?: number) {
  const [ctx, integrantes] = await Promise.all([contexto(sala, cp), cantidad ?? miembros(sala.id).then((l) => l.length)]);
  let { ronda, votos } = await avanzar(ctx, await obtenerOCrearRonda(ctx), integrantes);
  if (ronda.fase === "votacion") throw conflicto("AUN_EN_VOTACION", "Los votos todavía no se revelan");
  if (ronda.fase === "debate") {
    const nueva = await transicion(ronda, "debate", { fase: "cerrada", cerrada_en: new Date().toISOString() });
    if (nueva) {
      ronda = nueva;
      await alCerrar(ctx, nueva, votos);
      votos = await votosDe(ronda.id);
    } else {
      ({ ronda, votos } = await avanzar(ctx, await obtenerOCrearRonda(ctx), integrantes));
    }
  }
  return vistaRonda(ronda, votos, cp, userId, integrantes);
}
