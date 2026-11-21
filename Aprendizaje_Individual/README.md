# Aprendizaje individual · Aprendines

Responsable: Freddy

En el estudio individual, el estudiante no recibe una explicación: **le enseña a un aprendín**. El aprendín es un personaje que viene del mundo que le gusta al estudiante (cocina, fútbol, Andes, videojuegos…), no sabe casi nada y aprende lo que le explican. Mientras aprende, gana piezas y se transforma.

## Lo que hay hoy

**Taller de aprendines** (`taller.html`):

- **Crea tu aprendín con IA.** Escribes qué te gusta y qué le vas a enseñar. La IA de Antigravity (`agy2`) inventa un aprendín de tu mundo con nombre, personalidad, una misión que necesita el tema, su look y **5 fases de evolución**: cada fase corresponde a un paso del tema y le suma piezas. Si no hay IA, la página arma uno sola con el catálogo.
- **Personaje generado por código:** 6 formas, 16 emociones que se mezclan sin saltos y rasgos propios (tipo de ojos, boca, panza y marcas). Parpadea, respira, mira al puntero, habla, salta, saluda, entiende, se equivoca y evoluciona.
- **Vestuario:** 8 zonas con 76 piezas que se adaptan a cualquier forma. La IA solo puede elegir piezas del catálogo, porque el esquema JSON se lo impide.
- **12 mundos de ejemplo** y un editor de forma, color, rasgos y piezas.

## Cómo verlo

Con IA (necesita Node 20+ y `agy2` con sesión iniciada):

```bash
cd Aprendizaje_Individual
npm start              # o: node servidor.mjs
```

Abre http://localhost:8080. Variables: `MODELO` (por defecto `gemini-3.8-flash-low`), `AGY` (por defecto `agy2`), `PUERTO`, `HOST`. Con `npm run ensayo`, cada aprendín creado se guarda y, si se pide igual, se repite al instante, lo que sirve para ensayar el pitch.

Sin IA, con cualquier servidor estático: `python3 -m http.server 8080` y abre http://localhost:8080/taller.html

## Archivos

| Archivo | Qué hace |
|---|---|
| `js/aprendin.js` | El personaje: formas, cara, emociones, animación y acciones |
| `js/piezas.js` | El vestuario por zonas y el catálogo que usará la IA |
| `js/mundos.js` | Los mundos de ejemplo |
| `js/creador.js` | El esquema que se le pide a la IA, el armado de las fases y el creador sin IA |
| `servidor.mjs`, `ia/crear-aprendin.md` | El servidor que conecta con `agy2` y las instrucciones para la IA |
| `js/color.js`, `js/trazos.js` | Colores y utilidades de dibujo |
| `js/taller.js`, `taller.html`, `css/` | La página del taller |
