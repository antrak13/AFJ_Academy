-- Datos de demo: un curso real de anatomía y fisiología con dos clases de Khan Academy
-- (Salud y medicina, audio en inglés). En la plataforma, un tema es un curso y cada video una
-- clase; las preguntas de los puntos de control las define la plataforma.
--
-- Licencia: Khan Academy publica sus videos con CC BY-NC-SA. Las copias en Wikimedia Commons
-- figuran como CC BY-SA 4.0; se registra la más restrictiva. Uso no comercial (prototipo).
-- Fuentes:
--   https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/heart-introduction/v/flow-through-the-heart
--   https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/lung_introduction/v/meet-the-lungs
insert into public.topics (id, titulo, descripcion) values
  ('00000000-0000-4000-8000-000000000001', 'Anatomía y fisiología: corazón y pulmones',
   'Cómo circula la sangre por el corazón y cómo los pulmones intercambian oxígeno y dióxido de carbono. Clases de Khan Academy (audio en inglés).')
on conflict (id) do update set titulo = excluded.titulo, descripcion = excluded.descripcion;

insert into public.concepts (id, topic_id, nombre) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Venas y arterias'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Recorrido de la sangre por el corazón'),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 'Anatomía de los pulmones'),
  ('00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000001', 'Intercambio de gases')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.videos (id, topic_id, url, titulo, duracion, licencia, orden) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
   'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e5/Flow_through_the_Heart.webm/Flow_through_the_Heart.webm.480p.vp9.webm',
   'Clase 1 · Cómo fluye la sangre por el corazón', 470, 'Khan Academy · CC BY-NC-SA', 1),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001',
   'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/78/Meet_the_lungs.webm/Meet_the_lungs.webm.480p.vp9.webm',
   'Clase 2 · Conoce los pulmones', 576, 'Khan Academy · CC BY-NC-SA', 2)
on conflict (id) do update set url = excluded.url, titulo = excluded.titulo, duracion = excluded.duracion,
  licencia = excluded.licencia, orden = excluded.orden;

-- Cada pregunta va justo después de que la clase explica su tema.
insert into public.checkpoints (id, video_id, concept_id, segundo, pregunta, opciones, correcta, explicacion, revisado) values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000011', 165,
   'Según la clase, ¿qué distingue a una vena de una arteria?',
   '["La vena lleva la sangre hacia el corazón; la arteria la aleja del corazón", "La vena lleva sangre sin oxígeno; la arteria, sangre con oxígeno", "La vena es más gruesa que la arteria"]',
   0, 'La clase las define por la dirección: vena = hacia el corazón, arteria = lejos del corazón. Por eso las venas pulmonares llevan sangre con oxígeno y aun así son venas.', true),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000012', 315,
   'Desde el ventrículo derecho, ¿hacia dónde sigue la sangre?',
   '["Por la válvula aórtica hacia la aorta", "Por la válvula pulmonar hacia las arterias pulmonares, rumbo a los pulmones", "De vuelta a la aurícula derecha por la válvula tricúspide", "Directo a la aurícula izquierda"]',
   1, 'El lado derecho manda la sangre sin oxígeno a los pulmones: ventrículo derecho → válvula pulmonar → arterias pulmonares.', true),
  ('00000000-0000-4000-8000-000000001005', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000012', 462,
   '¿Cuál es el orden correcto en el lado izquierdo del corazón?',
   '["Ventrículo izquierdo → válvula mitral → aurícula izquierda → aorta", "Aurícula izquierda → válvula tricúspide → ventrículo izquierdo → arteria pulmonar", "Aurícula izquierda → válvula mitral → ventrículo izquierdo → válvula aórtica → aorta"]',
   2, 'La sangre con oxígeno vuelve de los pulmones a la aurícula izquierda, pasa la válvula mitral al ventrículo izquierdo y sale por la válvula aórtica a la aorta.', true),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000013', 285,
   '¿Por qué el pulmón izquierdo tiene dos lóbulos y el derecho tres?',
   '["Porque el corazón ocupa espacio a la izquierda (la escotadura cardíaca)", "Porque el pulmón izquierdo no intercambia gases", "Porque la tráquea se desvía hacia la derecha"]',
   0, 'El corazón está un poco a la izquierda y deja una muesca, la escotadura cardíaca; por eso el pulmón izquierdo es más pequeño y tiene dos lóbulos.', true),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000013', 345,
   '¿Qué músculo, debajo de los pulmones, permite que se llenen de aire?',
   '["La laringe", "El diafragma", "La tráquea", "El corazón"]',
   1, 'El diafragma está bajo los pulmones, separando el tórax del abdomen: al contraerse, los pulmones se expanden y entra el aire.', true),
  ('00000000-0000-4000-8000-000000001006', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000014', 566,
   '¿Qué ocurre en los alvéolos?',
   '["El aire se calienta antes de entrar a los bronquios", "El oxígeno pasa a la sangre y el dióxido de carbono sale de ella", "Se produce la voz", "La sangre se filtra y se limpia"]',
   1, 'Los alvéolos son los sacos al final del árbol bronquial: ahí el oxígeno entra a la sangre y el dióxido de carbono sale para ser exhalado.', true)
on conflict (id) do update set video_id = excluded.video_id, concept_id = excluded.concept_id, segundo = excluded.segundo,
  pregunta = excluded.pregunta, opciones = excluded.opciones, correcta = excluded.correcta, explicacion = excluded.explicacion,
  revisado = excluded.revisado;
