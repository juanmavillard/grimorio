# Preparación local de una carpeta de juego

## Objetivo y alcance

`npm run kit:generate` prepara una carpeta Mac y `npm run kit:generate:win` una carpeta Windows, ambas independientes del repositorio. Incluye la aplicación ya construida, un portal HTML offline con navegación por perfiles, manuales de juego y uso y tres PDF públicos. No publica ni envía nada. Las condiciones de distribución se explican en [Versión y uso](../entrega/version-y-uso.md); preparar el archivo no concede permiso para compartirlo.

## Fuentes de contenido

- [Entrada y recorridos](../entrega/empieza-aqui.md), [orden de lectura](../entrega/que-leer.md), [primera sesión](../entrega/primera-partida.md) y [uso rápido](../entrega/uso-rapido.md).
- Los manuales vigentes de docs/manuales, convertidos a HTML. Los enlaces se reescriben a destinos incluidos; no se copian las auditorías ni documentos técnicos para los jugadores.
- Las tres hojas públicas generadas desde publicCharacterSheet. Se exige que cada PDF tenga cuatro páginas.
- La aplicación Mac universal de dist/mac-universal o el EXE portátil de dist, con su ASAR de dist/win-unpacked verificado contra las fuentes y su suma SHA-256.

## Generación

Primero genera y comprueba el paquete de la plataforma elegida siguiendo [Escritorio](escritorio.md) y genera los PDF siguiendo [Calidad](calidad-y-compatibilidad.md). Instala scripts/requirements-pdf.txt en un entorno Python separado y define GRIMORIO_PDF_PYTHON con su intérprete:

```bash
npm run docs:check
npm run kit:generate
npm run kit:generate:win
```

La orden usa ese intérprete o python3. La entrega Mac requiere macOS. La de Windows puede prepararse desde Mac o Windows con el ejecutable ya generado. Se requieren Node de mantenimiento y las dependencias de generación; los destinatarios no necesitan estas herramientas. El generador no cambia partidas, IndexedDB ni perfiles.

## Resultado

En output/entrega se crean una carpeta Grimorio-Base3-version-Mac o Grimorio-Base3-version-Windows, un ZIP con esa carpeta y un SHA-256 del ZIP. EMPIEZA-AQUI.html permite elegir un recorrido: jugador, Narrador nuevo o Narrador que conoce las reglas. LEEME.txt permite orientarse sin un lector Markdown. Los HTML no usan scripts, fuentes remotas ni servidores; las referencias oficiales externas sí requieren Internet.

La entrega Mac incluye la .app para abrir desde Finder; la entrega Windows incluye el EXE portátil. No hay otro ZIP interior ni herramientas de desarrollo. Las cabeceras identifican la plataforma. El EXE se ha generado y su contenido puede verificarse desde Mac; la ejecución real en Windows sigue pendiente.

El manifiesto conserva hashes de archivos y fuentes, enlaces simbólicos y versión. La regeneración solo reemplaza una carpeta reconocida como generada y se detiene ante archivos añadidos manualmente. No guardes copias de partidas dentro de esta carpeta generada.

## Comprobaciones

El generador comprueba versión de la aplicación, recursos empaquetados, enlaces HTML locales y anclas, las cuatro páginas de cada PDF y enlaces simbólicos internos. La copia Mac conserva permisos y estructura mediante ditto; Windows copia el ejecutable validado y utiliza un ZIP estándar. El archivo se comprime conservando la carpeta raíz. No se incluyen el repositorio, perfiles, exportaciones de juego ni dependencias de desarrollo.

La revisión de la entrega añade apertura real de los HTML locales sin conexión, tamaños de portátil y móvil, integridad del ZIP y permisos del ejecutable. Estos controles complementan las pruebas existentes del paquete Mac; no equivalen a ejecutarlo en Windows, Mac Intel u otro usuario del sistema. Los límites reglamentarios vigentes se recogen en el [estado de cobertura](estado-de-cobertura.md).
