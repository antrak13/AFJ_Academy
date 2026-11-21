import { z } from "zod";
import { leerCuerpo, ok, ruta } from "@/lib/api";
import { exigirMiembro, perfiles, salaPorCodigo } from "@/lib/grupo/repositorio";
import { tokenVoz } from "@/lib/voz/livekit";
import { exigirUsuario } from "@/lib/supabase/auth";

const cuerpo = z.object({ codigo: z.string().min(1) });

/** Token de LiveKit para entrar al audio de la sala. Solo para integrantes. */
export const POST = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const { codigo } = await leerCuerpo(req, cuerpo);
  const sala = await salaPorCodigo(codigo);
  await exigirMiembro(sala, usuario.id);
  const [perfil] = await perfiles([usuario.id]);
  return ok(await tokenVoz({ roomId: sala.id, userId: usuario.id, nombre: perfil?.nombre || "Integrante" }));
});
