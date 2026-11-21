import "server-only";
import { datos } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { amigosDe } from "./amigos";
import { calcularVentanas } from "./friccion";
import { vistaBloque, type BloqueFila } from "./cuaderno";
import { perfiles } from "./repositorio";

// Sesiones fantasma: cuando abro una clase que mis amigos ya vieron, recibo su recorrido,
// su chat, su cuaderno y los clips de voz de sus discusiones. Solo se incluye lo de personas
// que son mis amigos: si un amigo vio la clase con alguien que no conozco, esa persona no aparece.

const db = () => supabaseAdmin();
const MAX_SESIONES = 8;

type Pista = { session_id: string; user_id: string; room_id: string; iniciado: string; muestras: [number, number, number][] };

/** Resumen de fantasmas por clase, para el listado de un curso. */
export async function resumenFantasmas(userId: string, videoIds: string[]) {
  const amigos = await amigosDe(userId);
  if (!amigos.length || !videoIds.length) return new Map<string, { sessionId: string; fecha: string; personas: string[] }[]>();
  const filas = datos(
    await db()
      .from("session_tracks")
      .select("session_id, user_id, video_id, iniciado")
      .in("video_id", videoIds)
      .in("user_id", amigos)
      .order("iniciado", { ascending: false })
      .returns<{ session_id: string; user_id: string; video_id: string; iniciado: string }[]>(),
  );
  const porVideo = new Map<string, Map<string, { sessionId: string; fecha: string; personas: string[] }>>();
  for (const f of filas) {
    const sesiones = porVideo.get(f.video_id) ?? new Map();
    const s = sesiones.get(f.session_id) ?? { sessionId: f.session_id, fecha: f.iniciado, personas: [] };
    if (!s.personas.includes(f.user_id)) s.personas.push(f.user_id);
    sesiones.set(f.session_id, s);
    porVideo.set(f.video_id, sesiones);
  }
  return new Map([...porVideo].map(([v, m]) => [v, [...m.values()]]));
}

/** Todo lo necesario para ver una clase con los fantasmas de mis amigos. */
export async function fantasmasDeClase(userId: string, videoId: string, excluirSesion?: string) {
  const amigos = await amigosDe(userId);
  if (!amigos.length) return [];
  let pistas = datos(
    await db()
      .from("session_tracks")
      .select("session_id, user_id, room_id, iniciado, muestras")
      .eq("video_id", videoId)
      .in("user_id", amigos)
      .order("iniciado", { ascending: false })
      .returns<Pista[]>(),
  ).filter((p) => p.session_id !== excluirSesion && p.muestras.length > 1);
  const sesionesIds = [...new Set(pistas.map((p) => p.session_id))].slice(0, MAX_SESIONES);
  pistas = pistas.filter((p) => sesionesIds.includes(p.session_id));
  if (!sesionesIds.length) return [];
  const roomIds = [...new Set(pistas.map((p) => p.room_id))];

  const [sesiones, chat, clips, bloques, gente, retrocesos] = await Promise.all([
    db().from("room_sessions").select("id, room_id, iniciada_en, cerrada_en").in("id", sesionesIds).returns<{ id: string; room_id: string; iniciada_en: string; cerrada_en: string | null }[]>().then(datos),
    db().from("chat_messages").select("id, session_id, user_id, texto, posicion, creado").in("session_id", sesionesIds).in("user_id", amigos).order("creado").returns<{ id: string; session_id: string; user_id: string; texto: string; posicion: number; creado: string }[]>().then(datos),
    db().from("voice_clips").select("id, session_id, user_id, checkpoint_id, posicion, inicio, duracion_ms, ruta").in("session_id", sesionesIds).in("user_id", amigos).order("inicio").returns<{ id: string; session_id: string; user_id: string; checkpoint_id: string | null; posicion: number; inicio: string; duracion_ms: number; ruta: string }[]>().then(datos),
    db().from("room_notebook_blocks").select("*").in("room_id", roomIds).in("autor", amigos).order("orden").returns<BloqueFila[]>().then(datos),
    perfiles([...new Set(pistas.map((p) => p.user_id))]),
    db().from("rewind_events").select("session_id, user_id, ventana_inicio").in("session_id", sesionesIds).in("user_id", amigos).returns<{ session_id: string; user_id: string; ventana_inicio: number }[]>().then(datos),
  ]);

  const urls = new Map<string, string>();
  if (clips.length) {
    const firmadas = await db().storage.from("grabaciones").createSignedUrls(clips.map((c) => c.ruta), 60 * 60 * 3);
    for (const f of firmadas.data ?? []) if (f.path && f.signedUrl) urls.set(f.path, f.signedUrl);
  }
  const perfilDe = new Map(gente.map((p) => [p.id, p]));

  return sesiones
    .sort((a, b) => b.iniciada_en.localeCompare(a.iniciada_en))
    .map((s) => ({
      sessionId: s.id,
      fecha: s.iniciada_en,
      terminada: !!s.cerrada_en,
      participantes: pistas
        .filter((p) => p.session_id === s.id)
        .map((p) => ({
          userId: p.user_id,
          nombre: perfilDe.get(p.user_id)?.nombre ?? "",
          avatar: perfilDe.get(p.user_id)?.avatar ?? null,
          iniciado: p.iniciado,
          muestras: p.muestras,
        })),
      chat: chat.filter((c) => c.session_id === s.id).map((c) => ({ id: c.id, userId: c.user_id, texto: c.texto, posicion: c.posicion, creado: c.creado })),
      clips: clips
        .filter((c) => c.session_id === s.id && urls.has(c.ruta))
        .map((c) => ({ id: c.id, userId: c.user_id, checkpointId: c.checkpoint_id, posicion: c.posicion, inicio: c.inicio, duracionMs: c.duracion_ms, url: urls.get(c.ruta)! })),
      cuaderno: bloques.filter((b) => b.room_id === s.room_id).map(vistaBloque),
      friccion: calcularVentanas(
        retrocesos.filter((r) => r.session_id === s.id).map((r) => ({ userId: r.user_id, ventanaInicio: r.ventana_inicio })),
      ),
    }));
}

/**
 * Votos de mis amigos en un punto de control (regla 19: a ciegas). Solo se entregan si yo
 * ya respondí ese punto de control.
 */
export async function votosFantasma(userId: string, checkpointId: string, sesionesIds: string[]) {
  const mios = datos(await db().from("votes").select("round_id").eq("user_id", userId).eq("checkpoint_id", checkpointId));
  if (!mios.length) return null;
  const amigos = await amigosDe(userId);
  if (!amigos.length || !sesionesIds.length) return [];
  const rondas = datos(
    await db()
      .from("checkpoint_rounds")
      .select("id, session_id, fase, resultado, votos_divididos")
      .eq("checkpoint_id", checkpointId)
      .in("session_id", sesionesIds)
      .returns<{ id: string; session_id: string; fase: string; resultado: string | null; votos_divididos: boolean }[]>(),
  ).filter((r) => r.fase === "cerrada");
  if (!rondas.length) return [];
  const votos = datos(
    await db()
      .from("votes")
      .select("round_id, user_id, voto_inicial, voto_final")
      .in("round_id", rondas.map((r) => r.id))
      .in("user_id", amigos)
      .returns<{ round_id: string; user_id: string; voto_inicial: number; voto_final: number | null }[]>(),
  );
  return rondas.map((r) => ({
    sessionId: r.session_id,
    resultado: r.resultado,
    votosDivididos: r.votos_divididos,
    votos: votos.filter((v) => v.round_id === r.id).map((v) => ({ userId: v.user_id, inicial: v.voto_inicial, final: v.voto_final ?? v.voto_inicial })),
  }));
}
