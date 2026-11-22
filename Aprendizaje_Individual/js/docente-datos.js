// Cálculos del panel docente (sin DOM): qué aprendín cuenta para el aula, quién necesita ayuda
// y en qué paso del tema le cuesta más al aula. Usa la misma medida de «fuerza» que la prueba en equipo.
import { pasosDebiles } from './examen.js';
import { PASOS } from './turno.js';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const DIA = 864e5;

/** El aprendín del alumno que corresponde al tema del aula; si no hay, el más reciente (la API los ordena así). */
export function avanceDelTema(avances, tema) {
  if (!avances?.length) return null;
  const t = norm(tema);
  if (!t) return avances[0];
  return avances.find(a => { const x = norm(a.tema); return x && (x.includes(t) || t.includes(x)); }) || avances[0];
}

/** Fuerza (0 a 1) de cada paso que el alumno ya empezó; null en los que no. */
export function fuerzaPorPaso(avance) {
  const f = {};
  for (let p = 1; p <= PASOS; p++) {
    const ts = avance?.medicion?.[p] || [];
    f[p] = ts.length ? pasosDebiles({ [p]: { turnos: ts } })[p] : null;
  }
  return f;
}

/** Cómo va un alumno con el tema del aula y por qué podría necesitar ayuda. */
export function estadoAlumno(alumno, tema, ahora = Date.now()) {
  const av = avanceDelTema(alumno.avances, tema);
  if (!av) return { av: null, fuerza: {}, motivos: ['Todavía no empezó'], ayuda: true };
  const fuerza = fuerzaPorPaso(av);
  const motivos = [];
  // Trabado: le está costando un paso (fuerza baja) y todavía no logró que su aprendín lo entienda.
  const trabado = Object.entries(fuerza)
    .filter(([p, v]) => v != null && v < 0.5 && av.medicion[p].at(-1)?.estado !== 'entendio')
    .map(([p]) => p);
  if (trabado.length) motivos.push(`Trabado en ${trabado.length === 1 ? 'el paso' : 'los pasos'} ${trabado.join(', ')}`);
  if (av.prueba && !av.prueba.aprobado) motivos.push(`Prueba: ${av.prueba.puntaje} de ${av.prueba.n}`);
  const dias = Math.floor((ahora - Date.parse(av.actualizado)) / DIA);
  if (av.paso <= PASOS && dias >= 3) motivos.push(`Sin avanzar hace ${dias} días`);
  return { av, fuerza, motivos, ayuda: motivos.length > 0 };
}

/**
 * Debilidades del aula, paso por paso (del más débil al más fuerte). Cada aprendín tiene sus propios
 * nombres de conceptos, así que se agrupa por número de paso y se muestra el nombre más común.
 */
export function debilidadesAula(alumnos, tema) {
  const avs = alumnos.map(a => avanceDelTema(a.avances, tema)).filter(Boolean);
  const pasos = [];
  for (let p = 1; p <= PASOS; p++) {
    const nombres = new Map(), notas = [];
    let empezaron = 0, terminaron = 0, conError = 0, turnos = 0, suma = 0, fallosPrueba = 0;
    for (const av of avs) {
      const c = av.conceptos?.[p - 1];
      if (c) nombres.set(c, (nombres.get(c) || 0) + 1);
      fallosPrueba += av.prueba?.fallosPorPaso?.[p] || 0;
      const ts = av.medicion?.[p] || [];
      if (!ts.length) continue;
      empezaron++; turnos += ts.length;
      if (ts.some(t => t.estado === 'entendio')) terminaron++;
      if (ts.some(t => t.estado === 'error')) conError++;
      suma += pasosDebiles({ [p]: { turnos: ts } })[p];
      for (const t of ts) if ((t.estado === 'error' || t.estado === 'vago') && t.nota && !notas.includes(t.nota)) notas.push(t.nota);
    }
    const orden = [...nombres].sort((a, b) => b[1] - a[1]).map(([n]) => n);
    pasos.push({
      paso: p, concepto: orden[0] || `Paso ${p}`, variantes: orden.slice(1),
      alumnos: avs.length, empezaron, terminaron, fallosPrueba,
      fuerza: empezaron ? suma / empezaron : null,
      pctError: empezaron ? conError / empezaron : null,
      intentos: empezaron ? turnos / empezaron : null,
      notas: notas.slice(-3).reverse(),
    });
  }
  return pasos.sort((a, b) => (a.fuerza ?? 2) - (b.fuerza ?? 2) || a.paso - b.paso);
}

/** «hace 5 min», «hace 2 h», «hace 3 días». */
export function hace(fecha, ahora = Date.now()) {
  const s = Math.max(0, (ahora - Date.parse(fecha)) / 1000);
  if (s < 60) return 'recién';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < DIA / 1000) return `hace ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / (DIA / 1000));
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}
