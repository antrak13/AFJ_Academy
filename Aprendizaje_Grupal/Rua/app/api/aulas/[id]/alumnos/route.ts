import { z } from "zod";
import { ErrorApi, idValido, leerCuerpo, ok, ruta, sinError } from "@/lib/api";
import { aulaDeDocente } from "@/lib/aulas/repositorio";
import { conSufijo, correoDeUsuario, generarPin, MAX_ALUMNOS_POR_LOTE, usuarioBase } from "@/lib/aulas/reglas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

type Ctx = { params: Promise<{ id: string }> };

const cuerpo = z.object({
  nombres: z.array(z.string().trim().min(1).max(40)).min(1).max(MAX_ALUMNOS_POR_LOTE),
});

/**
 * El docente registra a sus alumnos: por cada nombre crea una cuenta ya confirmada con usuario y PIN
 * (muchos niños no tienen correo) y la suma al aula. El PIN solo se devuelve en esta respuesta.
 */
export const POST = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const aula = await aulaDeDocente(idValido((await params).id, "Aula"), usuario.id);
  const { nombres } = await leerCuerpo(req, cuerpo);
  const db = supabaseAdmin();

  const creados: { id: string; nombre: string; usuario: string; pin: string }[] = [];
  const errores: { nombre: string; error: string }[] = [];
  for (const nombre of nombres) {
    const base = usuarioBase(nombre), pin = generarPin();
    let hecho = false;
    for (let intento = 0; intento < 6 && !hecho; intento++) {
      const alias = conSufijo(base);
      const r = await db.auth.admin.createUser({
        email: correoDeUsuario(alias),
        password: pin,
        email_confirm: true,
        user_metadata: { full_name: nombre, rol: "estudiante", carrera: aula.curso, institucion: "", usuario: alias, creado_por_docente: true },
      });
      if (r.error) {
        if (/already|registered|exists/i.test(r.error.message)) continue; // usuario tomado: otro sufijo
        errores.push({ nombre, error: r.error.message });
        break;
      }
      sinError(await db.from("aula_alumnos").insert({ aula_id: aula.id, alumno_id: r.data.user.id, usuario: alias }));
      creados.push({ id: r.data.user.id, nombre, usuario: alias, pin });
      hecho = true;
    }
    if (!hecho && !errores.some((e) => e.nombre === nombre)) errores.push({ nombre, error: "No encontré un usuario libre" });
  }
  if (!creados.length && errores.length) throw new ErrorApi(400, "NO_SE_CREARON", errores[0].error);
  return ok({ creados, errores }, 201);
});

/** Saca a un alumno del aula (la cuenta sigue existiendo). */
export const DELETE = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const aula = await aulaDeDocente(idValido((await params).id, "Aula"), usuario.id);
  const alumno = idValido(new URL(req.url).searchParams.get("alumno") ?? "", "Alumno");
  sinError(await supabaseAdmin().from("aula_alumnos").delete().eq("aula_id", aula.id).eq("alumno_id", alumno));
  return ok({ ok: true });
});
