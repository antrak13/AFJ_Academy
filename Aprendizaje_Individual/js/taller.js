// Taller de aprendines: crear uno con IA a partir de tus gustos y un tema, ver sus fases de evolución,
// probar emociones y acciones, y retocar su look pieza por pieza.
import { crearAprendin, svgAprendin, FORMAS, EMOCIONES, EMO_IDS, OJOS, BOCAS, MARCAS, normalizarLook } from './aprendin.js';
import { PIEZAS, NOMBRES_SLOT } from './piezas.js';
import { PALETA, color, tonos } from './color.js';
import { MUNDOS, NOMBRES } from './mundos.js';
import { fasesDesdeLook, crearLocal, preguntasLocales, ZONAS } from './creador.js';

const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? 'true' : v);
  }
  el.append(...hijos.flat().filter(x => x != null));
  return el;
}
const clonar = x => JSON.parse(JSON.stringify(x));
const azar = xs => xs[Math.floor(Math.random() * xs.length)];
const espera = ms => new Promise(ok => setTimeout(ok, ms));

// Estado: las fases son 5 looks completos; E.nivel es la fase que se ve.
const E = { mundo: MUNDOS[0], ficha: null, fases: fasesDesdeLook(MUNDOS[0].look), nivel: 4, zona: 'cabeza', emocion: 'feliz', ia: null, creando: false };
const look = () => E.fases[E.nivel].look;

/* ---------- Aprendín principal y marca ---------- */
const estrella = crearAprendin({ look: look(), emocion: E.emocion });
$('#estrella').append(estrella.el);
const marca = crearAprendin({ look: { forma: 'bollo', color: 'coral', rasgos: { ojos: 'grandes' }, piezas: { pelo: 'mechon' } }, emocion: 'feliz' });
$('#marcaAv').append(marca.el);
const foco = $('.foco');
const teñir = () => foco.style.setProperty('--tono', tonos(look().color).claro);

/* ---------- Globo de diálogo ---------- */
let tipeo = 0, callar = 0;
function decir(texto, emocion) {
  if (emocion) { E.emocion = emocion; estrella.sentir(emocion); marcarEmocion(); }
  const globo = $('#globo');
  clearInterval(tipeo); clearTimeout(callar);
  $('#dicho').textContent = texto;
  if (RM || E.creando) { globo.textContent = texto; return; }
  globo.textContent = ''; estrella.hablar(true);
  let i = 0;
  tipeo = setInterval(() => {
    i += 2; globo.textContent = texto.slice(0, i);
    if (i >= texto.length) { clearInterval(tipeo); callar = setTimeout(() => estrella.hablar(false), 120); }
  }, 30);
}

/* ---------- Placa ---------- */
const inputNombre = $('#nombre');
inputNombre.addEventListener('input', () => { const v = inputNombre.value.trim() || 'Aprendín'; E.fases.forEach(f => { f.look.nombre = v; }); if (E.ficha) E.ficha.nombre = v; estrella.vestir(look()); pintarJSON(); });
function pintarPlaca() {
  inputNombre.value = look().nombre || '';
  const de = E.ficha?.de || E.mundo?.de;
  $('#placaMundo').textContent = de ? `viene ${de}` : 'tu propio aprendín';
}

/* ---------- Fases ---------- */
const miniSvg = (l, emocion = 'neutral') => h('span', { class: 'mini', 'aria-hidden': 'true', html: svgAprendin(l, { emocion }) });
const cajaFases = $('#fases');
function pintarFases() {
  cajaFases.replaceChildren();
  E.fases.forEach((f, i) => cajaFases.append(h('button', {
    class: 'fase', type: 'button', role: 'radio', 'aria-checked': i === E.nivel ? 'true' : 'false', tabindex: i === E.nivel ? 0 : -1, 'data-nv': i,
    'aria-label': `Fase ${i}: ${f.titulo}${f.concepto ? `. Aprendió: ${f.concepto}` : ''}`, title: f.concepto || f.titulo, onclick: () => cambiarFase(i)
  }, miniSvg(f.look), h('span', { class: 'fase-num' }, String(i)), h('span', { class: 'fase-tit' }, f.titulo))));
  const f = E.fases[E.nivel];
  $('#faseNombre').textContent = f.titulo;
  $('#notaFases').replaceChildren(...(f.concepto ? ['Para llegar aquí aprendió: ', h('b', {}, f.concepto)] : [E.nivel === 0 ? 'Recién llega: todavía no sabe nada del tema.' : 'En la clase, cada idea que le enseñas bien lo hace pasar de fase.']));
}
cajaFases.addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
  e.preventDefault(); const nv = Math.max(0, Math.min(E.fases.length - 1, E.nivel + d)); cambiarFase(nv); cajaFases.querySelector(`[data-nv="${nv}"]`)?.focus();
});
function cambiarFase(nv) {
  if (nv === E.nivel) return;
  const sube = nv > E.nivel; E.nivel = nv;
  const f = E.fases[nv];
  if (sube) { estrella.evolucionar(f.look); decir(f.concepto ? `¡Ahora soy ${f.titulo}! Ya entiendo: ${f.concepto.charAt(0).toLowerCase() + f.concepto.slice(1)}.` : `¡Subí a ${f.titulo}! Mira lo que gané.`, 'orgulloso'); }
  else { estrella.vestir(f.look); decir(nv === 0 ? 'Volví al principio. No sé casi nada… ¿me enseñas?' : `Volví a ${f.titulo}.`, 'neutral'); }
  teñir(); pintarTodo();
}

/* ---------- Acciones y emociones ---------- */
const ACCIONES = [
  ['Salude', () => { estrella.saludar(); decir(`¡Hola! Soy ${look().nombre || 'tu aprendín'}.`, 'feliz'); }],
  ['Salte', () => estrella.saltar()],
  ['Entienda', () => { estrella.entender(); E.emocion = 'eureka'; marcarEmocion(); decir(EMOCIONES.eureka.frase); }],
  ['Se equivoque', () => { estrella.equivocarse(); E.emocion = 'avergonzado'; marcarEmocion(); decir(EMOCIONES.avergonzado.frase); }]
];
ACCIONES.forEach(([t, fn], i) => $('#acciones').append(h('button', { class: 'btn' + (i === 2 ? ' btn-fuerte' : ''), type: 'button', onclick: fn }, t)));
const cajaEmo = $('#emociones');
EMO_IDS.forEach(id => cajaEmo.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', 'data-emo': id, onclick: () => decir(EMOCIONES[id].frase, id) }, EMOCIONES[id].nombre)));
function marcarEmocion() { cajaEmo.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.emo === E.emocion)); }

/* ---------- Crear con IA ---------- */
const GUSTOS = ['anime', 'fútbol', 'superhéroes', 'videojuegos', 'cocinar', 'música', 'dinosaurios', 'el espacio', 'básquet', 'gatos'];
const TEMAS = ['fracciones', 'la fotosíntesis', 'ecuaciones lineales', 'el ciclo del agua', 'porcentajes', 'la célula'];
function sugerir(caja, input, lista, sumar) {
  for (const t of lista) caja.append(h('button', { class: 'chip chip-sug', type: 'button', onclick: () => {
    const v = input.value.trim();
    input.value = sumar && v ? (v.toLowerCase().includes(t) ? v : `${v}, ${t}`) : t; input.focus();
  } }, t));
}
sugerir($('#sugGustos'), $('#gustos'), GUSTOS, true);
sugerir($('#sugTema'), $('#tema'), TEMAS, false);

async function estadoIA() {
  const el = $('#estadoIA');
  try {
    const r = await fetch('/api/estado', { cache: 'no-store' });
    E.ia = r.ok ? await r.json() : null;
  } catch { E.ia = null; }
  const si = !!E.ia?.ia;
  el.className = 'estado-ia' + (si ? ' si' : '');
  el.textContent = si ? `IA conectada · ${E.ia.modelo}` : 'Sin IA: lo armo con el catálogo';
}

// Flujo: 1) gustos y tema → aparece el huevo y la IA hace 2 o 3 preguntas · 2) respuestas → la IA crea · 3) el huevo se rompe.
const PASOS = ['Leyendo lo que te gusta…', 'Eligiendo su disfraz y sus colores…', 'Probándole el peinado…', 'Dividiendo el tema en pasos…', 'Pensando por qué lo necesita…', 'Ya casi sale del huevo…'];
const pedido = { gustos: '', tema: '', preguntas: [] };
let pasos = 0;
const pedirIA = async (ruta, cuerpo) => {
  const r = await fetch(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || `error ${r.status}`);
  return j;
};
function mostrarHuevo(si) {
  clearInterval(pasos);
  foco.classList.remove('rompiendo', 'abierto');
  foco.classList.toggle('incubando', si);
}
function verPaso(paso) {
  $('#formCrear').hidden = paso !== 'form';
  $('#preguntas').hidden = paso !== 'preguntas';
}

$('#formCrear').addEventListener('submit', async e => {
  e.preventDefault();
  if (E.creando) return;
  pedido.gustos = $('#gustos').value.trim(); pedido.tema = $('#tema').value.trim();
  if (!pedido.gustos || !pedido.tema) return;
  E.creando = true; $('#ficha').hidden = true;
  verPaso('preguntas'); mostrarHuevo(true);
  decir('¡Apareció tu huevo! Mientras se forma, cuéntame un poco más.');
  $('#entendi').textContent = '';
  $('#listaPreguntas').replaceChildren(h('p', { class: 'cargando' }, 'Pensando qué preguntarte…'));
  $('#btnNacer').disabled = true;
  let r;
  try { if (!E.ia?.ia) throw new Error('sin IA'); r = await pedirIA('/api/preguntas', { gustos: pedido.gustos, tema: pedido.tema }); if (!r.preguntas?.length) throw new Error('sin preguntas'); }
  catch { r = preguntasLocales(pedido.gustos, pedido.tema); }
  pedido.preguntas = r.preguntas;
  $('#entendi').textContent = r.entendi || '';
  pintarPreguntas();
  $('#btnNacer').disabled = false;
});

function pintarPreguntas() {
  const caja = $('#listaPreguntas'); caja.replaceChildren();
  pedido.preguntas.forEach((q, i) => {
    q.respuesta = '';
    const otra = h('input', { class: 'otra', type: 'text', maxlength: 80, placeholder: 'O escribe otra respuesta…', 'aria-label': `Otra respuesta: ${q.pregunta}` });
    const chips = h('div', { class: 'chips', role: 'group', 'aria-labelledby': `preg${i}` }, q.opciones.map(op => h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: ev => {
      const ya = ev.currentTarget.getAttribute('aria-pressed') === 'true';
      chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
      if (!ya) { ev.currentTarget.setAttribute('aria-pressed', 'true'); q.respuesta = op; otra.value = ''; } else q.respuesta = '';
    } }, op)));
    otra.addEventListener('input', () => { if (otra.value.trim()) { chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', 'false')); q.respuesta = otra.value.trim(); } else q.respuesta = ''; });
    caja.append(h('div', { class: 'pregunta-ia' }, h('p', { class: 'pregunta-txt', id: `preg${i}` }, q.pregunta), chips, otra));
  });
}

$('#btnNacer').addEventListener('click', () => crear(pedido.preguntas.filter(q => q.respuesta).map(q => ({ pregunta: q.pregunta, respuesta: q.respuesta }))));
$('#btnSaltar').addEventListener('click', () => crear([]));
$('#btnVolver').addEventListener('click', () => { E.creando = false; mostrarHuevo(false); verPaso('form'); decir(EMOCIONES.neutral.frase, 'neutral'); $('#gustos').focus(); });

async function crear(detalles) {
  const nacer = $('#btnNacer'); nacer.disabled = true; $('#btnSaltar').disabled = true;
  abrirNacimiento();
  let a, info;
  const t0 = performance.now();
  try {
    if (!E.ia?.ia) throw new Error('sin IA');
    const j = await pedirIA('/api/aprendin', { gustos: pedido.gustos, tema: pedido.tema, detalles });
    a = j.aprendin; info = j.ia ? { ...j.ia, ensayo: j.ensayo } : null;
  } catch (err) {
    const falta = 2500 - (performance.now() - t0);
    if (falta > 0) await espera(falta);
    a = crearLocal(pedido.gustos, pedido.tema, detalles); info = { sinIA: true, motivo: err.message };
  }
  E.ficha = a; E.mundo = null; E.fases = a.fases; E.nivel = 0;
  await nacimientoListo(a);           // espera a que el estudiante rompa el huevo y toque «Conocer»
  mostrarHuevo(false); E.creando = false;
  marcarMundo(); teñir();
  estrella.vestir(look()); estrella.saltar();
  decir(a.saludo, 'feliz');
  pintarFicha(info); pintarTodo();
  verPaso('form'); nacer.disabled = false; $('#btnSaltar').disabled = false;
  $('#btnCrear').textContent = 'Crear otro';
}

/* ---------- Nacimiento en pantalla completa: hay que golpear el huevo ---------- */
const NAC = { el: $('#nacimiento'), listo: false, golpes: 0, mini: null, fin: null, pasos: 0, aprendin: null };
const GOLPES = 3;
function abrirNacimiento() {
  const n = NAC; clearInterval(n.pasos);
  n.listo = false; n.golpes = 0; n.mini?.destruir(); n.mini = null;
  n.el.className = 'nacimiento'; n.el.dataset.golpes = '0'; n.el.hidden = false;
  $('#nacTitulo').textContent = 'Tu aprendín se está formando…';
  $('#nacListo').hidden = true; $('#nacAprendin').replaceChildren();
  let i = 0; $('#nacSub').textContent = PASOS[0];
  n.pasos = setInterval(() => { i = Math.min(i + 1, PASOS.length - 1); $('#nacSub').textContent = PASOS[i]; }, 2600);
  pintarGolpes(); $('#nacHuevo').focus();
}
function pintarGolpes() { $('#nacGolpes').querySelectorAll('i').forEach((el, i) => el.classList.toggle('dado', i < NAC.golpes)); }
function nacimientoListo(a) {
  const n = NAC; clearInterval(n.pasos);
  n.listo = true; n.aprendin = a; n.el.classList.add('listo');
  $('#nacTitulo').textContent = '¡Ya está listo para nacer!';
  $('#nacSub').textContent = `Golpea el huevo ${GOLPES} veces para que salga.`;
  return new Promise(ok => { n.fin = ok; });
}
function golpe(clase) { const el = NAC.el; el.classList.remove('golpe', 'golpe-flojo'); void el.offsetWidth; el.classList.add(clase); }
$('#nacHuevo').addEventListener('click', () => {
  const n = NAC;
  if (n.el.classList.contains('abierto')) return;
  if (!n.listo) { golpe('golpe-flojo'); $('#nacSub').textContent = 'Todavía se está formando… espera un poquito.'; return; }
  n.golpes++; n.el.dataset.golpes = String(n.golpes); pintarGolpes(); golpe('golpe');
  const faltan = GOLPES - n.golpes;
  if (faltan > 0) { $('#nacSub').textContent = faltan === 1 ? '¡Uno más!' : `¡Se está rompiendo! Faltan ${faltan}.`; return; }
  romperHuevo();
});
async function romperHuevo() {
  const n = NAC, a = n.aprendin;
  n.el.classList.add('abierto');
  n.mini = crearAprendin({ look: a.fases[0].look, emocion: 'emocionado' });
  $('#nacAprendin').append(n.mini.el);
  $('#nacTitulo').textContent = `¡Nació ${a.nombre}!`;
  $('#nacSub').textContent = a.saludo;
  await espera(RM ? 0 : 650); n.mini.entender();
  const btn = $('#nacListo'); btn.textContent = `Conocer a ${a.nombre}`; btn.hidden = false; btn.focus();
}
function cerrarNacimiento() {
  const n = NAC; if (!n.el.classList.contains('abierto')) return;
  n.el.hidden = true; n.mini?.destruir(); n.mini = null;
  n.fin?.(); n.fin = null;
}
$('#nacListo').addEventListener('click', cerrarNacimiento);
NAC.el.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarNacimiento();
  if (e.key === 'Tab') { // el foco no sale del diálogo
    const f = [...NAC.el.querySelectorAll('button:not([hidden])')]; if (!f.length) return;
    const i = f.indexOf(document.activeElement), j = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length;
    e.preventDefault(); f[j].focus();
  }
});

function pintarFicha(info) {
  const a = E.ficha, caja = $('#ficha');
  if (!a) { caja.hidden = true; return; }
  const origen = info?.sinIA ? `Armado sin IA, con el catálogo${info.motivo && info.motivo !== 'sin IA' ? ` (la IA falló: ${info.motivo})` : ''}.`
    : info ? `Creado por ${info.modelo} en ${info.segundos} s${info.ensayo ? ' (ensayo guardado)' : ''}.` : '';
  caja.replaceChildren(
    h('div', { class: 'ficha-cab' }, miniSvg(a.fases[a.fases.length - 1].look, 'orgulloso'), h('div', {}, h('b', {}, a.nombre), h('span', {}, `viene ${a.de}`))),
    h('dl', {},
      a.inspiracion ? [h('dt', {}, 'Inspirado en'), h('dd', {}, a.inspiracion)] : null,
      h('dt', {}, 'Su misión'), h('dd', {}, a.mision),
      a.personalidad ? [h('dt', {}, 'Cómo es'), h('dd', {}, a.personalidad)] : null,
      h('dt', {}, `Lo que le vas a enseñar: ${a.tema}`),
      h('dd', {}, h('ol', { class: 'pasos' }, a.fases.slice(1).map((f, i) => h('li', {}, h('button', { class: 'paso', type: 'button', onclick: () => cambiarFase(i + 1) }, h('span', { class: 'paso-fase' }, f.titulo), f.concepto)))))
    ),
    h('p', { class: 'nota' }, origen)
  );
  caja.hidden = false;
}

/* ---------- Mundos listos ---------- */
const cajaMundos = $('#mundos');
for (const m of MUNDOS) {
  const mini = crearAprendin({ look: m.look, emocion: 'neutral' });
  cajaMundos.append(h('button', { class: 'mundo', type: 'button', 'aria-pressed': m === E.mundo ? 'true' : 'false', 'data-mundo': m.id, onclick: () => elegirMundo(m), onmouseenter: () => mini.sentir('feliz'), onmouseleave: () => mini.sentir('neutral'), onfocus: () => mini.sentir('feliz'), onblur: () => mini.sentir('neutral') },
    mini.el, h('span', { class: 'mundo-nombre' }, m.nombre), h('span', { class: 'mundo-quien' }, m.look.nombre)));
}
function marcarMundo() { cajaMundos.querySelectorAll('.mundo').forEach(b => b.setAttribute('aria-pressed', !!E.mundo && b.dataset.mundo === E.mundo.id)); }
function elegirMundo(m) {
  E.mundo = m; E.ficha = null; E.fases = fasesDesdeLook(m.look);
  marcarMundo(); pintarFicha(); teñir();
  estrella.evolucionar(look());
  decir(`¡Hola! Soy ${m.look.nombre} y vengo ${m.de}. Todavía no sé casi nada… ¿me enseñas?`, 'feliz');
  pintarTodo();
}

/* ---------- Editor ---------- */
// Forma, color y rasgos cambian en todas las fases. Las piezas cambian en esta fase y en las siguientes.
function editarTodas(fn) { E.fases.forEach(f => { fn(f.look); f.look = normalizarLook(f.look); }); aplicar(); }
function editarDesdeAqui(fn) { for (let i = E.nivel; i < E.fases.length; i++) { fn(E.fases[i].look); E.fases[i].look = normalizarLook(E.fases[i].look); } aplicar(false); }
function aplicar(salto = true) { E.mundo = null; marcarMundo(); estrella.vestir(look()); if (salto) estrella.saltar(); teñir(); pintarTodo(); }

function grupoChips(sel, opciones, actual, alElegir) {
  const caja = $(sel); caja.replaceChildren();
  for (const [id, nombre] of Object.entries(opciones)) caja.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': id === actual ? 'true' : 'false', onclick: () => alElegir(id) }, nombre));
}
function pintarFormas() {
  const caja = $('#formas'); caja.replaceChildren();
  for (const [id, F] of Object.entries(FORMAS)) caja.append(h('button', { class: 'forma', type: 'button', 'aria-pressed': look().forma === id ? 'true' : 'false', onclick: () => editarTodas(l => { l.forma = id; }) }, miniSvg({ forma: id, color: look().color, rasgos: look().rasgos }), F.nombre));
}
function pintarColores() {
  const caja = $('#colores'); caja.replaceChildren(); const actual = color(look().color);
  for (const [nombre, hex] of Object.entries(PALETA)) caja.append(h('button', { class: 'muestra', type: 'button', style: `--c:${hex}`, 'aria-label': nombre, title: nombre, 'aria-pressed': actual === hex ? 'true' : 'false', onclick: () => editarTodas(l => { l.color = hex; }) }));
}
function pintarRasgos() {
  const r = look().rasgos;
  grupoChips('#ojos', Object.fromEntries(Object.entries(OJOS).map(([k, v]) => [k, v.nombre])), r.ojos, id => editarTodas(l => { l.rasgos.ojos = id; }));
  grupoChips('#bocas', BOCAS, r.boca, id => editarTodas(l => { l.rasgos.boca = id; }));
  grupoChips('#marcas', { ...MARCAS, panza: 'Panza clara' }, r.marcas, id => editarTodas(l => { if (id === 'panza') l.rasgos.panza = !l.rasgos.panza; else l.rasgos.marcas = id; }));
  $('#marcas').querySelector('button:last-child').setAttribute('aria-pressed', r.panza ? 'true' : 'false');
  $('#notaEditor').textContent = `Forma, color y rasgos cambian en todas las fases. Las piezas se agregan desde la fase que estás viendo (${E.fases[E.nivel].titulo}) en adelante.`;
}
function pintarZonas() {
  const caja = $('#zonas'); caja.replaceChildren();
  for (const z of ZONAS) {
    const b = h('button', { class: 'zona', type: 'button', role: 'tab', id: `zona-${z}`, 'aria-selected': z === E.zona ? 'true' : 'false', 'aria-controls': 'piezas', tabindex: z === E.zona ? 0 : -1, onclick: () => { E.zona = z; pintarZonas(); pintarPiezas(); pintarColoresPieza(); } }, NOMBRES_SLOT[z]);
    if (look().piezas[z]) b.append(h('span', { class: 'punto', 'aria-hidden': 'true' }));
    caja.append(b);
  }
  $('#piezas').setAttribute('aria-labelledby', `zona-${E.zona}`);
}
$('#zonas').addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
  E.zona = ZONAS[(ZONAS.indexOf(E.zona) + d + ZONAS.length) % ZONAS.length];
  pintarZonas(); pintarPiezas(); pintarColoresPieza(); $(`#zona-${E.zona}`).focus();
});
function pintarPiezas() {
  const caja = $('#piezas'), z = E.zona, actual = look().piezas[z]?.id; caja.replaceChildren();
  const conPieza = id => { const l = clonar(look()); if (id) l.piezas[z] = { id }; else delete l.piezas[z]; return l; };
  caja.append(h('button', { class: 'pieza pieza-nada', type: 'button', 'aria-pressed': !actual ? 'true' : 'false', onclick: () => editarDesdeAqui(l => { delete l.piezas[z]; }) }, h('span', { class: 'mini', 'aria-hidden': 'true' }, '∅'), 'Nada'));
  for (const [id, p] of Object.entries(PIEZAS[z])) caja.append(h('button', { class: 'pieza', type: 'button', title: `Sirve para: ${p.desc}`, 'aria-pressed': actual === id ? 'true' : 'false', onclick: () => editarDesdeAqui(l => { l.piezas[z] = { id, colores: [...p.c] }; }) }, miniSvg(conPieza(id)), p.nombre));
}
function pintarColoresPieza() {
  const caja = $('#coloresPieza'), z = E.zona, pz = look().piezas[z]; caja.replaceChildren();
  $('#campoColoresPieza').hidden = !pz;
  if (!pz) return;
  [0, 1].forEach(i => {
    const fila = h('div', { class: 'muestras chicas', role: 'group', 'aria-label': `Color ${i + 1} de la pieza` });
    for (const [nombre, hex] of Object.entries({ cuerpo: null, ...PALETA })) {
      const es = nombre === 'cuerpo' ? pz.colores[i] === 'cuerpo' : pz.colores[i] === hex;
      fila.append(h('button', { class: 'muestra', type: 'button', style: `--c:${hex || color(look().color)}`, title: nombre === 'cuerpo' ? 'Color del cuerpo' : nombre, 'aria-label': nombre === 'cuerpo' ? 'color del cuerpo' : nombre, 'aria-pressed': es ? 'true' : 'false',
        onclick: () => editarDesdeAqui(l => { if (l.piezas[z]?.id === pz.id) l.piezas[z].colores[i] = nombre === 'cuerpo' ? 'cuerpo' : hex; }) }));
    }
    caja.append(h('div', { class: 'fila' }, h('span', {}, String(i + 1)), fila));
  });
}
function pintarJSON() { $('#json').textContent = JSON.stringify(E.ficha || { fases: E.fases.map(f => f.look) }, null, 2); }
function pintarTodo() { pintarPlaca(); pintarFases(); pintarFormas(); pintarColores(); pintarRasgos(); pintarZonas(); pintarPiezas(); pintarColoresPieza(); pintarJSON(); }

/* ---------- Sorpréndeme ---------- */
$('#sorpresa').addEventListener('click', () => {
  const prob = { cabeza: .6, pelo: .35, cara: .4, cuello: .35, cuerpo: .5, espalda: .35, mano: .85, aura: .45 };
  const piezas = {};
  for (const z of ZONAS) if (Math.random() < prob[z]) piezas[z] = azar(Object.keys(PIEZAS[z]));
  if (piezas.cabeza && piezas.pelo && Math.random() < .6) delete piezas.pelo;
  const l = { nombre: azar(NOMBRES), forma: azar(Object.keys(FORMAS)), color: azar(Object.keys(PALETA).filter(c => c !== 'carbon')), numero: 1 + Math.floor(Math.random() * 30), piezas,
    rasgos: { ojos: azar(Object.keys(OJOS)), boca: azar(Object.keys(BOCAS)), marcas: azar(Object.keys(MARCAS)), panza: Math.random() < .4 } };
  E.mundo = null; E.ficha = null; E.fases = fasesDesdeLook(l); E.nivel = 4;
  marcarMundo(); pintarFicha(); teñir();
  estrella.evolucionar(look());
  decir(`¡Soy ${l.nombre}! ¿Qué me vas a enseñar?`, 'emocionado');
  pintarTodo();
});

/* ---------- Inicio ---------- */
teñir(); marcarEmocion(); pintarTodo(); estadoIA();
setTimeout(() => { if (!E.creando && !E.ficha) decir(`¡Hola! Soy ${look().nombre} y vengo ${E.mundo.de}. Todavía no sé casi nada… ¿me enseñas?`, 'feliz'); }, 400);
