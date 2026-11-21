import { idValido, noEncontrado, ok, ruta, datos, sinError } from "@/lib/api";
import { perfiles } from "@/lib/grupo/repositorio";
import { avisarA } from "@/lib/realtime/usuario";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

type Ctx = { params: Promise<{ id: string }> };

/** Acepta la solicitud de amistad que me envió `id`. */
export const POST = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const id = idValido((await params).id, "Persona");
  const filas = datos(
    await supabaseAdmin()
      .from("friendships")
      .update({ estado: "aceptada" })
      .eq("solicitante", id)
      .eq("destinatario", usuario.id)
      .select("solicitante"),
  );
  if (!filas.length) throw noEncontrado("No tienes una solicitud de esa persona");
  const [yo] = await perfiles([usuario.id]);
  await avisarA(id, "amistad_aceptada", { deId: usuario.id, deNombre: yo?.nombre ?? "" });
  return ok({ estado: "aceptada" });
});

/** Rechaza una solicitud, cancela la mía o elimina la amistad. */
export const DELETE = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const id = idValido((await params).id, "Persona");
  sinError(
    await supabaseAdmin()
      .from("friendships")
      .delete()
      .or(`and(solicitante.eq.${usuario.id},destinatario.eq.${id}),and(solicitante.eq.${id},destinatario.eq.${usuario.id})`),
  );
  return ok({ eliminado: id });
});
