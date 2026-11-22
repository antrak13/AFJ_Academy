import "server-only";
import { datos, noEncontrado, prohibido, sinError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Aula = { id: string; docente_id: string; nombre: string; curso: string; tema: string; codigo: string; creado: string };

const CAMPOS = "id, docente_id, nombre, curso, tema, codigo, creado";

export async function aulaPorId(id: string): Promise<Aula> {
  const aula = sinError(await supabaseAdmin().from("aulas").select(CAMPOS).eq("id", id).maybeSingle<Aula>());
  if (!aula) throw noEncontrado("Aula no encontrada");
  return aula;
}

/** El aula, solo si quien pide es su docente. */
export async function aulaDeDocente(id: string, docenteId: string): Promise<Aula> {
  const aula = await aulaPorId(id);
  if (aula.docente_id !== docenteId) throw prohibido("Esta aula es de otro docente");
  return aula;
}

export async function aulasDeDocente(docenteId: string): Promise<Aula[]> {
  return datos(await supabaseAdmin().from("aulas").select(CAMPOS).eq("docente_id", docenteId).order("creado").returns<Aula[]>());
}

export async function aulasDeAlumno(alumnoId: string): Promise<Aula[]> {
  const filas = datos(
    await supabaseAdmin().from("aula_alumnos").select("aula_id").eq("alumno_id", alumnoId).returns<{ aula_id: string }[]>(),
  );
  if (!filas.length) return [];
  return datos(
    await supabaseAdmin().from("aulas").select(CAMPOS).in("id", filas.map((f) => f.aula_id)).order("creado").returns<Aula[]>(),
  );
}

export async function alumnosDe(aulaIds: string[]) {
  if (!aulaIds.length) return [];
  return datos(
    await supabaseAdmin()
      .from("aula_alumnos")
      .select("aula_id, alumno_id, usuario, creado")
      .in("aula_id", aulaIds)
      .order("creado")
      .returns<{ aula_id: string; alumno_id: string; usuario: string | null; creado: string }[]>(),
  );
}
