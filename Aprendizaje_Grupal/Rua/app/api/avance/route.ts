import { leerCuerpo, ok, ruta, sinError } from "@/lib/api";
import { esquemaAvance } from "@/lib/aulas/reglas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/** La clase de Aprendines guarda aquí el avance del propio alumno (lo ve su docente en el panel). */
export const PUT = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const a = await leerCuerpo(req, esquemaAvance);
  sinError(
    await supabaseAdmin().from("aprendin_avance").upsert({
      alumno_id: usuario.id,
      aprendin_id: a.aprendinId,
      nombre: a.nombre,
      tema: a.tema,
      conceptos: a.conceptos,
      paso: a.paso,
      mensajes: a.mensajes,
      medicion: a.medicion,
      prueba: a.prueba,
      actualizado: new Date().toISOString(),
    }),
  );
  return ok({ ok: true });
});
