import { idValido, ok, ruta } from "@/lib/api";
import { fantasmasDeClase } from "@/lib/grupo/fantasmas";
import { exigirUsuario } from "@/lib/supabase/auth";

type Ctx = { params: Promise<{ videoId: string }> };

/** Sesiones de mis amigos en esta clase, para verlas en diferido. `?excluir=<sessionId>` omite la mía. */
export const GET = ruta(async (req: Request, { params }: Ctx) => {
  const [usuario, videoId] = await Promise.all([exigirUsuario(req), params.then((p) => idValido(p.videoId, "Clase"))]);
  const excluir = new URL(req.url).searchParams.get("excluir") ?? undefined;
  return ok({ sesiones: await fantasmasDeClase(usuario.id, videoId, excluir) });
});
