// Contrato del canal de Realtime de una sala. Lo comparten el servidor (que emite
// por Broadcast los cambios confirmados en Postgres) y el cliente.
//
// Presence solo dice quién está conectado (un `track` al entrar). La posición y el estado
// viajan por Broadcast (evento "estado") una vez por segundo: Supabase limita la frecuencia
// de Presence y cierra el canal si se llama a `track` cada segundo.
//
// Uso en el cliente:
//   const canal = supabase.channel(nombreCanalSala(roomId), { config: { presence: { key: userId } } });
//   canal.on("presence", { event: "sync" }, () => { quiénes = Object.keys(canal.presenceState()) });
//   canal.on("broadcast", { event: "estado" }, ({ payload }) => { ... EstadoIntegrante ... });
//   canal.on("broadcast", { event: "*" }, ({ event, payload }) => { ... EventoSala ... });
//   await canal.subscribe(); canal.track({ userId, nombre, avatar });
//   setInterval(() => canal.send({ type: "broadcast", event: "estado", payload: miEstado }), 1000);

export const nombreCanalSala = (roomId: string) => `sala:${roomId}`;

/** Lo que cada integrante emite por Broadcast cada segundo. No se guarda en base de datos. */
export type EstadoIntegrante = {
  userId: string;
  nombre: string;
  avatar: string | null;
  /** Posición en el video, en segundos. */
  posicion: number;
  estado: "viendo" | "pausado" | "escribiendo" | "hablando";
  cuadernoActivo: boolean;
  /** El video está detenido por la pausa automática de voz. */
  pausaPorVoz: boolean;
  /** Hizo un retroceso en los últimos segundos (para la causa "repasando"). */
  retrocedio: boolean;
  /** A quién estoy esperando (regla 8), si a alguien. */
  esperandoA: string | null;
  /** Bloque del cuaderno que está editando, si alguno. */
  editando?: string | null;
  enviadoEn: number;
};

/** Eventos que el servidor emite por Broadcast. Nunca incluyen votos antes de revelar. */
export type EventoSala =
  | { evento: "integrante_entro"; payload: { userId: string; nombre: string; avatar: string | null } }
  | { evento: "integrante_salio"; payload: { userId: string } }
  | { evento: "anfitrion_cambio"; payload: { anfitrion: string } }
  | { evento: "sesion_iniciada"; payload: { sessionId: string } }
  | { evento: "sesion_cerrada"; payload: { sessionId: string } }
  | { evento: "zona_friccion"; payload: { ventanaInicio: number; ventanaFin: number; retrocesos: number; integrantes: number; esZona: boolean } }
  | { evento: "voto_registrado"; payload: { checkpointId: string; userId: string; votantes: number; integrantes: number; revelarEn: string | null } }
  | { evento: "control_revelado"; payload: { checkpointId: string; fase: "debate" | "cerrada"; debateHasta: string | null } }
  | { evento: "voto_cambiado"; payload: { checkpointId: string; userId: string } }
  | { evento: "control_cerrado"; payload: { checkpointId: string; resultado: string } }
  | { evento: "checkpoints_actualizados"; payload: { videoId: string } }
  | { evento: "chat_mensaje"; payload: { id: string; userId: string; texto: string; posicion: number; creado: string } }
  | { evento: "invitacion_enviada"; payload: { invitados: string[]; por: string } };

export type NombreEvento = EventoSala["evento"];
export type PayloadDe<E extends NombreEvento> = Extract<EventoSala, { evento: E }>["payload"];
