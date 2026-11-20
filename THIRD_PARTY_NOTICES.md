# Authorship and third-party components

## Blood on the Clocktower

Blood on the Clocktower and its content belong to The Pandemonium Institute. This is an independent, unofficial personal project; no publisher approval is claimed.

The project includes names, Spanish summaries, night order, references and game-specific logic. Sources include the [official wiki](https://wiki.bloodontheclocktower.com/), [official resources](https://release.botc.app/resources/) and reference materials linked by [Villacuervos](https://villacuervos.es/). See [Resources and credits](https://github.com/juanmavillard/grimorio/blob/main/docs/tecnico/atribuciones.md) for details.

Public availability of those sources does not by itself determine redistribution conditions for this application. References: [Community Created Content Policy](https://bloodontheclocktower.com/pages/community-created-content-policy) and [Terms of Use](https://bloodontheclocktower.com/pages/terms-of-use).

## Project code

The project is marked `UNLICENSED`. This notice does not grant a reuse licence for the project's own code or game materials. Any future code licence does not automatically extend to third-party content.

## Development tools

Declarations checked against the lockfile and installed packages on 20 November 2026:

| Component | Version | Declared licence |
| --- | --- | --- |
| Electron | 45.2.3 | MIT |
| electron-builder | 26.18.0 | MIT |
| Playwright | 1.63.0 | Apache-2.0 |
| axe-core | 4.14.0 | MPL-2.0 |
| ESLint | 9.39.1 | MIT |
| Prettier | 3.6.2 | MIT |

These tools are not copied into the static web demo. Their licences and notices remain in the installed packages and must be retained as required if redistributed. This summary does not replace those licences. The lockfile records transitive dependency versions and licence declarations.

## Desktop and PDF generation

Electron executables include Chromium and Node.js with their own notices, including `LICENSE` and `LICENSES.chromium.html`. Actual package contents need to be reviewed when preparing a release.

PDF generators declare reportlab 5.1.0, pypdf 7.0.0 and Markdown 3.9 in the requirements file. Those libraries and generated PDFs are not part of the web demo. When redistributing tools or generated materials, review their dependency notices as well.
