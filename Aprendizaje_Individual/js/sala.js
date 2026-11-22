import { crearAprendin, svgAprendin } from './aprendin.js';
import { tonos } from './color.js';
import { fasesDesdeLook } from './creador.js';
import { MUNDOS } from './mundos.js';
import { cargarAprendin, guardarAprendin, listarAprendines } from './guardado.js';
import { importarAprendin } from './intercambio.js';
import { activarFichas } from './fichas-dom.js';
import { enlazarAccionesFicha, historialDe, calcularCalibracion, registrarEventoVisual, renderizarFichaEstudio, solicitarFichaInicio } from './fichas-apoyo.js';
import { RONDAS, VOCES, anotar, cargarSala, contextoSala, guardarSala, idSala, listarSalas, pasoSala, responderSala } from './sala-sesion.js';

const $ = id => document.getElementById(id);
const total = RONDAS.length;
function nodo(tag, texto, clase) {
  const el = document.createElement(tag);
  if (texto) el.textContent = texto;
  if (clase) el.className = clase;
  return el;
}
const opcion = (val, label) => new Option(label, val);
const boton = (nombre, accion) => {
  const el = nodo('button', nombre, 'sala-boton sala-secundario');
  el.type = 'button';
  el.addEventListener('click', accion);
  return el;
};

const muestra = ['cocina', 'espacio', 'bloques'].map(id => {
  const m = MUNDOS.find(w => w.id === id);
  return { id: `mundo-${id}`, nombre: m.look.nombre, mundo: m.nombre, de: m.de, fases: fasesDesdeLook(m.look) };
});
for (const a of muestra) {
  const av = nodo('span');
  av.innerHTML = svgAprendin(a.fases.at(-1).look, { emocion: 'feliz' });
  $('vistaSala').append(av);
}
$('marcaSala').innerHTML = svgAprendin(muestra[1].fases[0].look, { emocion: 'feliz' });

let S = cargarSala(), conectada = false, ia = false, ocupado = false, ayudaId = '';
let apoyoEnCurso = null;
let envioActivo = null;
const retratos = new Map();
const voces = Object.entries(VOCES);
const actual = cargarAprendin();
const elegidos = new Map([
  [actual?.id || muestra[0].id, voces[0][0]],
  [muestra[1].id, voces[1][0]]
]);
$('temaSala').value = actual?.tema || '';

function guardar(sala = S) {
  const ok = guardarSala(sala, { activar: sala === S });
  if (!ok && sala === S) $('avisoSala').textContent = 'El navegador no pudo guardar el último cambio.';
}

function pintarElenco(foco = '') {
  const todos = [...listarAprendines(), ...muestra];
  $('elencoSala').replaceChildren(...todos.map((a, i) => {
    const elegido = elegidos.get(a.id);
    const card = nodo('div', '', 'sala-selector');
    const label = nodo('label');
    const check = document.createElement('input');
    check.type = 'checkbox'; check.checked = Boolean(elegido); check.dataset.personaje = a.id;
    check.disabled = !elegido && elegidos.size >= 3;
    const av = nodo('span', '', 'sala-selector-av');
    av.setAttribute('aria-hidden', 'true');
    av.innerHTML = svgAprendin(a.fases.at(-1).look, { emocion: 'feliz' });
    const quien = nodo('span');
    quien.append(nodo('strong', a.nombre), nodo('small', a.mundo));
    label.append(check, av, quien);
    const select = nodo('select', '', 'sala-select');
    select.hidden = !elegido;
    select.setAttribute('aria-label', `Estilo de ${a.nombre}`);
    select.append(...voces.map(([id, v]) => opcion(id, v.nombre)));
    select.value = elegido || voces[i % voces.length][0];
    select.addEventListener('change', () => elegidos.set(a.id, select.value));
    check.addEventListener('change', () => {
      if (check.checked) elegidos.set(a.id, select.value);
      else elegidos.delete(a.id);
      pintarElenco(a.id);
    });
    card.append(label, select);
    return card;
  }));
  $('abrirSala').disabled = elegidos.size < 2;
  if (foco) [...$('elencoSala').querySelectorAll('input')].find(check => check.dataset.personaje === foco)?.focus();
}

function verConfiguracion() {
  $('salaActiva').hidden = true;
  $('inicioSala').hidden = false;
  $('volverSala').hidden = !S;
  const salas = listarSalas();
  $('guardadasSala').hidden = !salas.length;
  $('listaSalas').replaceChildren(...salas.map(sala => boton(
    `${sala.tema} · ${pasoSala(sala) - 1}/${total} rondas`,
    () => entrar(sala)
  )));
  pintarElenco();
}

function entrar(sala) {
  S = apoyoEnCurso?.sala.id === sala.id ? apoyoEnCurso.sala : sala;
  $('avisoSala').textContent = '';
  guardar();
  ayudaId = S.grupo[0].id;
  $('inicioSala').hidden = true;
  $('salaActiva').hidden = false;
  $('temaActivo').textContent = S.tema;
  $('misionActiva').textContent = S.meta;
  $('misionActiva').hidden = !S.meta;
  $('mundoApoyo').replaceChildren(...S.grupo.map(a => opcion(a.id, a.personaje.nombre)));
  $('mensajeSala').value = '';
  $('cuadernoSala').open = pasoSala(S) > total;
  for (const { actor } of retratos.values()) actor.destruir();
  retratos.clear();
  $('integrantesSala').replaceChildren();
  $('conversacionSala').replaceChildren(...S.grupo.map(a => burbuja(a, VOCES[a.voz].inicio)));
  for (const envio of S.turnos) {
    mostrarEnvio(envio);
    for (const [id, resp] of Object.entries(envio.respuestas)) mostrarRespuesta(id, resp, envio.paso);
  }
  actualizarSala();
  pintarApoyo();
  bajarChat();
  const pendiente = S.turnos.find(t => t.destinos.some(id => !Object.hasOwn(t.respuestas, id)));
  if (pendiente) procesar(pendiente);
}

$('formSala').addEventListener('submit', e => {
  e.preventDefault();
  const tema = $('temaSala').value.trim();
  const candidatos = [...listarAprendines(), ...muestra];
  const grupo = [...elegidos].flatMap(([id, voz]) => {
    const personaje = candidatos.find(a => a.id === id);
    return personaje ? [{ id: idSala(), personaje, voz, notas: [], apoyos: {} }] : [];
  });
  if (!tema || grupo.length < 2 || grupo.length > 3) return;
  entrar({ id: idSala(), creada: Date.now(), tema, meta: $('metaSala').value.trim(), grupo, turnos: [] });
  $('mensajeSala').focus();
});
$('traerAprendin').addEventListener('click', () => $('archivoAprendin').click());
$('archivoAprendin').addEventListener('change', async e => {
  const input = e.currentTarget;
  if (!input.files.length) return;
  const archivo = input.files[0];
  input.value = '';
  try {
    const a = await importarAprendin(archivo);
    if (!guardarAprendin(a, { activar: false })) throw new Error('El navegador no pudo guardar este aprendín.');
    if (elegidos.size < 3) elegidos.set(a.id, voces[elegidos.size][0]);
    pintarElenco(a.id);
    $('estadoConfig').textContent = elegidos.has(a.id) ? `${a.nombre} se añadió a tus aprendines.` : `${a.nombre} se añadió a tus aprendines. Quita a un integrante si quieres sumarlo a esta sala.`;
  } catch (error) { $('estadoConfig').textContent = error.message; }
});
$('otraSala').addEventListener('click', verConfiguracion);
$('volverSala').addEventListener('click', () => entrar(S));

const ultimaRespuesta = (a, paso = pasoSala(S)) => {
  const envio = S.turnos.findLast(t => t.paso === paso && Object.hasOwn(t.respuestas, a.id));
  return envio ? { envio, ...envio.respuestas[a.id] } : null;
};
const porId = id => S.grupo.find(a => a.id === id);
const pendientes = () => {
  const paso = pasoSala(S);
  return paso > total ? [] : S.grupo.filter(a => a.notas.length < paso);
};
const bajarChat = () => { const chat = $('conversacionSala'); chat.scrollTop = chat.scrollHeight; };

function retrato(a) {
  const fase = a.notas.length;
  if (!retratos.has(a.id)) {
    const plate = nodo('article', '', 'sala-integrante');
    plate.dataset.integrante = a.id;
    const host = nodo('button', '', 'sala-retrato');
    host.type = 'button';
    host.title = `Dar ánimos a ${a.personaje.nombre}`;
    host.setAttribute('aria-label', host.title);
    const actor = crearAprendin({ look: a.personaje.fases[fase].look, emocion: 'feliz', seguir: false });
    actor.el.setAttribute('aria-hidden', 'true');
    host.append(actor.el);
    const estado = nodo('span', '', 'sala-capsula');
    estado.setAttribute('aria-live', 'polite');
    host.addEventListener('click', () => {
      actor.sentir('feliz');
      actor.saludar();
      estado.textContent = '¡Gracias por el ánimo!';
    });
    plate.append(host, nodo('h2', a.personaje.nombre), nodo('p', [a.personaje.mundo, VOCES[a.voz].nombre].filter(Boolean).join(' · '), 'sala-perfil'), estado);
    $('integrantesSala').append(plate);
    retratos.set(a.id, { plate, actor, estado, fase, host });
  }
  return retratos.get(a.id);
}

function actualizarSala() {
  const paso = pasoSala(S), fin = paso > total;
  const ultimo = S.turnos.at(-1);
  for (const a of S.grupo) {
    const vista = retrato(a), { plate, actor, estado } = vista;
    const esperando = ocupado && ultimo?.destinos.includes(a.id) && !Object.hasOwn(ultimo.respuestas, a.id);
    const respuesta = ultimaRespuesta(a);
    const nuevo = a.notas.length > vista.fase;
    if (nuevo) {
      vista.fase = a.notas.length;
      vista.celebrarHasta = Date.now() + 1400;
      actor.evolucionar(a.personaje.fases[vista.fase].look);
    }
    const celebra = Date.now() < vista.celebrarHasta;
    vista.host.disabled = esperando;
    plate.style.setProperty('--tono-apr', tonos(a.personaje.fases[vista.fase].look.color).claro);
    plate.dataset.estado = fin || (!esperando && (a.notas.length >= paso || celebra)) ? 'listo' : esperando ? 'pensando' : respuesta ? 'duda' : 'escuchando';
    estado.textContent = fin ? 'Misión cumplida' : esperando ? 'Pensando…' : celebra ? '¡Evolucionó!' : a.notas.length >= paso ? 'Paso aprendido' : respuesta?.turno.puedeConfirmar ? 'Listo para anotar' : respuesta ? 'Tiene una pregunta' : 'Te escucha';
    actor.sentir(plate.dataset.estado === 'listo' ? 'orgulloso' : esperando ? 'pensando' : respuesta?.turno.emocion || 'curioso');
  }
  $('rondasSala').replaceChildren(...RONDAS.map((r, i) => {
    const el = nodo('li', r.nombre, i + 1 < paso ? 'sala-hecha' : '');
    if (i + 1 === paso) el.setAttribute('aria-current', 'step');
    return el;
  }));
  const r = RONDAS[paso - 1];
  $('cuentaRonda').textContent = fin ? `${total} rondas completadas` : `Ronda ${paso} de ${total}`;
  $('tituloRonda').textContent = fin ? '¡La sala evolucionó!' : r.nombre;
  $('objetivoRonda').textContent = fin ? 'Revisa qué se llevó cada aprendín de tus explicaciones.' : r.objetivo;
  $('estadoRonda').textContent = fin ? '' : `${S.grupo.length - pendientes().length} de ${S.grupo.length} ya aprendieron este paso`;
  if (fin) $('cuadernoSala').open = true;

  const destino = $('destinoSala');
  const seleccionado = destino.value;
  destino.replaceChildren(opcion('', 'Toda la sala'), ...pendientes().map(a => opcion(a.id, a.personaje.nombre)));
  if ([...destino.options].some(opt => opt.value === seleccionado)) destino.value = seleccionado;
  $('formEnsenar').hidden = fin;
  $('ensenarSala').disabled = ocupado || !conectada;
  destino.disabled = ocupado;
  $('otraSala').disabled = ocupado;
  for (const b of $('conversacionSala').querySelectorAll('[data-responder]')) {
    b.hidden = b.dataset.paso !== String(paso) || !pendientes().some(a => a.id === b.dataset.responder);
    b.disabled = ocupado;
  }
  pintarConfirmaciones();
  pintarCuaderno();
}

function burbuja(a, texto, { intento, fuente, paso, aclarar } = {}) {
  const el = nodo('article', '', 'sala-mensaje');
  if (a) el.dataset.voz = a.voz;
  else el.classList.add('sala-mensaje-yo');
  const h = nodo('h3', a ? a.personaje.nombre : 'Tú');
  if (fuente === 'local') h.append(nodo('small', ' · Práctica'));
  el.append(h, nodo('p', texto));
  if (intento) el.append(nodo('p', intento, 'sala-intento'));
  if (aclarar) {
    const b = boton('Responderle', () => {
      $('destinoSala').value = a.id;
      $('mensajeSala').focus();
    });
    b.dataset.responder = a.id; b.dataset.paso = paso;
    el.append(b);
  }
  return el;
}

function mostrarEnvio(envio) {
  const el = burbuja(null, envio.texto);
  if (envio.destinos.length === 1) el.querySelector('h3').textContent = `Tú, a ${porId(envio.destinos[0]).personaje.nombre}`;
  $('conversacionSala').append(el);
}
function mostrarRespuesta(id, { turno, fuente }, paso) {
  const el = burbuja(porId(id), turno.dice, { intento: turno.intento, fuente, paso, aclarar: turno.estado !== 'entendio' && !turno.puedeConfirmar });
  if (turno.estado === 'entendio') el.dataset.listo = '';
  $('conversacionSala').append(el);
}

async function procesar(envio) {
  ocupado = true;
  const intento = Symbol();
  envioActivo = intento;
  const alSalir = () => { if (envioActivo === intento) envioActivo = null; };
  window.addEventListener('beforeunload', alSalir);
  const pasoAnterior = pasoSala(S);
  actualizarSala();
  $('avisoSala').textContent = 'Tus aprendines están pensando…';
  try {
    await Promise.all(envio.destinos.filter(id => !Object.hasOwn(envio.respuestas, id)).map(async id => {
      const a = porId(id);
      const resp = await responderSala({ sala: S, a, envio, ia });
      if (envioActivo !== intento) return;
      envio.respuestas[id] = resp;
      if (resp.turno.estado === 'entendio') anotar(a, envio, resp);
      guardar();
      mostrarRespuesta(id, resp, envio.paso);
      actualizarSala();
      bajarChat();
    }));
  } finally {
    window.removeEventListener('beforeunload', alSalir);
    if (envioActivo === intento) {
      envioActivo = null;
      ocupado = false;
      if ($('avisoSala').textContent === 'Tus aprendines están pensando…') $('avisoSala').textContent = '';
      actualizarSala();
      if (pasoSala(S) !== pasoAnterior) pintarApoyo();
    }
  }
}
window.addEventListener('pageshow', e => {
  if (!e.persisted || !ocupado || envioActivo) return;
  ocupado = false;
  entrar(S);
});

$('formEnsenar').addEventListener('submit', e => {
  e.preventDefault();
  const msg = $('mensajeSala');
  const texto = msg.value.trim();
  if (!texto || ocupado || !conectada) return;
  const grupo = pendientes();
  const elegido = $('destinoSala').value;
  const destinos = grupo.filter(a => !elegido || a.id === elegido).map(a => a.id);
  if (!destinos.length) return;
  const envio = { id: idSala(), paso: pasoSala(S), texto, destinos, respuestas: {} };
  S.turnos.push(envio);
  msg.value = '';
  guardar();
  mostrarEnvio(envio);
  bajarChat();
  procesar(envio);
  msg.focus();
});
$('mensajeSala').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    $('formEnsenar').requestSubmit();
  }
});

function pintarConfirmaciones() {
  const host = $('confirmacionesSala'), botones = [];
  if (!ocupado) for (const a of pendientes()) {
    const resp = ultimaRespuesta(a);
    if (!resp?.turno.puedeConfirmar) continue;
    botones.push(boton(`Guardar para ${a.personaje.nombre}`, () => {
      if (!anotar(a, resp.envio, resp)) return;
      guardar();
      actualizarSala();
      pintarApoyo();
      if (!$('formEnsenar').hidden) $('mensajeSala').focus();
    }));
  }
  host.hidden = !botones.length;
  host.replaceChildren(...(botones.length ? [nodo('p', 'Modo práctica. Guarda el paso si ya les explicaste la idea y diste un ejemplo.', 'sala-nota'), ...botones] : []));
}

function pintarCuaderno() {
  const n = S.grupo.reduce((cuenta, a) => cuenta + a.notas.length, 0);
  $('cuentaCuaderno').textContent = String(n);
  $('notasSala').replaceChildren(...(n ? S.grupo.flatMap(a => a.notas.map(nota => {
    const art = nodo('article');
    art.append(nodo('h3', `${a.personaje.nombre} · ${RONDAS[nota.paso - 1].nombre}`), nodo('p', nota.idea));
    if (nota.intento) art.append(nodo('p', nota.intento, 'sala-nota'));
    return art;
  })) : [nodo('p', 'Cada aprendín anota lo que le enseñes.', 'sala-nota')]));
}

function pintarApoyo() {
  const a = porId(ayudaId), paso = Math.min(total, pasoSala(S));
  const host = $('fichaSala');
  const fichas = a.apoyos[paso] || [];
  const item = fichas.at(-1);
  if (apoyoEnCurso?.sala === S && apoyoEnCurso.a === a && apoyoEnCurso.paso === paso) {
    host.replaceChildren(nodo('p', `Buscando un ejemplo de ${a.personaje.mundo || a.personaje.nombre}…`, 'sala-nota'));
    return;
  }
  if (!item) {
    const pedir = boton('Ver una ficha para esta ronda', () => pedirApoyo('inicio'));
    pedir.disabled = !conectada || pasoSala(S) > total || Boolean(apoyoEnCurso);
    host.replaceChildren(pedir);
    return;
  }
  const activa = pasoSala(S) <= total && !apoyoEnCurso;
  host.innerHTML = renderizarFichaEstudio(item, fichas.length - 1, {
    esUltima: activa && item.reaccion !== 'entendio', permitirEnfoque: activa && item.reaccion === 'entendio',
    gustos: a.personaje.mundo, tono: tonos(a.personaje.fases[a.notas.length].look.color)
  });
  activarFichas(host);
  enlazarAccionesFicha(host, {
    ocupado: () => Boolean(apoyoEnCurso),
    alReaccionar: (r, nota) => {
      item.reaccion = r; item.nota = nota;
      registrarEventoVisual(item.datos.visual.tipo, r);
      guardar();
      if (r === 'entendio') { pintarApoyo(); $('mensajeSala').focus(); }
      else pedirApoyo(r, nota);
    },
    alEnfoque: ({ pinTipo, nota }) => pedirApoyo('enfoque', nota, pinTipo),
    alOtra: () => pedirApoyo('ejemplo')
  });
}

async function pedirApoyo(reaccion, nota = '', pinTipo = '') {
  const sala = S, a = porId(ayudaId), paso = pasoSala(sala);
  if (!conectada || paso > total || apoyoEnCurso) return;
  apoyoEnCurso = { sala, a, paso };
  pintarApoyo();
  try {
    const fichas = a.apoyos[paso] ||= [];
    const historial = historialDe(fichas);
    const cal = calcularCalibracion(historial);
    const respuesta = ultimaRespuesta(a, paso);
    const { datos, fuente } = await solicitarFichaInicio({
      ia, tema: sala.tema, gustos: a.personaje.mundo, objetivo: `${sala.tema}. ${RONDAS[paso - 1].objetivo}`,
      dificultad: respuesta?.turno.pista || '',
      aprendin: contextoSala(sala, a), nivel: reaccion === 'duda' ? 'cero' : 'algo',
      reaccion, nota, historial, calibracion: pinTipo ? { ...cal, pinTipo, estrategia: 'fijo' } : cal
    });
    fichas.push({ datos, fuente, reaccionOrigen: reaccion, reaccion: null, nota });
    guardar(sala);
  } finally {
    apoyoEnCurso = null;
    if (S && !$('salaActiva').hidden) pintarApoyo();
  }
}

$('mundoApoyo').addEventListener('change', e => { ayudaId = e.target.value; pintarApoyo(); });
async function iniciar() {
  const anterior = S;
  if (!S) verConfiguracion();
  else { $('inicioSala').hidden = true; $('salaActiva').hidden = false; $('temaActivo').textContent = S.tema; }
  try {
    const r = await fetch('/api/estado', { cache: 'no-store' });
    if (r.ok) ia = Boolean((await r.json()).ia);
  } catch { /* acceso estático */ }
  conectada = true;
  $('estadoSala').textContent = ia ? 'En línea' : 'Modo práctica';
  $('estadoSala').classList.toggle('si', ia);
  if (anterior && S === anterior) entrar(S);
  else if (S) { actualizarSala(); pintarApoyo(); }
}
iniciar();
