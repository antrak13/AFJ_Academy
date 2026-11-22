import assert from 'node:assert/strict';
import test from 'node:test';
import { fichaInicioLocal, htmlFicha, htmlVisual, limpiarFicha, revisarFichaGenerada } from '../js/fichas.js';
import { historialDe } from '../js/fichas-apoyo.js';

const base = { titulo: 'Ensaya la idea', idea: 'Una idea con un ejemplo comprobable.' };
const ejemplo = resultado => ({ situacion: 'Simula el movimiento del ascensor.', pasos: ['Parte del nivel inicial.'], resultado });
const recta = { tipo: 'recta', saltos: true, marcas: [-5, -4, -3, -2, -1, 0].map(valor => ({ valor, texto: String(valor) })) };

test('la recta separa las marcas del eje del recorrido de la operación', () => {
  const ficha = { ...base, visual: { ...recta, recorrido: [-3, -5] }, ejemplo: ejemplo('−3 − 2 = −5') };
  assert.deepEqual(revisarFichaGenerada(ficha), []);
  assert.match(htmlVisual(limpiarFicha(ficha).visual), /Salto de −2 hasta -5/);
  assert.match(limpiarFicha(ficha).idea, /izquierda.*-5/);
  assert.match(revisarFichaGenerada({ ...ficha, visual: { ...recta, recorrido: [-5, -3] } }).join(), /sentido correcto/);
  assert.match(revisarFichaGenerada({ ...ficha, visual: recta }).join(), /recorrido explícito/);
  assert.deepEqual(limpiarFicha({ ...ficha, visual: recta }).visual.recorrido, [-3, -5]);
});

test('el visual y el texto de una resta de fracciones conservan el resultado negativo', () => {
  const visual = { tipo: 'fraccion', operacion: 'resta', fracciones: [{ num: 1, den: 6 }, { num: 3, den: 4 }, { num: -7, den: 12 }] };
  const ficha = { ...base, visual, ejemplo: ejemplo('Quedan −7/12') };
  const limpia = limpiarFicha(ficha);
  assert.deepEqual(revisarFichaGenerada(ficha), []);
  assert.deepEqual(limpia.visual.fracciones.at(-1), { num: -7, den: 12, etiqueta: '' });
  assert.match(htmlVisual(limpia.visual), /Segunda cantidad: 3\/4.*Igualamos tamaños a \/12.*Resultado: -7\/12/);
  assert.match(revisarFichaGenerada({ ...ficha, ejemplo: ejemplo('Quedan 7/12') }).join(), /resultado escrito/);
  assert.match(revisarFichaGenerada({ ...ficha, visual: { ...visual, fracciones: [...visual.fracciones.slice(0, 2), { num: 0, den: 1 }] } }).join(), /tercera fracción/);
});

test('en un reto se revela el gráfico junto con la solución', () => {
  const ficha = fichaInicioLocal({ tema: 'Fracciones equivalentes', gustos: 'pizzas', reaccion: 'reto' });
  const html = htmlFicha(ficha, { reto: true });
  assert.match(html, /¿cuántas cubren la misma cantidad\?/);
  assert.match(html, /<details class="fi-solucion"><summary>Ver solución<\/summary>[\s\S]*<figure[\s\S]*6\/8[\s\S]*<\/details>/);
  assert.doesNotMatch(html.split('<details')[0], /6\/8|<figure/);
});

test('la práctica cambia el objeto y el visual en los contextos que cubre', () => {
  const p = fichaInicioLocal({ tema: 'Fracciones equivalentes', gustos: 'hacer pizzas' });
  const n = fichaInicioLocal({ tema: 'Fracciones equivalentes', gustos: 'naves de Marte' });
  assert.equal(p.visual.forma, 'pizza');
  assert.equal(n.visual.forma, 'barra');
  assert.match(n.ejemplo.situacion, /depósitos/);
  const guia = fichaInicioLocal({ tema: 'Mitosis' });
  assert.match(guia.adaptacion, /no tiene una ficha de contenido/);
  assert.equal(guia.ejemplo.resultado, '');
});

test('el historial conserva la explicación y el ejemplo vistos, sin contar el origen como reacción', () => {
  const datos = fichaInicioLocal({ tema: 'Fracciones equivalentes', gustos: 'pizzas' });
  const [vista, dudosa] = historialDe([{ datos, reaccionOrigen: 'reto' }, { datos, reaccion: 'duda', nota: '¿Importa el tamaño del entero?' }]);
  assert.equal(vista.reaccion, 'vista');
  assert.equal(dudosa.nota, '¿Importa el tamaño del entero?');
  assert.equal(dudosa.idea, datos.idea);
  assert.equal(dudosa.situacion, datos.ejemplo.situacion);
});
