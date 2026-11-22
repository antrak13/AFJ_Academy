// Reglas de las aulas de Aprendines (vista docente). Funciones puras.
import { z } from "zod";

/** Las cuentas que crea el docente usan un correo interno: el alumno entra solo con usuario y PIN. */
export const DOMINIO_ALUMNOS = "alumnos.afj.local";
export const MAX_ALUMNOS_POR_LOTE = 45;

export const correoDeUsuario = (usuario: string) => `${usuario}@${DOMINIO_ALUMNOS}`;

/**
 * Usuario corto y fácil de escribir para un niño: primer nombre + inicial del apellido + 2 dígitos.
 * «María José Quispe» → «mariaq» + «27». Sin tildes, solo a-z y 0-9.
 */
export function usuarioBase(nombre: string): string {
  const partes = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const base = (partes[0] ?? "").slice(0, 10) + (partes.length > 1 ? partes[partes.length - 1][0] : "");
  return base || "alumno";
}

export function conSufijo(base: string, aleatorio: () => number = Math.random): string {
  return base + String(Math.floor(aleatorio() * 90) + 10);
}

/** PIN de 6 dígitos (Supabase pide al menos 6 caracteres de clave). */
export function generarPin(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 1_000_000).padStart(6, "0");
}

// Avance que manda la clase (js/avance-nube.js). Límites para que nadie suba datos enormes.
const turnoMedido = z.object({
  estado: z.enum(["empezando", "vago", "parcial", "error", "entendio"]),
  nota: z.string().max(240).default(""),
});
export const esquemaAvance = z.object({
  aprendinId: z.string().trim().min(1).max(80),
  nombre: z.string().trim().max(40).default(""),
  tema: z.string().trim().max(80).default(""),
  conceptos: z.array(z.string().trim().max(80)).max(4).default([]),
  paso: z.number().int().min(1).max(5),
  mensajes: z.number().int().min(0).max(2000).default(0),
  medicion: z.partialRecord(z.enum(["1", "2", "3", "4"]), z.array(turnoMedido).max(60)).default({}),
  prueba: z
    .object({
      intento: z.number().int().min(1).max(50),
      puntaje: z.number().int().min(0).max(20),
      n: z.number().int().min(0).max(20),
      aprobado: z.boolean(),
      salvadas: z.number().int().min(0).max(20),
      fallosPorPaso: z.partialRecord(z.enum(["1", "2", "3", "4"]), z.number().int().min(0).max(20)).default({}),
    })
    .nullable()
    .default(null),
});
export type Avance = z.infer<typeof esquemaAvance>;
