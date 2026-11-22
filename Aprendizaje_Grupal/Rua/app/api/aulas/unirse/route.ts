import { z } from "zod";
import { ErrorApi, leerCuerpo, noEncontrado, ok, ruta, sinError } from "@/lib/api";
import type { Aula } from "@/lib/aulas/repositorio";
import { normalizarCodigo } from "@/lib/grupo/salas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

const cuerpo = z.object({ codigo: z.string().trim().min(4).max(12) });

/** Quien ya tiene cuenta se une a un aula con el código que le dio su docente. Unirse dos veces no falla. */
export const POST = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const codigo = normalizarCodigo((await leerCuerpo(req, cuerpo)).codigo);
  const db = supabaseAdmin();
  const aula = sinError(
    await db.from("aulas").select("id, docente_id, nombre, curso, tema, codigo, creado").eq("codigo", codigo).maybeSingle<Aula>(),
  );
  if (!aula) throw noEncontrado("No hay ningún aula con ese código");
  if (aula.docente_id === usuario.id) throw new ErrorApi(400, "ES_TU_AULA", "Esta aula es tuya: entras como docente");
  const r = await db.from("aula_alumnos").insert({ aula_id: aula.id, alumno_id: usuario.id });
  if (r.error && r.error.code !== "23505") throw new Error(`Supabase: ${r.error.message}`);
  return ok({ aula: { id: aula.id, nombre: aula.nombre, curso: aula.curso, tema: aula.tema }, yaEstabas: !!r.error }, r.error ? 200 : 201);
});
