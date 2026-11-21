# Futuro Yo Aprende · Módulo de Base Común, Cuaderno y Aprendizaje Grupal (F7–F13)
**Abstracthon 2026 · Track Educación**  
**Responsable del Módulo:** Andre

---

## 1. Visión General y Funcionalidades Implementadas

En base a la arquitectura y los requerimientos del Abstracthon 2026, este módulo implementa la solución completa asignada a Andre:
1. **Base Común & Diseño de Interfaz:** Estética de la plataforma (paleta cálida `#FBF7EF`, tarjetas blancas `#FFFFFF`, tipografías *Fraunces* y *Atkinson Hyperlegible*, botones 3D). Modales sólidos con fondo blanco opaco (`#FFFFFF`) y bordes nítidos (`#E2DFD2`), asegurando alta legibilidad y contraste.
2. **Modalidades de Sesión Diferenciadas:**
   - **✨ Proponer una Clase (Efecto Protégé):** El facilitador transmite con su cámara para enseñar y afianzar lo aprendido explicando. Los participantes tienen cámara bloqueada y participan activamente por micrófono, chat y notas.
   - **👥 Crear Grupo de Estudio Colaborativo:** Sesión abierta donde **todos los integrantes pueden encender sus cámaras simultáneamente** e interactuar cara a cara.
3. **Sala Virtual con Dock Lateral de Cuaderno en Tiempo Real:**
   - Aprovecha el 100% del espacio en pantalla horizontal mediante un layout grid responsivo (`.cm-vr-layout-wrapper`).
   - A la derecha se despliega el **Dock de Apuntes en Vivo** con guardado reactivo, barra de herramientas Markdown rápida y botón para anexar capturas de la pizarra virtual directamente a los apuntes de la materia.
4. **Cuaderno Compartido & Multicuaderno:**
   - Creación de múltiples cuadernos organizados por materia/reunión.
   - Pestaña "Mis Cuadernos" y "Ver Otros Cuadernos (Comunidad)".
   - Control de privacidad (*Público* / *Privado*) y motor de búsqueda en tiempo real por título, contenido y facilitador.
   - Capturas de pizarra limpias (galería visual sin volcados de texto base64 en el cuerpo del texto).
5. **Perfil de Usuario, Rangos Docentes y Tarifas Condicionales:**
   - Visualización y edición completa de perfil (nombre, universidad, carrera, ciudad).
   - Racha de días de estudio en vivo y horas acumuladas.
   - Sistema de Rangos Docentes por promedio de estrellas:
     - `0 ⭐`: **Estudiante**
     - `< 3.0 ⭐`: **Aprendiz**
     - `3.0 a 4.0 ⭐`: **Profesor**
     - `> 4.0 ⭐`: **Maestro**
   - **Regla de Monetización / Tarifa por Hora (Bs):**
     - Si el usuario alcanza **Profesor o Maestro (≥ 3.0 ⭐)**, se habilita el campo para configurar su tarifa horaria pública (ej. `Bs 35 / hora`).
     - Si el usuario es **Estudiante o Aprendiz (< 3.0 ⭐)**, el campo de tarifa queda bloqueado con aviso explicativo, y los precios se coordinan exclusivamente de forma privada mediante el módulo de mensajería.
6. **Coordinación y Agendamiento 1 a 1:**
   - Vinculación dinámica con el facilitador real de la sesión (ej. Mateo Justiniano en *Cálculo II* en lugar de datos estáticos).
   - Solicitudes de tutoría integradas con el inbox de mensajes y buscadores en tiempo real.

---

## 2. Estructura de Archivos del Proyecto

```
AFJ_Academy/
├── Aprendizaje_Grupal/
│   ├── Andre/
│   │   ├── Oficial/
│   │   │   ├── futuro-yo-aprende.html     # Interfaz unificada con navegación integrada
│   │   │   ├── servidor.mjs               # Servidor local Node.js
│   │   │   ├── css/
│   │   │   │   └── estilo.css             # Estilos de interfaz (paleta, fuentes, botones, modales, dock)
│   │   │   ├── js/
│   │   │   │   ├── feed.js                # Feed adaptativo con IA, streaming, quizzes y tests
│   │   │   │   ├── cuaderno.js            # Cuadernos múltiples, visor público, galería de capturas y dock en vivo
│   │   │   │   └── comunidad.js           # Lógica de F7-F13: grupos/clases, sala virtual, perfil editable y tarifas
│   │   │   ├── README.md                  # Esta documentación técnica
│   │   │   └── HOJA_DE_RUTA_F7_F13.md     # Hoja de ruta funcional para el jurado y equipo
│   │   └── README.md
│   └── Rua/
│       └── README.md
├── Aprendizaje_Individual/
│   └── README.md
└── docs/
    ├── convocatoria.pdf
    ├── Abstracton.docx
    └── arquitectura_proyecto.md
```

---

## 3. Instrucciones de Ejecución

Para iniciar el servidor local desde la raíz del proyecto:
```powershell
node Aprendizaje_Grupal/Andre/Oficial/servidor.mjs
```
O directamente desde dentro del directorio `Aprendizaje_Grupal/Andre/Oficial`:
```powershell
node servidor.mjs
```
Luego abrir en el navegador web:
`http://localhost:8788/futuro-yo-aprende.html`

*(O también puedes abrir directamente el archivo `futuro-yo-aprende.html` en cualquier navegador).*
