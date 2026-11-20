# Project structure

## Source and documentation

| Path | Responsibility |
| --- | --- |
| src/app.js | Startup and interface composition |
| src/application | Commands and action coordination |
| src/core | Engine, storage, migrations and projections |
| src/scripts | Script-specific data and policies |
| src/ui | Screens, forms and platform adaptation |
| desktop | Electron main process, bridge, security and configuration |
| test | Node tests |
| browser-checks | Browser, storage, offline and desktop workflows |
| scripts | Checks, generation and packaging |
| docs/manuales | Spanish user guides and character references |
| docs/entrega | Spanish guide sources included in local distribution kits |
| docs/tecnico | Architecture, coverage, builds and sources; languages listed in the documentation index |
| .github/workflows | Demo deployment through GitHub Actions |

Web entry points stay at the root. `recuperar.html` provides recovery independently of the main startup flow. `src/release.js` and `release-manifest.js` are generated together and committed so the application can run and be checked without a build step first.

Small facade modules in src preserve import contracts and compatibility. Character guides are generated from structured data and checked for consistency.

## Dependencies and generated outputs

| Path | Contents | How to generate |
| --- | --- | --- |
| node_modules | Development dependencies | npm ci |
| output/demo | Static web application | npm run demo:build |
| output/pdf | Player reference PDFs | npm run pdf:generate |
| dist | Desktop executables and packages | npm run desktop:build:mac or desktop:build:win |
| output/entrega | Application and guide kits | npm run kit:generate or kit:generate:win |
| output/qa, output/playwright, output/desktop | Validation outputs | Relevant workflows and tools |

These outputs are excluded from Git. Edit source files and regenerate outputs when their inputs change. `npm run clean` removes known temporary results and verifies final copies before removing certain expanded distribution kits.

## Optional source export

```bash
npm run portfolio:prepare
npm run portfolio:check
```

With Node and Python 3, these commands create and verify `output/portfolio-source.zip`. Verification checks ZIP integrity, the exact file list and contents against source files. Regenerate after making changes. The ZIP is a distribution output, not another development directory.

## Data and compatibility

Games are stored in IndexedDB in the browser or Electron profile. Small preferences use local storage; exported JSON files are backups managed by the user.

A different domain, port or browser uses separate storage. Export and import the game when changing environments. Desktop versions preserve the `grimorio://app` origin, application identity and profile for compatibility.

[Development guide](../../CONTRIBUTING.md) · [Architecture](arquitectura.md) · [Saving and recovery (Spanish)](../manuales/general/guardado-y-recuperacion.md)
