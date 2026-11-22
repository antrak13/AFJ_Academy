// Panel docente: aulas, alumnos (con usuario y PIN o por código), tema asignado,
// avance de cada alumno con lo que midió la IA y las debilidades del aula paso por paso.
import { crearAprendin } from './aprendin.js';
import { api, plataforma } from './avance-nube.js';
import { avanceDelTema, debilidadesAula, estadoAlumno, hace } from './docente-datos.js';
import { ESTADOS, PASOS } from './turno.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = x => `${Math.round(x * 100)}%`;

const marca = crearAprendin({ look: { forma: 'bollo', color: 'indigo', rasgos: { ojos: 'grandes' }, piezas: { pelo: 'mechon' } }, emocion: 'feliz', seguir: false });
$('#marcaAv').append(marca.el);

let aulas = [], aulaId = new URLSearchParams(location.search).get('aula'), detalle = null, abierto = null;

function error(msg) {
  const el = $('#error');
  el.textContent = msg || ''; el.hidden = !msg;
}
async function llamar(ruta, opciones) {
  error('');
  try { return await api(ruta, opciones); }
  catch (e) { error(e.message); throw e; }
}

/* ---------- Inicio ---------- */
async function iniciar() {
  const m = await plataforma();
  if (!m) { $('#sinPlataforma').hidden = false; return; }
  let u = null;
  try { u = await m.usuarioActual(); } catch { /* sin configuración de Supabase */ }
  if (!u) { m.irAlLogin(); return; }
  $('#quien').textContent = u.username + (u.role === 'docente' ? ' · Docente' : '');
  $('#lado').hidden = false; $('#principal').hidden = false;
  await cargarAulas();
}

async function cargarAulas() {
  const r = await llamar('/api/aulas');
  aulas = r?.comoDocente || [];
  if (!aulas.some(a => a.id === aulaId)) aulaId = aulas[0]?.id || null;
  pintarAulas();
  $('#vacio').hidden = !!aulaId; $('#detalle').hidden = !aulaId;
  if (aulaId) await cargarDetalle();
}

function pintarAulas() {
  const caja = $('#listaAulas');
  if (!aulas.length) { caja.innerHTML = '<p class="nota">Todavía no tienes aulas.</p>'; return; }
  caja.innerHTML = aulas.map(a => `
    <button class="doc-aula" type="button" data-id="${a.id}" aria-pressed="${a.id === aulaId}">
      <b>${esc(a.nombre)}</b>
      <small>${esc(a.curso)}${a.tema ? ` · ${esc(a.tema)}` : ''} · ${a.alumnos} ${a.alumnos === 1 ? 'alumno' : 'alumnos'}</small>
    </button>`).join('');
}
$('#listaAulas').addEventListener('click', e => {
  const b = e.target.closest('.doc-aula'); if (!b) return;
  aulaId = b.dataset.id; abierto = null;
  history.replaceState(null, '', `?aula=${aulaId}`);
  pintarAulas(); $('#vacio').hidden = true; $('#detalle').hidden = false; $('#credenciales').hidden = true;
  cargarDetalle();
});

$('#formAula').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.submitter; btn.disabled = true;
  try {
    const r = await llamar('/api/aulas', { metodo: 'POST', cuerpo: { nombre: $('#aulaNombreNueva').value.trim(), curso: $('#aulaCursoNueva').value, tema: $('#aulaTemaNueva').value.trim() } });
    aulaId = r.aula.id; e.target.reset();
    history.replaceState(null, '', `?aula=${aulaId}`);
    await cargarAulas();
    $('#nombres').focus();
  } catch { /* ya se mostró */ } finally { btn.disabled = false; }
});

/* ---------- Detalle del aula ---------- */
async function cargarDetalle() {
  const id = aulaId;
  const r = await llamar(`/api/aulas/${id}`);
  if (!r || id !== aulaId) return;
  detalle = r;
  const a = r.aula;
  $('#aulaNombre').textContent = a.nombre;
  $('#aulaCurso').textContent = `${a.curso || 'Sin curso'} · ${r.alumnos.length} ${r.alumnos.length === 1 ? 'alumno' : 'alumnos'}`;
  $('#aulaCodigo').textContent = a.codigo;
  if (document.activeElement !== $('#aulaTema')) $('#aulaTema').value = a.tema;
  pintarDebilidades(); pintarTabla();
}

$('#btnCopiar').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(detalle.aula.codigo); $('#btnCopiar').textContent = '¡Copiado!'; }
  catch { $('#btnCopiar').textContent = detalle.aula.codigo; }
  setTimeout(() => { $('#btnCopiar').textContent = 'Copiar'; }, 1600);
});

$('#formTema').addEventListener('submit', async e => {
  e.preventDefault();
  const tema = $('#aulaTema').value.trim();
  try {
    await llamar(`/api/aulas/${aulaId}`, { metodo: 'PATCH', cuerpo: { tema } });
    detalle.aula.tema = tema;
    const a = aulas.find(x => x.id === aulaId); if (a) a.tema = tema;
    $('#temaEstado').textContent = tema ? 'Listo: tus alumnos lo verán en el taller.' : 'Sin tema asignado.';
    pintarAulas(); pintarDebilidades(); pintarTabla();
  } catch { /* ya se mostró */ }
});

function pintarDebilidades() {
  const { alumnos, aula } = detalle;
  const pasos = debilidadesAula(alumnos, aula.tema);
  const conDatos = pasos.filter(p => p.empezaron);
  $('#debilidades').innerHTML = !conDatos.length
    ? '<p class="nota">Cuando tus alumnos le enseñen a su aprendín, aquí aparece en qué paso le cuesta más al aula y qué errores repiten.</p>'
    : pasos.map(p => {
      if (!p.empezaron) return `<div class="doc-paso vacio"><div class="doc-paso-cab"><b>Paso ${p.paso} · ${esc(p.concepto)}</b><span class="nota">nadie llegó todavía</span></div></div>`;
      const nivel = p.fuerza < 0.45 ? 'flojo' : p.fuerza < 0.7 ? 'medio' : 'firme';
      return `<div class="doc-paso ${nivel}">
        <div class="doc-paso-cab"><b>Paso ${p.paso} · ${esc(p.concepto)}</b>${p.variantes.length ? `<span class="nota" title="${esc(p.variantes.join(' · '))}">y ${p.variantes.length} ${p.variantes.length === 1 ? 'variante' : 'variantes'}</span>` : ''}</div>
        <div class="doc-barra" role="img" aria-label="Fuerza ${pct(p.fuerza)}"><i style="width:${Math.round(p.fuerza * 100)}%"></i></div>
        <p class="doc-cifras"><span><b>${pct(p.fuerza)}</b> fuerza</span><span><b>${pct(p.pctError)}</b> cayó en un error</span><span><b>${p.intentos.toFixed(1)}</b> intentos</span><span><b>${p.terminaron}/${p.empezaron}</b> lo lograron</span>${p.fallosPrueba ? `<span><b>${p.fallosPrueba}</b> ${p.fallosPrueba === 1 ? 'fallo' : 'fallos'} en la prueba</span>` : ''}</p>
        ${p.notas.length ? `<ul class="doc-notas">${p.notas.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      </div>`;
    }).join('');

  const ayuda = alumnos.map(al => ({ al, e: estadoAlumno(al, aula.tema) })).filter(x => x.e.ayuda);
  $('#ayuda').innerHTML = !alumnos.length ? '<li class="nota">Registra a tus alumnos para empezar.</li>'
    : !ayuda.length ? '<li class="nota">Nadie se ve trabado por ahora. 🎉</li>'
    : ayuda.map(({ al, e }) => `<li><b>${esc(al.nombre)}</b> · ${esc(e.motivos.join(' · '))}</li>`).join('');
}

function chips(ts = []) {
  if (!ts.length) return '<span class="doc-nada">—</span>';
  return `<span class="est-chips">${ts.map(t => `<i class="est est-${esc(t.estado)}" title="${esc(ESTADOS[t.estado] || t.estado)}${t.nota ? ': ' + esc(t.nota) : ''}"></i>`).join('')}</span>`;
}

function pintarTabla() {
  const { alumnos, aula } = detalle;
  const cuerpo = $('#tablaAlumnos');
  if (!alumnos.length) { cuerpo.innerHTML = '<tr><td colspan="8" class="nota">Todavía no hay alumnos en esta aula.</td></tr>'; return; }
  cuerpo.innerHTML = alumnos.map(al => {
    const av = avanceDelTema(al.avances, aula.tema), otros = al.avances.length - (av ? 1 : 0);
    const fila = `<tr class="doc-fila" data-id="${al.id}" tabindex="0" aria-expanded="${abierto === al.id}">
      <th scope="row">${esc(al.nombre)}${al.usuario ? `<small>${esc(al.usuario)}</small>` : ''}</th>
      <td>${av ? `${esc(av.nombre)}<small>${esc(av.tema)}${otros > 0 ? ` · +${otros}` : ''}</small>` : '<span class="doc-nada">sin empezar</span>'}</td>
      ${[1, 2, 3, 4].map(p => `<td>${chips(av?.medicion?.[p])}</td>`).join('')}
      <td>${av?.prueba ? `<span class="doc-prueba ${av.prueba.aprobado ? 'si' : 'no'}">${av.prueba.puntaje}/${av.prueba.n}</span>` : av?.paso > PASOS ? '<span class="doc-nada">pendiente</span>' : '<span class="doc-nada">—</span>'}</td>
      <td>${av ? esc(hace(av.actualizado)) : '<span class="doc-nada">—</span>'}</td>
    </tr>`;
    return fila + (abierto === al.id ? filaDetalle(al, av) : '');
  }).join('');
}

function filaDetalle(al, av) {
  const pasos = av ? [1, 2, 3, 4].map(p => {
    const ts = av.medicion?.[p] || [];
    return `<li><b>Paso ${p} · ${esc(av.conceptos?.[p - 1] || '')}</b> ${chips(ts)}${ts.filter(t => t.nota).length ? `<ul>${ts.filter(t => t.nota).map(t => `<li><span class="doc-et est-${esc(t.estado)}">${esc(ESTADOS[t.estado] || t.estado)}</span> ${esc(t.nota)}</li>`).join('')}</ul>` : ''}</li>`;
  }).join('') : '';
  return `<tr class="doc-fila-det"><td colspan="8">
    ${av ? `<p class="nota">${esc(av.nombre)} · ${esc(av.tema)} · ${av.mensajes} ${av.mensajes === 1 ? 'mensaje' : 'mensajes'} del alumno${av.prueba ? ` · prueba ${av.prueba.puntaje}/${av.prueba.n}${av.prueba.salvadas ? `, salvó a su aprendín ${av.prueba.salvadas} ${av.prueba.salvadas === 1 ? 'vez' : 'veces'}` : ''}` : ''}</p><ol class="doc-pasos">${pasos}</ol>` : '<p class="nota">Todavía no le enseñó nada a un aprendín.</p>'}
    <button class="btn-txt" type="button" data-quitar="${al.id}">Quitar del aula</button>
  </td></tr>`;
}

function alternar(id) { abierto = abierto === id ? null : id; pintarTabla(); }
$('#tablaAlumnos').addEventListener('click', async e => {
  const q = e.target.closest('[data-quitar]');
  if (q) {
    const al = detalle.alumnos.find(x => x.id === q.dataset.quitar);
    if (!confirm(`¿Quitar a ${al?.nombre || 'este alumno'} del aula? Su cuenta y su avance no se borran.`)) return;
    try { await llamar(`/api/aulas/${aulaId}/alumnos?alumno=${q.dataset.quitar}`, { metodo: 'DELETE' }); abierto = null; await cargarAulas(); } catch { /* ya se mostró */ }
    return;
  }
  const fila = e.target.closest('.doc-fila'); if (fila) alternar(fila.dataset.id);
});
$('#tablaAlumnos').addEventListener('keydown', e => {
  const fila = e.target.closest('.doc-fila');
  if (fila && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); alternar(fila.dataset.id); }
});

/* ---------- Registrar alumnos ---------- */
$('#formAlumnos').addEventListener('submit', async e => {
  e.preventDefault();
  const nombres = [...new Set($('#nombres').value.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 45);
  if (!nombres.length) { $('#nombres').focus(); return; }
  const btn = e.submitter; btn.disabled = true; btn.textContent = `Creando ${nombres.length} ${nombres.length === 1 ? 'cuenta' : 'cuentas'}…`;
  try {
    const r = await llamar(`/api/aulas/${aulaId}/alumnos`, { metodo: 'POST', cuerpo: { nombres } });
    $('#nombres').value = '';
    mostrarCredenciales(r.creados, r.errores);
    await cargarAulas();
  } catch { /* ya se mostró */ } finally { btn.disabled = false; btn.textContent = 'Crear cuentas'; }
});

function mostrarCredenciales(creados, errores = []) {
  const caja = $('#credenciales');
  const texto = creados.map(c => `${c.nombre}\tusuario: ${c.usuario}\tPIN: ${c.pin}`).join('\n');
  caja.innerHTML = `
    <p class="doc-alerta"><b>Anota o copia estos datos ahora:</b> el PIN no se vuelve a mostrar. Cada alumno entra en «Iniciar sesión» con su usuario y su PIN.</p>
    <table class="doc-tabla doc-tabla-cred"><thead><tr><th scope="col">Alumno</th><th scope="col">Usuario</th><th scope="col">PIN</th></tr></thead>
      <tbody>${creados.map(c => `<tr><td>${esc(c.nombre)}</td><td><code>${esc(c.usuario)}</code></td><td><code>${esc(c.pin)}</code></td></tr>`).join('')}</tbody></table>
    ${errores.length ? `<p class="doc-error">No se pudieron crear: ${errores.map(x => `${esc(x.nombre)} (${esc(x.error)})`).join(', ')}</p>` : ''}
    <button class="btn" type="button" id="btnCopiarCred">Copiar todo</button>`;
  caja.hidden = false;
  $('#btnCopiarCred').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(texto); $('#btnCopiarCred').textContent = '¡Copiado!'; } catch { /* sin portapapeles */ }
  });
}

$('#btnActualizar').addEventListener('click', () => { if (aulaId) cargarDetalle(); else cargarAulas(); });

iniciar();
