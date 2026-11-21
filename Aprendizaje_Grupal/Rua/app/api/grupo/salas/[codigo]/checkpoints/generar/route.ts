import { z } from "zod";
import { ErrorApi, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import { ErrorIA } from "@/lib/ai/proveedor";
import { generarPreguntasControl } from "@/lib/ai/preguntas-control";
import type { CtxSala } from "@/lib/grupo/http";
import { exigirAdminPlataforma, salaPorCodigo } from "@/lib/grupo/repositorio";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

export const maxDuration = 120;

const cuerpo = z.object({ cantidad: z.number().int().min(1).max(8).default(5) });

const MAX_FRAGMENTOS = 30;

/**
 * Fragmentos del material del tema. Las tablas materials/material_chunks son del estudio
 * individual; si todavía no existen se genera solo con la descripción del tema.
 */
async function fragmentosDelTema(topicId: string): Promise<string[]> {
  const db = supabaseAdmin();
  const materiales = await db.from("materials").select("id").eq("topic_id", topicId);
  if (materiales.error || !materiales.data?.length) return [];
  const trozos = await db
    .from("material_chunks")
    .select("texto")
    .in("material_id", materiales.data.map((m: { id: string }) => m.id))
    .limit(MAX_FRAGMENTOS);
  if (trozos.error) return [];
  return trozos.data.map((t: { texto: string }) => t.texto);
}

/**
 * Genera con IA las preguntas de control del video de la sala (sección 2.3). Solo el
 * anfitrión. Quedan con revisado=false para que las revise y edite antes de la sesión.
 */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  exigirAdminPlataforma(usuario);
  const { cantidad } = await leerCuerpo(req, cuerpo);
  const db = supabaseAdmin();

  const [tema, conceptos, video, fragmentos] = await Promise.all([
    db.from("topics").select("titulo, descripcion").eq("id", sala.topic_id).single().then(datos),
    db.from("concepts").select("id, nombre").eq("topic_id", sala.topic_id).then(datos),
    db.from("videos").select("titulo, duracion").eq("id", sala.video_id).single().then(datos),
    fragmentosDelTema(sala.topic_id),
  ]);

  let generado;
  try {
    generado = await generarPreguntasControl({ tema, conceptos, video, fragmentos, cantidad });
  } catch (e) {
    if (e instanceof ErrorIA) throw new ErrorApi(502, "ERROR_IA", e.message);
    throw e;
  }

  const filas = generado.preguntas.map(({ fragmento: _f, ...p }) => ({
    ...p,
    video_id: sala.video_id,
    generado_por_ia: true,
    revisado: false,
  }));
  const checkpoints = filas.length ? sinError(await db.from("checkpoints").insert(filas).select("*")) : [];
  if (filas.length) await emitir(sala.id, "checkpoints_actualizados", { videoId: sala.video_id });
  return ok({ checkpoints, sinCobertura: generado.sinCobertura, fragmentosUsados: fragmentos.length }, 201);
});
