# Ayuda privada del Narrador

## Propósito

La ayuda acompaña una partida sin decidir por el Narrador. Los tres guiones Base 3 disponen de fichas operativas estables como asistencia guiada. Tiene tres capas:

1. **Situación de la mesa**: acciones, anuncios, estados y cambios recientes según la fase.
2. **Ayuda contextual**: desde el Grimorio, una ficha de jugador, un paso nocturno o una nominación.
3. **Referencia completa**: buscador, fichas de personajes y el flujo «Resolver una duda».

No requiere conexión: los enlaces oficiales son solo referencias externas opcionales.

## Fuente de datos y mantenimiento

`src/ui/help.js` es la capa estructurada de las fichas de ayuda. Cada personaje incluye resumen, dirección paso a paso, comportamiento con y sin habilidad, interacciones, ejemplo, error habitual, fuente oficial y referencia al manual correspondiente.

`validateHelpCatalog()` y `test/help.test.js` impiden incorporar un personaje sin estos campos ni estado de auditoría. Los textos son explicaciones propias y concisas; la autoridad reglamentaria sigue siendo la documentación oficial enlazada en [Fuentes de reglas](fuentes-reglas.md).

## Qué se calcula y qué no

`narratorBrief()` y `narratorRelations()` en `src/engine.js` derivan fase, despertares, votos fantasma, protecciones, veneno, Empática, Mayordomo, señuelo y cambios de Demonio. No guardan decisiones nuevas ni modifican la partida.

El Narrador conserva las decisiones no mecánicas: información sin habilidad, registros de Espía/Recluso, redirección del Alcalde y elección narrativa.

## Privacidad

La ayuda y la situación de mesa se renderizan solo en la interfaz privada. La Plaza pública utiliza exclusivamente `townSquareProjection()` y nunca debe renderizar ayuda, estados secretos, notas, objetivos o relaciones. La prueba de proyección pública cubre esta frontera.

## Recorrido de comprobación

1. Ejecuta `npm run check`.
2. Abre una partida y comprueba Grimorio, noche, ayuda y Plaza pública.
3. Busca «veneno», «Virgen», «registro» y «empate».
4. Comprueba una ficha Borracho/envenenado, una nominación y un evento con «¿Por qué?».
5. En pantalla estrecha, confirma que el panel lateral se vuelve legible.
