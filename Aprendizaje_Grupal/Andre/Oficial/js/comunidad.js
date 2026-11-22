/* ==========================================================================
   SISTEMA DE COMUNIDAD, STREAMING EN VIVO, TUTORÍAS & MULTI-USUARIO (F7 a F13)
   100% Funcional con WebRTC getUserMedia, Canvas Pizarra, Cuaderno y Ranking.
   ========================================================================== */

(() => {
  'use strict';

  /* ==========================================================================
     CÁLCULO DE RANGOS DOCENTES (F13 & PERFILES)
     0 estrellas: Estudiante
     < 3 estrellas: Aprendiz
     3 a 4 estrellas: Profesor
     > 4 estrellas: Maestro
     ========================================================================== */
  window.getRangoDocente = function(stars) {
    const s = parseFloat(stars) || 0;
    if (s === 0) {
      return { titulo: 'Estudiante', icono: '🎓', clase: 'profile-rank-estudiante' };
    } else if (s < 3) {
      return { titulo: 'Aprendiz', icono: '📖', clase: 'profile-rank-aprendiz' };
    } else if (s <= 4) {
      return { titulo: 'Profesor', icono: '👨‍🏫', clase: 'profile-rank-profesor' };
    } else {
      return { titulo: 'Maestro', icono: '🧙‍♂️✨', clase: 'profile-rank-maestro' };
    }
  };

  let tutorActualParaCalificar = null;
  let filtroTextoMensajes = '';
  let filtroTextoAmigos = '';
  let streamSeleccionadoId = 'stream_sofia';


  /* ---------- BASE DE USUARIOS REGISTRADOS ---------- */
  const CUENTAS_BASE = [
    {
      id: 'u_andre',
      email: 'andre@gmail.com',
      password: '123',
      nombre: 'Andre',
      avatar: '👨‍💻',
      tipo: 'universidad',
      universidad: 'UMSS',
      carrera: 'Ingeniería de Sistemas',
      colegio: '',
      grado: '',
      pais: 'Bolivia',
      region: 'Cochabamba',
      ciudad: 'Cochabamba',
      rolDocente: 'Facilitador Activo • Nivel 3',
      tarifa: 'Bs 30 / hora',
      rating: 4.9,
      reviews: 18,
      horasSemana: 24.2,
      rachaDias: 6,
      estudiandoAhora: true,
      materiaActual: 'Programación Web',
      amigos: ['u_sofia', 'u_mateo'],
      solicitudesRecibidas: [],
      solicitudesEnviadas: []
    },
    {
      id: 'u_sofia',
      email: 'sofia@gmail.com',
      password: '123',
      nombre: 'Sofía Gutiérrez',
      avatar: '👩‍🎓',
      tipo: 'universidad',
      universidad: 'UMSA',
      carrera: 'Matemática Aplicada',
      colegio: '',
      grado: '',
      pais: 'Bolivia',
      region: 'La Paz',
      ciudad: 'La Paz',
      rolDocente: 'Facilitadora Máster • Nivel 5',
      tarifa: 'Bs 35 / hora',
      rating: 5.0,
      reviews: 32,
      horasSemana: 28.5,
      rachaDias: 12,
      estudiandoAhora: true,
      materiaActual: 'Cálculo II',
      amigos: ['u_andre', 'u_andrea'],
      solicitudesRecibidas: [],
      solicitudesEnviadas: []
    },
    {
      id: 'u_mateo',
      email: 'mateo@gmail.com',
      password: '123',
      nombre: 'Mateo Justiniano',
      avatar: '👨‍🎓',
      tipo: 'universidad',
      universidad: 'UMSS',
      carrera: 'Ingeniería Industrial',
      colegio: '',
      grado: '',
      pais: 'Bolivia',
      region: 'Cochabamba',
      ciudad: 'Cochabamba',
      rolDocente: 'Facilitador Inicial • Nivel 2',
      tarifa: 'Bs 25 / hora',
      rating: 4.8,
      reviews: 9,
      horasSemana: 21.0,
      rachaDias: 5,
      estudiandoAhora: false,
      materiaActual: 'Física I',
      amigos: ['u_andre'],
      solicitudesRecibidas: [],
      solicitudesEnviadas: []
    },
    {
      id: 'u_andrea',
      email: 'andrea@gmail.com',
      password: '123',
      nombre: 'Andrea Claros',
      avatar: '👩‍💻',
      tipo: 'universidad',
      universidad: 'UPSA',
      carrera: 'Desarrollo de Software',
      colegio: '',
      grado: '',
      pais: 'Bolivia',
      region: 'Santa Cruz',
      ciudad: 'Santa Cruz',
      rolDocente: 'Facilitadora • Nivel 3',
      tarifa: 'Bs 30 / hora',
      rating: 4.9,
      reviews: 14,
      horasSemana: 19.5,
      rachaDias: 4,
      estudiandoAhora: true,
      materiaActual: 'Algoritmos y Estructuras',
      amigos: ['u_sofia'],
      solicitudesRecibidas: [],
      solicitudesEnviadas: []
    }
  ];

  /* ---------- ESTADO DE GRUPOS DE ESTUDIO ---------- */
  
  const STREAMS_ESTUDIO = [
    {
      id: 'stream_sofia',
      usuarioId: 'u_sofia',
      nombre: 'Sofía Gutiérrez',
      avatar: '👩‍🎓',
      univ: 'UMSA • La Paz',
      materia: 'Cálculo II (Integrales Dobles y Polares)',
      racha: 12,
      horas: 28.5,
      espectadores: 6,
      mensajes: [
        { autor: 'Andre', avatar: '👨‍💻', texto: '¡Buena racha Sofi, 12 días seguidos!', hora: '13:40' },
        { autor: 'Andrea Claros', avatar: '👩‍💻', texto: 'Inspiración total ese repaso de integrales.', hora: '13:55' }
      ]
    },
    {
      id: 'stream_mateo',
      usuarioId: 'u_mateo',
      nombre: 'Mateo Justiniano',
      avatar: '👨‍🎓',
      univ: 'UMSS • Cochabamba',
      materia: 'Física I & Termodinámica',
      racha: 5,
      horas: 21.0,
      espectadores: 4,
      mensajes: [
        { autor: 'Andre', avatar: '👨‍💻', texto: '¡Fuerza Mateo con física!', hora: '12:30' }
      ]
    },
    {
      id: 'stream_andrea',
      usuarioId: 'u_andrea',
      nombre: 'Andrea Claros',
      avatar: '👩‍💻',
      univ: 'UPSA • Santa Cruz',
      materia: 'Algoritmos y Estructuras',
      racha: 4,
      horas: 19.5,
      espectadores: 3,
      mensajes: [
        { autor: 'Sofía Gutiérrez', avatar: '👩‍🎓', texto: '¡A darle duro a los grafos!', hora: '11:15' }
      ]
    },
    {
      id: 'stream_andre',
      usuarioId: 'u_andre',
      nombre: 'Andre',
      avatar: '👨‍💻',
      univ: 'UMSS • Cochabamba',
      materia: 'Programación Web & IA',
      racha: 6,
      horas: 24.2,
      espectadores: 5,
      mensajes: [
        { autor: 'Mateo Justiniano', avatar: '👨‍🎓', texto: '¡Dale Andre! Tu bot de IA está quedando genial.', hora: '14:05' }
      ]
    }
  ];

  const GRUPOS_INICIALES = [
    {
      id: 1,
      area: 'matematicas',
      areaLabel: '📐 Matemáticas & Cálculo',
      tema: 'Cálculo II: Trucos visuales para entender Integrales Dobles y Polares',
      desc: 'Sesión de pizarra guiada. Resolveremos 4 ejercicios típicos de examen explicando el cambio de variable a polares con gráficos interactivos.',
      metodologia: 'pizarra',
      tipo: 'clase', facilitador: 'Mateo Justiniano',
      facilitadorAvatar: '👨‍🎓',
      creadorNombre: 'Mateo Justiniano',
      creadorId: 'u_mateo',
      cuposMax: 5,
      cuposOcupados: 4,
      estado: 'coordinando',
      horarioOficial: null,
      miembros: ['Mateo Justiniano', 'Andre', 'Sofía Gutiérrez', 'Carlos Medina'],
      encuestaHorarios: [
        { id: 1, texto: 'Viernes 20:00 (BOT)', votos: ['Mateo Justiniano', 'Andre'] },
        { id: 2, texto: 'Sábado 16:00 (BOT)', votos: ['Sofía Gutiérrez'] },
        { id: 3, texto: 'Domingo 11:00 (BOT)', votos: ['Carlos Medina'] }
      ],
      chatMensajes: [
        { autor: 'Mateo Justiniano', avatar: '👨‍🎓', texto: '¡Hola a todos! Vayan votando el horario para fijar la sesión oficial.', hora: '10:15' },
        { autor: 'Andre', avatar: '👨‍💻', texto: 'Listo Mateo, yo voté por el viernes. Tengo ejercicios de modelos de examen listos.', hora: '10:22' },
        { autor: 'Sofía Gutiérrez', avatar: '👩‍🎓', texto: 'Perfecto, me sumo para aportar con la visualización polar.', hora: '10:30' }
      ]
    },
    {
      id: 2,
      area: 'programacion',
      areaLabel: '💻 Programación & Software',
      tema: 'Python & Web: Creando tu primer Bot con IA en vivo',
      desc: 'Live coding paso a paso. Crearemos un asistente conectado a un modelo de IA en menos de 45 minutos usando código limpio.',
      metodologia: 'coding',
      tipo: 'grupo', facilitador: 'Andre',
      facilitadorAvatar: '👨‍💻',
      creadorNombre: 'Andre',
      creadorId: 'u_andre',
      cuposMax: 6,
      cuposOcupados: 3,
      estado: 'agendado',
      horarioOficial: 'Sábado 16:30 (BOT)',
      miembros: ['Andre', 'Mateo Justiniano', 'Sofía Gutiérrez'],
      encuestaHorarios: [
        { id: 1, texto: 'Sábado 16:30 (BOT)', votos: ['Andre', 'Mateo Justiniano', 'Sofía Gutiérrez'] }
      ],
      chatMensajes: [
        { autor: 'Andre', avatar: '👨‍💻', texto: '¡Bienvenidos! La sesión ya quedó agendada para el sábado 16:30.', hora: '09:00' }
      ]
    },
    {
      id: 3,
      area: 'finanzas',
      areaLabel: '💵 Finanzas & Cripto',
      tema: 'Dólar Digital y Protección del Ahorro en Bolivia (USDT Seguro)',
      desc: 'Guía práctica para entender P2P sin estafas, comisiones reales y cómo gestionar ahorros frente a la devaluación.',
      metodologia: 'casos',
      tipo: 'clase', facilitador: 'Sofía Gutiérrez',
      facilitadorAvatar: '👩‍🎓',
      creadorNombre: 'Sofía Gutiérrez',
      creadorId: 'u_sofia',
      cuposMax: 5,
      cuposOcupados: 5,
      estado: 'coordinando',
      horarioOficial: null,
      miembros: ['Sofía Gutiérrez', 'Andre', 'Andrea Claros', 'Mateo Justiniano', 'Lucas Paz'],
      encuestaHorarios: [
        { id: 1, texto: 'Jueves 19:30 (BOT)', votos: ['Sofía Gutiérrez', 'Andrea Claros'] },
        { id: 2, texto: 'Sábado 18:00 (BOT)', votos: ['Andre', 'Mateo Justiniano', 'Lucas Paz'] }
      ],
      chatMensajes: [
        { autor: 'Sofía Gutiérrez', avatar: '👩‍🎓', texto: 'Traigan sus dudas sobre Binance P2P y QR bancarios.', hora: '11:00' }
      ]
    }
  ];

  /* ---------- CONVERSACIONES PRIVADAS Y SOLICITUDES DE TUTORÍA ---------- */
  const CONVERSACIONES_INICIALES = {
    'u_sofia': [
      { emisor: 'u_sofia', texto: '¡Hola Andre! Vi que propusiste la sesión de Python. Me parece genial el enfoque.', hora: '10:00' },
      { emisor: 'u_andre', texto: '¡Hola Sofi! Sí, la idea es enseñar haciendo proyectos reales. ¿Te sumas?', hora: '10:05' },
      { emisor: 'u_sofia', texto: '¡Claro que sí! Cualquier duda de matemáticas para machine learning la resolvemos juntos.', hora: '10:08' }
    ],
    'u_mateo': [
      { emisor: 'u_mateo', texto: 'Andre, ¿te parece si revisamos la integral doble antes de entrar a la sala?', hora: '09:30' },
      { emisor: 'u_andre', texto: 'Dale Mateo, tengo la pizarra lista con el gráfico 3D.', hora: '09:32' }
    ]
  };

  const SOLICITUDES_TUTORIAS_INICIALES = [
    {
      id: 101,
      estudianteId: 'u_mateo',
      estudianteNombre: 'Mateo Justiniano',
      estudianteAvatar: '👨‍🎓',
      tutorId: 'u_andre',
      tema: 'Tutoría Privada: Preparación de proyecto final de Algoritmos',
      horarioPropuesto: 'Viernes 18:00 BOT',
      mensaje: 'Necesito pulir la estructura de clases y optimizar el tiempo de ejecución.',
      tarifa: 'Bs 30 / hora',
      estado: 'pendiente' // 'pendiente', 'confirmada', 'rechazada'
    }
  ];

  /* ---------- VARIABLES GLOBALES DE ESTADO ---------- */
  let currentUser = CUENTAS_BASE[0]; // Inicia con Andre
  let stateCuentas = [...CUENTAS_BASE];
  let stateGrupos = [...GRUPOS_INICIALES];
  let stateConversaciones = { ...CONVERSACIONES_INICIALES };
  let stateSolicitudesTutorias = [...SOLICITUDES_TUTORIAS_INICIALES];
  let currentFiltroGrupos = 'todos';
  let grupoActivoId = 1;
  let chatPrivadoActivoId = 'u_sofia';
  let filtroAmigosActual = 'todos';

  // Streams de WebRTC
  let localMediaStream = null;
  let isMicActive = true;
  let isCamActive = true;
  let isHandRaised = false;
  let vrTimerInterval = null;
  let vrTimerSeconds = 45 * 60; // 45 minutos

  // Pizarra Canvas
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let canvasTool = 'pen'; // 'pen', 'eraser'
  let canvasColor = '#FF6B4D';
  let canvasLineWidth = 3;

  // Study With Me Timer (Pomodoro)
  let studyTimerInterval = null;
  let studyTimerSeconds = 25 * 60;
  let isStudyTimerRunning = false;
  let isTransmittingStudy = false;
  let studyMediaStream = null;

  /* ==========================================================================
     NAVEGACIÓN ENTRE PESTAÑAS (FUTURO YO APRENDE)
     ========================================================================== */
  window.switchAppTab = function(tab) {
    document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('tab-btn-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    // Ocultar todas las vistas
    const vistas = [
      'vista-feed-adaptativo',
      'vista-comunidad',
      'vista-focus',
      'vista-cuaderno',
      'vista-amigos',
      'vista-mensajes'
    ];
    vistas.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.style.display = 'none';
    });

    // Mostrar vista seleccionada
    const target = document.getElementById('vista-' + (tab === 'feed' ? 'feed-adaptativo' : tab));
    if (target) {
      target.style.display = (tab === 'feed' ? 'grid' : 'block');
    }

    if (tab === 'comunidad') {
      renderizarClases();
    } else if (tab === 'focus') {
      renderizarFocusView();
    } else if (tab === 'cuaderno' && window.renderizarCuaderno) {
      window.renderizarCuaderno();
    } else if (tab === 'amigos') {
      renderizarAmigos();
    } else if (tab === 'mensajes') {
      renderizarMensajeria();
    }
  };

  /* ==========================================================================
     SALA VIRTUAL EN VIVO CON CÁMARA REAL WEBRTC Y ACCIONES
     ========================================================================== */
  window.abrirSalaVirtual = async function() {
    const modal = document.getElementById('modalSalaVirtual');
    if (!modal) return;
    modal.hidden = false;

    // Obtener grupo actual
    const grupo = stateGrupos.find(g => g.id === grupoActivoId) || stateGrupos[0];
    const esGrupoColaborativo = (grupo.tipo === 'grupo');
    const esCoordinador = (currentUser.nombre === grupo.facilitador || currentUser.id === grupo.creadorId);

    tutorActualParaCalificar = {
      nombre: grupo.facilitador,
      avatar: grupo.facilitadorAvatar || '👨‍🏫',
      id: grupo.creadorId || 'u_mateo',
      tarifaHora: (grupo.facilitador === 'Sofía Gutiérrez' ? 35 : grupo.facilitador === 'Mateo Justiniano' ? 25 : 30),
      rating: (grupo.facilitador === 'Sofía Gutiérrez' ? 5.0 : grupo.facilitador === 'Mateo Justiniano' ? 4.8 : 4.9),
      resenasCount: (grupo.facilitador === 'Sofía Gutiérrez' ? 32 : 14)
    };

    // Actualizar título de la sala
    const tit = document.getElementById('cmVrTitulo');
    if (tit) {
      tit.textContent = (esGrupoColaborativo ? '👥 Grupo de Estudio: ' : '🎓 Clase: ') + grupo.tema;
    }

    // Iniciar temporizador regresivo
    iniciarTimerSala(45 * 60);

    const videoFacilitador = document.getElementById('vrFacilitadorVideo');
    const avatarFacilitador = document.getElementById('vrFacilitadorAvatar');
    const nombreFacilitador = document.getElementById('vrFacilitadorNombre');
    const btnCam = document.getElementById('btnVrCam');
    const miNombre = document.getElementById('vrMiNombre');
    const miAvatar = document.getElementById('vrMiAvatar');
    const miVideo = document.getElementById('vrMiVideo');

    if (nombreFacilitador) {
      nombreFacilitador.textContent = grupo.facilitador + (esCoordinador ? ' (Tú)' : '');
    }
    if (avatarFacilitador) {
      avatarFacilitador.textContent = grupo.facilitadorAvatar || '👨‍🏫';
    }
    if (miNombre) {
      miNombre.textContent = currentUser.nombre;
    }
    if (miAvatar) {
      miAvatar.textContent = currentUser.avatar;
    }

    if (esGrupoColaborativo) {
      // EN GRUPO DE ESTUDIO: ¡TODOS pueden encender su cámara!
      if (btnCam) {
        btnCam.style.display = 'inline-flex';
        btnCam.disabled = false;
        btnCam.title = 'Encender o apagar tu cámara (permitido para todos en grupo de estudio)';
        btnCam.classList.add('active');
        btnCam.innerHTML = '📹 Encender Mi Cámara';
        btnCam.style.opacity = '1';
      }
      mostrarToast('👥 Grupo colaborativo: Todos los participantes pueden encender su cámara.');
    } else {
      // EN CLASE CON FACILITADOR: Solo el coordinador activa cámara
      if (esCoordinador) {
        if (btnCam) {
          btnCam.style.display = 'inline-flex';
          btnCam.disabled = false;
          btnCam.title = 'Activar/Desactivar tu cámara docente';
          btnCam.classList.add('active');
          btnCam.innerHTML = '📹 Cámara Activa';
        }
        await conectarCamaraReal(true);
      } else {
        if (btnCam) {
          btnCam.style.display = 'inline-flex';
          btnCam.disabled = true;
          btnCam.title = 'En una clase magistral, solo el facilitador transmite con cámara';
          btnCam.classList.remove('active');
          btnCam.innerHTML = '📹 Cámara (Solo Facilitador)';
          btnCam.style.opacity = '0.6';
        }
        if (videoFacilitador) videoFacilitador.style.display = 'none';
        if (avatarFacilitador) avatarFacilitador.style.display = 'flex';
        mostrarToast('ℹ️ Estás como alumno. Solo el facilitador (' + grupo.facilitador + ') transmite con cámara.');
      }
    }

    // Inicializar Pizarra Canvas
    setTimeout(iniciarPizarraCanvas, 150);

    // Inicializar Dock del Cuaderno de apuntes en tiempo real a la derecha
    if (window.abrirCuadernoParaSala) {
      window.abrirCuadernoParaSala(grupo.tema, grupo.areaLabel || grupo.area);
    }
  };

  async function conectarCamaraReal(esFacilitador) {
    const videoFacilitador = document.getElementById('vrFacilitadorVideo');
    const avatarFacilitador = document.getElementById('vrFacilitadorAvatar');
    const miVideo = document.getElementById('vrMiVideo');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        localMediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });

        if (esFacilitador && videoFacilitador) {
          videoFacilitador.srcObject = localMediaStream;
          videoFacilitador.style.display = 'block';
          if (avatarFacilitador) avatarFacilitador.style.display = 'none';
        } else if (miVideo) {
          miVideo.srcObject = localMediaStream;
          miVideo.style.display = 'block';
        }

        isCamActive = true;
        isMicActive = true;
        actualizarBotonesControlSala();
      }
    } catch (err) {
      console.warn('Cámara no accesible o permiso denegado (modo simulación activo):', err.message);
      if (videoFacilitador) videoFacilitador.style.display = 'none';
      if (avatarFacilitador) avatarFacilitador.style.display = 'flex';
    }
  }

  function detenerCamaraReal() {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach(track => track.stop());
      localMediaStream = null;
    }
    const videoFacilitador = document.getElementById('vrFacilitadorVideo');
    const videoMi = document.getElementById('vrMiVideo');
    if (videoFacilitador) videoFacilitador.srcObject = null;
    if (videoMi) videoMi.srcObject = null;
  }

  window.toggleVrMic = function() {
    isMicActive = !isMicActive;
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach(t => (t.enabled = isMicActive));
    }
    actualizarBotonesControlSala();
  };

  window.toggleVrCam = function() {
    isCamActive = !isCamActive;
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach(t => (t.enabled = isCamActive));
    }
    actualizarBotonesControlSala();
  };

  window.toggleVrHand = function() {
    isHandRaised = !isHandRaised;
    actualizarBotonesControlSala();
    const chatList = document.getElementById('vrChatList');
    if (chatList) {
      const msg = document.createElement('div');
      msg.className = 'cm-msg';
      msg.innerHTML = `
        <div class="cm-msg-avatar">✋</div>
        <div class="cm-msg-content">
          <div class="cm-msg-bubble" style="background: var(--sol); color: #78350F; font-weight: 700;">
            ${currentUser.nombre} ${isHandRaised ? 'ha levantado la mano' : 'bajó la mano'}
          </div>
        </div>
      `;
      chatList.appendChild(msg);
      chatList.scrollTop = chatList.scrollHeight;
    }
  };

  function actualizarBotonesControlSala() {
    const btnMic = document.getElementById('btnVrMic');
    const btnCam = document.getElementById('btnVrCam');
    const btnHand = document.getElementById('btnVrHand');

    if (btnMic) {
      btnMic.className = 'cm-vr-ctrl-btn ' + (isMicActive ? 'active' : 'off');
      btnMic.innerHTML = isMicActive ? '🎙️ Micrófono Activo' : '🔇 Silenciado';
    }
    if (btnCam) {
      btnCam.className = 'cm-vr-ctrl-btn ' + (isCamActive ? 'active' : 'off');
      btnCam.innerHTML = isCamActive ? '📹 Cámara Activa' : '📷 Cámara Apagada';
    }
    if (btnHand) {
      btnHand.className = 'cm-vr-ctrl-btn ' + (isHandRaised ? 'hand-active' : '');
      btnHand.innerHTML = isHandRaised ? '✋ Mano Levantada' : '✋ Levantar Mano';
    }

    const micTag = document.getElementById('vrMiMicStatus');
    if (micTag) {
      micTag.textContent = isMicActive ? '🎙️ Activo' : '🔇 Mute';
    }
  }

  function iniciarTimerSala(segundos) {
    if (vrTimerInterval) clearInterval(vrTimerInterval);
    vrTimerSeconds = segundos;
    actualizarRelojSala();
    vrTimerInterval = setInterval(() => {
      if (vrTimerSeconds > 0) {
        vrTimerSeconds--;
        actualizarRelojSala();
      } else {
        clearInterval(vrTimerInterval);
      }
    }, 1000);
  }

  function actualizarRelojSala() {
    const m = Math.floor(vrTimerSeconds / 60);
    const s = vrTimerSeconds % 60;
    const txt = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    const el = document.getElementById('vrTimer');
    if (el) el.textContent = txt;
  }

  window.setVrModo = function(modo) {
    document.querySelectorAll('.cm-vr-tab-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    const boxCam = document.getElementById('vrModoCamaras');
    const boxPiz = document.getElementById('vrModoPizarra');
    const boxNotes = document.getElementById('vrModoApuntes');

    if (boxCam) boxCam.style.display = (modo === 'camaras' ? 'grid' : 'none');
    if (boxPiz) boxPiz.style.display = (modo === 'pizarra' ? 'flex' : 'none');
    if (boxNotes) boxNotes.style.display = (modo === 'apuntes' ? 'flex' : 'none');

    if (modo === 'pizarra') {
      setTimeout(redimensionarPizarra, 60);
    }
  };

  /* ==========================================================================
     PIZARRA DIGITAL INTERACTIVA (HTML5 CANVAS)
     ========================================================================== */
  function iniciarPizarraCanvas() {
    canvas = document.getElementById('cmWhiteboardCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    redimensionarPizarra();

    // Eventos de dibujo táctil y mouse
    canvas.onpointerdown = (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.onpointermove = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineWidth = canvasTool === 'eraser' ? 24 : canvasLineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = canvasTool === 'eraser' ? '#FFFFFF' : canvasColor;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    window.onpointerup = () => {
      if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
      }
    };
  }

  function redimensionarPizarra() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    if (parent) {
      const w = parent.clientWidth || 800;
      if (canvas.width !== w) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = w;
        canvas.height = 420;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imgData, 0, 0);
      }
    }
  }

  window.setCanvasTool = function(tool) {
    canvasTool = tool;
    const btnPen = document.getElementById('btnToolPen');
    const btnEraser = document.getElementById('btnToolEraser');
    if (btnPen && btnEraser) {
      if (tool === 'pen') {
        btnPen.style.background = 'var(--tinta)';
        btnPen.style.color = '#FFFFFF';
        btnEraser.style.background = 'transparent';
        btnEraser.style.color = 'var(--tinta)';
      } else {
        btnEraser.style.background = 'var(--tinta)';
        btnEraser.style.color = '#FFFFFF';
        btnPen.style.background = 'transparent';
        btnPen.style.color = 'var(--tinta)';
      }
    }
  };

  window.setCanvasColor = function(color) {
    canvasColor = color;
    window.setCanvasTool('pen');
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
  };

  window.limpiarPizarra = function() {
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  window.capturarPizarraParaCuaderno = function() {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (window.insertarCapturaEnCuaderno) {
      window.insertarCapturaEnCuaderno(dataUrl, currentUser.nombre);
    }
  };

  window.enviarMensajeVr = function(e) {
    e.preventDefault();
    const input = document.getElementById('vrInputMsg');
    if (!input || !input.value.trim()) return;

    const list = document.getElementById('vrChatList');
    if (list) {
      const item = document.createElement('div');
      item.className = 'cm-msg';
      item.innerHTML = `
        <div class="cm-msg-avatar">${currentUser.avatar}</div>
        <div class="cm-msg-content">
          <div style="font-size: 11px; font-weight: 700; color: var(--tinta-2); margin-bottom: 2px;">${currentUser.nombre}</div>
          <div class="cm-msg-bubble">${input.value.trim()}</div>
        </div>
      `;
      list.appendChild(item);
      list.scrollTop = list.scrollHeight;
    }
    input.value = '';
  };

  window.finalizarReunionYCalificar = function() {
    detenerCamaraReal();
    if (vrTimerInterval) clearInterval(vrTimerInterval);

    const modalVr = document.getElementById('modalSalaVirtual');
    if (modalVr) modalVr.hidden = true;

    // Asegurar que el tutor actual sea el facilitador del grupo en curso
    if (!tutorActualParaCalificar) {
      const grupo = stateGrupos.find(g => g.id === grupoActivoId) || stateGrupos[0];
      tutorActualParaCalificar = {
        nombre: grupo.facilitador,
        avatar: grupo.facilitadorAvatar || '👨‍🏫',
        id: grupo.creadorId || 'u_mateo',
        tarifaHora: (grupo.facilitador === 'Sofía Gutiérrez' ? 35 : 25),
        rating: 4.8,
        resenasCount: 14
      };
    }

    const nomRating = document.getElementById('ratingFacilitadorNombre');
    if (nomRating) nomRating.textContent = tutorActualParaCalificar.nombre;

    const modalRating = document.getElementById('modalCalificacionFinReunion');
    if (modalRating) modalRating.hidden = false;
  };

  /* ==========================================================================
     CALIFICACIÓN DEL FACILITADOR Y AGENDAMIENTO 1 A 1
     ========================================================================== */
  let ratingEstrellas = 5;

  window.setRatingStars = function(n) {
    ratingEstrellas = n;
    const btns = document.querySelectorAll('.star-btn');
    btns.forEach((b, i) => {
      b.classList.toggle('active', i < n);
    });
    const textMap = {
      1: '⭐ Explicación difícil de seguir',
      2: '⭐⭐ Regular, faltó profundizar',
      3: '⭐⭐⭐ Buena sesión, resolvimos dudas',
      4: '⭐⭐⭐⭐ ¡Muy buena explicación y pizarra!',
      5: '⭐⭐⭐⭐⭐ ¡Facilitador de nivel magistral!'
    };
    const t = document.getElementById('ratingStarsText');
    if (t) t.textContent = textMap[n] || '⭐⭐⭐⭐⭐';
  };

  window.cerrarModalCalificacion = function() {
    const modal = document.getElementById('modalCalificacionFinReunion');
    if (modal) modal.hidden = true;
  };

  window.pasarAAgendarClasePrivada = function() {
    cerrarModalCalificacion();

    const t = tutorActualParaCalificar || {
      nombre: 'Mateo Justiniano',
      avatar: '👨‍🎓',
      id: 'u_mateo',
      tarifaHora: 25,
      rating: 4.8,
      resenasCount: 9
    };

    const modalAgendar = document.getElementById('modalAgendarClasePrivada');
    const nomEl = document.getElementById('agendarTutorNombre');
    const avEl = document.getElementById('agendarTutorAvatar');
    const tarifaEl = document.getElementById('agendarTutorTarifa');
    const rolEl = document.getElementById('agendarTutorRol');

    if (nomEl) nomEl.textContent = t.nombre;
    if (avEl) avEl.textContent = t.avatar;
    if (tarifaEl) tarifaEl.textContent = 'Bs ' + (t.tarifaHora || 30) + ' / hora';
    if (rolEl) rolEl.textContent = 'Facilitador Docente • ⭐ ' + (t.rating || 4.9) + ' (' + (t.resenasCount || 15) + ' reseñas)';

    if (modalAgendar) modalAgendar.hidden = false;
  };

  window.cerrarModalAgendarClasePrivada = function() {
    const modal = document.getElementById('modalAgendarClasePrivada');
    if (modal) modal.hidden = true;
  };

  window.enviarSolicitudTutoriaPrivada = function(e) {
    e.preventDefault();
    const tema = document.getElementById('inputAgendarTema').value;
    const horario = document.getElementById('inputAgendarHorario').value;
    const mensaje = document.getElementById('inputAgendarMensaje').value;

    const t = tutorActualParaCalificar || {
      nombre: 'Mateo Justiniano',
      avatar: '👨‍🎓',
      id: 'u_mateo',
      tarifaHora: 25
    };

    const nuevaSolicitud = {
      id: Date.now(),
      estudianteId: currentUser.id,
      estudianteNombre: currentUser.nombre,
      estudianteAvatar: currentUser.avatar,
      tutorId: t.id,
      tutorNombre: t.nombre,
      tutorAvatar: t.avatar,
      tema,
      horarioPropuesto: horario,
      mensaje,
      tarifa: 'Bs ' + (t.tarifaHora || 30) + ' / hora',
      estado: 'pendiente'
    };

    stateSolicitudesTutorias.unshift(nuevaSolicitud);
    cerrarModalAgendarClasePrivada();
    renderizarSolicitudesTutorias();
    mostrarToast('📨 Solicitud de tutoría enviada a ' + t.nombre + ' (' + nuevaSolicitud.tarifa + ')');
  };

  window.responderSolicitudTutoria = function(solicitudId, accion) {
    const sol = stateSolicitudesTutorias.find(s => s.id === solicitudId);
    if (!sol) return;

    sol.estado = (accion === 'aceptar' ? 'confirmada' : 'rechazada');
    mostrarToast(accion === 'aceptar' ? '🎉 ¡Tutoría Confirmada! Se habilitó el chat.' : 'Solicitud rechazada');
    renderizarMensajeria();
  };

  /* ==========================================================================
     CARTELERA Y GESTIÓN DE GRUPOS DE ESTUDIO
     ========================================================================== */
  function renderizarClases() {
    const grid = document.getElementById('cmGruposGrid');
    if (!grid) return;

    let clases = stateGrupos;
    if (currentFiltroGrupos !== 'todos') {
      clases = clases.filter(g => g.area === currentFiltroGrupos);
    }

    grid.innerHTML = clases.map(g => {
      const isCreador = (currentUser.nombre === g.facilitador || currentUser.id === g.creadorId);
      const isMiembro = g.miembros.includes(currentUser.nombre);
      const pct = Math.min(100, Math.round((g.cuposOcupados / g.cuposMax) * 100));
      const esGrupo = (g.tipo === 'grupo');

      let btnAction = '';
      if (isCreador) {
        btnAction = `
          <button type="button" class="btn sm btn-coral" style="width: 100%;" onclick="seleccionarGrupo(${g.id})">
            ⭐ Abrir Mi Sesión (Tú Coordinas)
          </button>
        `;
      } else if (isMiembro) {
        btnAction = `
          <button type="button" class="btn sm" style="background: var(--tinta); color: #fff; width: 100%;" onclick="seleccionarGrupo(${g.id})">
            💬 Entrar a Coordinar
          </button>
        `;
      } else {
        btnAction = `
          <button type="button" class="btn sm btn-coral" style="width: 100%;" onclick="unirseAGrupo(${g.id})">
            🤝 Unirme al Grupo (${g.cuposMax - g.cuposOcupados} cupos)
          </button>
        `;
      }

      return `
        <div class="cm-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 4px;">
              <span class="cm-chip" style="background: var(--papel-2);">${g.areaLabel}</span>
              <span class="cm-chip" style="background: ${esGrupo ? 'rgba(78, 157, 255, 0.15)' : 'rgba(255, 107, 77, 0.12)'}; color: ${esGrupo ? '#2563EB' : 'var(--coral)'}; font-weight: 700;">
                ${esGrupo ? '👥 Grupo Colaborativo' : '🎓 Clase con Facilitador'}
              </span>
            </div>
            <h3 style="font-family: var(--font-title); font-size: 16px; margin: 6px 0; color: var(--tinta); line-height: 1.3;">
              ${g.tema}
            </h3>
            <p style="font-size: 12.5px; color: var(--tinta-2); margin: 0 0 12px 0;">
              ${g.desc}
            </p>
          </div>

          <div>
            <div style="background: var(--papel); border: 1.5px solid var(--linea); border-radius: 12px; padding: 10px 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 22px;">${g.facilitadorAvatar}</span>
                  <div>
                    <b style="font-size: 13px; color: var(--tinta);">${g.facilitador}</b>
                    <div style="font-size: 11px; color: var(--tinta-2);">${isCreador ? '⭐ Tú coordinas' : (esGrupo ? 'Iniciador del grupo' : 'Facilitador')}</div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 11.5px; font-weight: 700; color: var(--tinta-2);">Cupos: ${g.cuposOcupados}/${g.cuposMax}</span>
                </div>
              </div>
              <div style="height: 6px; background: var(--linea); border-radius: 999px; margin-top: 8px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: var(--coral); border-radius: 999px;"></div>
              </div>
            </div>

            ${btnAction}
          </div>
        </div>
      `;
    }).join('');
  }

  window.filtrarGrupos = function(area, btn) {
    currentFiltroGrupos = area;
    document.querySelectorAll('.cm-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderizarClases();
  };

  window.unirseAGrupo = function(id) {
    const g = stateGrupos.find(item => item.id === id);
    if (!g) return;
    if (!g.miembros.includes(currentUser.nombre)) {
      g.miembros.push(currentUser.nombre);
      g.cuposOcupados++;
      g.chatMensajes.push({
        autor: currentUser.nombre,
        avatar: currentUser.avatar,
        texto: '¡Hola a todos! Me uní a la sesión de estudio.',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      mostrarToast('🎉 ¡Te has unido al grupo de estudio!');
    }
    seleccionarGrupo(id);
  };

  window.seleccionarGrupo = function(id) {
    grupoActivoId = id;
    const g = stateGrupos.find(item => item.id === id);
    if (!g) return;

    document.getElementById('comunidad-cartelera').style.display = 'none';
    const detalle = document.getElementById('comunidad-grupo-detalle');
    detalle.style.display = 'grid';

    document.getElementById('cmDetalleTema').textContent = g.tema;
    document.getElementById('cmDetalleAreaChip').textContent = g.areaLabel;
    document.getElementById('cmDetalleCuposBadge').textContent = `${g.cuposOcupados}/${g.cuposMax} Integrantes`;
    document.getElementById('cmDetalleFacilitadorAvatar').textContent = g.facilitadorAvatar;
    document.getElementById('cmDetalleFacilitadorNombre').textContent = g.facilitador;
    document.getElementById('cmFechaReunionOficial').textContent = g.horarioOficial || '⏳ En votación por los integrantes';

    renderizarChatGrupo(g);
    renderizarEncuestaGrupo(g);
  };

  window.volverACartelera = function() {
    document.getElementById('comunidad-cartelera').style.display = 'block';
    document.getElementById('comunidad-grupo-detalle').style.display = 'none';
    renderizarClases();
  };

  function renderizarChatGrupo(g) {
    const list = document.getElementById('cmChatMessagesList');
    if (!list) return;
    list.innerHTML = g.chatMensajes.map(m => `
      <div class="cm-msg">
        <div class="cm-msg-avatar">${m.avatar}</div>
        <div class="cm-msg-content">
          <div style="display: flex; gap: 8px; align-items: baseline;">
            <b style="font-size: 12.5px; color: var(--tinta);">${m.autor}</b>
            <span style="font-size: 11px; color: var(--tinta-3);">${m.hora}</span>
          </div>
          <div class="cm-msg-bubble">${m.texto}</div>
        </div>
      </div>
    `).join('');
    list.scrollTop = list.scrollHeight;
  }

  window.enviarMensajeChat = function(e) {
    e.preventDefault();
    const input = document.getElementById('cmChatInput');
    if (!input || !input.value.trim()) return;

    const g = stateGrupos.find(item => item.id === grupoActivoId);
    if (!g) return;

    g.chatMensajes.push({
      autor: currentUser.nombre,
      avatar: currentUser.avatar,
      texto: input.value.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    input.value = '';
    renderizarChatGrupo(g);
  };

  function renderizarEncuestaGrupo(g) {
    const list = document.getElementById('cmPollOptionsList');
    if (!list) return;

    list.innerHTML = g.encuestaHorarios.map(opt => {
      const hasVoted = opt.votos.includes(currentUser.nombre);
      return `
        <div style="background: var(--papel); border: 1.5px solid ${hasVoted ? 'var(--coral)' : 'var(--linea)'}; border-radius: var(--r-s); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <b style="font-size: 13.5px; color: var(--tinta);">${opt.texto}</b>
            <div style="font-size: 11.5px; color: var(--tinta-2);">${opt.votos.length} voto(s): ${opt.votos.join(', ') || 'Sin votos aún'}</div>
          </div>
          <button type="button" class="btn sm ${hasVoted ? 'btn-coral' : 'ghost'}" onclick="votarHorario(${g.id}, ${opt.id})">
            ${hasVoted ? '✓ Votado' : 'Votar'}
          </button>
        </div>
      `;
    }).join('');

    const boxFijar = document.getElementById('cmFijarHorarioBox');
    if (boxFijar) {
      boxFijar.style.display = (g.creadorNombre === currentUser.nombre ? 'block' : 'none');
    }
  }

  window.votarHorario = function(grupoId, opcionId) {
    const g = stateGrupos.find(item => item.id === grupoId);
    if (!g) return;

    g.encuestaHorarios.forEach(opt => {
      opt.votos = opt.votos.filter(name => name !== currentUser.nombre);
      if (opt.id === opcionId) {
        opt.votos.push(currentUser.nombre);
      }
    });

    renderizarEncuestaGrupo(g);
  };

  window.fijarReunionOficial = function() {
    const g = stateGrupos.find(item => item.id === grupoActivoId);
    if (!g) return;

    let mejor = g.encuestaHorarios[0];
    g.encuestaHorarios.forEach(opt => {
      if (opt.votos.length > mejor.votos.length) mejor = opt;
    });

    g.horarioOficial = mejor.texto;
    g.estado = 'agendado';
    document.getElementById('cmFechaReunionOficial').textContent = g.horarioOficial;
    mostrarToast('📌 ¡Horario confirmado oficialmente: ' + g.horarioOficial + '!');
  };

  /* Modal Proponer Clase */
  window.openProponerModal = function(tipo = 'clase') {
    const modal = document.getElementById('modalProponerClase');
    if (!modal) return;

    const optClase = document.getElementById('radioTipoClase');
    const optGrupo = document.getElementById('radioTipoGrupo');
    const titModal = document.getElementById('proponerModalTitulo');
    const descModal = document.getElementById('proponerModalDesc');

    if (tipo === 'grupo') {
      if (optGrupo) optGrupo.checked = true;
      if (titModal) titModal.textContent = 'Crear Grupo de Estudio Colaborativo';
      if (descModal) descModal.textContent = '👥 En este grupo TODOS los participantes podrán encender su cámara y estudiar juntos.';
    } else {
      if (optClase) optClase.checked = true;
      if (titModal) titModal.textContent = 'Proponer una Clase (Efecto Protégé)';
      if (descModal) descModal.textContent = '🎓 Solo tú transmitirás con cámara para enseñar. Los alumnos participan por chat, micro y pizarra.';
    }

    modal.hidden = false;
  };

  window.closeProponerModal = function() {
    const modal = document.getElementById('modalProponerClase');
    if (modal) modal.hidden = true;
  };

  window.cambiarTipoSesionEnForm = function(tipo) {
    const titModal = document.getElementById('proponerModalTitulo');
    const descModal = document.getElementById('proponerModalDesc');
    if (tipo === 'grupo') {
      if (titModal) titModal.textContent = 'Crear Grupo de Estudio Colaborativo';
      if (descModal) descModal.textContent = '👥 En este grupo TODOS los participantes podrán encender su cámara y estudiar juntos.';
    } else {
      if (titModal) titModal.textContent = 'Proponer una Clase (Efecto Protégé)';
      if (descModal) descModal.textContent = '🎓 Solo tú transmitirás con cámara para enseñar. Los alumnos participan por chat, micro y pizarra.';
    }
  };

  window.guardarNuevaClase = function(e) {
    e.preventDefault();
    const area = document.getElementById('inputArea').value;
    const tema = document.getElementById('inputTema').value;
    const metodologia = document.getElementById('inputMetodologia').value;
    const cupos = parseInt(document.getElementById('inputCupos').value) || 5;
    const horario = document.getElementById('inputHorarioTentativo').value;
    const radioGrupo = document.getElementById('radioTipoGrupo');
    const esGrupo = radioGrupo && radioGrupo.checked;

    const areaLabels = {
      matematicas: '📐 Matemáticas & Cálculo',
      programacion: '💻 Programación & Software',
      finanzas: '💵 Finanzas & Cripto',
      idiomas: '🗣️ Idiomas'
    };

    const nuevoId = Date.now();
    const nuevoGrupo = {
      id: nuevoId,
      tipo: esGrupo ? 'grupo' : 'clase',
      area,
      areaLabel: areaLabels[area] || '📚 General',
      tema,
      desc: esGrupo ? 'Grupo de estudio colaborativo con cámaras libres.' : 'Sesión de repaso guiada por ' + currentUser.nombre + '.',
      metodologia,
      facilitador: currentUser.nombre,
      facilitadorAvatar: currentUser.avatar,
      creadorNombre: currentUser.nombre,
      creadorId: currentUser.id,
      cuposMax: cupos,
      cuposOcupados: 1,
      estado: 'coordinando',
      horarioOficial: null,
      miembros: [currentUser.nombre],
      encuestaHorarios: [
        { id: 1, texto: horario, votos: [currentUser.nombre] }
      ],
      chatMensajes: [
        { autor: currentUser.nombre, avatar: currentUser.avatar, texto: esGrupo ? '¡Grupo de estudio creado! Vayan votando el horario.' : '¡Hola! Propuse esta clase para repasar juntos. Voten su mejor horario.', hora: 'Ahora' }
      ]
    };

    stateGrupos.unshift(nuevoGrupo);
    closeProponerModal();
    renderizarClases();
    mostrarToast(esGrupo ? '👥 Grupo de estudio colaborativo publicado en cartelera' : '🎓 Clase por pares publicada en cartelera');
  };

  /* ==========================================================================
     MODO ESTUDIO EN VIVO (STUDY WITH ME) Y RANKINGS
     ========================================================================== */
  function renderizarFocusView() {
    renderizarMiniaturasEstudio();
    renderizarRanking();
  }

  window.switchFocusSubTab = function(sub) {
    const btnLive = document.getElementById('btnFocusSubLive');
    const btnRank = document.getElementById('btnFocusSubRanking');
    const viewLive = document.getElementById('focusSubViewLive');
    const viewRank = document.getElementById('focusSubViewRanking');

    if (sub === 'live') {
      if (btnLive) btnLive.classList.add('active');
      if (btnRank) btnRank.classList.remove('active');
      if (viewLive) viewLive.style.display = 'block';
      if (viewRank) viewRank.style.display = 'none';
    } else {
      if (btnRank) btnRank.classList.add('active');
      if (btnLive) btnLive.classList.remove('active');
      if (viewLive) viewLive.style.display = 'none';
      if (viewRank) viewRank.style.display = 'block';
    }
  };

  function renderizarMiniaturasEstudio() {
    const grid = document.getElementById('focusStreamsGrid');
    if (!grid) return;

    grid.innerHTML = STREAMS_ESTUDIO.map(s => {
      const isSelected = (s.id === streamSeleccionadoId);
      return `
        <div class="focus-stream-card ${isSelected ? 'active' : ''}" onclick="seleccionarStreamEstudio('${s.id}')" style="cursor: pointer; ${isSelected ? 'border-color: var(--coral); box-shadow: 0 0 0 2px var(--coral);' : ''}">
          <div class="focus-stream-preview" style="position: relative; height: 130px; background: #0E1030; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <span class="focus-live-badge" style="position: absolute; top: 8px; left: 8px; background: #EF4444; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">● LIVE</span>
            <span class="focus-timer-badge" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${s.espectadores} 👁️</span>
            <div style="font-size: 40px;">${s.avatar}</div>
          </div>
          <div class="focus-stream-info" style="padding: 10px 4px 4px 4px;">
            <b style="font-size: 13.5px; color: var(--tinta); display: block;">${s.nombre}</b>
            <div style="font-size: 11px; color: var(--tinta-2); margin-top: 2px;">🎓 ${s.univ} • ${s.materia}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
              <span class="streak-pill" style="font-size: 10px; padding: 2px 8px;">🔥 ${s.racha} días</span>
              <span style="font-size: 10.5px; color: var(--tinta-2);">⏱️ ${s.horas}h total</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    renderizarStreamEnPantallaGrande();
  }

  window.seleccionarStreamEstudio = function(id) {
    streamSeleccionadoId = id;
    renderizarMiniaturasEstudio();
  };

  function renderizarStreamEnPantallaGrande() {
    const s = STREAMS_ESTUDIO.find(x => x.id === streamSeleccionadoId) || STREAMS_ESTUDIO[0];
    const titEl = document.getElementById('focusPlayerStreamTitle');
    const subEl = document.getElementById('focusPlayerStreamSub');
    const avEl = document.getElementById('focusPlayerStreamAvatar');
    const rachaEl = document.getElementById('focusPlayerStreamRacha');
    const viewersEl = document.getElementById('focusPlayerStreamViewers');
    const chatTitle = document.getElementById('focusSpectatorChatTitle');
    const isMine = (s.usuarioId === currentUser.id);

    if (titEl) titEl.textContent = isMine ? 'Tu Transmisión en Vivo (Study With Me)' : 'Estudiando con ' + s.nombre;
    if (subEl) subEl.textContent = s.materia + ' · ' + s.univ;
    if (avEl) avEl.textContent = s.avatar;
    if (rachaEl) rachaEl.textContent = '🔥 ' + s.racha + ' días de racha';
    if (viewersEl) viewersEl.textContent = '● ' + s.espectadores + ' espectadores activos';
    if (chatTitle) chatTitle.textContent = isMine ? 'Mensajes de tus espectadores' : 'Sala de ' + s.nombre + ' · Ánimos';

    renderizarMensajesEspectadores(s);
  }

  function renderizarMensajesEspectadores(s) {
    const box = document.getElementById('focusSpectatorMessages');
    if (!box) return;
    box.innerHTML = s.mensajes.map(m => `
      <div style="display: flex; gap: 8px; align-items: flex-start; background: var(--blanco); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--linea);">
        <span style="font-size: 18px;">${m.avatar}</span>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <b style="font-size: 12px; color: var(--tinta);">${m.autor}</b>
            <span style="font-size: 10px; color: var(--tinta-2);">${m.hora}</span>
          </div>
          <div style="font-size: 12.5px; color: var(--tinta); margin-top: 2px;">${m.texto}</div>
        </div>
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }

  window.enviarMensajeEspectador = function(e) {
    if (e) e.preventDefault();
    const inp = document.getElementById('inputSpectatorMsg');
    if (!inp || !inp.value.trim()) return;
    const txt = inp.value.trim();

    const s = STREAMS_ESTUDIO.find(x => x.id === streamSeleccionadoId) || STREAMS_ESTUDIO[0];
    const nuevoMsg = {
      autor: currentUser.nombre,
      avatar: currentUser.avatar,
      texto: txt,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    s.mensajes.push(nuevoMsg);
    inp.value = '';
    renderizarMensajesEspectadores(s);
    mostrarToast('👏 Mensaje de ánimo enviado a ' + s.nombre);
  };

  window.enviarReaccionRapidaEspectador = function(emojiYTexto) {
    const s = STREAMS_ESTUDIO.find(x => x.id === streamSeleccionadoId) || STREAMS_ESTUDIO[0];
    const nuevoMsg = {
      autor: currentUser.nombre,
      avatar: currentUser.avatar,
      texto: emojiYTexto,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    s.mensajes.push(nuevoMsg);
    renderizarMensajesEspectadores(s);
    mostrarToast('👏 ' + emojiYTexto + ' enviado');
  };

  window.toggleIniciarTransmisionEstudio = async function() {
    const video = document.getElementById('focusLiveVideo');
    const btn = document.getElementById('btnIniciarTransmisionFocus');

    if (!isTransmittingStudy) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          studyMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (video) {
            video.srcObject = studyMediaStream;
            video.style.display = 'block';
          }
        }
      } catch (e) {
        console.warn('Cámara en modo simulación para estudio:', e);
      }
      isTransmittingStudy = true;
      if (btn) btn.textContent = '⏹️ Finalizar Mi Transmisión';
      window.iniciarTimerPomodoro();
      mostrarToast('📹 ¡Transmisión de Estudio iniciada en vivo!');
    } else {
      if (studyMediaStream) {
        studyMediaStream.getTracks().forEach(t => t.stop());
        studyMediaStream = null;
      }
      if (video) video.srcObject = null;
      isTransmittingStudy = false;
      if (btn) btn.textContent = '🎥 Iniciar mi Transmisión';
      window.pausarTimerPomodoro();
      mostrarToast('⏹️ Transmisión de estudio finalizada');
    }
  };

  window.iniciarTimerPomodoro = function() {
    if (isStudyTimerRunning) return;
    isStudyTimerRunning = true;
    studyTimerInterval = setInterval(() => {
      if (studyTimerSeconds > 0) {
        studyTimerSeconds--;
        actualizarTimerPomodoroUI();
      } else {
        clearInterval(studyTimerInterval);
        isStudyTimerRunning = false;
        currentUser.horasSemana += 0.5;
        mostrarToast('🎉 ¡Pomodoro de 25 min completado! +0.5h añadidas a tu récord.');
      }
    }, 1000);
  };

  window.pausarTimerPomodoro = function() {
    isStudyTimerRunning = false;
    if (studyTimerInterval) clearInterval(studyTimerInterval);
  };

  window.reiniciarTimerPomodoro = function() {
    pausarTimerPomodoro();
    studyTimerSeconds = 25 * 60;
    actualizarTimerPomodoroUI();
  };

  function actualizarTimerPomodoroUI() {
    const m = Math.floor(studyTimerSeconds / 60);
    const s = studyTimerSeconds % 60;
    const txt = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    const el = document.getElementById('focusPomodoroDisplay');
    if (el) el.textContent = txt;
  }

  function renderizarRanking() {
    const table = document.getElementById('rankingTableRows');
    if (!table) return;

    const ordenados = [...stateCuentas].sort((a, b) => b.horasSemana - a.horasSemana);

    table.innerHTML = ordenados.map((u, idx) => `
      <div class="ranking-row">
        <div class="ranking-pos">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)}</div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 26px;">${u.avatar}</span>
          <div>
            <b style="font-size: 14.5px; color: var(--tinta);">${u.nombre}</b>
            <div style="font-size: 11.5px; color: var(--tinta-2);">🎓 ${u.universidad || 'Universidad'} • ${u.carrera || u.ciudad}</div>
          </div>
        </div>
        <div>
          <span class="streak-pill">🔥 ${u.rachaDias} días</span>
        </div>
        <div>
          <b style="font-size: 14px; color: var(--tinta);">${u.horasSemana} hrs</b>
        </div>
        <div>
          <button type="button" class="btn sm ghost" onclick="enviarAnimoEstudio('${u.nombre}')" style="width: 100%;">
            👏 ¡Ánimo!
          </button>
        </div>
      </div>
    `).join('');
  }

  window.enviarAnimoEstudio = function(nombre) {
    mostrarToast('👏 Enviaste un mensaje de ánimo a ' + nombre);
  };

  /* ==========================================================================
     DIRECTORIO Y RED DE AMISTAD BIDIRECCIONAL
     ========================================================================== */
  window.filtrarDirectorioAmigosTexto = function(texto) {
    filtroTextoAmigos = (texto || '').toLowerCase().trim();
    renderizarAmigos();
  };

  function renderizarAmigos() {
    const grid = document.getElementById('directorioAmigosGrid');
    if (!grid) return;

    let lista = stateCuentas.filter(u => u.id !== currentUser.id);

    if (filtroAmigosActual === 'univ') {
      lista = lista.filter(u => u.universidad === currentUser.universidad);
    } else if (filtroAmigosActual === 'ciudad') {
      lista = lista.filter(u => u.ciudad === currentUser.ciudad);
    } else if (filtroAmigosActual === 'mis_amigos') {
      lista = lista.filter(u => currentUser.amigos.includes(u.id));
    }

    if (filtroTextoAmigos) {
      lista = lista.filter(u => 
        u.nombre.toLowerCase().includes(filtroTextoAmigos) ||
        (u.universidad && u.universidad.toLowerCase().includes(filtroTextoAmigos)) ||
        (u.carrera && u.carrera.toLowerCase().includes(filtroTextoAmigos)) ||
        (u.ciudad && u.ciudad.toLowerCase().includes(filtroTextoAmigos))
      );
    }

    if (lista.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--blanco); border: 1.5px solid var(--linea); border-radius: 18px;">
          <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
          <b style="font-size: 15px; color: var(--tinta);">No se encontraron compañeros</b>
          <p style="font-size: 12.5px; color: var(--tinta-2); margin-top: 4px;">Prueba buscando por otra universidad, ciudad o nombre.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = lista.map(u => {
      const isAmigo = currentUser.amigos.includes(u.id);
      const enviada = currentUser.solicitudesEnviadas.includes(u.id);
      const recibida = currentUser.solicitudesRecibidas.includes(u.id);
      const rango = getRangoDocente(u.rating);

      let btnHtml = '';
      if (isAmigo) {
        btnHtml = `
          <button type="button" class="btn sm ghost" onclick="abrirChatConAmigo('${u.id}')" style="flex: 1;">
            💬 Chatear
          </button>
          <span style="font-size: 12px; font-weight: 700; color: var(--menta-2); align-self: center;">✓ Amigos</span>
        `;
      } else if (recibida) {
        btnHtml = `
          <button type="button" class="btn sm btn-menta" onclick="aceptarSolicitudAmigo('${u.id}')" style="flex: 1;">
            ✅ Aceptar
          </button>
          <button type="button" class="btn sm ghost" onclick="rechazarSolicitudAmigo('${u.id}')">
            ✕
          </button>
        `;
      } else if (enviada) {
        btnHtml = `
          <button type="button" class="btn sm ghost" disabled style="flex: 1; opacity: .7;">
            ⏳ Solicitud Enviada
          </button>
        `;
      } else {
        btnHtml = `
          <button type="button" class="btn sm btn-coral" onclick="enviarSolicitudAmigo('${u.id}')" style="flex: 1;">
            ➕ Añadir Amigo
          </button>
        `;
      }

      return `
        <div class="cm-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="font-size: 42px; cursor: pointer; transition: transform .15s;" onclick="abrirModalPerfilCompanero('${u.id}')" title="Ver perfil de ${u.nombre}">
              ${u.avatar}
            </div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <b style="font-size: 15px; color: var(--tinta); cursor: pointer;" onclick="abrirModalPerfilCompanero('${u.id}')" title="Ver perfil">${u.nombre}</b>
                <span class="streak-pill">🔥 ${u.rachaDias}d</span>
              </div>
              <div style="font-size: 12px; color: var(--tinta-2); margin-top: 2px;">
                🎓 ${u.universidad || u.colegio || 'Bolivia'} • ${u.carrera || u.ciudad}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
                <span class="profile-rank-badge ${rango.clase}" style="font-size: 11px; padding: 2px 8px;">${rango.icono} ${rango.titulo}</span>
                <span style="font-size: 11.5px; color: #F59E0B; font-weight: 700;">⭐ ${(u.rating || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 14px; border-top: 1.5px solid var(--linea); padding-top: 10px;">
            ${btnHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  window.filtrarDirectorioAmigos = function(filtro, btn) {
    filtroAmigosActual = filtro;
    document.querySelectorAll('.amigos-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderizarAmigos();
  };

  window.enviarSolicitudAmigo = function(targetId) {
    if (!currentUser.solicitudesEnviadas.includes(targetId)) {
      currentUser.solicitudesEnviadas.push(targetId);
    }
    const target = stateCuentas.find(u => u.id === targetId);
    if (target && !target.solicitudesRecibidas.includes(currentUser.id)) {
      target.solicitudesRecibidas.push(currentUser.id);
    }
    mostrarToast('🤝 Solicitud de amistad enviada a ' + (target ? target.nombre : 'usuario'));
    renderizarAmigos();
  };

  window.aceptarSolicitudAmigo = function(senderId) {
    currentUser.solicitudesRecibidas = currentUser.solicitudesRecibidas.filter(id => id !== senderId);
    if (!currentUser.amigos.includes(senderId)) currentUser.amigos.push(senderId);

    const sender = stateCuentas.find(u => u.id === senderId);
    if (sender) {
      sender.solicitudesEnviadas = sender.solicitudesEnviadas.filter(id => id !== currentUser.id);
      if (!sender.amigos.includes(currentUser.id)) sender.amigos.push(currentUser.id);
    }

    mostrarToast('🎉 ¡Ahora son amigos! Chat y sesiones habilitadas.');
    renderizarAmigos();
  };

  window.rechazarSolicitudAmigo = function(senderId) {
    currentUser.solicitudesRecibidas = currentUser.solicitudesRecibidas.filter(id => id !== senderId);
    renderizarAmigos();
  };

  function actualizarBadgeSolicitudesNav() {
    const badge = document.getElementById('badgeSolicitudesNav');
    if (!badge) return;
    const n = currentUser.solicitudesRecibidas.length;
    if (n > 0) {
      badge.style.display = 'inline-block';
      badge.textContent = n;
    } else {
      badge.style.display = 'none';
    }
  }

  window.abrirChatConAmigo = function(amigoId) {
    chatPrivadoActivoId = amigoId;
    window.switchAppTab('mensajes');
  };

  /* ==========================================================================
     MENSAJERÍA PRIVADA Y GESTIÓN DE TUTORÍAS
     ========================================================================== */
  function renderizarMensajeria() {
    renderizarInboxPrivado();
    renderizarChatPrivadoActivo();
    renderizarSolicitudesTutorias();
  }

  window.filtrarConversacionesMensajes = function(texto) {
    filtroTextoMensajes = (texto || '').toLowerCase().trim();
    renderizarInboxPrivado();
  };

  function renderizarInboxPrivado() {
    const list = document.getElementById('pchatInboxList');
    if (!list) return;

    let amigosUsers = stateCuentas.filter(u => currentUser.amigos.includes(u.id));

    if (filtroTextoMensajes) {
      amigosUsers = amigosUsers.filter(u => u.nombre.toLowerCase().includes(filtroTextoMensajes));
    }

    if (amigosUsers.length === 0) {
      list.innerHTML = '<div style="font-size: 12px; color: var(--tinta-2); padding: 10px; font-style: italic;">No hay conversaciones que coincidan con la búsqueda.</div>';
      return;
    }

    list.innerHTML = amigosUsers.map(u => {
      const msgs = stateConversaciones[u.id] || [];
      const ultimo = msgs.length > 0 ? msgs[msgs.length - 1] : { texto: 'Inicia la conversación...', hora: '' };
      const isActive = (u.id === chatPrivadoActivoId);

      return `
        <div class="pchat-inbox-item ${isActive ? 'active' : ''}" onclick="seleccionarChatPrivado('${u.id}')">
          <div style="font-size: 28px;">${u.avatar}</div>
          <div style="flex: 1; overflow: hidden;">
            <div style="display: flex; justify-content: space-between;">
              <b style="font-size: 13.5px; color: var(--tinta);">${u.nombre}</b>
              <span style="font-size: 11px; color: var(--tinta-2);">${ultimo.hora}</span>
            </div>
            <div style="font-size: 12px; color: var(--tinta-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${ultimo.texto}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.seleccionarChatPrivado = function(userId) {
    chatPrivadoActivoId = userId;
    renderizarInboxPrivado();
    renderizarChatPrivadoActivo();
  };

  function renderizarChatPrivadoActivo() {
    const user = stateCuentas.find(u => u.id === chatPrivadoActivoId);
    if (!user) return;

    document.getElementById('pchatActiveAvatar').textContent = user.avatar;
    document.getElementById('pchatActiveName').textContent = user.nombre;
    document.getElementById('pchatActiveRole').textContent = `${user.rolDocente} • ${user.tarifa}`;

    const msgsList = document.getElementById('pchatMessagesList');
    if (!msgsList) return;

    const msgs = stateConversaciones[user.id] || [];
    msgsList.innerHTML = msgs.map(m => {
      const esMio = (m.emisor === currentUser.id);
      return `
        <div style="display: flex; justify-content: ${esMio ? 'flex-end' : 'flex-start'};">
          <div style="max-width: 75%; background: ${esMio ? 'var(--tinta)' : 'var(--papel)'}; color: ${esMio ? '#FFFFFF' : 'var(--tinta)'}; border: 1px solid var(--linea); border-radius: 14px; padding: 10px 14px; font-size: 13.5px; line-height: 1.4;">
            <div>${m.texto}</div>
            <div style="font-size: 10.5px; text-align: right; opacity: .7; margin-top: 4px;">${m.hora || 'Ahora'}</div>
          </div>
        </div>
      `;
    }).join('');

    msgsList.scrollTop = msgsList.scrollHeight;
  }

  window.enviarMensajePrivado = function(e) {
    e.preventDefault();
    const input = document.getElementById('inputPchat');
    if (!input || !input.value.trim()) return;

    if (!stateConversaciones[chatPrivadoActivoId]) {
      stateConversaciones[chatPrivadoActivoId] = [];
    }

    stateConversaciones[chatPrivadoActivoId].push({
      emisor: currentUser.id,
      texto: input.value.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    input.value = '';
    renderizarChatPrivadoActivo();
    renderizarInboxPrivado();
  };

  function renderizarSolicitudesTutorias() {
    const list = document.getElementById('listaSolicitudesClasesCards');
    if (!list) return;

    const misSolicitudes = stateSolicitudesTutorias.filter(s => s.tutorId === currentUser.id || s.estudianteId === currentUser.id);

    if (misSolicitudes.length === 0) {
      list.innerHTML = `<div style="font-size: 12.5px; color: var(--tinta-2);">No tienes solicitudes de tutorías activas.</div>`;
      return;
    }

    list.innerHTML = misSolicitudes.map(s => {
      const soyTutor = (s.tutorId === currentUser.id);
      return `
        <div style="background: var(--blanco); border: 1.5px solid var(--linea); border-radius: var(--r-m); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${s.estudianteAvatar}</span>
              <b style="font-size: 13.5px; color: var(--tinta);">${s.tema}</b>
              <span class="cm-chip" style="background: ${s.estado === 'confirmada' ? 'rgba(34, 184, 136, .18)' : 'rgba(245, 158, 11, .18)'}; color: ${s.estado === 'confirmada' ? 'var(--menta-2)' : '#D9770F'};">
                ${s.estado === 'confirmada' ? '🟢 Confirmada' : '⏳ Pendiente'}
              </span>
            </div>
            <div style="font-size: 12px; color: var(--tinta-2); margin-top: 4px;">
              Solicitado por: <strong>${s.estudianteNombre}</strong> • Horario: ${s.horarioPropuesto} • Tarifa: ${s.tarifa}
            </div>
          </div>
          <div>
            ${soyTutor && s.estado === 'pendiente' ? `
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn sm btn-menta" onclick="responderSolicitudTutoria(${s.id}, 'aceptar')">✅ Aceptar</button>
                <button type="button" class="btn sm ghost" onclick="responderSolicitudTutoria(${s.id}, 'rechazar')">✕</button>
              </div>
            ` : `
              <span style="font-size: 12px; font-weight: 700; color: var(--tinta-2);">${s.estado === 'confirmada' ? '✓ Coordinada' : 'En espera'}</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     SISTEMA DE AUTENTICACIÓN Y DEMO SWITCHER
     ========================================================================== */
  window.abrirModalAuth = function() {
    const m = document.getElementById('modalAuth');
    if (m) m.hidden = false;
  };

  window.cerrarModalAuth = function() {
    const m = document.getElementById('modalAuth');
    if (m) m.hidden = true;
  };

  window.cargarCuentaDemo = function(alias) {
    const found = stateCuentas.find(u => u.id === 'u_' + alias);
    if (!found) return;

    currentUser = found;
    actualizarHeaderUsuario();
    cerrarModalAuth();
    mostrarToast('👤 Cambiaste de cuenta a: ' + currentUser.nombre + ' (' + (currentUser.universidad || 'Estudiante') + ')');

    // Actualizar vista activa
    renderizarClases();
    renderizarAmigos();
    renderizarMensajeria();
  };

  function actualizarHeaderUsuario() {
    const nameEl = document.getElementById('headerUserName');
    const avatarEl = document.getElementById('headerAvatar');
    const subEl = document.getElementById('headerUserSubtitle');

    if (nameEl) nameEl.textContent = currentUser.nombre;
    if (avatarEl) avatarEl.textContent = currentUser.avatar;
    if (subEl) subEl.textContent = '🎓 ' + [currentUser.universidad || currentUser.colegio || 'Estudiante', currentUser.ciudad].filter(Boolean).join(' • ');

    actualizarBadgeSolicitudesNav();
  }

  window.ejecutarLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const found = stateCuentas.find(u => u.email === email);
    if (found) {
      currentUser = found;
      actualizarHeaderUsuario();
      cerrarModalAuth();
      mostrarToast('👋 ¡Bienvenido de nuevo, ' + currentUser.nombre + '!');
    } else {
      mostrarToast('Cuenta no encontrada, selecciona una cuenta demo o crea tu cuenta.');
    }
  };

  window.ejecutarRegistro = function(e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const univ = document.getElementById('regUniversidad').value;
    const carrera = document.getElementById('regCarrera').value;
    const ciudad = document.getElementById('regRegion').value;

    const nueva = {
      id: 'u_' + Date.now(),
      email,
      password: pass,
      nombre,
      avatar: '🧑‍🎓',
      tipo: 'universidad',
      universidad: univ || 'Universidad de Bolivia',
      carrera: carrera || 'Estudiante',
      colegio: '',
      grado: '',
      pais: 'Bolivia',
      region: ciudad,
      ciudad: ciudad || 'Bolivia',
      rolDocente: 'Estudiante Nuevo',
      tarifa: 'Bs 25 / hora',
      rating: 5.0,
      reviews: 0,
      horasSemana: 0,
      rachaDias: 1,
      estudiandoAhora: true,
      materiaActual: 'Estudio Activo',
      amigos: ['u_andre', 'u_sofia'],
      solicitudesRecibidas: [],
      solicitudesEnviadas: []
    };

    stateCuentas.push(nueva);
    currentUser = nueva;
    actualizarHeaderUsuario();
    cerrarModalAuth();
    mostrarToast('🚀 ¡Cuenta creada exitosamente! Bienvenido, ' + nombre);
  };

  /* Toast Helper */
  function mostrarToast(msg) {
    let t = document.getElementById('globalToastApp');
    if (!t) {
      t = document.createElement('div');
      t.id = 'globalToastApp';
      t.style.cssText = 'position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--tinta); color: #FFFFFF; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 28px rgba(35,38,74,.35); z-index: 10000; transition: opacity .3s, transform .3s; pointer-events: none; border: 1.5px solid var(--linea);';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2800);
  }
  window.mostrarToast = mostrarToast;

  /* ==========================================================================
     CUENTA INICIADA EN LA PLATAFORMA (login.html → Supabase)
     login.html deja una copia del usuario en localStorage['afj_current_user'].
     Si hay sesión, el módulo arranca con esa persona en vez de la cuenta demo.
     ========================================================================== */
  function cuentaDeLaPlataforma() {
    let u = null;
    try { u = JSON.parse(localStorage.getItem('afj_current_user') || 'null'); } catch (e) { u = null; }
    if (!u || !u.id) return null;

    const existente = stateCuentas.find(c => c.id === u.id);
    if (existente) return existente;

    const esColegio = u.role === 'estudiante';
    const cuenta = {
      id: u.id,
      email: u.email || '',
      nombre: u.username || (u.email || 'Estudiante').split('@')[0],
      avatar: esColegio ? '🎒' : '🧑‍🎓',
      tipo: esColegio ? 'colegio' : 'universidad',
      universidad: esColegio ? '' : (u.institution || ''),
      carrera: u.career || '',
      colegio: esColegio ? (u.institution || '') : '',
      grado: '',
      pais: u.country || 'Bolivia',
      region: u.city || '',
      ciudad: u.city || '',
      rolDocente: 'Estudiante Nuevo',
      tarifa: 'A coordinar por privado',
      rating: 0,
      reviews: 0,
      horasSemana: 0,
      rachaDias: 1,
      estudiandoAhora: true,
      materiaActual: 'Estudio Activo',
      amigos: [],
      solicitudesRecibidas: [],
      solicitudesEnviadas: []
    };
    stateCuentas.push(cuenta);
    return cuenta;
  }

  /* Inicialización */
  document.addEventListener('DOMContentLoaded', () => {
    const deLaPlataforma = cuentaDeLaPlataforma();
    if (deLaPlataforma) {
      currentUser = deLaPlataforma;
      window.currentUser = deLaPlataforma; // el cuaderno firma los apuntes con esta persona
    }
    actualizarHeaderUsuario();
    renderizarClases();
  });


  /* ==========================================================================
     MODALES DE PERFIL DE USUARIO Y COMPAÑEROS CON RANGOS DOCENTES
     ========================================================================== */
  window.abrirModalPerfilPropio = function() {
    const modal = document.getElementById('modalPerfilUsuario');
    if (!modal) return;

    // Mostrar vista de visualización y ocultar formulario de edición
    const viewVer = document.getElementById('perfilPropioViewVer');
    const viewEdit = document.getElementById('perfilPropioViewEdit');
    if (viewVer) viewVer.style.display = 'block';
    if (viewEdit) viewEdit.style.display = 'none';

    const nomEl = document.getElementById('perfilPropioNombre');
    const avEl = document.getElementById('perfilPropioAvatar');
    const emailEl = document.getElementById('perfilPropioEmail');
    const univEl = document.getElementById('perfilPropioUniv');
    const rachaEl = document.getElementById('perfilPropioRacha');
    const horasEl = document.getElementById('perfilPropioHoras');
    const starsEl = document.getElementById('perfilPropioStars');
    const rankEl = document.getElementById('perfilPropioRangoDocente');

    if (nomEl) nomEl.textContent = currentUser.nombre;
    if (avEl) avEl.textContent = currentUser.avatar;
    if (emailEl) emailEl.textContent = currentUser.email;
    if (univEl) univEl.textContent = (currentUser.universidad || currentUser.colegio || 'Bolivia') + ' • ' + (currentUser.carrera || currentUser.ciudad);
    if (rachaEl) rachaEl.textContent = '🔥 ' + (currentUser.rachaDias || 0) + ' días de racha';
    if (horasEl) horasEl.textContent = '⏱️ ' + (currentUser.horasSemana || 0) + ' hrs acumuladas';
    
    const stars = currentUser.rating || 0;
    if (starsEl) starsEl.textContent = '⭐ ' + (stars > 0 ? stars.toFixed(1) : '0.0') + ' (' + (currentUser.reviews || 0) + ' reseñas)';

    const rango = getRangoDocente(stars);
    if (rankEl) {
      rankEl.innerHTML = rango.icono + ' ' + rango.titulo;
      rankEl.className = 'profile-rank-badge ' + rango.clase;
    }

    modal.hidden = false;
  };

  window.cerrarModalPerfilPropio = function() {
    const modal = document.getElementById('modalPerfilUsuario');
    if (modal) modal.hidden = true;
  };

  window.iniciarEdicionPerfil = function() {
    const viewVer = document.getElementById('perfilPropioViewVer');
    const viewEdit = document.getElementById('perfilPropioViewEdit');
    if (viewVer) viewVer.style.display = 'none';
    if (viewEdit) viewEdit.style.display = 'block';

    document.getElementById('editPerfilNombre').value = currentUser.nombre || '';
    document.getElementById('editPerfilUniv').value = currentUser.universidad || currentUser.colegio || '';
    document.getElementById('editPerfilCarrera').value = currentUser.carrera || '';
    document.getElementById('editPerfilCiudad').value = currentUser.ciudad || 'Cochabamba';

    // Validación de rango docente para habilitar campo de tarifa
    const stars = currentUser.rating || 0;
    const esProfesorOMaestro = (stars >= 3.0);
    const boxTarifaHabilitada = document.getElementById('editTarifaHabilitadaBox');
    const boxTarifaBloqueada = document.getElementById('editTarifaBloqueadaBox');
    const inputTarifa = document.getElementById('editPerfilTarifaValor');

    if (esProfesorOMaestro) {
      if (boxTarifaHabilitada) boxTarifaHabilitada.style.display = 'block';
      if (boxTarifaBloqueada) boxTarifaBloqueada.style.display = 'none';
      if (inputTarifa) {
        inputTarifa.value = currentUser.tarifa ? parseInt(currentUser.tarifa.replace(/[^0-9]/g, '')) || 35 : 35;
      }
    } else {
      if (boxTarifaHabilitada) boxTarifaHabilitada.style.display = 'none';
      if (boxTarifaBloqueada) boxTarifaBloqueada.style.display = 'block';
    }
  };

  window.cancelarEdicionPerfil = function() {
    const viewVer = document.getElementById('perfilPropioViewVer');
    const viewEdit = document.getElementById('perfilPropioViewEdit');
    if (viewVer) viewVer.style.display = 'block';
    if (viewEdit) viewEdit.style.display = 'none';
  };

  window.guardarEdicionPerfil = function(e) {
    e.preventDefault();
    currentUser.nombre = document.getElementById('editPerfilNombre').value.trim() || currentUser.nombre;
    currentUser.universidad = document.getElementById('editPerfilUniv').value.trim() || currentUser.universidad;
    currentUser.carrera = document.getElementById('editPerfilCarrera').value.trim() || currentUser.carrera;
    currentUser.ciudad = document.getElementById('editPerfilCiudad').value.trim() || currentUser.ciudad;

    const stars = currentUser.rating || 0;
    if (stars >= 3.0) {
      const tarifaVal = parseInt(document.getElementById('editPerfilTarifaValor').value) || 30;
      currentUser.tarifa = 'Bs ' + tarifaVal + ' / hora';
    } else {
      currentUser.tarifa = 'A coordinar por mensaje privado';
    }

    // Actualizar en stateCuentas
    const idx = stateCuentas.findIndex(x => x.id === currentUser.id);
    if (idx !== -1) stateCuentas[idx] = { ...currentUser };

    actualizarHeaderUsuario();
    abrirModalPerfilPropio();
    mostrarToast('✅ Perfil actualizado exitosamente');
  };

  window.abrirModalPerfilCompanero = function(usuarioId) {
    const u = stateCuentas.find(x => x.id === usuarioId);
    if (!u) return;

    const modal = document.getElementById('modalPerfilCompanero');
    if (!modal) return;

    document.getElementById('perfilCompaneroNombre').textContent = u.nombre;
    document.getElementById('perfilCompaneroAvatar').textContent = u.avatar;
    document.getElementById('perfilCompaneroUniv').textContent = (u.universidad || u.colegio || 'Bolivia') + ' • ' + (u.carrera || u.ciudad);
    document.getElementById('perfilCompaneroRacha').textContent = '🔥 ' + u.rachaDias + ' días de racha';
    document.getElementById('perfilCompaneroHoras').textContent = '⏱️ ' + u.horasSemana + ' hrs acumuladas';
    document.getElementById('perfilCompaneroStars').textContent = '⭐ ' + (u.rating || 0).toFixed(1) + ' (' + (u.reviews || 0) + ' reseñas)';

    const rango = getRangoDocente(u.rating);
    const rankEl = document.getElementById('perfilCompaneroRango');
    if (rankEl) {
      rankEl.innerHTML = rango.icono + ' ' + rango.titulo;
      rankEl.className = 'profile-rank-badge ' + rango.clase;
    }

    const btnTut = document.getElementById('btnPerfilPedirTutoria');
    if (btnTut) {
      btnTut.onclick = () => {
        cerrarModalPerfilCompanero();
        tutorActualParaCalificar = {
          nombre: u.nombre,
          avatar: u.avatar,
          id: u.id,
          tarifaHora: (u.tarifa ? parseInt(u.tarifa.replace(/[^0-9]/g, '')) : 30),
          rating: u.rating,
          resenasCount: u.reviews
        };
        pasarAAgendarClasePrivada();
      };
    }

    const btnChat = document.getElementById('btnPerfilChatear');
    if (btnChat) {
      btnChat.onclick = () => {
        cerrarModalPerfilCompanero();
        switchAppTab('mensajes');
        seleccionarChatPrivado(u.id);
      };
    }

    modal.hidden = false;
  };

  window.cerrarModalPerfilCompanero = function() {
    const modal = document.getElementById('modalPerfilCompanero');
    if (modal) modal.hidden = true;
  };

})();