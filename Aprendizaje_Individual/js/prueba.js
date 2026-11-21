// La prueba de la misión, en pantalla completa: el estudiante y su aprendín responden juntos.
// En cada pregunta el aprendín propone su respuesta y cuenta cómo lo pensó; el estudiante elige la respuesta del equipo.
import { crearAprendin, svgAprendin } from './aprendin.js';
import { htmlVisual } from './fichas.js';
import { activarFichas } from './fichas-dom.js';
import { resumenAprendin, PASOS } from './turno.js';
import { PREGUNTAS, APRUEBA, decidirFallas, examenLocal } from './examen.js';

const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = ms => new Promise(ok => setTimeout(ok, RM ? 0 : ms));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LETRAS = ['A', 'B', 'C', 'D'];

// ctx: { A, C, guardar, ia: () => bool, aprendido: () => [texto], alAprobar(resultado), alCambiar() }
export function crearPrueba(ctx) {
  let A = ctx.A, pedido = null, apr = null, eleccion = null, revelada = false, tipeo = 0;
  const P = () => (ctx.C.prueba ||= { intento: 1, examen: null, fallas: [], i: 0, respuestas: [], terminado: false });

  /* ---------- Pedir el examen (se pide antes, mientras sigue la clase) ---------- */
  function preparar() {
    A = ctx.A;
    const p = P();
    if (p.examen || pedido) return pedido;
    pedido = (async () => {
      let ex = null;
      if (ctx.ia()) {
        try {
          const r = await fetch('/api/examen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aprendin: resumenAprendin(A), fichas: ctx.aprendido(), intento: p.intento }) });
          const j = await r.json(); if (j.ok && j.examen?.preguntas?.length >= 3) ex = j.examen;
        } catch { /* sin IA: examen con sus fichas */ }
      }
      if (!ex) ex = examenLocal(A, ctx.C.fichas);
      p.examen = ex; ctx.guardar(); pedido = null;
      return ex;
    })();
    return pedido;
  }

  /* ---------- Abrir y cerrar ---------- */
  async function abrir() {
    A = ctx.A;
    const p = P(), el = $('#prueba');
    el.hidden = false; document.body.classList.add('con-prueba');
    $('#prNombre').textContent = A.nombre;
    apr?.destruir();
    apr = crearAprendin({ look: A.fases[PASOS].look, emocion: 'nervioso' });
    $('#prAv').replaceChildren(apr.el);
    $('#prCerrar').focus();
    if (!p.examen) {
      $('#prTitulo').textContent = 'La prueba de la misión';
      $('#prZona').innerHTML = `<div class="pr-cargando"><span></span><p>${esc(A.nombre)} está preparando la prueba con lo que le enseñaste…</p></div>`;
      decir('¡Qué nervios! Ya casi está la prueba.', 'nervioso');
      await preparar();
      if (el.hidden) return;
    }
    if (!p.fallas.length) { p.fallas = decidirFallas(p.examen, ctx.C.medicion); ctx.guardar(); }
    $('#prTitulo').textContent = p.examen.titulo;
    pintarProgreso();
    if (p.terminado) return resultado();
    if (p.i === 0 && !p.respuestas.length) return intro();
    pregunta();
  }
  function cerrar() {
    $('#prueba').hidden = true; document.body.classList.remove('con-prueba');
    clearInterval(tipeo); apr?.destruir(); apr = null; ctx.alCambiar?.();
  }
  $('#prCerrar').addEventListener('click', cerrar);
  $('#prueba').addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });

  /* ---------- El aprendín habla ---------- */
  function decir(texto, emo) {
    if (emo) apr?.sentir(emo);
    const g = $('#prGlobo'); clearInterval(tipeo);
    if (RM || !apr) { g.textContent = texto; return; }
    g.textContent = ''; apr.hablar(true);
    let i = 0;
    tipeo = setInterval(() => { i += 2; g.textContent = texto.slice(0, i); if (i >= texto.length) { clearInterval(tipeo); apr?.hablar(false); } }, 22);
  }

  /* ---------- Progreso ---------- */
  function pintarProgreso() {
    const p = P(), n = p.examen.preguntas.length;
    $('#prProgreso').innerHTML = p.examen.preguntas.map((_, k) => {
      const r = p.respuestas[k], cls = r ? (r.bien ? 'ok' : 'mal') : k === p.i && !p.terminado ? 'ahora' : '';
      return `<li class="${cls}" aria-label="Pregunta ${k + 1}${r ? (r.bien ? ', bien' : ', mal') : ''}">${k + 1}</li>`;
    }).join('');
    const bien = p.respuestas.filter(r => r?.bien).length;
    $('#prEquipo').innerHTML = `<b>${bien}</b> de ${n}<small>Equipo</small>`;
  }

  /* ---------- Intro ---------- */
  function intro() {
    const p = P();
    $('#prZona').innerHTML = `<div class="pr-intro">
      <h3>${esc(p.examen.titulo)}</h3>
      <p>Son ${p.examen.preguntas.length} preguntas y las responden <b>en equipo</b>. En cada una, ${esc(A.nombre)} te dice qué respuesta cree y cómo lo pensó. Tú decides: si está bien, van con la suya; si se equivocó, lo corriges.</p>
      <p class="pr-nota">Ojo: ${esc(A.nombre)} solo sabe lo que le enseñaste. Donde tu explicación quedó floja, puede caer en la trampa.</p>
      <p>Para aprobar necesitan <b>${APRUEBA} de ${p.examen.preguntas.length}</b>.</p>
      <button class="btn btn-crear" type="button" id="prEmpezar">¡Empezar juntos!</button>
    </div>`;
    decir(p.examen.intro || '¡Llegó la prueba de mi misión! ¿La respondemos juntos?', 'decidido');
    $('#prEmpezar').addEventListener('click', pregunta);
    $('#prEmpezar').focus();
  }

  /* ---------- Una pregunta ---------- */
  async function pregunta() {
    const p = P(), q = p.examen.preguntas[p.i], k = p.i;
    eleccion = null; revelada = false;
    pintarProgreso();
    const concepto = A.fases[q.paso]?.concepto || '';
    $('#prZona').innerHTML = `<div class="pr-preg">
      <p class="pr-num">Pregunta ${k + 1} de ${p.examen.preguntas.length}${concepto ? ` · ${esc(concepto)}` : ''}</p>
      <h3 class="pr-enunciado">${esc(q.enunciado)}</h3>
      ${q.visual ? `<div class="pr-visual">${htmlVisual(q.visual)}</div>` : ''}
      <div class="pr-opciones" role="radiogroup" aria-label="Opciones">${q.opciones.map((o, j) => `<button class="pr-op" type="button" role="radio" aria-checked="false" data-j="${j}"><span class="pr-letra">${LETRAS[j]}</span><span class="pr-txt">${esc(o)}</span><span class="pr-marcas"></span></button>`).join('')}</div>
      <div class="pr-acciones"><button class="btn btn-crear" type="button" id="prResponder" disabled>Elijan una respuesta</button></div>
      <div class="pr-feedback" id="prFeedback" hidden></div>
    </div>`;
    activarFichas($('#prZona'));
    const ops = [...document.querySelectorAll('.pr-op')];
    ops.forEach(b => b.addEventListener('click', () => elegir(Number(b.dataset.j))));
    $('#prResponder').addEventListener('click', responder);
    // el aprendín piensa y propone
    decir('Mmm… déjame pensar…', 'pensando');
    await espera(1300);
    if (P().i !== k || $('#prueba').hidden) return;
    const suya = p.fallas[k] ? q.trampa : q.respuesta, voz = p.fallas[k] ? q.voz_trampa : q.voz_acierto;
    p.respuestas[k] = { ...(p.respuestas[k] || {}), aprendin: suya }; ctx.guardar();
    ops[suya].querySelector('.pr-marcas').insertAdjacentHTML('beforeend', `<span class="pr-suya" title="Lo que cree ${esc(A.nombre)}">${svgAprendin(A.fases[PASOS].look, { emocion: 'feliz' })}</span>`);
    ops[suya].classList.add('es-suya');
    decir(`Creo que es la ${LETRAS[suya]}. ${voz}`, p.fallas[k] ? 'decidido' : 'feliz');
  }

  function elegir(j) {
    if (revelada) return;
    const p = P(), q = p.examen.preguntas[p.i], suya = p.respuestas[p.i]?.aprendin;
    eleccion = j;
    document.querySelectorAll('.pr-op').forEach(b => { const s = Number(b.dataset.j) === j; b.setAttribute('aria-checked', String(s)); b.classList.toggle('es-mia', s); });
    const btn = $('#prResponder'); btn.disabled = false; btn.textContent = `Responder juntos: la ${LETRAS[j]}`;
    if (suya == null) return;
    if (j === suya) decir('¡Pensamos igual! Vamos con esa.', 'feliz');
    else decir(`¿La ${LETRAS[j]}? Yo había pensado en la ${LETRAS[suya]}… Si tú lo ves así, vamos con la tuya.`, 'curioso');
    void q;
  }

  async function responder() {
    const p = P(), k = p.i, q = p.examen.preguntas[k];
    if (eleccion == null || revelada) return;
    revelada = true;
    const suya = p.respuestas[k]?.aprendin ?? q.respuesta;
    const bien = eleccion === q.respuesta, aprBien = suya === q.respuesta;
    p.respuestas[k] = { aprendin: suya, eleccion, bien, aprBien, paso: q.paso };
    ctx.guardar(); pintarProgreso();
    document.querySelectorAll('.pr-op').forEach(b => { const j = Number(b.dataset.j); b.disabled = true; b.classList.toggle('correcta', j === q.respuesta); b.classList.toggle('incorrecta', j === eleccion && !bien); });
    let tit, emo, voz, tipo;
    if (bien && aprBien) { tit = '¡Bien, equipo!'; emo = 'emocionado'; voz = '¡Lo sabíamos los dos! ¡Choca esos cinco!'; tipo = 'ok'; apr.saltar(); }
    else if (bien) { tit = '¡Lo salvaste!'; emo = 'agradecido'; voz = '¡Uf! Yo había caído en la trampa. Gracias por corregirme.'; tipo = 'salvada'; apr.entender(); }
    else if (aprBien) { tit = `${A.nombre} tenía razón`; emo = 'nervioso'; voz = '¡Era la que yo decía! La próxima confía un poquito en mí.'; tipo = 'mal'; }
    else if (eleccion === suya) { tit = 'Los dos cayeron'; emo = 'triste'; voz = 'Los dos caímos en la misma trampa… Mira por qué:'; tipo = 'mal'; apr.equivocarse(); }
    else { tit = 'Ninguno acertó'; emo = 'confundido'; voz = 'Ninguno de los dos… Veamos cuál era.'; tipo = 'mal'; }
    decir(voz, emo);
    const fb = $('#prFeedback'); fb.hidden = false; fb.className = `pr-feedback pr-${tipo}`;
    const ultima = k === p.examen.preguntas.length - 1;
    fb.innerHTML = `<b class="pr-fb-tit">${esc(tit)}</b><p>La respuesta es la <b>${LETRAS[q.respuesta]}</b>. ${esc(q.por_que)}</p>${q.resolucion ? `<details><summary>Ver cómo se resuelve</summary><p>${esc(q.resolucion)}</p></details>` : ''}<button class="btn btn-crear" type="button" id="prSiguiente">${ultima ? 'Ver el resultado' : 'Siguiente pregunta'}</button>`;
    $('#prResponder').hidden = true;
    $('#prSiguiente').addEventListener('click', () => { if (ultima) { p.terminado = true; p.i = k; ctx.guardar(); resultado(); } else { p.i = k + 1; ctx.guardar(); pregunta(); } });
    $('#prSiguiente').focus();
  }

  /* ---------- Resultado ---------- */
  function resultado() {
    const p = P(), n = p.examen.preguntas.length, rs = p.respuestas.filter(Boolean);
    const bien = rs.filter(r => r.bien).length, salvadas = rs.filter(r => r.bien && !r.aprBien).length, aprueba = bien >= APRUEBA;
    p.aprobado = aprueba; p.puntaje = bien; ctx.guardar(); pintarProgreso();
    const porPaso = {};
    rs.forEach(r => { (porPaso[r.paso] ||= { bien: 0, total: 0 }); porPaso[r.paso].total++; if (r.bien) porPaso[r.paso].bien++; });
    const fallo = [...new Set(rs.filter(r => !r.aprBien).map(r => r.paso))];
    $('#prZona').innerHTML = `<div class="pr-res ${aprueba ? 'aprobado' : 'reprobado'}">
      <p class="pr-sello">${aprueba ? '¡Aprobaron juntos!' : 'Esta vez no alcanzó'}</p>
      <p class="pr-grande"><b>${bien}</b> de ${n}</p>
      <ul class="pr-datos">
        <li><b>${salvadas}</b> ${salvadas === 1 ? 'vez lo salvaste' : 'veces lo salvaste'} de una trampa</li>
        <li><b>${rs.filter(r => r.aprBien).length}</b> de ${n} las tenía bien ${esc(A.nombre)} por su cuenta</li>
      </ul>
      <div class="pr-pasos">${Object.keys(porPaso).map(Number).sort().map(k => `<div class="${porPaso[k].bien === porPaso[k].total ? 'ok' : 'mal'}"><span>${porPaso[k].bien}/${porPaso[k].total}</span>${esc(A.fases[k]?.concepto || 'Paso ' + k)}</div>`).join('')}</div>
      ${fallo.length ? `<p class="pr-nota">${esc(A.nombre)} se confundió en: <b>${fallo.map(k => esc(A.fases[k]?.concepto || k)).join('</b>, <b>')}</b>. Ahí tu explicación quedó más floja: revisa su ficha y explícaselo de otra forma.</p>` : `<p class="pr-nota">${esc(A.nombre)} no cayó en ninguna trampa: le enseñaste muy bien.</p>`}
      <div class="pr-res-acc">${aprueba ? `<button class="btn btn-crear" type="button" id="prCelebrar">¡Misión cumplida!</button>` : `<button class="btn btn-crear" type="button" id="prOtra">Intentar otra prueba</button>`}<button class="btn" type="button" id="prFichas">Repasar sus fichas</button></div>
    </div>`;
    decir(aprueba ? (salvadas ? `¡Lo logramos! Y me salvaste ${salvadas === 1 ? 'una vez' : salvadas + ' veces'}. ¡Somos un gran equipo!` : '¡Lo logramos! ¡Somos un gran equipo!') : 'No pasa nada… repasemos mis fichas y lo intentamos otra vez. ¡Yo confío en ti!', aprueba ? 'orgulloso' : 'triste');
    if (aprueba) apr?.saltar();
    $('#prCelebrar')?.addEventListener('click', () => { cerrar(); ctx.alAprobar?.({ bien, n, salvadas }); });
    $('#prOtra')?.addEventListener('click', () => { const intento = p.intento + 1; ctx.C.prueba = { intento, examen: null, fallas: [], i: 0, respuestas: [], terminado: false }; ctx.guardar(); abrir(); });
    $('#prFichas').addEventListener('click', () => { cerrar(); ctx.alRepasar?.(); });
    ($('#prCelebrar') || $('#prOtra')).focus();
  }

  return { abrir, preparar, cerrar, estado: () => P() };
}
