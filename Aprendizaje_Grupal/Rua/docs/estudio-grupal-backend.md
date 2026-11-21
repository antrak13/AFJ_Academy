# Estudio grupal: backend (F1 a F6)

Reproductor, presencia, voz y puntos de control. Reglas de negocio: `arquitectura_proyecto.md`, sección 3.

## Puesta en marcha

1. `npm install`
2. Copiar `.env.example` a `.env.local` y completar Supabase, LiveKit y la clave de IA (`AI_PROVIDER=mock` para trabajar sin clave).
3. Aplicar `supabase/migrations/*.sql` en orden (SQL Editor de Supabase o `supabase db push`) y, si se quiere, `supabase/seed.sql`.
4. `npm run dev` · `npm test` (reglas puras) · `npm run typecheck`

Todas las rutas exigen sesión: cookie de Supabase o `Authorization: Bearer <access_token>`.
Los errores tienen la forma `{ "error": { "codigo": "SALA_LLENA", "mensaje": "..." } }`.

## Dónde vive cada cosa

| Qué | Dónde | Por qué |
|---|---|---|
| Quién está conectado | Presence (un `track` al entrar) | No se guarda |
| Posición, estado, "esperando a" | Broadcast `estado` cada 1 s (`lib/realtime/sala.ts`, tipo `EstadoIntegrante`). Presence no sirve para esto: Supabase cierra el canal si se llama a `track` cada segundo | No se guarda (sección 4) |
| Desfase, contador "X/N sincronizados", causa del aviso | `lib/grupo/sincronia.ts` (puro, lo usa el cliente) | Se calcula con los datos de Presence |
| Pausa automática por voz y cuenta 3, 2, 1 | `lib/grupo/voz.ts` (máquina de estados pura, cliente) | LiveKit da el orador activo en el cliente |
| Salas, integrantes, sesión, retrocesos, votos | Postgres vía `/api`, eventos por Broadcast | Autoridad del servidor |

## Modelo: plataforma, amigos y fantasmas

La idea: tú y tus amigos tienen cuenta en la misma plataforma educativa y quieren hacer el mismo curso juntos.

- **Cursos y clases.** Un tema (`topics`) es un curso y cada video (`videos`, con `orden`) es una clase. Las preguntas de los puntos de control las define la plataforma: solo las cuentas de `ADMINS_PLATAFORMA` las crean, editan o generan.
- **Amigos.** Se agregan por correo (`friendships`, pendiente → aceptada).
- **Ver una clase.** Abrir una clase crea tu sesión (`POST /api/clases/:videoId/sesion`, que por dentro es una sala con su sesión). Desde ahí invitas amigos (`room_invites`); les llega un aviso en vivo por su canal personal `usuario:<id>` y solo se entra con invitación. Ya no hay códigos para compartir.
- **Fantasmas (en diferido).** De cada sesión se guarda:
  - el recorrido de cada persona: posición y estado cada segundo, en `session_tracks`;
  - el chat (`chat_messages`, con el minuto del video);
  - el cuaderno;
  - los votos y los retrocesos;
  - los clips de voz de las discusiones (`voice_clips` + bucket privado `grabaciones`), solo de quien aceptó `grabar_voz`.

  Cuando un amigo abre esa clase, recibe todo eso (`GET /api/clases/:videoId/fantasmas`). Solo aparece lo de personas que son sus amigos. Los fantasmas avanzan con su propio reloj mientras tú ves la clase; sus mensajes aparecen al llegar a su minuto; donde discutieron, tu video espera y escuchas sus voces; en cada punto de control, después de responder, ves cómo votaron y puedes escuchar su debate.

**Cambia respecto de `arquitectura_proyecto.md`:**
- Regla 2: se entra por invitación de un amigo, no con un código.
- Regla 16: la voz ya no es solo en vivo. Se guarda la voz propia en las discusiones únicamente con la aceptación explícita de cada persona (`profiles.grabar_voz`, aparte de la telemetría), y la página muestra «Guardando tu voz» mientras graba.

## Rutas

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/clases` | cualquiera | Cursos con sus clases y, por clase, las sesiones de mis amigos que puedo ver como fantasmas |
| `POST /api/clases/:videoId/sesion` | cualquiera | Abre la clase: devuelve mi sesión abierta de esa clase o crea una (soy anfitrión) |
| `GET /api/clases/:videoId/fantasmas[?excluir=sessionId]` | cualquiera | Sesiones de mis amigos en esa clase: recorrido, chat, clips (URL firmada), cuaderno, fricción |
| `GET /api/clases/:videoId/fantasmas/votos?checkpoint=&sesiones=` | cualquiera | Cómo votaron mis amigos; solo si yo ya respondí ese punto de control (`409 RESPONDE_PRIMERO`) |
| `GET /api/amigos` · `POST /api/amigos` `{correo}` | cualquiera | Amigos y solicitudes; pedir amistad por correo (si la otra persona ya la pidió, queda aceptada) |
| `POST /api/amigos/:id` · `DELETE /api/amigos/:id` | cualquiera | Aceptar · rechazar, cancelar o eliminar |
| `GET /api/invitaciones` · `DELETE /api/invitaciones/:roomId` | cualquiera | Invitaciones pendientes a sesiones abiertas · rechazar |
| `POST /api/grupo/salas/:codigo/invitar` `{amigos}` | integrante | Invita amigos (máx. 5 en total); aviso en vivo por `usuario:<id>` |
| `POST /api/grupo/salas/:codigo/chat` `{texto, posicion}` | integrante | Mensaje al chat; Broadcast `chat_mensaje` |
| `POST /api/grupo/salas/:codigo/recorrido` `{iniciado, muestras}` | integrante | Lote de muestras `[ms, posición, estado]` de mi recorrido |
| `POST /api/grupo/salas/:codigo/voz/clip` `{posicion, inicio, duracionMs, checkpointId?, tipo}` | integrante con `grabar_voz` | Registra un clip y devuelve la URL firmada para subirlo |
| `POST /api/grupo/salas` `{topic_id, video_id}` | cualquiera | Crea una sala sin pasar por la clase (la página usa `/api/clases/:videoId/sesion`) |
| `GET /api/grupo/salas/:codigo` | integrante | Sala, canal, video, tema, integrantes, sesión, minutos de control, fricción |
| `POST /api/grupo/salas/:codigo/unirse` | invitado | Entra si tiene invitación (máx. 5; el 6.º recibe `409 SALA_LLENA`) |
| `POST /api/grupo/salas/:codigo/salir` | integrante | Sale; si era anfitrión el rol pasa al más antiguo; sin nadie, la sala se cierra |
| `POST /api/grupo/salas/:codigo/anfitrion` `{conectados}` | integrante | Regla 4: reasigna si el anfitrión no está en Presence |
| `POST /api/grupo/salas/:codigo/sesion` `{accion: iniciar\|cerrar}` | anfitrión | Una sesión activa por sala. Además arranca sola con el primer integrante (al crear, entrar o leer la sala) |
| `GET /api/grupo/salas/:codigo/cuaderno` | integrante | Bloques del cuaderno del squad, en orden |
| `PUT /api/grupo/salas/:codigo/cuaderno/:bloqueId` `{orden, tipo, html, imagen?, segundo?}` | integrante | Crea o guarda un bloque (titulo, texto, codigo, fotograma). El HTML se limpia (solo b, i, code, br). Los cambios en vivo van por Broadcast `nb_bloque` / `nb_borrado` entre clientes |
| `DELETE /api/grupo/salas/:codigo/cuaderno/:bloqueId` | integrante | Borra un bloque |
| `POST /api/grupo/salas/:codigo/friccion` `{desde, hasta}` | integrante | Registra un retroceso (≥ 5 s) y recalcula su ventana |
| `GET /api/grupo/salas/:codigo/friccion` | integrante | Ventanas de la sesión activa |
| `GET /api/grupo/salas/:codigo/checkpoints[?completo=1]` | integrante / admin | Minutos de control; completo (con respuesta) solo administración de la plataforma |
| `POST /api/grupo/salas/:codigo/checkpoints` | admin | Crea uno a mano |
| `PATCH\|DELETE /api/grupo/salas/:codigo/checkpoints/:id` | admin | Revisa, edita o borra |
| `POST /api/grupo/salas/:codigo/checkpoints/generar` `{cantidad}` | admin | La IA genera preguntas del material del tema (`revisado=false`) |
| `GET /api/grupo/salas/:codigo/checkpoints/:id/ronda` | integrante | Estado de la votación para mí; abre la ronda y aplica plazos vencidos |
| `POST /api/grupo/salas/:codigo/checkpoints/:id/voto` `{opcion}` | integrante | Voto a ciegas; en debate, cambio de voto |
| `POST /api/grupo/salas/:codigo/checkpoints/:id/cerrar` | anfitrión | Cierra el debate antes de 90 s |
| `POST /api/voz/token` `{codigo}` | integrante | Token de LiveKit (solo micrófono) |

## Flujo del cliente en la sala

1. `GET /salas/:codigo` → suscribirse a `canal` con Presence (`key = userId`), hacer `track` una vez y emitir `EstadoIntegrante` por Broadcast (`estado`) una vez por segundo.
2. Escuchar Broadcast (tipos en `EventoSala`): `integrante_entro`, `anfitrion_cambio`, `zona_friccion`, `voto_registrado`, `control_revelado`, `control_cerrado`, etc.
3. Reproductor: en cada `seeked` hacia atrás de 5 s o más → `POST /friccion`.
4. Al llegar al `segundo` de un punto de control: pausar **mi** video y `GET .../ronda` (trae pregunta y opciones, nunca la respuesta).
5. Votar con `POST .../voto`. Con `voto_registrado` se muestra "X de N votaron". Cuando venza `revelarEn` o `debateHasta`, volver a pedir `GET .../ronda`: el servidor aplica la transición (no hay proceso en segundo plano).
6. Al recibir `control_cerrado`: `GET .../ronda` trae votos, respuesta y explicación; reanudar.
7. Voz: `POST /api/voz/token`, conectar con `livekit-client`, y en `ActiveSpeakersChanged` despachar `{tipo: "oradores"}` a `reducirVoz`; un `setInterval` de 250 ms despacha `{tipo: "tick"}`.

## Puente con el estudio individual

Al cerrar cada ronda (`lib/grupo/puente.ts`), por cada voto de quien aceptó la telemetría (`profiles.telemetria`):
- `learning_events` con `origen='grupal'`, `tipo='voto_punto_control'` y `{acierto, cambio, voto_inicial, voto_final, ...}`;
- `mastery` del concepto: promedio exponencial (α = 0.3, inicial 0.5);
- si hubo votos divididos, fila en `debate_flags` (concepto "para debatir en grupo").

Coordinar con estudio individual: si la política define otra fórmula de `mastery` o el valor inicial desde `learner_profile`, cambiar `nuevoDominio` en `lib/grupo/control.ts`.

## Supuestos propios (además de los (*) del documento)

- Los "integrantes conectados" de la regla 20 se cuentan como integrantes de la sala; el plazo de 120 s cubre a quien se fue.
- Si todos eligen la misma opción incorrecta, se cierra sin debate (`unanime_incorrecta`) y se muestra la respuesta.
- Antes de revelar se puede corregir el voto inicial; en debate solo cambia quien votó a tiempo.
- El anfitrión puede cerrar el debate antes de los 90 s.
- La pausa por voz no toma el control si la persona ya había pausado a mano.
