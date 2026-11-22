import { z } from "zod";
import { conflicto, ErrorApi, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import { amigosDe } from "@/lib/grupo/amigos";
import type { CtxSala } from "@/lib/grupo/http";
import { accesoSala, perfiles } from "@/lib/grupo/repositorio";
import { MAX_INTEGRANTES } from "@/lib/grupo/salas";
import { emitir } from "@/lib/realtime/servidor";
import { avisarA } from "@/lib/realtime/usuario";
import { supabaseAdmin } from "@/lib/supabase/admin";

const cuerpo = z.object({ amigos: z.array(z.string().uuid()).min(1).max(MAX_INTEGRANTES) });

/** Invita amigos a ver la clase conmigo, ahora. Les llega un aviso en vivo. */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const [{ usuario, sala, lista }, entrada] = await Promise.all([accesoSala(req, (await params).codigo), leerCuerpo(req, cuerpo)]);
  if (sala.estado === "cerrada") throw conflicto("SALA_CERRADA", "Esta sesión ya terminó");
  const mios = new Set(await amigosDe(usuario.id));
  const invitados = [...new Set(entrada.amigos)].filter((id) => !lista.some((m) => m.user_id === id));
  if (invitados.some((id) => !mios.has(id))) throw new ErrorApi(403, "NO_ES_AMIGO", "Solo puedes invitar a tus amigos");
  if (lista.length + invitados.length > MAX_INTEGRANTES) {
    throw conflicto("SALA_LLENA", `Una sesión admite hasta ${MAX_INTEGRANTES} personas`);
  }
  if (!invitados.length) return ok({ invitados: [] });

  const db = supabaseAdmin();
  sinError(
    await db.from("room_invites").upsert(
      invitados.map((id) => ({ room_id: sala.id, invitado: id, invitado_por: usuario.id, estado: "pendiente", creado: new Date().toISOString() })),
      { onConflict: "room_id,invitado" },
    ),
  );
  const [[yo], clase] = await Promise.all([
    perfiles([usuario.id]),
    db.from("videos").select("titulo, topics(titulo)").eq("id", sala.video_id).single<{ titulo: string; topics: { titulo: string } | null }>().then(datos),
  ]);
  await Promise.all(
    invitados.map((id) =>
      avisarA(id, "invitacion", {
        roomId: sala.id,
        codigo: sala.codigo,
        clase: clase.titulo,
        curso: clase.topics?.titulo ?? "",
        deId: usuario.id,
        deNombre: yo?.nombre ?? "",
      }),
    ),
  );
  await emitir(sala.id, "invitacion_enviada", { invitados, por: usuario.id });
  return ok({ invitados }, 201);
});
