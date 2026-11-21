import { leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import { esquemaCheckpoint } from "@/lib/grupo/control";
import type { CtxSala } from "@/lib/grupo/http";
import { exigirAdminPlataforma, exigirMiembro, salaPorCodigo } from "@/lib/grupo/repositorio";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/**
 * Lista los puntos de control del video de la sala.
 * - Integrantes: solo id y segundo (la pregunta se pide al llegar, y nunca la respuesta).
 * - Administración de la plataforma con ?completo=1: todo, para revisar y editar las preguntas.
 */
export const GET = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  const completo = new URL(req.url).searchParams.get("completo") === "1";
  if (completo) exigirAdminPlataforma(usuario);
  else await exigirMiembro(sala, usuario.id);

  const columnas = completo
    ? "id, segundo, pregunta, opciones, correcta, explicacion, concept_id, generado_por_ia, revisado"
    : "id, segundo, concept_id";
  const checkpoints = datos(
    await supabaseAdmin().from("checkpoints").select(columnas).eq("video_id", sala.video_id).order("segundo"),
  );
  return ok({ checkpoints });
});

/** El anfitrión crea un punto de control a mano (regla 17). */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  exigirAdminPlataforma(usuario);
  const entrada = await leerCuerpo(req, esquemaCheckpoint);
  const checkpoint = datos(
    await supabaseAdmin()
      .from("checkpoints")
      .insert({ ...entrada, video_id: sala.video_id, generado_por_ia: false, revisado: true })
      .select("*")
      .single(),
  );
  await emitir(sala.id, "checkpoints_actualizados", { videoId: sala.video_id });
  return ok({ checkpoint }, 201);
});
