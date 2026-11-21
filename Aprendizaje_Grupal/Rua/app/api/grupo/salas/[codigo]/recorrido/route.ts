import { z } from "zod";
import { leerCuerpo, ok, ruta, sinError } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { accesoSala, exigirSesionActiva } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Muestra: [ms desde que empecé esta sesión, posición en el video (s), estado]
// estado: 0 viendo, 1 en pausa, 2 escribiendo, 3 hablando
const cuerpo = z.object({
  iniciado: z.string().datetime(),
  muestras: z
    .array(z.tuple([z.number().int().min(0), z.number().min(0), z.number().int().min(0).max(3)]))
    .min(1)
    .max(120),
});

/** Guarda mi recorrido (para que mis amigos me vean como fantasma). Se envía en lotes. */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const [{ usuario, sala }, { iniciado, muestras }] = await Promise.all([accesoSala(req, (await params).codigo), leerCuerpo(req, cuerpo)]);
  const sesion = await exigirSesionActiva(sala.id);
  sinError(
    await supabaseAdmin().rpc("agregar_muestras", {
      p_session: sesion.id,
      p_user: usuario.id,
      p_room: sala.id,
      p_video: sala.video_id,
      p_iniciado: iniciado,
      p_muestras: muestras,
    }),
  );
  return ok({ guardadas: muestras.length });
});
