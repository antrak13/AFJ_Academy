// Clase de ejemplo con Kori: los 4 pasos ya enseñados, sus fichas y lo que midió la IA.
// Sirve para mostrar la prueba en equipo sin dar toda la clase: clase.html?ejemplo=prueba
// En el paso 2 la explicación tuvo un error, así que en la prueba Kori va a caer en esa trampa.
const F = {
  1: { titulo: 'Partes iguales de un entero', icono: 'cocina', idea: 'Una fracción son partes iguales de un entero: abajo va en cuántas partes lo partiste y arriba cuántas tomas.', visual: { tipo: 'fraccion', titulo: 'Un cuarto del filete de dinosaurio', fracciones: [{ num: 1, den: 4, etiqueta: 'Mi porción de carne' }], operacion: 'ninguna', forma: 'pizza' }, ejemplo: { situacion: 'Kori parte un filete de dinosaurio en 4 trozos iguales y se come 1.', pasos: ['El filete se partió en 4: va abajo', 'Me comí 1: va arriba'], resultado: 'Me comí 1/4 del filete' }, cuidado: 'Creí que valía cortar trozos desiguales, pero las partes deben ser del mismo tamaño.', de_ti: 'Abajo va en cuántos partiste y arriba cuántos tomaste.' },
  2: { titulo: 'Fracciones equivalentes', icono: 'balanza', idea: 'Dos fracciones son equivalentes si representan la misma cantidad: multiplicas o divides arriba y abajo por el mismo número.', visual: { tipo: 'fraccion', titulo: 'Media semilla es lo mismo que dos cuartos', fracciones: [{ num: 1, den: 2, etiqueta: 'Semilla de Gohan' }, { num: 2, den: 4, etiqueta: 'Semilla de Kori' }], operacion: 'igual', forma: 'pizza' }, ejemplo: { situacion: 'Gohan comió 1/2 semilla del ermitaño y Kori 2/4. ¿Comieron lo mismo?', pasos: ['1/2 = (1×2)/(2×2) = 2/4'], resultado: 'Sí, comieron lo mismo' }, cuidado: 'Pensé que 2/4 era más que 1/2 porque sus números son más grandes.', de_ti: 'Si multiplicas arriba y abajo por lo mismo, la porción no cambia.' },
  3: { titulo: 'Sumar fracciones', icono: 'reloj', idea: 'Para sumar fracciones con distinto denominador, primero las conviertes en equivalentes con el mismo denominador y luego sumas los de arriba.', visual: { tipo: 'fraccion', titulo: 'Entrenamiento de la mañana y de la tarde', fracciones: [{ num: 1, den: 2, etiqueta: 'Mañana' }, { num: 1, den: 4, etiqueta: 'Tarde' }, { num: 3, den: 4 }], operacion: 'suma', forma: 'pizza' }, ejemplo: { situacion: 'Kori entrena 1/2 hora en la mañana y 1/4 de hora en la tarde. ¿Cuánto entrena?', pasos: ['1/2 = 2/4', '2/4 + 1/4 = 3/4'], resultado: '3/4 de hora' }, cuidado: 'Sumé arriba con arriba y abajo con abajo (2/6). Primero hay que igualar los pedazos.', de_ti: 'No puedes sumar pedazos de distinto tamaño: primero córtalos igual.' },
  4: { titulo: 'Problemas con fracciones mixtas', icono: 'meta', idea: 'Un número mixto como 1 1/2 se convierte en fracción (3/2) antes de sumar o restar.', visual: { tipo: 'ecuacion', titulo: 'Juntar la carne del entrenamiento', lineas: [{ expresion: '1 1/2 + 3/4' }, { expresion: '3/2 + 3/4', nota: 'Paso el mixto a fracción' }, { expresion: '6/4 + 3/4', nota: 'Igualo los cuartos' }, { expresion: '9/4' }, { expresion: '2 1/4', nota: 'Vuelvo a mixto' }] }, ejemplo: { situacion: 'Kori tiene 1 1/2 filetes y su maestro le regala 3/4 más. ¿Cuántos tiene?', resultado: '2 1/4 filetes' }, cuidado: 'Olvidé convertir el número mixto antes de sumar.', de_ti: 'El entero también son cuartos: 1 entero son 4/4.' }
};
const CHAT = [
  [1, 'apr', 'Para mi misión primero necesito entender esto: partes iguales de un entero. ¿Me lo explicas como si no supiera nada?', 'curioso'],
  [1, 'yo', 'Una fracción es cuando partes algo en partes iguales y tomas algunas de esas partes.'],
  [1, 'apr', 'Si corto un filete en cuatro pedazos, pero uno queda gigante y los otros chiquitos, ¿cada uno es 1/4?', 'pensando', '1 filete en 4 pedazos: 1 gigante y 3 enanos. ¿Cada uno es 1/4?'],
  [1, 'yo', 'No, los pedazos tienen que ser del mismo tamaño. Abajo va en cuántos partiste y arriba cuántos tomaste.'],
  [1, 'apr', '¡Qué alivio, ya entendí! El número de abajo dice en cuántos corté y el de arriba cuántos agarré.', 'eureka', '1/4 de carne: 1 pedazo de 4 iguales'],
  [1, 'sis', 'Kori subió a Guerrero enfocado', 'evo'], [1, 'sis', 'Nueva ficha: Partes iguales de un entero', 'ficha', 1],
  [2, 'apr', 'Ya sé repartir en partes iguales, pero ¿cómo sé si 2/4 de semilla del ermitaño es lo mismo que 1/2?', 'curioso'],
  [2, 'yo', 'La que tiene números más grandes es más grande, así que 2/4 es más.'],
  [2, 'apr', '¡Entonces me toca más semilla con 2/4! Le voy a decir a Gohan que me dé su parte también.', 'feliz', '2/4 > 1/2 porque 2 > 1'],
  [2, 'yo', 'Espera, me equivoqué. Si multiplicas arriba y abajo de 1/2 por 2 te da 2/4: son la misma cantidad.'],
  [2, 'apr', '¡Ahhh! Son lo mismo con otros números. Entonces Gohan y yo comimos igual.', 'eureka', '1/2 = 2/4'],
  [2, 'sis', 'Kori subió a Luchador experto', 'evo'], [2, 'sis', 'Nueva ficha: Fracciones equivalentes', 'ficha', 2],
  [3, 'apr', 'Si entreno 1/2 hora en la mañana y 1/4 en la tarde, ¿cuánto entreno en total?', 'curioso'],
  [3, 'yo', 'Primero conviertes 1/2 en 2/4 para que los pedazos sean iguales, y después sumas los de arriba: 2/4 + 1/4 = 3/4.'],
  [3, 'apr', 'A ver… ¿y por qué no sumo también los de abajo? 1/2 + 1/4 = 2/6.', 'confundido', '1/2 + 1/4 = 2/6'],
  [3, 'yo', 'Porque el de abajo dice el tamaño del pedazo, no cuántos tienes. Los cuartos siguen siendo cuartos.'],
  [3, 'apr', '¡Claro! Los de abajo son el tamaño. Entreno 3/4 de hora.', 'eureka', '2/4 + 1/4 = 3/4'],
  [3, 'sis', 'Kori subió a Fuerza desatada', 'evo'], [3, 'sis', 'Nueva ficha: Sumar fracciones', 'ficha', 3],
  [4, 'apr', 'Tengo 1 1/2 filetes y mi maestro me regala 3/4 más. ¿Cómo junto un número con fracción?', 'curioso'],
  [4, 'yo', 'Pasa 1 1/2 a fracción: 1 entero son 2/2, más 1/2 son 3/2. Luego igualas a cuartos: 6/4 + 3/4 = 9/4, que son 2 1/4.'],
  [4, 'apr', 'Entonces 1 1/2 + 3/4… 1 + 3/4 y aparte 1/2… ¿me da 1 5/4?', 'pensando', '1 + 1/2 + 3/4 = 1 5/4 ?'],
  [4, 'yo', 'Casi, 5/4 es más que un entero: 4/4 es otro entero, así que te queda 2 1/4.'],
  [4, 'apr', '¡Tengo 2 1/4 filetes! El entero también se puede partir en cuartos.', 'eureka', '9/4 = 2 1/4'],
  [4, 'sis', 'Kori subió a Super guerrero legendario', 'evo'], [4, 'sis', 'Nueva ficha: Problemas con fracciones mixtas', 'ficha', 4],
  [4, 'apr', '¡Ya aprendí los 4 pasos! Ahora viene la prueba de mi misión… Solo no puedo: ¿la respondemos juntos?', 'nervioso'],
  [5, 'sis', 'La prueba de la misión: la responden en equipo', 'prueba']
];
export function demoClase(a) {
  const chat = [{ de: 'apr', texto: a.saludo, emo: 'feliz', paso: 1, fase: 0 }];
  for (const [paso, de, texto, x, y] of CHAT) {
    if (de === 'sis') chat.push({ de, texto, tipo: x, ficha: y, paso });
    else chat.push({ de, texto, paso: Math.min(4, paso), ...(de === 'apr' ? { emo: x || 'neutral', fase: texto.startsWith('¡Ya aprendí') ? 4 : paso - 1, ...(y ? { intento: y } : {}) } : {}) });
  }
  return {
    paso: 5, chat, pista: '',
    fichas: Object.fromEntries(Object.entries(F).map(([p, datos]) => [p, { estado: 'lista', datos }])),
    medicion: {
      1: { turnos: [{ estado: 'parcial', nota: 'Definió bien partir y tomar partes; faltaba que fueran iguales.', fuente: 'ia' }, { estado: 'entendio', nota: 'Explicó numerador y denominador con un ejemplo.', fuente: 'ia' }] },
      2: { turnos: [{ estado: 'error', nota: 'Dijo que la fracción con números más grandes es mayor: es incorrecto.', fuente: 'ia' }, { estado: 'entendio', nota: 'Se corrigió y mostró cómo amplificar 1/2 a 2/4.', fuente: 'ia' }] },
      3: { turnos: [{ estado: 'parcial', nota: 'Dio el procedimiento correcto; faltaba explicar por qué no se suman los denominadores.', fuente: 'ia' }, { estado: 'entendio', nota: 'Explicó que el denominador es el tamaño del pedazo.', fuente: 'ia' }] },
      4: { turnos: [{ estado: 'parcial', nota: 'Procedimiento completo pero rápido.', fuente: 'ia' }, { estado: 'entendio', nota: 'Corrigió el 1 5/4 explicando que 4/4 es un entero.', fuente: 'ia' }] }
    }
  };
}
