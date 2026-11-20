# Inventario de módulos

Generado por `node scripts/check-module-graph.js --write`. Cada archivo conserva una responsabilidad; las fachadas son contratos de compatibilidad, no duplicados para eliminar. Los índices Markdown son navegación. Los artefactos de dist y output se generan por separado y no contienen fuentes únicas.

| Módulo | Responsabilidad |
| --- | --- |
| [browser-checks/active-store.js](../../browser-checks/active-store.js) | Prueba / soporte de pruebas |
| [browser-checks/bad-moon-rising.js](../../browser-checks/bad-moon-rising.js) | Prueba / soporte de pruebas |
| [browser-checks/consolidation.js](../../browser-checks/consolidation.js) | Prueba / soporte de pruebas |
| [browser-checks/deal-storage.js](../../browser-checks/deal-storage.js) | Prueba / soporte de pruebas |
| [browser-checks/demo.js](../../browser-checks/demo.js) | Prueba / soporte de pruebas |
| [browser-checks/desktop.js](../../browser-checks/desktop.js) | Prueba / soporte de pruebas |
| [browser-checks/game-actions.js](../../browser-checks/game-actions.js) | Prueba / soporte de pruebas |
| [browser-checks/harness.js](../../browser-checks/harness.js) | Prueba / soporte de pruebas |
| [browser-checks/long-games.js](../../browser-checks/long-games.js) | Prueba / soporte de pruebas |
| [browser-checks/offline-accessibility.js](../../browser-checks/offline-accessibility.js) | Prueba / soporte de pruebas |
| [browser-checks/preventive.js](../../browser-checks/preventive.js) | Prueba / soporte de pruebas |
| [browser-checks/pwa-update.js](../../browser-checks/pwa-update.js) | Prueba / soporte de pruebas |
| [browser-checks/sects-and-violets.js](../../browser-checks/sects-and-violets.js) | Prueba / soporte de pruebas |
| [browser-checks/sects-twins.js](../../browser-checks/sects-twins.js) | Prueba / soporte de pruebas |
| [browser-checks/storage-crash.js](../../browser-checks/storage-crash.js) | Prueba / soporte de pruebas |
| [browser-checks/trouble-brewing.js](../../browser-checks/trouble-brewing.js) | Prueba / soporte de pruebas |
| [desktop/files.js](../../desktop/files.js) | Escritorio / aislamiento |
| [desktop/main.js](../../desktop/main.js) | Escritorio / aislamiento |
| [desktop/preload.cjs](../../desktop/preload.cjs) | Escritorio / aislamiento |
| [desktop/security.js](../../desktop/security.js) | Escritorio / aislamiento |
| [scripts/build-friend-kit.js](../../scripts/build-friend-kit.js) | Herramienta de mantenimiento |
| [scripts/build-player-pdfs.js](../../scripts/build-player-pdfs.js) | Herramienta de mantenimiento |
| [scripts/build-release.js](../../scripts/build-release.js) | Herramienta de mantenimiento |
| [scripts/check-app-shell.js](../../scripts/check-app-shell.js) | Herramienta de mantenimiento |
| [scripts/check-desktop-package.js](../../scripts/check-desktop-package.js) | Herramienta de mantenimiento |
| [scripts/check-desktop.js](../../scripts/check-desktop.js) | Herramienta de mantenimiento |
| [scripts/check-docs.js](../../scripts/check-docs.js) | Herramienta de mantenimiento |
| [scripts/check-module-graph.js](../../scripts/check-module-graph.js) | Herramienta de mantenimiento |
| [scripts/check-syntax.js](../../scripts/check-syntax.js) | Herramienta de mantenimiento |
| [scripts/check-windows-package.js](../../scripts/check-windows-package.js) | Herramienta de mantenimiento |
| [scripts/clean-generated.js](../../scripts/clean-generated.js) | Herramienta de mantenimiento |
| [scripts/desktop-build.js](../../scripts/desktop-build.js) | Herramienta de mantenimiento |
| [scripts/export-player-sheets.js](../../scripts/export-player-sheets.js) | Herramienta de mantenimiento |
| [scripts/generate-character-manuals.js](../../scripts/generate-character-manuals.js) | Herramienta de mantenimiento |
| [scripts/prepare-portfolio.js](../../scripts/prepare-portfolio.js) | Herramienta de mantenimiento |
| [src/app.js](../../src/app.js) | Composición de interfaz |
| [src/application/commands.js](../../src/application/commands.js) | Servicio de aplicación |
| [src/application/errors.js](../../src/application/errors.js) | Servicio de aplicación |
| [src/application/night-resolution.js](../../src/application/night-resolution.js) | Servicio de aplicación |
| [src/application/night-validation.js](../../src/application/night-validation.js) | Servicio de aplicación |
| [src/application/player-commands.js](../../src/application/player-commands.js) | Servicio de aplicación |
| [src/application/service.js](../../src/application/service.js) | Servicio de aplicación |
| [src/core/active-store.js](../../src/core/active-store.js) | Núcleo / datos / proyección |
| [src/core/diagnostic-export.js](../../src/core/diagnostic-export.js) | Núcleo / datos / proyección |
| [src/core/engine.js](../../src/core/engine.js) | Núcleo / datos / proyección |
| [src/core/events.js](../../src/core/events.js) | Núcleo / datos / proyección |
| [src/core/game-files.js](../../src/core/game-files.js) | Núcleo / datos / proyección |
| [src/core/legacy-data.js](../../src/core/legacy-data.js) | Núcleo / datos / proyección |
| [src/core/migrations.js](../../src/core/migrations.js) | Núcleo / datos / proyección |
| [src/core/player-materials.js](../../src/core/player-materials.js) | Núcleo / datos / proyección |
| [src/core/preferences.js](../../src/core/preferences.js) | Núcleo / datos / proyección |
| [src/core/read-models.js](../../src/core/read-models.js) | Núcleo / datos / proyección |
| [src/core/recovery-store.js](../../src/core/recovery-store.js) | Núcleo / datos / proyección |
| [src/core/scripts.js](../../src/core/scripts.js) | Núcleo / datos / proyección |
| [src/core/store.js](../../src/core/store.js) | Núcleo / datos / proyección |
| [src/core/utils.js](../../src/core/utils.js) | Núcleo / datos / proyección |
| [src/data.js](../../src/data.js) | Fachada pública / compatibilidad |
| [src/engine.js](../../src/engine.js) | Fachada pública / compatibilidad |
| [src/help.js](../../src/help.js) | Fachada pública / compatibilidad |
| [src/migrations.js](../../src/migrations.js) | Fachada pública / compatibilidad |
| [src/other-scripts.js](../../src/other-scripts.js) | Fachada pública / compatibilidad |
| [src/presets.js](../../src/presets.js) | Fachada pública / compatibilidad |
| [src/release.js](../../src/release.js) | Generado |
| [src/scripts.js](../../src/scripts.js) | Fachada pública / compatibilidad |
| [src/scripts/bad-moon-rising/ability-policy.js](../../src/scripts/bad-moon-rising/ability-policy.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/data.js](../../src/scripts/bad-moon-rising/data.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/day-policy.js](../../src/scripts/bad-moon-rising/day-policy.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/death-policy.js](../../src/scripts/bad-moon-rising/death-policy.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/information.js](../../src/scripts/bad-moon-rising/information.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/night-policy.js](../../src/scripts/bad-moon-rising/night-policy.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/player-reference.js](../../src/scripts/bad-moon-rising/player-reference.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/rules.js](../../src/scripts/bad-moon-rising/rules.js) | Paquete de guion |
| [src/scripts/bad-moon-rising/setup-policy.js](../../src/scripts/bad-moon-rising/setup-policy.js) | Paquete de guion |
| [src/scripts/sects-and-violets/ability-policy.js](../../src/scripts/sects-and-violets/ability-policy.js) | Paquete de guion |
| [src/scripts/sects-and-violets/data.js](../../src/scripts/sects-and-violets/data.js) | Paquete de guion |
| [src/scripts/sects-and-violets/day-policy.js](../../src/scripts/sects-and-violets/day-policy.js) | Paquete de guion |
| [src/scripts/sects-and-violets/death-policy.js](../../src/scripts/sects-and-violets/death-policy.js) | Paquete de guion |
| [src/scripts/sects-and-violets/information.js](../../src/scripts/sects-and-violets/information.js) | Paquete de guion |
| [src/scripts/sects-and-violets/night-policy.js](../../src/scripts/sects-and-violets/night-policy.js) | Paquete de guion |
| [src/scripts/sects-and-violets/player-reference.js](../../src/scripts/sects-and-violets/player-reference.js) | Paquete de guion |
| [src/scripts/sects-and-violets/rules.js](../../src/scripts/sects-and-violets/rules.js) | Paquete de guion |
| [src/scripts/sects-and-violets/setup-policy.js](../../src/scripts/sects-and-violets/setup-policy.js) | Paquete de guion |
| [src/scripts/trouble-brewing/ability-policy.js](../../src/scripts/trouble-brewing/ability-policy.js) | Paquete de guion |
| [src/scripts/trouble-brewing/data.js](../../src/scripts/trouble-brewing/data.js) | Paquete de guion |
| [src/scripts/trouble-brewing/day-policy.js](../../src/scripts/trouble-brewing/day-policy.js) | Paquete de guion |
| [src/scripts/trouble-brewing/death-policy.js](../../src/scripts/trouble-brewing/death-policy.js) | Paquete de guion |
| [src/scripts/trouble-brewing/information.js](../../src/scripts/trouble-brewing/information.js) | Paquete de guion |
| [src/scripts/trouble-brewing/night-policy.js](../../src/scripts/trouble-brewing/night-policy.js) | Paquete de guion |
| [src/scripts/trouble-brewing/player-reference.js](../../src/scripts/trouble-brewing/player-reference.js) | Paquete de guion |
| [src/scripts/trouble-brewing/presets.js](../../src/scripts/trouble-brewing/presets.js) | Paquete de guion |
| [src/scripts/trouble-brewing/rules.js](../../src/scripts/trouble-brewing/rules.js) | Paquete de guion |
| [src/scripts/trouble-brewing/setup-policy.js](../../src/scripts/trouble-brewing/setup-policy.js) | Paquete de guion |
| [src/store.js](../../src/store.js) | Fachada pública / compatibilidad |
| [src/ui/day-actions.js](../../src/ui/day-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/day-view.js](../../src/ui/day-view.js) | Interfaz / adaptación de plataforma |
| [src/ui/deal-actions.js](../../src/ui/deal-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/desktop-fallback.js](../../src/ui/desktop-fallback.js) | Interfaz / adaptación de plataforma |
| [src/ui/desktop-lifecycle.js](../../src/ui/desktop-lifecycle.js) | Interfaz / adaptación de plataforma |
| [src/ui/diagnostic-actions.js](../../src/ui/diagnostic-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/dialogs.js](../../src/ui/dialogs.js) | Interfaz / adaptación de plataforma |
| [src/ui/drafts.js](../../src/ui/drafts.js) | Interfaz / adaptación de plataforma |
| [src/ui/form-adapters.js](../../src/ui/form-adapters.js) | Interfaz / adaptación de plataforma |
| [src/ui/game-actions.js](../../src/ui/game-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/grimoire-actions.js](../../src/ui/grimoire-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/grimoire-view.js](../../src/ui/grimoire-view.js) | Interfaz / adaptación de plataforma |
| [src/ui/help-markup.js](../../src/ui/help-markup.js) | Interfaz / adaptación de plataforma |
| [src/ui/help.js](../../src/ui/help.js) | Interfaz / adaptación de plataforma |
| [src/ui/navigation.js](../../src/ui/navigation.js) | Interfaz / adaptación de plataforma |
| [src/ui/night-actions.js](../../src/ui/night-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/night-controls.js](../../src/ui/night-controls.js) | Interfaz / adaptación de plataforma |
| [src/ui/night-view.js](../../src/ui/night-view.js) | Interfaz / adaptación de plataforma |
| [src/ui/pending-actions.js](../../src/ui/pending-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/phase-timer.js](../../src/ui/phase-timer.js) | Interfaz / adaptación de plataforma |
| [src/ui/platform.js](../../src/ui/platform.js) | Interfaz / adaptación de plataforma |
| [src/ui/public-square.js](../../src/ui/public-square.js) | Interfaz / adaptación de plataforma |
| [src/ui/pwa.js](../../src/ui/pwa.js) | Interfaz / adaptación de plataforma |
| [src/ui/recovery.js](../../src/ui/recovery.js) | Interfaz / adaptación de plataforma |
| [src/ui/setup-actions.js](../../src/ui/setup-actions.js) | Interfaz / adaptación de plataforma |
| [src/ui/setup-views.js](../../src/ui/setup-views.js) | Interfaz / adaptación de plataforma |
| [src/ui/shared-controls.js](../../src/ui/shared-controls.js) | Interfaz / adaptación de plataforma |
| [src/ui/shell.js](../../src/ui/shell.js) | Interfaz / adaptación de plataforma |
| [src/ui/support-views.js](../../src/ui/support-views.js) | Interfaz / adaptación de plataforma |
| [test/base3.test.js](../../test/base3.test.js) | Prueba / soporte de pruebas |
| [test/command-invariants.test.js](../../test/command-invariants.test.js) | Prueba / soporte de pruebas |
| [test/compatibility-closure.test.js](../../test/compatibility-closure.test.js) | Prueba / soporte de pruebas |
| [test/consolidation.test.js](../../test/consolidation.test.js) | Prueba / soporte de pruebas |
| [test/day-policies.test.js](../../test/day-policies.test.js) | Prueba / soporte de pruebas |
| [test/death-transitions.test.js](../../test/death-transitions.test.js) | Prueba / soporte de pruebas |
| [test/desktop.test.js](../../test/desktop.test.js) | Prueba / soporte de pruebas |
| [test/engine.test.js](../../test/engine.test.js) | Prueba / soporte de pruebas |
| [test/help.test.js](../../test/help.test.js) | Prueba / soporte de pruebas |
| [test/migrations.test.js](../../test/migrations.test.js) | Prueba / soporte de pruebas |
| [test/module-boundaries.test.js](../../test/module-boundaries.test.js) | Prueba / soporte de pruebas |
| [test/presets.test.js](../../test/presets.test.js) | Prueba / soporte de pruebas |
| [test/preventive.test.js](../../test/preventive.test.js) | Prueba / soporte de pruebas |
| [test/store.test.js](../../test/store.test.js) | Prueba / soporte de pruebas |
