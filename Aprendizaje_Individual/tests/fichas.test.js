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

test('una regla para sumar numeradores incluye cuándo se puede aplicar', () => {
  const visual = { tipo: 'fraccion', operacion: 'suma', fracciones: [{ num: 1, den: 4 }, { num: 2, den: 4 }, { num: 3, den: 4 }] };
  const ficha = { ...base, visual, ejemplo: ejemplo('3/4'), idea: 'Solo se suman los numeradores para contar las partes que tomaste.' };
  assert.match(revisarFichaGenerada(ficha).join(), /requiere el mismo denominador/);
  assert.deepEqual(revisarFichaGenerada({ ...ficha, idea: 'Con el mismo denominador, suma los numeradores y conserva el denominador.' }), []);
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

test('las reacciones de práctica se aplican a la ficha abierta y solo entender permite avanzar', () => {
  for (const tema of ['Fracciones', 'Porcentajes', 'Ecuaciones lineales']) {
    const pedido = { tema, nivel: 'cero', gustos: 'fútbol' };
    const inicial = fichaInicioLocal(pedido);
    const historial = historialDe([{ datos: fichaInicioLocal({ tema, nivel: 'bastante' }), reaccion: 'vista' }]);
    const reaccionar = (reaccion, fichaBase, opciones = {}) => fichaInicioLocal({ ...pedido, historial, reaccion, fichaBase, ...opciones });

    const clara = reaccionar('duda', inicial);
    assert.equal(clara.subtema, inicial.subtema);
    assert.deepEqual(clara.ejemplo, inicial.ejemplo);

    const otra = reaccionar('ejemplo', clara);
    assert.equal(otra.subtema, inicial.subtema);
    assert.notEqual(otra.ejemplo.situacion, clara.ejemplo.situacion);
    assert.equal(otra.visual.tipo, clara.visual.tipo);

    const enfoque = reaccionar('enfoque', otra);
    assert.equal(enfoque.subtema, inicial.subtema);
    assert.deepEqual(enfoque.ejemplo, otra.ejemplo);
    assert.notEqual(enfoque.visual.tipo, otra.visual.tipo);

    const reto = reaccionar('reto', otra);
    assert.equal(reto.subtema, inicial.subtema);
    assert.notEqual(reto.ejemplo.situacion, otra.ejemplo.situacion);
    assert.match(reto.ejemplo.pregunta, /\?$/);

    const avanzado = reaccionar('entendio', inicial);
    if (tema !== 'Ecuaciones lineales') assert.notEqual(avanzado.subtema, inicial.subtema);
    const enClase = reaccionar('entendio', inicial, { objetivo: inicial.subtema });
    assert.equal(enClase.subtema, inicial.subtema);
  }
});

test('una ficha guardada de IA se puede repasar aunque el catálogo local no incluya su subtema', () => {
  const anterior = {
    titulo: 'La función de la clorofila', subtema: 'Captación de luz', idea: 'La clorofila absorbe luz.',
    visual: { tipo: 'partes', items: [{ texto: 'Clorofila' }, { texto: 'Luz' }] },
    ejemplo: { situacion: 'Observa una hoja iluminada.', pregunta: '¿Qué pigmento capta luz?', pasos: ['Identifica el pigmento verde.'], resultado: 'Clorofila' }
  };
  const repaso = fichaInicioLocal({ tema: 'Fotosíntesis', reaccion: 'enfoque', fichaBase: anterior });
  assert.equal(repaso.subtema, anterior.subtema);
  assert.equal(repaso.ejemplo.situacion, anterior.ejemplo.situacion);
  assert.equal(repaso.visual.tipo, 'pasos');
  const otro = fichaInicioLocal({ tema: 'Fotosíntesis', reaccion: 'ejemplo', fichaBase: anterior });
  assert.equal(otro.subtema, anterior.subtema);
  assert.match(otro.aviso, /otro ejemplo de este subtema/);
});

test('el servidor comprueba la continuidad del subtema y la diferencia entre otro ejemplo y otro enfoque', () => {
  const f = fichaInicioLocal({ tema: 'Fracciones', nivel: 'cero' });
  const referencia = { subtema: f.subtema, situacion: f.ejemplo.situacion, pregunta: f.ejemplo.pregunta };
  const opciones = { referencia, reaccion: 'enfoque' };
  assert.deepEqual(revisarFichaGenerada(f, opciones), []);
  assert.match(revisarFichaGenerada({ ...f, subtema: 'Sumar fracciones' }, opciones).join(), /Conserva el subtema/);
  assert.match(revisarFichaGenerada({ ...f, ejemplo: { ...f.ejemplo, situacion: 'Reparte cuatro galletas.' } }, opciones).join(), /Conserva literalmente/);
  assert.match(revisarFichaGenerada(f, { referencia, reaccion: 'ejemplo', ejemploAnterior: referencia.situacion }).join(), /Cambia la situación/);
  assert.match(revisarFichaGenerada(f, { referencia, reaccion: 'entendio' }).join(), /Avanza a un subtema distinto/);
});
