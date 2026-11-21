import { ok, ruta, datos } from "@/lib/api";
import { perfiles } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

type Fila = {
  room_id: string;
  invitado_por: string;
  creado: string;
  rooms: { codigo: string; estado: string; videos: { id: string; titulo: string; topics: { titulo: string } | null } | null } | null;
};

/** Invitaciones pendientes a sesiones que siguen abiertas. */
export const GET = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const filas = datos(
    await supabaseAdmin()
      .from("room_invites")
      .select("room_id, invitado_por, creado, rooms(codigo, estado, videos(id, titulo, topics(titulo)))")
      .eq("invitado", usuario.id)
      .eq("estado", "pendiente")
      .order("creado", { ascending: false })
      .returns<Fila[]>(),
  ).filter((f) => f.rooms?.estado === "abierta");
  const gente = new Map((await perfiles(filas.map((f) => f.invitado_por))).map((p) => [p.id, p]));
  return ok({
    invitaciones: filas.map((f) => ({
      roomId: f.room_id,
      codigo: f.rooms!.codigo,
      claseId: f.rooms!.videos?.id ?? null,
      clase: f.rooms!.videos?.titulo ?? "",
      curso: f.rooms!.videos?.topics?.titulo ?? "",
      deId: f.invitado_por,
      deNombre: gente.get(f.invitado_por)?.nombre ?? "",
      creado: f.creado,
    })),
  });
});
