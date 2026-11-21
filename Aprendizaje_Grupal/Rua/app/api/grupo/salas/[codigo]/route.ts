import { ok, ruta, sinError, datos } from "@/lib/api";
import { calcularVentanas } from "@/lib/grupo/friccion";
import type { CtxSala } from "@/lib/grupo/http";
import { asegurarSesion, exigirMiembro, perfiles, salaPorCodigo } from "@/lib/grupo/repositorio";
import { MAX_INTEGRANTES } from "@/lib/grupo/salas";
import { nombreCanalSala } from "@/lib/realtime/sala";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/**
 * Todo lo que necesita la pantalla de la sala al cargar: sala, video, tema, integrantes,
 * sesión activa, puntos de control (sin respuesta) y zonas de fricción de la sesión.
 */
export const GET = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  const lista = await exigirMiembro(sala, usuario.id);
  const db = supabaseAdmin();

  const [video, tema, sesion, checkpoints, datosPerfiles] = await Promise.all([
    db.from("videos").select("id, url, titulo, duracion, licencia, orden").eq("id", sala.video_id).single().then(datos),
    db.from("topics").select("id, titulo, descripcion").eq("id", sala.topic_id).single().then(datos),
    asegurarSesion(sala.id, lista.length),
    db
      .from("checkpoints")
      .select("id, segundo, concept_id")
      .eq("video_id", sala.video_id)
      .order("segundo")
      .then(datos),
    perfiles(lista.map((m) => m.user_id)),
  ]);

  const [rondas, retrocesos, chat, invitados] = await Promise.all([
    sesion ? db.from("checkpoint_rounds").select("checkpoint_id, fase, resultado").eq("session_id", sesion.id).then(datos) : [],
    sesion ? db.from("rewind_events").select("user_id, ventana_inicio").eq("session_id", sesion.id).then(datos) : [],
    sesion
      ? db.from("chat_messages").select("id, user_id, texto, posicion, creado").eq("session_id", sesion.id).order("creado", { ascending: false }).limit(200).then(datos)
      : [],
    db.from("room_invites").select("invitado, estado").eq("room_id", sala.id).eq("estado", "pendiente").then(datos),
  ]);

  const perfilDe = new Map(datosPerfiles.map((p) => [p.id, p]));
  return ok({
    sala: { id: sala.id, codigo: sala.codigo, estado: sala.estado, anfitrion: sala.anfitrion, maxIntegrantes: MAX_INTEGRANTES },
    canal: nombreCanalSala(sala.id),
    video,
    tema,
    integrantes: lista.map((m) => ({
      userId: m.user_id,
      rol: m.rol,
      unidoEn: m.unido_en,
      nombre: perfilDe.get(m.user_id)?.nombre ?? "",
      avatar: perfilDe.get(m.user_id)?.avatar ?? null,
    })),
    sesion,
    // Solo el minuto de cada punto de control: la pregunta se pide al llegar (regla 18).
    checkpoints: checkpoints.map((c: { id: string; segundo: number; concept_id: string | null }) => ({
      ...c,
      ronda: rondas.find((r: { checkpoint_id: string }) => r.checkpoint_id === c.id) ?? null,
    })),
    chat: (chat as { id: string; user_id: string; texto: string; posicion: number; creado: string }[])
      .reverse()
      .map((c) => ({ id: c.id, userId: c.user_id, texto: c.texto, posicion: c.posicion, creado: c.creado })),
    invitadosPendientes: (invitados as { invitado: string }[]).map((i) => i.invitado),
    friccion: calcularVentanas(
      retrocesos.map((r: { user_id: string; ventana_inicio: number }) => ({ userId: r.user_id, ventanaInicio: r.ventana_inicio })),
    ),
  });
});
