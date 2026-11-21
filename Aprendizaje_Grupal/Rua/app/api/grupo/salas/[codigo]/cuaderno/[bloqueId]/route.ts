import { z } from "zod";
import { leerCuerpo, noEncontrado, ok, prohibido, ruta, sinError, datos } from "@/lib/api";
import { esquemaBloque, limpiarHtml, vistaBloque, type BloqueFila } from "@/lib/grupo/cuaderno";
import { accesoSala } from "@/lib/grupo/repositorio";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ codigo: string; bloqueId: string }> };
const UUID = z.string().uuid();
const idBloque = (v: string) => {
  const r = UUID.safeParse(v);
  if (!r.success) throw noEncontrado("Bloque no encontrado");
  return r.data;
};

/** Crea o guarda un bloque. Cualquier integrante edita cualquier bloque (co-autoría). */
export const PUT = ruta(async (req: Request, { params }: Ctx) => {
  const p = await params;
  const bloqueId = idBloque(p.bloqueId);
  const [{ usuario, sala }, b] = await Promise.all([accesoSala(req, p.codigo), leerCuerpo(req, esquemaBloque)]);
  const db = supabaseAdmin();

  const previo = sinError(
    await db.from("room_notebook_blocks").select("room_id, autor").eq("id", bloqueId).maybeSingle<{ room_id: string; autor: string }>(),
  );
  if (previo && previo.room_id !== sala.id) throw prohibido("Ese bloque es de otra sala");

  const fila = datos(
    await db
      .from("room_notebook_blocks")
      .upsert({
        id: bloqueId,
        room_id: sala.id,
        orden: b.orden,
        tipo: b.tipo,
        html: b.tipo === "fotograma" ? "" : limpiarHtml(b.html),
        imagen: b.tipo === "fotograma" ? b.imagen : null,
        segundo: b.segundo ?? null,
        autor: previo?.autor ?? usuario.id,
        actualizado_por: usuario.id,
        actualizado: new Date().toISOString(),
      })
      .select("*")
      .single<BloqueFila>(),
  );
  return ok({ bloque: vistaBloque(fila) });
});

export const DELETE = ruta(async (req: Request, { params }: Ctx) => {
  const p = await params;
  const bloqueId = idBloque(p.bloqueId);
  const { sala } = await accesoSala(req, p.codigo);
  sinError(await supabaseAdmin().from("room_notebook_blocks").delete().eq("id", bloqueId).eq("room_id", sala.id));
  return ok({ borrado: bloqueId });
});
