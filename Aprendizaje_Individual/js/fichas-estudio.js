// Fichas de inicio / estudio adaptativo: genera fichas visuales animadas según tema, gustos y nivel,
// y adapta cada nueva ficha según las reacciones del estudiante.
import { limpiarFicha, htmlFicha, TIPOS } from './fichas.js';
import { activarFichas, animar } from './fichas-dom.js';
import { EJEMPLOS } from './fichas-ejemplo.js';
import { svgAprendin } from './aprendin.js';
import { MUNDOS } from './mundos.js';
import { tonos } from './color.js';
import { cargarAprendin, cargarClase } from './guardado.js';
import { cargarEstudio, guardarEstudio, solicitarFichaInicio, renderizarFichaEstudio, historialDe, registrarEventoVisual, calcularCalibracion, renderizarPanelCalibracion } from './fichas-apoyo.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SUG_TEMAS = ['fracciones', 'porcentajes', 'ecuaciones lineales', 'la fotosíntesis', 'números negativos', 'el ciclo del agua'];
const SUG_GUSTOS = ['fútbol', 'anime', 'videojuegos', 'cocinar', 'música', 'el espacio'];
const NIVEL_NOMBRE = { cero: 'Inicio desde cero', algo: 'Nivel intermedio', bastante: 'Nivel avanzado' };

let ia = false, cargando = false;
const A = cargarAprendin();
const marca = $('#marcaAv');
if (marca) marca.innerHTML = svgAprendin({ forma: 'bollo', color: 'coral', rasgos: { ojos: 'grandes' }, piezas: { pelo: 'mechon' } }, { emocion: 'feliz' });

let S = cargarEstudio() || { activo: false, tema: '', gustos: '', nivel: 'algo', usaAprendin: false, fichas: [] };

async function comprobarIA() {
  try { const r = await fetch('/api/estado', { cache: 'no-store' }); const j = r.ok ? await r.json() : null; ia = !!j?.ia; } catch { ia = false; }
  const el = $('#estadoIA');
  el.className = 'estado-ia' + (ia ? ' si' : '');
  el.textContent = ia ? 'IA conectada' : 'Sin IA: fichas de respaldo';
}

/* ---------- Sugerencias y enlace con el aprendín ---------- */
function pintarChips(caja, input, lista, sumar) {
  lista.forEach(txt => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip chip-sug'; b.textContent = txt;
    b.addEventListener('click', () => {
      const v = input.value.trim();
      input.value = sumar && v ? (v.toLowerCase().includes(txt) ? v : `${v}, ${txt}`) : txt;
      input.focus();
    });
    caja.append(b);
  });
}
pintarChips($('#sugTemas'), $('#temaEstudio'), SUG_TEMAS, false);
pintarChips($('#sugGustos'), $('#gustosEstudio'), SUG_GUSTOS, true);

if (A) {
  const ban = $('#bannerAprendin');
  ban.hidden = false;
  $('#aprMini').innerHTML = svgAprendin(A.fases.at(-1).look, { emocion: 'feliz' });
  $('#aprDesc').innerHTML = `Tu aprendín <b>${esc(A.nombre)}</b> (${esc(A.tema)} · ${esc(A.mundo)})`;
  $('#btnUsarAprendin').addEventListener('click', () => {
    $('#temaEstudio').value = A.tema || '';
    $('#gustosEstudio').value = A.gustos || A.mundo || '';
    S.usaAprendin = true;
    $('#temaEstudio').focus();
  });
  if (!S.activo && !$('#temaEstudio').value) {
    $('#temaEstudio').value = A.tema || '';
    $('#gustosEstudio').value = A.gustos || A.mundo || '';
    S.usaAprendin = true;
  }
}

/* ---------- Generación adaptativa y calibración ---------- */
function pintarCalibracion() {
  const hist = historialDe(S.fichas);
  const ops = { historial: hist, alCambiar: () => pintarCalibracion() };
  renderizarPanelCalibracion($('#calibracionInicio'), { ...ops, compacto: true });
  renderizarPanelCalibracion($('#calibracionEstudio'), ops);
}

async function pedirFichaAdaptativa(reaccion, nota = '') {
  if (cargando) return;
  cargando = true;
  pintarEstadoCarga(true);
  const historial = historialDe(S.fichas);
  const { datos, fuente } = await solicitarFichaInicio({
    ia, tema: S.tema, gustos: S.gustos, nivel: S.nivel, reaccion, nota,
    aprendin: S.usaAprendin && A ? A : null, historial,
    calibracion: calcularCalibracion(historial)
  });
  if (reaccion === 'entendio') S.nivel = S.nivel === 'cero' ? 'algo' : 'bastante';
  else if (reaccion === 'duda' && S.nivel === 'bastante') S.nivel = 'algo';
  S.fichas.push({ datos, fuente, reaccionOrigen: reaccion, reaccion: null, nota });
  guardarEstudio(S);
  cargando = false;
  pintarEstadoCarga(false);
  pintarEstudio();
}

$('#formEstudio').addEventListener('submit', e => {
  e.preventDefault();
  const tema = $('#temaEstudio').value.trim(), gustos = $('#gustosEstudio').value.trim() || 'vida cotidiana';
  if (!tema || cargando) return;
  const nivel = document.querySelector('input[name="nivelEstudio"]:checked')?.value || 'algo';
  S = { activo: true, tema, gustos, nivel, usaAprendin: !!A && tema === A.tema, fichas: [] };
  guardarEstudio(S);
  pintarEstudio();
  pedirFichaAdaptativa('inicio');
});

$('#btnNuevoTema').addEventListener('click', () => {
  S.activo = false; S.fichas = []; guardarEstudio(S);
  pintarEstudio();
  $('#temaEstudio').focus();
});

function pintarEstadoCarga(si) {
  $('#estudioCargando').hidden = !si;
  $('#btnGenerar').disabled = si;
  document.querySelectorAll('.fi-reaccion-btn').forEach(b => { b.disabled = si; });
}

function pintarEstudio() {
  const act = $('#estudioActivo'), cardForm = $('#tarjetaInicio');
  act.hidden = !S.activo;
  cardForm.hidden = S.activo;
  pintarCalibracion();
  if (!S.activo) return;

  $('#estTema').textContent = S.tema;
  $('#estMundo').textContent = S.gustos;
  $('#estNivel').textContent = NIVEL_NOMBRE[S.nivel] || S.nivel;
  $('#estCuenta').textContent = `${S.fichas.length} ${S.fichas.length === 1 ? 'ficha' : 'fichas'}`;
  const tipos = [...new Set(S.fichas.map(f => f.datos.visual.tipo))];
  $('#estTipos').innerHTML = tipos.map(t => `<span class="fi-tipo-chip" title="${esc(TIPOS[t] || t)}">${esc(t)}</span>`).join('');

  const linkClase = $('#btnIrClase');
  const mismoTema = !!A && A.tema.toLowerCase() === S.tema.toLowerCase();
  linkClase.href = mismoTema ? 'clase.html' : `taller.html?tema=${encodeURIComponent(S.tema)}&gustos=${encodeURIComponent(S.gustos)}`;
  linkClase.textContent = mismoTema ? `Enseñarle a ${A.nombre} →` : 'Crear aprendín de este tema →';

  const lista = $('#estudioLista');
  lista.replaceChildren();
  const av = S.usaAprendin && A ? svgAprendin(A.fases.at(-1).look, { emocion: 'orgulloso' }) : '';
  const tono = S.usaAprendin && A ? tonos(A.fases.at(-1).look.color) : tonos('indigo');

  [...S.fichas].reverse().forEach((item, revIdx) => {
    const idx = S.fichas.length - 1 - revIdx;
    const esUltima = idx === S.fichas.length - 1;
    const wrap = document.createElement('div');
    wrap.className = 'cl-ficha' + (esUltima ? ' cl-nueva' : '');
    wrap.innerHTML = renderizarFichaEstudio(item, idx, { esUltima, gustos: S.gustos, avatar: av, tono });
    lista.append(wrap);
  });

  lista.querySelectorAll('.fi-reaccion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (cargando) return;
      const r = btn.dataset.reaccion;
      const nota = lista.querySelector('.fi-nota-duda')?.value.trim() || '';
      const ultima = S.fichas.at(-1);
      if (ultima) {
        ultima.reaccion = r;
        ultima.nota = nota;
        registrarEventoVisual(ultima.datos.visual.tipo, r);
      }
      guardarEstudio(S);
      pedirFichaAdaptativa(r, nota);
    });
  });

  activarFichas(lista);
  const primeroVis = lista.querySelector('.vis');
  if (primeroVis) animar(primeroVis);
}

/* ---------- Fichas guardadas de tu clase ---------- */
function pintarFichasClase() {
  if (!A) return;
  const clase = cargarClase(A.id);
  const listas = Object.entries(clase?.fichas || {}).filter(([, f]) => f?.estado === 'lista' && f.datos);
  if (!listas.length) return;
  const sec = $('#secClase'); sec.hidden = false;
  $('#claseTit').textContent = `Fichas de tu clase con ${A.nombre}`;
  const cont = $('#claseGaleria');
  listas.sort(([a], [b]) => Number(a) - Number(b)).forEach(([p, f]) => {
    cont.insertAdjacentHTML('beforeend', htmlFicha(limpiarFicha(f.datos), {
      numero: p, fase: A.fases[p]?.titulo || '', mundo: A.mundo,
      tono: tonos(A.fases[p]?.look?.color || 'indigo'),
      avatar: svgAprendin(A.fases[p]?.look || A.fases[0].look, { emocion: 'orgulloso' })
    }));
  });
  activarFichas(cont);
}

/* ---------- Galería de los 13 tipos de ejemplo ---------- */
const galeria = $('#galeria');
EJEMPLOS.forEach((e, i) => {
  const m = MUNDOS[i % MUNDOS.length], f = limpiarFicha(e.ficha);
  galeria.insertAdjacentHTML('beforeend', htmlFicha(f, {
    numero: (i % 4) + 1, fase: e.fase, mundo: e.mundo,
    tono: tonos(m.look.color), avatar: svgAprendin(m.look, { emocion: 'orgulloso' })
  }));
});
activarFichas(galeria);

pintarFichasClase();
pintarEstudio();
comprobarIA();
