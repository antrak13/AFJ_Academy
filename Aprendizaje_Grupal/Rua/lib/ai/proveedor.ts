import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

// Único punto de contacto con el modelo (regla 32: la clave nunca sale del servidor).
// AI_PROVIDER elige el proveedor: "anthropic" (por defecto) o "mock" (demo sin clave).
// Regla 34: quien llama solo debe pasar tema, perfil de aprendizaje y fragmentos de
// material; nunca correo, nombre completo ni datos de contacto.

export const MODELO = process.env.AI_MODEL ?? "claude-opus-5-5";

export class ErrorIA extends Error {}

type PeticionJSON<S extends z.ZodType> = {
  sistema: string;
  prompt: string;
  /** JSON Schema que se envía como formato de salida estructurada. */
  esquemaJSON: Record<string, unknown>;
  /** Validación local de la respuesta (rangos, longitudes, coherencia). */
  validar: S;
  /** Respuesta para AI_PROVIDER=mock. */
  simulado: () => z.infer<S>;
};

let cliente: Anthropic | null = null;
const anthropic = () => (cliente ??= new Anthropic());

export async function generarJSON<S extends z.ZodType>(p: PeticionJSON<S>): Promise<z.infer<S>> {
  const proveedor = process.env.AI_PROVIDER ?? "anthropic";
  if (proveedor === "mock") return p.validar.parse(p.simulado());
  if (proveedor !== "anthropic") throw new ErrorIA(`Proveedor de IA no soportado: ${proveedor}`);

  const stream = anthropic().beta.messages.stream({
    model: MODELO,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: p.sistema,
    messages: [{ role: "user", content: p.prompt }],
    output_config: { effort: "medium", format: { type: "json_schema", schema: p.esquemaJSON } },
  });
  const respuesta = await stream.finalMessage();

  if (respuesta.stop_reason === "refusal") throw new ErrorIA("El modelo rechazó la solicitud");
  if (respuesta.stop_reason === "max_tokens") throw new ErrorIA("La respuesta del modelo quedó incompleta");

  const texto = respuesta.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorIA("El modelo no devolvió JSON válido");
  }
  const r = p.validar.safeParse(datos);
  if (!r.success) throw new ErrorIA(`Respuesta del modelo fuera de esquema: ${r.error.message}`);
  return r.data;
}
