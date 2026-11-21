import { z } from "zod";
import { conflicto, ErrorApi, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { exigirAnfitrion, salaPorCodigo, sesionActiva } from "@/lib/grupo/repositorio";
import { MIN_INTEGRANTES } from "@/lib/grupo/salas";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

const cuerpo = z.object({ accion: z.enum(["iniciar", "cerrar"]) });

/** El anfitrión inicia o cierra la sesión a mano (la sesión también arranca sola). Regla 3: una sola activa. */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  const lista = await exigirAnfitrion(sala, usuario.id);
  const { accion } = await leerCuerpo(req, cuerpo);
  const db = supabaseAdmin();

  if (accion === "iniciar") {
    if (sala.estado === "cerrada") throw conflicto("SALA_CERRADA", "La sala está cerrada");
    if (lista.length < MIN_INTEGRANTES) {
      throw new ErrorApi(409, "FALTAN_INTEGRANTES", `Se necesitan al menos ${MIN_INTEGRANTES} integrantes`);
    }
    const r = await db.from("room_sessions").insert({ room_id: sala.id }).select("*").single();
    if (r.error?.code === "23505") throw conflicto("SESION_ACTIVA", "Ya hay una sesión activa en esta sala");
    const sesion = datos(r);
    await emitir(sala.id, "sesion_iniciada", { sessionId: sesion.id });
    return ok({ sesion }, 201);
  }

  const activa = await sesionActiva(sala.id);
  if (!activa) throw conflicto("SIN_SESION", "La sala no tiene una sesión activa");
  const sesion = datos(
    await db.from("room_sessions").update({ cerrada_en: new Date().toISOString() }).eq("id", activa.id).select("*").single(),
  );
  await emitir(sala.id, "sesion_cerrada", { sessionId: activa.id });
  return ok({ sesion });
});
