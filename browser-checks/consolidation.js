import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serve, seed, readBundle } from "./harness.js";
const host = await serve();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(host.url);
  await seed(page);
  await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      e = await import("/src/engine.js");
    const g = await s.openActiveStore();
    e.beginDay(g);
    await s.saveGame(g);
  });
  await page.reload();
  await page.goto(host.url + "?view=reveal#reveal");
  assert.equal(
    await page.getByRole("heading", { name: "Revelación final" }).count(),
    0,
    "No se permite revelación antes del final",
  );
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await page.locator('[data-action="timer-start"]').first().click();
  await page.getByRole("link", { name: "Grimorio", exact: true }).click();
  await page.locator("[data-player]").first().click();
  await page.locator("#edit-notes").fill("BORRADOR PRIVADO 123");
  // En Grimorio el reloj no se dibuja, pero sus ticks siguen activos.
  await page.waitForTimeout(2200);
  assert.equal(
    await page.locator("#player-dialog").evaluate((el) => el.open),
    true,
  );
  assert.equal(
    await page.locator("#edit-notes").inputValue(),
    "BORRADOR PRIVADO 123",
  );
  assert.equal(
    await page
      .locator("#edit-notes")
      .evaluate((el) => document.activeElement === el),
    true,
  );
  await page.waitForFunction(async () => {
    const db = await new Promise((ok) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => ok(r.result);
    });
    const result = await new Promise((ok) => {
      const r = db.transaction("drafts").objectStore("drafts").getAll();
      r.onsuccess = () => ok(r.result.length);
    });
    db.close();
    return result > 0;
  });
  await page.reload();
  await page.locator("#edit-notes").waitFor();
  assert.equal(
    await page.locator("#edit-notes").inputValue(),
    "BORRADOR PRIVADO 123",
  );
  await page.locator('#player-dialog button[value="cancel"]').last().click();
  // Aviso privado real mediante la validación de la corrección avanzada.
  await page.locator("[data-player]").first().click();
  await page
    .getByRole("button", { name: "Corrección avanzada", exact: true })
    .click();
  await page.locator("#toast").filter({ hasText: "motivo" }).waitFor();
  await page.locator('#player-dialog button[value="cancel"]').last().click();
  await page
    .getByRole("button", { name: "Plaza pública", exact: true })
    .click();
  assert.equal(await page.locator("#toast").isVisible(), false);
  assert.equal(await page.locator("#toast").textContent(), "");
  const publicText = await page.locator("body").innerText();
  assert.doesNotMatch(
    publicText,
    /BORRADOR PRIVADO|Señuelo|Equipo malvado|Corrección avanzada/,
  );
  await page.getByRole("button", { name: "Volver a pantalla privada" }).click();
  await page.locator("[data-player]").first().click();
  await page.locator("#edit-notes").fill("Borrador de revisión anterior");
  await page.waitForTimeout(100);
  await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      e = await import("/src/engine.js");
    const game = await s.openActiveStore();
    await s.commit(game, (d) =>
      e.addHistory(d, "Cambio posterior al borrador"),
    );
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Revisar borrador", exact: true })
    .waitFor();
  assert.equal(
    await page.locator("dialog[open]").count(),
    0,
    "Un borrador obsoleto no se aplica solo",
  );
  await page
    .getByRole("button", { name: "Revisar borrador", exact: true })
    .click();
  assert.equal(
    await page.locator("#edit-notes").inputValue(),
    "Borrador de revisión anterior",
  );
  assert.notEqual(
    (await readBundle(page)).game.players[0].notes,
    "Borrador de revisión anterior",
    "Revisar no confirma el borrador",
  );
  await page.locator('#player-dialog button[value="cancel"]').last().click();
  // Operaciones simultáneas en el mismo repositorio parten siempre del estado confirmado.
  const concurrency = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      e = await import("/src/engine.js");
    const game = await s.openActiveStore();
    await Promise.all([
      s.commit(game, (d) => e.addHistory(d, "Concurrente 1")),
      s.commit(game, (d) => e.addHistory(d, "Concurrente 2")),
    ]);
    const result = await s.openActiveStore();
    return result.history.slice(0, 2).map((item) => item.text);
  });
  assert.deepEqual(concurrency, ["Concurrente 2", "Concurrente 1"]);
  const serviceResults = await page.evaluate(async () => {
    const { createApplicationService } = await import(
      "/src/application/service.js"
    );
    const s = await import("/src/core/active-store.js");
    const app = createApplicationService();
    const actor = s.confirmedGame().players[0];
    const results = await Promise.allSettled([
      app.dispatch({
        type: "player.notes",
        playerId: actor.id,
        values: { notes: "Primera nota" },
      }),
      app.dispatch({
        type: "player.notes",
        playerId: actor.id,
        values: { notes: "Nota obsoleta" },
      }),
    ]);
    const text = s.confirmedGame().players[0].notes;
    await app.dispatch({
      type: "player.notes",
      playerId: actor.id,
      values: { notes: "Reintento explícito" },
    });
    return {
      states: results.map((r) => r.status),
      text,
      retry: s.confirmedGame().players[0].notes,
    };
  });
  assert.deepEqual(serviceResults.states, ["fulfilled", "rejected"]);
  assert.equal(serviceResults.text, "Primera nota");
  assert.equal(serviceResults.retry, "Reintento explícito");
  const cancellation = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      { createApplicationService } = await import(
        "/src/application/service.js"
      );
    const before = s.confirmedGame(),
      revision = s.currentRevision(),
      demon = before.players.find((p) => p.character === "imp");
    const app = createApplicationService({ confirmOutcome: () => false });
    let code;
    try {
      await app.dispatch({
        type: "player.resolve",
        playerId: demon.id,
        values: { ...demon, alive: false },
        cause: "other",
      });
    } catch (error) {
      code = error.code;
    }
    return {
      code,
      unchanged: JSON.stringify(s.confirmedGame()) === JSON.stringify(before),
      sameRevision: revision === s.currentRevision(),
    };
  });
  assert.equal(cancellation.code, "CANCELLED");
  assert.equal(cancellation.unchanged, true);
  assert.equal(cancellation.sameRevision, true);
  const damaged = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    await s.openActiveStore();
    const db = await new Promise((ok) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => ok(r.result);
    });
    await new Promise((ok, fail) => {
      const tx = db.transaction("state", "readwrite"),
        store = tx.objectStore("state"),
        r = store.get("active");
      r.onsuccess = () => {
        const bundle = r.result;
        const bad = structuredClone(bundle.game);
        bad.history[0].text = 123;
        bundle.undo = [bad];
        store.put(bundle, "active");
      };
      tx.oncomplete = ok;
      tx.onerror = () => fail(tx.error);
    });
    db.close();
    await s.openActiveStore();
    return {
      warnings: s.repositoryWarnings().length,
      undo: s.canUndo(),
      id: s.confirmedGame().id,
    };
  });
  assert.equal(damaged.warnings, 1);
  assert.equal(damaged.undo, false);
  assert.ok(damaged.id);
  await context.close();
  // Corrupción de partida activa: preservar el original, permitir importar con rescate.
  const corrupt = await browser.newContext();
  const broken = await corrupt.newPage();
  await broken.goto(host.url);
  await seed(broken);
  await broken.reload();
  const original = await broken.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    const good = await s.openActiveStore();
    const db = await new Promise((ok) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => ok(r.result);
    });
    await new Promise((ok, fail) => {
      const tx = db.transaction("state", "readwrite"),
        store = tx.objectStore("state"),
        r = store.get("active");
      r.onsuccess = () => {
        const b = r.result;
        delete b.game.selectedRoles;
        store.put(b, "active");
      };
      tx.oncomplete = ok;
      tx.onerror = () => fail(tx.error);
    });
    db.close();
    return good;
  });
  await broken.reload();
  await broken
    .getByText("Partida activa dañada", { exact: false })
    .first()
    .waitFor();
  const raw = await readBundle(broken);
  assert.equal(raw.game.selectedRoles, undefined);
  broken.on("dialog", (d) => d.accept());
  await broken.getByRole("button", { name: "Partidas", exact: true }).click();
  await broken.locator("#import-file").setInputFiles({
    name: "rescate.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(original)),
  });
  await broken
    .getByText("Partida importada", { exact: false })
    .first()
    .waitFor();
  const recovered = await readBundle(broken);
  assert.equal(recovered.game.id, original.id);
  assert.equal(recovered.damaged[0].kind, "active_bundle");
  assert.equal(recovered.damaged[0].raw.game.selectedRoles, undefined);
  await broken.evaluate(async () => {
    const db = await new Promise((ok) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => ok(r.result);
    });
    await new Promise((ok) => {
      const tx = db.transaction("state", "readwrite"),
        store = tx.objectStore("state"),
        r = store.get("active");
      r.onsuccess = () => {
        const bundle = r.result;
        bundle.undo = { invalid: true };
        store.put(bundle, "active");
      };
      tx.oncomplete = ok;
    });
    db.close();
  });
  await broken.reload();
  await broken
    .getByText("Envoltura del almacén inválida", { exact: false })
    .first()
    .waitFor();
  assert.deepEqual((await readBundle(broken)).undo, { invalid: true });
  await broken.getByRole("button", { name: "Partidas", exact: true }).click();
  await broken.locator("#import-file").setInputFiles({
    name: "rescate.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(original)),
  });
  await broken
    .getByText("Partida importada", { exact: false })
    .first()
    .waitFor();
  assert.deepEqual((await readBundle(broken)).damaged[0].raw.undo, {
    invalid: true,
  });
  const falsyActive = await broken.evaluate(async (good) => {
    const s = await import("/src/core/active-store.js");
    const outcomes = [];
    for (const bad of [false, 0, "", undefined]) {
      const db = await new Promise((ok) => {
        const r = indexedDB.open("grimorio-base3-active");
        r.onsuccess = () => ok(r.result);
      });
      await new Promise((ok) => {
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put(
          {
            game: bad,
            undo: [],
            redo: [],
            recovery: [],
            revision: s.currentRevision(),
          },
          "active",
        );
        tx.oncomplete = ok;
      });
      db.close();
      let rejected = false;
      try {
        await s.openActiveStore();
      } catch {
        rejected = true;
      }
      outcomes.push(rejected && s.repositoryWarnings()[0]?.raw.game === bad);
      await s.importGame(good);
    }
    return outcomes;
  }, original);
  assert.deepEqual(
    falsyActive,
    [true, true, true, true],
    "Los valores dañados no se confunden con una partida vacía",
  );
  await corrupt.close();
  const legacyContext = await browser.newContext(),
    legacyPage = await legacyContext.newPage();
  await legacyPage.goto(host.url + "recuperar.html");
  const legacyId = await legacyPage.evaluate(async () => {
    const e = await import("/src/engine.js");
    const good = e.createGame(
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
    const db = await new Promise((ok, fail) => {
      const r = indexedDB.open("grimorio-base3-active", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("state");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    await new Promise((ok) => {
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put(
        { game: good, undo: [], redo: [], recovery: [], revision: 0 },
        "active",
      );
      tx.oncomplete = ok;
    });
    window.legacyConnection = db;
    return good.id;
  });
  const upgrading = await legacyContext.newPage();
  await upgrading.goto(host.url);
  await upgrading
    .getByText("Cierra las otras pestañas", { exact: false })
    .first()
    .waitFor();
  await legacyPage.evaluate(() => window.legacyConnection.close());
  await upgrading.reload();
  await upgrading
    .getByRole("heading", { name: "Coloca las fichas." })
    .waitFor();
  assert.equal((await readBundle(upgrading)).game.id, legacyId);
  await legacyContext.close();
  const noDraftSpace = await browser.newContext();
  await noDraftSpace.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "drafts")
        throw new DOMException(
          "Cuota de borrador simulada",
          "QuotaExceededError",
        );
      return original.apply(this, args);
    };
  });
  const draftPage = await noDraftSpace.newPage();
  await draftPage.goto(host.url);
  await seed(draftPage);
  await draftPage.reload();
  await draftPage.getByRole("link", { name: "Grimorio", exact: true }).click();
  await draftPage.locator("[data-player]").first().click();
  await draftPage
    .locator("#edit-notes")
    .fill("Nota conservada sin espacio para borradores");
  await draftPage
    .getByText("No se pudo guardar el borrador", { exact: false })
    .first()
    .waitFor();
  assert.equal(
    await draftPage.locator("#edit-notes").inputValue(),
    "Nota conservada sin espacio para borradores",
  );
  await draftPage
    .getByRole("button", { name: "Guardar notas", exact: true })
    .click();
  await draftPage.getByText("Jugador actualizado", { exact: true }).waitFor();
  assert.equal(
    (await readBundle(draftPage)).game.players[0].notes,
    "Nota conservada sin espacio para borradores",
  );
  await noDraftSpace.close();
  assert.deepEqual(errors, []);
  console.log(
    "Consolidación: reloj, borradores, privacidad, comandos simultáneos y rescate de datos corruptos correctos.",
  );
} finally {
  if (browser) await browser.close();
  await host.close();
}
