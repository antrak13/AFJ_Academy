import { z } from "zod";
import { ErrorApi, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import { esquemaCheckpoint } from "@/lib/grupo/control";
import type { CtxCheckpoint } from "@/lib/grupo/http";
import { checkpointDeSala, exigirAdminPlataforma, salaPorCodigo } from "@/lib/grupo/repositorio";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

const parcial = z.object({
  segundo: z.number().int().min(0).optional(),
  pregunta: z.string().optional(),
  opciones: z.array(z.string()).optional(),
  correcta: z.number().int().optional(),
  explicacion: z.string().optional(),
  concept_id: z.string().uuid().nullable().optional(),
  revisado: z.boolean().optional(),
});

/** El anfitrión revisa o edita una pregunta (por ejemplo, las generadas por IA). */
export const PATCH = ruta(async (req: Request, { params }: CtxCheckpoint) => {
  const usuario = await exigirUsuario(req);
  const { codigo, checkpointId } = await params;
  const sala = await salaPorCodigo(codigo);
  exigirAdminPlataforma(usuario);
  const actual = await checkpointDeSala(sala, checkpointId);
  const { revisado, ...cambios } = await leerCuerpo(req, parcial);

  // Se valida el resultado completo para no dejar, por ejemplo, `correcta` fuera de rango.
  const combinado = esquemaCheckpoint.safeParse({
    segundo: cambios.segundo ?? actual.segundo,
    pregunta: cambios.pregunta ?? actual.pregunta,
    opciones: cambios.opciones ?? actual.opciones,
    correcta: cambios.correcta ?? actual.correcta,
    explicacion: cambios.explicacion ?? actual.explicacion,
    concept_id: cambios.concept_id === undefined ? actual.concept_id : cambios.concept_id,
  });
  if (!combinado.success) throw new ErrorApi(400, "DATOS_INVALIDOS", combinado.error.issues.map((i) => i.message).join("; "));

  const checkpoint = datos(
    await supabaseAdmin()
      .from("checkpoints")
      .update({ ...combinado.data, revisado: revisado ?? true })
      .eq("id", actual.id)
      .select("*")
      .single(),
  );
  await emitir(sala.id, "checkpoints_actualizados", { videoId: sala.video_id });
  return ok({ checkpoint });
});

export const DELETE = ruta(async (req: Request, { params }: CtxCheckpoint) => {
  const usuario = await exigirUsuario(req);
  const { codigo, checkpointId } = await params;
  const sala = await salaPorCodigo(codigo);
  exigirAdminPlataforma(usuario);
  const actual = await checkpointDeSala(sala, checkpointId);
  sinError(await supabaseAdmin().from("checkpoints").delete().eq("id", actual.id));
  await emitir(sala.id, "checkpoints_actualizados", { videoId: sala.video_id });
  return ok({ eliminado: actual.id });
});
