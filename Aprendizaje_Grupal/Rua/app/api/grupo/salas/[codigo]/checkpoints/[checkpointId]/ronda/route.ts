import { ok, ruta } from "@/lib/api";
import type { CtxCheckpoint } from "@/lib/grupo/http";
import { accesoSala } from "@/lib/grupo/repositorio";
import { estadoRonda } from "@/lib/grupo/rondas";

/**
 * Estado del punto de control para mí. Llamarlo al llegar al segundo del punto de control
 * (regla 18: el cliente pausa su video y abre su votación), al recibir eventos de Broadcast
 * y cuando venzan `revelarEn` o `debateHasta`: así el servidor aplica la transición.
 */
export const GET = ruta(async (req: Request, { params }: CtxCheckpoint) => {
  const { codigo, checkpointId } = await params;
  const { usuario, sala, lista, cp } = await accesoSala(req, codigo, { checkpointId });
  return ok(await estadoRonda(sala, cp!, usuario.id, lista.length));
});
