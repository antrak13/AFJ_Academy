// Crea cuentas de prueba ya confirmadas (sin correo), con la telemetría y la grabación de voz
// aceptadas, y las hace amigas entre sí.
// Uso: npm run db:usuarios   → ana@prueba.local, beto@prueba.local, caro@prueba.local / clave: prueba123
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const sb = createClient(url, clave, { auth: { persistSession: false } });

const CLAVE = "prueba123";
const personas = [
  { email: "ana@prueba.local", nombre: "Ana" },
  { email: "beto@prueba.local", nombre: "Beto" },
  { email: "caro@prueba.local", nombre: "Caro" },
];

const { data: lista, error: errLista } = await sb.auth.admin.listUsers({ perPage: 1000 });
const ids = [];
if (errLista) throw errLista;

for (const p of personas) {
  let usuario = lista.users.find((u) => u.email === p.email);
  if (!usuario) {
    const { data, error } = await sb.auth.admin.createUser({
      email: p.email,
      password: CLAVE,
      email_confirm: true,
      user_metadata: { full_name: p.nombre },
    });
    if (error) throw error;
    usuario = data.user;
    console.log(`✓ creada ${p.email}`);
  } else {
    console.log(`· ya existía ${p.email}`);
  }
  const { error } = await sb.from("profiles").upsert({ id: usuario.id, nombre: p.nombre, telemetria: true, grabar_voz: true });
  if (error) throw error;
  ids.push(usuario.id);
}

for (let i = 0; i < ids.length; i++)
  for (let j = i + 1; j < ids.length; j++) {
    const { data: ya } = await sb.from("friendships").select("estado")
      .or(`and(solicitante.eq.${ids[i]},destinatario.eq.${ids[j]}),and(solicitante.eq.${ids[j]},destinatario.eq.${ids[i]})`);
    if (ya?.length) await sb.from("friendships").update({ estado: "aceptada" })
      .or(`and(solicitante.eq.${ids[i]},destinatario.eq.${ids[j]}),and(solicitante.eq.${ids[j]},destinatario.eq.${ids[i]})`);
    else {
      const { error } = await sb.from("friendships").insert({ solicitante: ids[i], destinatario: ids[j], estado: "aceptada" });
      if (error) throw error;
    }
  }
console.log("✓ son amigos entre sí");
console.log(`\nClave de todas: ${CLAVE}`);
