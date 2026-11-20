# Preparación de la demo web

La demo es la misma aplicación estática, sin backend, cuentas ni servidor de partidas. Disponible en [GitHub Pages](https://juanmavillard.github.io/grimorio/).

## Construir y abrir

Con Node >=22.12.0 y Python 3, desde la raíz:

```bash
npm run demo:build
npm run demo:start
```

Abre `http://127.0.0.1:4174`. El servidor solo escucha en este equipo y solo sirve `output/demo`. Usa un perfil de navegador separado si quieres aislar estas pruebas de otras partidas. Para detenerlo: Ctrl+C.

La construcción verifica las huellas actuales y copia únicamente los archivos declarados en el manifiesto de recursos, el service worker y el aviso de terceros. No modifica las reglas ni sustituye contenido. El resultado contiene los recursos web de ejecución y el aviso de terceros. Al reconstruir se sincroniza únicamente el contenido de la carpeta generada de la demo.

## Probar el resultado preparado

```bash
npm run test:demo
```

La prueba sirve los archivos generados bajo `/grimorio/` con un puerto local temporal y perfiles nuevos de Chromium. Comprueba inicio, service worker bajo subruta, creación con datos ficticios en tres guiones, persistencia tras recarga, diagnóstico anónimo predeterminado, recuperación offline y separación de almacenamiento entre visitantes. No usa partidas personales.

Los recorridos completos de reglas e interfaz se mantienen en `npm run test:browser:all`; la prueba de demo verifica el resultado preparado, no reemplaza esa batería.

## Publicación en GitHub Pages

Directorio a servir: `output/demo`, tras ejecutar `npm run demo:build`. No publicar la raíz del proyecto. No requiere instalación en el servidor, variables secretas ni API. Usar HTTPS; localhost es una excepción de desarrollo para service workers. Mantener rutas relativas, tipos MIME correctos para JavaScript y webmanifest, y acceso al service worker y al manifiesto de versión. Evitar caché prolongada de `sw.js` y `release-manifest.js`.

Se prueba una subruta para permitir alojamientos de proyecto. El flujo `.github/workflows/pages.yml` construye y publica únicamente `output/demo` al subir cambios a main, o mediante ejecución manual en Actions. No hay que subir output o ZIP al repositorio. Si una ejecución falla, revisar sus registros antes de dar por actualizada la demo.

## Datos de visitantes

El visitante empieza en la preparación normal con nombres ficticios predeterminados y crea su partida. No se incorpora una partida del autor. Los cambios se guardan en su navegador, no se sincronizan con otros visitantes. La interfaz conserva la opción de exportar/importar copias JSON.

`127.0.0.1`, `localhost`, distintos puertos o un futuro dominio tendrán almacenamiento separado. El contenido se mantiene al recargar y puede seguir disponible offline; no se promete que desaparezca al cerrar la pestaña. El visitante puede gestionarlo mediante Recuperación o las opciones de almacenamiento del navegador. El proveedor de alojamiento podría registrar peticiones HTTP; la ausencia de telemetría de aplicación no es una promesa sobre registros de terceros.
