// Galería de demostración: muestra todos los diseños y sus 5 fases desde el inicio.
import { crearAprendin, svgAprendin, EMOCIONES, EMO_IDS } from './aprendin.js';
import { DEMO } from './demo-aprendin.js';
import { DEMO_DISENOS } from './demo-disenos.js';
import { MUNDOS } from './mundos.js';
import { fasesDesdeLook } from './creador.js';
import { svgHuevo, huevoLocal } from './huevo.js';
import { guardarAprendin, listarAprendines } from './guardado.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const marca = crearAprendin({ look: { forma: 'bollo', color: 'coral', rasgos: { ojos: 'grandes' }, piezas: { pelo: 'mechon' } }, emocion: 'feliz', seguir: false });
$('#marcaAv').append(marca.el);

const ETIQUETA_CAT = {
  dibujo: 'Dibujo IA',
  piezas: 'Piezas IA',
  mundo: 'Mundo base',
  propios: 'Tuyo'
};

function normalizarDesdeMundo(m) {
  const fases = fasesDesdeLook(m.look).map((f, i) => ({
    ...f,
    concepto: i === 0 ? '' : `Paso ${i} de ${m.nombre}`
  }));
  return {
    id: `mundo-${m.id}`,
    nombre: m.look.nombre,
    inspiracion: `${m.nombre} (catálogo)`,
    mundo: m.nombre,
    de: m.de,
    tema: 'Fracciones',
    gustos: m.nombre.toLowerCase(),
    personalidad: `Curioso y alegre, viene ${m.de}.`,
    mision: `${m.look.nombre} quiere aprender paso a paso con ejemplos ${m.de}.`,
    saludo: `¡Hola! Soy ${m.look.nombre} y vengo ${m.de}. ¿Me enseñas?`,
    modo: 'piezas',
    huevo: huevoLocal(m.nombre),
    fases,
    _categoria: 'mundo'
  };
}

function catalogoCompleto() {
  const propios = listarAprendines().map(a => ({ ...a, _categoria: 'propios' }));
  const idsPropios = new Set(propios.map(a => a.id));
  const ia = [DEMO, ...DEMO_DISENOS]
    .filter(a => !idsPropios.has(a.id))
    .map(a => {
      const esDibujo = a.modo === 'dibujo' || a.fases?.some(f => f.look?.dibujo && Object.values(f.look.dibujo).some(Boolean));
      return {
        ...a,
        huevo: a.huevo || huevoLocal(a.inspiracion || a.gustos || a.mundo),
        _categoria: esDibujo ? 'dibujo' : 'piezas'
      };
    });
  const mundos = MUNDOS.map(normalizarDesdeMundo);
  return [...propios, ...ia, ...mundos];
}

let TODOS = catalogoCompleto();
let filtroCat = 'todos';
let textoBusq = '';
let emocionActual = 'feliz';

function pintarResumen() {
  const dibujo = TODOS.filter(d => d._categoria === 'dibujo').length;
  const piezas = TODOS.filter(d => d._categoria === 'piezas').length;
  const mundos = TODOS.filter(d => d._categoria === 'mundo').length;
  const propios = TODOS.filter(d => d._categoria === 'propios').length;
  $('#resumenDisenos').innerHTML = [
    `<span class="dis-stat"><b>${TODOS.length}</b> diseños</span>`,
    `<span class="dis-stat"><b>${TODOS.length * 5}</b> fases</span>`,
    `<span class="dis-stat"><b>${dibujo}</b> dibujo IA</span>`,
    `<span class="dis-stat"><b>${piezas}</b> piezas IA</span>`,
    `<span class="dis-stat"><b>${mundos}</b> mundos</span>`,
    ...(propios ? [`<span class="dis-stat"><b>${propios}</b> tuyos</span>`] : [])
  ].join('');
}

function pintarEmociones() {
  const caja = $('#emocionesDemo');
  caja.replaceChildren();
  for (const id of EMO_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = EMOCIONES[id].nombre;
    b.setAttribute('aria-pressed', String(id === emocionActual));
    b.addEventListener('click', () => {
      emocionActual = id;
      caja.querySelectorAll('.chip').forEach((x, idx) => x.setAttribute('aria-pressed', String(EMO_IDS[idx] === emocionActual)));
      pintarLista();
    });
    caja.append(b);
  }
}

function clonarParaAbrir(item) {
  const copia = JSON.parse(JSON.stringify(item));
  delete copia._categoria;
  if (!copia.id) copia.id = `demo-${Date.now().toString(36)}`;
  guardarAprendin(copia, { activar: true });
  return copia.id;
}

function coincidencias(item) {
  if (filtroCat !== 'todos' && item._categoria !== filtroCat) return false;
  if (!textoBusq) return true;
  const aguja = textoBusq.toLowerCase();
  const texto = [item.nombre, item.inspiracion, item.mundo, item.tema, item.gustos, ...(item.fases || []).map(f => `${f.titulo} ${f.concepto || ''}`)].join(' ').toLowerCase();
  return texto.includes(aguja);
}

function tarjetaDiseno(item) {
  const card = document.createElement('article');
  card.className = 'tarjeta dis-card';
  const cat = item._categoria;
  const sub = [item.inspiracion || item.mundo, item.tema ? `Tema: ${item.tema}` : ''].filter(Boolean).join(' · ');

  card.innerHTML = `
    <header class="dis-card-cab">
      <div class="dis-id">
        <div class="dis-huevo" title="${esc(item.huevo?.nombre || 'Huevo')}">${svgHuevo(item.huevo || huevoLocal(item.mundo || item.nombre))}</div>
        <div class="dis-meta">
          <div class="dis-tit-fila">
            <h2>${esc(item.nombre)}</h2>
            <span class="dis-badge dis-badge-${cat}">${esc(ETIQUETA_CAT[cat] || cat)}</span>
          </div>
          <p class="dis-sub">${esc(sub)}</p>
        </div>
      </div>
      <div class="dis-acciones">
        <button class="btn" type="button" data-act="taller">Ver en taller</button>
        <button class="btn btn-fuerte" type="button" data-act="clase">Probar en clase →</button>
      </div>
    </header>
    <div class="dis-fases"></div>
  `;

  const grid = card.querySelector('.dis-fases');
  (item.fases || []).forEach((f, idx) => {
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'dis-fase' + (idx === item.fases.length - 1 ? ' es-final' : '');
    box.title = f.concepto ? `Fase ${idx}: ${f.titulo} — ${f.concepto}` : `Fase ${idx}: ${f.titulo}`;
    box.innerHTML = `
      <span class="dis-fase-num">Fase ${idx}</span>
      <div class="dis-svg">${svgAprendin(f.look, { emocion: emocionActual })}</div>
      <h3 class="dis-fase-tit">${esc(f.titulo)}</h3>
      <p class="dis-fase-con">${esc(idx === 0 ? 'Recién nacido' : (f.concepto || 'Paso completado'))}</p>
    `;
    box.addEventListener('click', () => {
      box.classList.remove('salta');
      void box.offsetWidth;
      box.classList.add('salta');
    });
    grid.append(box);
  });

  card.querySelector('[data-act="taller"]').addEventListener('click', () => {
    clonarParaAbrir(item);
    location.href = 'taller.html';
  });
  card.querySelector('[data-act="clase"]').addEventListener('click', () => {
    const id = clonarParaAbrir(item);
    location.href = `clase.html?aprendin=${encodeURIComponent(id)}&demo=fases`;
  });

  return card;
}

function pintarLista() {
  const caja = $('#listaDisenos');
  const visibles = TODOS.filter(coincidencias);
  if (!visibles.length) {
    caja.innerHTML = '<div class="tarjeta dis-vacio"><p class="nota">No hay diseños que coincidan con ese filtro o búsqueda.</p></div>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const item of visibles) frag.append(tarjetaDiseno(item));
  caja.replaceChildren(frag);
}

$('#filtros').addEventListener('click', e => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  filtroCat = btn.dataset.cat;
  $('#filtros').querySelectorAll('[data-cat]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
  pintarLista();
});

$('#buscarDiseno').addEventListener('input', e => {
  textoBusq = e.target.value.trim();
  pintarLista();
});

pintarResumen();
pintarEmociones();
pintarLista();
