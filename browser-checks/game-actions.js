import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
resolve(process.cwd());
const server = createAppServer();
let browser;
try {
  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (dialog) => dialog.accept());
  const replace = () =>
    page
      .getByRole("dialog", { name: "Sustituir la partida activa" })
      .getByRole("button", { name: "Continuar sin guardar", exact: true })
      .click();
  const url = `http://127.0.0.1:${server.address().port}/`;
  await page.goto(url);
  await page.evaluate(async () => {
    const e = await import("/src/engine.js"),
      s = await import("/src/core/active-store.js");
    const game = e.createGame(
      Array.from({ length: 8 }, (_, i) => `Jugador ${i + 1}`),
      [
        "washerwoman",
        "chef",
        "empath",
        "fortune_teller",
        "monk",
        "butler",
        "poisoner",
        "imp",
      ],
      { title: "Partida de prueba", random: () => 0.99 },
    );
    e.beginNight(game);
    await s.saveGame(game);
    let next = await s.commit(game, (d) => e.addHistory(d, "Prueba 1"));
    await s.commit(next, (d) => e.addHistory(d, "Prueba 2"));
  });
  await page.reload();
  const bundle = () =>
    page.evaluate(async () => {
      const db = await new Promise((ok, fail) => {
        const r = indexedDB.open("grimorio-base3-active");
        r.onsuccess = () => ok(r.result);
        r.onerror = () => fail(r.error);
      });
      try {
        return await new Promise((ok, fail) => {
          const r = db.transaction("state").objectStore("state").get("active");
          r.onsuccess = () => ok(JSON.stringify(r.result));
          r.onerror = () => fail(r.error);
        });
      } finally {
        db.close();
      }
    });
  const fail = () =>
    page.evaluate(() => {
      window.savedPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function () {
        throw new DOMException("Cuota simulada", "QuotaExceededError");
      };
      const t = document.querySelector("#toast");
      if (t) t.textContent = "";
    });
  const restore = () =>
    page.evaluate(() => {
      IDBObjectStore.prototype.put = window.savedPut;
      delete window.savedPut;
    });
  const noSave = async (action, label) => {
    const before = await bundle();
    await fail();
    await action();
    await page.locator('.save-indicator[data-state="error"]').waitFor();
    await page
      .locator("#toast")
      .filter({ hasText: /No se guardó|Cuota simulada/ })
      .waitFor();
    await restore();
    assert.equal(
      await bundle(),
      before,
      `${label}: no debe cambiar el guardado`,
    );
  };
  await noSave(() => page.locator('[data-action="undo"]').click(), "deshacer");
  await page.locator('[data-action="undo"]').click();
  await page.locator("#toast").filter({ hasText: "Cambio deshecho" }).waitFor();
  await noSave(() => page.locator('[data-action="redo"]').click(), "rehacer");
  await page.locator('[data-action="redo"]').click();
  await page.locator("#toast").filter({ hasText: "Cambio rehecho" }).waitFor();
  await page.getByRole("link", { name: "Diagnóstico", exact: true }).click();
  await noSave(
    () => page.locator('[data-action="restore-checkpoint"]').first().click(),
    "restaurar",
  );
  const beforeRestore = JSON.parse(await bundle());
  await page.locator('[data-action="restore-checkpoint"]').first().click();
  await page
    .locator("#toast")
    .filter({ hasText: "Punto restaurado" })
    .waitFor();
  const restored = JSON.parse(await bundle());
  await page.locator('[data-action="undo"]').click();
  await page.locator("#toast").filter({ hasText: "Cambio deshecho" }).waitFor();
  assert.deepEqual(
    JSON.parse(await bundle()).game,
    beforeRestore.game,
    "Deshacer restaura la partida previa",
  );
  await page.locator('[data-action="redo"]').click();
  await page.locator("#toast").filter({ hasText: "Cambio rehecho" }).waitFor();
  assert.deepEqual(
    JSON.parse(await bundle()).game,
    restored.game,
    "Rehacer recupera el punto restaurado",
  );
  await page.getByRole("link", { name: "Partidas", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Descargar partida actual" }).click(),
  ]);
  const payload = await readFile(await download.path());
  const exported = JSON.parse(payload.toString());
  assert.equal(exported.id, restored.game.id);
  const imported = { ...exported, title: "Partida importada" };
  const file = {
    name: "prueba.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  };
  const beforeInvalid = await bundle();
  await page.locator("#import-file").setInputFiles({
    name: "futuro.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...imported, schemaVersion: 999 })),
  });
  await page.locator("#toast.toast.error").waitFor();
  assert.equal(
    await bundle(),
    beforeInvalid,
    "Un archivo incompatible no altera la partida",
  );
  await page.locator("#import-file").setInputFiles(file);
  await page
    .getByRole("dialog", { name: "Sustituir la partida activa" })
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector("#import-file").value === "",
  );
  assert.equal(await bundle(), beforeInvalid, "Cancelar no altera la partida");
  await noSave(async () => {
    await page.locator("#import-file").setInputFiles(file);
    await replace();
  }, "importar");
  await page.locator("#import-file").setInputFiles(file);
  await replace();
  await page
    .locator("#toast")
    .filter({ hasText: "Partida importada" })
    .waitFor();
  assert.equal(JSON.parse(await bundle()).game.title, "Partida importada");
  const tab = await context.newPage();
  tab.on("dialog", (d) => (d.type() === "prompt" ? d.accept("S") : d.accept()));
  await tab.goto(url);
  await page.getByRole("link", { name: "Noche", exact: true }).click();
  await page.getByRole("button", { name: /Cerrar los ojos y empezar/ }).click();
  await page.locator("#toast").filter({ hasText: "Noche preparada" }).waitFor();
  const latest = await bundle();
  await tab.getByRole("button", { name: /Cerrar los ojos y empezar/ }).click();
  await tab.getByText("otra pestaña", { exact: false }).first().waitFor();
  assert.equal(
    await bundle(),
    latest,
    "La pestaña antigua no sobrescribe los cambios",
  );
  await tab.close();
  await page.getByRole("link", { name: "Grimorio", exact: true }).click();
  await noSave(async () => {
    await page.getByRole("button", { name: "Nueva partida" }).click();
    await replace();
  }, "nueva partida");
  await page.getByRole("button", { name: "Nueva partida" }).click();
  await replace();
  await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
  assert.equal(JSON.parse(await bundle()).game, null);
  assert.deepEqual(errors, []);
  console.log(
    "Acciones de partida: errores de cuota, recuperación reversible, archivos y dos pestañas correctos.",
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((r) => server.close(r));
}
