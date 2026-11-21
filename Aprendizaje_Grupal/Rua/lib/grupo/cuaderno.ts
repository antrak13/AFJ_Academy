import { z } from "zod";

/** Etiquetas que puede llevar el texto de un bloque (barra B, I, </>). Sin atributos. */
const PERMITIDAS = new Set(["b", "strong", "i", "em", "code", "br"]);

/**
 * Deja solo formato básico: quita etiquetas no permitidas (conservando su texto), todos los
 * atributos y el contenido de script/style. El cliente aplica la misma regla al pintar.
 */
export function limpiarHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|template)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (etiqueta, nombre: string) => {
      const n = nombre.toLowerCase();
      if (!PERMITIDAS.has(n)) return "";
      if (n === "br") return "<br>";
      return etiqueta.startsWith("</") ? `</${n}>` : `<${n}>`;
    })
    .replace(/<(?![a-z/])/gi, "&lt;");
}

export const TIPOS_BLOQUE = ["titulo", "texto", "codigo", "fotograma"] as const;

export const esquemaBloque = z
  .object({
    orden: z.number().finite(),
    tipo: z.enum(TIPOS_BLOQUE),
    html: z.string().max(20000).default(""),
    imagen: z
      .string()
      .max(400000)
      .regex(/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/, "La imagen debe ser un fotograma en base64")
      .nullable()
      .optional(),
    segundo: z.number().min(0).nullable().optional(),
  })
  .refine((b) => b.tipo !== "fotograma" || !!b.imagen, { message: "Un fotograma necesita imagen", path: ["imagen"] });

export type BloqueEntrada = z.infer<typeof esquemaBloque>;

export type BloqueFila = {
  id: string;
  room_id: string;
  orden: number;
  tipo: (typeof TIPOS_BLOQUE)[number];
  html: string;
  imagen: string | null;
  segundo: number | null;
  autor: string;
  actualizado_por: string;
  actualizado: string;
};

/** Forma que recibe el cliente. */
export const vistaBloque = (b: BloqueFila) => ({
  id: b.id,
  orden: b.orden,
  tipo: b.tipo,
  html: b.html,
  imagen: b.imagen,
  segundo: b.segundo,
  autor: b.autor,
  actualizadoPor: b.actualizado_por,
  actualizado: b.actualizado,
});
