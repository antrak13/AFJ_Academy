// Reglas de salas (2 a 4). Funciones puras.

/** La sesión empieza con quien entra primero; los demás se suman en vivo o la ven en diferido. */
export const MIN_INTEGRANTES = 1;
export const MAX_INTEGRANTES = 5;

// Sin 0/O ni 1/I para que el código se pueda dictar sin confusiones.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarCodigo(largo = 6): string {
  const bytes = new Uint8Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

export type Miembro = { user_id: string; rol: "anfitrion" | "integrante"; unido_en: string };

/**
 * Regla 4: si el anfitrión se desconecta, el rol pasa a quien lleva más tiempo en la sala.
 * `conectados` sale de Presence (lo envía el cliente); si viene vacío se usa a todos.
 * Devuelve null si no hay a quién pasarle el rol.
 */
export function elegirNuevoAnfitrion(miembros: Miembro[], salienteId: string, conectados?: string[]): string | null {
  const candidatos = miembros
    .filter((m) => m.user_id !== salienteId)
    .filter((m) => !conectados || conectados.length === 0 || conectados.includes(m.user_id))
    .sort((a, b) => new Date(a.unido_en).getTime() - new Date(b.unido_en).getTime());
  return candidatos[0]?.user_id ?? null;
}
