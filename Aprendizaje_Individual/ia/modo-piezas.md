## Lo más importante: que se parezca a lo que le gusta

El código dibuja al personaje con piezas de un catálogo: tú eliges las piezas, sus colores, el peinado y el traje a medida.

Si el estudiante nombra un personaje, un equipo, un artista o un estilo concreto, el aprendín tiene que ir **disfrazado de eso** y reconocerse a primera vista, como un muñeco tierno con ese disfraz:

1. **Colores exactos.** Copia la paleta del personaje en el pelo, la ropa, los brazos (muñequeras, guantes, mangas) y los pies (zapatos o botas). El cuerpo suele ir en «durazno» o «rosado», como si fuera la piel. Usa otro color solo si el personaje no es humano (una criatura amarilla, un robot).
2. **Su peinado.** Es lo que más se reconoce. Si el personaje tiene un peinado característico, **diséñalo a medida** en el campo «peinado» y usa la pieza de pelo «peinado» con su color. Si lleva sombrero o casco icónico, usa esa pieza de cabeza (sombrero de paja, vincha con placa…). Ver «Cómo diseñar el peinado» más abajo.
3. **Su ropa:** diséñala a medida en el campo «traje» y usa la pieza de cuerpo «traje». Elige el color de arriba y de abajo, el tipo de cuello y lo que se ve debajo, el cinturón, el estampado y un emblema genérico. Agrega 1 o 2 accesorios icónicos del catálogo: muñequeras, mangas, vincha con placa, sombrero de paja, marcas de bigotes, cicatriz, espada en la espalda, antifaz, capa, orejas largas, mejillas de color, cola de rayo.
4. **Desde la fase 0 tiene que reconocerse**, al menos por el peinado y los colores. Las fases siguientes completan el disfraz y la fase 4 es su transformación más famosa (pelo de transformación con aura dorada, por ejemplo).
5. **Nunca** uses el nombre del personaje como nombre del aprendín, ni uno que suene casi igual (nada de «Koku» por Goku o «Naruo» por Naruto), ni escribas logos o marcas. Inventa un nombre propio y tierno. En «inspiracion» escribe en qué te inspiraste.

Ejemplos de recetas con el catálogo (adáptalas a lo que pida el estudiante):

- Luchador de anime de traje naranja: pelo «peinado» carbon (puntas grandes en abanico); traje arriba mandarina, cuello cruzado, interior indigo, cinturón indigo, abajo mandarina; brazos munequeras indigo; pies indigo. Fase 4: pelo «peinado_final» sol con las puntas más paradas + aura super.
- Ninja de anime naranja: pelo «peinado» sol (puntas cortas en abanico); cabeza placa; cara bigotes; traje arriba mandarina, cuello alto, interior carbon, abajo mandarina; pies carbon.
- Pirata de sombrero de paja: pelo «peinado» carbon (corto y despeinado); cabeza paja; cara cicatriz; traje arriba coral, cuello abierto, interior durazno (se ve la piel), cinturón sol, abajo cielo; pies cacao.
- Futbolista de una selección con rayas: traje arriba cielo, estampado verticales nieve, cuello redondo, abajo carbon, con su número; pelo «peinado» cacao.
- Criatura eléctrica amarilla: color sol; cabeza orejas_largas (punta carbon); cara mejillas; espalda cola_rayo.
- Héroe arácnido rojo y azul: color durazno; cara antifaz coral; traje arriba coral, estampado diagonal cielo, emblema gota carbon, abajo cielo; brazos mangas coral.

Si no nombra nada concreto, inventa un personaje propio de ese mundo con piezas que lo evoquen.

## Cómo diseñar el peinado

Imagina el pelo del personaje visto de frente y descríbelo como una lista de mechones que salen del borde de la cabeza, de izquierda a derecha:

- **pos**: dónde nace cada mechón (-1 es el costado izquierdo a la altura de los ojos, 0 la coronilla, 1 el costado derecho).
- **largo** y **ancho**: puntas cortas (10 a 20) para pelo corto, largas (45 a 70) para pelo de anime exagerado.
- **dir**: hacia dónde apunta la punta, en grados. 0 es hacia arriba, -90 hacia la izquierda, 90 hacia la derecha, 180 hacia abajo. Un peinado en abanico va de unos -100 en el costado izquierdo a 100 en el derecho; uno que se para hacia arriba concentra las puntas entre -40 y 40.
- **flequillo**: los mechones que caen sobre la frente, con su forma propia (por ejemplo, tres puntas desiguales y una que cae hacia un lado).
- **tapa**: cuánto cubre el pelo la cabeza (0,9 a 1 para pelo abundante).

Ejemplo de luchador de anime con pelo negro en puntas grandes:
mechones: pos -0,95 largo 30 ancho 20 dir -105 · pos -0,65 largo 46 ancho 24 dir -68 · pos -0,3 largo 58 ancho 26 dir -32 · pos 0,05 largo 50 ancho 22 dir -4 · pos 0,4 largo 60 ancho 26 dir 28 · pos 0,75 largo 46 ancho 24 dir 62 · pos 1 largo 30 ancho 20 dir 100; flequillo: x -0,55 largo 24 ancho 16 giro -18 · x -0,15 largo 14 ancho 14 giro 0 · x 0,3 largo 26 ancho 18 giro 14; tapa 0,95.

Su transformación (peinado_final) puede tener las mismas puntas pero más largas y apuntando más hacia arriba (dir más cerca de 0).
