# Organización del proyecto

## Código y documentación

| Ruta | Responsabilidad |
| --- | --- |
| src/app.js | Arranque y composición de la interfaz |
| src/application | Comandos y coordinación de acciones |
| src/core | Motor, almacenamiento, migraciones y proyecciones |
| src/scripts | Datos y políticas de cada guion |
| src/ui | Pantallas, formularios y adaptación de plataforma |
| desktop | Proceso principal, puente, seguridad y configuración de Electron |
| test | Pruebas Node |
| browser-checks | Recorridos de navegador, almacenamiento, offline y escritorio |
| scripts | Comprobaciones, generación y empaquetado |
| docs/manuales | Guías de uso y referencias de personajes |
| docs/entrega | Fuentes de las guías incluidas en los kits locales |
| docs/tecnico | Arquitectura, cobertura, construcción y fuentes |
| .github/workflows | Publicación de la demo con GitHub Actions |

Los puntos de entrada web permanecen en la raíz. `recuperar.html` permite recuperar datos de forma independiente del arranque principal. `src/release.js` y `release-manifest.js` se generan juntos y se versionan para ejecutar y comprobar la aplicación sin una construcción previa.

Las fachadas pequeñas de src mantienen contratos de importación y compatibilidad. Los manuales de personajes se generan desde los datos estructurados y su coherencia forma parte de las comprobaciones.

## Dependencias y resultados generados

| Ruta | Contenido | Cómo obtenerlo |
| --- | --- | --- |
| node_modules | Dependencias de desarrollo | npm ci |
| output/demo | Aplicación web estática | npm run demo:build |
| output/pdf | Referencias para jugadores en PDF | npm run pdf:generate |
| dist | Ejecutables y paquetes de escritorio | npm run desktop:build:mac o desktop:build:win |
| output/entrega | Kits con aplicación y manuales | npm run kit:generate o kit:generate:win |
| output/qa, output/playwright, output/desktop | Resultados de comprobaciones | Recorridos y herramientas correspondientes |

Estos resultados están excluidos de Git. Edita las fuentes y vuelve a generar las salidas cuando cambien sus entradas. `npm run clean` limpia resultados temporales conocidos y comprueba las copias finales antes de retirar ciertas entregas expandidas.

## Exportación opcional de fuentes

```bash
npm run portfolio:prepare
npm run portfolio:check
```

Con Node y Python 3, estas órdenes generan y verifican `output/portfolio-source.zip`. La comprobación valida la integridad del ZIP, su lista de archivos y su contenido contra las fuentes. Regenera la exportación después de hacer cambios. El ZIP es una salida de distribución, no otra carpeta de desarrollo.

## Datos y compatibilidad

Las partidas están en IndexedDB del navegador o del perfil de Electron. Las preferencias pequeñas utilizan almacenamiento local; los JSON exportados son copias que gestiona el usuario.

Un dominio, puerto o navegador distinto utiliza otro almacenamiento. Para cambiar de entorno, exporta e importa la partida. En escritorio se mantienen el origen `grimorio://app`, la identidad de aplicación y el perfil para conservar la compatibilidad entre versiones.

[Desarrollo y mantenimiento](../../CONTRIBUTING.md) · [Arquitectura](arquitectura.md) · [Guardado y recuperación](../manuales/general/guardado-y-recuperacion.md)
