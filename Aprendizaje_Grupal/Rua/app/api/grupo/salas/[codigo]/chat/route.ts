import { z } from "zod";
import { leerCuerpo, ok, ruta, datos } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { accesoSala, exigirSesionActiva } from "@/lib/grupo/repositorio";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";

const cuerpo = z.object({ texto: z.string().trim().min(1).max(500), posicion: z.number().min(0) });

/** Mensaje al chat de la sesión. Se guarda para que los fantasmas lo vean en el mismo minuto. */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const [{ usuario, sala }, { texto, posicion }] = await Promise.all([accesoSala(req, (await params).codigo), leerCuerpo(req, cuerpo)]);
  const sesion = await exigirSesionActiva(sala.id);
  const m = datos(
    await supabaseAdmin()
      .from("chat_messages")
      .insert({ session_id: sesion.id, room_id: sala.id, user_id: usuario.id, texto, posicion })
      .select("id, user_id, texto, posicion, creado")
      .single<{ id: string; user_id: string; texto: string; posicion: number; creado: string }>(),
  );
  const mensaje = { id: m.id, userId: m.user_id, texto: m.texto, posicion: m.posicion, creado: m.creado };
  await emitir(sala.id, "chat_mensaje", mensaje);
  return ok({ mensaje }, 201);
});
