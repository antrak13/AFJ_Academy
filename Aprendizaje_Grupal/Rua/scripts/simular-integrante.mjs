// Simula a Beto en vivo, para probar con un solo navegador: espera a que lo invites a una clase
// (botón "Invitar amigos"), acepta, aparece conectado y atrasado en 0:20 "tomando notas", y
// escribe una nota en el cuaderno. Uso: npm run simular [-- milisegundos]   (antes: npm run db:usuarios)
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
const e = process.env;
const cli = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: s } = await cli.auth.signInWithPassword({ email: "beto@prueba.local", password: "prueba123" });
const tok = s.session.access_token, me = s.user.id;
const api = (r, m = "GET", b) => fetch(`http://localhost:3000/api${r}`, { method: m, headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" }, body: b && JSON.stringify(b) }).then((x) => x.json());
console.log("Beto espera tu invitación… (en la clase: Invitar amigos → Beto)");
let CODIGO = null;
while (!CODIGO) {
  const { invitaciones } = await api("/invitaciones");
  CODIGO = invitaciones[0]?.codigo ?? null;
  if (!CODIGO) await new Promise((r) => setTimeout(r, 2000));
}
await api(`/grupo/salas/${CODIGO}/unirse`, "POST");
const sala = await api(`/grupo/salas/${CODIGO}`);
console.log(`Beto está en la sala ${CODIGO}.`);
const ch = cli.channel(sala.canal, { config: { presence: { key: me }, broadcast: { self: false } } });
const vistos = [];
ch.on("broadcast", { event: "*" }, (m) => { if (m.event !== "estado") vistos.push(m.event); });
await new Promise((r) => ch.subscribe((st) => st === "SUBSCRIBED" && r()));
await ch.track({ userId: me, nombre: "Beto", avatar: null });
const bloque = randomUUID();
let editando = null;
const estado = () => ({ userId: me, nombre: "Beto", avatar: null, posicion: 20, estado: "escribiendo", cuadernoActivo: true, pausaPorVoz: false, retrocedio: false, esperandoA: null, editando, enviadoEn: Date.now() });
const t = setInterval(() => ch.send({ type: "broadcast", event: "estado", payload: estado() }), 1000);
await new Promise((r) => setTimeout(r, 5000));
editando = bloque;
const b = { id: bloque, orden: 1, tipo: "texto", html: "Bucle <b>ReAct</b>: Reasoning + Acting", imagen: null, segundo: null, autor: me, actualizadoPor: me };
await ch.send({ type: "broadcast", event: "nb_bloque", payload: { de: me, bloque: b } });
console.log("PUT", JSON.stringify(await api(`/grupo/salas/${CODIGO}/cuaderno/${bloque}`, "PUT", { orden: 1, tipo: "texto", html: b.html })).slice(0, 120));
await new Promise((r) => setTimeout(r, Number(process.argv[2] || 120000)));
clearInterval(t);
await api(`/grupo/salas/${CODIGO}/salir`, "POST");
console.log("eventos recibidos por Beto:", vistos.join(", "));
process.exit(0);
