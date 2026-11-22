import "server-only";
import { conflicto, noEncontrado, prohibido, sinError, datos } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { emitir } from "@/lib/realtime/servidor";
import { exigirUsuario } from "@/lib/supabase/auth";
import { MIN_INTEGRANTES, normalizarCodigo, type Miembro } from "./salas";
import type { CheckpointCompleto } from "./control";

export type Sala = {
  id: string;
  anfitrion: string;
  topic_id: string;
  video_id: string;
  codigo: string;
  estado: "abierta" | "cerrada";
  creado: string;
};

export type Sesion = { id: string; room_id: string; iniciada_en: string; cerrada_en: string | null };

export type CheckpointFila = CheckpointCompleto & {
  video_id: string;
  concept_id: string | null;
  generado_por_ia: boolean;
  revisado: boolean;
};

const db = () => supabaseAdmin();

export async function salaPorCodigo(codigo: string): Promise<Sala> {
  const sala = sinError(
    await db().from("rooms").select("*").eq("codigo", normalizarCodigo(codigo)).maybeSingle<Sala>(),
  );
  if (!sala) throw noEncontrado("Sala no encontrada");
  return sala;
}

export async function miembros(roomId: string): Promise<Miembro[]> {
  return datos(
    await db()
      .from("room_members")
      .select("user_id, rol, unido_en")
      .eq("room_id", roomId)
      .order("unido_en", { ascending: true })
      .returns<Miembro[]>(),
  );
}

export async function exigirMiembro(sala: Sala, userId: string): Promise<Miembro[]> {
  const lista = await miembros(sala.id);
  if (!lista.some((m) => m.user_id === userId)) throw prohibido("No perteneces a esta sala");
  return lista;
}

/**
 * Las preguntas de los puntos de control las define la plataforma, no quienes estudian.
 * Mientras no exista un panel de administración, son administradoras las cuentas cuyo
 * correo está en ADMINS_PLATAFORMA (separados por comas).
 */
export function exigirAdminPlataforma(usuario: { email?: string }) {
  const admins = (process.env.ADMINS_PLATAFORMA ?? "").split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  if (!usuario.email || !admins.includes(usuario.email.toLowerCase())) {
    throw prohibido("Las preguntas las define la plataforma");
  }
}

export async function exigirAnfitrion(sala: Sala, userId: string): Promise<Miembro[]> {
  const lista = await exigirMiembro(sala, userId);
  if (sala.anfitrion !== userId) throw prohibido("Solo el anfitrión puede hacer esto");
  return lista;
}

/**
 * Usuario, sala e integrantes con las consultas independientes en paralelo. Si falta la
 * sesión responde 401 aunque la sala tampoco exista (no se revela qué salas hay).
 */
export async function accesoSala(req: Request, codigo: string, opciones: { anfitrion?: boolean; checkpointId?: string } = {}) {
  const [u, s] = await Promise.allSettled([exigirUsuario(req), salaPorCodigo(codigo)]);
  if (u.status === "rejected") throw u.reason;
  if (s.status === "rejected") throw s.reason;
  const usuario = u.value, sala = s.value;
  const [lista, cp] = await Promise.all([
    opciones.anfitrion ? exigirAnfitrion(sala, usuario.id) : exigirMiembro(sala, usuario.id),
    opciones.checkpointId ? checkpointDeSala(sala, opciones.checkpointId) : Promise.resolve(null),
  ]);
  return { usuario, sala, lista, cp };
}

export async function sesionActiva(roomId: string): Promise<Sesion | null> {
  return sinError(
    await db().from("room_sessions").select("*").eq("room_id", roomId).is("cerrada_en", null).maybeSingle<Sesion>(),
  );
}

/**
 * La sesión arranca sola con el primer integrante: nadie tiene que pulsar "iniciar".
 * Quien entra después se suma a la misma sesión, en vivo o a su propio ritmo. Si dos peticiones llegan a la vez, el índice único deja una sola sesión.
 */
export async function asegurarSesion(roomId: string, cantidadMiembros?: number): Promise<Sesion | null> {
  const actual = await sesionActiva(roomId);
  if (actual) return actual;
  const cantidad = cantidadMiembros ?? (await miembros(roomId)).length;
  if (cantidad < MIN_INTEGRANTES) return null;
  const abierta = sinError(await db().from("rooms").select("id").eq("id", roomId).eq("estado", "abierta").maybeSingle());
  if (!abierta) return null;
  const r = await db().from("room_sessions").insert({ room_id: roomId }).select("*").single<Sesion>();
  if (r.error?.code === "23505") return sesionActiva(roomId);
  const sesion = datos(r);
  await emitir(roomId, "sesion_iniciada", { sessionId: sesion.id });
  return sesion;
}

export async function exigirSesionActiva(roomId: string): Promise<Sesion> {
  const s = await asegurarSesion(roomId);
  if (!s) throw conflicto("SIN_SESION", "La sala está cerrada");
  return s;
}

export async function checkpointDeSala(sala: Sala, checkpointId: string): Promise<CheckpointFila> {
  const cp = sinError(
    await db()
      .from("checkpoints")
      .select("*")
      .eq("id", checkpointId)
      .eq("video_id", sala.video_id)
      .maybeSingle<CheckpointFila>(),
  );
  if (!cp) throw noEncontrado("Pregunta no encontrada en esta clase");
  return cp;
}

export async function perfiles(ids: string[]) {
  if (ids.length === 0) return [];
  return datos(
    await db()
      .from("profiles")
      .select("id, nombre, avatar, telemetria")
      .in("id", ids)
      .returns<{ id: string; nombre: string; avatar: string | null; telemetria: boolean }[]>(),
  );
}
