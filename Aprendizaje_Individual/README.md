# Aprendizaje individual · Aprendines

Responsable: Freddy

En el estudio individual, el estudiante no recibe una explicación: **le enseña a un aprendín**. El aprendín es un personaje que viene del mundo que le gusta al estudiante (cocina, fútbol, Andes, videojuegos…), no sabe casi nada y aprende lo que le explican. Mientras aprende, gana piezas y se transforma.

## Lo que hay hoy

**1. Taller: crea tu aprendín** (`taller.html`)

- **Un huevo hecho con tus gustos.** Escribes qué te gusta y qué le vas a enseñar, y aparece un huevo con colores, patrón y forma de tu mundo (una esfera naranja con cuatro estrellas, un huevo de bloques verdes, uno con costuras de balón…). Sin IA se deduce de tus gustos; con IA lo diseña Antigravity y le pone nombre.
- **Preguntas antes de nacer.** La IA (`agy2`) te pregunta qué personaje o equipo te gusta, qué parte del tema te cuesta y cómo quieres que sea. También puedes **ponerle nombre**; si no, lo elige la IA (y nunca copia el nombre del personaje).
- **La IA dibuja el disfraz.** No elige de una lista: traza con SVG el pelo, la ropa y los accesorios del personaje sobre el cuerpo del aprendín, con sus colores exactos. El código limpia el dibujo (solo figuras, sin scripts ni texto) y le pone los ojos, la boca, los brazos animados y los pies. Puede sumar piezas del catálogo (un balón, muñequeras, un aura). El modo anterior, por piezas, sigue disponible (`MODO=piezas`).
- **Sin género.** El aprendín es una criatura: ni niño ni niña. La IA escribe sus frases sin adjetivos con género y las emociones tienen nombres neutros (Alegría, Curiosidad, Orgullo…).
- **5 fases de evolución**, una por cada paso del tema, y un nacimiento en pantalla completa: golpeas el huevo 3 veces y sale.
- **Mis aprendines** guarda los personajes nacidos en el navegador. Puedes retocar cada personaje, volver a su clase y seguir su misión desde la última fase que alcanzó.

**2. Clase: enséñale** (`clase.html`)

- Le explicas el tema con tus palabras (o dictando con la voz: SpeechRecognition en navegadores compatibles o grabación WAV local + `POST /api/transcribir` en Brave/Linux). La IA responde **en el papel del aprendín**: no explica, pregunta, intenta usar lo que le enseñaste en su mundo (y lo anota en su cuaderno) y, una vez por paso, comete a propósito el **error típico** para que lo corrijas. Si le enseñas algo mal, te cree y se nota la consecuencia.
- En silencio, la IA **evalúa cada explicación** (vaga, parcial, incorrecta, entendida) y deja una nota para el profe y una pista para ti («¿Cómo se lo explico?»). Se ve en «Lo que midió la IA».
- Desde el propio chat puedes abrir «📖 Ficha de este paso» para estudiar el concepto sin tapar la conversación y explicárselo enseguida abajo.
- Cuando entiende un paso, **evoluciona** a la fase siguiente y abre el próximo paso con una pregunta de su misión. Al cuarto paso se transforma y cumple su misión.
- **Cuidado y postal**. Puedes darle ánimos en clase y descargar un PNG con su retrato, su tema y la fase que alcanzó para compartirlo.
- Sin IA, la clase funciona en modo práctica. Tras explicar la idea y dar un ejemplo, tú confirmas que pueden guardar la ficha y pasar de fase.

**3. La prueba de la misión, en equipo**

Al terminar los 4 pasos llega la prueba de su misión, que el estudiante y el aprendín **responden juntos**. En cada pregunta el aprendín dice qué respuesta escogería y cómo lo pensó. El estudiante decide la respuesta del equipo y puede salvarlo de una trampa. Al final ven el puntaje y qué pasos conviene repasar. Con tres aciertos se cumple la misión. La IA genera cinco preguntas con el cuaderno completo. En modo práctica, la prueba usa las ideas y los ejemplos de las fichas disponibles.

**4. Fichas adaptativas, calibración y galería** (`fichas.html`)

- **Fichas de inicio y estudio adaptativo**: escribes un tema y tus gustos (o usas tu aprendín), la IA genera una ficha visual animada eligiendo el mejor diseño entre los 13 tipos cuando aplica, y cada reacción («Lo entendí», «No entendí / más simple», «Otro ejemplo de mi mundo», «Dame un reto») adapta el nivel, el ejemplo y el tipo visual de la siguiente ficha. También se pueden abrir y adaptar **dentro del chat de `clase.html`** («📖 Ficha de este paso») para entender un concepto antes de explicárselo al aprendín. Sin IA, usa fichas adaptativas locales.
- **Calibración por aceptación**: usa las reacciones a las fichas y registra qué formatos marcaste como entendidos antes de que la IA validara tu explicación del paso. En automático, alterna tres fichas basadas en tus preferencias con una de exploración cuando ya tienes formatos favoritos. Puedes fijar un formato o cambiar a `Favoritos` o `Explorar` desde `fichas.html` y `clase.html`.
- **Fichas de la clase y galería de los 13 tipos**: cada paso aprendido en `clase.html` deja una **ficha**: la idea clave, un **visual animado** que la IA elige entre 13 tipos y llena con datos de su mundo, un ejemplo resuelto, el «¡Ojo!» con el error en que cayó y la mejor frase que dijiste. Los tipos: pasos, ciclo, partes (mapa de conceptos), comparar, barras, torta, fracciones (pizzas o barras, con suma, resta o equivalencia; la cuenta la verifica el código), recta numérica con saltos, línea de tiempo, ecuación paso a paso, tabla, gráfico x-y e íconos. El código los dibuja y anima; el botón ↻ repite la animación.

**5. Panel docente** (`docente.html`)

- **Aulas y alumnos.** El docente se registra con el rol «Docente» y crea un aula (nombre, curso y, si quiere, un tema). Registra a sus alumnos con una lista de nombres: a cada uno se le crea una cuenta con **usuario y PIN**, sin correo (muchos niños no tienen). El PIN solo se muestra una vez. Quien ya tiene cuenta puede unirse desde el taller con el **código del aula**.
- **Tema asignado.** El alumno ve en el taller su aula y el tema que le asignaron, ya cargado para crear su aprendín.
- **Avance de cada alumno.** Cada vez que la clase guarda su estado, manda a la plataforma un resumen: lo que midió la IA en cada explicación (vaga, va bien, error, entendió, con su nota) y el resultado de la prueba en equipo. En el panel se ve por alumno y por paso, con el detalle de las notas.
- **Debilidades del aula.** Paso por paso, del más difícil al más fácil: fuerza promedio (la misma medida que decide en qué preguntas cae el aprendín en la prueba), cuántos cayeron en un error, intentos, fallos en la prueba y las notas de la IA que se repiten. Debajo, quién necesita ayuda (sigue trabado en un paso, no aprobó la prueba o lleva 3 días sin avanzar).
- Funciona dentro de la plataforma (la app de Next, con sesión). Las tablas están en `Aprendizaje_Grupal/Rua/supabase/migrations/20261122000006_aulas.sql` y la API en `app/api/aulas` y `app/api/avance`. Con `node servidor.mjs` solo, la clase funciona igual que antes y no sincroniza nada.

## Cómo verlo

Con IA (necesita Node 20+ y `agy2` con sesión iniciada):

```bash
cd Aprendizaje_Individual
npm start              # o: node servidor.mjs
```

Abre http://localhost:8080. Para probar la clase sin crear un aprendín: http://localhost:8080/clase.html?ejemplo=1 (desde cero) o http://localhost:8080/clase.html?ejemplo=prueba (con los 4 pasos listos, directo a la prueba en equipo)

Variables: `MODO` (`dibujo` por defecto, o `piezas`), `MODELO` (por defecto `gemini-3.8-flash-low`, 16–38 s), `MODELO_CREAR` (otro modelo para crear en modo rápido), `MODELO_MAXIMO` (por defecto `gemini-3.8-flash-medium` para la opción «Máxima calidad» en el taller, 1–3 min), `AGY` (por defecto `agy2`), `PUERTO`, `HOST`. Con `npm run ensayo`, cada huevo, aprendín, turno de la clase, ficha y examen se guarda y, si se pide igual, se repite al instante, lo que sirve para ensayar el pitch.

Sin IA, con cualquier servidor estático: `python3 -m http.server 8080` y abre http://localhost:8080/taller.html

Las fichas adaptativas usan el ejemplo anterior y la duda del estudiante para preparar el siguiente apoyo. El servidor revisa la estructura y las operaciones que puede comprobar. Si detecta un fallo, pide una corrección antes de mostrar la ficha. Los retos revelan el gráfico y la solución al abrir «Ver solución». En modo práctica, un tema sin ficha de contenido ofrece una guía para preparar la explicación.

Ejecuta `npm test` en `Aprendizaje_Individual` para verificar los recorridos en recta, los resultados de fracciones y la presentación de los retos.

## Sala y personajes compartidos

En `sala.html` eliges un tema y reúnes a dos o tres aprendines del taller o del catálogo. Asigna a cada uno cómo aprende. Cada turno con IA recibe el mismo mensaje por separado y conserva el historial de quien lo escucha. Puedes responderle solo a quien tenga una duda. Las cuatro rondas avanzan cuando todo el grupo termina el paso y el cuaderno recoge lo que le enseñaste a cada personaje. En modo práctica, la persona que enseña confirma cuándo anotar el paso.

Desde la clase individual, **Compartir aprendín** descarga un archivo `.aprendin.json` con el personaje y sus fases. Quien reciba el archivo puede abrirlo con **Importar un aprendín** en su Sala. El archivo comparte el diseño y la misión del personaje. Las conversaciones, el cuaderno y el progreso de las salas se guardan en el navegador donde se hicieron.

## Archivos

| Archivo | Qué hace |
|---|---|
| `js/aprendin.js` | El personaje: formas, cara, emociones, animación y acciones |
| `js/piezas.js` | El vestuario por zonas y el catálogo que usa la IA |
| `js/dibujo.js` | El dibujo libre de la IA: limpia el SVG y lo encaja en el cuerpo |
| `js/huevo.js` | El huevo personalizado: patrones, formas y el diseño sin IA |
| `js/creador.js` | Los esquemas que se le piden a la IA, el armado de las fases y el creador sin IA |
| `js/turno.js` | Un turno de la clase: esquema, evaluación y modo sin IA |
| `js/examen.js`, `js/prueba.js`, `css/prueba.css` | La prueba en equipo: el examen que arma la IA, en qué preguntas cae el aprendín y la pantalla de la prueba |
| `js/fichas.js`, `js/fichas-dom.js`, `js/fichas-estudio.js`, `fichas.html`, `css/fichas.css` | Las fichas: esquema, validación, los 13 visuales animados, la galería y el estudio adaptativo desde el inicio |
| `js/clase.js`, `clase.html`, `css/clase.css` | La página de la clase |
| `js/taller.js`, `taller.html`, `css/taller.css` | La página del taller |
| `servidor.mjs`, `ia/*.md` | El servidor que conecta con `agy2` y las instrucciones para la IA (preguntas y huevo, creación por dibujo o por piezas, turnos de la clase y fichas) |
| `js/mundos.js`, `js/fichas-ejemplo.js`, `js/demo-aprendin.js`, `js/demo-clase.js` | Ejemplos: mundos listos, fichas de muestra, un aprendín y una clase terminada para probar |
| `js/color.js`, `js/trazos.js`, `js/guardado.js` | Colores, utilidades de dibujo y guardado en el navegador |
| `docente.html`, `js/docente.js`, `js/docente-datos.js`, `css/docente.css` | El panel docente y sus cálculos (debilidades del aula, quién necesita ayuda) |
| `js/avance-nube.js` | Conecta con la plataforma: guarda el avance de la clase y lee el aula del alumno |
