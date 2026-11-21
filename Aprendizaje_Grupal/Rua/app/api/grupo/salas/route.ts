import { asegurarSesion } from "@/lib/grupo/repositorio";
import { z } from "zod";
import { conflicto, leerCuerpo, noEncontrado, ok, ruta, sinError, datos } from "@/lib/api";
import { generarCodigo } from "@/lib/grupo/salas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

const cuerpo = z.object({ topic_id: z.string().uuid(), video_id: z.string().uuid() });

/** Crea una sala (regla 3: un video y un tema). Quien la crea es el anfitrión (regla 2). */
export const POST = ruta(async (req: Request) => {
  const usuario = await exigirUsuario(req);
  const { topic_id, video_id } = await leerCuerpo(req, cuerpo);
  const db = supabaseAdmin();

  const video = sinError(await db.from("videos").select("id, topic_id").eq("id", video_id).maybeSingle());
  if (!video) throw noEncontrado("Video no encontrado");
  const tema = sinError(await db.from("topics").select("id").eq("id", topic_id).maybeSingle());
  if (!tema) throw noEncontrado("Tema no encontrado");

  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigo();
    const r = await db
      .from("rooms")
      .insert({ anfitrion: usuario.id, topic_id, video_id, codigo })
      .select("*")
      .single();
    if (r.error?.code === "23505") continue; // código repetido
    const sala = datos(r);
    sinError(await db.from("room_members").insert({ room_id: sala.id, user_id: usuario.id, rol: "anfitrion" }));
    await asegurarSesion(sala.id, 1);
    return ok({ sala, enlace: `/grupo/${sala.codigo}` }, 201);
  }
  throw conflicto("CODIGO_NO_DISPONIBLE", "No se pudo generar un código de sala, intenta de nuevo");
});
