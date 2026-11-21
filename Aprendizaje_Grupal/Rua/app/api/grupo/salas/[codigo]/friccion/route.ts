import { z } from "zod";
import { ErrorApi, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import { calcularVentanas, esRetroceso, RETROCESO_MIN_S, ventanaDe } from "@/lib/grupo/friccion";
import type { CtxSala } from "@/lib/grupo/http";
import { accesoSala, exigirMiembro, exigirSesionActiva, salaPorCodigo } from "@/lib/grupo/repositorio";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

const cuerpo = z.object({ desde: z.number().min(0), hasta: z.number().min(0) });

/**
 * El reproductor informa cada salto hacia atrás. Regla 10: solo cuenta si es de 5 s o más.
 * Regla 11: la ventana de 30 s a la que se retrocede pasa a zona con 2 integrantes distintos.
 */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const [{ usuario, sala }, { desde, hasta }] = await Promise.all([accesoSala(req, (await params).codigo), leerCuerpo(req, cuerpo)]);
  const sesion = await exigirSesionActiva(sala.id);
  if (!esRetroceso(desde, hasta)) {
    throw new ErrorApi(422, "NO_ES_RETROCESO", `Un retroceso es un salto atrás de ${RETROCESO_MIN_S} s o más`);
  }
  const db = supabaseAdmin();
  const ventana = ventanaDe(hasta);
  sinError(
    await db.from("rewind_events").insert({
      session_id: sesion.id,
      room_id: sala.id,
      user_id: usuario.id,
      desde,
      hasta,
      ventana_inicio: ventana,
    }),
  );

  const filas = datos(
    await db.from("rewind_events").select("user_id, ventana_inicio").eq("session_id", sesion.id).eq("ventana_inicio", ventana),
  ) as { user_id: string; ventana_inicio: number }[];
  const [v] = calcularVentanas(filas.map((f) => ({ userId: f.user_id, ventanaInicio: f.ventana_inicio })));

  // Regla 12: la zona no se borra durante la sesión (es_zona nunca vuelve a false).
  sinError(
    await db.from("friction_events").upsert(
      {
        session_id: sesion.id,
        room_id: sala.id,
        ventana_inicio: ventana,
        retrocesos: v.retrocesos,
        integrantes: v.integrantes,
        es_zona: v.esZona,
        actualizado: new Date().toISOString(),
      },
      { onConflict: "session_id,ventana_inicio" },
    ),
  );
  await emitir(sala.id, "zona_friccion", v);
  return ok({ ventana: v }, 201);
});

/** Ventanas con retrocesos de la sesión activa. */
export const GET = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  await exigirMiembro(sala, usuario.id);
  const sesion = await exigirSesionActiva(sala.id);
  const filas = datos(
    await supabaseAdmin().from("rewind_events").select("user_id, ventana_inicio").eq("session_id", sesion.id),
  ) as { user_id: string; ventana_inicio: number }[];
  return ok({ ventanas: calcularVentanas(filas.map((f) => ({ userId: f.user_id, ventanaInicio: f.ventana_inicio }))) });
});
