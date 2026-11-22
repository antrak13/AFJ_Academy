import { normalizarLook } from './aprendin.js';
import { FASES } from './creador.js';

const FORMATO = 'aprendin';
const MAXIMO = 350_000;
const texto = (valor, max) => typeof valor === 'string' ? valor.trim().slice(0, max) : '';

function preparar(a) {
  const nombre = texto(a?.nombre, 20);
  const tema = texto(a?.tema, 80);
  if (!nombre || !tema || !Array.isArray(a.fases) || a.fases.length !== FASES) throw new Error('Falta el nombre, el tema o alguna fase del aprendín.');
  return {
    nombre,
    tema,
    mundo: texto(a.mundo, 40),
    de: texto(a.de, 55),
    personalidad: texto(a.personalidad, 160),
    mision: texto(a.mision, 240),
    saludo: texto(a.saludo, 200),
    fases: a.fases.map((fase, i) => {
      const look = fase?.look;
      if (!look || typeof look !== 'object' || Array.isArray(look)) throw new Error('El dibujo de una fase es inválido.');
      const titulo = texto(fase.titulo, 32) || (i ? `Fase ${i}` : 'Recién llegado');
      const concepto = i ? texto(fase.concepto, 80) || `Un paso más en ${tema}` : '';
      return { titulo, concepto, look: normalizarLook({ ...look, nombre }) };
    })
  };
}

export function descargarAprendin(a) {
  const personaje = preparar(a);
  const archivo = new Blob([JSON.stringify({ formato: FORMATO, version: 1, personaje })], { type: 'application/json' });
  if (archivo.size > MAXIMO) throw new Error('El diseño es demasiado grande para compartirlo.');
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${personaje.nombre.replace(/[^\p{L}\p{N}-]+/gu, '-')}.aprendin.json`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importarAprendin(archivo) {
  if (!archivo || archivo.size > MAXIMO) throw new Error('Elige un archivo de Aprendines de hasta 350 KB.');
  let datos;
  try { datos = JSON.parse(await archivo.text()); }
  catch { throw new Error('El archivo no contiene un aprendín válido.'); }
  if (datos?.formato !== FORMATO || datos.version !== 1) throw new Error('Elige un archivo descargado con «Compartir aprendín».');
  return preparar(datos.personaje);
}
