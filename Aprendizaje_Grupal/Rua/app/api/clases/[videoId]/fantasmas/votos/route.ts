import { ErrorApi, idValido, ok, ruta } from "@/lib/api";
import { votosFantasma } from "@/lib/grupo/fantasmas";
import { exigirUsuario } from "@/lib/supabase/auth";

/** Cómo votaron mis amigos en un punto de control; solo después de que yo respondí (regla 19). */
export const GET = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const url = new URL(req.url);
  const checkpointId = idValido(url.searchParams.get("checkpoint") ?? "", "Pregunta");
  const sesiones = (url.searchParams.get("sesiones") ?? "").split(",").filter(Boolean).map((s) => idValido(s, "Sesión"));
  const r = await votosFantasma(usuario.id, checkpointId, sesiones);
  if (r === null) throw new ErrorApi(409, "RESPONDE_PRIMERO", "Responde la pregunta para ver cómo respondieron tus amigos");
  return ok({ rondas: r });
});
