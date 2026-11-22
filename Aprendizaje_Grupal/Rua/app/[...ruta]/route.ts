import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Sirve las páginas estáticas del resto del equipo desde la misma origin que el estudio grupal,
 * para que todas compartan la sesión de Supabase (el login de Andre guarda la sesión en
 * localStorage, que es por origin):
 *
 *   /inicio.html, /login.html                        → raíz del repositorio (Andre)
 *   /Aprendizaje_Grupal/Andre/Oficial/**             → módulo social y clases (Andre)
 *   /Aprendizaje_Individual/**                       → aprendines (Freddy)
 *
 * Además reenvía la API del estudio individual (/api/estado, /api/turno…) a su servidor
 * (`node Aprendizaje_Individual/servidor.mjs`, por defecto en 127.0.0.1:8080). Si no está
 * levantado, esas páginas siguen en su modo sin IA.
 *
 * Las rutas propias (/api/grupo/*, /prueba/*, /comun/*) tienen prioridad sobre esta.
 */

export const dynamic = "force-dynamic";

const RAIZ = path.resolve(process.cwd(), process.env.RAIZ_REPO ?? "../..");
const INDIVIDUAL = process.env.INDIVIDUAL_URL ?? "http://127.0.0.1:8080";

const ARCHIVOS_RAIZ = new Set(["inicio.html", "login.html", "demov1.html"]);
const CARPETAS = ["Aprendizaje_Grupal/Andre/Oficial/", "Aprendizaje_Individual/"];
const PROHIBIDO = [/^Aprendizaje_Individual\/ia\//, /\.(mjs|md|jsonl|py)$/i, /(^|\/)\./, /(^|\/)node_modules\//, /(^|\/)package(-lock)?\.json$/];
const API_INDIVIDUAL = new Set(["estado", "preguntas", "aprendin", "turno", "ficha", "ficha-inicio", "examen", "transcribir"]);

const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

type Ctx = { params: Promise<{ ruta: string[] }> };

const noEncontrado = () => new Response("No encontrado", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

function permitido(rel: string): boolean {
  if (PROHIBIDO.some((re) => re.test(rel))) return false;
  return ARCHIVOS_RAIZ.has(rel) || CARPETAS.some((c) => rel.startsWith(c));
}

async function servir(segmentos: string[]): Promise<Response> {
  let rel = segmentos.map((s) => decodeURIComponent(s)).join("/");
  if (CARPETAS.some((c) => rel === c.slice(0, -1))) rel += "/";
  if (rel.endsWith("/")) rel += rel.startsWith("Aprendizaje_Individual/") ? "taller.html" : "futuro-yo-aprende.html";
  if (!permitido(rel)) return noEncontrado();

  const archivo = path.resolve(RAIZ, rel);
  if (!archivo.startsWith(RAIZ + path.sep)) return noEncontrado();
  try {
    if (!(await stat(archivo)).isFile()) return noEncontrado();
    const datos = await readFile(archivo);
    return new Response(new Uint8Array(datos), {
      headers: {
        "content-type": TIPOS[path.extname(archivo).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  } catch {
    return noEncontrado();
  }
}

async function reenviarIndividual(req: Request, nombre: string): Promise<Response> {
  const destino = new URL(`/api/${nombre}${new URL(req.url).search}`, INDIVIDUAL);
  try {
    const r = await fetch(destino, {
      method: req.method,
      headers: { "content-type": req.headers.get("content-type") ?? "application/json" },
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
      cache: "no-store",
    });
    return new Response(r.body, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" } });
  } catch {
    // El servidor de aprendines no está levantado: las páginas caen a su modo sin IA.
    if (nombre === "estado") return Response.json({ ia: false, sinServidor: true });
    return Response.json({ ok: false, error: "El servidor del estudio individual no está en marcha (node Aprendizaje_Individual/servidor.mjs)." }, { status: 503 });
  }
}

export async function GET(req: Request, { params }: Ctx) {
  const { ruta } = await params;
  if (ruta[0] === "api") return ruta.length === 2 && API_INDIVIDUAL.has(ruta[1]) ? reenviarIndividual(req, ruta[1]) : noEncontrado();
  return servir(ruta);
}

export async function POST(req: Request, { params }: Ctx) {
  const { ruta } = await params;
  if (ruta[0] === "api" && ruta.length === 2 && API_INDIVIDUAL.has(ruta[1])) return reenviarIndividual(req, ruta[1]);
  return noEncontrado();
}
