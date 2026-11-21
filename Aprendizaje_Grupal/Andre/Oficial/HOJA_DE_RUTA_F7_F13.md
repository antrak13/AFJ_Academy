# Hoja de Ruta Técnica: Funcionalidades F7 a F13
**Futuro Yo Aprende · Aprendizaje Grupal, Efecto Protégé y Red Estudiantil**  
**Especificación Técnica Actualizada para el Jurado · Abstracthon 2026**  
**Autor:** Andre

---

## 1. Fundamentación y Matriz de Funcionalidades

| Funcionalidad | Nombre Clave | Especificación Técnica Implementada |
|---|---|---|
| **F7** | **Cartelera Dual: Clases (Efecto Protégé) y Grupos Colaborativos** | Dos modalidades con botones específicos: `✨ Proponer una Clase` (enseñar con cámara única para consolidar conocimiento) y `👥 Crear Grupo de Estudio` (cámaras abiertas para todos los integrantes). Cartelera filtrable por materia y cupos dinámicos. |
| **F8** | **Coordinación Previa y Votación de Horarios** | Vista de coordinación con chat grupal previo y encuestas de horarios tentativas (sistema de un voto por integrante). |
| **F9** | **Sala Virtual & Dock de Cuaderno en Tiempo Real** | Escenario de video interactivo (WebRTC simulado + acceso a cámara web real), pizarra compartida con canvas libre y **Dock Lateral de Apuntes** integrado a la derecha para tomar notas en vivo y anexar capturas sin tapar el video. |
| **F10** | **Cuaderno Compartido & Multicuaderno** | Organización por materias y sesiones. Pestañas "Mis Cuadernos" y "Ver Otros Cuadernos (Comunidad)", interruptor público/privado, buscador predictivo y galería limpia de capturas de pizarra. |
| **F11** | **Modo Estudio en Vivo (Study With Me)** | Retícula de cámaras de estudio concentrado, pantalla grande con chat de mensajes de ánimo en vivo, racha de estudio diaria e insignias de nivel. |
| **F12** | **Red Social Estudiantil & Directorio de Compañeros** | Buscador de pares por nombre, carrera y universidad. Tarjetas de perfil con rangos docentes, estado de amistad dinámico (*Añadir*, *Solicitud Enviada*, *Amigos*) y filtros por institución o ciudad. |
| **F13** | **Monetización Estudiantil, Tutorías 1 a 1 y Rangos Docentes** | Calificación tras cada reunión, rangos de reputación (*Estudiante*, *Aprendiz*, *Profesor*, *Maestro*), habilitación condicional de tarifa horaria (Bs/hr) exclusiva para profesores calificados (≥ 3.0 ⭐) y coordinación por mensajería privada para aprendices. |

---

## 2. Reglas del Negocio Clave

1. **Permisos de Cámara en Sala Virtual:**
   - En una **Clase (`tipo: 'clase'`)**: El facilitador es el único habilitado para transmitir video (`#btnVrCam`), aplicando la pedagogía del Efecto Protégé. Los demás miembros participan por voz y chat.
   - En un **Grupo de Estudio (`tipo: 'grupo'`)**: Todos los miembros tienen control independiente de su cámara web para debate colaborativo.
2. **Dock de Cuaderno en Vivo:**
   - Al unirse a cualquier sala virtual, el sistema crea o enlaza automáticamente el cuaderno correspondiente al tema de la reunión en el dock lateral.
   - Cualquier apunte escrito se sincroniza con `localStorage` y actualiza el indicador de guardado en tiempo real.
3. **Escala de Rangos y Gating de Tarifas:**
   - `0 ⭐`: **Estudiante**
   - `< 3.0 ⭐`: **Aprendiz**
   - `3.0 - 4.0 ⭐`: **Profesor**
   - `> 4.0 ⭐`: **Maestro**
   - **Regla de Tarifa Pública:** Solo usuarios con categoría **Profesor o Maestro (≥ 3.0 ⭐)** pueden fijar su tarifa horaria pública en Bolivianos (`Bs / hora`). Para estudiantes o aprendices, el precio de cualquier ayuda o tutoría se indica como *"A coordinar por privado"* a través de la mensajería interna.
