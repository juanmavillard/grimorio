# Escritorio: construcción y validación

## Estado de esta documentación

El repositorio contiene fuentes y herramientas de construcción. La última comprobación del 20 de noviembre de 2026 ejecutó Electron desde fuentes en Mac Apple Silicon. Los resultados de paquetes que aparecen más abajo pertenecen al cierre histórico del 7 de noviembre; no certifican paquetes reconstruidos con las fuentes actuales. Para una nueva entrega hay que construir y verificar de nuevo.

## Contrato

Electron y electron-builder son dependencias de desarrollo con versiones exactas en package.json y package-lock.json. Los usuarios finales reciben el runtime incluido. El motor, IndexedDB 2 y el JSON de partida 4 se conservan.

El proceso principal sirve solo los recursos autorizados de `grimorio://app/`. La interfaz usa un preload con aislamiento de contexto, sandbox y sin Node. Los mensajes comprueban origen y ventana. El puente permite consultar versión, exportar JSON mediante una ruta elegida en Guardar como y coordinar el cierre. No permite leer directorios ni escribir rutas arbitrarias. Los enlaces HTTPS se abren fuera de la aplicación; se bloquean otros protocolos y permisos.

Identidad: `local.grimorio.base3`. El perfil persistente es `Grimorio-Base3` bajo la carpeta de datos del usuario del sistema, nunca bajo el ejecutable ni su extracción temporal. Se conserva al actualizar. La aplicación admite una instancia y termina al cerrar su última ventana. Los borradores de escritorio usan la identidad estable `desktop-main`, pues solo hay una ventana del Grimorio.

En escritorio no se registra el service worker: los recursos de una versión son los incluidos en el paquete. La PWA del navegador conserva sus actualizaciones. La exportación es asíncrona y devuelve guardado, cancelación o error; usa archivo temporal, sincronización y renombrado para conservar una copia anterior si falla la escritura.

## Preparar y construir

Requiere Node compatible con las herramientas fijadas (al menos 22.12), npm y acceso a Internet durante la preparación del entorno. Después, el usuario no necesita ninguna herramienta. Ejecuta desde la carpeta del proyecto:

```bash
npm ci
npm run desktop:prepare
npm run desktop:start
npm run release:generate
npm run check
npm run test:browser:all
npm run test:desktop
```

Para Mac ejecuta `npm run desktop:build:mac` desde macOS. Para Windows ejecuta `npm run desktop:build:win`: admite construcción cruzada desde macOS, además de Windows. Se fija NSIS 1.2.1 (makensis 3.12) para disponer de un compilador nativo Apple Silicon; no exige Rosetta ni un cambio del sistema. Los paquetes quedan en dist, junto con SHA256. Las instrucciones vigentes viven en docs/manuales y se incluyen en los ZIP de output/entrega. La generación usa `--publish never` y no configura destinos de publicación. Para comprobar el paquete del sistema actual: `npm run test:desktop:package`.

La lista de inclusión del paquete excluye pruebas, perfiles, copias personales y credenciales. Electron incluye sus avisos de licencia y se incorpora un aviso propio de dependencias. El icono de escritorio deriva del SVG propio del proyecto.

En macOS se entrega un ZIP universal Intel/Apple Silicon; en Windows un ejecutable portable x64 sin elevación. No se contratan certificados ni se notariza. Los avisos de primera apertura son esperables y no se recomienda desactivar las protecciones del sistema.

## Pruebas y matriz histórica de paquetes

Las pruebas de Electron usan perfiles temporales y no abren el perfil personal. `GRIMORIO_DESKTOP_TEST_PROFILE` permite seleccionar explícitamente ese perfil aislado durante una prueba; no debe configurarse en el uso normal.

Comprobar: arranque offline; tres guiones; reparto, ayuda y Plaza; exportación cancelada, guardada y fallida; importación inválida; recuperación; deshacer; cierre mientras se escribe; cierre forzado; segundo doble clic; reapertura y sustitución del paquete conservando datos; contenido del archivo empaquetado y salida sin procesos propios.

| Plataforma | Resultado histórico documentado del cierre del 7 de noviembre de 2026 |
|---|---|
| macOS Apple Silicon | Verificado en macOS 27.2 arm64: desarrollo y aplicación universal empaquetada |
| macOS Intel | Binario x86_64 incluido y comprobado con lipo; ejecución real pendiente |
| Windows x64 | EXE portátil generado desde Mac; contenido, arquitectura PE, payload y SHA-256 comprobados; ejecución real pendiente |

La generación no equivale a prueba de ejecución. Windows se construye desde este Mac ARM; no se ha ejecutado en un Windows real. Tampoco se ha ejecutado en hardware Mac Intel.

Cierre del 7 de noviembre de 2026: `npm run check` supera 196 pruebas y las comprobaciones de sintaxis, enlaces y manifiestos. `npm run test:browser:all` supera los recorridos web completos; también pasa el recorrido offline de WebKit. `npm run test:desktop` y `npm run test:desktop:package` superan los tres guiones, preparación/reparto, primera noche, ayuda, Plaza, deshacer/rehacer, importación/exportación, cancelación y error de archivo, cuota simulada, cierre cancelado por un borrador no guardado, cierre mientras se confirma una escritura, rescate completo desde el diálogo de cierre, segunda instancia y cierre forzado. El recorrido empaquetado traslada además la aplicación y comprueba que conserva los datos del mismo perfil.

El cierre histórico documentó 99 archivos de aplicación coincidentes con las fuentes de aquel momento y las licencias del runtime. Se registró la comprobación x86_64 y arm64 mediante `lipo`; no se repitió aquí sobre un paquete nuevo. Las pruebas usan perfiles temporales del mismo usuario del sistema: no equivalen a una prueba en otra cuenta del sistema ni de la primera apertura de una descarga marcada en cuarentena. Quedan pendientes Gatekeeper/SmartScreen en los equipos destinatarios, Windows real, Mac Intel, usuario nuevo del sistema y accesibilidad manual con VoiceOver.

La salida esperada de una nueva construcción es `dist/Grimorio-Base3-1.0.1-Mac-universal.zip`, con SHA-256 en `dist/SHA256-mac.txt`. Son resultados generados, no archivos incluidos en el repositorio. La construcción ejecuta la puerta de calidad antes de empaquetar y comprueba que cada recurso coincide con las fuentes.

## Mantenimiento

Actualizar Electron dentro de su periodo de soporte y repetir las pruebas antes de distribuir otra versión. No cambiar identificador, origen ni perfil como parte de una actualización rutinaria. La exportación/importación JSON es el único traslado desde perfiles de navegador. No se añade sincronización, asociación global con JSON ni servidor externo.

## Entregas Windows y organización de resultados

`dist` contiene los productos directos del empaquetador: ZIP Mac, EXE Windows, carpetas internas de cada plataforma y sumas SHA-256. Son archivos generados; las carpetas win-unpacked y mac-universal ayudan a verificar el contenido, pero no son el paquete completo de manuales para un destinatario.

`output/pdf` contiene hojas públicas generadas; `output/qa` conserva comprobaciones; `output/entrega` reúne las carpetas y ZIP con programa, manuales y PDF. Ninguna almacena partidas personales: el programa utiliza el perfil del usuario.

El ejecutable Windows es portátil x64, no firmado, sin elevación solicitada. El validador comprueba los encabezados PE, extrae el payload y lo compara con el paquete original. La revisión histórica registró 73 archivos de lanzador y 99 archivos de aplicación en ASAR; los recuentos y las huellas deben comprobarse en cada construcción nueva. También valida nombre, versión, punto de entrada y licencias en sus ubicaciones propias de cada sistema. `signExecutable: false` impide firmar comercialmente pero conserva icono y metadatos propios. El protocolo interno, el identificador y el perfil siguen siendo los mismos. SmartScreen puede advertir sobre el editor desconocido. La prueba real en Windows se realiza con npm run test:desktop:package y un usuario limpio; mientras no se ejecute, permanece pendiente.
