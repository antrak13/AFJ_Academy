import { ok, ruta } from "@/lib/api";
import type { CtxCheckpoint } from "@/lib/grupo/http";
import { accesoSala } from "@/lib/grupo/repositorio";
import { cerrarDebate } from "@/lib/grupo/rondas";

/** El anfitrión cierra el debate antes de que terminen los 90 s. */
export const POST = ruta(async (req: Request, { params }: CtxCheckpoint) => {
  const { codigo, checkpointId } = await params;
  const { usuario, sala, lista, cp } = await accesoSala(req, codigo, { checkpointId, anfitrion: true });
  return ok(await cerrarDebate(sala, cp!, usuario.id, lista.length));
});
