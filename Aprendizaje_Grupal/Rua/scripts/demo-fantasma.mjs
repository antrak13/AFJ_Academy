// Crea una sesión ya terminada de Beto y Caro en la Clase 1 (el corazón), para ver el modo fantasma con Ana:
// recorrido, chat, votos con debate, zona de fricción, cuaderno y (opcional) clips de voz.
// Uso: npm run demo:fantasma   (usa los clips sintéticos de scripts/demo-audio)
//   beto1/caro1: discusión en 2:10 sobre venas y arterias; beto2/caro2: debate del punto de
//   control de 2:45. Voces sintéticas en inglés (como el audio de la clase); duración en <nombre>.dur.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const e = process.env, DIR = process.argv[2] ?? new URL("./demo-audio", import.meta.url).pathname;
const VIDEO = "00000000-0000-4000-8000-000000000101", CP = "00000000-0000-4000-8000-000000001001";
async function entrar(email) {
  const cli = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await cli.auth.signInWithPassword({ email, password: "prueba123" });
  const api = async (r, m = "GET", b) => {
    const x = await fetch(`http://localhost:3000/api${r}`, { method: m, headers: { authorization: `Bearer ${data.session.access_token}`, "content-type": "application/json" }, body: b && JSON.stringify(b) });
    const j = await x.json(); if (!x.ok) throw new Error(`${r}: ${JSON.stringify(j)}`); return j;
  };
  return { cli, api, id: data.user.id };
}
const beto = await entrar("beto@prueba.local"), caro = await entrar("caro@prueba.local");
const { codigo } = await beto.api(`/clases/${VIDEO}/sesion`, "POST");
await beto.api(`/grupo/salas/${codigo}/invitar`, "POST", { amigos: [caro.id] });
await caro.api(`/grupo/salas/${codigo}/unirse`, "POST");
console.log("sesión", codigo);

const t0 = Date.now() - 15 * 60 * 1000;
// Recorrido: ven la clase desde 0; en 2:10 se pausan 12 s a discutir; en 2:45 el punto de control (30 s).
function recorrido(retraso) {
  const m = []; let pos = 0;
  for (let t = 0; t <= 360; t++) {
    let est = 0;
    if (pos >= 130 && pos < 130.5 && t < 142 + retraso) est = 3;
    else if (pos >= 165 && pos < 165.5 && t < 189 + retraso) est = 1;
    else if (pos < 470) pos += 1;
    if (t < retraso) { pos = 0; est = 1; }
    m.push([t * 1000, Math.round(pos * 10) / 10, est]);
  }
  return m;
}
for (const [quien, retraso] of [[beto, 0], [caro, 6]]) {
  const muestras = recorrido(retraso);
  for (let i = 0; i < muestras.length; i += 120)
    await quien.api(`/grupo/salas/${codigo}/recorrido`, "POST", { iniciado: new Date(t0 + retraso * 1000).toISOString(), muestras: muestras.slice(i, i + 120) });
}
await beto.api(`/grupo/salas/${codigo}/chat`, "POST", { texto: "El dibujo de las cuatro cámaras ayuda mucho", posicion: 40 });
await caro.api(`/grupo/salas/${codigo}/chat`, "POST", { texto: "Ojo: vena = hacia el corazón, aunque lleve oxígeno", posicion: 128 });
await caro.api(`/grupo/salas/${codigo}/chat`, "POST", { texto: "Yo dudé: pensé que era por el oxígeno", posicion: 168 });
await beto.api(`/grupo/salas/${codigo}/chat`, "POST", { texto: "Aquí se entiende por qué la tricúspide va a la derecha", posicion: 245 });

async function clip(quien, archivo, posicion, inicioMs, checkpointId = null) {
  if (!DIR) return;
  const dur = Math.round(Number(readFileSync(`${DIR}/${archivo}.dur`, "utf8")) * 1000);
  const r = await quien.api(`/grupo/salas/${codigo}/voz/clip`, "POST", { posicion, inicio: new Date(inicioMs).toISOString(), duracionMs: dur, checkpointId, tipo: "audio/webm" });
  const up = await quien.cli.storage.from(r.bucket).uploadToSignedUrl(r.ruta, r.token, new Blob([readFileSync(`${DIR}/${archivo}.webm`)], { type: "audio/webm" }), { contentType: "audio/webm" });
  if (up.error) throw up.error;
}
await clip(beto, "beto1", 130, t0 + 131000);
await clip(caro, "caro1", 130.3, t0 + 136500);
await clip(beto, "beto2", 165, t0 + 172000, CP);
await clip(caro, "caro2", 165, t0 + 178000, CP);

// Punto de control de 2:45 (vena vs. arteria): Beto acierta (A); Caro vota B y en el debate cambia a A.
await beto.api(`/grupo/salas/${codigo}/checkpoints/${CP}/voto`, "POST", { opcion: 0 });
await caro.api(`/grupo/salas/${codigo}/checkpoints/${CP}/voto`, "POST", { opcion: 1 });
await caro.api(`/grupo/salas/${codigo}/checkpoints/${CP}/voto`, "POST", { opcion: 0 });
await beto.api(`/grupo/salas/${codigo}/checkpoints/${CP}/cerrar`, "POST");

// Los dos repasan la definición de vena y arteria: queda una zona de fricción en 2:00-2:30.
await beto.api(`/grupo/salas/${codigo}/friccion`, "POST", { desde: 140, hasta: 121 });
await caro.api(`/grupo/salas/${codigo}/friccion`, "POST", { desde: 138, hasta: 124 });

await caro.api(`/grupo/salas/${codigo}/cuaderno/${randomUUID()}`, "PUT", { orden: 1, tipo: "titulo", html: "Circulación por el corazón" });
await beto.api(`/grupo/salas/${codigo}/cuaderno/${randomUUID()}`, "PUT", { orden: 2, tipo: "texto", html: "Vena = <b>hacia</b> el corazón; arteria = <b>lejos</b> del corazón. No depende del oxígeno." });
await caro.api(`/grupo/salas/${codigo}/cuaderno/${randomUUID()}`, "PUT", { orden: 3, tipo: "texto", html: "Derecha: vena cava → aurícula derecha → <b>tricúspide</b> → ventrículo derecho → válvula pulmonar → pulmones." });
await beto.api(`/grupo/salas/${codigo}/cuaderno/${randomUUID()}`, "PUT", { orden: 4, tipo: "texto", html: "Izquierda: pulmones → aurícula izquierda → <b>mitral</b> → ventrículo izquierdo → válvula aórtica → aorta." });

await caro.api(`/grupo/salas/${codigo}/salir`, "POST");
await beto.api(`/grupo/salas/${codigo}/salir`, "POST");
console.log("listo");
process.exit(0);
