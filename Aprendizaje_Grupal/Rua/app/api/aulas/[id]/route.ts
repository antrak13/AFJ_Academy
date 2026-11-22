import { z } from "zod";
import { datos, idValido, leerCuerpo, ok, ruta, sinError } from "@/lib/api";
import { alumnosDe, aulaDeDocente } from "@/lib/aulas/repositorio";
import { perfiles } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

type Ctx = { params: Promise<{ id: string }> };

type FilaAvance = {
  alumno_id: string; aprendin_id: string; nombre: string; tema: string; conceptos: string[]; paso: number;
  mensajes: number; medicion: Record<string, { estado: string; nota: string }[]>; prueba: unknown; actualizado: string;
};

/** Detalle del aula para su docente: alumnos y el avance de cada uno de sus aprendines. */
export const GET = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const aula = await aulaDeDocente(idValido((await params).id, "Aula"), usuario.id);
  const filas = await alumnosDe([aula.id]);
  const ids = filas.map((f) => f.alumno_id);
  const [nombres, avances] = await Promise.all([
    perfiles(ids),
    ids.length
      ? supabaseAdmin()
          .from("aprendin_avance")
          .select("alumno_id, aprendin_id, nombre, tema, conceptos, paso, mensajes, medicion, prueba, actualizado")
          .in("alumno_id", ids)
          .order("actualizado", { ascending: false })
          .returns<FilaAvance[]>()
          .then(datos)
      : Promise.resolve([] as FilaAvance[]),
  ]);
  const nombreDe = new Map(nombres.map((p) => [p.id, p.nombre]));
  return ok({
    aula: { id: aula.id, nombre: aula.nombre, curso: aula.curso, tema: aula.tema, codigo: aula.codigo, creado: aula.creado },
    alumnos: filas.map((f) => ({
      id: f.alumno_id,
      nombre: nombreDe.get(f.alumno_id) || f.usuario || "Alumno",
      usuario: f.usuario,
      unido: f.creado,
      avances: avances
        .filter((a) => a.alumno_id === f.alumno_id)
        .map(({ alumno_id: _, aprendin_id, ...resto }) => ({ id: aprendin_id, ...resto })),
    })),
  });
});

const cambios = z
  .object({
    nombre: z.string().trim().min(1).max(60).optional(),
    curso: z.string().trim().max(40).optional(),
    tema: z.string().trim().max(80).optional(),
  })
  .refine((c) => Object.keys(c).length > 0, "Nada que cambiar");

/** El docente cambia el nombre, el curso o el tema asignado. */
export const PATCH = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const aula = await aulaDeDocente(idValido((await params).id, "Aula"), usuario.id);
  const c = await leerCuerpo(req, cambios);
  sinError(await supabaseAdmin().from("aulas").update(c).eq("id", aula.id));
  return ok({ aula: { ...aula, ...c } });
});
