// Pausa automática por voz (reglas 13 a 15), como máquina de estados pura.
// El cliente la alimenta con los oradores activos que reporta LiveKit y con un tick
// (por ejemplo cada 250 ms); aplica al <video> los efectos que devuelve `efectosVoz`.
// Regla 16: no se procesa, graba ni transcribe audio; solo se usa "quién habla".

export const VOLUMEN_HABLANDO = 0.15;
export const SILENCIO_PARA_REANUDAR_MS = 3000;
export const CUENTA_REGRESIVA_MS = 3000;

export type EstadoVoz =
  | { modo: "normal" }
  /** Alguien habla, o hubo voz hace menos de 3 s. */
  | { modo: "pausa_voz"; silencioDesde: number | null }
  /** Mostrando 3, 2, 1. */
  | { modo: "cuenta_regresiva"; inicio: number }
  /** Regla 15: "Mantener pausa". Solo vuelve con reanudación manual. */
  | { modo: "pausa_mantenida" };

export type EventoVoz =
  /** `reproduciendo`: si mi video estaba corriendo cuando llegó la voz. */
  | { tipo: "oradores"; hablando: boolean; reproduciendo: boolean; ahora: number }
  | { tipo: "tick"; ahora: number }
  | { tipo: "mantener_pausa" }
  | { tipo: "reanudar_manual" }
  | { tipo: "pausa_manual" };

export const estadoVozInicial: EstadoVoz = { modo: "normal" };

export function reducirVoz(estado: EstadoVoz, ev: EventoVoz): EstadoVoz {
  switch (ev.tipo) {
    case "reanudar_manual":
    case "pausa_manual":
      return { modo: "normal" };
    case "mantener_pausa":
      return estado.modo === "pausa_voz" || estado.modo === "cuenta_regresiva"
        ? { modo: "pausa_mantenida" }
        : estado;
    case "oradores":
      if (estado.modo === "pausa_mantenida") return estado;
      if (ev.hablando) {
        // Regla 13 (*): pausa incluso si el orador soy yo. Si yo ya había pausado a mano,
        // no se toma el control (no se debe reanudar algo que la persona detuvo).
        if (estado.modo === "normal" && !ev.reproduciendo) return estado;
        return { modo: "pausa_voz", silencioDesde: null };
      }
      if (estado.modo === "pausa_voz" && estado.silencioDesde === null) {
        return { modo: "pausa_voz", silencioDesde: ev.ahora };
      }
      return estado;
    case "tick":
      if (estado.modo === "pausa_voz" && estado.silencioDesde !== null) {
        if (ev.ahora - estado.silencioDesde >= SILENCIO_PARA_REANUDAR_MS) {
          return { modo: "cuenta_regresiva", inicio: ev.ahora };
        }
      }
      if (estado.modo === "cuenta_regresiva" && ev.ahora - estado.inicio >= CUENTA_REGRESIVA_MS) {
        return { modo: "normal" };
      }
      return estado;
  }
}

export type EfectosVoz = {
  /** El reproductor debe estar detenido por la voz. */
  pausado: boolean;
  /** Factor de volumen a aplicar sobre el volumen elegido por la persona. */
  volumen: number;
  /** 3, 2, 1 durante la cuenta regresiva; null en otro caso. */
  cuenta: number | null;
};

export function efectosVoz(estado: EstadoVoz, ahora: number): EfectosVoz {
  switch (estado.modo) {
    case "normal":
      return { pausado: false, volumen: 1, cuenta: null };
    case "pausa_voz":
    case "pausa_mantenida":
      return { pausado: true, volumen: VOLUMEN_HABLANDO, cuenta: null };
    case "cuenta_regresiva": {
      const restante = CUENTA_REGRESIVA_MS - (ahora - estado.inicio);
      return { pausado: true, volumen: VOLUMEN_HABLANDO, cuenta: Math.max(1, Math.ceil(restante / 1000)) };
    }
  }
}
