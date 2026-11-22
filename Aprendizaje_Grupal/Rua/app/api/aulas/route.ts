import { z } from "zod";
import { leerCuerpo, ok, ruta } from "@/lib/api";
import { alumnosDe, aulasDeAlumno, aulasDeDocente, type Aula } from "@/lib/aulas/repositorio";
import { perfiles } from "@/lib/grupo/repositorio";
import { generarCodigo } from "@/lib/grupo/salas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/** Mis aulas: las que dirijo (con cuántos alumnos tienen) y en las que estoy como alumno. */
export const GET = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const [mias, deAlumno] = await Promise.all([aulasDeDocente(usuario.id), aulasDeAlumno(usuario.id)]);
  const alumnos = await alumnosDe(mias.map((a) => a.id));
  const docentes = new Map((await perfiles([...new Set(deAlumno.map((a) => a.docente_id))])).map((p) => [p.id, p.nombre]));
  return ok({
    comoDocente: mias.map((a) => ({ ...vista(a), codigo: a.codigo, alumnos: alumnos.filter((x) => x.aula_id === a.id).length })),
    comoAlumno: deAlumno.map((a) => ({ ...vista(a), docente: docentes.get(a.docente_id) ?? "" })),
  });
});

const vista = (a: Aula) => ({ id: a.id, nombre: a.nombre, curso: a.curso, tema: a.tema, creado: a.creado });

const cuerpo = z.object({
  nombre: z.string().trim().min(1).max(60),
  curso: z.string().trim().max(40).default(""),
  tema: z.string().trim().max(80).default(""),
});

/** Crea un aula con un código para compartir (6 caracteres, sin 0/O ni 1/I). */
export const POST = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const { nombre, curso, tema } = await leerCuerpo(req, cuerpo);
  for (let intento = 0; intento < 5; intento++) {
    const r = await supabaseAdmin()
      .from("aulas")
      .insert({ docente_id: usuario.id, nombre, curso, tema, codigo: generarCodigo() })
      .select("id, nombre, curso, tema, codigo, creado")
      .single();
    if (!r.error) return ok({ aula: { ...r.data, alumnos: 0 } }, 201);
    if (r.error.code !== "23505") throw new Error(`Supabase: ${r.error.message}`);
  }
  throw new Error("No pude generar un código de aula libre");
});
