# Desarrollo y mantenimiento

Trabaja siempre sobre la raíz de `grimorio`. `output` y `dist` son resultados regenerables; `.local` contiene notas e histórico privados que no deben publicarse.

## Preparar el entorno

Requisitos: Node >=22.12.0, npm y Python 3 para los servidores locales. `.nvmrc` fija la versión comprobada de Node. No es necesario instalar bibliotecas PDF para trabajar en la aplicación web.

```bash
npm ci
npx playwright install chromium
npm start
```

Abre `http://127.0.0.1:4173`. Usa perfiles aislados y nombres ficticios para probar. No utilices una partida personal como fixture o archivo de ejemplo. Exporta tus partidas antes de cambiar de origen o probar migraciones manualmente.

## Hacer una mejora

1. Modifica las fuentes en src, desktop o las herramientas correspondientes, no sus copias generadas.
2. Añade o adapta una prueba cuando corrijas un fallo o cambies comportamiento. Para una regla, documenta fuente, efecto esperado y límites; no confundas una regresión con auditoría completa de personajes.
3. Si cambia la ayuda estructurada, ejecuta `npm run docs:generate`.
4. Si se añaden o retiran módulos, ejecuta `node scripts/check-module-graph.js --write`.
5. Si cambian recursos de aplicación, ejecuta `npm run release:generate`.
6. Ejecuta `npm run check` y el recorrido afectado. Para cambios transversales, ejecuta `npm run test:browser:all`; para escritorio, `npm run test:desktop`.
7. Reconstruye y comprueba la demo con `npm run test:demo` si cambian recursos o preparación web.

No cambies identificador, origen, perfil de Electron o nombres de bases locales por estética: afectan a compatibilidad y acceso a datos. La versión de package.json representa el producto; no debe incrementarse solo por reorganizar documentos.

## Revisar lo que se compartiría

```bash
npm run portfolio:prepare
npm run portfolio:check
```

El ZIP seleccionado debe coincidir con la raíz. Se genera con Python 3, sin instalar bibliotecas adicionales. Una edición posterior exige regenerarla. La raíz es la fuente única para futuros cambios y commits; la copia no es un segundo repositorio de desarrollo.

Cuando se inicialice Git, revisa `git status --short` y `git diff --cached --stat` antes de confirmar cambios. Verifica que no entran `.local`, output, dist, node_modules, credenciales o partidas. No uses `git add -f` para saltar las exclusiones sin revisar el archivo. No se han creado repositorio remoto, commits ni automatismos de publicación con esta preparación.

## Antes de una nueva entrega

- Actualiza README, cobertura y plataformas solo con resultados realmente comprobados.
- Conserva atribuciones y revisa permisos según el contenido que se distribuya. El proyecto continúa `UNLICENSED` hasta una decisión explícita sobre el código propio.
- Regenera resultados desde las fuentes. No reutilices binarios antiguos como si incluyeran las mejoras actuales.
- No publiques fuentes, demo ni ejecutables sin resolver el alcance de distribución acordado con TPI.
