// Revisa que .env.local esté completo y que Supabase, Realtime, LiveKit y la IA respondan.
// Uso: npm run verificar
import { createClient } from "@supabase/supabase-js";
import { RoomServiceClient } from "livekit-server-sdk";

let fallos = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const mal = (m) => { fallos++; console.log(`  ✗ ${m}`); };
const aviso = (m) => console.log(`  ! ${m}`);
const env = process.env;

console.log("Variables");
for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "AI_PROVIDER"]) {
  env[k] ? ok(k) : mal(`${k} vacía`);
}

console.log("Supabase");
if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  for (const [tabla, minimo] of [["topics", 1], ["videos", 1], ["checkpoints", 1], ["rooms", 0]]) {
    const { count, error } = await admin.from(tabla).select("*", { count: "exact", head: true });
    if (error) mal(`${tabla}: ${error.message} (¿corriste npm run db:aplicar?)`);
    else if (count < minimo) mal(`${tabla} vacía (¿falta el seed?)`);
    else ok(`${tabla}: ${count} filas`);
  }

  try {
    const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY } });
    const s = await r.json();
    if (!r.ok) mal(`anon key rechazada (${r.status})`);
    else {
      ok("anon key válida");
      s.mailer_autoconfirm ? ok("registro sin confirmar correo") : aviso("el registro pide confirmar correo (usa npm run db:usuarios o desactiva Confirm email)");
      s.external?.google ? ok("Google activado") : aviso("Google no activado (opcional)");
    }
  } catch (e) { mal(`Auth: ${e.message}`); }

  const canal = admin.channel("verificacion");
  try {
    const res = await canal.httpSend("ping", { t: Date.now() });
    res?.success === false ? mal(`Realtime: ${res.error ?? "falló"}`) : ok("Realtime Broadcast (httpSend)");
  } catch (e) { mal(`Realtime: ${e.message}`); }
  admin.removeChannel(canal);
}

console.log("LiveKit");
if (env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET) {
  try {
    const host = env.LIVEKIT_URL.replace(/^ws/, "http");
    const salas = await new RoomServiceClient(host, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET).listRooms();
    ok(`credenciales válidas (${salas.length} salas activas)`);
  } catch (e) { mal(`LiveKit: ${e.message}`); }
}

console.log("IA");
if (env.AI_PROVIDER === "mock") ok("AI_PROVIDER=mock (preguntas de ejemplo, sin costo)");
else if (env.AI_PROVIDER === "anthropic") env.ANTHROPIC_API_KEY ? ok("ANTHROPIC_API_KEY presente") : mal("ANTHROPIC_API_KEY vacía");

console.log(fallos ? `\n${fallos} problema(s).` : "\nTodo listo: npm run dev → http://localhost:3000/prueba/estudio-grupal.html");
process.exit(fallos ? 1 : 0);
