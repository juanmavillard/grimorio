# Web demo

The demo is the same static application, without a backend, accounts or a multiplayer server. It is available on [GitHub Pages](https://juanmavillard.github.io/grimorio/). The interface and character guidance are in Spanish.

## Build and run locally

With Node >=22.12.0 and Python 3, from the project root:

```bash
npm run demo:build
npm run demo:start
```

Open `http://127.0.0.1:4174`. The server listens only on this machine and serves `output/demo`. Use a separate browser profile to isolate testing from other games. Stop the server with Ctrl+C.

The build checks current resource hashes and copies the files declared in the release manifest, the service worker and third-party notices. It preserves the application's rules and content. Rebuilding synchronises only the generated demo directory.

## Test the prepared output

```bash
npm run test:demo
```

The test serves generated files under `/grimorio/` on a temporary local port and uses fresh Chromium profiles. It checks startup, service-worker scope under a subpath, creation with fictional data for three scripts, persistence across reloads, anonymous diagnostics by default, offline recovery and separate storage for different visitors.

Full rules and interface workflows remain in `npm run test:browser:all`; the demo test checks the prepared output rather than replacing that suite.

## Deploy with GitHub Pages

Serve `output/demo` after running `npm run demo:build`. Do not serve the project root. No server-side installation, secret variables or API are required. Use HTTPS; localhost is a development exception for service workers. Preserve relative paths, correct JavaScript and webmanifest MIME types, and access to the worker and release manifest. Avoid long-lived caches for `sw.js` and `release-manifest.js`.

The workflow `.github/workflows/pages.yml` builds and publishes only `output/demo` when main changes, or when run manually in Actions. Do not commit output or ZIP files to deploy. If a run fails, inspect its logs before assuming the demo has been updated.

## Visitor data

Visitors start with the normal setup screen and default fictional names, then create their own game. No author's game is bundled. Changes are stored in each visitor's browser, not synchronised with other visitors. The interface retains JSON backup import/export.

`127.0.0.1`, `localhost`, different ports and the public domain use separate storage. Data persists across reloads and may remain available offline; closing a tab does not necessarily remove it. Visitors can manage data through Recovery or browser storage settings. Hosting providers may log HTTP requests; the absence of application telemetry does not describe third-party server logs.
