import { NextResponse } from "next/server";
import type { z } from "zod";

/** Error de negocio con código estable para que el front pueda reaccionar sin leer el mensaje. */
export class ErrorApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export const noAutenticado = () => new ErrorApi(401, "NO_AUTENTICADO", "Inicia sesión para continuar");
export const prohibido = (m = "No tienes permiso para esta acción") => new ErrorApi(403, "PROHIBIDO", m);
export const noEncontrado = (m = "No encontrado") => new ErrorApi(404, "NO_ENCONTRADO", m);
export const conflicto = (codigo: string, m: string) => new ErrorApi(409, codigo, m);

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Envuelve un handler para convertir errores en respuestas JSON uniformes. */
export function ruta<C>(handler: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ErrorApi) {
        return NextResponse.json({ error: { codigo: e.codigo, mensaje: e.message } }, { status: e.status });
      }
      console.error(e);
      return NextResponse.json(
        { error: { codigo: "ERROR_INTERNO", mensaje: "Error interno" } },
        { status: 500 },
      );
    }
  };
}

export async function leerCuerpo<S extends z.ZodType>(req: Request, esquema: S): Promise<z.infer<S>> {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    cuerpo = {};
  }
  const r = esquema.safeParse(cuerpo);
  if (!r.success) {
    throw new ErrorApi(400, "DATOS_INVALIDOS", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return r.data;
}

type RespuestaSupabase<T> = { data: T; error: { message: string; code?: string } | null };

/** Lanza si Supabase devolvió error. Para escrituras y `maybeSingle` (el dato puede ser null). */
export function sinError<T>(r: RespuestaSupabase<T>): T {
  if (r.error) throw new Error(`Supabase: ${r.error.message}`);
  return r.data;
}

/** Como `sinError`, pero además exige dato (listas, `single`, `select` tras escribir). */
export function datos<T>(r: RespuestaSupabase<T>): NonNullable<T> {
  const d = sinError(r);
  if (d === null || d === undefined) throw new Error("Supabase: respuesta sin datos");
  return d as NonNullable<T>;
}

/** Valida un id que llega en la URL (evita filtros armados con texto arbitrario). */
export function idValido(v: string, que = "Recurso"): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) throw noEncontrado(`${que} no encontrado`);
  return v.toLowerCase();
}
