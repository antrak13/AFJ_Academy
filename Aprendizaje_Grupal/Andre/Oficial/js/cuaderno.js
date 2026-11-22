/* ==========================================================================
   CUADERNO COMPARTIDO · SISTEMA DE CUADERNOS POR MATERIA Y COMUNIDAD
   Fiel a los requerimientos de Abstracthon 2026
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'futuro_yo_cuadernos_v2';
  let cuadernoSubTab = 'mis'; // 'mis' o 'comunidad'
  let activeCuadernoId = 'cuaderno-1';
  let filtroBusquedaComunidad = '';

  const defaultCuadernos = [
    {
      id: 'cuaderno-1',
      titulo: 'Apuntes de Cálculo II · Integrales Dobles y Polares',
      materia: 'Matemáticas',
      autorId: 'andre',
      autorNombre: 'Andre',
      autorAvatar: 'A',
      autorUniv: 'UMSS • Cochabamba',
      esPublico: true,
      fecha: '20 Nov 2026',
      contenido: `# Apuntes de Cálculo II · Integrales Dobles y Polares

### Conceptos Clave:
- **Efecto Protégé:** Enseñar a un compañero aumenta la retención del contenido en un 80% más que la lectura pasiva.
- **Cambio a Polares:** x = r cos(θ), y = r sen(θ), dx dy = r dr dθ (no olvidar el Jacobiano r).

\`\`\`javascript
// Ejemplo de cálculo de área polar
function areaSector(r, dTheta) {
  return 0.5 * Math.pow(r, 2) * dTheta;
}
\`\`\`

> *Nota de la sesión con Mateo:* Repasar los ejercicios de la pizarra antes del examen del sábado.`,
      capturas: []
    },
    {
      id: 'cuaderno-2',
      titulo: 'Borrador de Algoritmos & Grafos en Python',
      materia: 'Programación',
      autorId: 'andre',
      autorNombre: 'Andre',
      autorAvatar: 'A',
      autorUniv: 'UMSS • Cochabamba',
      esPublico: false,
      fecha: '19 Nov 2026',
      contenido: `# Algoritmos de Grafos · BFS y DFS

Notas privadas para preparar el laboratorio:
- BFS utiliza una cola (Queue) para exploración por niveles.
- DFS utiliza una pila o recursión para caminos en profundidad.`,
      capturas: []
    },
    {
      id: 'cuaderno-3',
      titulo: 'Resumen de Dólar Digital & P2P sin Estafas en Bolivia',
      materia: 'Finanzas',
      autorId: 'sofia',
      autorNombre: 'Sofía Gutiérrez',
      autorAvatar: 'S',
      autorUniv: 'UMSA • La Paz',
      esPublico: true,
      fecha: '19 Nov 2026',
      contenido: `# Guía Rápida: P2P Seguro y Protección del Ahorro

1. Verificar que el comerciante tenga más del 95% de órdenes completadas.
2. Comprobar que el titular de la cuenta bancaria coincida con el nombre en la plataforma.
3. Nunca liberar las criptomonedas antes de ver el saldo acreditado en tu app de banco.`,
      capturas: []
    },
    {
      id: 'cuaderno-4',
      titulo: 'Guía Rápida de Límites y Derivadas Parciales',
      materia: 'Matemáticas',
      autorId: 'mateo',
      autorNombre: 'Mateo Justiniano',
      autorAvatar: 'M',
      autorUniv: 'UMSS • Cochabamba',
      esPublico: true,
      fecha: '18 Nov 2026',
      contenido: `# Derivadas Parciales y Regla de la Cadena

Reglas fundamentales explicadas en la sala virtual para resolución rápida en pizarras compartidas.`,
      capturas: []
    }
  ];

  let stateCuadernos = [];

  function cargarCuadernos() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        stateCuadernos = JSON.parse(saved);
      } else {
        stateCuadernos = defaultCuadernos;
        guardarCuadernos();
      }
    } catch (e) {
      console.warn('Error leyendo cuadernos de localStorage:', e);
      stateCuadernos = defaultCuadernos;
    }
  }

  function guardarCuadernos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCuadernos));
      actualizarIndicadorGuardado();
    } catch (e) {
      console.warn('Error guardando cuadernos:', e);
    }
  }

  function getCuadernoActivo() {
    let c = stateCuadernos.find(x => x.id === activeCuadernoId);
    if (!c) {
      c = stateCuadernos[0];
      if (c) activeCuadernoId = c.id;
    }
    return c;
  }

  function actualizarIndicadorGuardado() {
    const el = document.getElementById('cuadernoSavedStatus');
    const elRoom = document.getElementById('cuadernoSavedStatusRoom');
    const elDock = document.getElementById('vrDockSavedIndicator');
    const msg = 'Guardado ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (el) el.textContent = msg;
    if (elRoom) elRoom.textContent = msg;
    if (elDock) elDock.textContent = msg;
  }

  /* ==========================================================================
     SUBPESTAÑAS: MIS CUADERNOS VS COMUNIDAD
     ========================================================================== */
  window.switchCuadernoSubTab = function(tab) {
    cuadernoSubTab = tab;
    const btnMis = document.getElementById('btnSubCuadernoMis');
    const btnCom = document.getElementById('btnSubCuadernoComunidad');
    const secMis = document.getElementById('secCuadernosMis');
    const secCom = document.getElementById('secCuadernosComunidad');

    if (tab === 'mis') {
      if (btnMis) btnMis.classList.add('active');
      if (btnCom) btnCom.classList.remove('active');
      if (secMis) secMis.style.display = 'block';
      if (secCom) secCom.style.display = 'none';
      renderizarMisCuadernosUI();
    } else {
      if (btnCom) btnCom.classList.add('active');
      if (btnMis) btnMis.classList.remove('active');
      if (secMis) secMis.style.display = 'none';
      if (secCom) secCom.style.display = 'block';
      renderizarComunidadCuadernosUI();
    }
  };

  /* ==========================================================================
     MIS CUADERNOS (VISTA DE EDICIÓN Y GESTIÓN)
     ========================================================================== */
  function renderizarMisCuadernosUI() {
    const currentUserId = window.currentUser ? window.currentUser.id : 'andre';
    const misCuadernos = stateCuadernos.filter(c => c.autorId === currentUserId);
    const listContainer = document.getElementById('misCuadernosList');
    if (listContainer) {
      listContainer.innerHTML = misCuadernos.map(c => `
        <div class="notebook-card ${c.id === activeCuadernoId ? 'active' : ''}" onclick="seleccionarCuaderno('${c.id}')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <span class="cm-chip" style="background: var(--papel-2);">${c.materia}</span>
            <span class="cm-chip" style="background: ${c.esPublico ? 'rgba(34, 184, 136, 0.12)' : 'rgba(35, 38, 74, 0.08)'}; color: ${c.esPublico ? 'var(--menta-2)' : 'var(--tinta-2)'}; font-weight: 700;">
              ${c.esPublico ? 'Público' : 'Privado'}
            </span>
          </div>
          <b style="font-size: 14.5px; color: var(--tinta); margin: 8px 0 4px 0; display: block;">${c.titulo}</b>
          <div style="font-size: 11.5px; color: var(--tinta-2); display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span>${c.fecha}</span>
            <span>${c.capturas ? c.capturas.length : 0} pizarras</span>
          </div>
        </div>
      `).join('');
    }

    // Editor del cuaderno activo
    const cActivo = getCuadernoActivo();
    if (cActivo) {
      const titleEl = document.getElementById('cuadernoActivoTitulo');
      const materiaEl = document.getElementById('cuadernoActivoMateria');
      const toggleBtn = document.getElementById('btnTogglePublicoCuaderno');
      const textarea = document.getElementById('cuadernoTextarea');
      const textareaRoom = document.getElementById('cuadernoTextareaRoom');

      if (titleEl) titleEl.textContent = cActivo.titulo;
      if (materiaEl) materiaEl.textContent = cActivo.materia;
      if (toggleBtn) {
        toggleBtn.innerHTML = cActivo.esPublico 
          ? 'Público (Visible para todos)' 
          : 'Privado (Solo tú)';
        toggleBtn.className = cActivo.esPublico ? 'btn sm btn-menta' : 'btn sm ghost';
      }
      if (textarea && textarea.value !== cActivo.contenido) {
        textarea.value = cActivo.contenido || '';
      }
      if (textareaRoom && textareaRoom.value !== cActivo.contenido) {
        textareaRoom.value = cActivo.contenido || '';
      }

      renderizarGaleriaCapturas(cActivo);
    }
  }

  function renderizarGaleriaCapturas(c) {
    const gal = document.getElementById('cuadernoCapturasGallery');
    const galDock = document.getElementById('vrDockCapturasGallery');
    const galCount = document.getElementById('cuadernoCapturasCount');
    if (!c) return;

    const capturas = c.capturas || [];
    if (galCount) galCount.textContent = capturas.length;

    const htmlCards = capturas.length === 0
      ? '<div style="font-size: 12px; color: var(--tinta-2); padding: 8px 0; font-style: italic;">Sin capturas de pizarra aún. Pulsa « Pizarra» para capturar aquí.</div>'
      : capturas.map((cap, idx) => `
        <div class="notebook-captura-item" title="Captura de pizarra">
          <img src="${cap.dataUrl}" alt="Pizarra" onclick="verImagenEnGrande('${cap.dataUrl}')">
          <button type="button" class="notebook-captura-del" onclick="eliminarCapturaPizarra(${idx})" title="Eliminar captura">✕</button>
          <span style="position: absolute; bottom: 2px; left: 4px; font-size: 9px; color: #fff; background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 4px;">
            ${cap.hora || 'Pizarra'}
          </span>
        </div>
      `).join('');

    if (gal) gal.innerHTML = htmlCards;
    if (galDock) galDock.innerHTML = htmlCards;
  }

  window.verImagenEnGrande = function(dataUrl) {
    const w = window.open('');
    if (w) {
      w.document.write(`<body style="margin:0;background:#14172E;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${dataUrl}" style="max-width:95%;max-height:95%;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.5);"></body>`);
    }
  };

  window.eliminarCapturaPizarra = function(idx) {
    const c = getCuadernoActivo();
    if (!c || !c.capturas) return;
    c.capturas.splice(idx, 1);
    guardarCuadernos();
    renderizarGaleriaCapturas(c);
  };

  window.seleccionarCuaderno = function(id) {
    activeCuadernoId = id;
    renderizarMisCuadernosUI();
  };

  window.togglePublicoCuadernoActual = function() {
    const c = getCuadernoActivo();
    if (!c) return;
    c.esPublico = !c.esPublico;
    guardarCuadernos();
    renderizarMisCuadernosUI();
    if (window.mostrarToast) {
      window.mostrarToast(c.esPublico ? 'Cuaderno ahora es Público' : 'Cuaderno ahora es Privado');
    }
  };

  window.abrirModalNuevoCuaderno = function() {
    const modal = document.getElementById('modalCrearCuaderno');
    if (modal) modal.hidden = false;
  };

  window.cerrarModalNuevoCuaderno = function() {
    const modal = document.getElementById('modalCrearCuaderno');
    if (modal) modal.hidden = true;
  };

  window.guardarNuevoCuaderno = function(e) {
    e.preventDefault();
    const titulo = document.getElementById('inputNuevoCuadernoTitulo').value.trim();
    const materia = document.getElementById('inputNuevoCuadernoMateria').value.trim();
    const esPublico = document.getElementById('inputNuevoCuadernoPublico').checked;
    const u = window.currentUser || { id: 'andre', nombre: 'Andre', avatar: 'A', universidad: 'UMSS' };

    const nuevo = {
      id: 'cuaderno-' + Date.now(),
      titulo: titulo || 'Nuevo Cuaderno',
      materia: materia || 'General',
      autorId: u.id,
      autorNombre: u.nombre,
      autorAvatar: u.avatar,
      autorUniv: (u.universidad || 'UMSS') + ' • ' + (u.ciudad || 'Cochabamba'),
      esPublico: esPublico,
      fecha: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contenido: `# ${titulo}\\n\\nApuntes creados el ${new Date().toLocaleDateString()}.\\n\\n- Escribe aquí tus notas...`,
      capturas: []
    };

    stateCuadernos.unshift(nuevo);
    activeCuadernoId = nuevo.id;
    guardarCuadernos();
    cerrarModalNuevoCuaderno();
    renderizarMisCuadernosUI();
    if (window.mostrarToast) {
      window.mostrarToast('Cuaderno «' + nuevo.titulo + '» creado exitosamente');
    }
  };

  /* ==========================================================================
     COMUNIDAD: VER OTROS CUADERNOS PÚBLICOS & BUSCADOR
     ========================================================================== */
  window.filtrarCuadernosComunidad = function(texto) {
    filtroBusquedaComunidad = (texto || '').toLowerCase().trim();
    renderizarComunidadCuadernosUI();
  };

  function renderizarComunidadCuadernosUI() {
    const grid = document.getElementById('gridCuadernosComunidad');
    if (!grid) return;

    let publicos = stateCuadernos.filter(c => c.esPublico);

    if (filtroBusquedaComunidad) {
      publicos = publicos.filter(c => 
        c.titulo.toLowerCase().includes(filtroBusquedaComunidad) ||
        c.materia.toLowerCase().includes(filtroBusquedaComunidad) ||
        c.autorNombre.toLowerCase().includes(filtroBusquedaComunidad) ||
        (c.contenido && c.contenido.toLowerCase().includes(filtroBusquedaComunidad))
      );
    }

    if (publicos.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--blanco); border: 1.5px solid var(--linea); border-radius: 18px;">
          <div style="font-size: 13px; font-weight:600; color: var(--tinta-2); margin-bottom: 8px;">Sin cuadernos guardados</div>
          <b style="font-size: 15px; color: var(--tinta);">No se encontraron cuadernos públicos</b>
          <p style="font-size: 12.5px; color: var(--tinta-2); margin-top: 4px;">Intenta con otra palabra clave en el buscador o revisa más tarde.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = publicos.map(c => `
      <div class="notebook-card" onclick="abrirModalVerCuaderno('${c.id}')">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <span class="cm-chip" style="background: var(--papel-2);">${c.materia}</span>
            <span class="cm-chip" style="background: rgba(34, 184, 136, 0.12); color: var(--menta-2); font-weight: 700;"> Público</span>
          </div>
          <b style="font-size: 15px; color: var(--tinta); margin-bottom: 6px; display: block; line-height: 1.3;">${c.titulo}</b>
          <p style="font-size: 12px; color: var(--tinta-2); margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${(c.contenido || '').replace(/#|\\*|`|>|-/g, '').substring(0, 110)}...
          </p>
        </div>
        <div style="border-top: 1.5px solid var(--linea); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${c.autorAvatar || 'A'}</span>
            <div>
              <b style="font-size: 12px; color: var(--tinta);">${c.autorNombre}</b>
              <div style="font-size: 10.5px; color: var(--tinta-2);">${c.autorUniv || 'Bolivia'}</div>
            </div>
          </div>
          <button type="button" class="btn sm ghost" style="font-size: 11.5px;"> Leer</button>
        </div>
      </div>
    `).join('');
  }

  window.abrirModalVerCuaderno = function(id) {
    const c = stateCuadernos.find(x => x.id === id);
    if (!c) return;

    const modal = document.getElementById('modalVerCuadernoComunidad');
    if (!modal) return;

    document.getElementById('viewCuadernoTitulo').textContent = c.titulo;
    document.getElementById('viewCuadernoMateria').textContent = c.materia;
    document.getElementById('viewCuadernoAutor').textContent = c.autorNombre + ' (' + (c.autorUniv || '') + ')';
    document.getElementById('viewCuadernoContenido').textContent = c.contenido;

    const galEl = document.getElementById('viewCuadernoCapturasGal');
    if (galEl) {
      const caps = c.capturas || [];
      if (caps.length === 0) {
        galEl.innerHTML = '<span style="font-size: 12px; color: var(--tinta-2); font-style: italic;">Sin capturas de pizarra adjuntas.</span>';
      } else {
        galEl.innerHTML = caps.map(cap => `
          <div class="notebook-captura-item">
            <img src="${cap.dataUrl}" alt="Pizarra" onclick="verImagenEnGrande('${cap.dataUrl}')">
          </div>
        `).join('');
      }
    }

    modal.hidden = false;
  };

  window.cerrarModalVerCuaderno = function() {
    const modal = document.getElementById('modalVerCuadernoComunidad');
    if (modal) modal.hidden = true;
  };

  /* ==========================================================================
     HERRAMIENTAS DE FORMATO Y EXPORTACIÓN
     ========================================================================== */
  window.aplicarFormatoCuaderno = function(tipo) {
    const textarea = document.getElementById('cuadernoTextarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let replacement = '';

    switch (tipo) {
      case 'bold':
        replacement = `**${selected || 'texto en negrita'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'texto en cursiva'}*`;
        break;
      case 'h1':
        replacement = `\\n# ${selected || 'Título Principal'}\\n`;
        break;
      case 'h2':
        replacement = `\\n## ${selected || 'Subtítulo'}\\n`;
        break;
      case 'list':
        replacement = `\\n- ${selected || 'Elemento de lista'}\\n`;
        break;
      case 'code':
        replacement = '\\n```\\n' + (selected || '// Escribe tu código aquí') + '\\n```\\n';
        break;
      default:
        replacement = selected;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    onInputCuaderno(textarea.value);
  };

  window.onInputCuaderno = function(val) {
    const c = getCuadernoActivo();
    if (c) {
      c.contenido = val;
      guardarCuadernos();
    }
    const other = document.getElementById('cuadernoTextareaRoom') || document.getElementById('cuadernoTextarea');
    if (other && other.value !== val) {
      other.value = val;
    }
  };

  // Inserción limpia de la captura gráfica en el cuaderno activo
  window.insertarCapturaEnCuaderno = function(dataUrl, autor = 'Facilitador') {
    const c = getCuadernoActivo();
    if (!c) return;
    if (!c.capturas) c.capturas = [];

    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    c.capturas.push({
      dataUrl: dataUrl,
      autor: autor,
      hora: hora
    });

    guardarCuadernos();
    renderizarMisCuadernosUI();

    if (window.mostrarToast) {
      window.mostrarToast('Pizarra guardada en «' + c.titulo + '»');
    }
  };

  window.limpiarCuaderno = function() {
    if (confirm('¿Deseas vaciar los apuntes de este cuaderno?')) {
      const textarea = document.getElementById('cuadernoTextarea');
      if (textarea) textarea.value = '';
      onInputCuaderno('');
    }
  };

  window.exportarCuadernoMarkdown = function() {
    const c = getCuadernoActivo();
    if (!c) return;

    let md = c.contenido || '';
    if (c.capturas && c.capturas.length > 0) {
      md += '\\n\\n---\\n### Pizarras de la Sesión (' + c.capturas.length + ' capturas)\\n';
      c.capturas.forEach((cap, i) => {
        md += `\\n#### Pizarra #${i + 1} (${cap.hora} por ${cap.autor})\\n![Pizarra ${i + 1}](${cap.dataUrl})\\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (c.titulo.replace(/[^a-zA-Z0-9_-]/g, '_') || 'cuaderno') + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.mostrarToast) {
      window.mostrarToast('Archivo Markdown descargado exitosamente');
    }
  };

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    cargarCuadernos();
    renderizarMisCuadernosUI();
  });


  /* ==========================================================================
     DOCK DE CUADERNO EN VIVO (ESPACIO LATERAL DE LA SALA VIRTUAL)
     ========================================================================== */
  window.abrirCuadernoParaSala = function(tema, area) {
    let c = stateCuadernos.find(x => x.titulo.toLowerCase().includes((tema || '').toLowerCase().substring(0, 15)));
    if (!c) {
      const u = window.currentUser || { id: 'andre', nombre: 'Andre', avatar: 'A', universidad: 'UMSS' };
      c = {
        id: 'cuaderno-sala-' + Date.now(),
        titulo: 'Apuntes: ' + (tema || 'Sesión en Vivo'),
        materia: area || 'General',
        autorId: u.id,
        autorNombre: u.nombre,
        autorAvatar: u.avatar,
        autorUniv: (u.universidad || 'UMSS') + ' • ' + (u.ciudad || 'Bolivia'),
        esPublico: true,
        fecha: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contenido: '# Apuntes: ' + (tema || 'Clase en Vivo') + '\n\nSesión en tiempo real iniciada el ' + new Date().toLocaleDateString() + ':\n\n- ',
        capturas: []
      };
      stateCuadernos.unshift(c);
      guardarCuadernos();
    }

    activeCuadernoId = c.id;

    const titDock = document.getElementById('vrDockCuadernoTitulo');
    const matDock = document.getElementById('vrDockCuadernoMateria');
    const txtDock = document.getElementById('vrDockNotebookTextarea');

    if (titDock) titDock.textContent = c.titulo;
    if (matDock) matDock.textContent = c.materia + ' · En tiempo real';
    if (txtDock) txtDock.value = c.contenido || '';

    renderizarGaleriaCapturas(c);
  };

  window.onInputCuadernoDock = function(val) {
    const c = getCuadernoActivo();
    if (c) {
      c.contenido = val;
      guardarCuadernos();
    }
    const txtMain = document.getElementById('cuadernoTextarea');
    const txtRoom = document.getElementById('cuadernoTextareaRoom');
    if (txtMain && txtMain.value !== val) txtMain.value = val;
    if (txtRoom && txtRoom.value !== val) txtRoom.value = val;
  };

  window.aplicarFormatoCuadernoDock = function(tipo) {
    const textarea = document.getElementById('vrDockNotebookTextarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let replacement = '';

    switch (tipo) {
      case 'bold':
        replacement = '**' + (selected || 'texto en negrita') + '**';
        break;
      case 'italic':
        replacement = '*' + (selected || 'texto en cursiva') + '*';
        break;
      case 'h2':
        replacement = '\n## ' + (selected || 'Subtítulo') + '\n';
        break;
      case 'list':
        replacement = '\n- ' + (selected || 'Elemento de lista') + '\n';
        break;
      case 'code':
        replacement = '\n```\n' + (selected || '// Código aquí') + '\n```\n';
        break;
      default:
        replacement = selected;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    onInputCuadernoDock(textarea.value);
  };

})();