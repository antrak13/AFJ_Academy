import "server-only";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Canal personal de cada persona (avisos fuera de una sesión: invitaciones y amistades).
// El cliente se suscribe a `usuario:<su id>` al iniciar sesión.
export const nombreCanalUsuario = (userId: string) => `usuario:${userId}`;

export type EventoUsuario =
  | { evento: "invitacion"; payload: { roomId: string; codigo: string; clase: string; curso: string; deId: string; deNombre: string } }
  | { evento: "invitacion_cancelada"; payload: { roomId: string } }
  | { evento: "amistad_solicitada"; payload: { deId: string; deNombre: string } }
  | { evento: "amistad_aceptada"; payload: { deId: string; deNombre: string } };

type Nombre = EventoUsuario["evento"];
type Payload<E extends Nombre> = Extract<EventoUsuario, { evento: E }>["payload"];

export async function avisarA<E extends Nombre>(userId: string, evento: E, payload: Payload<E>) {
  const enviar = async () => {
    try {
      const r = await supabaseAdmin().channel(nombreCanalUsuario(userId)).httpSend(evento, payload);
      if (!r.success) console.error(`No se pudo avisar ${evento} a ${userId}: ${r.error}`);
    } catch (e) {
      console.error(`No se pudo avisar ${evento} a ${userId}`, e);
    }
  };
  try {
    after(enviar);
  } catch {
    await enviar();
  }
}
