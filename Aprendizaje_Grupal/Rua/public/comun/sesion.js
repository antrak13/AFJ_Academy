// Sesión única de la plataforma (login de Andre + estudio grupal de Rua + módulos estáticos).
//
// La cuenta vive en Supabase Auth. Esta capa la expone a las páginas estáticas y deja una copia
// en localStorage['afj_current_user'] con la forma que ya usan inicio.html y el módulo social de
// Andre (username, institution, career, city…), para que no tengan que hablar con Supabase.
//
// Requiere que la página se sirva desde la app Next (misma origin que /api/config/publica).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.2';

export const CLAVE_USUARIO = 'afj_current_user';

let promesaCliente = null;

/** Cliente de Supabase (uno por página). La sesión se guarda en localStorage y la comparten todas las páginas. */
export function cliente() {
  if (!promesaCliente) {
    promesaCliente = fetch('/api/config/publica', { cache: 'no-store' })
      .then(r => r.json())
      .then(({ supabaseUrl, supabaseAnonKey }) => {
        if (!supabaseUrl || !supabaseAnonKey) throw new Error('Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
        return createClient(supabaseUrl, supabaseAnonKey);
      });
    promesaCliente.catch(() => { promesaCliente = null; });
  }
  return promesaCliente;
}

/** Convierte el usuario de Supabase (+ su fila de profiles) en el objeto que usan inicio.html y Andre. */
function aUsuarioLocal(user, perfil) {
  const m = user.user_metadata || {};
  const nombre = perfil?.nombre || m.full_name || m.name || user.email?.split('@')[0] || 'Estudiante';
  return {
    id: user.id,
    email: user.email,
    username: nombre,
    avatar: perfil?.avatar || m.avatar_url || null,
    role: m.rol || 'universitario',
    institution: m.institucion || '',
    career: m.carrera || '',
    country: m.pais || '',
    city: m.ciudad || '',
    createdAt: user.created_at
  };
}

async function guardarLocal(sb, user) {
  const { data: perfil } = await sb.from('profiles').select('nombre, avatar').eq('id', user.id).maybeSingle();
  const u = aUsuarioLocal(user, perfil);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
  return u;
}

/** Usuario con sesión válida, o null. Mantiene al día la copia local. */
export async function usuarioActual() {
  const sb = await cliente();
  const { data } = await sb.auth.getSession();
  if (!data.session) { localStorage.removeItem(CLAVE_USUARIO); return null; }
  return guardarLocal(sb, data.session.user);
}

export async function entrar(email, clave) {
  const sb = await cliente();
  const { data, error } = await sb.auth.signInWithPassword({ email, password: clave });
  if (error) throw traducir(error);
  await aplicarTelemetriaPendiente(sb, data.user);
  return guardarLocal(sb, data.user);
}

// Si la cuenta se creó con confirmación de correo, la aceptación de telemetría quedó en los
// metadatos (no había sesión para guardarla). Se aplica en el primer inicio de sesión.
async function aplicarTelemetriaPendiente(sb, user) {
  const m = user.user_metadata || {};
  if (typeof m.telemetria !== 'boolean' || m.telemetria_aplicada) return;
  const { error } = await sb.from('profiles').update({ telemetria: m.telemetria }).eq('id', user.id);
  if (!error) await sb.auth.updateUser({ data: { telemetria_aplicada: true } });
}

/**
 * Crea la cuenta. Devuelve { usuario } si quedó con sesión, o { confirmar: true } si el proyecto
 * exige confirmar el correo. `telemetria` es la aceptación explícita (regla 35).
 */
export async function registrar({ email, clave, nombre, rol, institucion, carrera, pais, ciudad, telemetria }) {
  const sb = await cliente();
  const volver = new URL('/login.html', location.origin).href;
  const { data, error } = await sb.auth.signUp({
    email,
    password: clave,
    options: {
      data: { full_name: nombre, rol, institucion, carrera, pais, ciudad, telemetria: !!telemetria },
      emailRedirectTo: volver
    }
  });
  if (error) throw traducir(error);
  if (!data.session) return { confirmar: true };
  await aplicarTelemetriaPendiente(sb, data.user);
  return { usuario: await guardarLocal(sb, data.user) };
}

export async function entrarConGoogle(redirigirA) {
  const sb = await cliente();
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirigirA } });
  if (error) throw traducir(error);
}

export async function salir() {
  localStorage.removeItem(CLAVE_USUARIO);
  try { const sb = await cliente(); await sb.auth.signOut(); } catch { /* sin servidor: basta con borrar la copia */ }
}

/** Ruta segura a la que volver después del login (solo rutas del mismo sitio). */
export function destinoTrasLogin(porDefecto = '/inicio.html') {
  const v = new URLSearchParams(location.search).get('volver');
  return v && v.startsWith('/') && !v.startsWith('//') ? v : porDefecto;
}

/** Manda al login y vuelve a la página actual (con su ?sala=… o ?clase=…) al terminar. */
export function irAlLogin() {
  location.href = '/login.html?volver=' + encodeURIComponent(location.pathname + location.search);
}

function traducir(error) {
  const m = String(error?.message || error);
  const mapa = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos. Revisa tus datos o crea una cuenta nueva.'],
    [/email not confirmed/i, 'Confirma tu correo antes de entrar (revisa tu bandeja de entrada).'],
    [/user already registered/i, 'Ya existe una cuenta registrada con este correo electrónico.'],
    [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/provider is not enabled/i, 'El acceso con Google no está habilitado en este proyecto.'],
    [/rate limit/i, 'Demasiados intentos seguidos. Espera un momento y vuelve a probar.']
  ];
  const hit = mapa.find(([re]) => re.test(m));
  return new Error(hit ? hit[1] : m);
}
