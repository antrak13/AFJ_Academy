import { ok, ruta, datos } from "@/lib/api";
import { vistaBloque, type BloqueFila } from "@/lib/grupo/cuaderno";
import type { CtxSala } from "@/lib/grupo/http";
import { accesoSala } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Bloques del cuaderno del squad, en orden. */
export const GET = ruta(async (req: Request, { params }: CtxSala) => {
  const { sala } = await accesoSala(req, (await params).codigo);
  const filas = datos(
    await supabaseAdmin()
      .from("room_notebook_blocks")
      .select("*")
      .eq("room_id", sala.id)
      .order("orden", { ascending: true })
      .returns<BloqueFila[]>(),
  );
  return ok({ bloques: filas.map(vistaBloque) });
});
