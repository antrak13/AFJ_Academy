import { ok, ruta, sinError } from "@/lib/api";
import type { CtxSala } from "@/lib/grupo/http";
import { exigirMiembro, salaPorCodigo } from "@/lib/grupo/repositorio";
import { elegirNuevoAnfitrion } from "@/lib/grupo/salas";
import { emitir } from "@/lib/realtime/servidor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

/**
 * Salir de la sala. Si sale el anfitrión, el rol pasa a quien lleva más tiempo (regla 4).
 * Si no queda nadie, la sala y su sesión se cierran.
 */
export const POST = ruta(async (req: Request, { params }: CtxSala) => {
  const usuario = await exigirUsuario(req);
  const sala = await salaPorCodigo((await params).codigo);
  const lista = await exigirMiembro(sala, usuario.id);
  const db = supabaseAdmin();

  sinError(await db.from("room_members").delete().eq("room_id", sala.id).eq("user_id", usuario.id));
  await emitir(sala.id, "integrante_salio", { userId: usuario.id });

  const restantes = lista.filter((m) => m.user_id !== usuario.id);
  if (restantes.length === 0) {
    const ahora = new Date().toISOString();
    sinError(await db.from("room_sessions").update({ cerrada_en: ahora }).eq("room_id", sala.id).is("cerrada_en", null));
    sinError(await db.from("rooms").update({ estado: "cerrada" }).eq("id", sala.id));
    return ok({ salaCerrada: true });
  }

  if (sala.anfitrion === usuario.id) {
    const nuevo = elegirNuevoAnfitrion(lista, usuario.id)!;
    sinError(await db.from("rooms").update({ anfitrion: nuevo }).eq("id", sala.id));
    sinError(await db.from("room_members").update({ rol: "anfitrion" }).eq("room_id", sala.id).eq("user_id", nuevo));
    await emitir(sala.id, "anfitrion_cambio", { anfitrion: nuevo });
    return ok({ salaCerrada: false, nuevoAnfitrion: nuevo });
  }
  return ok({ salaCerrada: false });
});
