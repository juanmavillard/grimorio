# Development and maintenance

Edit the repository's source files. Build outputs in `output` and `dist` are generated from those sources and excluded from version control.

## Set up

Requirements: Node >=22.12.0, npm and Python 3 for local servers. `.nvmrc` pins the tested Node version. PDF libraries are not required for web development.

```bash
npm ci
npx playwright install chromium
npm start
```

Open `http://127.0.0.1:4173`. Use isolated profiles and fictional names for testing. Never use a personal game as a fixture. Export games before switching origins or testing migrations manually.

## Make a change

1. Edit src, desktop or the relevant tools, rather than generated copies.
2. Add or adjust tests when fixing a bug or changing behaviour. For a rule, document its source, expected effect and limits; a regression test is not a complete character audit.
3. After changing structured character guidance, run `npm run docs:generate`. Generated player guides remain in Spanish.
4. After adding or removing modules, run `node scripts/check-module-graph.js --write`.
5. After changing application resources, run `npm run release:generate`.
6. Run `npm run check` and the affected workflow. For changes across layers, run `npm run test:browser:all`; for desktop changes, run `npm run test:desktop`.
7. Rebuild and test the demo with `npm run test:demo` when changing web resources or packaging.

Keep application identity, origin, Electron profile and database names stable: they affect compatibility and access to existing data. Do not bump the product version for documentation-only changes.

## Documentation languages

The default README and main development documents are in English. Keep `README.md` and `README.es.md` aligned when changing features, requirements, links or limitations. The interface, character guidance, player guides and detailed rules documentation remain in Spanish; do not translate identifiers or generated game content as part of a documentation edit.

Document paths are kept stable even when the text is translated. Follow the language labels in the [documentation index](docs/README.md).

## Publish changes

Review `git status --short` and `git diff --cached --stat` before committing. Keep credentials, personal data and generated outputs out of the repository.

The workflow `.github/workflows/pages.yml` builds and publishes the demo when main is updated. Check its result in Actions. The [demo guide](docs/tecnico/demo-web.md) describes local builds and tests.

## Before a release

- Update the README, coverage and platform information using actual validation results.
- Preserve credits and review the conditions of redistributed content. The code is marked `UNLICENSED`; third-party materials retain their own conditions.
- Regenerate outputs from source. Do not reuse old binaries as if they contained current changes.
- Review the distribution conditions of any newly added material.
