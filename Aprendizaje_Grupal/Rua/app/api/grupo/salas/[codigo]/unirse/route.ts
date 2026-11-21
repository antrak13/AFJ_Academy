import { conflicto, ok, prohibido, ruta, sinError } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { asegurarSesion, miembros, perfiles, salaPorCodigo } from "@/lib/grupo/repositorio";
import { MAX_INTEGRANTES } from "@/lib/grupo/salas";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/** Regla 2: se entra por invitación; el sexto intento se rechaza. Entrar dos veces no falla. */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  if (sala.estado === "cerrada") throw conflicto("SALA_CERRADA", "La sala está cerrada");

  const lista = await miembros(sala.id);
  if (lista.some((m) => m.user_id === usuario.id)) return ok({ sala: { id: sala.id, codigo: sala.codigo }, yaEstabas: true });
  // Solo se entra por invitación de alguien de la sesión (y esa persona es mi amigo).
  const invitacion = sinError(
    await supabaseAdmin().from("room_invites").select("estado").eq("room_id", sala.id).eq("invitado", usuario.id).maybeSingle(),
  );
  if (!invitacion) throw prohibido("Necesitas una invitación para unirte a esta sesión");
  if (lista.length >= MAX_INTEGRANTES) throw conflicto("SALA_LLENA", `La sala ya tiene ${MAX_INTEGRANTES} integrantes`);

  const r = await supabaseAdmin().from("room_members").insert({ room_id: sala.id, user_id: usuario.id, rol: "integrante" });
  if (r.error) {
    if (r.error.message.includes("SALA_LLENA")) throw conflicto("SALA_LLENA", `La sala ya tiene ${MAX_INTEGRANTES} integrantes`);
    if (r.error.code === "23505") return ok({ sala: { id: sala.id, codigo: sala.codigo }, yaEstabas: true });
    throw new Error(r.error.message);
  }

  sinError(await supabaseAdmin().from("room_invites").update({ estado: "aceptada" }).eq("room_id", sala.id).eq("invitado", usuario.id));
  const [perfil] = await perfiles([usuario.id]);
  await emitir(sala.id, "integrante_entro", { userId: usuario.id, nombre: perfil?.nombre ?? "", avatar: perfil?.avatar ?? null });
  await asegurarSesion(sala.id, lista.length + 1);
  return ok({ sala: { id: sala.id, codigo: sala.codigo }, yaEstabas: false }, 201);
});
