import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { resolve } from "node:path";
import { chromium } from "playwright";
resolve(process.cwd());
const server = createAppServer();
let browser;
try {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const result = await page.evaluate(async () => {
    const store = await import("/src/core/active-store.js");
    const engine = await import("/src/engine.js");
    let game = engine.createGame(
      Array.from({ length: 11 }, (_, i) => `Jugador ${i + 1}`),
      [
        "washerwoman",
        "chef",
        "empath",
        "fortune_teller",
        "monk",
        "mayor",
        "virgin",
        "butler",
        "poisoner",
        "scarlet_woman",
        "imp",
      ],
      { random: () => 0.99 },
    );
    await store.openActiveStore();
    await store.saveGame(game);
    for (let i = 0; i < 250; i++)
      game = await store.commit(game, (draft) =>
        engine.addHistory(
          draft,
          `Acción ${i}`,
          "Prueba de guardado prolongado",
        ),
      );
    const latest = game.history.length;
    const recovered = await store.openActiveStore();
    const before = recovered.history.length;
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Sin espacio", "QuotaExceededError");
    };
    let failed = false;
    try {
      await store.commit(recovered, (draft) =>
        engine.addHistory(draft, "No debe guardarse"),
      );
    } catch {
      failed = true;
    } finally {
      IDBObjectStore.prototype.put = original;
    }
    const after = (await store.openActiveStore()).history.length;
    let rejectedImport = false;
    try {
      await store.importGame({
        schemaVersion: 4,
        editionId: "base3",
        scriptId: "trouble_brewing",
        players: [],
        phase: "night",
      });
    } catch {
      rejectedImport = true;
    }
    const afterInvalidImport = (await store.openActiveStore()).history.length;
    const snapshots = store.loadRecoveryPoints(game.id);
    const points = snapshots.length;
    let undone = await store.undo(recovered);
    let redone = await store.redo(undone);
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Sin espacio", "QuotaExceededError");
    };
    let restoreFailed = false;
    try {
      await store.restoreRecoveryPoint(game.id, snapshots[0].id);
    } catch {
      restoreFailed = true;
    } finally {
      IDBObjectStore.prototype.put = original;
    }
    const afterFailedRestore = (await store.openActiveStore()).history.length;
    const restored = await store.restoreRecoveryPoint(game.id, snapshots[0].id);
    const restoredRecord = restored.history[0].text;
    const undoRestored = await store.undo(restored);
    const redoRestored = await store.redo(undoRestored);
    const recoveryUndo = undoRestored.history.length;
    const recoveryRedo = redoRestored.history[0].text;
    await store.saveGame(recovered);
    return {
      latest,
      before,
      after,
      failed,
      rejectedImport,
      afterInvalidImport,
      points,
      restoreFailed,
      afterFailedRestore,
      restoredRecord,
      recoveryUndo,
      recoveryRedo,
      undo: undone.history.length,
      redo: redone.history.length,
    };
  });
  assert.equal(result.before, result.latest);
  assert.equal(result.after, result.latest);
  assert.equal(result.failed, true);
  assert.ok(result.points <= 3);
  assert.equal(result.undo, result.latest - 1);
  assert.equal(result.redo, result.latest);
  assert.equal(result.rejectedImport, true);
  assert.equal(result.afterInvalidImport, result.latest);
  assert.equal(result.restoreFailed, true);
  assert.equal(result.afterFailedRestore, result.latest);
  assert.equal(result.restoredRecord, "Punto de recuperación restaurado.");
  assert.equal(result.recoveryUndo, result.latest);
  assert.equal(result.recoveryRedo, result.restoredRecord);
  const failures = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    const e = await import("/src/engine.js");
    let game = await s.openActiveStore();
    game = await s.commit(game, (d) =>
      e.addHistory(d, "Preparación de prueba de fallos"),
    );
    const readBundle = async () => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("grimorio-base3-active");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const value = await new Promise((resolve, reject) => {
        const req = db.transaction("state").objectStore("state").get("active");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return JSON.stringify(value);
    };
    const failures = [];
    async function rejectWrite(name, action, mode = "quota") {
      const before = await readBundle(),
        original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        if (mode === "abort") {
          this.transaction.abort();
          return original.apply(this, args);
        }
        throw new DOMException(
          "Espacio agotado de prueba",
          "QuotaExceededError",
        );
      };
      let rejected = false;
      try {
        await action();
      } catch {
        rejected = true;
      } finally {
        IDBObjectStore.prototype.put = original;
      }
      failures.push({
        name,
        rejected,
        unchanged: before === (await readBundle()),
      });
    }
    await rejectWrite("acción", () =>
      s.commit(game, (d) => e.addHistory(d, "No guardar")),
    );
    await rejectWrite("guardar", () =>
      s.saveGame({ ...game, title: "No guardar" }),
    );
    await rejectWrite("importar", () =>
      s.importGame({ ...game, title: "No importar" }),
    );
    await rejectWrite("restaurar", () =>
      s.restoreRecoveryPoint(game.id, s.loadRecoveryPoints(game.id)[0].id),
    );
    await rejectWrite("deshacer", () => s.undo(game));
    await rejectWrite("vaciar", () => s.clearGame());
    await rejectWrite(
      "transacción interrumpida",
      () => s.commit(game, (d) => e.addHistory(d, "Abortada")),
      "abort",
    );
    game = await s.undo(game);
    await rejectWrite("rehacer", () => s.redo(game));
    return failures;
  });
  for (const item of failures) {
    assert.equal(item.rejected, true, `${item.name}: debe informar del error`);
    assert.equal(
      item.unchanged,
      true,
      `${item.name}: no debe alterar el guardado`,
    );
  }
  const unavailableContext = await browser.newContext();
  await unavailableContext.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException(
        "Almacenamiento no disponible",
        "QuotaExceededError",
      );
    };
  });
  const unavailablePage = await unavailableContext.newPage();
  await unavailablePage.goto(`http://127.0.0.1:${server.address().port}/`);
  await unavailablePage
    .getByText("No se pudo abrir el almacenamiento", { exact: false })
    .first()
    .waitFor();
  assert.ok(
    await unavailablePage
      .getByRole("link", { name: "Abrir recuperación de partidas" })
      .isVisible(),
  );
  await unavailableContext.close();
  const secondPage = await page.context().newPage();
  await secondPage.goto(`http://127.0.0.1:${server.address().port}/`);
  await secondPage.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    await s.openActiveStore();
  });
  await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    const e = await import("/src/engine.js");
    const game = await s.openActiveStore();
    await s.commit(game, (d) => e.addHistory(d, "Cambio en primera pestaña"));
  });
  const conflict = await secondPage.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    try {
      await s.clearGame();
      return false;
    } catch (error) {
      return /otra pestaña/.test(error.message);
    }
  });
  assert.equal(
    conflict,
    true,
    "Una pestaña antigua no debe sobrescribir una partida más reciente.",
  );
  await page.evaluate(() => {
    localStorage.setItem(
      "grimorio.base3.games.v1",
      JSON.stringify([{ id: "antigua" }]),
    );
    localStorage.setItem("grimorio.base3.formations.v1", "[]");
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/recuperar.html`);
  await page
    .getByRole("heading", {
      name: "Datos actuales de este dispositivo",
      exact: true,
    })
    .waitFor();
  await page.getByText("Partida activa", { exact: false }).first().waitFor();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Borrar partidas y copias anteriores" })
    .click();
  await page.getByText("Datos antiguos borrados.", { exact: false }).waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("grimorio.base3.games.v1")),
    null,
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("grimorio.base3.formations.v1"),
    ),
    "[]",
  );
  const active = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return await new Promise((resolve) => {
      const r = db.transaction("state").objectStore("state").get("active");
      r.onsuccess = () => resolve(r.result?.game?.id);
    });
  });
  assert.ok(active, "La limpieza debe conservar la partida activa.");
  assert.equal(
    await page.getByText("Punto de recuperación", { exact: false }).count(),
    0,
  );
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  await emptyPage.goto(
    `http://127.0.0.1:${server.address().port}/recuperar.html`,
  );
  await emptyPage.evaluate(() =>
    localStorage.setItem(
      "grimorio.base3.games.v1",
      JSON.stringify([{ id: "anterior" }]),
    ),
  );
  emptyPage.once("dialog", (dialog) => dialog.accept());
  await emptyPage
    .getByRole("button", { name: "Borrar partidas y copias anteriores" })
    .click();
  await emptyPage
    .getByText("No hay ninguna partida activa.", { exact: false })
    .waitFor();
  assert.equal(
    await emptyPage.evaluate(() =>
      localStorage.getItem("grimorio.base3.games.v1"),
    ),
    null,
  );
  await emptyContext.close();
  const migrationContext = await browser.newContext();
  const migrationSeed = await migrationContext.newPage();
  await migrationSeed.goto(
    `http://127.0.0.1:${server.address().port}/recuperar.html`,
  );
  const legacyId = await migrationSeed.evaluate(async () => {
    const e = await import("/src/engine.js");
    const game = e.createGame(
      ["A", "B", "C", "D", "E", "F", "G", "H"],
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
      { random: () => 0.99 },
    );
    game.schemaVersion = 1;
    delete game.editionId;
    delete game.scriptId;
    localStorage.setItem("grimorio.tb.game.v1", JSON.stringify(game));
    return game.id;
  });
  const [firstMigration, secondMigration] = await Promise.all([
    migrationContext.newPage(),
    migrationContext.newPage(),
  ]);
  await Promise.all([
    firstMigration.goto(`http://127.0.0.1:${server.address().port}/`),
    secondMigration.goto(`http://127.0.0.1:${server.address().port}/`),
  ]);
  const migratedIds = await Promise.all(
    [firstMigration, secondMigration].map((p) =>
      p.evaluate(
        async () =>
          (await (await import("/src/core/active-store.js")).openActiveStore())
            ?.id,
      ),
    ),
  );
  assert.deepEqual(
    migratedIds,
    [legacyId, legacyId],
    "Ambas pestañas deben recuperar la misma partida heredada.",
  );
  await migrationContext.close();
  console.log(
    "IndexedDB: 250 acciones, recarga, cuota, recuperación y deshacer/rehacer correctos.",
  );
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
}
