import { idValido, ok, ruta, sinError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exigirUsuario } from "@/lib/supabase/auth";

type Ctx = { params: Promise<{ roomId: string }> };

/** Rechazar una invitación. */
export const DELETE = ruta(async (req: Request, { params }: Ctx) => {
  const usuario = await exigirUsuario(req);
  const roomId = idValido((await params).roomId, "Invitación");
  sinError(
    await supabaseAdmin().from("room_invites").update({ estado: "rechazada" }).eq("room_id", roomId).eq("invitado", usuario.id),
  );
  return ok({ rechazada: roomId });
});
