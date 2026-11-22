# AFJ Academy

La plataforma completa se levanta desde la app de Next (`Aprendizaje_Grupal/Rua`), que sirve todas las páginas en una sola dirección para que compartan la misma sesión:

| Ruta | Qué es | Responsable |
|---|---|---|
| `/` → `/inicio.html` | Página de inicio | Andre |
| `/login.html` | Login y registro (cuentas en Supabase Auth) | Andre |
| `/prueba/estudio-grupal.html` | Estudio grupal: salas, voz, preguntas, fantasmas | Rua |
| `/Aprendizaje_Grupal/Andre/Oficial/futuro-yo-aprende.html` | Clases grupales y social | Andre |
| `/Aprendizaje_Individual/taller.html` | Aprendines (estudio individual) | Freddy |
| `/Aprendizaje_Individual/docente.html` | Panel docente de Aprendines: aulas, alumnos con usuario y PIN, tema asignado, avance y debilidades del aula | Freddy |

## Variables de entorno

Hay **un solo archivo** con todas las claves: `Aprendizaje_Grupal/Rua/.env.local` (no se sube a git). La plantilla documentada es `Aprendizaje_Grupal/Rua/.env.example`. La app de Next lo carga sola y el servidor de aprendines lo lee al arrancar con `npm start`.

| Grupo | Variables | Para qué |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Cuentas, base de datos, tiempo real |
| Supabase (solo local) | `SUPABASE_DB_URL` | `npm run db:aplicar` (migraciones). Usa el *session pooler*: la conexión directa `db.<ref>` es solo IPv6 |
| LiveKit | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Voz en las salas |
| IA | `AI_PROVIDER` (`gemini`/`anthropic`/`mock`), `GEMINI_API_KEY`, `GEMINI_MODELOS` | Preguntas de control (grupal) y aprendines (individual). Si un modelo está saturado se prueba el siguiente |
| Plataforma | `ADMINS_PLATAFORMA`, `INDIVIDUAL_URL` | Quién genera preguntas de control; dónde corre el servidor de aprendines |

Revisa que todo responda con `npm run verificar` (en `Aprendizaje_Grupal/Rua`).

## Cómo levantarlo en local

```bash
cd Aprendizaje_Grupal/Rua
npm install
cp .env.example .env.local   # y completa las claves
npm run verificar            # comprueba Supabase, LiveKit y Gemini
npm run db:usuarios          # cuentas de prueba: ana@, beto@, caro@prueba.local / prueba123
npm run dev                  # http://localhost:3000
```

En otra terminal, el servidor de aprendines (IA del estudio individual; sin él esas páginas funcionan sin IA):

```bash
cd Aprendizaje_Individual && npm start   # 127.0.0.1:8080, usa Gemini por API (o agy2 si está instalado)
```

## Desplegar

**1. App principal en Vercel** (inicio, login, estudio grupal, módulo de Andre y páginas de aprendines)

- New Project → importar el repositorio → **Root Directory: `Aprendizaje_Grupal/Rua`** (dejar activado *Include files outside the root directory*). Framework: Next.js, sin cambiar comandos.
- Environment Variables: las de `.env.example` salvo `SUPABASE_DB_URL` y `GOOGLE_CLOUD_*`, que no hacen falta. `INDIVIDUAL_URL` = URL pública del paso 2.
- `next.config.ts` ya incluye en el paquete las páginas que viven fuera de esa carpeta (`inicio.html`, `login.html`, `Aprendizaje_Grupal/Andre/Oficial`, `Aprendizaje_Individual`).

**2. Servidor de aprendines** (`Aprendizaje_Individual`, Node sin dependencias) en Render, Railway o similar

- Root: `Aprendizaje_Individual`, comando `node servidor.mjs`, variables `HOST=0.0.0.0`, `GEMINI_API_KEY`, `GEMINI_MODELOS` (el puerto lo toma de `PORT`).
- Si no se despliega, la app sigue funcionando y los aprendines quedan en modo sin IA.

**3. Supabase** → Authentication → URL Configuration

- *Site URL* y *Redirect URLs*: agregar el dominio de Vercel (`https://<app>.vercel.app/**`), para la confirmación de correo y Google.
- Opcional: desactivar *Confirm email* para la demo, y activar el proveedor Google si se quiere el botón «Continuar con Google».

## Sesión compartida

- `login.html` crea e inicia la cuenta en **Supabase Auth** mediante `Aprendizaje_Grupal/Rua/public/comun/sesion.js`. El botón «Cargar cuenta demo» rellena `ana@prueba.local / prueba123`.
- Al registrarse, el nombre, rol, institución, carrera, país y ciudad se guardan en los metadatos de la cuenta, junto con la aceptación de telemetría (se aplica al perfil en el primer inicio de sesión si el proyecto pide confirmar el correo).
- Tras entrar, `sesion.js` deja una copia del usuario en `localStorage['afj_current_user']`, que usan `inicio.html` y el módulo de Andre (`js/comunidad.js` arranca con esa persona en lugar de la cuenta demo).
- El estudio grupal no tiene login propio: sin sesión manda a `/login.html?volver=…` y, al entrar, vuelve a la misma sala o clase (los enlaces de invitación `?sala=CODIGO` siguen funcionando).
- «Cerrar sesión» en el inicio o en el estudio grupal cierra la sesión de Supabase en todas las páginas.

Las páginas de la raíz y de Andre se sirven desde `Aprendizaje_Grupal/Rua/app/[...ruta]/route.ts`, que solo publica una lista fija de carpetas (nunca `.env.local` ni el código del servidor).
