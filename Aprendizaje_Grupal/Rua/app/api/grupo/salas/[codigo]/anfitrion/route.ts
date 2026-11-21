import { z } from "zod";
import { conflicto, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { exigirMiembro, salaPorCodigo } from "@/lib/grupo/repositorio";
import { elegirNuevoAnfitrion } from "@/lib/grupo/salas";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

const cuerpo = z.object({ conectados: z.array(z.string().uuid()).min(1) });

/**
 * Regla 4: cuando un cliente detecta por Presence que el anfitrión ya no está, llama aquí
 * con la lista de conectados. El servidor elige a quien lleva más tiempo en la sala.
 * Si el anfitrión sigue en la lista de conectados, no se cambia nada.
 */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  const lista = await exigirMiembro(sala, usuario.id);
  const { conectados } = await leerCuerpo(req, cuerpo);

  if (conectados.includes(sala.anfitrion)) return ok({ anfitrion: sala.anfitrion, cambio: false });
  const nuevo = elegirNuevoAnfitrion(lista, sala.anfitrion, conectados);
  if (!nuevo) throw conflicto("SIN_CANDIDATOS", "No hay integrantes conectados para tomar el rol");

  const db = supabaseAdmin();
  // Condicionado al anfitrión anterior: si dos clientes llaman a la vez, gana uno.
  const filas = datos(
    await db.from("rooms").update({ anfitrion: nuevo }).eq("id", sala.id).eq("anfitrion", sala.anfitrion).select("id"),
  );
  if (filas.length === 0) return ok({ anfitrion: null, cambio: false, reintentar: true });
  sinError(await db.from("room_members").update({ rol: "integrante" }).eq("room_id", sala.id).eq("user_id", sala.anfitrion));
  sinError(await db.from("room_members").update({ rol: "anfitrion" }).eq("room_id", sala.id).eq("user_id", nuevo));
  await emitir(sala.id, "anfitrion_cambio", { anfitrion: nuevo });
  return ok({ anfitrion: nuevo, cambio: true });
});
