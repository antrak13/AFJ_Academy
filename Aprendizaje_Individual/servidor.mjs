#!/usr/bin/env node
// Servidor de Aprendines: sirve las páginas y conecta con la IA de Antigravity (agy2) para crear aprendines.
//
//   node servidor.mjs                           → http://localhost:8080
//   MODELO=gemini-3.8-flash-medium node servidor.mjs
//   AGY=agy node servidor.mjs                   → otro comando de Antigravity (por defecto agy2)
//   ENSAYO=1 node servidor.mjs                  → guarda cada aprendín y lo repite al instante si se pide igual (para ensayar el pitch)
//   PUERTO=8080 HOST=127.0.0.1                  → dónde escucha (HOST=0.0.0.0 para abrirlo en la red local)
//
// API
//   GET  /api/estado    → { ia, proveedor, modelo }
//   POST /api/aprendin  { gustos, tema } → { ok, aprendin, ia: { modelo, segundos, tokens } }
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, appendFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { esquemaAprendin, armarAprendin } from './js/creador.js';
import { CATALOGO } from './js/piezas.js';
import { PALETA } from './js/color.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PUERTO) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const AGY = process.env.AGY || 'agy2';
const MODELO = process.env.MODELO || 'gemini-3.8-flash-low';
const ENSAYO = process.env.ENSAYO === '1';
const LIMITE_S = 110;          // tiempo máximo de una respuesta de la IA
const MAX_A_LA_VEZ = 2;        // llamadas simultáneas a la IA
const CACHE = path.join(DIR, 'ia', 'cache');
const REGISTRO = path.join(DIR, 'ia', 'registro.jsonl');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };

/* ---------- ¿Está la IA? ---------- */
let iaDisponible = false;
const probar = spawn(AGY, ['--help'], { stdio: 'ignore' });
probar.on('error', () => { iaDisponible = false; console.log(`IA: no encontré «${AGY}». La página usará el creador sin IA.`); });
probar.on('close', code => { iaDisponible = code === 0; if (iaDisponible) console.log(`IA: ${AGY} · modelo ${MODELO}`); });

/* ---------- Pedido a la IA ---------- */
let activas = 0; const cola = [];
const turno = () => new Promise(ok => { if (activas < MAX_A_LA_VEZ) { activas++; ok(); } else cola.push(ok); });
const liberar = () => { const sig = cola.shift(); if (sig) sig(); else activas--; };

async function armarPrompt(gustos, tema) {
  const instrucciones = await readFile(path.join(DIR, 'ia', 'crear-aprendin.md'), 'utf8');
  const catalogo = Object.entries(CATALOGO).map(([zona, ps]) => `### ${zona}\n${ps.map(p => `- ${p.id}: ${p.nombre} (para: ${p.para})`).join('\n')}`).join('\n\n');
  return `${instrucciones}\n\n## Catálogo de piezas\n\n${catalogo}\n\n## Paleta de colores\n\n${Object.keys(PALETA).join(', ')}\n\n## Pedido\n\n- Gustos del estudiante: ${gustos}\n- Tema que le va a enseñar: ${tema}\n\nResponde solo con el JSON.`;
}

function correrIA(prompt) {
  return new Promise((ok, mal) => {
    mkdtemp(path.join(os.tmpdir(), 'aprendines-')).then(caja => {
      const args = ['-p', prompt, '--model', MODELO, '--output-format', 'json', '--json-schema', JSON.stringify(esquemaAprendin()), '--disable-slash-commands', '--print-timeout', `${LIMITE_S}s`];
      const hijo = spawn(AGY, args, { cwd: caja, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '', err = '';
      hijo.stdout.on('data', d => { out += d; });
      hijo.stderr.on('data', d => { err += d; });
      const reloj = setTimeout(() => hijo.kill('SIGTERM'), (LIMITE_S + 10) * 1000);
      const fin = () => { clearTimeout(reloj); rm(caja, { recursive: true, force: true }).catch(() => {}); };
      hijo.on('error', e => { fin(); mal(new Error(`no pude ejecutar ${AGY}: ${e.message}`)); });
      hijo.on('close', code => {
        fin();
        try {
          const j = JSON.parse(out);
          if (j.status && j.status !== 'SUCCESS') throw new Error(`la IA respondió ${j.status}`);
          const r = j.structured_output ?? JSON.parse(String(j.response || '').replace(/^```(json)?|```$/g, ''));
          ok({ r, segundos: j.duration_seconds, tokens: j.usage?.total_tokens });
        } catch (e) {
          const detalle = err.replace(/\x1b\[[0-9;]*m/g, '').trim().split('\n').slice(-2).join(' ').slice(0, 240);
          mal(new Error(detalle || e.message || `la IA terminó con código ${code}`));
        }
      });
    }, mal);
  });
}

async function crearConIA(gustos, tema) {
  const clave = createHash('sha1').update(`${MODELO}|${gustos.toLowerCase()}|${tema.toLowerCase()}`).digest('hex').slice(0, 16);
  const archivo = path.join(CACHE, `${clave}.json`);
  if (ENSAYO) { try { return { ...JSON.parse(await readFile(archivo, 'utf8')), ensayo: true }; } catch { /* no estaba guardado */ } }
  const t0 = Date.now();
  await turno();
  try {
    const { r, segundos, tokens } = await correrIA(await armarPrompt(gustos, tema));
    const aprendin = armarAprendin(r, { gustos, tema });
    const res = { aprendin, ia: { proveedor: AGY, modelo: MODELO, segundos: Math.round((Date.now() - t0) / 100) / 10, segundosModelo: segundos, tokens } };
    appendFile(REGISTRO, JSON.stringify({ fecha: new Date().toISOString(), gustos, tema, ...res.ia, nombre: aprendin.nombre }) + '\n').catch(() => {});
    if (ENSAYO) { await mkdir(CACHE, { recursive: true }); await writeFile(archivo, JSON.stringify(res)); }
    return res;
  } finally { liberar(); }
}

/* ---------- HTTP ---------- */
function leerCuerpo(req, max = 4096) {
  return new Promise((ok, mal) => {
    let s = '';
    req.on('data', d => { s += d; if (s.length > max) { mal(new Error('pedido demasiado grande')); req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { mal(new Error('JSON inválido')); } });
    req.on('error', mal);
  });
}
const json = (res, code, obj) => res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(obj));

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/estado') return json(res, 200, { ia: iaDisponible, proveedor: AGY, modelo: MODELO, ensayo: ENSAYO });
    if (url.pathname === '/api/aprendin') {
      if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'usa POST' });
      const { gustos, tema } = await leerCuerpo(req);
      const g = String(gustos || '').trim().slice(0, 160), t = String(tema || '').trim().slice(0, 80);
      if (!g || !t) return json(res, 400, { ok: false, error: 'faltan los gustos o el tema' });
      if (!iaDisponible) return json(res, 503, { ok: false, error: `no está disponible ${AGY}` });
      console.log(`→ creando aprendín · gustos: ${g} · tema: ${t}`);
      const r = await crearConIA(g, t);
      console.log(`← ${r.aprendin.nombre} (${r.ensayo ? 'ensayo guardado' : r.ia.segundos + ' s'})`);
      return json(res, 200, { ok: true, ...r });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { ok: false, error: 'método no permitido' });
    // archivos estáticos (sin salir de la carpeta y sin archivos ocultos ni la caché)
    const rel = decodeURIComponent(url.pathname === '/' ? '/taller.html' : url.pathname).replace(/^\/+/, '');
    const abs = path.resolve(DIR, rel);
    if (!abs.startsWith(DIR + path.sep) || rel.split('/').some(p => p.startsWith('.')) || abs.startsWith(CACHE) || abs === REGISTRO) return res.writeHead(404).end('no encontrado');
    const datos = await readFile(abs).catch(() => null);
    if (!datos) return res.writeHead(404).end('no encontrado');
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(req.method === 'HEAD' ? undefined : datos);
  } catch (e) {
    console.error('✗', e.message);
    if (!res.headersSent) json(res, 500, { ok: false, error: e.message });
  }
});

servidor.listen(PUERTO, HOST, () => console.log(`Aprendines: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PUERTO}${ENSAYO ? '  (modo ensayo: repite los aprendines guardados)' : ''}`));
