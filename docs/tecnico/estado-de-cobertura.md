# Estado de cobertura · Base 3

Este documento impide confundir datos cargados con reglas ya verificadas. El estado se revisa junto con la auditoría, las pruebas y los recorridos de navegador.

| Guion | Estado | Funcionalidades y recorridos existentes | Qué falta antes de declararlo completo |
| --- | --- | --- | --- |
| Trouble Brewing | Estable como asistente; auditoría abierta | Preparación, reparto, Grimorio, noche, día, ayuda, historial, persistencia y vista pública; un recorrido de navegador hasta la victoria. | Revisar los casos pendientes de personajes e interacciones y sus recorridos de interfaz. |
| Bad Moon Rising | Estable como asistente; auditoría abierta | Preparación y conducción guiada; hay pruebas parciales de sus reglas y un recorrido de navegador de Lunático, Pukka y Exorcista. | Auditar las interacciones pendientes y completar recorridos de partida antes de declararlo completo. |
| Sects & Violets | Estable como asistente; auditoría abierta | Dos recorridos de navegador hasta la victoria: Bruja y Fang Gu; y Vortox con victoria aplazada por el Gemelo. | Revisar las interacciones restantes y ampliar los recorridos de navegador antes de declararlo completo. |

## Significado de los estados

- **Estable como asistente guiado:** catálogo, conducción y pruebas de regresión disponibles. No garantiza que todas las interacciones posibles hayan sido verificadas.
- **En auditoría:** el guion puede aparecer como catálogo y referencia preliminar, pero ninguna sugerencia reemplaza la consulta oficial ni se presenta como resolución automática.
- **Completo:** además de estable, cada personaje dispone de auditoría oficial trazable, ficha, manual, pruebas de interacción, importación compatible, Plaza pública segura y uso offline validado.

La batería incluye partidas automatizadas hasta la victoria en los tres guiones. Trouble Brewing comprueba además copia, recuperación, recarga sin conexión y desbordamiento horizontal del Grimorio en tres anchos. `npm run test:browser:storage` comprueba 250 acciones, fallos simulados en diferentes operaciones, restauración, dos pestañas y limpieza con o sin partida activa. `npm run test:browser:crash` interrumpe una transacción y cierra el proceso de un Chromium de prueba con perfil temporal antes de recuperar el estado confirmado. Las pruebas no verifican un apagado físico, la instalación real ni los datos personales de Safari. Quedan pendientes personajes e interacciones de los tres guiones y la validación manual de accesibilidad. Las comprobaciones automáticas con axe en Chromium y WebKit sí se han ejecutado. Hasta superarlos no se considera cerrado el criterio de «Completo».

## Seguimiento reglamentario

Las 72 fichas mantienen pendiente su auditoría integral. El seguimiento detallado de la revisión anterior identificó 579 casos: 576 pendientes de evidencia de cierre y tres verificados parcialmente en Trouble Brewing. Ese registro es histórico: no es una medición de cobertura de código ni significa que haya 576 errores. La fecha de validación técnica no implica una nueva auditoría individual de esos casos.

| Guion | Personajes | Casos registrados | Pendientes | Verificados |
| --- | --- | --- | --- | --- |
| Trouble Brewing | 22 | 179 | 176 | 3 |
| Bad Moon Rising | 25 | 200 | 200 | 0 |
| Sects & Violets | 25 | 200 | 200 | 0 |

Para cerrar un caso se necesitan fuente oficial, comportamiento esperado, revisión del motor/interfaz y una prueba concreta. Las prioridades son registros especiales, ausencia de habilidad y veneno, sucesiones y cambios de personaje, cadenas de muertes/resurrecciones, victorias y recorridos de interfaz. Se conserva el criterio del Narrador en decisiones ambiguas.

La aplicación es local y no envía analítica ni datos de partida. Las fuentes se enumeran en [Fuentes de reglas](fuentes-reglas.md).

## Evidencia técnica y plataformas

La validación del 20 de noviembre de 2026 supera 196 pruebas Node y los recorridos Chromium de los tres guiones, almacenamiento, cuota, concurrencia, cierre inesperado, borradores, rescate y actualización offline. Electron se comprobó desde fuentes en Mac Apple Silicon con un perfil aislado. Estas comprobaciones no incrementan por sí solas los casos reglamentarios cerrados.

La [matriz de escritorio](escritorio.md) distingue comprobaciones históricas de paquetes de ejecución real. Windows real, Mac Intel, Safari/iOS y accesibilidad manual conservan sus pendientes. Cada nueva entrega de escritorio requiere reconstrucción y validación de sus paquetes.
