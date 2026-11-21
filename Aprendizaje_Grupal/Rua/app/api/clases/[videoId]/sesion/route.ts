import { conflicto, datos, idValido, noEncontrado, ok, ruta, sinError } from "@/lib/api";
import { asegurarSesion } from "@/lib/grupo/repositorio";
import { generarCodigo } from "@/lib/grupo/salas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

type Ctx = { params: Promise<{ videoId: string }> };

/**
 * Abrir una clase: devuelve mi sesión abierta de esa clase o crea una nueva (soy su anfitrión).
 * Después puedo invitar amigos a esa misma sesión.
 */
export const POST = ruta(async (req: Request, { params }: Ctx) => {
  const [usuario, videoId] = await Promise.all([exigirUsuario(req), params.then((p) => idValido(p.videoId, "Clase"))]);
  const db = supabaseAdmin();
  const video = sinError(await db.from("videos").select("id, topic_id").eq("id", videoId).maybeSingle<{ id: string; topic_id: string | null }>());
  if (!video?.topic_id) throw noEncontrado("Clase no encontrada");

  const mias = datos(await db.from("room_members").select("room_id").eq("user_id", usuario.id)).map((m) => m.room_id as string);
  if (mias.length) {
    const abierta = sinError(
      await db
        .from("rooms")
        .select("id, codigo")
        .in("id", mias)
        .eq("video_id", videoId)
        .eq("estado", "abierta")
        .order("creado", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; codigo: string }>(),
    );
    if (abierta) {
      await asegurarSesion(abierta.id);
      return ok({ codigo: abierta.codigo, nueva: false });
    }
  }

  for (let intento = 0; intento < 5; intento++) {
    const r = await db
      .from("rooms")
      .insert({ anfitrion: usuario.id, topic_id: video.topic_id, video_id: videoId, codigo: generarCodigo() })
      .select("id, codigo")
      .single<{ id: string; codigo: string }>();
    if (r.error?.code === "23505") continue;
    const sala = datos(r);
    sinError(await db.from("room_members").insert({ room_id: sala.id, user_id: usuario.id, rol: "anfitrion" }));
    await asegurarSesion(sala.id, 1);
    return ok({ codigo: sala.codigo, nueva: true }, 201);
  }
  throw conflicto("CODIGO_NO_DISPONIBLE", "No se pudo abrir la clase, intenta de nuevo");
});
