import { z } from "zod";
import { ErrorApi, leerCuerpo, ok, ruta, sinError, datos } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { accesoSala, exigirSesionActiva } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";

const cuerpo = z.object({
  posicion: z.number().min(0),
  inicio: z.string().datetime(),
  duracionMs: z.number().int().min(300).max(600000),
  checkpointId: z.string().uuid().nullable().optional(),
  tipo: z.enum(["audio/webm", "audio/ogg", "audio/mp4"]),
});

/**
 * Registra un clip de mi voz de una discusión y devuelve una URL firmada para subirlo.
 * Solo si acepté guardar mi voz (perfil `grabar_voz`): sin eso, la voz no sale de la llamada.
 */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const [{ usuario, sala }, c] = await Promise.all([accesoSala(req, (await params).codigo), leerCuerpo(req, cuerpo)]);
  const [consentimiento, sesion] = await Promise.all([
    supabaseAdmin().from("profiles").select("grabar_voz").eq("id", usuario.id).single<{ grabar_voz: boolean }>().then(datos),
    exigirSesionActiva(sala.id),
  ]);
  if (!consentimiento.grabar_voz) throw new ErrorApi(403, "SIN_CONSENTIMIENTO", "No aceptaste guardar tu voz");

  const ext = c.tipo === "audio/mp4" ? "m4a" : c.tipo === "audio/ogg" ? "ogg" : "webm";
  const ruta = `${sala.id}/${sesion.id}/${usuario.id}/${crypto.randomUUID()}.${ext}`;
  const db = supabaseAdmin();
  const subida = datos(await db.storage.from("grabaciones").createSignedUploadUrl(ruta));
  sinError(
    await db.from("voice_clips").insert({
      session_id: sesion.id,
      room_id: sala.id,
      user_id: usuario.id,
      video_id: sala.video_id,
      checkpoint_id: c.checkpointId ?? null,
      posicion: c.posicion,
      inicio: c.inicio,
      duracion_ms: c.duracionMs,
      ruta,
    }),
  );
  return ok({ ruta, token: subida.token, bucket: "grabaciones" }, 201);
});
