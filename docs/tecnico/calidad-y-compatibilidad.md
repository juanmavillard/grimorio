# Calidad y compatibilidad

## Puerta de calidad

```bash
npm ci
npm run check
npm run test:browser:all
npm run test:desktop
npm run desktop:build:mac
npm run test:desktop:package
```

La construcción Windows es `npm run desktop:build:win` y puede ejecutarse desde Mac mediante el toolset NSIS fijado. El paquete Mac se genera en macOS. El contenido empaquetado se comprueba para el destino explícito; la ejecución real se valida por separado en el sistema de destino. No se declara probado en Windows por el mero hecho de generarlo.

`npm run check` incluye variables e importaciones sin uso, formato de módulos, sintaxis, manifiesto de recursos, enlaces y anclas Markdown, referencias técnicas, catálogo generado, inventario sin ciclos, configuración de escritorio y pruebas Node. Después de editar recursos ejecuta `npm run release:generate`; después de editar ayuda o catálogo, `npm run docs:generate`. Las comprobaciones nunca regeneran silenciosamente las fuentes.

La consolidación 1.0.1 supera 196 pruebas Node, incluidas las regresiones preventivas. El recuento procede de la salida de npm run check; no equivale al número de casos reglamentarios cerrados. Las regresiones cubren datos corruptos, preparación recuperada, privacidad, concurrencia y rescate; los casos reglamentarios pendientes se resumen en el [estado de cobertura](estado-de-cobertura.md).

## Recorridos y alcance

| Orden | Cobertura principal |
| --- | --- |
| test:browser | Trouble Brewing hasta victoria: reparto, noche, Virgen, pase, votos y archivos. |
| test:browser:bmr | Bad Moon Rising: Lunático, Pukka, Exorcista, muerte diferida y amanecer. |
| test:browser:snv | Bruja, Fang Gu, Vortox, Gemelos y final aplazado. |
| test:browser:deal / test:browser:game | Fallos de creación, reparto, sustitución, archivos y deshacer. |
| test:browser:storage / test:browser:crash | Cuota, concurrencia, recuperación y cierre inesperado de Chromium. |
| test:browser:consolidation | Reloj, foco, borradores, privacidad y datos corruptos. |
| test:browser:preventive | Modelo recuperado, escrituras mixtas, rescate actual y limpieza obsoleta. |
| test:browser:update | Versiones PWA, instalación interrumpida y activación coordinada. |
| test:browser:long | 15 jugadores, 1.000/10.000 registros, notas extensas, tamaños y latencia. |
| test:desktop / test:desktop:package | Ciclo de vida y flujos sobre Electron y su paquete real. |

Las pruebas utilizan perfiles y orígenes aislados; nunca datos personales. El servidor compartido de pruebas no es un servidor de negocio. Los recorridos completos no cubren todas las combinaciones de los 72 personajes. Las pruebas generativas comprueban acciones legales y mínimos de votos y transiciones; las regresiones reales del servicio verifican rechazos atómicos.

## Datos, migraciones y recuperación

El JSON de partida sigue en 4; IndexedDB en 2, con state y drafts. Se conservan las fachadas públicas y las migraciones de v1-v3. Las migraciones adaptan información antigua; un v4 corrupto se rechaza en lugar de convertir falsos o números en textos de historial. Se admiten transformaciones legítimas sin exigir que el reparto actual coincida con la composición inicial.

El repositorio guarda conjuntamente partida y copias, con expectedRevision y comparación dentro de la transacción. Deshacer/rehacer tienen hasta diez instantáneas y recuperación hasta tres, sujetos a 2 MiB auxiliares. La partida activa nunca se recorta. Los borradores tienen 256 KiB por pestaña. Los archivos admiten 50 MiB por partida y 200 MiB por rescate; las exportaciones mayores se advierten sin truncarlas.

El rescate conserva los datos crudos actuales, incluidos originales dañados y borradores con su identidad de pestaña. Los borradores en memoria permanecen separados. La limpieza es explícita y no obliga a una descarga previa. Los conflictos no sobrescriben otra revisión.

La exportación de escritorio usa temporal, sincronización y renombrado. Se prueban cancelación, disco lleno y fallo al sustituir, manteniendo la copia anterior. No se promete conservar una acción no confirmada ante apagado físico.

## Privacidad, accesibilidad y offline

La Plaza recibe solo una proyección pública. Las notas, roles, estados y objetivos privados no se incluyen; los diálogos externos se retiran al tapar. Los diagnósticos anónimos usan una lista cerrada y no contienen textos libres ni perfiles.

`npm run test:browser:offline` verifica preparación, archivos, recuperación, noches y ayuda en los tres guiones, tamaños móviles y reglas automáticas WCAG con axe. `npm run test:browser:offline:webkit` repite con WebKit, que debe instalarse con Playwright. Ninguna sustituye Safari real, iOS o VoiceOver.

La PWA requiere completar la primera carga y cachear recursos antes del uso sin red. Electron incluye todo desde el primer inicio, sin worker ni localhost. No se envían partidas, analítica o telemetría.

## Hojas para jugadores

Los 72 resúmenes se generan desde publicCharacterSheet(scriptId), sin argumento de partida ni ayuda privada. Markdown y PDF comparten esa proyección. Para preparar el generador de PDF usa un entorno Python separado e instala `scripts/requirements-pdf.txt`; define GRIMORIO_PDF_PYTHON con su intérprete y ejecuta `npm run pdf:generate`.

Las pruebas actuales verifican las proyecciones de 22/25/25 personajes y la lista cerrada de campos. La validación histórica de PDF registró texto seleccionable, cuatro páginas por guion y revisión visual. Cada nueva generación requiere repetir la extracción y revisión visual; los resultados de una generación anterior no validan automáticamente los PDF nuevos.

## Pendientes externos

Windows real, Mac Intel, primera apertura de paquetes descargados con Gatekeeper/SmartScreen, Safari/iOS, VoiceOver y usuario nuevo del sistema permanecen pendientes hasta ejecutarse. La [matriz de escritorio](escritorio.md) y el [estado reglamentario](estado-de-cobertura.md) separan estos límites de los resultados técnicos.
