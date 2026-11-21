// Taller de aprendines: elegir mundo, probar niveles, emociones y acciones, y armar el look pieza por pieza.
import { crearAprendin, svgAprendin, FORMAS, EMOCIONES, EMO_IDS, normalizarLook } from './aprendin.js';
import { PIEZAS, NOMBRES_SLOT, NIVELES, NOMBRES_NIVEL } from './piezas.js';
import { PALETA, color } from './color.js';
import { MUNDOS, NOMBRES } from './mundos.js';

const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...hijos.flat().filter(x => x != null));
  return el;
}
const clonar = x => JSON.parse(JSON.stringify(x));
const azar = xs => xs[Math.floor(Math.random() * xs.length)];
const ZONAS = ['cabeza', 'pelo', 'cara', 'cuello', 'cuerpo', 'espalda', 'mano', 'aura'];
const CORTO = ['Nuevo', 'Aprendiz', 'Practicante', 'Experto', 'Maestro'];
const nivelDeZona = z => NIVELES.findIndex(zs => zs.includes(z));

const E = { mundo: MUNDOS[0], look: clonar(MUNDOS[0].look), nivel: 4, zona: 'cabeza', emocion: 'feliz' };

/* ---------- Aprendín principal y marca ---------- */
const estrella = crearAprendin({ look: E.look, nivel: E.nivel, emocion: E.emocion });
$('#estrella').append(estrella.el);
const marca = crearAprendin({ look: { forma: 'bollo', color: 'coral', piezas: { pelo: 'mechon' } }, emocion: 'feliz' });
$('#marcaAv').append(marca.el);

/* ---------- Globo de diálogo ---------- */
let tipeo = 0, callar = 0;
function decir(texto, emocion) {
  if (emocion) { E.emocion = emocion; estrella.sentir(emocion); marcarEmocion(); }
  const globo = $('#globo');
  clearInterval(tipeo); clearTimeout(callar);
  $('#dicho').textContent = texto;
  if (RM) { globo.textContent = texto; return; }
  globo.textContent = ''; estrella.hablar(true);
  let i = 0;
  tipeo = setInterval(() => {
    i += 2; globo.textContent = texto.slice(0, i);
    if (i >= texto.length) { clearInterval(tipeo); callar = setTimeout(() => estrella.hablar(false), 120); }
  }, 30);
}

/* ---------- Placa ---------- */
const inputNombre = $('#nombre');
inputNombre.addEventListener('input', () => { E.look.nombre = inputNombre.value.trim() || 'Aprendín'; estrella.vestir(E.look, E.nivel); pintarJSON(); });
function pintarPlaca() { inputNombre.value = E.look.nombre || ''; $('#placaMundo').textContent = E.mundo ? `viene ${E.mundo.de}` : 'tu propio aprendín'; }

/* ---------- Niveles ---------- */
const cajaNiveles = $('#niveles');
NOMBRES_NIVEL.forEach((nombre, nv) => cajaNiveles.append(h('button', { class: 'nivel', type: 'button', role: 'radio', 'aria-checked': nv === E.nivel ? 'true' : 'false', 'aria-label': `Nivel ${nv}: ${nombre}`, 'data-nv': nv, onclick: () => cambiarNivel(nv) }, h('b', {}, String(nv)), CORTO[nv])));
cajaNiveles.addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
  e.preventDefault(); const nv = Math.max(0, Math.min(4, E.nivel + d)); cambiarNivel(nv); cajaNiveles.querySelector(`[data-nv="${nv}"]`).focus();
});
function marcarNivel() {
  cajaNiveles.querySelectorAll('.nivel').forEach(b => { const si = +b.dataset.nv === E.nivel; b.setAttribute('aria-checked', si); b.tabIndex = si ? 0 : -1; });
  $('#nivelNombre').textContent = NOMBRES_NIVEL[E.nivel];
}
function cambiarNivel(nv) {
  if (nv === E.nivel) return;
  const sube = nv > E.nivel; E.nivel = nv; marcarNivel();
  if (sube) { estrella.evolucionar(E.look, nv); decir(nv === 4 ? '¡Soy Maestro! Ahora sí podría enseñarle a otro.' : `¡Subí a ${NOMBRES_NIVEL[nv]}! Mira lo que gané.`, 'orgulloso'); }
  else { estrella.nivel(nv); decir(nv === 0 ? 'Recién llego. No sé casi nada… ¿me enseñas?' : `Volví a ${NOMBRES_NIVEL[nv]}.`, 'neutral'); }
}

/* ---------- Acciones y emociones ---------- */
const ACCIONES = [
  ['Salude', () => { estrella.saludar(); decir(`¡Hola! Soy ${E.look.nombre || 'tu aprendín'}.`, 'feliz'); }],
  ['Salte', () => estrella.saltar()],
  ['Entienda', () => { estrella.entender(); decir(EMOCIONES.eureka.frase, null); E.emocion = 'eureka'; marcarEmocion(); }],
  ['Se equivoque', () => { estrella.equivocarse(); decir(EMOCIONES.avergonzado.frase, null); E.emocion = 'avergonzado'; marcarEmocion(); }]
];
ACCIONES.forEach(([t, fn], i) => $('#acciones').append(h('button', { class: 'btn' + (i === 2 ? ' btn-fuerte' : ''), type: 'button', onclick: fn }, t)));
const cajaEmo = $('#emociones');
EMO_IDS.forEach(id => cajaEmo.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', 'data-emo': id, onclick: () => decir(EMOCIONES[id].frase, id) }, EMOCIONES[id].nombre)));
function marcarEmocion() { cajaEmo.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.emo === E.emocion)); }

/* ---------- Mundos ---------- */
const cajaMundos = $('#mundos'), minis = [];
for (const m of MUNDOS) {
  const mini = crearAprendin({ look: m.look, emocion: 'neutral' });
  const b = h('button', { class: 'mundo', type: 'button', 'aria-pressed': m === E.mundo ? 'true' : 'false', 'data-mundo': m.id, onclick: () => elegirMundo(m), onmouseenter: () => mini.sentir('feliz'), onmouseleave: () => mini.sentir('neutral'), onfocus: () => mini.sentir('feliz'), onblur: () => mini.sentir('neutral') },
    mini.el, h('span', { class: 'mundo-nombre' }, m.nombre), h('span', { class: 'mundo-quien' }, m.look.nombre));
  minis.push(mini); cajaMundos.append(b);
}
function marcarMundo() { cajaMundos.querySelectorAll('.mundo').forEach(b => b.setAttribute('aria-pressed', !!E.mundo && b.dataset.mundo === E.mundo.id)); }
function elegirMundo(m) {
  E.mundo = m; E.look = clonar(m.look); marcarMundo(); pintarPlaca();
  estrella.evolucionar(E.look, E.nivel);
  decir(`¡Hola! Soy ${m.look.nombre} y vengo ${m.de}. Todavía no sé casi nada… ¿me enseñas?`, 'feliz');
  pintarEditor();
}

/* ---------- Editor ---------- */
const miniSvg = (look, emocion = 'neutral') => h('span', { class: 'mini', 'aria-hidden': 'true', html: svgAprendin(look, { emocion }) });

function pintarFormas() {
  const caja = $('#formas'); caja.replaceChildren();
  for (const [id, F] of Object.entries(FORMAS)) caja.append(h('button', { class: 'forma', type: 'button', 'aria-pressed': E.look.forma === id ? 'true' : 'false', onclick: () => { E.look.forma = id; aplicar(); } }, miniSvg({ forma: id, color: E.look.color }), F.nombre));
}
function pintarColores() {
  const caja = $('#colores'); caja.replaceChildren(); const actual = color(E.look.color);
  for (const [nombre, hex] of Object.entries(PALETA)) caja.append(h('button', { class: 'muestra', type: 'button', style: `--c:${hex}`, 'aria-label': nombre, title: nombre, 'aria-pressed': actual === hex ? 'true' : 'false', onclick: () => { E.look.color = nombre; aplicar(); } }));
}
function pintarZonas() {
  const caja = $('#zonas'); caja.replaceChildren();
  for (const z of ZONAS) {
    const b = h('button', { class: 'zona', type: 'button', role: 'tab', id: `zona-${z}`, 'aria-selected': z === E.zona ? 'true' : 'false', 'aria-controls': 'piezas', tabindex: z === E.zona ? 0 : -1, onclick: () => { E.zona = z; pintarZonas(); pintarPiezas(); pintarColoresPieza(); } }, NOMBRES_SLOT[z]);
    if (E.look.piezas?.[z]) b.append(h('span', { class: 'punto', 'aria-hidden': 'true' }));
    caja.append(b);
  }
  $('#piezas').setAttribute('aria-labelledby', `zona-${E.zona}`);
}
$('#zonas').addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
  const i = (ZONAS.indexOf(E.zona) + d + ZONAS.length) % ZONAS.length; E.zona = ZONAS[i];
  pintarZonas(); pintarPiezas(); pintarColoresPieza(); $(`#zona-${E.zona}`).focus();
});
function idDe(z) { const x = E.look.piezas?.[z]; return typeof x === 'string' ? x : x?.id; }
function pintarPiezas() {
  const caja = $('#piezas'), z = E.zona, actual = idDe(z); caja.replaceChildren();
  const conPieza = id => { const l = clonar(E.look); l.piezas = { ...(l.piezas || {}) }; if (id) l.piezas[z] = id; else delete l.piezas[z]; return l; };
  caja.append(h('button', { class: 'pieza pieza-nada', type: 'button', 'aria-pressed': !actual ? 'true' : 'false', onclick: () => ponerPieza(null) }, h('span', { class: 'mini', 'aria-hidden': 'true' }, '∅'), 'Nada'));
  for (const [id, p] of Object.entries(PIEZAS[z])) caja.append(h('button', { class: 'pieza', type: 'button', title: `Sirve para: ${p.desc}`, 'aria-pressed': actual === id ? 'true' : 'false', onclick: () => ponerPieza(id) }, miniSvg(conPieza(id)), p.nombre));
}
function ponerPieza(id) {
  E.look.piezas = { ...(E.look.piezas || {}) };
  if (id) E.look.piezas[E.zona] = { id, colores: [...PIEZAS[E.zona][id].c] };
  else delete E.look.piezas[E.zona];
  E.mundo = null; marcarMundo(); pintarPlaca();
  const necesita = nivelDeZona(E.zona);
  if (id && E.nivel < necesita) { E.nivel = 4; marcarNivel(); }
  aplicar(false);
}
function pintarColoresPieza() {
  const caja = $('#coloresPieza'), z = E.zona, x = E.look.piezas?.[z]; caja.replaceChildren();
  $('#campoColoresPieza').hidden = !x;
  if (!x) return;
  const pz = typeof x === 'string' ? { id: x, colores: [...PIEZAS[z][x].c] } : x;
  [0, 1].forEach(i => {
    const fila = h('div', { class: 'muestras chicas', role: 'group', 'aria-label': `Color ${i + 1} de la pieza` });
    const opciones = { cuerpo: null, ...PALETA };
    for (const [nombre, hex] of Object.entries(opciones)) {
      const actual = pz.colores?.[i] === 'cuerpo' ? 'cuerpo' : color(pz.colores?.[i] || '', '');
      const es = nombre === 'cuerpo' ? actual === 'cuerpo' : actual === hex;
      fila.append(h('button', { class: 'muestra', type: 'button', style: `--c:${hex || color(E.look.color)}`, title: nombre === 'cuerpo' ? 'Color del cuerpo' : nombre, 'aria-label': nombre === 'cuerpo' ? 'color del cuerpo' : nombre, 'aria-pressed': es ? 'true' : 'false',
        onclick: () => { const c = [...(pz.colores || PIEZAS[z][pz.id].c)]; c[i] = nombre; E.look.piezas[z] = { id: pz.id, colores: c }; aplicar(false); } }));
    }
    caja.append(h('div', { class: 'fila' }, h('span', {}, String(i + 1)), fila));
  });
}
function pintarJSON() { $('#json').textContent = JSON.stringify(normalizarLook(E.look), null, 2); }
function pintarEditor() { pintarFormas(); pintarColores(); pintarZonas(); pintarPiezas(); pintarColoresPieza(); pintarJSON(); }
function aplicar(salto = true) {
  estrella.vestir(E.look, E.nivel); if (salto) estrella.saltar();
  pintarEditor();
}

/* ---------- Sorpréndeme ---------- */
$('#sorpresa').addEventListener('click', () => {
  const prob = { cabeza: .6, pelo: .35, cara: .4, cuello: .35, cuerpo: .5, espalda: .35, mano: .85, aura: .45 };
  const piezas = {};
  for (const z of ZONAS) if (Math.random() < prob[z]) piezas[z] = azar(Object.keys(PIEZAS[z]));
  if (piezas.cabeza && piezas.pelo && Math.random() < .6) delete piezas.pelo;
  E.mundo = null; marcarMundo();
  E.look = { nombre: azar(NOMBRES), forma: azar(Object.keys(FORMAS)), color: azar(Object.keys(PALETA).filter(c => c !== 'carbon')), numero: 1 + Math.floor(Math.random() * 30), piezas };
  if (E.nivel < 4) { E.nivel = 4; marcarNivel(); }
  pintarPlaca(); estrella.evolucionar(E.look, E.nivel);
  decir(`¡Soy ${E.look.nombre}! ¿Qué me vas a enseñar?`, 'emocionado');
  pintarEditor();
});

/* ---------- Inicio ---------- */
marcarNivel(); marcarEmocion(); pintarPlaca(); pintarEditor();
setTimeout(() => decir(`¡Hola! Soy ${E.look.nombre} y vengo ${E.mundo.de}. Todavía no sé casi nada… ¿me enseñas?`, 'feliz'), 400);
