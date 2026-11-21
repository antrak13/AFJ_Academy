# Aprendizaje individual · Aprendines

Responsable: Freddy

En el estudio individual, el estudiante no recibe una explicación: **le enseña a un aprendín**. El aprendín es un personaje que viene del mundo que le gusta al estudiante (cocina, fútbol, Andes, videojuegos…), no sabe casi nada y aprende lo que le explican. Mientras aprende, gana piezas y se transforma.

## Lo que hay hoy

**Taller de aprendines** (`taller.html`). Es la base visual de los personajes:

- Cuerpo y cara generados por código. Hay 6 formas y 16 emociones que se mezclan sin saltos.
- Animaciones: parpadea, respira, mira al puntero, habla, salta, saluda, entiende, se equivoca y evoluciona.
- Vestuario en 8 zonas: cabeza, pelo, cara, cuello, cuerpo, espalda, mano y aura. Son 76 piezas que se adaptan a cualquier forma.
- 5 niveles de aprendizaje: a más nivel, más piezas visibles.
- 12 mundos de ejemplo y un editor para armar el look. El look es un JSON chico, lo mismo que elegirá la IA en la clase.

## Cómo verlo

Los módulos de JavaScript necesitan un servidor local, porque no abren con doble clic:

```bash
cd Aprendizaje_Individual
python3 -m http.server 8080
```

Abre http://localhost:8080/taller.html

## Archivos

| Archivo | Qué hace |
|---|---|
| `js/aprendin.js` | El personaje: formas, cara, emociones, animación y acciones |
| `js/piezas.js` | El vestuario por zonas y el catálogo que usará la IA |
| `js/mundos.js` | Los mundos de ejemplo |
| `js/color.js`, `js/trazos.js` | Colores y utilidades de dibujo |
| `js/taller.js`, `taller.html`, `css/` | La página del taller |
