// La clase: el estudiante le enseña al aprendín, la IA responde en su papel y evalúa en silencio.
// Cada paso que entiende → evoluciona a la fase siguiente y escribe una ficha con un visual.
import { crearAprendin, svgAprendin, EMOCIONES } from './aprendin.js';
import { tonos } from './color.js';
import { cargarAprendin, guardarAprendin, cargarClase, guardarClase, borrarClase } from './guardado.js';
import { ESTADOS, PASOS, preguntaInicial, turnoLocal, resumenAprendin } from './turno.js';
import { htmlFicha, fichaLocal, limpiarFicha, svgIcono } from './fichas.js';
import { activarFichas, animar } from './fichas-dom.js';
import { DEMO } from './demo-aprendin.js';
import { crearPrueba } from './prueba.js';
import { demoClase } from './demo-clase.js';
import { cargarEstudio, guardarEstudio, solicitarFichaInicio, renderizarFichaEstudio, enlazarAccionesFicha, historialDe, registrarEventoVisual, calcularCalibracion, renderizarPanelCalibracion } from './fichas-apoyo.js';

const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = ms => new Promise(ok => setTimeout(ok, RM ? 0 : ms));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const EJEMPLO = new URLSearchParams(location.search).get('ejemplo');   // ?ejemplo=1 clase desde cero con Kori · ?ejemplo=prueba con los 4 pasos listos
let A = EJEMPLO != null ? DEMO : cargarAprendin();
// Estado de la clase: paso que le enseñas (1 a 4; 5 = terminó), mensajes, fichas y lo que midió la IA.
let C = null, estrella = null, ia = false, ocupado = false, hablarVoz = false;
const nuevo = () => ({ paso: 1, chat: [], fichas: {}, medicion: {}, pista: '' });
const guardar = () => guardarClase(A.id, C);
const faseActual = () => Math.min(PASOS, C.paso - 1);
const look = (nv = faseActual()) => A.fases[nv].look;
const turnosDe = paso => C.chat.filter(m => m.paso === paso && m.de === 'yo').length;

// La prueba de la misión (examen en equipo)
const prueba = crearPrueba({
  get A() { return A; }, get C() { return C; }, guardar: () => guardar(), ia: () => ia, aprendido: () => aprendido(),
  alAprobar: r => mostrarFinal(r), alCambiar: () => { pintarAhora(); pintarMedicion(); },
  alRepasar: () => { $('#fichas').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); document.querySelectorAll('#fichas .vis').forEach(animar); }
});
$('#btnPrueba').addEventListener('click', () => prueba.abrir());

/* ---------- Inicio ---------- */
const marca = crearAprendin({ look: { forma: 'bollo', color: 'coral', rasgos: { ojos: 'grandes' }, piezas: { pelo: 'mechon' } }, emocion: 'feliz', seguir: false });
$('#marcaAv').append(marca.el);

async function estadoIA() {
  try { const r = await fetch('/api/estado', { cache: 'no-store' }); const j = r.ok ? await r.json() : null; ia = !!j?.ia; } catch { ia = false; }
  const el = $('#estadoIA'); el.className = 'estado-ia' + (ia ? ' si' : ''); el.textContent = ia ? 'En línea' : 'Modo práctica';
}

let panelDerActual = 'apoyo';
function verPanelDer(tab = 'apoyo') {
  panelDerActual = tab === 'cuaderno' ? 'cuaderno' : 'apoyo';
  const tAp = $('#tabApoyo'), tCu = $('#tabCuaderno');
  const pAp = $('#paneApoyo'), pCu = $('#paneCuaderno');
  if (!tAp || !tCu || !pAp || !pCu) return;
  const esAp = panelDerActual === 'apoyo';
  tAp.setAttribute('aria-selected', String(esAp)); tAp.tabIndex = esAp ? 0 : -1;
  tCu.setAttribute('aria-selected', String(!esAp)); tCu.tabIndex = esAp ? -1 : 0;
  pAp.hidden = !esAp; pCu.hidden = esAp;
  if (!esAp && $('#dotCuaderno')) $('#dotCuaderno').hidden = true;
}
[$('#tabApoyo'), $('#tabCuaderno')].filter(Boolean).forEach((btn, i, arr) => {
  btn.addEventListener('click', () => verPanelDer(btn.id === 'tabCuaderno' ? 'cuaderno' : 'apoyo'));
  btn.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nx = arr[(i + (e.key === 'ArrowRight' ? 1 : -1) + arr.length) % arr.length];
      verPanelDer(nx.id === 'tabCuaderno' ? 'cuaderno' : 'apoyo');
      nx.focus();
    }
  });
});

function empezar() {
  if (!A) { $('#vacio').hidden = false; $('#clase').hidden = true; return; }
  $('#vacio').hidden = true; $('#clase').hidden = false;
  apoyoActivoId = null;
  const guardada = cargarClase(A.id);
  C = EJEMPLO === 'prueba' && A === DEMO ? (guardada?.paso > PASOS ? guardada : demoClase(A)) : guardada || nuevo();
  document.title = `Clase de ${A.nombre} · Aprendines`;
  $('#nombre').textContent = A.nombre;
  $('#deDonde').textContent = A.de ? `viene ${A.de}` : '';
  $('#mision').textContent = A.mision;
  $('#lema').innerHTML = `Enséñale <b>${esc(A.tema)}</b> y míralo evolucionar.`;
  $('#foco').style.setProperty('--tono', tonos(look().color).claro);
  estrella?.destruir();
  estrella = crearAprendin({ look: look(), emocion: 'feliz' });
  $('#estrella').replaceChildren(estrella.el);
  verPanelDer('apoyo');
  pintarFases(); pintarAhora(); pintarChat(); pintarFichas(); pintarMedicion(); pintarApoyoLista(); pintarApoyoActivo(); pintarCalibracionClase();
  for (const [p, f] of Object.entries(C.fichas)) if (f.estado !== 'lista') pedirFicha(Number(p));   // quedó a medias al recargar
  if (C.paso >= PASOS) prueba.preparar();
  if (!C.chat.length) arrancar();
  else bloquear(false);
}
async function arrancar() {
  bloquear(true);
  await espera(400); estrella.saludar();
  await decir(A.saludo, 'feliz');
  await espera(500);
  await decir(preguntaInicial(A, 1), 'curioso');
  bloquear(false); $('#msg').focus();
}

/* ---------- Escenario: fases y paso actual ---------- */
function pintarFases() {
  const caja = $('#fases'); caja.replaceChildren();
  A.fases.forEach((f, i) => {
    const hecho = i <= faseActual(), meta = i === C.paso && C.paso <= PASOS;
    const li = document.createElement('li');
    li.className = 'cl-fase' + (hecho ? ' hecho' : '') + (meta ? ' meta' : '');
    li.innerHTML = `<span class="mini" aria-hidden="true">${svgAprendin(f.look, { emocion: hecho ? 'feliz' : 'neutral' })}</span><span class="cl-fase-num">${i}</span>`;
    li.title = i ? `${f.titulo}: ${f.concepto}` : f.titulo;
    li.setAttribute('aria-label', `${f.titulo}${i ? ` (${f.concepto})` : ''}: ${hecho ? 'lograda' : meta ? 'la siguiente' : 'bloqueada'}`);
    caja.append(li);
  });
  const ya = A.fases[faseActual()], sig = A.fases[C.paso];
  $('#faseTxt').innerHTML = `Es <b>${esc(ya.titulo)}</b>${sig && C.paso <= PASOS ? ` · siguiente: <b>${esc(sig.titulo)}</b>` : ''}`;
}
function ponerPista(texto) {
  const el = $('#pista');
  if (el) el.innerHTML = `${svgIcono('idea', { size: 16 })}<span>${esc(texto)}</span>`;
}
function pintarAhora() {
  const fin = C.paso > PASOS;
  $('#ahoraTit').textContent = fin ? '¡Aprendió todo el tema!' : `Paso ${C.paso} de ${PASOS} · le enseñas`;
  $('#concepto').textContent = fin ? `${A.nombre} ya es ${A.fases[PASOS].titulo}.` : A.fases[C.paso].concepto;
  $('#btnPista').hidden = fin;
  $('#btnApoyo').hidden = fin;
  ponerPista(C.pista || pistaBase());
  const pr = C.prueba, bp = $('#btnPrueba');
  bp.hidden = !fin;
  bp.textContent = !pr?.respuestas?.length ? 'Hacer la prueba juntos' : !pr.terminado ? 'Seguir con la prueba' : pr.aprobado ? `Prueba aprobada: ${pr.puntaje} de ${pr.examen.preguntas.length}` : 'Ver la prueba e intentar otra vez';
  if (fin) $('#ahoraTit').textContent = pr?.aprobado ? '¡Misión cumplida!' : 'Falta la prueba de su misión';
}
const pistaBase = () => `Empieza con un ejemplo de su mundo (${A.mundo || 'lo que le gusta'}) y dile por qué funciona. Después deja que lo intente.`;
$('#btnPista').addEventListener('click', () => {
  const p = $('#pista'), b = $('#btnPista'); p.hidden = !p.hidden; b.setAttribute('aria-expanded', String(!p.hidden));
});

/* ---------- Chat ---------- */
const cajaMsg = $('#mensajes');
function burbuja(m) {
  const el = document.createElement('div');
  if (m.de === 'sis') {
    const ico = m.tipo === 'evo' ? svgIcono('chispa', { size: 15 }) : m.tipo === 'ficha' ? svgIcono('libro', { size: 15 }) : m.tipo === 'prueba' ? svgIcono('meta', { size: 15 }) : '';
    el.className = `cl-sis cl-sis-${m.tipo || 'info'}`;
    el.innerHTML = `<span>${ico}${esc(m.texto)}</span>`;
    if (m.tipo === 'prueba') { const b = document.createElement('button'); b.className = 'btn btn-crear cl-sis-btn'; b.type = 'button'; b.textContent = 'Hacer la prueba juntos'; b.addEventListener('click', () => prueba.abrir()); el.append(b); }
    if (m.ficha) { el.classList.add('cl-sis-link'); el.addEventListener('click', () => { verPanelDer('cuaderno'); document.getElementById(`ficha-${m.ficha}`)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }); }
    return el;
  }
  if (m.de === 'apoyo') {
    const item = buscarApoyoPorId(m.idApoyo);
    if (!item) { el.hidden = true; return el; }
    el.className = 'cl-sis cl-sis-ficha cl-sis-link';
    el.innerHTML = `<span>${svgIcono(item.datos.icono, { def: 'libro', size: 15 })}Abrir ficha · ${esc(item.datos.titulo)}</span>`;
    el.addEventListener('click', () => mostrarApoyoEnChat(item));
    return el;
  }
  el.className = `cl-msg cl-${m.de}`;
  if (m.de === 'apr') {
    el.innerHTML = `<span class="cl-av" aria-hidden="true">${svgAprendin(A.fases[Math.min(PASOS, (m.fase ?? 0))].look, { emocion: m.emo || 'neutral' })}</span><div class="cl-globo"><b class="solo-lector">${esc(A.nombre)}:</b> <span class="cl-txt"></span>${m.intento ? `<span class="cl-intento" aria-label="Su intento">${esc(m.intento)}</span>` : ''}</div>`;
    el.querySelector('.cl-txt').textContent = m.texto;
  } else {
    el.innerHTML = `<div class="cl-globo"><b class="solo-lector">Tú:</b> <span class="cl-txt"></span></div>`;
    el.querySelector('.cl-txt').textContent = m.texto;
  }
  return el;
}
function pintarChat() {
  cajaMsg.replaceChildren(...C.chat.map(burbuja));
  activarFichas(cajaMsg);
  const vis = [...cajaMsg.querySelectorAll('.cl-msg-apoyo .vis')].at(-1);
  if (vis) animar(vis);
  bajar();
}
const bajar = () => { cajaMsg.scrollTop = cajaMsg.scrollHeight; };
function agregar(m) {
  C.chat.push(m); guardar();
  const el = burbuja(m); cajaMsg.append(el);
  if (m.de === 'apoyo') {
    activarFichas(el);
    const vis = el.querySelector('.vis'); if (vis) animar(vis);
  }
  bajar(); return el;
}

// El aprendín habla: tipea el texto, mueve la boca y (si está activado) lo dice en voz alta.
async function decir(texto, emo = 'neutral', extra = {}) {
  estrella.sentir(emo);
  const el = agregar({ de: 'apr', texto, emo, paso: C.paso, fase: faseActual(), ...extra });
  if (hablarVoz) vozAlta(texto);
  if (RM) return;
  const t = el.querySelector('.cl-txt'); t.textContent = '';
  estrella.hablar(true);
  for (let i = 0; i <= texto.length; i += 2) { t.textContent = texto.slice(0, i); if (i % 12 === 0) bajar(); await espera(16); }
  t.textContent = texto; estrella.hablar(false); bajar();
}
function sistema(texto, tipo, ficha) { agregar({ de: 'sis', texto, tipo, ficha, paso: C.paso }); }

let escribiendo = null;
function pensando(si) {
  escribiendo?.remove(); escribiendo = null;
  if (!si) return;
  estrella.sentir('pensando');
  escribiendo = document.createElement('div');
  escribiendo.className = 'cl-msg cl-apr cl-pensando';
  escribiendo.innerHTML = `<span class="cl-av" aria-hidden="true">${svgAprendin(look(), { emocion: 'pensando' })}</span><div class="cl-globo"><span class="cl-puntos" aria-label="${esc(A.nombre)} está pensando"><i></i><i></i><i></i></span></div>`;
  cajaMsg.append(escribiendo); bajar();
}
function bloquear(si) { ocupado = si; $('#btnEnviar').disabled = si || C?.paso > PASOS; $('#msg').disabled = C?.paso > PASOS; }

/* ---------- Enviar una explicación ---------- */
const msg = $('#msg');
msg.addEventListener('input', () => { msg.style.height = 'auto'; msg.style.height = Math.min(160, msg.scrollHeight) + 'px'; });
msg.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#formMsg').requestSubmit(); } });
$('#formMsg').addEventListener('submit', async e => {
  e.preventDefault();
  const texto = msg.value.trim();
  if (!texto || ocupado || C.paso > PASOS) return;
  msg.value = ''; msg.style.height = 'auto';
  const paso = C.paso;
  agregar({ de: 'yo', texto, paso });
  bloquear(true); pensando(true);
  const turnos = turnosDe(paso);
  let t, fuente = 'ia';
  const t0 = performance.now();
  try {
    if (!ia) throw new Error('sin IA');
    const historial = C.chat.filter(m => m.paso === paso && (m.de === 'apr' || m.de === 'yo')).slice(0, -1).map(m => ({ de: m.de, texto: m.texto }));
    const r = await fetch('/api/turno', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aprendin: resumenAprendin(A), paso, aprendido: aprendido(), historial, mensaje: texto, turnos }) });
    const j = await r.json(); if (!j.ok) throw new Error(j.error || r.status);
    t = j.turno;
  } catch {
    fuente = 'local';
    const falta = 1200 - (performance.now() - t0); if (falta > 0) await espera(falta);
    t = turnoLocal(A, paso, texto, turnos);
  }
  pensando(false);
  medir(paso, t, fuente);
  if (t.pista) { C.pista = t.pista; ponerPista(t.pista); }
  if (t.estado === 'error') estrella.equivocarse();
  await decir(t.dice, t.emocion, t.intento ? { intento: t.intento } : {});
  if (t.estado === 'entendio') {
    if (!C.apoyoContadoPaso?.[paso] && C.apoyoVistosPaso?.[paso]?.length) {
      [...new Set(C.apoyoVistosPaso[paso])].forEach(tp => registrarEventoVisual(tp, 'exito_clase'));
      (C.apoyoContadoPaso ||= {})[paso] = true; guardar(); pintarCalibracionClase();
    }
    await subirDeFase(paso, t);
  }
  bloquear(false); if (C.paso <= PASOS) msg.focus();
});
const aprendido = () => Object.entries(C.fichas).filter(([, f]) => f.datos).map(([p, f]) => `Paso ${p}: ${f.datos.titulo}. ${f.datos.idea}`);

/* ---------- Evolución ---------- */
async function subirDeFase(paso, t) {
  C.paso = paso + 1; guardar();
  const f = A.fases[paso];
  pedirFicha(paso);                     // la ficha se escribe mientras sigue la clase
  if (paso === PASOS - 1 && ia) setTimeout(() => prueba.preparar(), 4000);   // el examen se arma mientras le enseñas el último paso
  await espera(500);
  $('#evoTxt').textContent = paso === PASOS ? '¡Transformación!' : '¡Evolucionó!';
  const evo = $('#evo'); evo.classList.remove('si'); void evo.offsetWidth; evo.classList.add('si');
  estrella.evolucionar(f.look); estrella.sentir('orgulloso');
  $('#foco').style.setProperty('--tono', tonos(f.look.color).claro);
  sistema(`${A.nombre} subió a ${f.titulo}`, 'evo');
  pintarFases(); pintarAhora(); C.pista = ''; ponerPista(pistaBase()); $('#pista').hidden = true; $('#btnPista').setAttribute('aria-expanded', 'false');
  await espera(1400);
  if (paso < PASOS) { await decir(t.siguiente || preguntaInicial(A, paso + 1), 'curioso'); pintarApoyoActivo(); }
  else {
    estrella.saltar();
    await decir(`¡Ya aprendí los ${PASOS} pasos! Ahora viene la prueba de mi misión… Solo no puedo: ¿la respondemos juntos?`, 'nervioso');
    sistema('La prueba de la misión: la responden en equipo', 'prueba');
    pintarAhora(); if (ia || C.fichas[PASOS]?.estado === 'lista') prueba.preparar();
  }
}

/* ---------- Fichas ---------- */
async function pedirFicha(paso) {
  C.fichas[paso] = { estado: 'escribiendo' }; guardar(); pintarFichas();
  const historial = C.chat.filter(m => m.paso === paso && (m.de === 'apr' || m.de === 'yo')).map(m => ({ de: m.de, texto: m.texto }));
  let datos;
  try {
    if (!ia) throw new Error('sin IA');
    const r = await fetch('/api/ficha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aprendin: resumenAprendin(A), paso, historial }) });
    const j = await r.json(); if (!j.ok) throw new Error(j.error || r.status);
    datos = j.ficha;
  } catch {
    await espera(1500);
    datos = fichaLocal(A.fases[paso].concepto, historial.filter(m => m.de === 'yo').map(m => m.texto));
  }
  C.fichas[paso] = { estado: 'lista', datos: limpiarFicha(datos), nueva: true }; guardar();
  pintarFichas();
  if (panelDerActual !== 'cuaderno' && $('#dotCuaderno')) $('#dotCuaderno').hidden = false;
  sistema(`Nueva ficha: ${C.fichas[paso].datos.titulo}`, 'ficha', paso);
  if (C.paso > PASOS && !ia) prueba.preparar();
}
function pintarFichas() {
  const caja = $('#fichas'), hechas = Object.values(C.fichas).filter(f => f.estado === 'lista').length;
  $('#cuentaFichas').textContent = `${hechas} de ${PASOS}`;
  $('#notaFichas').hidden = Object.keys(C.fichas).length > 0;
  const pasos = Object.keys(C.fichas).map(Number).sort((a, b) => b - a);    // la más nueva arriba
  caja.replaceChildren();
  for (const p of pasos) {
    const f = C.fichas[p], cont = document.createElement('div');
    cont.className = 'cl-ficha'; cont.id = `ficha-${p}`;
    if (f.estado !== 'lista') {
      cont.innerHTML = `<div class="cl-escribe"><span class="mini" aria-hidden="true">${svgAprendin(A.fases[p].look, { emocion: 'pensando' })}</span><div><b>${esc(A.nombre)} está escribiendo su ficha…</b><span>${esc(A.fases[p].concepto)}</span></div></div>`;
    } else {
      cont.innerHTML = htmlFicha(f.datos, { numero: p, fase: A.fases[p].titulo, mundo: A.mundo, tono: tonos(A.fases[p].look.color), avatar: svgAprendin(A.fases[p].look, { emocion: 'orgulloso' }) });
      if (f.nueva) { cont.classList.add('cl-nueva'); f.nueva = false; guardar(); }
    }
    caja.append(cont);
  }
  activarFichas(caja);
}

/* ---------- Lo que midió la IA ---------- */
function medir(paso, t, fuente) {
  const m = C.medicion[paso] ||= { turnos: [] };
  m.turnos.push({ estado: t.estado, nota: t.nota, fuente });
  guardar(); pintarMedicion();
}
function pintarMedicion() {
  const caja = $('#medicionLista'); caja.replaceChildren();
  const pr = C.prueba;
  if (pr?.respuestas?.length) {
    const rs = pr.respuestas.filter(r => r && r.eleccion != null), bien = rs.filter(r => r.bien).length;
    const fila = document.createElement('div'); fila.className = 'cl-med cl-med-prueba';
    fila.innerHTML = `<div class="cl-med-cab"><b>Prueba en equipo${pr.intento > 1 ? ` (intento ${pr.intento})` : ''}</b><span class="est-chips">${rs.map(r => `<i class="est ${r.bien ? 'est-entendio' : 'est-error'}" title="${r.bien ? 'Bien' : 'Mal'}${r.aprBien ? '' : ' · el aprendín cayó en la trampa'}"></i>`).join('')}</span></div><p>${bien} de ${rs.length} bien · lo salvó ${rs.filter(r => r.bien && !r.aprBien).length} ${rs.filter(r => r.bien && !r.aprBien).length === 1 ? 'vez' : 'veces'}</p>`;
    caja.append(fila);
  }
  for (let p = 1; p <= PASOS; p++) {
    const m = C.medicion[p], f = A.fases[p];
    const fila = document.createElement('div'); fila.className = 'cl-med';
    const chips = (m?.turnos || []).map(t => `<i class="est est-${t.estado}" title="${esc(ESTADOS[t.estado])}${t.nota ? ': ' + esc(t.nota) : ''}"></i>`).join('');
    const ult = m?.turnos.at(-1);
    fila.innerHTML = `<div class="cl-med-cab"><b>${p}. ${esc(f.concepto)}</b><span class="est-chips" aria-label="${m ? m.turnos.map(t => ESTADOS[t.estado]).join(', ') : 'sin empezar'}">${chips || '<em>sin empezar</em>'}</span></div>${ult?.nota ? `<p>${esc(ult.nota)}</p>` : ''}`;
    caja.append(fila);
  }
}

/* ---------- Final ---------- */
let finMini = null;
function mostrarFinal(r) {
  const el = $('#final'); el.hidden = false; el.classList.add('listo');
  finMini?.destruir();
  finMini = crearAprendin({ look: A.fases[PASOS].look, emocion: 'orgulloso' });
  $('#finAprendin').replaceChildren(finMini.el);
  $('#finTit').textContent = `¡${A.nombre} es ${A.fases[PASOS].titulo}!`;
  $('#finSub').textContent = r ? `Le enseñaste ${A.tema} en ${PASOS} pasos y aprobaron juntos la prueba: ${r.bien} de ${r.n}${r.salvadas ? `, y lo salvaste ${r.salvadas === 1 ? 'una vez' : r.salvadas + ' veces'}` : ''}. ¡Misión cumplida!` : `Le enseñaste ${A.tema} en ${PASOS} pasos y escribió ${PASOS} fichas con lo que aprendió.`;
  estrella?.sentir('orgulloso'); pintarAhora();
  setTimeout(() => finMini?.entender(), RM ? 0 : 700);
  $('#finFichas').focus();
}
function cerrarFinal() { $('#final').hidden = true; finMini?.destruir(); finMini = null; }
$('#finFichas').addEventListener('click', () => { cerrarFinal(); $('#fichas').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); document.querySelectorAll('#fichas .vis').forEach(animar); });
$('#final').addEventListener('keydown', e => { if (e.key === 'Escape') cerrarFinal(); });

/* ---------- Voz ---------- */
function vozAlta(texto) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto); u.lang = 'es-419'; u.pitch = 1.5; u.rate = 1.05;
  const v = speechSynthesis.getVoices().find(v => v.lang.startsWith('es')); if (v) u.voice = v;
  u.onstart = () => estrella.hablar(true); u.onend = () => estrella.hablar(false);
  speechSynthesis.speak(u);
}
$('#btnVoz').addEventListener('click', e => { hablarVoz = !hablarVoz; e.currentTarget.setAttribute('aria-pressed', String(hablarVoz)); e.currentTarget.textContent = `Voz: ${hablarVoz ? 'sí' : 'no'}`; if (!hablarVoz) speechSynthesis?.cancel(); });
const mic = $('#btnMic'), micEstado = $('#micEstado');
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const tieneAudio = !!(navigator.mediaDevices?.getUserMedia && AudioCtx);
let preferirWav = !Rec, estadoMicTimer = null;
navigator.brave?.isBrave?.().then(si => { if (si) preferirWav = true; }).catch(() => {});

function setMicEstado(txt, tipo = '') {
  if (!micEstado) return;
  clearTimeout(estadoMicTimer);
  micEstado.textContent = txt;
  micEstado.className = 'cl-mic-estado' + (tipo ? ` ${tipo}` : '');
  if (tipo === 'ok') estadoMicTimer = setTimeout(() => { if (micEstado.classList.contains('ok')) setMicEstado(''); }, 3200);
}
function agregarTextoDictado(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return;
  const prefijo = msg.value.trim() ? msg.value.trimEnd() + ' ' : '';
  msg.value = prefijo + limpio;
  msg.dispatchEvent(new Event('input'));
  msg.focus();
}
function codificarWav16k(chunks, srOrigen) {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const unido = new Float32Array(total);
  let off = 0; for (const c of chunks) { unido.set(c, off); off += c.length; }
  const sr = 16000, ratio = srOrigen / sr;
  const n = Math.max(1, Math.round(unido.length / ratio));
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); wr(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); wr(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const pos = i * ratio, idx = Math.floor(pos), f = pos - idx;
    const s = unido[idx] + ((unido[idx + 1] ?? unido[idx]) - unido[idx]) * f;
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true);
  }
  return buf;
}
function bytesABase64(buf) {
  const u8 = new Uint8Array(buf); let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
}

if (mic && (Rec || tieneAudio)) {
  mic.hidden = false;
  let rec = null, grab = null;

  async function detenerWav() {
    if (!grab) return;
    const g = grab; grab = null;
    clearInterval(g.reloj); clearTimeout(g.tope);
    g.proc.disconnect(); g.mute.disconnect(); g.src.disconnect();
    g.stream.getTracks().forEach(t => t.stop());
    await g.ctx.close().catch(() => {});
    mic.classList.remove('grabando'); mic.setAttribute('aria-pressed', 'false');
    if (g.muestras < g.sr * 0.25 || g.maxAmp < 0.002) {
      setMicEstado('No escuché voz clara; habla más cerca del micrófono.', 'err'); return;
    }
    if (!ia) { setMicEstado('Activa el servidor local para transcribir tu voz.', 'err'); return; }
    mic.disabled = true; setMicEstado('Transcribiendo tu voz…');
    try {
      const wav = codificarWav16k(g.chunks, g.sr);
      const r = await fetch('/api/transcribir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioBase64: bytesABase64(wav), idioma: navigator.language || 'es' }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || r.status);
      if (!j.texto) setMicEstado('No entendí palabras claras; intenta hablar más fuerte.', 'err');
      else { agregarTextoDictado(j.texto); setMicEstado('Voz transcrita', 'ok'); }
    } catch (e) {
      setMicEstado(`No pude transcribir el audio (${e.message}).`, 'err');
    } finally { mic.disabled = false; }
  }

  async function iniciarWav() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioCtx({ sampleRate: 16000 });
      const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain();
      mute.gain.value = 0; src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
      const state = { stream, ctx, src, proc, mute, sr: ctx.sampleRate, chunks: [], muestras: 0, maxAmp: 0, segs: 0 };
      proc.onaudioprocess = e => {
        const d = e.inputBuffer.getChannelData(0), cp = new Float32Array(d);
        for (let i = 0; i < cp.length; i++) { const a = Math.abs(cp[i]); if (a > state.maxAmp) state.maxAmp = a; }
        state.chunks.push(cp); state.muestras += cp.length;
      };
      state.reloj = setInterval(() => { state.segs++; setMicEstado(`Grabando (${state.segs}s)… toca el micrófono para transcribir`, 'grabando'); }, 1000);
      state.tope = setTimeout(() => detenerWav(), 30000);
      grab = state;
      mic.classList.add('grabando'); mic.setAttribute('aria-pressed', 'true');
      setMicEstado('Grabando… toca el micrófono otra vez para transcribir', 'grabando');
    } catch (e) {
      mic.classList.remove('grabando'); mic.setAttribute('aria-pressed', 'false');
      const m = e.name === 'NotAllowedError' ? 'Permiso de micrófono denegado.' : e.name === 'NotFoundError' ? 'No se encontró ningún micrófono.' : `Error de micrófono (${e.message}).`;
      setMicEstado(m, 'err');
    }
  }

  function iniciarNativo() {
    rec = new Rec();
    rec.lang = navigator.language?.startsWith('es') ? navigator.language : 'es-ES';
    rec.continuous = true; rec.interimResults = true;
    let huboTexto = false, errorRed = false;
    const antes = msg.value ? msg.value.trim() + ' ' : '';
    rec.onresult = e => {
      huboTexto = true;
      msg.value = antes + [...e.results].map(r => r[0].transcript).join('');
      msg.dispatchEvent(new Event('input'));
    };
    rec.onerror = e => {
      if ((e.error === 'network' || e.error === 'service-not-allowed') && !huboTexto && tieneAudio) {
        errorRed = true; preferirWav = true; rec = null;
        mic.classList.remove('grabando'); mic.setAttribute('aria-pressed', 'false');
        iniciarWav(); return;
      }
      const errs = { 'not-allowed': 'Permiso de micrófono denegado.', 'audio-capture': 'No se detectó micrófono.', 'no-speech': 'No escuché voz; intenta hablar más cerca.', network: 'Tu navegador bloquea el dictado online.' };
      setMicEstado(errs[e.error] || `Error de dictado (${e.error}).`, 'err');
    };
    rec.onend = () => {
      if (errorRed) return;
      rec = null; mic.classList.remove('grabando'); mic.setAttribute('aria-pressed', 'false');
      if (huboTexto) setMicEstado('Dictado listo', 'ok');
      msg.focus();
    };
    mic.classList.add('grabando'); mic.setAttribute('aria-pressed', 'true');
    setMicEstado('Escuchando… toca el micrófono para parar', 'grabando');
    try { rec.start(); } catch (e) { rec = null; mic.classList.remove('grabando'); mic.setAttribute('aria-pressed', 'false'); if (tieneAudio) { preferirWav = true; iniciarWav(); } else setMicEstado(e.message, 'err'); }
  }

  mic.addEventListener('click', () => {
    if (grab) { detenerWav(); return; }
    if (rec) { rec.stop(); return; }
    if (preferirWav && tieneAudio) iniciarWav();
    else if (Rec) iniciarNativo();
    else iniciarWav();
  });
}

/* ---------- Fichas de apoyo en panel lateral + calibración ---------- */
let cargandoApoyo = false, apoyoActivoId = null, recienteApoyoId = null;
const idUnicoApoyo = () => `ap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
function fichasEstudioTema() {
  const s = cargarEstudio();
  const prev = s && s.tema?.toLowerCase() === A.tema.toLowerCase() ? s.fichas : [];
  const clase = C.apoyo || [];
  const mismo = (a, b) => a.datos.titulo === b.datos.titulo && a.datos.visual.tipo === b.datos.visual.tipo;
  return [...prev.filter(pf => !clase.some(cf => mismo(pf, cf))), ...clase].map((it, i) => it.id ? it : { ...it, id: `prev-${i}` });
}
function buscarApoyoPorId(id) {
  return (C.apoyo || []).find(f => f.id === id) || fichasEstudioTema().find(f => f.id === id);
}
function registrarVistaPaso(paso, tipo) {
  if (!tipo || paso > PASOS) return;
  const v = (C.apoyoVistosPaso ||= {})[paso] ||= [];
  if (!v.includes(tipo)) { v.push(tipo); guardar(); }
}
function guardarApoyo(item) {
  if (!item.id) item.id = idUnicoApoyo();
  (C.apoyo ||= []).push(item);
  registrarVistaPaso(item.paso || C.paso, item.datos.visual.tipo);
  const s = cargarEstudio();
  if (s && s.tema?.toLowerCase() === A.tema.toLowerCase()) { s.fichas.push(item); guardarEstudio(s); }
  else guardarEstudio({ activo: true, tema: A.tema, gustos: A.gustos || A.mundo, nivel: 'algo', usaAprendin: true, fichas: [...(C.apoyo || [])] });
  apoyoActivoId = item.id;
  pintarApoyoLista(); pintarApoyoActivo(); pintarCalibracionClase();
  return item;
}
function marcarReaccionApoyo(id, r, nota) {
  const target = (C.apoyo || []).find(f => f.id === id) || C.apoyo?.at(-1);
  if (target) { target.reaccion = r; target.nota = nota; guardar(); }
  const s = cargarEstudio();
  if (s?.fichas?.length && s.tema?.toLowerCase() === A.tema.toLowerCase()) {
    const st = (id && s.fichas.find(f => f.id === id)) || s.fichas.at(-1);
    if (st) { st.reaccion = r; st.nota = nota; guardarEstudio(s); }
  }
}
function pintarApoyoActivo() {
  const host = $('#apoyoActivoHost');
  if (!host || !A || !C) return;
  const todas = fichasEstudioTema();
  const pasoActual = Math.min(PASOS, C.paso);
  const concepto = A.fases[pasoActual]?.concepto || A.tema;

  const delPaso = todas.filter(f => f.paso === C.paso);
  const externo = apoyoActivoId ? buscarApoyoPorId(apoyoActivoId) : null;
  const tarjetas = externo && !delPaso.some(f => f.id === externo.id) ? [...delPaso, externo] : delPaso;

  if (!tarjetas.length && cargandoApoyo) {
    host.innerHTML = `<div class="cl-apoyo-cargando"><p class="cargando">Armando una ficha visual adaptada debajo…</p></div>`;
    return;
  }

  if (!tarjetas.length) {
    host.innerHTML = `<div class="cl-apoyo-vacio">
      <div class="cl-apoyo-vacio-ico">${svgIcono('libro', { size: 22 })}</div>
      <h3>Apoyo visual: ${esc(concepto)}</h3>
      <p class="nota">Abre una ficha visual con gráficos animados y ejemplos de ${esc(A.mundo || 'tu mundo')} para tenerla a la vista mientras explicas en el chat.</p>
      <button type="button" class="btn btn-fuerte" id="btnPedirApoyoPanel"${C.paso > PASOS ? ' hidden' : ''}>Ver ficha de este paso</button>
    </div>`;
    $('#btnPedirApoyoPanel')?.addEventListener('click', () => pedirApoyo('inicio'));
    return;
  }

  const cuentaTxt = tarjetas.length > 1 ? ` · ${tarjetas.length} fichas` : '';
  host.innerHTML = `<div class="cl-apoyo-panel-card">
    <div class="cl-apoyo-panel-cab">
      <span>${svgIcono(tarjetas.at(-1).datos.icono, { def: 'libro', size: 15 })} <b>${esc(concepto)}</b><small class="cl-apoyo-cnt">${esc(cuentaTxt)}</small></span>
      <button type="button" class="btn btn-chico cl-apoyo-ir">Escribir al chat</button>
    </div>
    <div class="cl-apoyo-stack"></div>
  </div>`;
  const stack = host.querySelector('.cl-apoyo-stack');
  const av = svgAprendin(look(), { emocion: 'curioso' });
  const tono = tonos(look().color);

  tarjetas.forEach((item, i) => {
    const esUltima = i === tarjetas.length - 1;
    const idx = Math.max(0, todas.findIndex(f => f.id === item.id || (f.datos.titulo === item.datos.titulo && f.datos.visual.tipo === item.datos.visual.tipo)));
    const itemEl = document.createElement('div');
    itemEl.className = `cl-apoyo-stack-item${esUltima ? ' is-activa' : ' is-anterior'}${recienteApoyoId === item.id ? ' cl-nueva' : ''}`;
    itemEl.dataset.apoyoId = item.id;
    itemEl.innerHTML = renderizarFichaEstudio(item, idx, {
      esUltima: esUltima && item.reaccion !== 'entendio',
      permitirEnfoque: esUltima && item.reaccion === 'entendio',
      gustos: A.gustos || A.mundo,
      avatar: av,
      tono,
      placeholder: 'Opcional: ¿qué parte de este paso no entiendes?'
    });
    if (esUltima) {
      enlazarAccionesFicha(itemEl, {
        ocupado: () => cargandoApoyo,
        alReaccionar: (r, nota) => {
          marcarReaccionApoyo(item.id, r, nota);
          registrarEventoVisual(item.datos.visual.tipo, r);
          pintarCalibracionClase();
          if (r === 'entendio') {
            pintarApoyoActivo();
            if (C.paso <= PASOS) msg.focus();
          } else {
            pedirApoyo(r, nota);
          }
        },
        alEnfoque: ({ pinTipo, nota }) => {
          marcarReaccionApoyo(item.id, 'enfoque', nota);
          pedirApoyo('enfoque', nota, pinTipo);
        },
        alOtra: () => pedirApoyo('ejemplo')
      });
    }
    stack.append(itemEl);
  });

  if (cargandoApoyo) {
    stack.insertAdjacentHTML('beforeend', `<div class="cl-apoyo-cargando"><p class="cargando">Armando una nueva ficha visual adaptada debajo…</p></div>`);
  }

  host.querySelector('.cl-apoyo-ir')?.addEventListener('click', () => { if (C.paso <= PASOS) msg.focus(); });

  activarFichas(stack, { autoPlay: false });
  if (cargandoApoyo) {
    stack.querySelector('.cl-apoyo-cargando')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
  } else if (recienteApoyoId) {
    const ultimaVis = stack.querySelector('.cl-apoyo-stack-item.is-activa .vis');
    if (ultimaVis) animar(ultimaVis, { autoPlay: true });
    if (tarjetas.length > 1) {
      stack.querySelector('.cl-apoyo-stack-item.is-activa')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
    }
    recienteApoyoId = null;
  } else {
    const ultimaVis = stack.querySelector('.cl-apoyo-stack-item.is-activa .vis');
    if (ultimaVis) animar(ultimaVis, { autoPlay: true });
  }
}
function pintarApoyoLista() {
  const todas = fichasEstudioTema(), det = $('#apoyoGuardadas'), lista = $('#apoyoMiniLista');
  if (!det || !lista) return;
  det.hidden = !todas.length;
  $('#cuentaApoyo').textContent = String(todas.length);
  lista.replaceChildren();
  [...todas].reverse().forEach(it => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cl-apoyo-mini';
    b.innerHTML = `<span class="cl-apoyo-mini-txt">${svgIcono(it.datos.icono, { def: 'libro', size: 15 })}<span>${esc(it.datos.titulo)}</span></span><small>${esc(it.datos.visual.tipo)}</small>`;
    b.addEventListener('click', () => mostrarApoyoEnChat(it));
    lista.append(b);
  });
}
function pintarCalibracionClase() {
  const cont = $('#calibracionClase');
  if (!cont) return;
  renderizarPanelCalibracion(cont, { historial: historialDe(fichasEstudioTema()), compacto: true, alCambiar: () => pintarCalibracionClase() });
}
function mostrarApoyoEnChat(item) {
  let guardado = (C.apoyo || []).find(f => f.id === item.id || (f.datos.titulo === item.datos.titulo && f.datos.visual.tipo === item.datos.visual.tipo));
  if (!guardado) guardado = guardarApoyo({ ...item, paso: item.paso || Math.min(PASOS, C.paso) });
  registrarVistaPaso(C.paso, guardado.datos.visual.tipo);
  apoyoActivoId = guardado.id;
  verPanelDer('apoyo');
  pintarApoyoActivo();
  if (window.innerWidth <= 1180) $('#panelDer')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
}
async function pedirApoyo(reaccion, nota = '', pinTipo = '') {
  if (cargandoApoyo || C.paso > PASOS) return;
  cargandoApoyo = true;
  verPanelDer('apoyo');
  document.querySelectorAll('#apoyoActivoHost .fi-reaccion-btn, #apoyoActivoHost .fi-btn-enfoque, #apoyoActivoHost .fi-enfoque-chip, #apoyoActivoHost .fi-enfoque-send, #btnApoyo').forEach(b => { if (b) b.disabled = true; });
  pintarApoyoActivo();
  if (window.innerWidth <= 1180) $('#panelDer')?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  try {
    const pasoActual = C.paso, objetivo = A.fases[pasoActual]?.concepto || '';
    const historial = historialDe(fichasEstudioTema());
    const calBase = calcularCalibracion(historial);
    const calibracion = pinTipo ? { ...calBase, pinTipo, estrategia: 'fijo' } : calBase;
    const { datos, fuente } = await solicitarFichaInicio({
      ia, tema: A.tema, gustos: A.gustos || A.mundo, nivel: reaccion === 'inicio' ? 'cero' : 'algo',
      reaccion, nota, objetivo, aprendin: A, historial, calibracion
    });
    const nuevaId = idUnicoApoyo();
    recienteApoyoId = nuevaId;
    cargandoApoyo = false;
    const item = guardarApoyo({ id: nuevaId, paso: pasoActual, datos, fuente, reaccionOrigen: reaccion, reaccion: null, nota });
    apoyoActivoId = item.id;
  } finally {
    const quedoCargando = cargandoApoyo;
    cargandoApoyo = false;
    document.querySelectorAll('#apoyoActivoHost .fi-reaccion-btn, #apoyoActivoHost .fi-btn-enfoque, #apoyoActivoHost .fi-enfoque-chip, #apoyoActivoHost .fi-enfoque-send, #btnApoyo').forEach(b => { if (b) b.disabled = false; });
    if (quedoCargando) pintarApoyoActivo();
  }
}
function abrirApoyoEnChat() {
  if (!A || C.paso > PASOS) return;
  const pasoActual = C.paso;
  const previa = [...fichasEstudioTema()].reverse().find(f => f.paso === pasoActual);
  if (previa) mostrarApoyoEnChat(previa);
  else pedirApoyo('inicio');
}
$('#btnApoyo')?.addEventListener('click', () => abrirApoyoEnChat());

/* ---------- Reiniciar y ejemplo ---------- */
$('#btnReiniciar').addEventListener('click', () => {
  if (!A || !confirm(`¿Empezar la clase de ${A.nombre} desde cero? Se borran sus fichas.`)) return;
  borrarClase(A.id); cerrarFinal(); empezar();
});
$('#btnEjemplo').addEventListener('click', () => { A = DEMO; guardarAprendin(A); empezar(); });

estadoIA().then(empezar);
