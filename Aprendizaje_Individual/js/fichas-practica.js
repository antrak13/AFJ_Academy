// Cada plantilla ofrece varios casos de una idea y dos maneras de mostrar cada caso.
const temaNormal = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function partes(gustos, caso) {
  const [n, d] = [[1, 4], [2, 5], [3, 8]][caso];
  const penales = /futbol|penal|cancha/.test(gustos);
  const situacion = penales ? `De ${d} penales, anotas ${n}.` : `Cortas una pizza en ${d} porciones iguales y sirves ${n}.`;
  const pregunta = penales ? '¿Qué fracción de los penales anotaste?' : '¿Qué fracción de la pizza serviste?';
  const pasos = [`Pon el total de partes iguales, ${d}, en el denominador.`, `Pon las partes que cuentas, ${n}, en el numerador.`];
  const f = {
    titulo: 'Qué es una fracción', subtema: 'Partes iguales', icono: penales ? 'pelota' : 'cocina',
    idea: 'El denominador dice en cuántas partes iguales se divide el total. El numerador dice cuántas de esas partes cuentas.',
    ejemplo: { situacion, pregunta, pasos, resultado: `${n}/${d} ${penales ? 'de los penales' : 'de la pizza'}` }
  };
  return [
    { ...f, visual: { tipo: 'fraccion', titulo: penales ? 'Penales anotados' : 'Porciones servidas', fracciones: [{ num: n, den: d }], forma: penales ? 'barra' : 'pizza' } },
    { ...f, titulo: 'Qué dice cada número', idea: `${d} es el denominador porque hay ${d} partes iguales en total. ${n} es el numerador porque contamos ${n}.`,
      visual: { tipo: 'partes', titulo: `Leemos ${n}/${d}`, centro: `${n}/${d}`, items: [
        { texto: `Numerador: ${n}`, detalle: penales ? 'Penales anotados' : 'Porciones servidas' },
        { texto: `Denominador: ${d}`, detalle: penales ? 'Penales intentados' : 'Porciones iguales de la pizza' }
      ] } }
  ];
}

const contextos = [
  { gustos: /pizza|cocin|horno|receta/, situacion: 'Dos pizzas tienen el mismo tamaño.', nombre: 'Pizza', partes: 'porciones', forma: 'pizza', icono: 'cocina' },
  { gustos: /espaci|cohete|nave|robot|marte/, situacion: 'Dos depósitos de combustible tienen la misma capacidad.', nombre: 'Depósito', partes: 'marcas', forma: 'barra', icono: 'cohete' },
  { gustos: /bloque|minecraft|juego/, situacion: 'Dos recorridos de un mapa tienen el mismo largo.', nombre: 'Recorrido', partes: 'tramos', forma: 'barra', icono: 'bloque' },
  { gustos: /futbol|pelota|cancha/, situacion: 'Dos equipos entrenan el mismo tiempo.', nombre: 'Sesión', partes: 'intervalos', forma: 'barra', icono: 'pelota' }
];

function equivalencia(gustos, caso) {
  const c = contextos.find(x => x.gustos.test(gustos)) || {
    situacion: 'Compara dos barras del mismo largo.', nombre: 'Barra', partes: 'partes', forma: 'barra', icono: 'balanza'
  };
  const [n, d] = [[1, 2], [2, 5], [3, 4]][caso], a = `${n}/${d}`, b = `${n * 2}/${d * 2}`;
  const f = {
    titulo: 'Fracciones equivalentes', subtema: 'Misma cantidad', icono: c.icono,
    idea: 'Multiplicar el numerador y el denominador por el mismo número positivo conserva el valor de la fracción.',
    ejemplo: {
      situacion: `${c.situacion} En la primera unidad señalas ${n} de ${d} ${c.partes} iguales.`,
      pregunta: `Si divides la segunda unidad en ${d * 2} ${c.partes} iguales, ¿cuántas cubren la misma cantidad?`,
      pasos: ['Divide cada parte original por la mitad.', `Multiplica ${n} y ${d} por 2 para obtener ${b}.`],
      resultado: `${a} = ${b}. Es la misma proporción del entero.`
    }
  };
  return [
    { ...f, visual: { tipo: 'fraccion', titulo: `${c.nombre}: ${a} y ${b}`, forma: c.forma, operacion: 'igual',
      fracciones: [{ num: n, den: d }, { num: n * 2, den: d * 2 }] } },
    { ...f, titulo: 'La misma cantidad', idea: 'Cada parte marcada se divide en dos. Cuentas el doble de pedazos, pero la porción marcada conserva su tamaño.',
      visual: { tipo: 'comparar', titulo: `${a} y ${b}`, izquierda: { titulo: a, puntos: [`${n} de ${d} partes iguales`] },
        derecha: { titulo: b, puntos: [`${n * 2} de ${d * 2} partes iguales`, 'Mismo tamaño total'] } } },
    { ...f, visual: { tipo: 'recta', titulo: 'La misma posición', min: 0, max: 1,
      marcas: [{ valor: 0, texto: '0' }, { valor: n / d, texto: `${a} = ${b}` }, { valor: 1, texto: '1' }] } }
  ];
}

function sumarFracciones(gustos, caso) {
  const [a, b, c, d] = [[1, 2, 1, 4], [1, 3, 1, 6], [2, 8, 3, 8]][caso];
  const pizza = /pizza|cocin/.test(gustos), n = a * (d / b), primero = `${a}/${b}`, segundo = `${c}/${d}`, total = `${n + c}/${d}`;
  const situacion = pizza ? `Sirves ${primero} de una pizza y luego ${segundo} de esa misma pizza.`
    : `Recorres primero ${primero} de un tramo y después ${segundo} del mismo tramo.`;
  const pasos = [b === d ? `Las dos cantidades ya están divididas en ${d} partes por entero.` : `Expresa ${primero} en partes del mismo tamaño: ${n}/${d}.`, `Suma ${n} y ${c}. El denominador sigue siendo ${d}.`];
  const f = {
    titulo: 'Sumar fracciones', subtema: 'Mismo denominador', icono: 'mas',
    idea: 'Para sumar fracciones, primero exprésalas con el mismo denominador. Después suma los numeradores y conserva ese denominador.',
    ejemplo: { situacion, pregunta: pizza ? '¿Qué fracción de la pizza serviste?' : '¿Qué fracción del tramo avanzaste?', pasos, resultado: `${total} ${pizza ? 'de la pizza' : 'del tramo'}` }
  };
  return [
    { ...f, visual: { tipo: 'fraccion', titulo: `${primero} + ${segundo}`, forma: pizza ? 'pizza' : 'barra', operacion: 'suma',
      fracciones: [{ num: a, den: b }, { num: c, den: d }, { num: n + c, den: d }] } },
    { ...f, idea: 'Cuando todas las partes tienen el mismo tamaño, basta con contarlas juntas. El denominador dice cuántas partes caben en un entero.',
      visual: pasosVisual('Igualar y sumar', pasos) }
  ];
}

function pasosVisual(titulo, pasos) {
  return { tipo: 'pasos', titulo, items: pasos.map((detalle, i) => ({ texto: `Paso ${i + 1}`, detalle })) };
}

function porCadaCien(gustos, caso) {
  const n = [25, 40, 60][caso];
  const f = {
    titulo: 'Qué es un porcentaje', subtema: 'Por cada cien', icono: 'grafico',
    idea: 'Un porcentaje expresa cuántas partes hay de cada cien.',
    ejemplo: {
      situacion: `En una sesión de 100 minutos dedicas ${n} minutos a practicar.`,
      pregunta: '¿Qué porcentaje del tiempo dedicas a practicar?',
      pasos: ['El total son 100 minutos.', `Practicas ${n} de cada 100: eso es ${n} %.`],
      resultado: `${n} % del tiempo`
    }
  };
  const items = [{ texto: 'Práctica', valor: n }, { texto: 'Otras actividades', valor: 100 - n }];
  return [
    { ...f, visual: { tipo: 'torta', titulo: 'Reparto del tiempo', unidad: '%', items } },
    { ...f, idea: `De 100 minutos, ${n} son de práctica. Esa parte equivale al ${n} % del tiempo.`,
      visual: { tipo: 'barras', titulo: 'Minutos de un total de 100', unidad: 'min', items } }
  ];
}

function porcentajeDeUnTotal(gustos, caso) {
  const [base, tasa] = [[80, 25], [60, 20], [150, 10]][caso], total = base * tasa / 100;
  const pasos = [`Multiplica el precio ${base} por ${tasa}.`, `Divide ${base * tasa} entre 100 para obtener la rebaja.`];
  const f = {
    titulo: 'Calcular un porcentaje', subtema: 'Aplicado a totales', icono: 'moneda',
    idea: 'Para calcular un porcentaje de una cantidad, multiplica la cantidad por el porcentaje y divide entre cien.',
    ejemplo: { situacion: `Un producto cuesta Bs ${base} y tiene ${tasa} % de descuento.`,
      pregunta: '¿Cuánto dinero rebajan?', pasos, resultado: `La rebaja es de Bs ${total}` }
  };
  return [
    { ...f, visual: pasosVisual('Calcular la rebaja', pasos) },
    { ...f, idea: `El ${tasa} % significa ${tasa} de cada 100. Aplicamos esa misma proporción al precio de Bs ${base}.`,
      visual: { tipo: 'ecuacion', titulo: `${tasa} % de ${base}`,
      lineas: [{ expresion: `(${base} × ${tasa}) ÷ 100` }, { expresion: `${base * tasa} ÷ 100` }, { expresion: String(total) }] } }
  ];
}

function despejar(gustos, caso) {
  const [rondas, extra, puntos] = [[2, 4, 14], [3, 3, 15], [4, 2, 18]][caso];
  const x = (puntos - extra) / rondas, pasos = [`Resta ${extra} a ambos lados. Queda ${rondas}x = ${puntos - extra}.`, `Divide ambos lados entre ${rondas}. Queda x = ${x}.`];
  const f = {
    titulo: 'Despejar paso a paso', subtema: 'Orden inverso', icono: 'balanza',
    idea: 'Para hallar x, deshaz las operaciones en orden inverso. Aplica la misma operación a ambos lados de la ecuación.',
    ejemplo: { situacion: `Ganas la misma cantidad de puntos en ${rondas} rondas. Con ${extra} puntos extra, sumas ${puntos}.`,
      pregunta: '¿Cuántos puntos ganas por ronda?', pasos, resultado: `${x} puntos por ronda` }
  };
  return [
    { ...f, visual: { tipo: 'ecuacion', titulo: 'Hallar los puntos por ronda', lineas: [
      { expresion: `${rondas}x + ${extra} = ${puntos}` },
      { expresion: `${rondas}x = ${puntos - extra}`, nota: `Resto ${extra} a ambos lados` },
      { expresion: `x = ${x}`, nota: `Divido ambos lados entre ${rondas}` }
    ] } },
    { ...f, titulo: 'La igualdad se conserva',
      idea: `Quita los ${extra} puntos que se sumaron y luego divide entre las ${rondas} rondas. Haz cada operación a ambos lados.`,
      visual: pasosVisual('Misma operación a ambos lados', pasos) }
  ];
}

export function rutaPractica(tema, objetivo, gustos, nivel) {
  const t = temaNormal(tema), o = temaNormal(objetivo), pedido = o || t, g = temaNormal(gustos);
  const grupo = (subtema, preparar, alias = []) => ({ subtema, alias, preparar: caso => preparar(g, caso) });
  if (/fracci/.test(`${t} ${o}`)) {
    if (/resta|sustra|mixt/.test(pedido)) return { grupos: [], inicial: 0 };
    const inicial = grupo('Partes iguales', partes, ['Mapa de partes']);
    const iguales = grupo('Misma cantidad', equivalencia, ['Referencia visual']);
    const suma = grupo('Mismo denominador', sumarFracciones, ['Método ordenado', 'Aclarando la base', 'Saltos de tamaño igual']);
    if (/suma/.test(pedido)) return { grupos: [suma], inicial: 0 };
    if (/equival/.test(pedido)) return { grupos: [iguales], inicial: 0 };
    return { grupos: [inicial, iguales, suma], inicial: o || nivel === 'cero' ? 0 : nivel === 'algo' ? 1 : 2 };
  }
  if (/porcent/.test(`${t} ${o}`)) {
    return { grupos: [grupo('Por cada cien', porCadaCien), grupo('Aplicado a totales', porcentajeDeUnTotal, ['Método paso a paso', 'Tabla rápida'])],
      inicial: /calcul|descuent|sacar/.test(pedido) || nivel === 'bastante' ? 1 : 0 };
  }
  if (/ecuacion(?:es)? lineal|ecuacion simple|despej/.test(`${t} ${o}`)) {
    return { grupos: [grupo('Orden inverso', despejar, ['Balanza justa'])], inicial: 0 };
  }
  return null;
}
