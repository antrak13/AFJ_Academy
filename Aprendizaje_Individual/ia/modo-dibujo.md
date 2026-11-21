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

Estilo: muñeco tierno y bien terminado, como un peluche oficial del personaje. Colores planos con un borde del mismo color pero más oscuro (`stroke-width` de 2.5 a 3.5, `stroke-linejoin='round'`), y un brillo o una sombra suave donde ayude (una franja más clara en el pelo, una línea más oscura en un pliegue). Usa las figuras que hagan falta para que se reconozca (hasta 25 por capa). Nada más chico que 4 px.

### Primero el boceto

Antes de trazar, escribe en **boceto** cómo se ve el personaje de frente, en 3 a 5 oraciones: el pelo (largo, volumen, forma, si tiene puntas, si es liso, ondulado, con rulos o recogido, qué cubre la frente y hasta dónde cae, y su color exacto), la ropa pieza por pieza con sus colores (qué va debajo, qué va encima, cuello, cinturón, mangas) y los 2 o 3 detalles que lo hacen inconfundible. Después dibuja **exactamente** eso.

### Técnicas de pelo

Elige la técnica que corresponde al personaje. **No pongas puntas a un personaje que no las tiene**: una melena es una masa grande que cae; un pelo liso tiene bordes suaves; los rulos son círculos. Combina técnicas si hace falta (melena con flequillo en puntas, puntas con una cola). Estos ejemplos ya están probados sobre la bolita; úsalos para entender la construcción, no copies sus coordenadas tal cual.

#### Puntas de anime (pelo parado en puntas grandes)

```
pelo_atras: <path d='M58 150 L22 128 L56 116 L30 80 L78 90 L70 44 L108 78 L124 26 L146 76 L184 40 L182 88 L228 74 L204 116 L238 126 L202 150 Z' fill='#23232F' stroke='#0E0E16' stroke-width='3' stroke-linejoin='round'/>
pelo_frente: <path d='M52 152 C48 108 80 82 130 82 C180 82 212 108 208 152 L196 132 L188 112 L170 120 L160 102 L146 118 L134 98 L122 118 L104 104 L96 120 L76 114 L66 132 Z' fill='#23232F' stroke='#0E0E16' stroke-width='3' stroke-linejoin='round'/>
```

#### Corto y peinado hacia un lado (bordes suaves, sin puntas)

```
pelo_atras: <path d='M64 165 C48 135 55 95 90 75 C110 65 150 65 170 75 C205 95 212 135 196 165 C186 145 180 120 170 110 C150 95 110 95 90 110 C80 120 74 145 64 165 Z' fill='#3E2723' stroke='#271815' stroke-width='3' stroke-linejoin='round'/>
pelo_frente: <path d='M58 148 C55 105 85 78 130 78 C175 78 205 105 202 148 C195 125 185 112 172 110 C158 108 152 116 138 114 C124 112 118 104 102 106 C88 108 75 118 58 148 Z' fill='#4E342E' stroke='#271815' stroke-width='3' stroke-linejoin='round'/>
```

#### Melena larga y lisa (cae a los costados hasta abajo, flequillo recto)

```
pelo_atras: <path d='M44 150 C38 96 76 62 130 62 C184 62 222 96 216 150 C220 178 224 204 230 226 C212 236 192 234 178 224 C182 200 184 178 182 160 L78 160 C76 178 78 200 82 224 C68 234 48 236 30 226 C36 204 40 178 44 150 Z' fill='#2B2440' stroke='#15111F' stroke-width='3' stroke-linejoin='round'/>
pelo_frente: <path d='M50 156 C46 102 82 76 130 76 C178 76 214 102 210 156 C206 138 200 126 192 120 C184 122 176 118 170 114 C160 120 146 120 136 114 C124 120 110 120 100 114 C92 120 80 122 68 120 C60 128 54 140 50 156 Z' fill='#2B2440' stroke='#15111F' stroke-width='3' stroke-linejoin='round'/><path d='M84 92 C100 84 118 82 132 84' fill='none' stroke='#5A4F7A' stroke-width='3' stroke-linecap='round'/>
```

#### Melena larga salvaje (masa enorme y despeinada que cae por la espalda, con bordes dentados)

```
pelo_atras: <path d='M52 128 L20 112 L42 96 L18 70 L56 72 L48 40 L84 58 L92 26 L114 52 L132 20 L148 52 L172 28 L176 60 L212 42 L204 76 L240 72 L218 100 L246 114 L220 128 L250 150 L222 160 L246 188 L216 188 L234 218 L200 208 L206 236 L54 236 L60 208 L26 218 L44 188 L14 188 L38 160 L10 150 L40 128 Z' fill='#F2F0EA' stroke='#B9B4C6' stroke-width='3' stroke-linejoin='round'/>
pelo_frente: <path d='M50 154 C46 100 82 78 130 78 C178 78 214 100 210 154 L200 128 L188 114 L176 124 L164 104 L150 120 L134 100 L120 120 L106 104 L94 122 L80 112 L68 128 Z' fill='#F2F0EA' stroke='#B9B4C6' stroke-width='3' stroke-linejoin='round'/>
```

#### Rulos o afro (círculos que se superponen)

```
pelo_atras: <g fill='#2A1A12' stroke='#120A06' stroke-width='3'><circle cx='70' cy='92' r='30'/><circle cx='104' cy='68' r='32'/><circle cx='146' cy='64' r='32'/><circle cx='186' cy='86' r='30'/><circle cx='210' cy='122' r='24'/><circle cx='50' cy='124' r='24'/></g>
pelo_frente: <g fill='#2A1A12' stroke='#120A06' stroke-width='3'><circle cx='72' cy='112' r='18'/><circle cx='98' cy='98' r='20'/><circle cx='128' cy='94' r='20'/><circle cx='158' cy='98' r='20'/><circle cx='186' cy='112' r='18'/></g><path d='M60 116 Q130 84 200 116' fill='none' stroke='#2A1A12' stroke-width='14'/>
```

#### Cola de caballo o moño (cabeza cubierta y la cola sale por un lado o arriba)

```
pelo_atras: <path d='M48 150 C44 100 80 72 130 72 C180 72 216 100 212 150 Z' fill='#C9772E' stroke='#8A4E1A' stroke-width='3'/><path d='M190 92 C226 96 244 130 236 176 C232 196 222 210 210 218 C214 196 214 174 206 156 C200 140 192 124 182 110 Z' fill='#C9772E' stroke='#8A4E1A' stroke-width='3' stroke-linejoin='round'/><circle cx='190' cy='98' r='8' fill='#E8467C' stroke='#A82A56' stroke-width='2.5'/>
pelo_frente: <path d='M52 150 C48 104 82 80 130 80 C178 80 212 104 208 150 C202 128 192 116 178 110 C150 118 112 116 86 104 C72 112 58 128 52 150 Z' fill='#C9772E' stroke='#8A4E1A' stroke-width='3' stroke-linejoin='round'/>
```

Otras: **rapado** (solo pelo_frente, un casquete fino que no baja de y=100, sin pelo_atras); **trenzas** (en pelo_atras, cadenas de óvalos que bajan por los costados); **pelo con mechones de colores** (una segunda figura de otro color encima); **calvo** (sin pelo, y quizás un detalle en extra).

### La ropa con detalle

La ropa es la segunda cosa que más se reconoce. Constrúyela en capas, de atrás hacia adelante, dentro de la capa ropa:

1. La prenda de abajo o de base: un rectángulo ancho (x=40, y=184, ancho 180, alto 60) con su color.
2. Lo que va encima: una chaqueta o chaleco abierto son dos paneles laterales que dejan ver la base en el centro; un kimono o gi tiene las solapas cruzadas en V; una camiseta de fútbol tiene rayas o franjas.
3. El cuello (redondo, en V, alto, solapas), el cinturón o la faja (una franja horizontal cerca de y=214), botones, cierres, bolsillos.
4. Un emblema genérico en el pecho (círculo, estrella, rombo, rayo): nunca letras ni logos.

Los brazos los dibuja el código con el color de la piel. Si el personaje tiene mangas, guantes o muñequeras, usa la pieza de brazos del catálogo («mangas», «guantes», «munequeras») con el color de su ropa.

### Piezas del catálogo

Además de tu dibujo, puedes sumar piezas del catálogo para lo que se sostiene o se mueve: un objeto en la mano, muñequeras o guantes en los brazos, algo en la espalda (capa, alas, cola, espada) y un aura. Elige solo piezas que tengan que ver con el personaje o su mundo (un balón para un basquetbolista, una espada para un espadachín), no objetos de estudio al azar. Las piezas de tu dibujo se usan así en las fases:

- pelo «dibujo»: tu pelo_atras y pelo_frente (siempre en la fase 0).
- cuerpo «dibujo»: tu ropa (siempre en la fase 0: desde que nace tiene que reconocerse).
- cabeza «dibujo»: tus accesorios de la capa extra (en la fase que quieras).
- pelo «dibujo_final»: el pelo de la transformación (solo en la fase 4, si dibujaste final_atras o final_frente).
