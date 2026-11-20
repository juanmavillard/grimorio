# Autoría y componentes de terceros

## Blood on the Clocktower

Blood on the Clocktower y su contenido pertenecen a The Pandemonium Institute. Este asistente es un proyecto personal independiente y no oficial; no se declara aprobado por el editor.

El proyecto incorpora nombres, resúmenes en español, orden nocturno, referencias y lógica específica basada en el juego. Fuentes: wiki oficial (https://wiki.bloodontheclocktower.com/), recursos oficiales (https://release.botc.app/resources/) y materiales de consulta enlazados por Villacuervos (https://villacuervos.es/). La procedencia detallada se documenta en el repositorio.

La disponibilidad pública de esas fuentes no determina por sí sola las condiciones de redistribución de esta aplicación. Referencias: [política comunitaria](https://bloodontheclocktower.com/pages/community-created-content-policy) y [términos de uso](https://bloodontheclocktower.com/pages/terms-of-use).

## Código propio

El proyecto está declarado `UNLICENSED`. Este aviso no concede una licencia de reutilización del código propio ni de los materiales del juego. No se extiende una eventual licencia del código a contenido de terceros.

## Herramientas de desarrollo

Declaraciones verificadas en el bloqueo y los paquetes instalados el 20 de noviembre de 2026:

| Componente | Versión | Licencia declarada |
| --- | --- | --- |
| Electron | 45.2.3 | MIT |
| electron-builder | 26.18.0 | MIT |
| Playwright | 1.63.0 | Apache-2.0 |
| axe-core | 4.14.0 | MPL-2.0 |
| ESLint | 9.39.1 | MIT |
| Prettier | 3.6.2 | MIT |

Estas herramientas no se copian a la demo web estática. Sus licencias y avisos permanecen en los paquetes instalados; si se redistribuyen, deben conservarse los textos exigidos. Este resumen no sustituye sus licencias. El bloqueo conserva versiones y declaraciones de las dependencias transitivas.

## Escritorio y PDF

Los ejecutables Electron incorporan Chromium y Node.js con sus propios avisos, incluidos `LICENSE` y `LICENSES.chromium.html`; los paquetes requieren revisión de sus archivos reales.

Los generadores PDF declaran reportlab 5.1.0, pypdf 7.0.0 y Markdown 3.9 en el archivo de requisitos. Esas bibliotecas y los PDF no forman parte de la demo web. Al redistribuir herramientas o materiales generados, deben revisarse también los avisos de sus dependencias.
