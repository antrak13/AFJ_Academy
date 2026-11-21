import "server-only";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nombreCanalSala, type NombreEvento, type PayloadDe } from "./sala";

/**
 * Emite un evento por Broadcast a la sala desde el servidor (vía HTTP, sin suscribirse).
 * Se envía con `after`, cuando la respuesta ya salió: quien hizo la petición no espera el
 * viaje a Realtime. Un fallo de Realtime no tumba la operación: el estado ya quedó en
 * Postgres y el cliente puede volver a leerlo.
 */
export async function emitir<E extends NombreEvento>(roomId: string, evento: E, payload: PayloadDe<E>) {
  const enviar = async () => {
    try {
      const r = await supabaseAdmin().channel(nombreCanalSala(roomId)).httpSend(evento, payload);
      if (!r.success) console.error(`No se pudo emitir ${evento} a la sala ${roomId}: ${r.error}`);
    } catch (e) {
      console.error(`No se pudo emitir ${evento} a la sala ${roomId}`, e);
    }
  };
  try {
    after(enviar);
  } catch {
    await enviar(); // fuera de una petición (scripts, pruebas)
  }
}
