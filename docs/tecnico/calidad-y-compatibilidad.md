# Testing and compatibility

## Quality checks

```bash
npm ci
npm run check
npm run test:browser:all
npm run test:desktop
npm run desktop:build:mac
npm run test:desktop:package
```

Build Windows packages with `npm run desktop:build:win`; cross-compilation from Mac uses the pinned NSIS toolset. Mac packages are built on macOS. Packaged contents are checked for the explicit target; actual execution must be validated separately on that platform. Generating a Windows executable does not mean it has been tested on Windows.

`npm run check` covers unused variables/imports, formatting, syntax, resource manifests, Markdown links and anchors, technical references, generated character guides, module inventory and cycles, desktop configuration and Node tests. After changing resources, run `npm run release:generate`; after changing structured character guidance or catalogue content, run `npm run docs:generate`. Checks do not silently regenerate source files.

Validation on 20 November 2026 passed 196 Node tests, including preventive regressions for corrupt data, restored setup, privacy, concurrency and recovery. The count is not the number of audited rules cases. [Rules coverage (Spanish)](estado-de-cobertura.md) lists outstanding work.

## Workflows and scope

| npm script | Main coverage |
| --- | --- |
| test:browser | Trouble Brewing through victory: dealing, night, Virgin, Imp succession, voting and files. |
| test:browser:bmr | Bad Moon Rising: Lunatic, Pukka, Exorcist, delayed death and dawn. |
| test:browser:snv | Witch, Fang Gu, Vortox, Evil Twin and deferred game end. |
| test:browser:deal / test:browser:game | Creation, dealing, replacement, file and undo failures. |
| test:browser:storage / test:browser:crash | Quota, concurrency, recovery and unexpected Chromium shutdown. |
| test:browser:consolidation | Timer, focus, drafts, privacy and corrupt data. |
| test:browser:preventive | Restored models, mixed writes, current recovery data and stale cleanup. |
| test:browser:update | PWA versions, interrupted installation and coordinated activation. |
| test:browser:long | 15 players, 1,000/10,000 records, long notes, sizes and latency. |
| test:demo | Prepared static output, subpath, offline recovery and separate visitor profiles. |
| test:desktop / test:desktop:package | Electron lifecycle and workflows, from source and in a real package. |

Tests use isolated profiles and origins with fictional data. The test server is not a business backend. These workflows do not cover every combination of the 72 characters. Generative tests check legal actions and minimum voting/transition activity; service regressions check atomic rejection.

## Storage, migrations and recovery

Game JSON uses schema 4; IndexedDB uses version 2 with state and drafts. Public facades and v1–v3 migrations remain supported. Migrations adapt old data; corrupt v4 data is rejected rather than converting booleans or numbers into history text. Legitimate character transformations are accepted without requiring the current roles to match the initial composition.

The repository saves the game and backups together, with `expectedRevision` and an in-transaction comparison. Undo/redo hold up to ten snapshots per stack and recovery up to three points, subject to a 2 MiB auxiliary budget. The active game is never truncated. Drafts have a 256 KiB per-tab budget. File limits are 50 MiB per game and 200 MiB per recovery bundle; larger exports are warned about rather than truncated.

Recovery preserves current raw data, including damaged originals and drafts with their tab identity. Memory-only drafts remain separate. Cleanup is explicit and does not require a download first. Conflicts do not overwrite another revision.

Desktop export uses a temporary file, synchronisation and rename. Tests cover cancellation, full disk and replacement failure while preserving the previous file. An unconfirmed action is not guaranteed to survive physical power loss.

## Privacy, accessibility and offline use

The public square receives only a public projection. Private notes, roles, states and targets are excluded; dialogs are removed when hiding private information. Anonymous diagnostics use an allowlist and exclude free text and profiles.

`npm run test:browser:offline` checks setup, files, recovery, nights and guidance across the three scripts, mobile sizes and automated WCAG rules with axe. `npm run test:browser:offline:webkit` repeats with WebKit, which must be installed separately through Playwright. Neither replaces actual Safari, iOS or VoiceOver testing.

The PWA requires a complete initial load and resource caching before offline use. Electron includes resources on first launch and does not use the service worker or localhost. Games, analytics and telemetry are not sent by the application.

## Player sheets

The 72 summaries are generated through `publicCharacterSheet(scriptId)`, without game data or private guidance. Markdown and PDF share that projection. PDF generation requires a separate Python environment with `scripts/requirements-pdf.txt`; set `GRIMORIO_PDF_PYTHON` to that interpreter and run `npm run pdf:generate`.

Current tests verify projections of 22/25/25 characters and their allowed fields. Historical PDF validation recorded selectable text, four pages per script and visual review. Each new PDF generation needs extraction and visual review again; earlier results do not automatically validate new PDFs.

## Platform validation

The 20 November 2026 source validation covered Node tests, the full Chromium suite, the prepared demo and Electron development workflows on Apple Silicon Mac. Historical package checks are recorded separately in [Desktop builds (Spanish)](escritorio.md).

Actual Windows and Intel Mac execution, downloaded-package Gatekeeper/SmartScreen behaviour, Safari/iOS, VoiceOver and a new operating-system user remain pending. The desktop matrix and [rules coverage (Spanish)](estado-de-cobertura.md) keep these limits separate from software test results.
