import assert from "node:assert/strict";
import { chromium } from "playwright";
import { RELEASE } from "../src/release.js";
import { serve, seed, readBundle } from "./harness.js";
let next = false,
  fail = false,
  cut = false,
  cutReached,
  releaseCut;
let reached;
const replacement = { ...RELEASE, version: RELEASE.version + "-update-test" };
const host = await serve(async (path) => {
  if (next && path === "/release-manifest.js")
    return { body: `self.GRIMORIO_RELEASE=${JSON.stringify(replacement)};` };
  if (next && path === "/src/release.js")
    return { body: `export const RELEASE=${JSON.stringify(replacement)};` };
  if (next && cut && path === "/src/ui/day-view.js") {
    reached();
    return await new Promise((resolve) => {
      releaseCut = resolve;
    });
  }
  if (next && fail && path === "/src/ui/day-view.js")
    return { status: 503, body: "error de instalación simulado" };
  return null;
});
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(host.url);
  await seed(page);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const before = await readBundle(page);
  const other = await context.newPage();
  await other.goto(host.url);
  await other.getByRole("link", { name: "Grimorio", exact: true }).click();
  await other.locator("[data-player]").first().click();
  await other.locator("#edit-notes").fill("Borrador que bloquea actualización");
  // Una instalación con error no sustituye al controlador ni conserva caché parcial.
  next = true;
  fail = true;
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const changed = new Promise((resolve) =>
      reg.addEventListener(
        "updatefound",
        () => {
          const worker = reg.installing;
          worker.addEventListener("statechange", () => {
            if (worker.state === "redundant") resolve();
          });
        },
        { once: true },
      ),
    );
    await reg.update();
    await changed;
  });
  assert.equal(
    await page.evaluate(
      async () => (await import("/src/release.js")).RELEASE.version,
    ),
    RELEASE.version,
  );
  assert.equal(
    (await page.evaluate(() => caches.keys())).some((k) =>
      k.endsWith("-update-test"),
    ),
    false,
    "Se elimina la caché parcial",
  );
  // Interrumpir una segunda instalación mientras un recurso está en vuelo.
  fail = false;
  cut = true;
  cutReached = new Promise((resolve) => {
    reached = resolve;
  });
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    window.cutInstallation = new Promise((resolve) =>
      reg.addEventListener(
        "updatefound",
        () => {
          const worker = reg.installing;
          worker.addEventListener("statechange", () => {
            if (worker.state === "redundant") resolve();
          });
        },
        { once: true },
      ),
    );
    reg.update();
  });
  await cutReached;
  cut = false;
  fail = true;
  host.server.closeAllConnections();
  releaseCut({ status: 503, body: "transferencia interrumpida" });
  await page.evaluate(() => window.cutInstallation);
  assert.equal(
    (await page.evaluate(() => caches.keys())).some((k) =>
      k.endsWith("-update-test"),
    ),
    false,
  );
  // Corte de red tras instalación fallida: la versión completa anterior continúa abriendo.
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("heading", { name: "Noche 1" }).first().waitFor();
  await context.setOffline(false);
  fail = false;
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const installed = new Promise((resolve) =>
      reg.addEventListener(
        "updatefound",
        () => {
          const worker = reg.installing;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") resolve();
          });
        },
        { once: true },
      ),
    );
    await reg.update();
    await installed;
  });
  await page.getByRole("button", { name: "Actualizar", exact: true }).waitFor();
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await page
    .getByText("borradores de todas las pestañas", { exact: false })
    .waitFor();
  assert.equal(
    await page.evaluate(
      async () => (await import("/src/release.js")).RELEASE.version,
    ),
    RELEASE.version,
  );
  // Descargar/descartar borradores y volver a solicitar actualización.
  other.on("dialog", (d) => d.accept());
  await other.locator('#player-dialog button[value="cancel"]').last().click();
  await other.getByRole("link", { name: "Partidas", exact: true }).click();
  await other
    .getByRole("button", { name: "Descartar borradores", exact: true })
    .click();
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await page.waitForFunction(() =>
    document.documentElement.dataset.release?.endsWith("-update-test"),
  );
  await page.waitForLoadState("load");
  assert.deepEqual(
    (await readBundle(page)).game,
    before.game,
    "Actualizar no altera la partida",
  );
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("heading", { name: "Noche 1" }).first().waitFor();
  assert.equal(
    await page.evaluate(
      async () => (await import("/src/release.js")).RELEASE.version,
    ),
    replacement.version,
  );
  console.log(
    "PWA: instalación fallida, recuperación offline, dos pestañas y activación coordinada correctas.",
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  await host.close();
}
