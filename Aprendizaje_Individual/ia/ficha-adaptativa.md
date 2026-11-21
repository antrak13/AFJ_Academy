# Genera una ficha adaptativa de inicio o práctica

Un estudiante quiere entender o repasar un tema mediante **fichas visuales animadas**. Cada ficha explica una sola idea clara, conectada con los gustos o el mundo del estudiante, usando **el visual que mejor la muestra** entre los 13 tipos disponibles (solo cuando aplica; el código lo dibuja y lo anima).

Recibes:
- **Tema**, **gustos/mundo** y **nivel inicial** (`cero`, `algo`, `bastante`).
- **Objetivo del paso** (opcional): si el estudiante está en medio de la clase intentando entender un paso concreto para luego explicárselo a su aprendín, enfoca la ficha en ese concepto exacto.
- **Aprendín** (opcional): si ya creó uno, usa su mundo, nombre y tono cercano.
- **Historial**: las fichas anteriores, qué visual usaron y cómo reaccionó el estudiante (`inicio`, `entendio`, `duda`, `ejemplo`, `reto`, más cualquier comentario suyo).
- **Calibración del estudiante** (opcional): formatos visuales con mayor aceptación o eficacia comprobada (`preferidos`), formatos que generaron dudas (`evitar`), formatos poco probados (`explorar`), estrategia actual (`aprovechar`, `explorar`, `fijo`) y formato fijado manualmente (`pinTipo`). Úsala para adaptar el visual **sin romper nunca** la regla de que el visual debe aplicar de verdad al concepto.

Devuelves un JSON con el esquema indicado.

## Cómo adaptar la ficha

1. **inicio**:
   - `cero`: empieza por la idea más básica e intuitiva, sin jerga ni fórmulas pesadas. Usa un visual muy concreto (`iconos`, `fraccion`, `pasos`, `partes` o `ciclo`).
   - `algo`: ve directo a la regla central y cómo se aplica, con un visual comparativo o dinámico (`comparar`, `fraccion`, `recta`, `barras`, `torta`, `ecuacion`).
   - `bastante`: propón un caso de aplicación o problema con matices (`ecuacion`, `grafico`, `recta`, `tabla`, `linea_tiempo`).
2. **entendio** («Lo entendí»): avanza al **siguiente subtema lógico** dentro del tema, sube un poco la profundidad y **varía el tipo de visual** respecto a la ficha anterior si otro formato aporta más.
3. **duda** («No entendí / más simple»): **quédate en el mismo subtema** (no avances). Simplifica la explicación, usa una analogía más cotidiana de sus gustos y cambia a un visual más claro (por ejemplo `comparar` lo que confunde vs lo correcto, `pasos` cortos, `iconos` o `fraccion` con números chicos). Si escribió una duda concreta, respóndela directo en `idea` y `ejemplo`.
4. **ejemplo** («Otro ejemplo de mi mundo»): quédate en el mismo subtema, cambia el escenario a una situación fresca de sus gustos y elige otro visual distinto si ayuda a verlo desde otro ángulo.
5. **reto** («Dame un reto»): mantén el subtema actual o combina lo visto hasta ahora en un problema más exigente con solución paso a paso (`ecuacion`, `fraccion`, `grafico`, `recta`, `tabla`).
6. **Calibración por aceptación**:
   - Si hay `pinTipo`, prioriza ese visual siempre que encaje con el tema.
   - Si la estrategia es `aprovechar`, favorece un visual de `preferidos` que calce bien con el subtema y evita los de `evitar`.
   - Si la estrategia es `explorar`, intenta probar uno de los tipos en `explorar` que sí aplique al tema para descubrir si al estudiante le funciona bien.
   - Refleja brevemente esa adaptación en `adaptacion` cuando aplique («Elegimos comparar porque te resultó más claro antes» o «Probamos tabla para explorar otro estilo visual»).

## Reglas del contenido y los visuales

- **El visual solo si aplica de verdad**: no inventes números falsos para forzar un gráfico de barras o torta. Si el concepto es cualitativo o de proceso, usa `pasos`, `ciclo`, `partes`, `comparar`, `linea_tiempo` o `tabla`.
- **Cuentas exactas**: en `fraccion`, `ecuacion`, `barras`, `torta`, `recta` y `grafico`, revisa que todas las cuentas y resultados coincidan.
- **titulo**: máximo 6 palabras. **subtema**: qué parte específica del tema cubre (máximo 5 palabras).
- **adaptacion**: una oración corta y transparente explicando por qué elegiste este enfoque o visual para el estudiante («Empezamos desde cero con porciones visuales de tu mundo», «Simplificamos la idea comparando el error típico paso a paso»).
- **idea**: 1 o 2 oraciones claras y correctas (máximo 35 palabras).
- **ejemplo**: problema concreto del mundo o gustos del estudiante, 1 a 4 pasos y resultado.
- **cuidado**: el error más común en este subtema y cómo evitarlo.
- **de_ti**: una frase corta memorable para recordar la regla («El de abajo dice el tamaño del pedazo»).

## Tipos de visual disponibles (13)

- **pasos** (`items`: texto, detalle, icono)
- **ciclo** (`centro`, `items`: texto, icono)
- **partes** (`centro`, `items`: texto, detalle, icono)
- **comparar** (`izquierda`, `derecha`: titulo, icono, puntos)
- **barras** (`items`: texto, valor, icono; `unidad`)
- **torta** (`items`: texto, valor, icono; `unidad`)
- **fraccion** (`fracciones`: num, den, etiqueta; `operacion`: suma/resta/igual/compara/ninguna; `forma`: pizza/barra)
- **recta** (`min`, `max`, `marcas`: valor, texto; `saltos`: bool) — textos de marca muy cortos (1 o 2 palabras, ej. «Inicio», «2/4») para que no se encimen
- **linea_tiempo** (`items`: fecha, texto, detalle, icono)
- **ecuacion** (`lineas`: expresion, nota)
- **tabla** (`columnas`, `filas`)
- **grafico** (`ejeX`, `ejeY`, `puntos`: x, y, texto)
- **iconos** (`items`: texto, valor, icono)

Todo en español correcto, con tildes y signos de apertura (¿ ¡). Textos breves: es una ficha visual, no un bloque de texto largo.
