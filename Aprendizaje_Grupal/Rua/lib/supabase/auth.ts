import "server-only";
import { noAutenticado } from "@/lib/api";
import { supabaseAdmin } from "./admin";
import { supabaseServidor } from "./server";

export type Usuario = { id: string; email?: string };

/**
 * Regla 1: todo requiere sesión. Acepta la cookie de Supabase (navegador) o
 * `Authorization: Bearer <access_token>` (pruebas con curl, otros clientes).
 *
 * Usa `getClaims`: con claves de firma asimétricas verifica el JWT localmente contra el JWKS
 * del proyecto (que queda en caché), sin un viaje al servidor de Auth en cada petición.
 */
export async function exigirUsuario(req: Request): Promise<Usuario> {
  const cabecera = req.headers.get("authorization");
  let claims;
  try {
    const r = cabecera?.toLowerCase().startsWith("bearer ")
      ? await supabaseAdmin().auth.getClaims(cabecera.slice(7).trim())
      : await (await supabaseServidor()).auth.getClaims();
    claims = r.error ? null : r.data?.claims;
  } catch {
    claims = null; // token malformado
  }
  if (!claims?.sub || claims.role !== "authenticated") throw noAutenticado();
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined };
}
