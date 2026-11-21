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

**2. Clase: enséñale** (`clase.html`)

- Le explicas el tema con tus palabras (o con la voz). La IA responde **en el papel del aprendín**: no explica, pregunta, intenta usar lo que le enseñaste en su mundo (y lo anota en su cuaderno) y, una vez por paso, comete a propósito el **error típico** para que lo corrijas. Si le enseñas algo mal, te cree y se nota la consecuencia.
- En silencio, la IA **evalúa cada explicación** (vaga, parcial, incorrecta, entendida) y deja una nota para el profe y una pista para ti («¿Cómo se lo explico?»). Se ve en «Lo que midió la IA».
- Cuando entiende un paso, **evoluciona** a la fase siguiente y abre el próximo paso con una pregunta de su misión. Al cuarto paso se transforma y cumple su misión.
- Sin IA, la clase funciona en modo práctica (pide ejemplos y entiende al segundo mensaje claro).

**3. Fichas** (`fichas.html` muestra una de cada tipo)

Cada paso aprendido deja una **ficha**: la idea clave, un **visual animado** que la IA elige entre 13 tipos y llena con datos de su mundo, un ejemplo resuelto, el «¡Ojo!» con el error en que cayó y la mejor frase que dijiste. Los tipos: pasos, ciclo, partes (mapa de conceptos), comparar, barras, torta, fracciones (pizzas o barras, con suma, resta o equivalencia; la cuenta la verifica el código), recta numérica con saltos, línea de tiempo, ecuación paso a paso, tabla, gráfico x-y e íconos. El código los dibuja y anima; el botón ↻ repite la animación.

## Cómo verlo

Con IA (necesita Node 20+ y `agy2` con sesión iniciada):

```bash
cd Aprendizaje_Individual
npm start              # o: node servidor.mjs
```

Abre http://localhost:8080. Para probar la clase sin crear un aprendín: http://localhost:8080/clase.html?ejemplo=1

Variables: `MODO` (`dibujo` por defecto, o `piezas`), `MODELO` (por defecto `gemini-3.8-flash-low`; con `medium` el parecido fue igual y tardó 4 veces más), `MODELO_CREAR` (otro modelo solo para crear), `AGY` (por defecto `agy2`), `PUERTO`, `HOST`. Con `npm run ensayo`, cada huevo, aprendín, turno de la clase y ficha se guarda y, si se pide igual, se repite al instante, lo que sirve para ensayar el pitch.

Sin IA, con cualquier servidor estático: `python3 -m http.server 8080` y abre http://localhost:8080/taller.html

## Archivos

| Archivo | Qué hace |
|---|---|
| `js/aprendin.js` | El personaje: formas, cara, emociones, animación y acciones |
| `js/piezas.js` | El vestuario por zonas y el catálogo que usa la IA |
| `js/dibujo.js` | El dibujo libre de la IA: limpia el SVG y lo encaja en el cuerpo |
| `js/huevo.js` | El huevo personalizado: patrones, formas y el diseño sin IA |
| `js/creador.js` | Los esquemas que se le piden a la IA, el armado de las fases y el creador sin IA |
| `js/turno.js` | Un turno de la clase: esquema, evaluación y modo sin IA |
| `js/fichas.js`, `js/fichas-dom.js` | Las fichas: esquema, validación, los 13 visuales y su animación |
| `js/clase.js`, `clase.html`, `css/clase.css` | La página de la clase |
| `js/taller.js`, `taller.html`, `css/taller.css` | La página del taller |
| `servidor.mjs`, `ia/*.md` | El servidor que conecta con `agy2` y las instrucciones para la IA (preguntas y huevo, creación por dibujo o por piezas, turnos de la clase y fichas) |
| `js/mundos.js`, `js/fichas-ejemplo.js`, `js/demo-aprendin.js` | Ejemplos: mundos listos, fichas de muestra y un aprendín para probar la clase |
| `js/color.js`, `js/trazos.js`, `js/guardado.js` | Colores, utilidades de dibujo y guardado en el navegador |
