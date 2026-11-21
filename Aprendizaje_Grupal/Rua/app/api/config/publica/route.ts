import { ok } from "@/lib/api";

/**
 * Configuración pública para páginas estáticas (por ejemplo /prueba/estudio-grupal.html).
 * Solo valores que ya son públicos: la URL de Supabase y la clave anon.
 */
export function GET() {
  return ok({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
  });
}
