#!/usr/bin/env python3
"""Worker local de transcripción con faster-whisper (sin llamadas a LLM)."""
import json
import os
import re
import sys
import wave
import numpy as np

MODELO_NOMBRE = os.environ.get("WHISPER_MODELO", "base")
DISPOSITIVO = os.environ.get("WHISPER_DISPOSITIVO", "cpu")
COMPUTO = os.environ.get("WHISPER_COMPUTO", "int8")
HILOS = int(os.environ.get("WHISPER_HILOS", "4"))


def idioma_corto(codigo: str) -> str:
    m = re.match(r"^([a-z]{2})", (codigo or "es").strip().lower())
    return m.group(1) if m else "es"


def leer_wav_16k(ruta: str) -> np.ndarray:
    """Lee un WAV PCM a un arreglo float32 mono de 16 kHz sin depender de PyAV."""
    with wave.open(ruta, "rb") as w:
        canales = w.getnchannels()
        ancho = w.getsampwidth()
        sr = w.getframerate()
        crudo = w.readframes(w.getnframes())
    if ancho == 2:
        audio = np.frombuffer(crudo, dtype="<i2").astype(np.float32) / 32768.0
    elif ancho == 1:
        audio = (np.frombuffer(crudo, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
    elif ancho == 4:
        audio = np.frombuffer(crudo, dtype="<i4").astype(np.float32) / 2147483648.0
    else:
        raise ValueError(f"formato WAV no soportado ({ancho * 8} bits)")
    if canales > 1:
        audio = audio.reshape(-1, canales).mean(axis=1)
    if sr != 16000 and audio.size > 0:
        n_out = max(1, round(audio.size * 16000 / sr))
        audio = np.interp(
            np.linspace(0, audio.size - 1, n_out, dtype=np.float32),
            np.arange(audio.size, dtype=np.float32),
            audio,
        ).astype(np.float32)
    return audio


def cargar_modelo():
    from faster_whisper import WhisperModel
    return WhisperModel(
        MODELO_NOMBRE,
        device=DISPOSITIVO,
        compute_type=COMPUTO,
        cpu_threads=HILOS,
    )


def main() -> int:
    if "--check" in sys.argv:
        import faster_whisper  # noqa: F401
        return 0

    modelo = cargar_modelo()
    for linea in sys.stdin:
        linea = linea.strip()
        if not linea:
            continue
        req_id = None
        try:
            pedido = json.loads(linea)
            req_id = pedido.get("id")
            audio = leer_wav_16k(str(pedido["ruta"]))
            lang = idioma_corto(str(pedido.get("idioma", "es")))
            segmentos, _ = modelo.transcribe(
                audio,
                language=lang,
                beam_size=3,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 300},
                condition_on_previous_text=False,
            )
            texto = " ".join(s.text.strip() for s in segmentos if s.text).strip()
            texto = re.sub(r"\s+", " ", texto)[:600]
            respuesta = {"id": req_id, "ok": True, "texto": texto}
        except Exception as exc:
            respuesta = {"id": req_id, "ok": False, "error": str(exc)}
        sys.stdout.write(json.dumps(respuesta, ensure_ascii=False) + "\n")
        sys.stdout.flush()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
