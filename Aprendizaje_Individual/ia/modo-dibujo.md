## Lo más importante: que se parezca a lo que le gusta

Si el estudiante nombra un personaje, un equipo, un jugador, un artista o un estilo concreto, el aprendín tiene que ir **disfrazado de eso** y reconocerse a primera vista, como un muñeco tierno con ese disfraz. Para lograrlo **tú dibujas** su pelo, su ropa y sus accesorios con trazos SVG, en el campo «dibujo». El código pone encima los ojos, la boca, los bracitos y los pies.

1. **Colores exactos** del personaje, en hexadecimal (#RRGGBB). El cuerpo es la piel: «durazno» para personajes humanos de piel clara, «cacao» para piel morena, o el color de la criatura si no es humano (un monstruo verde, un robot gris).
2. **Lo que más se reconoce primero**: la silueta del pelo (o el casco, la gorra, la capucha), los colores de la ropa y uno o dos detalles icónicos (una banda en la frente, un sombrero de paja, una cicatriz, una camiseta con rayas y su número, unas orejas).
3. **Nunca** escribas texto, letras, logos ni marcas en el dibujo. Los números de camiseta sí: usa el campo «numero».
4. **Nunca** uses el nombre del personaje como nombre del aprendín, ni uno que suene casi igual («Koku» por Goku). En «inspiracion» escribe en qué te inspiraste.

## El lienzo

El aprendín es una **bolita** (cabeza y cuerpo son lo mismo, como un muñeco redondo) dibujada en estas coordenadas (x hacia la derecha, y hacia abajo):

- Borde de la bolita: arriba al centro (130, 90); a la altura y=102 va de x=89 a x=171; y=112: 75 a 185; y=127: 63 a 197; y=147: 54 a 206; y=169 (lo más ancho): 51 a 209; y=192: 53 a 207; y=214: 64 a 196; abajo es plana en y=236.
- **Ojos**: centros en (108, 147) y (152, 147); cada uno ocupa de y=129 a y=165. Las cejas van en y≈118. **Boca**: (130, 173).
- **Zona de la cara**, que nada puede tapar: el rectángulo de x=92 a x=168 y de y=124 a y=182. Tampoco tapes las mejillas (alrededor de (82, 163) y (178, 163)) salvo con marcas finas como bigotes o rayas.
- Bracitos cortos en los costados, a la altura y≈170 (los dibuja el código). Pies en (100, 231) y (160, 231) (los dibuja el código; tú eliges su color en «pies»).
- Puedes dibujar fuera de la bolita (pelo en puntas, orejas, cuernos, una gorra), entre x=-10 y x=270 y desde y=-10.

## Las capas del dibujo

Cada capa es un texto con figuras SVG: `path`, `circle`, `ellipse`, `rect`, `polygon`, `line` y `g`, con los atributos `d`, `cx`, `cy`, `r`, `rx`, `ry`, `x`, `y`, `width`, `height`, `points`, `fill`, `stroke`, `stroke-width`, `stroke-linejoin`, `stroke-linecap`, `opacity` y `transform`. Nada más (sin `text`, `style`, degradados ni imágenes). Usa comillas simples en los atributos.

- **pelo_atras**: va **detrás** de la bolita; solo se ve lo que sobresale del borde. Aquí va la silueta grande del pelo: puntas, melena, cola de caballo, orejas, cuernos, capucha. Haz una sola figura grande que rodee la parte de arriba de la cabeza y salga por los lados.
- **pelo_frente**: va **delante**, sobre la frente. Cubre la parte de arriba de la cabeza y termina en el flequillo. Debe pegarse al borde de la bolita (empieza fuera del borde, a un costado, por ejemplo en (52, 152), sube por encima de y=90 y baja por el otro lado), y su borde de abajo forma el flequillo: entre x=92 y x=168 no puede bajar de y=122. A los costados puede bajar más (patillas, mechones largos).
- **ropa**: va **sobre el cuerpo y se recorta a la forma de la bolita**, así que puedes dibujar rectángulos anchos sin preocuparte por el borde. Empieza en el cuello, más o menos en y=184, y llega hasta abajo (y=240). Usa x de 40 a 220. Aquí van el cuello de la ropa, las rayas, el cinturón, un emblema genérico en el pecho (cerca de (130, 205) o de (160, 198)), los botones.
- **extra**: va **delante de todo** salvo los brazos. Accesorios: banda en la frente (a la altura y≈110 a 122, de x=72 a 188), gorra o sombrero (sobre la cabeza, la parte de arriba de la bolita está en y=90), bufanda o collar en el cuello (y≈180 a 192), bigotes o marcas en las mejillas, una cicatriz bajo un ojo, antifaz que rodea los ojos sin taparlos (solo el contorno). Puede ir vacío.
- **final_atras** y **final_frente**: el pelo de su transformación más famosa (otro color, más largo o más parado). Solo pelo: nada de marcos, cajas ni rayos (para eso está el aura del catálogo). Si el personaje no tiene transformación de pelo, déjalos vacíos.
- Si lleva **camiseta con número**, pon el número en «numero»: el código lo escribe en el pecho, así que deja libre el centro del pecho (alrededor de (130, 214)).

Estilo: muñeco tierno, figuras grandes y simples, colores planos con un borde del mismo color pero más oscuro (`stroke-width` de 2.5 a 3.5, `stroke-linejoin='round'`). Entre 1 y 12 figuras por capa. Nada más chico que 5 px.

### Ejemplo de técnica: pelo negro en puntas grandes y traje de artes marciales naranja

```
pelo_atras: <path d='M58 150 L22 128 L56 116 L30 80 L78 90 L70 44 L108 78 L124 26 L146 76 L184 40 L182 88 L228 74 L204 116 L238 126 L202 150 Z' fill='#23232F' stroke='#0E0E16' stroke-width='3' stroke-linejoin='round'/>
pelo_frente: <path d='M52 152 C48 108 80 82 130 82 C180 82 212 108 208 152 L196 132 L188 112 L170 120 L160 102 L146 118 L134 98 L122 118 L104 104 L96 120 L76 114 L66 132 Z' fill='#23232F' stroke='#0E0E16' stroke-width='3' stroke-linejoin='round'/>
ropa: <rect x='40' y='184' width='180' height='60' fill='#FF8A1E'/><path d='M108 184 L130 214 L152 184 Z' fill='#2A4BA0'/><rect x='40' y='214' width='180' height='9' fill='#2A4BA0'/>
```

### Ejemplo de técnica: pelo castaño liso, peinado hacia un lado

```
pelo_atras: <path d='M64 165 C48 135 55 95 90 75 C110 65 150 65 170 75 C205 95 212 135 196 165 C186 145 180 120 170 110 C150 95 110 95 90 110 C80 120 74 145 64 165 Z' fill='#3E2723' stroke='#271815' stroke-width='3' stroke-linejoin='round'/>
pelo_frente: <path d='M58 148 C55 105 85 78 130 78 C175 78 205 105 202 148 C195 125 185 112 172 110 C158 108 152 116 138 114 C124 112 118 104 102 106 C88 108 75 118 58 148 Z' fill='#4E342E' stroke='#271815' stroke-width='3' stroke-linejoin='round'/>
```

Son solo ejemplos de cómo se construye: **no copies sus coordenadas**. Cada personaje tiene **su propia silueta**: pelo liso que cae a los lados (pelo_atras como una melena ancha que baja hasta y=200), pelo corto y redondo (pelo_frente casi sin puntas), una gorra (en extra, un domo sobre la cabeza y una visera), una capucha o un casco (pelo_atras grande y redondo), orejas de animal (pelo_atras con dos triángulos arriba). Piensa primero cómo se ve el personaje de frente y luego traza sus formas con estas medidas.

### Piezas del catálogo

Además de tu dibujo, puedes sumar piezas del catálogo para lo que se sostiene o se mueve: un objeto en la mano, muñequeras o guantes en los brazos, algo en la espalda (capa, alas, cola, espada) y un aura. Elige solo piezas que tengan que ver con el personaje o su mundo (un balón para un basquetbolista, una espada para un espadachín), no objetos de estudio al azar. Las piezas de tu dibujo se usan así en las fases:

- pelo «dibujo»: tu pelo_atras y pelo_frente (va en la fase 0).
- cuerpo «dibujo»: tu ropa (va en la fase 0 o 1).
- cabeza «dibujo»: tus accesorios de la capa extra (en la fase que quieras).
- pelo «dibujo_final»: el pelo de la transformación (solo en la fase 4, si dibujaste final_atras o final_frente).
