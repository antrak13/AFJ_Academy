import "server-only";
import { datos, sinError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Amistad = { solicitante: string; destinatario: string; estado: "pendiente" | "aceptada"; creado: string };

const db = () => supabaseAdmin();

/** Todas las relaciones de una persona (aceptadas y pendientes, en ambos sentidos). */
export async function relacionesDe(userId: string): Promise<Amistad[]> {
  return datos(
    await db()
      .from("friendships")
      .select("solicitante, destinatario, estado, creado")
      .or(`solicitante.eq.${userId},destinatario.eq.${userId}`)
      .returns<Amistad[]>(),
  );
}

/** Ids de los amigos aceptados. */
export async function amigosDe(userId: string): Promise<string[]> {
  return (await relacionesDe(userId))
    .filter((r) => r.estado === "aceptada")
    .map((r) => (r.solicitante === userId ? r.destinatario : r.solicitante));
}

export async function sonAmigos(a: string, b: string): Promise<boolean> {
  return !!sinError(await db().rpc("son_amigos", { a, b }));
}
