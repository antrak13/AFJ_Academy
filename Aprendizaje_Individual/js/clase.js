// La clase: el estudiante le enseña al aprendín, la IA responde en su papel y evalúa en silencio.
// Cada paso que entiende → evoluciona a la fase siguiente y escribe una ficha con un visual.
import { crearAprendin, svgAprendin, EMOCIONES } from './aprendin.js';
import { tonos } from './color.js';
import { cargarAprendin, guardarAprendin, cargarClase, guardarClase, borrarClase } from './guardado.js';
import { ESTADOS, PASOS, preguntaInicial, turnoLocal, resumenAprendin } from './turno.js';
import { htmlFicha, fichaLocal, limpiarFicha } from './fichas.js';
import { activarFichas, animar } from './fichas-dom.js';
import { DEMO } from './demo-aprendin.js';
import { crearPrueba } from './prueba.js';
import { demoClase } from './demo-clase.js';
import { cargarEstudio, guardarEstudio, solicitarFichaInicio, renderizarFichaEstudio, historialDe } from './fichas-apoyo.js';

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
  const el = $('#estadoIA'); el.className = 'estado-ia' + (ia ? ' si' : ''); el.textContent = ia ? 'IA conectada' : 'Sin IA: modo práctica';
}

function empezar() {
  if (!A) { $('#vacio').hidden = false; $('#clase').hidden = true; return; }
  $('#vacio').hidden = true; $('#clase').hidden = false;
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
  pintarFases(); pintarAhora(); pintarChat(); pintarFichas(); pintarMedicion(); pintarApoyoLista();
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
function pintarAhora() {
  const fin = C.paso > PASOS;
  $('#ahoraTit').textContent = fin ? '¡Aprendió todo el tema!' : `Paso ${C.paso} de ${PASOS} · le enseñas`;
  $('#concepto').textContent = fin ? `${A.nombre} ya es ${A.fases[PASOS].titulo}.` : A.fases[C.paso].concepto;
  $('#btnPista').hidden = fin;
  $('#btnApoyo').hidden = fin;
  $('#pista').textContent = C.pista || pistaBase();
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
    el.className = `cl-sis cl-sis-${m.tipo || 'info'}`;
    el.innerHTML = `<span>${esc(m.texto)}</span>`;
    if (m.tipo === 'prueba') { const b = document.createElement('button'); b.className = 'btn btn-crear cl-sis-btn'; b.type = 'button'; b.textContent = 'Hacer la prueba juntos'; b.addEventListener('click', () => prueba.abrir()); el.append(b); }
    if (m.ficha) { el.classList.add('cl-sis-link'); el.addEventListener('click', () => document.getElementById(`ficha-${m.ficha}`)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' })); }
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
function pintarChat() { cajaMsg.replaceChildren(...C.chat.map(burbuja)); bajar(); }
const bajar = () => { cajaMsg.scrollTop = cajaMsg.scrollHeight; };
function agregar(m) { C.chat.push(m); guardar(); const el = burbuja(m); cajaMsg.append(el); bajar(); return el; }

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
    const historial = C.chat.filter(m => m.paso === paso && m.de !== 'sis').slice(0, -1).map(m => ({ de: m.de, texto: m.texto }));
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
  if (t.pista) { C.pista = t.pista; $('#pista').textContent = t.pista; }
  if (t.estado === 'error') estrella.equivocarse();
  await decir(t.dice, t.emocion, t.intento ? { intento: t.intento } : {});
  if (t.estado === 'entendio') await subirDeFase(paso, t);
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
  pintarFases(); pintarAhora(); C.pista = ''; $('#pista').textContent = pistaBase(); $('#pista').hidden = true; $('#btnPista').setAttribute('aria-expanded', 'false');
  await espera(1400);
  if (paso < PASOS) await decir(t.siguiente || preguntaInicial(A, paso + 1), 'curioso');
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
  const historial = C.chat.filter(m => m.paso === paso && m.de !== 'sis').map(m => ({ de: m.de, texto: m.texto }));
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
    fila.innerHTML = `<div class="cl-med-cab"><b>${p}. ${esc(f.concepto)}</b><span class="est-chips" aria-label="${m ? m.turnos.map(t => ESTADOS[t.estado]).join(', ') : 'sin empezar'}">${chips || '<em>sin empezar</em>'}</span></div>${ult?.nota ? `<p>${esc(ult.nota)}${ult.fuente === 'local' ? ' <small>(sin IA)</small>' : ''}</p>` : ''}`;
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
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Rec) {
  const mic = $('#btnMic'); mic.hidden = false;
  let rec = null;
  mic.addEventListener('click', () => {
    if (rec) { rec.stop(); return; }
    rec = new Rec(); rec.lang = 'es-419'; rec.interimResults = true;
    const antes = msg.value ? msg.value.trim() + ' ' : '';
    rec.onresult = e => { msg.value = antes + [...e.results].map(r => r[0].transcript).join(''); msg.dispatchEvent(new Event('input')); };
    rec.onend = () => { rec = null; mic.classList.remove('grabando'); msg.focus(); };
    rec.onerror = () => { rec = null; mic.classList.remove('grabando'); };
    mic.classList.add('grabando'); rec.start();
  });
}

/* ---------- Fichas de apoyo para estudiar durante la clase ---------- */
let cargandoApoyo = false;
function fichasEstudioTema() {
  const s = cargarEstudio();
  const prev = s && s.tema?.toLowerCase() === A.tema.toLowerCase() ? s.fichas : [];
  const clase = C.apoyo || [];
  const mismo = (a, b) => a.datos.titulo === b.datos.titulo && a.datos.visual.tipo === b.datos.visual.tipo;
  return [...prev.filter(pf => !clase.some(cf => mismo(pf, cf))), ...clase];
}
function guardarApoyo(item) {
  (C.apoyo ||= []).push(item); guardar();
  const s = cargarEstudio();
  if (s && s.tema?.toLowerCase() === A.tema.toLowerCase()) { s.fichas.push(item); guardarEstudio(s); }
  else guardarEstudio({ activo: true, tema: A.tema, gustos: A.gustos || A.mundo, nivel: 'algo', usaAprendin: true, fichas: [...(C.apoyo || [])] });
  pintarApoyoLista();
}
function marcarReaccionApoyo(r, nota) {
  if (C.apoyo?.length) { const u = C.apoyo.at(-1); u.reaccion = r; u.nota = nota; guardar(); }
  const s = cargarEstudio();
  if (s?.fichas?.length && s.tema?.toLowerCase() === A.tema.toLowerCase()) {
    const u = s.fichas.at(-1); u.reaccion = r; u.nota = nota; guardarEstudio(s);
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
    b.innerHTML = `<span>${esc(it.datos.icono)} ${esc(it.datos.titulo)}</span><small>${esc(it.datos.visual.tipo)}</small>`;
    b.addEventListener('click', () => abrirApoyo(false));
    lista.append(b);
  });
}
function pintarApoyoModal() {
  const caja = $('#apoyoLista'); caja.replaceChildren();
  const todas = fichasEstudioTema();
  const av = svgAprendin(look(), { emocion: 'curioso' }), tono = tonos(look().color);
  [...todas].reverse().forEach((item, revIdx) => {
    const idx = todas.length - 1 - revIdx, esUltima = idx === todas.length - 1;
    const wrap = document.createElement('div');
    wrap.className = 'cl-ficha' + (esUltima ? ' cl-nueva' : '');
    wrap.innerHTML = renderizarFichaEstudio(item, idx, { esUltima, gustos: A.gustos || A.mundo, avatar: av, tono, placeholder: 'Opcional: ¿qué parte de este paso no entiendes?' });
    caja.append(wrap);
  });
  caja.querySelectorAll('.fi-reaccion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (cargandoApoyo) return;
      const r = btn.dataset.reaccion, nota = caja.querySelector('#notaDuda')?.value.trim() || '';
      marcarReaccionApoyo(r, nota);
      pedirApoyo(r, nota);
    });
  });
  activarFichas(caja);
  const vis = caja.querySelector('.vis'); if (vis) animar(vis);
}
async function pedirApoyo(reaccion, nota = '') {
  if (cargandoApoyo || C.paso > PASOS) return;
  cargandoApoyo = true;
  $('#apoyoCargando').hidden = false;
  document.querySelectorAll('#apoyoLista .fi-reaccion-btn').forEach(b => { b.disabled = true; });
  const objetivo = A.fases[C.paso]?.concepto || '';
  const { datos, fuente } = await solicitarFichaInicio({
    ia, tema: A.tema, gustos: A.gustos || A.mundo, nivel: reaccion === 'inicio' ? 'cero' : 'algo',
    reaccion, nota, objetivo, aprendin: A, historial: historialDe(fichasEstudioTema())
  });
  guardarApoyo({ paso: C.paso, datos, fuente, reaccionOrigen: reaccion, reaccion: null, nota });
  cargandoApoyo = false;
  $('#apoyoCargando').hidden = true;
  pintarApoyoModal();
}
function abrirApoyo(autoGenerar = true) {
  const pasoActual = Math.min(PASOS, C.paso);
  const concepto = A.fases[pasoActual]?.concepto || A.tema;
  $('#apoyoTit').textContent = `${pasoActual}. ${concepto}`;
  $('#apoyoSub').textContent = `Para entenderlo antes de explicarle a ${A.nombre}`;
  $('#apoyo').hidden = false; document.body.classList.add('con-prueba');
  const todas = fichasEstudioTema();
  const hayDelPaso = todas.some(f => f.paso === pasoActual);
  pintarApoyoModal();
  if (autoGenerar && !hayDelPaso && C.paso <= PASOS) pedirApoyo('inicio');
  $('#apoyoCerrar').focus();
}
function cerrarApoyo(enfocarChat = false) {
  $('#apoyo').hidden = true; document.body.classList.remove('con-prueba');
  if (enfocarChat && C.paso <= PASOS) $('#msg').focus();
}
$('#btnApoyo').addEventListener('click', () => abrirApoyo(true));
$('#apoyoCerrar').addEventListener('click', () => cerrarApoyo(false));
$('#apoyoExplicar').addEventListener('click', () => cerrarApoyo(true));
$('#apoyo').addEventListener('keydown', e => { if (e.key === 'Escape') cerrarApoyo(false); });

/* ---------- Reiniciar y ejemplo ---------- */
$('#btnReiniciar').addEventListener('click', () => {
  if (!A || !confirm(`¿Empezar la clase de ${A.nombre} desde cero? Se borran sus fichas.`)) return;
  borrarClase(A.id); cerrarFinal(); empezar();
});
$('#btnEjemplo').addEventListener('click', () => { A = DEMO; guardarAprendin(A); empezar(); });

estadoIA().then(empezar);
