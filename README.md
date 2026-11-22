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

## Cómo levantarlo

```bash
cd Aprendizaje_Grupal/Rua
npm install
cp .env.example .env.local   # y completa las claves (Supabase, LiveKit, IA)
npm run db:usuarios          # cuentas de prueba: ana@, beto@, caro@prueba.local / prueba123
npm run dev                  # http://localhost:3000
```

Para que el estudio individual use la IA, levanta también su servidor en otra terminal (si no está, esas páginas funcionan en su modo sin IA):

```bash
cd Aprendizaje_Individual && npm start   # escucha en 127.0.0.1:8080; la app de Next le reenvía /api/estado, /api/turno, etc.
```

## Sesión compartida

- `login.html` crea e inicia la cuenta en **Supabase Auth** mediante `Aprendizaje_Grupal/Rua/public/comun/sesion.js`. El botón «Cargar cuenta demo» rellena `ana@prueba.local / prueba123`.
- Al registrarse, el nombre, rol, institución, carrera, país y ciudad se guardan en los metadatos de la cuenta, junto con la aceptación de telemetría (se aplica al perfil en el primer inicio de sesión si el proyecto pide confirmar el correo).
- Tras entrar, `sesion.js` deja una copia del usuario en `localStorage['afj_current_user']`, que usan `inicio.html` y el módulo de Andre (`js/comunidad.js` arranca con esa persona en lugar de la cuenta demo).
- El estudio grupal no tiene login propio: sin sesión manda a `/login.html?volver=…` y, al entrar, vuelve a la misma sala o clase (los enlaces de invitación `?sala=CODIGO` siguen funcionando).
- «Cerrar sesión» en el inicio o en el estudio grupal cierra la sesión de Supabase en todas las páginas.

Las páginas de la raíz y de Andre se sirven desde `Aprendizaje_Grupal/Rua/app/[...ruta]/route.ts`, que solo publica una lista fija de carpetas (nunca `.env.local` ni el código del servidor).
