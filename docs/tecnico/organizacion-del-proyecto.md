# Organización y mantenimiento del proyecto

La carpeta `grimorio` es la única fuente de desarrollo. Edita aquí y conserva las copias preparadas como resultados regenerables. No desarrolles sobre la exportación `output/portfolio-source.zip` ni `output/demo`.

## Lo que se versiona

| Ruta | Responsabilidad |
| --- | --- |
| src/application, src/core, src/scripts, src/ui | Comandos, motor, datos, reglas e interfaz |
| src/app.js | Composición y arranque |
| desktop | Implementación de escritorio, puente, seguridad, iconos y configuración |
| test, browser-checks | Pruebas Node y recorridos de navegador/escritorio |
| scripts | Comprobaciones, generación, empaquetado y preparación |
| docs/manuales | Guías vigentes y referencias generadas |
| docs/entrega | Fuentes de las guías que utiliza el generador de kits |
| docs/tecnico | Arquitectura, pruebas, cobertura, fuentes, atribuciones y mantenimiento |
| README.md, CONTRIBUTING.md | Presentación y ciclo de cambios |
| package.json, package-lock.json, .nvmrc | Herramientas y entorno reproducible |
| .gitignore, .gitattributes, .prettierignore, eslint.config.js | Política de archivos y comprobaciones |

Se conservan los puntos de entrada web en la raíz. `recuperar.html` es una entrada independiente para rescatar datos; no es una copia innecesaria. `src/release.js` y `release-manifest.js` se generan juntos, pero permanecen versionados para permitir ejecutar la aplicación sin una construcción previa.

Las fachadas pequeñas en src conservan contratos de importación y compatibilidad. Los manuales generados son comprobados contra su fuente estructurada: no se retiran solo por ser derivados. Las pruebas se mantienen como parte del proyecto.

## Lo que no se versiona

| Ruta | Contenido | Mantenimiento |
| --- | --- | --- |
| .local/portfolio | Decisiones, revisión de archivos y consulta a TPI | Archivo privado; conservar copia de seguridad propia |
| .local/archivo | Histórico y matriz reglamentaria detallada | Privado; los límites vigentes se resumen en cobertura |
| node_modules | Dependencias instaladas | Recrear con npm ci |
| dist | Ejecutables y productos de empaquetado | Reconstruir y validar según plataforma |
| output/demo | Demo estática | Regenerar con npm run demo:build |
| output/portfolio-source.zip | Copia opcional para revisar los archivos que irían a GitHub | Regenerar con npm run portfolio:prepare; nunca editar aquí |
| output/pdf, output/entrega | PDF y kits generados | Regenerar con los comandos documentados |
| output/qa, output/playwright, output/desktop | Resultados de pruebas y capturas | Temporales; revisar antes de limpiar |

Ignorado por Git no significa cifrado ni copia de seguridad. No publiques la carpeta de trabajo completa mediante un arrastre a GitHub o al alojamiento. La demo debe servir solo su directorio preparado. No añadas claves, perfiles ni partidas personales al código.

## Preparación y comprobación de fuentes

```bash
npm run portfolio:prepare
npm run portfolio:check
```

La primera orden prepara un ZIP con Python 3 a partir de rutas seleccionadas. La segunda comprueba integridad, lista exacta y contenido contra el original: detecta archivos añadidos, perdidos o desactualizados. Ni la carpeta privada ni los resultados/dependencias entran en esa selección. Esta copia sirve para inspección o entrega; el desarrollo futuro se hace en la raíz, que será la raíz del repositorio Git.

La selección no decide permisos de contenido ni licencia. Antes de una publicación real hay que resolver esas cuestiones y revisar el estado de Git.

## Datos y compatibilidad

Las partidas permanecen en IndexedDB del navegador o del perfil de Electron, fuera de las carpetas anteriores. El nombre de carpeta no define el origen web o el perfil de escritorio. No se han cambiado `grimorio://app`, identificador de la aplicación, nombre del perfil ni esquema de almacenamiento.

Al abrir la web en otro dominio, puerto o navegador se usa otro almacenamiento. Exporta una copia desde el origen anterior antes de cambiar. Renombrar la carpeta por sí solo no traslada ni borra partidas.

## Limpieza y construcción

`npm run clean` conserva resultados finales según sus comprobaciones y limpia rutas temporales conocidas; no es una orden de preparación para GitHub. No accede a `.local` ni a los perfiles de juego. No guardes documentos personales en rutas de QA que se puedan limpiar.

PDF y kits: `npm run docs:generate`, `npm run pdf:generate`, `npm run kit:generate` o `npm run kit:generate:win`. Escritorio: `npm run desktop:build:mac` o `npm run desktop:build:win`. La generación no autoriza distribución ni certifica ejecución en otra plataforma.

Consulta [cómo mantener cambios](../../CONTRIBUTING.md), [calidad](calidad-y-compatibilidad.md), [escritorio](escritorio.md) y [cobertura](estado-de-cobertura.md). Los paquetes existentes pueden corresponder a versiones anteriores: reconstruirlos antes de una nueva entrega.
