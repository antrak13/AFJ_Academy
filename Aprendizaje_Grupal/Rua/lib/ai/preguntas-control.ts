import "server-only";
import { z } from "zod";
import { esquemaCheckpoint } from "@/lib/grupo/control";
import { generarJSON } from "./proveedor";

// Sección 2.3: la IA genera las preguntas de los puntos de control a partir del material
// del tema, antes de la sesión. Quedan con revisado=false hasta que el anfitrión las acepte.

export type EntradaPreguntas = {
  tema: { titulo: string; descripcion: string };
  conceptos: { id: string; nombre: string }[];
  video: { titulo: string; duracion: number };
  /** Fragmentos del material del tema (texto), si los hay. */
  fragmentos: string[];
  cantidad: number;
};

const respuestaModelo = z.object({
  sin_cobertura: z.boolean(),
  preguntas: z.array(
    z.object({
      segundo: z.number().int().min(0),
      pregunta: z.string(),
      opciones: z.array(z.string()),
      correcta: z.number().int(),
      explicacion: z.string(),
      concepto: z.string().nullable(),
      fragmento: z.number().int().nullable(),
    }),
  ),
});

const esquemaJSON = {
  type: "object",
  additionalProperties: false,
  required: ["sin_cobertura", "preguntas"],
  properties: {
    sin_cobertura: { type: "boolean" },
    preguntas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["segundo", "pregunta", "opciones", "correcta", "explicacion", "concepto", "fragmento"],
        properties: {
          segundo: { type: "integer" },
          pregunta: { type: "string" },
          opciones: { type: "array", items: { type: "string" } },
          correcta: { type: "integer" },
          explicacion: { type: "string" },
          concepto: { type: ["string", "null"] },
          fragmento: { type: ["integer", "null"] },
        },
      },
    },
  },
};

const SISTEMA = `Preparas preguntas de control para una sesión de estudio en grupo sobre un video.
Cada pregunta se muestra pausando el video en un segundo dado; el grupo vota a ciegas y, si hay desacuerdo, debate 90 segundos.
Escribe en español neutro. Cada pregunta tiene de 2 a 4 opciones, una sola correcta (índice desde 0) y una explicación breve.
Buenas preguntas generan desacuerdo razonable: prueban comprensión, no memoria literal; los distractores son errores comunes plausibles.
Usa solo lo que dicen los fragmentos de material. Indica en "fragmento" el índice del fragmento que respalda la respuesta.
Si el material no alcanza para una pregunta bien fundada, no la inventes: devuelve menos preguntas y marca sin_cobertura en true.
Reparte los segundos a lo largo del video, separados al menos 60 segundos y dentro de su duración.
En "concepto" usa exactamente uno de los nombres de concepto dados, o null.`;

export async function generarPreguntasControl(e: EntradaPreguntas) {
  const prompt = [
    `Tema: ${e.tema.titulo}`,
    e.tema.descripcion && `Descripción: ${e.tema.descripcion}`,
    `Video: ${e.video.titulo} (${e.video.duracion} segundos)`,
    `Conceptos: ${e.conceptos.map((c) => c.nombre).join(", ") || "(ninguno)"}`,
    `Cantidad de preguntas: ${e.cantidad}`,
    "",
    "Fragmentos del material:",
    e.fragmentos.length
      ? e.fragmentos.map((f, i) => `[${i}] ${f}`).join("\n\n")
      : "(no hay material cargado; usa solo la descripción del tema y marca sin_cobertura si no alcanza)",
  ]
    .filter(Boolean)
    .join("\n");

  const r = await generarJSON({
    sistema: SISTEMA,
    prompt,
    esquemaJSON,
    validar: respuestaModelo,
    simulado: () => ({
      sin_cobertura: false,
      preguntas: Array.from({ length: e.cantidad }, (_, i) => ({
        segundo: Math.round(((i + 1) * e.video.duracion) / (e.cantidad + 1)),
        pregunta: `Pregunta simulada ${i + 1} sobre ${e.tema.titulo}`,
        opciones: ["Opción A", "Opción B", "Opción C"],
        correcta: i % 3,
        explicacion: "Explicación simulada.",
        concepto: e.conceptos[i % Math.max(1, e.conceptos.length)]?.nombre ?? null,
        fragmento: null,
      })),
    }),
  });

  const porNombre = new Map(e.conceptos.map((c) => [c.nombre.toLowerCase(), c.id]));
  // Se descartan las que no cumplen la regla 17 o quedan fuera del video.
  const validas = r.preguntas
    .map((p) => ({
      segundo: p.segundo,
      pregunta: p.pregunta,
      opciones: p.opciones,
      correcta: p.correcta,
      explicacion: p.explicacion,
      concept_id: p.concepto ? porNombre.get(p.concepto.toLowerCase()) ?? null : null,
      fragmento: p.fragmento,
    }))
    .filter((p) => p.segundo < e.video.duracion && esquemaCheckpoint.safeParse(p).success);

  return { sinCobertura: r.sin_cobertura, preguntas: validas };
}
