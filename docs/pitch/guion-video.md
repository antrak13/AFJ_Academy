# Video de la demo · AFJ Academy

Dos versiones:

- **Video principal (unos 2:10):** para la entrega o para mostrar aparte.
- **Corte para el pitch (45–60 s):** si lo intercalan en la lámina 6 de la presentación. En ese caso, en vivo se salta la lámina 6 y se recorta la 7.

La historia es la misma que la de la presentación: el problema, el estudiante crea su aprendín, le enseña, el aprendín se equivoca y evoluciona, la prueba en equipo, el profe lo ve, sirve para todos y el cierre.

## Antes de grabar

1. **Respuestas instantáneas:** levanta el servidor con `cd Aprendizaje_Individual && npm run ensayo`. Haz un ensayo completo una vez, con los mismos textos que vas a escribir al grabar. La segunda vez, cada respuesta de la IA sale al instante, porque se guarda y se repite si el pedido es idéntico. **Escribe exactamente lo mismo**, porque un cambio de una letra vuelve a llamar a la IA.
2. **Navegador limpio:** usa una ventana de invitado o un perfil nuevo para que no aparezcan aprendines viejos. Pantalla en 1920×1080, zoom del navegador al 110–125 %, sin barra de marcadores ni pestañas extra.
3. **Voz:** el aprendín habla en voz alta. Graba el audio del sistema si quieres que se escuche; si no, apágalo con «Voz: sí».
4. **Panel docente con datos:** levanta la plataforma (`cd Aprendizaje_Grupal/Rua && npm run dev`, más el servidor de Aprendines).
   - Crea una cuenta con el rol **Docente** y un aula «6.º A» con el tema «fracciones».
   - Registra 3 alumnos.
   - En una ventana privada, entra con uno de esos alumnos (usuario y PIN) y enséñale 1 o 2 pasos a su aprendín, para que el panel tenga datos reales.
5. **Nada privado en pantalla:** ni la terminal, ni `.env.local`, ni tu correo. Si se ve un PIN, que sea el de un alumno de prueba.

## Escenas del video principal

| # | Tiempo | Pantalla | Qué se hace | Texto en pantalla / voz |
|---|---|---|---|---|
| 1 | 0:00–0:08 | Presentación, lámina 2 | Graba la animación del 91 % y el aula de 30 | «91 de cada 100 estudiantes de 6.º no alcanzan el mínimo en matemática. ¿Y si en vez de explicarles, les pedimos que enseñen?» |
| 2 | 0:08–0:30 | `taller.html` | Escribe **«Dragon Ball y el básquet»** y **«fracciones»** → «Crear mi aprendín» → responde 1 o 2 preguntas → «¡Que nazca!» → golpea el huevo 3 veces → «¡Nació Kori!» | «Cada estudiante crea su aprendín con lo que le gusta. No sabe nada: tú le vas a enseñar.» Si aceleras la espera, pon «×4» en una esquina |
| 3 | 0:30–1:05 | `clase.html` | «Empezar a enseñarle» → Kori saluda → escribe la explicación (textos abajo) → Kori pregunta y comete el error típico → lo corriges → «¡Lo entendió!» → Kori evoluciona y aparece la ficha | Acerca la imagen en 3 momentos: el error típico, la evolución y el panel «Lo que midió la IA» con su nota para el profe. Voz: «Para corregirlo, tienes que entender de verdad.» |
| 4 | 1:05–1:20 | `clase.html`, «Apoyo visual» | Abre la ficha del paso → «No entendí / más simple» u «Otro ejemplo de mi mundo» → aparece otra ficha animada | «Si no sabes cómo explicarlo, te ayuda con ejemplos de tu mundo.» |
| 5 | 1:20–1:40 | `clase.html?ejemplo=prueba` | «Hacer la prueba juntos» → Kori propone una respuesta (la trampa) → eliges la correcta y lo salvas → resultado → «Descargar postal» | «Al final rinden juntos una prueba, y tú lo salvas de la trampa.» |
| 6 | 1:40–1:55 | `docente.html` | Entra como docente → aula 6.º A → «Debilidades del aula» con la nota de la IA → toca a un alumno → «Necesitan ayuda» | «El profe ve en qué paso se traba cada uno, sin esperar al examen.» |
| 7 | 1:55–2:05 | `taller.html` y `fichas.html` | Montaje rápido: «O elige un mundo listo» con todos los aprendines, y una ficha con otro tema (por ejemplo «ecuaciones lineales» con «fútbol»). Si Rua tiene un clip del estudio grupal, 3–4 s aquí | «Del colegio a la universidad, con tus amigos y tu aula.» |
| 8 | 2:05–2:12 | Presentación, lámina 10 | Graba la animación final | «No es otra app que te enseña. Es la app donde tú enseñas.» |

### Textos para la clase (escena 3)

Úsalos tal cual en el ensayo y en la grabación, para que el modo ensayo repita las respuestas:

1. `Una fracción es partir algo en partes iguales. Si partes una pizza en 4 pedazos iguales, cada uno es 1/4.`
2. `Tienen que ser del mismo tamaño. Si un pedazo es más grande, ya no es un cuarto.`
3. Cuando Kori se equivoque, corrígelo explicando el porqué. Anota en el ensayo la frase exacta que usaste y repítela al grabar.

Si en el ensayo Kori no comete el error en el primer paso, sigue al segundo paso, porque comete uno por paso, y graba ese.

## Corte para el pitch (45–60 s)

Escena 2 (10 s, acelerada) → escena 3 (25 s: explicar, error típico, corrección, evolución) → escena 5 (10 s: lo salva de la trampa) → escena 6 (10 s: panel docente). Sin placas de problema ni de cierre, porque esas ya las dice la presentación.

## Al editar

- **Subtítulos siempre:** el jurado puede verlo sin sonido.
- **Esperas:** acelera las esperas de la IA y márcalo («×4»). No las cortes de forma que parezca instantáneo si no lo es; si el jurado pregunta, la respuesta es que en producción se usa la API directa y es más rápida.
- **Zoom** en lo que cuenta la historia: el error típico, la evolución, la nota para el profe y la debilidad del aula.
- **Música** suave y baja, que no tape la voz del aprendín.
- **Exporta** en MP4 (H.264), 1080p, y súbelo como enlace no listado por si el video local falla en la presentación.
