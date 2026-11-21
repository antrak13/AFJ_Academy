# Aprendizaje individual · Aprendines

Responsable: Freddy

En el estudio individual, el estudiante no recibe una explicación: **le enseña a un aprendín**. El aprendín es un personaje que viene del mundo que le gusta al estudiante (cocina, fútbol, Andes, videojuegos…), no sabe casi nada y aprende lo que le explican. Mientras aprende, gana piezas y se transforma.

## Lo que hay hoy

**Taller de aprendines** (`taller.html`):

- **Crea tu aprendín con IA.** Escribes qué te gusta y qué le vas a enseñar. Aparece un huevo y la IA de Antigravity (`agy2`) te hace 2 o 3 preguntas: qué personaje o equipo te gusta, qué parte del tema te cuesta y cómo quieres que sea. Con tus respuestas inventa un aprendín **disfrazado de lo que te gusta**, con nombre propio, personalidad y una misión que necesita el tema. Además le arma **5 fases de evolución**: cada fase es un paso del tema y suma piezas, y la última es su transformación. Para que nazca, el huevo aparece en pantalla completa y hay que golpearlo 3 veces. Si no hay IA, la página hace las preguntas y arma el aprendín sola con el catálogo.
- **Personaje estilo bolita:** cuerpo redondo, bracitos cortos, pies grandes y ojos ovalados. Hay 6 formas, 16 emociones que se mezclan sin saltos y rasgos propios: tipo de ojos, boca, panza, marcas y color de pies. Parpadea, respira, mira al puntero, habla, salta, saluda, entiende, se equivoca y evoluciona.
- **Peinado y traje a medida:** para parecerse a cualquier personaje, la IA no elige de una lista fija. Describe la silueta del pelo mechón por mechón y la ropa (colores, cuello, cinturón, estampado, emblema), y el código la dibuja.
- **Vestuario:** 9 zonas con 108 piezas que se adaptan a cualquier forma. Incluye piezas icónicas (peinados grandes, trajes de artes marciales, kimono, camiseta a rayas, traje de héroe, muñequeras…) para que el disfraz se reconozca sin copiar personajes ni logos. La IA solo puede elegir piezas del catálogo, porque el esquema JSON se lo impide.
- **12 mundos de ejemplo** y un editor de forma, color, rasgos y piezas.

## Cómo verlo

Con IA (necesita Node 20+ y `agy2` con sesión iniciada):

```bash
cd Aprendizaje_Individual
npm start              # o: node servidor.mjs
```

Abre http://localhost:8080. Variables: `MODELO` (por defecto `gemini-3.8-flash-low`; con `medium` el parecido fue igual y tardó 4 veces más), `MODELO_CREAR` (otro modelo solo para crear), `AGY` (por defecto `agy2`), `PUERTO`, `HOST`. Con `npm run ensayo`, cada aprendín creado se guarda y, si se pide igual, se repite al instante, lo que sirve para ensayar el pitch.

Sin IA, con cualquier servidor estático: `python3 -m http.server 8080` y abre http://localhost:8080/taller.html

## Archivos

| Archivo | Qué hace |
|---|---|
| `js/aprendin.js` | El personaje: formas, cara, emociones, animación y acciones |
| `js/piezas.js` | El vestuario por zonas y el catálogo que usará la IA |
| `js/mundos.js` | Los mundos de ejemplo |
| `js/creador.js` | El esquema que se le pide a la IA, el armado de las fases y el creador sin IA |
| `servidor.mjs`, `ia/*.md` | El servidor que conecta con `agy2` y las instrucciones para la IA (preguntas y creación) |
| `js/color.js`, `js/trazos.js` | Colores y utilidades de dibujo |
| `js/taller.js`, `taller.html`, `css/` | La página del taller |
