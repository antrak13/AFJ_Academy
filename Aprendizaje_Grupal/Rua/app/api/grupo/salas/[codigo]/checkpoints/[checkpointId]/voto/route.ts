import { z } from "zod";
import { leerCuerpo, ok, ruta } from "@/lib/api";
import type { CtxCheckpoint } from "@/lib/grupo/http";
import { accesoSala } from "@/lib/grupo/repositorio";
import { votar } from "@/lib/grupo/rondas";

const cuerpo = z.object({ opcion: z.number().int().min(0).max(3) });

/** Voto a ciegas en votación; cambio de voto durante el debate (reglas 19 a 21). */
export const POST = ruta(async (req: Request, { params }: CtxCheckpoint) => {
  const { codigo, checkpointId } = await params;
  const [{ usuario, sala, lista, cp }, { opcion }] = await Promise.all([
    accesoSala(req, codigo, { checkpointId }),
    leerCuerpo(req, cuerpo),
  ]);
  return ok(await votar(sala, cp!, usuario.id, opcion, lista.length));
});
