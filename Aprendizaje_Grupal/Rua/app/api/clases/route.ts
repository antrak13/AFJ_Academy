import { ok, ruta, datos } from "@/lib/api";
import { resumenFantasmas } from "@/lib/grupo/fantasmas";
import { perfiles } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/** Cursos con sus clases y, por clase, las sesiones de mis amigos que puedo ver como fantasmas. */
export const GET = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const db = supabaseAdmin();
  const [cursos, clases] = await Promise.all([
    db.from("topics").select("id, titulo, descripcion").order("titulo").returns<{ id: string; titulo: string; descripcion: string }[]>().then(datos),
    db.from("videos").select("id, topic_id, titulo, duracion, orden, licencia").order("orden").returns<{ id: string; topic_id: string | null; titulo: string; duracion: number; orden: number; licencia: string | null }[]>().then(datos),
  ]);
  const fantasmas = await resumenFantasmas(usuario.id, clases.map((c) => c.id));
  const ids = [...new Set([...fantasmas.values()].flat().flatMap((s) => s.personas))];
  const gente = new Map((await perfiles(ids)).map((p) => [p.id, { id: p.id, nombre: p.nombre, avatar: p.avatar }]));
  return ok({
    cursos: cursos.map((c) => ({
      ...c,
      clases: clases
        .filter((v) => v.topic_id === c.id)
        .map((v) => ({
          ...v,
          fantasmas: (fantasmas.get(v.id) ?? []).map((s) => ({ ...s, personas: s.personas.map((id) => gente.get(id)).filter(Boolean) })),
        })),
    })),
  });
});
