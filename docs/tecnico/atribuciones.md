# Revisión de procedencia y publicación

Revisión del 20 de noviembre de 2026. Inventario de evidencias y pendientes, no certificación jurídica ni autorización de distribución.

## Contenido y recursos

| Material | Archivos | Procedencia comprobable | Estado |
| --- | --- | --- | --- |
| Nombres y habilidades de 72 personajes | `src/scripts/*/data.js` | Datos en código y referencias a wiki y recursos oficiales | Redistribución pendiente de aclarar con TPI |
| Ayuda y explicaciones reglamentarias | `src/ui/help.js`, referencias de guion y manuales | Documentación declara consulta de fuentes oficiales y materiales enlazados por Villacuervos | No certificada la autoría de cada traducción o paráfrasis |
| Reglas y orden de fases | Motor y políticas de guion | Implementación propia sobre el juego, fuentes documentadas | No equiparar autoría de la implementación con permiso sobre todo el contenido |
| Manuales generados | `docs/manuales/` | Derivan del contenido de la ayuda | Se conservan sujetos al permiso sobre ese contenido; el PDF histórico queda fuera del repositorio |
| Icono de la aplicación | `icon.svg`, `desktop/assets/` | Documentación declara SVG propio; no se ha certificado autoría mediante historial | No se han añadido iconos oficiales ni capturas del juego |
| Diagrama del README | Bloque Mermaid | Preparado a partir de la arquitectura examinada | No reproduce imágenes del juego |

[Fuentes reglamentarias](fuentes-reglas.md) conserva referencias. Su afirmación histórica de “resúmenes propios” no sustituye una verificación fragmento a fragmento. Las fuentes descargables no conceden por sí solas permiso para cualquier uso: [política comunitaria](https://bloodontheclocktower.com/pages/community-created-content-policy), [términos](https://bloodontheclocktower.com/pages/terms-of-use) y [recursos](https://release.botc.app/resources/).

## Dependencias

El bloqueo contiene 358 entradas con licencia declarada: MIT (261), ISC (41), Apache-2.0 (20), BSD-2-Clause (11), BSD-3-Clause (10), BlueOak-1.0.0 (8), y una entrada de cada una de Python-2.0, MPL-2.0, WTFPL OR ISC, WTFPL, 0BSD, (MIT OR CC0-1.0) y (WTFPL OR MIT).

Las seis dependencias directas instaladas tienen archivos de licencia; Playwright, Prettier y axe-core incluyen también avisos de terceros. [Avisos del proyecto](../../THIRD_PARTY_NOTICES.md). No se ha validado aquí todo el contenido de esos avisos, dependencias binarias, fuentes tipográficas o dependencias Python transitivas.

La demo no copia paquetes npm ni bibliotecas Python. Los ejecutables necesitan sus avisos de runtime; no se reconstruyen ni se dan por listos para distribuir. El código propio sigue `UNLICENSED`; elegir una licencia de reutilización es una decisión pendiente de Juanma y no una condición ya aceptada con el editor.

## Selección de archivos

`npm run portfolio:prepare` genera `output/portfolio-source.zip` con código, pruebas, herramientas, metadatos, avisos y documentación pública. Es un ZIP de inspección, no un archivo que se deba subir como único contenido del repositorio. Usa raíces y extensiones seleccionadas, rechaza enlaces simbólicos y excluye el archivo privado `.local`, dependencias instaladas, perfiles, carpetas generadas y archivos ocultos no seleccionados. No crea Git, commits ni subidas.

`.gitignore` incluye exclusiones para `.local`, correspondencia interna, entornos locales, claves, logs y resultados de pruebas. Es una ayuda para archivos nuevos; no retira archivos ya versionados. Una revisión final del contenido y del futuro estado de Git sigue siendo necesaria antes de publicar.

El chequeo textual de preparación no encontró patrones típicos de claves privadas o tokens en las fuentes seleccionadas. No constituye un escáner exhaustivo de secretos ni verifica el contenido de todos los PDF o binarios. Los contactos de TPI en documentación son públicos, no credenciales. No se han copiado archivos de partidas del usuario.

La selección mantiene el producto completo: no elimina reglas, guiones, catálogos o manuales para simular una herramienta genérica. Su preparación no acredita que todo su contenido esté autorizado para distribución.

## Pendientes antes de publicar

- La consulta se ha enviado según confirmación de Juanma; registrar el alcance de la respuesta cuando llegue.
- Decidir licencia del código propio y completar avisos según el contenido finalmente distribuido.
- Revisar textos, PDF y recursos cuya procedencia o permiso no está certificado.
- Revisar la selección final y el estado de Git antes de nuevos commits.
- Comprobar el estado del despliegue GitHub Pages después de actualizar main.

No se añaden capturas al README en este paso. Se usa el diagrama técnico; imágenes del juego requerirían revisión independiente. No se prepara vídeo ni caso de estudio.
