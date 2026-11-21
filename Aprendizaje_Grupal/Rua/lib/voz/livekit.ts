import "server-only";
import { AccessToken, TrackSource } from "livekit-server-sdk";

/**
 * Token de LiveKit para la sala de voz. La sala de LiveKit usa el id de la sala de estudio.
 * Solo se publica y recibe audio: no hay grabación ni transcripción (regla 16).
 */
export async function tokenVoz(opts: { roomId: string; userId: string; nombre: string }) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    throw new Error("Faltan LIVEKIT_URL, LIVEKIT_API_KEY o LIVEKIT_API_SECRET");
  }
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: opts.userId,
    name: opts.nombre,
    ttl: "2h",
  });
  at.addGrant({
    room: `sala-${opts.roomId}`,
    roomJoin: true,
    canPublish: true,
    canPublishSources: [TrackSource.MICROPHONE],
    canSubscribe: true,
    canPublishData: false,
  });
  return { token: await at.toJwt(), url: LIVEKIT_URL, sala: `sala-${opts.roomId}` };
}
