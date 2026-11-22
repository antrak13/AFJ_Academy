import assert from 'node:assert/strict';
import test from 'node:test';
import { avanceDelTema, debilidadesAula, estadoAlumno, hace } from '../js/docente-datos.js';
import { resumenAvance } from '../js/avance-nube.js';

const AHORA = Date.parse('2026-11-22T12:00:00Z');
const avance = (tema, medicion, extra = {}) => ({ id: tema, nombre: 'Kori', tema, conceptos: ['Partes iguales', 'Equivalentes', 'Suma', 'Problemas'], paso: 2, medicion, prueba: null, actualizado: '2026-11-22T11:00:00Z', ...extra });

test('elige el aprendín del tema del aula, o el más reciente', () => {
  const avs = [avance('la fotosíntesis', {}), avance('Fracciones', {})];
  assert.equal(avanceDelTema(avs, 'fracciones').tema, 'Fracciones');
  assert.equal(avanceDelTema(avs, 'química').tema, 'la fotosíntesis');
  assert.equal(avanceDelTema([], 'fracciones'), null);
});

test('marca a quien no empezó, se trabó en un paso o dejó de avanzar', () => {
  assert.deepEqual(estadoAlumno({ avances: [] }, 'fracciones', AHORA).motivos, ['Todavía no empezó']);
  const trabado = { avances: [avance('fracciones', { 1: [{ estado: 'error' }, { estado: 'vago' }] })] };
  assert.match(estadoAlumno(trabado, 'fracciones', AHORA).motivos[0], /Trabado en el paso 1/);
  const loSuperó = { avances: [avance('fracciones', { 1: [{ estado: 'error' }, { estado: 'vago' }, { estado: 'entendio' }] })] };
  assert.equal(estadoAlumno(loSuperó, 'fracciones', AHORA).ayuda, false);
  const bien = { avances: [avance('fracciones', { 1: [{ estado: 'parcial' }, { estado: 'entendio' }] })] };
  assert.equal(estadoAlumno(bien, 'fracciones', AHORA).ayuda, false);
  const quieto = { avances: [avance('fracciones', { 1: [{ estado: 'entendio' }] }, { actualizado: '2026-11-18T12:00:00Z' })] };
  assert.match(estadoAlumno(quieto, 'fracciones', AHORA).motivos.join(), /hace 4 días/);
});

test('ordena los pasos del aula del más débil al más fuerte y junta las notas de la IA', () => {
  const alumnos = [
    { avances: [avance('fracciones', { 1: [{ estado: 'entendio' }], 2: [{ estado: 'error', nota: 'Suma los denominadores' }, { estado: 'entendio' }] })] },
    { avances: [avance('fracciones', { 1: [{ estado: 'parcial' }, { estado: 'entendio' }], 2: [{ estado: 'error', nota: 'Suma los denominadores' }, { estado: 'vago', nota: 'No da ejemplo' }] }, { prueba: { aprobado: false, puntaje: 2, n: 5, fallosPorPaso: { 2: 2 } } })] },
  ];
  const d = debilidadesAula(alumnos, 'fracciones');
  assert.equal(d[0].paso, 2);
  assert.equal(d[0].pctError, 1);
  assert.equal(d[0].terminaron, 1);
  assert.equal(d[0].fallosPrueba, 2);
  assert.deepEqual(d[0].notas, ['No da ejemplo', 'Suma los denominadores']);
  assert.equal(d.find(x => x.paso === 3).fuerza, null);
});

test('resume la clase para la plataforma: estados, notas y fallos de la prueba por paso', () => {
  const A = { id: 'a1', nombre: 'Kori', tema: 'fracciones', fases: [{}, { concepto: 'Partes iguales' }, { concepto: 'Equivalentes' }, { concepto: 'Suma' }, { concepto: 'Problemas' }] };
  const C = {
    paso: 5, chat: [{ de: 'yo' }, { de: 'apr' }, { de: 'yo' }],
    medicion: { 1: { turnos: [{ estado: 'error', nota: 'x', fuente: 'ia' }, { estado: 'entendio', nota: '' }] } },
    prueba: { intento: 1, aprobado: true, examen: { preguntas: [{ paso: 1 }, { paso: 2 }, { paso: 2 }] }, respuestas: [{ eleccion: 0, bien: true, aprBien: false }, { eleccion: 1, bien: false }, { eleccion: 2, bien: true, aprBien: true }] },
  };
  const r = resumenAvance(A, C);
  assert.deepEqual(r.medicion, { 1: [{ estado: 'error', nota: 'x' }, { estado: 'entendio', nota: '' }] });
  assert.deepEqual(r.conceptos, ['Partes iguales', 'Equivalentes', 'Suma', 'Problemas']);
  assert.equal(r.mensajes, 2);
  assert.deepEqual(r.prueba, { intento: 1, puntaje: 2, n: 3, aprobado: true, salvadas: 1, fallosPorPaso: { 2: 1 } });
});

test('dice hace cuánto fue', () => {
  assert.equal(hace('2026-11-22T11:55:00Z', AHORA), 'hace 5 min');
  assert.equal(hace('2026-11-21T12:00:00Z', AHORA), 'hace 1 día');
});
