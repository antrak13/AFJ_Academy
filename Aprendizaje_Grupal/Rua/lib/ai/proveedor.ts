import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

// Único punto de contacto con el modelo (regla 32: la clave nunca sale del servidor).
// AI_PROVIDER elige el proveedor: "gemini", "anthropic" (por defecto) o "mock" (demo sin clave).
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
  if (proveedor === "gemini") return validarTexto(p.validar, await generarConGemini(p));
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
  return validarTexto(p.validar, texto);
}

function validarTexto<S extends z.ZodType>(validar: S, texto: string): z.infer<S> {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorIA("El modelo no devolvió JSON válido");
  }
  const r = validar.safeParse(datos);
  if (!r.success) throw new ErrorIA(`Respuesta del modelo fuera de esquema: ${r.error.message}`);
  return r.data;
}

/* ---------- Gemini (API de Google AI Studio / Gemini API) ---------- */

// GEMINI_MODELOS: lista separada por comas; si un modelo está saturado (429/503) se prueba el siguiente.
const modelosGemini = () =>
  (process.env.GEMINI_MODELOS ?? "gemini-3.5-flash,gemini-3.8-flash,gemini-2.5-flash")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

type RespuestaGemini = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string };
};

async function generarConGemini(p: { sistema: string; prompt: string; esquemaJSON: Record<string, unknown> }): Promise<string> {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) throw new ErrorIA("Falta GEMINI_API_KEY");
  let ultimo = "sin modelos configurados";
  for (const modelo of modelosGemini()) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: p.sistema }] },
        contents: [{ role: "user", parts: [{ text: p.prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: p.esquemaJSON, maxOutputTokens: 16000 },
      }),
      signal: AbortSignal.timeout(90_000),
    }).catch((e: Error) => e);
    if (r instanceof Error) { ultimo = `${modelo}: ${r.message}`; continue; }
    const datos = (await r.json().catch(() => ({}))) as RespuestaGemini;
    if (r.status === 429 || r.status >= 500) { ultimo = `${modelo}: ${datos.error?.message ?? r.status}`; continue; }
    if (!r.ok) throw new ErrorIA(`Gemini (${modelo}): ${datos.error?.message ?? r.status}`);
    if (datos.promptFeedback?.blockReason) throw new ErrorIA("El modelo rechazó la solicitud");
    const cand = datos.candidates?.[0];
    if (cand?.finishReason === "MAX_TOKENS") throw new ErrorIA("La respuesta del modelo quedó incompleta");
    if (cand?.finishReason === "SAFETY") throw new ErrorIA("El modelo rechazó la solicitud");
    return (cand?.content?.parts ?? []).filter((x) => !x.thought).map((x) => x.text ?? "").join("");
  }
  throw new ErrorIA(`Gemini no disponible: ${ultimo}`);
}
