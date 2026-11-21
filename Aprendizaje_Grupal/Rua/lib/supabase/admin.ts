import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

/** Cliente con service role. Solo servidor: salta RLS, así que cada ruta valida permisos antes. */
export function supabaseAdmin(): SupabaseClient {
  if (!cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !clave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    cliente = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cliente;
}
