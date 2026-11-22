import { z } from "zod";
import { conflicto, ErrorApi, leerCuerpo, noEncontrado, ok, ruta, sinError } from "@/lib/api";
import { relacionesDe } from "@/lib/grupo/amigos";
import { perfiles } from "@/lib/grupo/repositorio";
import { avisarA } from "@/lib/realtime/usuario";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/** Mis amigos y las solicitudes pendientes (recibidas y enviadas). */
export const GET = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const rel = await relacionesDe(usuario.id);
  const otro = (r: (typeof rel)[number]) => (r.solicitante === usuario.id ? r.destinatario : r.solicitante);
  const datosPerfiles = new Map((await perfiles(rel.map(otro))).map((p) => [p.id, p]));
  const vista = (r: (typeof rel)[number]) => {
    const p = datosPerfiles.get(otro(r));
    return { id: otro(r), nombre: p?.nombre ?? "", avatar: p?.avatar ?? null, desde: r.creado };
  };
  return ok({
    amigos: rel.filter((r) => r.estado === "aceptada").map(vista),
    recibidas: rel.filter((r) => r.estado === "pendiente" && r.destinatario === usuario.id).map(vista),
    enviadas: rel.filter((r) => r.estado === "pendiente" && r.solicitante === usuario.id).map(vista),
  });
});

const cuerpo = z.object({ correo: z.string().email() });

/** Pide amistad por correo. Si la otra persona ya me la había pedido, queda aceptada. */
export const POST = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const { correo } = await leerCuerpo(req, cuerpo);
  const db = supabaseAdmin();
  const otroId = sinError(await db.rpc("perfil_por_correo", { p_correo: correo })) as string | null;
  if (!otroId) throw noEncontrado("No hay nadie con ese correo en la plataforma");
  if (otroId === usuario.id) throw new ErrorApi(400, "ES_USTED", "Ese correo es el tuyo");

  const previa = (await relacionesDe(usuario.id)).find((r) => r.solicitante === otroId || r.destinatario === otroId);
  const [yo] = await perfiles([usuario.id]);
  if (previa?.estado === "aceptada") throw conflicto("YA_SON_AMIGOS", "Ya son amigos");
  if (previa?.solicitante === otroId) {
    sinError(await db.from("friendships").update({ estado: "aceptada" }).eq("solicitante", otroId).eq("destinatario", usuario.id));
    await avisarA(otroId, "amistad_aceptada", { deId: usuario.id, deNombre: yo?.nombre ?? "" });
    return ok({ estado: "aceptada" });
  }
  if (previa) return ok({ estado: "pendiente" });
  sinError(await db.from("friendships").insert({ solicitante: usuario.id, destinatario: otroId }));
  await avisarA(otroId, "amistad_solicitada", { deId: usuario.id, deNombre: yo?.nombre ?? "" });
  return ok({ estado: "pendiente" }, 201);
});
